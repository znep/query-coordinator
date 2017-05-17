import { push } from 'react-router-redux';
import uuid from 'uuid';
import * as dsmapiLinks from 'dsmapiLinks';
import * as Links from 'links';
import {
  upsertStarted,
  upsertSucceeded,
  upsertFailed
} from 'actions/database';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  ADD_COLUMN,
  DROP_COLUMN,
  SET_ROW_IDENTIFIER,
  UPDATE_COLUMN_TYPE,
  VALIDATE_ROW_IDENTIFIER
} from 'actions/apiCalls';
import {
  insertChildrenAndSubscribeToOutputSchema
} from 'actions/manageUploads';
import { soqlProperties } from 'lib/soqlTypes';
import * as Selectors from 'selectors';
import { showModal } from 'actions/modal';
import { getUniqueName, getUniqueFieldName } from 'lib/util';

function createNewOutputSchema(
  oldOutputSchema,
  newOutputColumns,
  call
) {
  return (dispatch, getState) => {
    const callId = uuid();
    dispatch(apiCallStarted(callId, call));
    const routing = getState().routing.location;
    const db = getState().db;
    const { upload, inputSchema } = Selectors.pathForOutputSchema(db, oldOutputSchema.id);
    const newOutputSchema = {
      input_schema_id: inputSchema.id
    };
    // TODO: the upsertStarted/succeeded/failed lifecycle isn't doing anything for us here
    // that the loadStarted isn't. probably get rid of it
    dispatch(upsertStarted('output_schemas', newOutputSchema));
    const url = dsmapiLinks.newOutputSchema(upload.id, oldOutputSchema.input_schema_id);
    socrataFetch(url, {
      method: 'POST',
      body: JSON.stringify({ output_columns: newOutputColumns })
    }).
      then(checkStatus).
      then(getJson).
      then(resp => {
        dispatch(upsertSucceeded('output_schemas', newOutputSchema, { id: resp.resource.id }));
        dispatch(apiCallSucceeded(callId));

        insertChildrenAndSubscribeToOutputSchema(dispatch, resp.resource);

        dispatch(push(
          Links.showOutputSchema(upload.id, oldOutputSchema.input_schema_id, resp.resource.id)(routing)
        ));
      }).
      catch((err) => {
        dispatch(upsertFailed('output_schemas', newOutputSchema, err));
        dispatch(apiCallFailed(callId, err));
      });
  };
}

export const updateColumnType = (outputSchema, oldColumn, newType) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;
  const call = {
    operation: UPDATE_COLUMN_TYPE,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: oldColumn.id
    }
  };

  const newOutputColumns = outputColumnsWithChangedType(db, outputSchema, oldColumn, newType);

  dispatch(createNewOutputSchema(
    outputSchema,
    newOutputColumns,
    call
  ));
};

export const addColumn = (outputSchema, outputColumn) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;

  const call = {
    operation: ADD_COLUMN,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: outputColumn.id
    }
  };

  // check for clashes with existing columns
  const { current } = Selectors.currentAndIgnoredOutputColumns(db);
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

  const newOutputColumns = [...current, _.omit(newOutputColumn, 'ignored')].
    map(oc => toNewOutputColumn(oc, sameTransform(db)));

  dispatch(createNewOutputSchema(
    outputSchema,
    newOutputColumns,
    call
  ));
};

export const dropColumn = (outputSchema, column) => (dispatch, getState) => {
  const state = getState();
  const db = state.db;

  const call = {
    operation: DROP_COLUMN,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: column.id
    }
  };

  const { current } = Selectors.currentAndIgnoredOutputColumns(db);
  const newOutputColumns = current.
    filter(oc => oc.id !== column.id).
    map(oc => toNewOutputColumn(oc, sameTransform(db)));

  dispatch(createNewOutputSchema(
    outputSchema,
    newOutputColumns,
    call
  ));
};

export const setRowIdentifier = (outputSchema, outputColumnToSet) => (dispatch, getState) => {
  const db = getState().db;

  const call = {
    operation: SET_ROW_IDENTIFIER,
    params: { outputSchema, outputColumnToSet }
  };

  const newOutputColumns = Selectors.columnsForOutputSchema(db, outputSchema.id).
    map((outputColumn) => ({
      ...outputColumn,
      is_primary_key: outputColumn.id === outputColumnToSet.id
    })).
    map(oc => toNewOutputColumn(oc, sameTransform(db)));

  dispatch(createNewOutputSchema(
    outputSchema,
    newOutputColumns,
    call
  ));
};

function toNewOutputColumn(outputColumn, genTransform) {
  return {
    field_name: outputColumn.field_name,
    position: outputColumn.position,
    display_name: outputColumn.display_name,
    description: outputColumn.description,
    transform: {
      transform_expr: genTransform(outputColumn)
    },
    is_primary_key: outputColumn.is_primary_key
  };
}

function sameTransform(db) {
  return (column) => (
    db.transforms[column.transform_id].transform_expr
  );
}

export function outputColumnsWithChangedType(db, oldOutputSchema, oldColumn, newType) {
  const oldOutputColumns = Selectors.columnsForOutputSchema(db, oldOutputSchema.id);
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
    // This can only be called if the new type is a valid conversion target, so
    // conversionFunction will be defined.
    return (outputColumn.id === oldColumn.id) ?
      `${soqlProperties[newType].conversionFunction}(${inputColumns[0].field_name})` :
      transformExpr;
  };
  return oldOutputColumns.map((c) => (
    toNewOutputColumn(c, genTransform)
  ));
}

export function validateThenSetRowIdentifier(outputSchema, outputColumn) {
  return (dispatch, getState) => {
    const { upload } = Selectors.pathForOutputSchema(getState().db, outputSchema.id);
    const transformId = outputColumn.transform_id;
    const call = {
      operation: VALIDATE_ROW_IDENTIFIER,
      params: {
        outputSchemaId: outputSchema.id,
        outputColumnId: outputColumn.id
      }
    };
    const callId = uuid();

    dispatch(apiCallStarted(callId, call));
    const url = dsmapiLinks.validateRowIdentifier(upload.id, transformId);
    socrataFetch(url).
      then(checkStatus).
      then(getJson).
      then((result) => {
        dispatch(apiCallSucceeded(callId));
        if (!result.valid) {
          dispatch(showModal('RowIdentifierError', result));
        } else {
          dispatch(setRowIdentifier(outputSchema, outputColumn));
        }
      }).
      catch((error) => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}
