import _ from 'lodash';
import uuid from 'uuid';
import * as dsmapiLinks from 'links/dsmapiLinks';
import * as Links from 'links/links';
import { browserHistory } from 'react-router';
import { socrataFetch, checkStatus, getJson, getError } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  DROP_COLUMN,
  ADD_COLUMN,
  SET_ROW_IDENTIFIER,
  UPDATE_COLUMN_TYPE,
  NEW_OUTPUT_SCHEMA,
  VALIDATE_ROW_IDENTIFIER,
  SAVE_CURRENT_OUTPUT_SCHEMA
} from 'reduxStuff/actions/apiCalls';
import { editRevision } from 'reduxStuff/actions/revisions';
import { soqlProperties } from 'lib/soqlTypes';
import * as Selectors from 'selectors';
import { showModal } from 'reduxStuff/actions/modal';
import * as FormActions from 'reduxStuff/actions/forms';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import { subscribeToOutputSchema, subscribeToTransforms } from 'reduxStuff/actions/subscriptions';
import { makeNormalizedCreateOutputSchemaResponse } from 'lib/jsonDecoders';
import { validateFieldName, validateDisplayName } from 'containers/AddColFormContainer';

export const CREATE_NEW_OUTPUT_SCHEMA_SUCCESS = 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS';

export function createNewOutputSchema(inputSchemaId, desiredColumns, call) {
  return (dispatch, getState) => {
    const callId = uuid();

    dispatch(apiCallStarted(callId, call));

    const { entities } = getState();

    const inputSchema = entities.input_schemas[inputSchemaId];

    const source = Selectors.sourceFromInputSchema(entities, inputSchemaId);

    const url = dsmapiLinks.newOutputSchema(source.id, inputSchemaId);

    return socrataFetch(url, {
      method: 'POST',
      body: JSON.stringify({ output_columns: desiredColumns })
    })
      .then(checkStatus)
      .then(getJson)
      .catch(getError)
      .then(resp => {
        const { resource: os } = resp;
        dispatch(apiCallSucceeded(callId));

        const payload = makeNormalizedCreateOutputSchemaResponse(os, inputSchema.total_rows);
        dispatch(createNewOutputSchemaSuccess(payload));
        dispatch(subscribeToOutputSchema(os));
        dispatch(subscribeToTransforms(os));

        return resp;
      });
  };
}

export function createNewOutputSchemaSuccess(payload) {
  return {
    type: CREATE_NEW_OUTPUT_SCHEMA_SUCCESS,
    ...payload
  };
}

export const redirectToOutputSchema = (params, outputSchemaId) => (dispatch, getState) => {
  const { entities } = getState();
  const { source, inputSchema } = Selectors.treeForOutputSchema(entities, outputSchemaId);
  const to = Links.showOutputSchema(params, source.id, inputSchema.id, outputSchemaId);
  return browserHistory.push(to);
};

export const newOutputSchema = (inputSchemaId, desiredColumns) => dispatch => {
  const call = {
    operation: NEW_OUTPUT_SCHEMA,
    callParams: {}
  };

  return dispatch(createNewOutputSchema(inputSchemaId, desiredColumns, call));
};

export const updateColumnType = (outputSchema, oldColumn, newType) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: UPDATE_COLUMN_TYPE,
    callParams: {
      outputSchemaId: outputSchema.id,
      outputColumnId: oldColumn.id
    }
  };

  const newOutputColumns = outputColumnsWithChangedType(entities, outputSchema, oldColumn, newType);

  return dispatch(createNewOutputSchema(outputSchema.input_schema_id, newOutputColumns, call));
};

export const dropColumn = (outputSchema, column) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: DROP_COLUMN,
    callParams: {
      outputSchemaId: outputSchema.id,
      outputColumnId: column.id
    }
  };

  const current = Selectors.columnsForOutputSchema(entities, outputSchema.id);

  const newOutputColumns = current
    .filter(oc => oc.id !== column.id)
    .map(oc => buildNewOutputColumn(oc, sameTransform(entities)));

  return dispatch(createNewOutputSchema(outputSchema.input_schema_id, newOutputColumns, call));
};

