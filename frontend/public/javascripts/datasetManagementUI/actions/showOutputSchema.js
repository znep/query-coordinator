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

export function updateColumnType(oldSchema, oldColumn, newType) {
  return (dispatch, getState) => {
    const state = getState();
    const db = state.db;
    const routing = state.routing;
    const inputSchema = db.input_schemas[oldSchema.input_schema_id];
    const uploadId = inputSchema.upload_id;
    const upload = db.uploads[uploadId];

    const { newOutputSchema, newOutputColumns } =
      getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType);

    dispatch(batch([
      upsertStarted('output_schemas', newOutputSchema),
      updateImmutableStarted('output_columns', oldColumn.id)
    ]));

    socrataFetch(dsmapiLinks.newOutputSchema(uploadId, oldSchema.input_schema_id), {
      method: 'POST',
      body: JSON.stringify({ output_columns: newOutputColumns })
    }).
      then(checkStatus).
      then(getJson).
      then(resp => {
        dispatch(batch([
          upsertSucceeded('output_schemas', newOutputSchema, { id: resp.resource.id }),
          revertEdits('output_columns', oldColumn.id)
        ]));
        insertChildrenAndSubscribeToOutputSchema(dispatch, upload, resp.resource);

        dispatch(push(
          Links.showOutputSchema(uploadId, oldSchema.input_schema_id, resp.resource.id)(routing)
        ));
      }).
      catch((err) => {
        console.error('Failed to update schema!', err);
        dispatch(upsertFailed('output_schemas', newOutputSchema, err));
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
