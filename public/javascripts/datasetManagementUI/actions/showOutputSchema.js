import _ from 'lodash';
import { push } from 'react-router-redux';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';
import {
  batch,
  insertStarted,
  insertSucceeded,
  insertFailed,
  updateFromServer,
  insertFromServerWithPk,
  insertFromServerIfNotExists
} from './database';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  createTableAndSubscribeToTransform
} from './manageUploads';
import { soqlProperties } from '../lib/soqlTypes';

export function updateColumnType(oldSchema, oldColumn, newType) {
  return (dispatch, getState) => {
    const state = getState();
    const db = state.db;
    const routing = state.routing;

    const { newOutputSchema, newOutputColumns, oldOutputColIds } =
      getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType);

    dispatch(insertStarted('output_schemas', newOutputSchema));

    // Make "fetch" happen.
    socrataFetch(dsmapiLinks.updateSchema(oldSchema.input_schema_id), {
      method: 'POST',
      body: JSON.stringify({ output_columns: newOutputColumns })
    }).
      then(checkStatus).
      then(getJson).
      then(resp => {
        const actions = updateActions(
          db.input_schemas, routing, oldSchema, newOutputSchema, oldOutputColIds, resp
        );

        actions.forEach((action) => {
          dispatch(action);
        });
      }).
      catch((err) => {
        console.error('Failed to update schema!', err);
        dispatch(insertFailed('output_schemas', newOutputSchema, err));
      });
  };
}

export function getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType) {
  const newOutputSchema = {
    input_schema_id: oldSchema.input_schema_id
  };

  const oldOutputColIds = _.filter(db.output_schema_columns, { output_schema_id: oldSchema.id }).
                          map(sc => sc.column_id);
  const oldOutputColumns = oldOutputColIds.map(id => _.find(db.columns, { id: id }));
  const newOutputColumns = oldOutputColumns.map((column) => {
    const xform = _.find(db.transforms, { output_column_id: column.id });
    const xformExpr = xform.transform_expr;

    // Input columns are presently always text.  This will eventually
    // change, and then we'll need the input column here instead of
    // just hardcoding a comparison to text.
    const transformExpr = (column.id === oldColumn.id) ?
      `to_${soqlProperties[newType].canonicalName}(${column.schema_column_name})` :
      xformExpr;

    return {
      schema_column_name: column.schema_column_name,
      schema_column_index: column.schema_column_index,
      display_name: column.display_name,
      transform_to: {
        transform_expr: transformExpr
      }
    };
  });

  return {
    newOutputSchema,
    newOutputColumns,
    oldOutputColIds
  };
}

// Helper function to handle responses from the backend.
export function updateActions(inputSchemas, routing, oldSchema, newSchema, oldColIds, resp) {
  const actions = [];

  const respSchema = resp.resource;
  const newOutputColumn = respSchema.output_columns.find((respOutputCol) => (
    !oldColIds.includes(respOutputCol.id)
  ));
  actions.push(insertSucceeded('output_schemas', newSchema, { id: respSchema.id }));
  // insert columns
  actions.push(insertFromServerIfNotExists('columns', _.omit(newOutputColumn, ['transform_to'])));
  // insert schema_columns
  const newSchemaColumnInserts = respSchema.output_columns.map((respOutputCol) => (
    insertFromServerIfNotExists('output_schema_columns', {
      output_schema_id: respSchema.id,
      column_id: respOutputCol.id
    })
  ));
  actions.push(batch(newSchemaColumnInserts)); // TODO: Replace with a proper batched output.
  // insert transform and transform input columns
  const transform = newOutputColumn.transform_to;
  actions.push(insertFromServerIfNotExists('transforms', {
    ..._.omit(transform, ['transform_input_columns']),
    input_column_ids: transform.transform_input_columns.map((inCol) => inCol.column_id)
  }));
  // start fetching new data
  actions.push(createTableAndSubscribeToTransform(transform, newOutputColumn));
  // redirect to new page
  const uploadId = _.find(inputSchemas, { id: oldSchema.input_schema_id }).upload_id;
  const newOutputSchemaPath = Links.showOutputSchema(
    uploadId, oldSchema.input_schema_id, respSchema.id
  )(routing);
  actions.push(push(newOutputSchemaPath));

  return actions;
}


export function loadErrorTable(nextState) {
  const { inputSchemaId, outputSchemaId, errorsColumnId } = nextState.params;
  return (dispatch) => {
    const limit = 50;
    const fetchOffset = 0;
    const path = dsmapiLinks.errorTable(
      inputSchemaId, outputSchemaId, errorsColumnId, limit, fetchOffset
    );
    socrataFetch(path).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const outputSchema = resp[0];
        const withoutSchemaRow = resp.slice(1);
        const newRecordsByColumn = [];
        _.range(outputSchema.output_columns.length).forEach(() => {
          newRecordsByColumn.push({});
        });
        withoutSchemaRow.forEach(({ row, offset }) => {
          if (_.isArray(row)) { // as opposed to row errors, which are not
            row.forEach((colResult, colIdx) => {
              newRecordsByColumn[colIdx][offset] = colResult;
            });
          }
        });
        dispatch(batch(newRecordsByColumn.map((newRecords, idx) => {
          const theColumnId = outputSchema.output_columns[idx].id;
          return insertFromServerWithPk(`column_${theColumnId}`, newRecords);
        })));
        dispatch(batch(newRecordsByColumn.map((newRecords, idx) => {
          const theColumnId = outputSchema.output_columns[idx].id;
          const errorIndices = _.map(newRecords,
            (newRecord, index) => ({
              ...newRecord,
              index
            })).
            filter((newRecord) => newRecord.error).
            map((newRecord) => newRecord.index);
          // TODO: how to make this a set which gets merged when we update?
          // maybe update should just take a primary key and a function
          // that would be SQL-like
          // not supposed to have functions in actions though
          // boo
          return updateFromServer('columns', {
            id: theColumnId,
            error_indices: errorIndices
          });
        })));
      }).
      catch((error) => {
        // TODO: maybe add a notification
        console.error('failed to load error table', error);
      });
  };
}
