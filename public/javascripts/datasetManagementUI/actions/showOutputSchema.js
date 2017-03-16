import _ from 'lodash';
import { push } from 'react-router-redux';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';
import {
  batch,
  revertEdits,
  insertStarted,
  insertSucceeded,
  insertFailed,
  updateFromServer,
  updateImmutableStarted,
  insertMultipleFromServer
} from './database';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  insertChildrenAndSubscribeToOutputSchema
} from './manageUploads';
import { soqlProperties } from '../lib/soqlTypes';

export function updateColumnType(oldSchema, oldColumn, newType) {
  return (dispatch, getState) => {
    const state = getState();
    const db = state.db;
    const routing = state.routing;

    const { newOutputSchema, newOutputColumns } =
      getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType);

    dispatch(batch([
      insertStarted('output_schemas', newOutputSchema),
      updateImmutableStarted('output_columns', oldColumn.id)
    ]));

    socrataFetch(dsmapiLinks.newOutputSchema(oldSchema.input_schema_id), {
      method: 'POST',
      body: JSON.stringify({ output_columns: newOutputColumns })
    }).
      then(checkStatus).
      then(getJson).
      then(resp => {
        dispatch(batch([
          insertSucceeded('output_schemas', newOutputSchema, { id: resp.resource.id }),
          revertEdits('output_columns', oldColumn.id)
        ]));
        insertChildrenAndSubscribeToOutputSchema(dispatch, resp.resource);

        const inputSchema = db.input_schemas[oldSchema.input_schema_id];
        const uploadId = inputSchema.upload_id;
        dispatch(push(
          Links.showOutputSchema(uploadId, oldSchema.input_schema_id, resp.resource.id)(routing)
        ));
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
                          map(sc => sc.output_column_id);
  const oldOutputColumns = oldOutputColIds.map(id => db.output_columns[id]);
  const newOutputColumns = oldOutputColumns.map((column) => {
    const xform = db.transforms[column.transform_id];
    const xformExpr = xform.transform_expr;

    // Input columns are presently always text.  This will eventually
    // change, and then we'll need the input column here instead of
    // just hardcoding a comparison to text.
    const transformExpr = (column.id === oldColumn.id) ?
      `to_${soqlProperties[newType].canonicalName}(${column.field_name})` :
      xformExpr;

    return {
      field_name: column.field_name,
      position: column.position,
      display_name: column.display_name,
      description: column.description,
      transform: {
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

export function loadColumnErrors(nextState) {
  const { inputSchemaId, outputSchemaId, errorsTransformId: errorsTransformIdStr } = nextState.params;
  const errorsTransformId = _.toNumber(errorsTransformIdStr);
  return (dispatch, getState) => {
    const limit = 50;
    const fetchOffset = 0;
    const errorsColumnId = _.find(getState().db.output_columns, { transform_id: errorsTransformId }).id;
    const path = dsmapiLinks.errorTable(
      inputSchemaId, outputSchemaId, errorsColumnId, limit, fetchOffset
    );
    socrataFetch(path).
      then(checkStatus).
      then(getJson).
      then((resp) => {
        const outputSchema = resp[0];
        const withoutSchemaRow = resp.slice(1);
        const newRecordsByTransform = [];
        _.range(outputSchema.output_columns.length).forEach(() => {
          newRecordsByTransform.push({});
        });
        withoutSchemaRow.forEach(({ row, offset }) => {
          if (_.isArray(row)) { // as opposed to row errors, which are not
            row.forEach((colResult, colIdx) => {
              newRecordsByTransform[colIdx][offset] = colResult;
            });
          }
        });
        dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
          const theTransformId = outputSchema.output_columns[idx].transform.id;
          return insertMultipleFromServer(`transform_${theTransformId}`, newRecords, {
            ifNotExists: true
          });
        })));
        dispatch(batch(newRecordsByTransform.map((newRecords, idx) => {
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
          const transform = outputSchema.output_columns[idx].transform;
          return updateFromServer('transforms', {
            id: transform.id,
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


export function loadRowErrors() {
  return () => {
    console.log('TODO: actually load row errors');
  };
}
