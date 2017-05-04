import _ from 'lodash';
import { push } from 'react-router-redux';
import * as Links from '../links';
import { checkStatus, getJson, socrataFetch } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import {
  updateStarted,
  updateFailed,
  upsertStarted,
  upsertSucceeded,
  upsertFailed,
  edit,
  batch,
  setView,
  outputSchemaUpsertStarted,
  outputSchemaUpsertSucceeded,
  outputSchemaUpsertFailed
} from './database';
import { insertChildrenAndSubscribeToOutputSchema } from './manageUploads';
import * as Selectors from '../selectors';
import * as dsmapiLinks from '../dsmapiLinks';
import { showFlashMessage, hideFlashMessage } from 'actions/flashMessage';
import { getLocalizedErrorMessage } from 'lib/util';
import { PRIVATE_CUSTOM_FIELD_PREFIX, CUSTOM_FIELD_PREFIX, fromFlatToNested } from 'lib/customMetadata';

export const dismissMetadataPane = () => (dispatch, getState) => {
  const state = getState();
  const isDatasetModalPath = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/revisions\/\d+\/metadata(\/columns|\/dataset)?/;
  const currentLocation = state.routing.history[state.routing.history.length - 1];

  const helper = (history) => {
    const location = history[history.length - 1];

    if (history.length === 0) {
      dispatch(push(Links.home(currentLocation)));
    } else if (isDatasetModalPath.test(location.pathname)) {
      helper(history.slice(0, -1));
    } else {
      dispatch(push(location));
    }
  };

  helper(state.routing.history);
};

export const saveDatasetMetadata = () => (dispatch, getState) => {
  const { db, routing } = getState();
  const { fourfour } = routing;
  const model = _.get(db, `views.${fourfour}.model`);
  const schema = _.get(db, `views.${fourfour}.schema`);

  dispatch(hideFlashMessage());

  // Careful here. We don't want to ping the server if the validation schema says
  // the form is invalid. But for validations we don't do client-side, there might
  // not be a schema period, since there are no client side validation rules to
  // generate one. So right now if there is no schema, we assume the form is valid
  // and allow it to hit server. If the server kicks it back for some reason, we
  // still display the error in a flash message. Maybe we can look into putting
  // a default empty schema that is valid into the store later.
  if (schema && !schema.isValid) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));

    // MetadataField looks at displayMetadataFieldErrors in store, and will show
    // field-level validation errors if it's truthy. Dispatching this action from here
    // allows us to show field-level validation errors on form submit.
    dispatch(edit('views', {
      id: fourfour,
      displayMetadataFieldErrors: true
    }));

    return;
  }

  const publicMetadata = filterMetadata(_.pick(
    model,
    [
      'id',
      'name',
      'description',
      'category',
      'licenseId',
      'attribution',
      'attributionLink',
      'tags'
    ]
  ));

  function filterMetadata(metadata) {
    if (metadata.licenseId === '') {
      metadata.licenseId = null;
    }
    return metadata;
  }

  const privateMetadata = _.pick(model, ['email']);

  const isCustomField = (v, k) => {
    const regex = new RegExp(`^${CUSTOM_FIELD_PREFIX}`);
    return regex.test(k);
  };

  const isPrivateCustomField = (v, k) => {
    const regex = new RegExp(`^${PRIVATE_CUSTOM_FIELD_PREFIX}`);
    return regex.test(k);
  };

  const customMetadata = _.pickBy(model, isCustomField);

  const privateCustomMetadata = _.pickBy(model, isPrivateCustomField);

  const datasetMetadata = {
    ...publicMetadata,
    privateMetadata: {
      ...privateMetadata,
      custom_fields: fromFlatToNested(privateCustomMetadata)
    },
    metadata: {
      custom_fields: fromFlatToNested(customMetadata)
    }
  };

  const updateRecord = {
    id: fourfour
  };

  dispatch(updateStarted('views', {
    ...updateRecord,
    payload: datasetMetadata
  }));

  // TODO: switch this to read from redux store
  socrataFetch(`/api/views/${window.initialState.view.id}`, {
    method: 'PUT',
    body: JSON.stringify(datasetMetadata)
  }).
  then(checkStatus).
  then(getJson).
  then(resp => {
    dispatch(setView(resp));

    dispatch(redirectAfterInterval());
  }).
  catch(error => {
    dispatch(updateFailed('views', updateRecord, error));

    error.response.json().then(({ message }) => {
      const localizedMessage = getLocalizedErrorMessage(message);
      dispatch(showFlashMessage('error', localizedMessage));
    });
  });
};

export const saveColumnMetadata = () => (dispatch, getState) => {
  const { db, routing } = getState();

  const { fourfour } = routing;

  const formDataModel = _.get(db, `views.${fourfour}.colFormModel`, {});

  const schema = _.get(db, `views.${fourfour}.colFormSchema`);

  dispatch(hideFlashMessage());

  // see comment above in saveDatasetMetadata thunk
  if (schema && !schema.isValid) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));

    // See comment in corresponding portion of saveDatasetMetadata action
    dispatch(edit('views', {
      id: fourfour,
      displayMetadataFieldErrors: true
    }));

    return;
  }

  const currentOutputSchema = Selectors.latestOutputSchema(db);

  if (!currentOutputSchema) {
    return;
  }

  const payload = {
    output_columns: Selectors.updatedOutputColumns(db, formDataModel)
  };

  const inputSchema = db.input_schemas[currentOutputSchema.input_schema_id];

  const upload = db.uploads[inputSchema.upload_id];

  const newOutputSchema = {
    input_schema_id: inputSchema.id
  };

  const startOperations = [
    outputSchemaUpsertStarted(),
    upsertStarted('output_schemas', newOutputSchema)
  ];

  dispatch(batch(startOperations));

  socrataFetch(dsmapiLinks.newOutputSchema(upload.id, currentOutputSchema.input_schema_id), {
    method: 'POST',
    body: JSON.stringify(payload)
  }).
    then(checkStatus).
    then(getJson).
    catch(error => {
      // console.log('error', error.response.json().then(err => console.log(err)))
      const errorOperations = [
        upsertFailed('output_schemas', newOutputSchema, error),
        outputSchemaUpsertFailed()
      ];
      dispatch(batch(errorOperations));
      error.response.json().then(err => {
        const errorDetails = err.params || {};
        let errorMessage;

        const { field_name: fieldNameErrors, display_name: displayNameErrors } =
          _.pick(errorDetails, 'field_name', 'display_name');

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
    }).
    then(resp => {
      const successOperations = [
        outputSchemaUpsertSucceeded(),
        upsertSucceeded('output_schemas', newOutputSchema, {
          id: resp.resource.id,
          inserted_at: parseDate(resp.resource.inserted_at)
        })
      ];

      dispatch(batch(successOperations));

      // TODO: refactor into a thunk; will be easier to test and be consistent with
      // rest of app
      insertChildrenAndSubscribeToOutputSchema(dispatch, upload, resp.resource);
      dispatch(redirectAfterInterval());
    });
};

// when save succeeds, wait this long until modal goes away
// so user can see "saved" button is green
export const DELAY_UNTIL_CLOSE_MS = 1000;

function redirectAfterInterval() {
  return (dispatch) => {
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
