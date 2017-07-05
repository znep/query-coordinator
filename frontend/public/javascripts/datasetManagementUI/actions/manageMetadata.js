import _ from 'lodash';
import { push } from 'react-router-redux';
import uuid from 'uuid';
import * as Links from '../links';
import { checkStatus, getJson, socrataFetch } from '../lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  SAVE_COLUMN_METADATA,
  SAVE_DATASET_METADATA
} from 'actions/apiCalls';
import * as Selectors from 'selectors';
import * as dsmapiLinks from 'dsmapiLinks';
import { showFlashMessage, hideFlashMessage } from 'actions/flashMessage';
import { getLocalizedErrorMessage } from 'lib/util';
import {
  pollForOutputSchemaSuccess,
  subscribeToOutputSchema,
  subscribeToTransforms
} from 'actions/manageUploads';
import { editView } from 'actions/views';

export const dismissMetadataPane = () => (dispatch, getState) => {
  const { routing } = getState().ui;
  const isDatasetModalPath = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/revisions\/\d+\/metadata(\/columns|\/dataset)?/;
  const currentLocation = routing.history[routing.history.length - 1];

  const helper = history => {
    const location = history[history.length - 1];

    if (history.length === 0) {
      dispatch(push(Links.home(currentLocation)));
    } else if (isDatasetModalPath.test(location.pathname)) {
      helper(history.slice(0, -1));
    } else {
      dispatch(push(location));
    }
  };

  helper(routing.history);
};

export const saveDatasetMetadata = () => (dispatch, getState) => {
  const { entities, ui } = getState();
  const { fourfour } = ui.routing;
  const view = entities.views[fourfour];
  const { datasetMetadataErrors: errors } = view;

  dispatch(hideFlashMessage());

  if (errors.length) {
    dispatch(editView(fourfour, { showErrors: true }));
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));
    return;
  }

  const datasetMetadata = Selectors.datasetMetadata(view);

  const callId = uuid();

  dispatch(
    apiCallStarted(callId, {
      operation: SAVE_DATASET_METADATA,
      params: {}
    })
  );

  return socrataFetch(`/api/views/${fourfour}`, {
    method: 'PUT',
    body: JSON.stringify(datasetMetadata)
  })
    .then(checkStatus)
    .then(getJson)
    .then(resp => {
      // remove fields added to the view as part of https://github.com/socrata/rfcs/pull/6/files
      // gonna be good to use them when that ticket is done, but having them there now is just confusing
      // TODO: remove this a rework where we pull saved metadata values when complete
      const sanitizedResp = _.omit(resp, ['privateCustomMetadata', 'publicCustomMetadata']);

      dispatch(editView(resp.id, sanitizedResp));

      dispatch(apiCallSucceeded(callId));

      dispatch(redirectAfterInterval());
    })
    .catch(error => {
      dispatch(apiCallFailed(callId, error));

      error.response.json().then(({ message }) => {
        const localizedMessage = getLocalizedErrorMessage(message);
        dispatch(showFlashMessage('error', localizedMessage));
      });
    });
};

export const saveColumnMetadata = () => (dispatch, getState) => {
  const { entities, ui } = getState();
  const { fourfour } = ui.routing;
  const view = entities.views[fourfour];
  const { columnMetadataErrors: errors } = view;

  dispatch(hideFlashMessage());

  if (errors.length) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));

    dispatch(editView(fourfour, { showErrors: true }));

    return;
  }

  const currentOutputSchema = Selectors.latestOutputSchema(entities);

  if (!currentOutputSchema) {
    return;
  }

  const payload = {
    output_columns: Selectors.columnsForOutputSchema(entities, currentOutputSchema.id)
  };

  const inputSchema = entities.input_schemas[currentOutputSchema.input_schema_id];

  const upload = entities.uploads[inputSchema.upload_id];

  const callId = uuid();

  dispatch(
    apiCallStarted(callId, {
      operation: SAVE_COLUMN_METADATA,
      params: {}
    })
  );

  return socrataFetch(dsmapiLinks.newOutputSchema(upload.id, currentOutputSchema.input_schema_id), {
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
      dispatch(pollForOutputSchemaSuccess(resp.resource));
      dispatch(subscribeToOutputSchema(resp.resource));
      dispatch(subscribeToTransforms(resp.resource));
    })
    .then(() => {
      dispatch(apiCallSucceeded(callId));
      dispatch(redirectAfterInterval());
    });
};

// when save succeeds, wait this long until modal goes away
// so user can see "saved" button is green
export const DELAY_UNTIL_CLOSE_MS = 1000;

function redirectAfterInterval() {
  return dispatch => {
    setTimeout(() => {
      dispatch(dismissMetadataPane());
    }, DELAY_UNTIL_CLOSE_MS);
  };
}

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
