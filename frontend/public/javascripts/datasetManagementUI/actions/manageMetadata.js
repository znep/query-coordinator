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
    return Promise.reject();
  }

  const datasetMetadata = Selectors.datasetMetadata(view);

  const callId = uuid();

  dispatch(
    apiCallStarted(callId, {
      operation: SAVE_DATASET_METADATA,
      params: {}
    })
  );
  // Promise.all fails if one of the operations passed into it fails. This is what
  // we want for now because DSMAPI's "Update Revision" endpoint does no validations
  // so we want to rely on core for that. Similarly, when DSMAPI updates start winning
  // over what's already in core, we want to show a failure even though core update
  // succeeds since applying the revision will overwrite that info.
  // TODO: remove core api call (the first one here) once validations go into
  // dsmapi and once dsmapi revisions start overriding what's in core
  return Promise.all([
    socrataFetch(`/api/views/${fourfour}`, {
      method: 'PUT',
      body: JSON.stringify(datasetMetadata)
    }),
    socrataFetch(dsmapiLinks.revisionBase, {
      method: 'PUT',
      body: JSON.stringify({
        metadata: datasetMetadata
      })
    })
  ])
    .then(resp => {
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
      // Because of the way .then workds, you cant just return the resp here. You get
      // an array of promises rather than a Promise of array.
      return Promise.all(resp.map(r => r.json()));
    })
    .then(resp => {
      const [dsmapi] = resp.filter(r => r.resource).map(r => r.resource);

      if (!dsmapi.metadata) {
        throw new Error('No metadata in api response');
      }
      // TODO: wait on Cate's bugfix for private custom md
      dispatch(
        editView(dsmapi.fourfour, {
          ..._.omit(dsmapi.metadata, 'metadata', 'private_metadata'),
          metadata: dsmapi.metadata.metadata,
          privateMetadata: dsmapi.metadata.private_metadata,
          showErrors: false,
          datasetFormDirty: false,
          metadataLastUpdatedAt: Date.now()
        })
      );

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

export const saveColumnMetadata = () => (dispatch, getState) => {
  const { entities, ui } = getState();
  const { fourfour } = ui.routing;
  const view = entities.views[fourfour];
  const { columnMetadataErrors: errors } = view;

  dispatch(hideFlashMessage());

  if (errors.length) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));

    dispatch(editView(fourfour, { showErrors: true }));

    return Promise.reject();
  }

  const currentOutputSchema = Selectors.latestOutputSchema(entities);

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
      dispatch(pollForOutputSchemaSuccess(resp.resource));
      dispatch(subscribeToOutputSchema(resp.resource));
      dispatch(subscribeToTransforms(resp.resource));
    })
    .then(() => {
      dispatch(
        editView(fourfour, {
          columnFormDirty: false,
          showErrors: false
        })
      );
      dispatch(apiCallSucceeded(callId));
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
