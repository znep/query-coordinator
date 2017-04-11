import _ from 'lodash';
import { push } from 'react-router-redux';
import * as Links from '../links';
import { checkStatus, getJson, socrataFetch } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import {
  updateStarted,
  updateSucceeded,
  updateFailed,
  upsertStarted,
  upsertSucceeded,
  upsertFailed
} from './database';
import { insertChildrenAndSubscribeToOutputSchema } from './manageUploads';
import * as Selectors from '../selectors';
import * as dsmapiLinks from '../dsmapiLinks';
import { showFlashMessage } from 'actions/flashMessage';
import { getLocalizedErrorMessage } from 'lib/util';

export const saveDatasetMetadata = () => (dispatch, getState) => {
  const { db, fourfour } = getState();

  const model = _.get(db, `views.${fourfour}.model`);
  const schema = _.get(db, `views.${fourfour}.schema`);

  // Careful here. We don't want to ping the server if the validation schema says
  // the form is invalid. But for validations we don't do client-side, there might
  // not be a schema period, since there are no client side validation rules to
  // generate one. So right now if there is no schema, we assume the form is valid
  // and allow it to hit server. If the server kicks it back for some reason, we
  // still display the error in a flash message. Maybe we can look into putting
  // a default empty schema that is valid into the store later.
  if (schema && !schema.isValid) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));
    return;
  }

  const publicMetadata = _.pick(
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
  );

  const privateMetadata = _.pick(model, ['email']);

  const datasetMetadata = _.assign({}, publicMetadata, { privateMetadata });

  dispatch(updateStarted('views', datasetMetadata));

  // TODO: switch this to read from redux store
  socrataFetch(`/api/views/${window.initialState.view.id}`, {
    method: 'PUT',
    body: JSON.stringify(datasetMetadata)
  }).
  then(checkStatus).
  then(() => {
    dispatch(updateSucceeded('views', datasetMetadata));
    dispatch(redirectAfterInterval());
  }).
  catch(error => {
    dispatch(updateFailed('views', datasetMetadata, error));

    error.response.json().then(({ message }) => {
      const localizedMessage = getLocalizedErrorMessage(message);
      dispatch(showFlashMessage('error', localizedMessage));
    });
  });
};

export const saveColumnMetadata = () => (dispatch, getState) => {
  const { db, fourfour } = getState();

  const formDataModel = _.get(db, `views.${fourfour}.colFormModel`, {});

  const schema = _.get(db, `views.${fourfour}.colFormSchema`);

  // see comment above in saveDatasetMetadata thunk
  if (schema && !schema.isValid) {
    dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));
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

  dispatch(upsertStarted('output_schemas', newOutputSchema));

  socrataFetch(dsmapiLinks.newOutputSchema(upload.id, currentOutputSchema.input_schema_id), {
    method: 'POST',
    body: JSON.stringify(payload)
  }).
    then(checkStatus).
    then(getJson).
    catch(error => {
      dispatch(upsertFailed('output_schemas', newOutputSchema, error));

      error.response.json().then(({ message }) => {
        const localizedMessage = getLocalizedErrorMessage(message);
        dispatch(showFlashMessage('error', localizedMessage));
      });
    }).
    then(resp => {
      dispatch(upsertSucceeded('output_schemas', newOutputSchema, {
        id: resp.resource.id,
        inserted_at: parseDate(resp.resource.inserted_at)
      }));
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
  return (dispatch, getState) => {
    setTimeout(() => {
      dispatch(push(Links.home(getState().routing)));
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
