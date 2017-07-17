import 'whatwg-fetch';
import { defaultHeaders, checkStatus, reload } from 'common/http';
import ceteraUtils from 'common/cetera_utils';

export const closeModal = () => (
  { type: 'CLOSE_MODAL' }
);

const performingAction = (actionType) => (
  { type: 'PERFORMING_ACTION', actionType }
);

const performingActionSuccess = (actionType) => (
  { type: 'PERFORMING_ACTION_SUCCESS', actionType }
);

const performingActionFailure = (actionType) => (
  { type: 'PERFORMING_ACTION_FAILURE', actionType }
);

export const fetchChildAssets = (uid) => () => ceteraUtils.query({ derivedFrom: uid });

export const fetchParentVisibility = (uid) => () => ceteraUtils.query({
  idFilters: [uid], showVisibility: 'true'
});

export const deleteAsset = (uid) => (dispatch) => {
  const ACTION_TYPE = 'deleteAsset';
  const fetchOptions = {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  dispatch(performingAction(ACTION_TYPE));

  return fetch(`/api/views/${uid}.json`, fetchOptions).
    then(checkStatus).
    then(() => dispatch(performingActionSuccess(ACTION_TYPE))).
    then(reload).
    catch(() => dispatch(performingActionFailure(ACTION_TYPE)));
};

export const changeVisibility = (uid, assetType, newVisibility) => (dispatch) => {
  const ACTION_TYPE = 'changeVisibility';

  let apiPath;
  let method;

  if (assetType === 'story') {
    // TODO
  } else if (assetType === 'datalens') {
    // NOTE: this will treat "private" and "hidden" as the same thing for data lenses.
    // We probably want to do something better.
    const visibilityValue = newVisibility === 'open' ? 'yes' : 'no'; // srsly

    apiPath = `/admin/views/${uid}/set/${visibilityValue}?skip_redirect=true`;
    method = 'POST';
  } else {
    let visibilityValue = newVisibility;
    if (visibilityValue === 'open') {
      // TODO: public.read vs public.add or public.write if asset is a form
      visibilityValue = 'public.read';
    }

    apiPath = `/views/${uid}.json?method=setPermission&value=${visibilityValue}`;
    method = 'PUT';
  }

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders,
    method
  };

  dispatch(performingAction(ACTION_TYPE));

  return fetch(apiPath, fetchOptions).
    then(checkStatus).
    then(() => dispatch(performingActionSuccess(ACTION_TYPE))).
    then(reload).
    catch(() => dispatch(performingActionFailure(ACTION_TYPE)));
};
