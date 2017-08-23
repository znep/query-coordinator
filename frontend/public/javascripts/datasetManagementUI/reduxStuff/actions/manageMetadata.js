import _ from 'lodash';
import { browserHistory } from 'react-router';
import uuid from 'uuid';
import * as Links from 'links';
import { checkStatus, getJson, socrataFetch } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  SAVE_COLUMN_METADATA,
  SAVE_DATASET_METADATA
} from 'reduxStuff/actions/apiCalls';
import * as Selectors from 'selectors';
import * as dsmapiLinks from 'dsmapiLinks';
import { showFlashMessage, hideFlashMessage } from 'reduxStuff/actions/flashMessage';
import { getLocalizedErrorMessage } from 'lib/util';
import {
  listenForOutputSchemaSuccess,
  subscribeToOutputSchema,
  subscribeToTransforms
} from 'reduxStuff/actions/manageUploads';
import { editRevision } from 'reduxStuff/actions/revisions';
import { editView } from 'reduxStuff/actions/views';
import { showFormErrors, hideFormErrors, markFormClean } from 'reduxStuff/actions/forms';

export const dismissMetadataPane = (currentOutputSchemaPath, params) => (dispatch, getState) => {
  const { history } = getState().ui;
  const isDatasetModalPath = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/manage\/revisions\/\d+\/metadata.*/; // eslint-disable-line
  const isBigTablePage = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/manage\/revisions\/\d+\/sources\/\d+\/schemas\/\d+\/output\/\d+/; // eslint-disable-line

  const helper = hist => {
    const location = hist[hist.length - 1];

    if (hist.length === 0) {
      browserHistory.push(Links.revisionBase(params));
    } else if (currentOutputSchemaPath && isBigTablePage.test(location.pathname)) {
      browserHistory.push(currentOutputSchemaPath);
    } else if (isDatasetModalPath.test(location.pathname)) {
      helper(hist.slice(0, -1));
    } else {
      browserHistory.push(location.pathname);
    }
  };

  helper(history);
};

export const saveDatasetMetadata = (revision, params) => (dispatch, getState) => {
  const { ui } = getState();
  const formName = 'datasetForm';
  const { errors } = ui.forms[formName];

  dispatch(hideFlashMessage());

  if (errors.length) {
    dispatch(showFormErrors(formName));
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));
    return Promise.reject();
  }

  const datasetMetadata = Selectors.datasetMetadata(revision.metadata);

  const callId = uuid();

  dispatch(
    apiCallStarted(callId, {
      operation: SAVE_DATASET_METADATA,
      params: {}
    })
  );

  // TODO: remove core api call (the first one here) once validations go into
  // dsmapi and once dsmapi revisions start overriding what's in core
  return socrataFetch(`/api/views/${params.fourfour}`, {
    method: 'PUT',
    body: JSON.stringify(datasetMetadata)
  })
    .then(checkStatus)
    .then(() => {
      return socrataFetch(dsmapiLinks.revisionBase(params), {
        method: 'PUT',
        body: JSON.stringify({
          metadata: datasetMetadata
        })
      });
    })
    .then(checkStatus)
    .then(getJson)
    .then(dsmapiResp => {
      const dsmapi = dsmapiResp.resource;

      if (!dsmapi.metadata) {
        throw new Error('No metadata in api response');
      }

      dispatch(
        editView(dsmapi.fourfour, {
          ..._.omit(dsmapi.metadata, 'metadata', 'privateMetadata'),
          metadata: dsmapi.metadata.metadata,
          privateMetadata: dsmapi.metadata.privateMetadata,
          metadataLastUpdatedAt: Date.now()
        })
      );

      dispatch(
        editRevision(revision.id, {
          metadata: dsmapi.metadata
        })
      );

      dispatch(hideFormErrors(formName));
      dispatch(markFormClean(formName));
      dispatch(apiCallSucceeded(callId));
      dispatch(showFlashMessage('success', I18n.edit_metadata.save_success, 3500));
    })
    .catch(error => {
      dispatch(apiCallFailed(callId, error));

      error.response.json().then(({ message }) => {
        const localizedMessage = getLocalizedErrorMessage(message);
        dispatch(showFlashMessage('error', localizedMessage));
      });
    });
};

export const saveColumnMetadata = (outputSchemaId, params) => (dispatch, getState) => {
  const { entities, ui } = getState();
  const formName = 'columnForm';
  const { errors } = ui.forms[formName];

  dispatch(hideFlashMessage());

  if (errors.length) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));

    dispatch(showFormErrors(formName));

    return Promise.reject();
  }

  const currentOutputSchema = entities.output_schemas[outputSchemaId];

  if (!currentOutputSchema) {
    return Promise.reject();
  }

  const payload = {
    output_columns: Selectors.columnsForOutputSchema(entities, currentOutputSchema.id)
  };

  const inputSchema = entities.input_schemas[currentOutputSchema.input_schema_id];

  const source = entities.sources[inputSchema.source_id];

  const callId = uuid();

  dispatch(
    apiCallStarted(callId, {
      operation: SAVE_COLUMN_METADATA,
      params: {}
    })
  );

  return socrataFetch(dsmapiLinks.newOutputSchema(source.id, currentOutputSchema.input_schema_id), {
    method: 'POST',
    body: JSON.stringify(payload)
  })
    .then(checkStatus)
    .then(getJson)
    .catch(error => {
      dispatch(apiCallFailed(callId, error));

      error.response.json().then(err => {
        const errorDetails = err.params || {};
        let errorMessage;

        const { field_name: fieldNameErrors, display_name: displayNameErrors } = _.pick(
          errorDetails,
          'field_name',
          'display_name'
        );

        if (fieldNameErrors && Array.isArray(fieldNameErrors)) {
          const { reason } = fieldNameErrors[0];

          if (reason === 'duplicate') {
            errorMessage = I18n.edit_metadata.validation_error_dupe_field_name;
          }
        } else if (displayNameErrors && Array.isArray(displayNameErrors)) {
          const { reason } = displayNameErrors[0];

          if (reason === 'duplicate') {
            errorMessage = I18n.edit_metadata.validation_error_dupe_display_name;
          }
        } else {
          errorMessage = I18n.edit_metadata.validation_error_general;
        }

        dispatch(showFlashMessage('error', errorMessage));
      });
    })
    .then(resp => {
      dispatch(listenForOutputSchemaSuccess(resp.resource));
      dispatch(subscribeToOutputSchema(resp.resource));
      dispatch(subscribeToTransforms(resp.resource));
      return resp;
    })
    .then(({ resource: { id: newOutputSchemaId } }) => {
      dispatch(markFormClean(formName));

      dispatch(hideFormErrors(formName));

      const revision = _.find(entities.revisions, { revision_seq: _.toNumber(params.revisionSeq) });

      dispatch(
        editRevision(revision.id, {
          output_schema_id: newOutputSchemaId
        })
      );

      dispatch(apiCallSucceeded(callId));
      // This is subtly wrong, could be a race with another user
      const redirect = Links.columnMetadataForm(params, newOutputSchemaId);
      browserHistory.push(redirect);

      dispatch(showFlashMessage('success', I18n.edit_metadata.save_success, 3500));
    });
};

export function focusColumnEditor(routerState) {
  return () => {
    const hash = routerState.location.hash;
    if (hash.length > 1) {
      // react router doesn't seem to provide a hook for after the component
      // has rendered, so we have to do this
      setTimeout(() => {
        const columnId = _.toNumber(hash.slice(1));
        const element = document.getElementById(`display-name-${columnId}`);
        if (element) {
          element.focus();
        }
      }, 0);
    }
  };
}