export const setRowIdentifier = (outputSchema, outputColumnToSet) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: SET_ROW_IDENTIFIER,
    callParams: { outputSchema, outputColumnToSet }
  };

  const newOutputColumns = Selectors.columnsForOutputSchema(entities, outputSchema.id)
    .map(outputColumn => ({
      ...outputColumn,
      is_primary_key: outputColumn.id === outputColumnToSet.id
    }))
    .map(oc => buildNewOutputColumn(oc, sameTransform(entities)));

  return dispatch(createNewOutputSchema(outputSchema.input_schema_id, newOutputColumns, call));
};

export const unsetRowIdentifier = outputSchema => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: SET_ROW_IDENTIFIER,
    callParams: { outputSchema }
  };

  const newOutputColumns = Selectors.columnsForOutputSchema(entities, outputSchema.id)
    .map(outputColumn => ({
      ...outputColumn,
      is_primary_key: false
    }))
    .map(oc => buildNewOutputColumn(oc, sameTransform(entities)));

  return dispatch(createNewOutputSchema(outputSchema.input_schema_id, newOutputColumns, call));
};

export const moveColumnToPosition = (outputSchema, column, positionBaseOne) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: NEW_OUTPUT_SCHEMA,
    callParams: { outputSchema }
  };

  const allColumns = Selectors.columnsForOutputSchema(entities, outputSchema.id);
  const columns = allColumns.filter(oc => oc.id !== column.id);

  const positionBaseZero = Math.min(Math.max(0, positionBaseOne - 1), allColumns.length - 1);

  columns.splice(positionBaseZero, 0, column);

  const newOutputColumns = columns
    .map(oc => buildNewOutputColumn(oc, sameTransform(entities)))
    .map((oc, i) => ({ ...oc, position: i + 1 }));

  return dispatch(createNewOutputSchema(outputSchema.input_schema_id, newOutputColumns, call));
};

export function buildNewOutputColumn(outputColumn, genTransform) {
  return {
    field_name: outputColumn.field_name,
    position: outputColumn.position,
    display_name: outputColumn.display_name,
    description: outputColumn.description,
    transform: {
      transform_expr: genTransform(outputColumn)
    },
    is_primary_key: outputColumn.is_primary_key,
    format: outputColumn.format
  };
}

export function cloneOutputColumn(outputColumn) {
  return buildNewOutputColumn(outputColumn, oc => oc.transform.transform_expr);
}

function sameTransform(entities) {
  return column => entities.transforms[column.transform_id].transform_expr;
}

export function outputColumnsWithChangedType(entities, oldOutputSchema, oldColumn, newType) {
  const oldOutputColumns = Selectors.columnsForOutputSchema(entities, oldOutputSchema.id).map(oc => {
    // This was a lovely bug!
    // When changing the type of a primary key column, we need to make it a non-pk, because
    // type conversion could lead to duplicate or null values; in fact, this is true of any
    // transformation

    return oc.id === oldColumn.id ? { ...oc, is_primary_key: false } : oc;
  });

  // Input columns are presently always text.  This will eventually
  // change, and then we'll need the input column here instead of
  // just hardcoding a comparison to text.
  const genTransform = outputColumn => {
    const transform = entities.transforms[outputColumn.transform_id];
    const transformExpr = transform.transform_expr;

    if (outputColumn.id !== oldColumn.id) {
      // user is not updating this column
      return transformExpr;
    }

    const inputColumns = transform.transform_input_columns.map(
      inputColumnRef => entities.input_columns[inputColumnRef.input_column_id]
    );
    if (inputColumns.length !== 1) {
      console.error('expected transform', transform.id, 'to have 1 input column; has', inputColumns.length);
    }
    const inputColumn = inputColumns[0];

    const conversionExpr = soqlProperties[inputColumn.soql_type].conversions[newType](inputColumn, entities);
    const fieldName = inputColumn.field_name;

    return inputColumn.soql_type === newType ? `\`${fieldName}\`` : conversionExpr;
  };
  return oldOutputColumns.map(c => buildNewOutputColumn(c, genTransform));
}

