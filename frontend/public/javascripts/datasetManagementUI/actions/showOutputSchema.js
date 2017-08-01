import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import * as dsmapiLinks from 'dsmapiLinks';
import * as Links from 'links';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  ADD_COLUMN,
  DROP_COLUMN,
  SET_ROW_IDENTIFIER,
  UPDATE_COLUMN_TYPE,
  VALIDATE_ROW_IDENTIFIER,
  SAVE_CURRENT_OUTPUT_SCHEMA
} from 'actions/apiCalls';
import { editRevision } from 'actions/revisions';
import { soqlProperties } from 'lib/soqlTypes';
import * as Selectors from 'selectors';
import { showModal } from 'actions/modal';
import {
  listenForOutputSchemaSuccess,
  subscribeToOutputSchema,
  subscribeToTransforms
} from 'actions/manageUploads';
import { getUniqueName, getUniqueFieldName } from 'lib/util';

function createNewOutputSchema(oldOutputSchema, newOutputColumns, call) {
  return (dispatch, getState) => {
    const callId = uuid();

    dispatch(apiCallStarted(callId, call));

    const { entities, ui } = getState();

    const routing = ui.routing.location;

    const { source } = Selectors.pathForOutputSchema(entities, oldOutputSchema.id);

    const url = dsmapiLinks.newOutputSchema(source.id, oldOutputSchema.input_schema_id);

    return socrataFetch(url, {
      method: 'POST',
      body: JSON.stringify({ output_columns: newOutputColumns })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(apiCallSucceeded(callId));

        dispatch(listenForOutputSchemaSuccess(resp.resource));
        dispatch(subscribeToOutputSchema(resp.resource));
        dispatch(subscribeToTransforms(resp.resource));

        dispatch(
          push(Links.showOutputSchema(source.id, oldOutputSchema.input_schema_id, resp.resource.id)(routing))
        );
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}

export const updateColumnType = (outputSchema, oldColumn, newType) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: UPDATE_COLUMN_TYPE,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: oldColumn.id
    }
  };

  const newOutputColumns = outputColumnsWithChangedType(entities, outputSchema, oldColumn, newType);

  return dispatch(createNewOutputSchema(outputSchema, newOutputColumns, call));
};

export const addColumn = (outputSchema, outputColumn) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: ADD_COLUMN,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: outputColumn.id
    }
  };

  // check for clashes with existing columns
  const { current } = Selectors.currentAndIgnoredOutputColumns(entities);

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
    toNewOutputColumn(oc, sameTransform(entities))
  );

  return dispatch(createNewOutputSchema(outputSchema, newOutputColumns, call));
};

export const dropColumn = (outputSchema, column) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: DROP_COLUMN,
    params: {
      outputSchemaId: outputSchema.id,
      outputColumnId: column.id
    }
  };
  const { current } = Selectors.currentAndIgnoredOutputColumns(entities);

  const newOutputColumns = current
    .filter(oc => oc.id !== column.id)
    .map(oc => toNewOutputColumn(oc, sameTransform(entities)));

  return dispatch(createNewOutputSchema(outputSchema, newOutputColumns, call));
};

export const setRowIdentifier = (outputSchema, outputColumnToSet) => (dispatch, getState) => {
  const { entities } = getState();

  const call = {
    operation: SET_ROW_IDENTIFIER,
    params: { outputSchema, outputColumnToSet }
  };

  const newOutputColumns = Selectors.columnsForOutputSchema(entities, outputSchema.id)
    .map(outputColumn => ({
      ...outputColumn,
      is_primary_key: outputColumn.id === outputColumnToSet.id
    }))
    .map(oc => toNewOutputColumn(oc, sameTransform(entities)));

  dispatch(createNewOutputSchema(outputSchema, newOutputColumns, call));
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

    return inputColumn.soql_type === newType
      ? `\`${fieldName}\``
      : `${conversionFunc}(${fieldName})`;
  };
  return oldOutputColumns.map(c => toNewOutputColumn(c, genTransform));
}

export function validateThenSetRowIdentifier(outputSchema, outputColumn) {
  return (dispatch, getState) => {
    const { source } = Selectors.pathForOutputSchema(getState().entities, outputSchema.id);
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
    const url = dsmapiLinks.validateRowIdentifier(source.id, transformId);
    socrataFetch(url)
      .then(checkStatus)
      .then(getJson)
      .then(result => {
        dispatch(apiCallSucceeded(callId));
        if (!result.valid) {
          dispatch(showModal('RowIdentifierError', result));
        } else {
          dispatch(setRowIdentifier(outputSchema, outputColumn));
        }
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}

export function saveCurrentOutputSchemaId(revision, outputSchemaId) {
  return (dispatch) => {
    const call = {
      operation: SAVE_CURRENT_OUTPUT_SCHEMA,
      params: { outputSchemaId }
    };

    const callId = uuid();

    dispatch(apiCallStarted(callId, call));
    const url = dsmapiLinks.revisionBase;
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
        dispatch(editRevision(revision.id, {
          output_schema_id: outputSchemaId
        }));
      })
      .catch(error => {
        dispatch(apiCallFailed(callId, error));
      });
  };
}
