import _ from 'lodash';
import { push } from 'react-router-redux';
import * as dsmapiLinks from 'dsmapiLinks';
import * as Links from 'links';
import {
  batch,
  revertEdits,
  upsertStarted,
  upsertSucceeded,
  upsertFailed,
  updateImmutableStarted
} from 'actions/database';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import {
  insertChildrenAndSubscribeToOutputSchema
} from 'actions/manageUploads';
import { soqlProperties } from 'lib/soqlTypes';
import { currentAndIgnoredOutputColumns } from 'selectors';
import { getUniqueName, getUniqueFieldName } from 'lib/util';

function createNewOutputSchema(
  routing,
  dispatch,
  upload,
  oldOutputSchema,
  newOutputSchema,
  newOutputColumns,
  oldColumn
) {
  const uri = dsmapiLinks.newOutputSchema(upload.id, oldOutputSchema.input_schema_id);
  socrataFetch(uri, {
    method: 'POST',
    body: JSON.stringify({ output_columns: newOutputColumns })
  }).
    then(checkStatus).
    then(getJson).
    then(resp => {
      dispatch(batch(_.concat([
        upsertSucceeded('output_schemas', newOutputSchema, { id: resp.resource.id })
      ], oldColumn ? revertEdits('output_columns', oldColumn.id) : [])));

      insertChildrenAndSubscribeToOutputSchema(dispatch, upload, resp.resource);

      dispatch(push(
        Links.showOutputSchema(upload.id, oldOutputSchema.input_schema_id, resp.resource.id)(routing)
      ));
    }).
    catch((err) => {
      console.error('Failed to update schema!', err, err.stack);
      dispatch(upsertFailed('output_schemas', newOutputSchema, err));
    });
}

export const updateColumnType = (oldOutputSchema, oldColumn, newType) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const routing = state.routing.location;
  const inputSchema = db.input_schemas[oldOutputSchema.input_schema_id];
  const uploadId = inputSchema.upload_id;
  const upload = db.uploads[uploadId];

  const { newOutputSchema, newOutputColumns } =
    getNewOutputSchemaAndColumns(db, oldOutputSchema, oldColumn, newType);

  dispatch(batch([
    upsertStarted('output_schemas', newOutputSchema),
    updateImmutableStarted('output_columns', oldColumn.id)
  ]));

  createNewOutputSchema(
    routing,
    dispatch,
    upload,
    oldOutputSchema,
    newOutputSchema,
    newOutputColumns,
    oldColumn
  );
};

export const addColumn = (outputSchema, outputColumn) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const routing = state.routing.location;
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const uploadId = inputSchema.upload_id;
  const upload = db.uploads[uploadId];
  const { current } = currentAndIgnoredOutputColumns(db);

  const newOutputSchema = {
    input_schema_id: inputSchema.id
  };

  // check for clashes with existing columns
  const { existingFieldNames, existingDisplayNames } = current.reduce((acc, oc) => {
    return {
      existingFieldNames: [...acc.existingFieldNames, oc.field_name],
      existingDisplayNames: [...acc.existingDisplayNames, oc.display_name]
    };
  }, { existingFieldNames: [], existingDisplayNames: [] });

  const newOutputColumn = {
    ...outputColumn,
    field_name: getUniqueFieldName(existingFieldNames, outputColumn.field_name),
    display_name: getUniqueName(existingDisplayNames, outputColumn.display_name)
  };

  const newOutputColumns = [...current, _.omit(newOutputColumn, 'ignored')];

  dispatch(upsertStarted('output_schemas', newOutputSchema));

  createNewOutputSchema(
    routing,
    dispatch,
    upload,
    outputSchema,
    newOutputSchema,
    newOutputColumns
  );
};

export const dropColumn = (outputSchema, column) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const routing = state.routing.location;
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const uploadId = inputSchema.upload_id;
  const upload = db.uploads[uploadId];
  const { current } = currentAndIgnoredOutputColumns(db);

  const newOutputSchema = {
    input_schema_id: inputSchema.id
  };

  const newOutputColumns = current.filter(oc => oc.id !== column.id);

  dispatch(upsertStarted('output_schemas', newOutputSchema));

  createNewOutputSchema(
    routing,
    dispatch,
    upload,
    outputSchema,
    newOutputSchema,
    newOutputColumns
  );
};

function outputColumnsOf(db, outputSchema) {
  return _.filter(db.output_schema_columns, { output_schema_id: outputSchema.id }).
            map(sc => sc.output_column_id).
            map(id => db.output_columns[id]);
}

function toNewOutputColumn(outputColumn, genTransform) {
  return {
    field_name: outputColumn.field_name,
    position: outputColumn.position,
    display_name: outputColumn.display_name,
    description: outputColumn.description,
    transform: {
      transform_expr: genTransform(outputColumn)
    }
  };
}

export function getNewOutputSchemaAndColumns(db, oldOutputSchema, oldColumn, newType) {
  const newOutputSchema = {
    input_schema_id: oldOutputSchema.input_schema_id
  };

  const oldOutputColumns = outputColumnsOf(db, oldOutputSchema);
  const oldOutputColIds = oldOutputColumns.map(oc => oc.id);
  // Input columns are presently always text.  This will eventually
  // change, and then we'll need the input column here instead of
  // just hardcoding a comparison to text.
  const genTransform = (outputColumn) => {
    const transform = db.transforms[outputColumn.transform_id];
    const transformExpr = transform.transform_expr;
    const inputColumns = transform.transform_input_columns.map((inputColumnRef) => (
      db.input_columns[inputColumnRef.input_column_id]
    ));
    if (inputColumns.length !== 1) {
      console.error(
        'expected transform', transform.id, 'to have 1 input column; has', inputColumns.length
      );
    }
    return (outputColumn.id === oldColumn.id) ?
      `to_${soqlProperties[newType].canonicalName}(${inputColumns[0].field_name})` :
      transformExpr;
  };
  const newOutputColumns = oldOutputColumns.map((c) => (
    toNewOutputColumn(c, genTransform)
  ));

  return {
    newOutputSchema,
    newOutputColumns,
    oldOutputColIds
  };
}