export const validateThenSetRowIdentifier = (outputSchema, outputColumn) => (dispatch, getState) => {
  const { source } = Selectors.pathForOutputSchema(getState().entities, outputSchema.id);
  const transformId = outputColumn.transform_id;
  const call = {
    operation: VALIDATE_ROW_IDENTIFIER,
    callParams: {
      outputSchemaId: outputSchema.id,
      outputColumnId: outputColumn.id
    }
  };
  const callId = uuid();

  dispatch(apiCallStarted(callId, call));
  const url = dsmapiLinks.validateRowIdentifier(source.id, transformId);
  return socrataFetch(url)
    .then(checkStatus)
    .then(getJson)
    .then(result => {
      dispatch(apiCallSucceeded(callId));
      if (!result.valid) {
        dispatch(showModal('RowIdentifierError', result));
      } else {
        return dispatch(setRowIdentifier(outputSchema, outputColumn));
      }
    })
    .catch(error => {
      dispatch(apiCallFailed(callId, error));
    });
};

export function saveCurrentOutputSchemaId(revision, outputSchemaId) {
  return dispatch => {
    const call = {
      operation: SAVE_CURRENT_OUTPUT_SCHEMA,
      callParams: { outputSchemaId, blobId: null }
    };

    const callId = uuid();

    dispatch(apiCallStarted(callId, call));
    const url = dsmapiLinks.revisionBase({ revisionSeq: revision.revision_seq });
    return socrataFetch(url, {
      method: 'PUT',
      body: JSON.stringify({
        ...revision,
        output_schema_id: outputSchemaId,
        blob_id: null
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(() => {
        dispatch(apiCallSucceeded(callId));
        dispatch(
          editRevision(revision.id, {
            output_schema_id: outputSchemaId,
            blob_id: null
          })
        );
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

function validateColForm(data, fieldNames, dispayNames) {
  return {
    fieldName: validateFieldName(data.fieldName, fieldNames),
    displayName: validateDisplayName(data.displayName, dispayNames)
  };
}

function getNames(entities, osid) {
  const columns = Selectors.columnsForOutputSchema(entities, osid);

  return {
    fieldNames: columns.map(col => col.field_name),
    displayNames: columns.map(col => col.display_name)
  };
}

function getPosition(entities, osid) {
  const columns = Selectors.columnsForOutputSchema(entities, osid);

  if (columns && Array.isArray(columns)) {
    return Math.max(...columns.map(col => col.position)) + 1;
  } else {
    return 1;
  }
}

export function snakeCase(colData) {
  return {
    field_name: colData.fieldName,
    display_name: colData.displayName,
    position: colData.position,
    description: colData.description,
    is_primary_key: false,
    format: null,
    transform: { transform_expr: colData.transformExpr }
  };
}

export function addCol(colData, params) {
  return (dispatch, getState) => {
    const { entities } = getState();

    const osid = _.toNumber(params.outputSchemaId);

    const { fieldNames, displayNames } = getNames(entities, osid);

    const validationErrors = validateColForm(colData, fieldNames, displayNames);

    dispatch(FormActions.setFormErrors('addColForm', validationErrors));

    if (validationErrors.fieldName.length || validationErrors.displayName.length) {
      dispatch(FlashActions.showFlashMessage('error', 'Failed to create column. Please see errors below.'));
      return Promise.reject();
    }

    const call = {
      operation: ADD_COLUMN,
      callParams: {
        outputSchemaId: osid
      }
    };

    const os = entities.output_schemas[osid];

    const newCol = snakeCase({
      ...colData,
      position: getPosition(entities, osid)
    });

    const currentCols = Selectors.columnsForOutputSchema(entities, osid);

    const newCols = [...currentCols, newCol];

    return dispatch(createNewOutputSchema(os.input_schema_id, newCols, call));
  };
}
