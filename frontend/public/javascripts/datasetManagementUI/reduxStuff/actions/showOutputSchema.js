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
  ADD_COLUMN,
  DROP_COLUMN,
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
import { subscribeToOutputSchema, subscribeToTransforms } from 'reduxStuff/actions/subscriptions';
import { makeNormalizedCreateOutputSchemaResponse } from 'lib/jsonDecoders';
import { getUniqueName, getUniqueFieldName } from 'lib/util';

export const CREATE_NEW_OUTPUT_SCHEMA_SUCCESS = 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS';

function createNewOutputSchema(inputSchemaId, desiredColumns, call) {
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

        const payload = makeNormalizedCreateOutputSchemaResponse(os, inputSchema.totalRows);
        dispatch(createNewOutputSchemaSuccess(payload));
        dispatch(subscribeToOutputSchema(os));
        dispatch(subscribeToTransforms(os));

        return resp;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        throw err;
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
  return browserHistory.push(Links.showOutputSchema(params, source.id, inputSchema.id, outputSchemaId));
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

export const addColumn = (outputSchema, outputColumn) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: ADD_COLUMN,
    callParams: {
      outputSchemaId: outputSchema.id,
      outputColumnId: outputColumn.id
    }
  };

  // check for clashes with existing columns
  const current = Selectors.columnsForOutputSchema(entities, outputSchema.id);

  const { existingFieldNames, existingDisplayNames } = current.reduce(
    (acc, oc) => {
      return {
        existingFieldNames: [...acc.existingFieldNames, oc.field_name],
        existingDisplayNames: [...acc.existingDisplayNames, oc.display_name]
      };
    },
    { existingFieldNames: [], existingDisplayNames: [] }
  );

  const newOutputColumn = {
    ...outputColumn,
    field_name: getUniqueFieldName(existingFieldNames, outputColumn.field_name),
    display_name: getUniqueName(existingDisplayNames, outputColumn.display_name)
  };

  const newOutputColumns = [...current, _.omit(newOutputColumn, 'ignored')].map(oc =>
    buildNewOutputColumn(oc, sameTransform(entities))
  );

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
  const { current } = Selectors.currentAndIgnoredOutputColumns(entities, outputSchema.id);

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

export function buildNewOutputColumn(outputColumn, genTransform) {
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

export function cloneOutputColumn(outputColumn) {
  return buildNewOutputColumn(outputColumn, oc => oc.transform.transform_expr);
}

function sameTransform(entities) {
  return column => entities.transforms[column.transform_id].transform_expr;
}

export function outputColumnsWithChangedType(entities, oldOutputSchema, oldColumn, newType) {
  const oldOutputColumns = Selectors.columnsForOutputSchema(entities, oldOutputSchema.id);
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
    const conversionFunc = soqlProperties[inputColumn.soql_type].conversions[newType];
    const fieldName = inputColumn.field_name;

    return inputColumn.soql_type === newType ? `\`${fieldName}\`` : `${conversionFunc}(${fieldName})`;
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
      callParams: { outputSchemaId }
    };

    const callId = uuid();

    dispatch(apiCallStarted(callId, call));
    const url = dsmapiLinks.revisionBase({ revisionSeq: revision.revision_seq });
    return socrataFetch(url, {
      method: 'PUT',
      body: JSON.stringify({
        ...revision,
        output_schema_id: outputSchemaId
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(() => {
        dispatch(apiCallSucceeded(callId));
        dispatch(
          editRevision(revision.id, {
            output_schema_id: outputSchemaId
          })
        );
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}
