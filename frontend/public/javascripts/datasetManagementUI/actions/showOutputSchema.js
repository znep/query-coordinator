import _ from 'lodash';
import { push } from 'react-router-redux';
import * as dsmapiLinks from '../dsmapiLinks';
import * as Links from '../links';
import {
  batch,
  revertEdits,
  upsertStarted,
  upsertSucceeded,
  upsertFailed,
  updateImmutableStarted
} from './database';
import { socrataFetch, checkStatus, getJson } from '../lib/http';
import {
  insertChildrenAndSubscribeToOutputSchema
} from './manageUploads';
import { soqlProperties } from '../lib/soqlTypes';

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

export const addColumn = (outputSchema, inputColumn) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const routing = state.routing.location;
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const uploadId = inputSchema.upload_id;
  const upload = db.uploads[uploadId];

  const newOutputSchema = {
    input_schema_id: inputSchema.id
  };

  const xform = soqlProperties[inputColumn.soql_type].canonicalName;
  const newColumnExpr = `to_${xform}(${inputColumn.field_name})`;

  const genTransform = (column) => {
    const newXform = db.transforms[column.transform_id];
    return newXform.transform_expr;
  };
  const newOutputColumns = outputColumnsOf(db, outputSchema).
    map(oc => toNewOutputColumn(oc, genTransform)).
    concat([
      {
        display_name: inputColumn.field_name,
        field_name: inputColumn.field_name,
        position: inputColumn.position,
        description: '',
        transform: {
          transform_expr: newColumnExpr
        }
      }
    ]);

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

export const dropColumn = (outputSchema, toDrop) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const routing = state.routing.location;
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const uploadId = inputSchema.upload_id;
  const upload = db.uploads[uploadId];

  const newOutputSchema = {
    input_schema_id: inputSchema.id
  };
  const genTransform = (column) => {
    const { transform_expr: expr } = db.transforms[column.transform_id];
    return expr;
  };
  const newOutputColumns = outputColumnsOf(db, outputSchema)
    .filter(oc => oc.id !== toDrop.id)
    .map(oc => toNewOutputColumn(oc, genTransform));

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
  const genTransform = (column) => {
    const xform = db.transforms[column.transform_id];
    const xformExpr = xform.transform_expr;

    return (column.id === oldColumn.id) ?
    `to_${soqlProperties[newType].canonicalName}(${column.field_name})` :
    xformExpr;
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
