import 'whatwg-fetch';
import { defaultHeaders, checkStatus, reload } from 'common/http';
import ceteraUtils from 'common/cetera/utils';

const performingAction = (actionType) => ({ type: 'PERFORMING_ACTION', actionType });
const performingActionSuccess = (actionType) => ({ type: 'PERFORMING_ACTION_SUCCESS', actionType });
const performingActionFailure = (actionType, response) => (
  { type: 'PERFORMING_ACTION_FAILURE', actionType, response }
);

export const showAlert = (titleLocaleKey, bodyLocaleKey, time = 7000) => ( // Time to display alert is in ms
  { type: 'SHOW_ALERT', titleLocaleKey, bodyLocaleKey, time }
);

export const hideAlert = () => (
  { type: 'HIDE_ALERT' }
);

export const showModal = (modalType, uid) => ({ type: 'SHOW_MODAL', modalType, uid });
export const closeModal = () => ({ type: 'CLOSE_MODAL' });

export const fetchChildAssets = (uid) => () => ceteraUtils.query({ derivedFrom: uid });

export const fetchParentVisibility = (uid) => () => (
  ceteraUtils.query({ idFilters: [uid], showVisibility: true })
);

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
    catch((result) => (dispatch(performingActionFailure(ACTION_TYPE, result.response))));
};

export const changeVisibility = (uid, assetType, newVisibility) => (dispatch) => {
  const ACTION_TYPE = 'changeVisibility';

  let apiPath;
  let method;
  let visibilityValue;

  if (assetType === 'story') {
    // TODO
  } else if (assetType === 'datalens') {
    // NOTE: this will treat "private" and "hidden" as the same thing for data lenses.
    // We probably want to do something better.
    visibilityValue = newVisibility === 'shown' ? 'false' : 'true'; // if it's 'shown', set 'hide' to 'false'

    apiPath = `/admin/views/${uid}/hide/${visibilityValue}?skip_redirect=true`;
    method = 'POST';
  } else {
    visibilityValue = newVisibility;
    if (visibilityValue === 'open') {
      // TODO: public.read vs public.add or public.write if asset is a form
      visibilityValue = 'public.read';
    }

    const validVisibilityValues = ['private', 'public.read', 'public.add'];
    if (validVisibilityValues.indexOf(visibilityValue) === -1) {
      throw new Error(
        `Invalid visibilityValue: '${visibilityValue}'. Must be one of ${validVisibilityValues.join(', ')}`
      );
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

  const alertBodyLocaleKey = 'shared.asset_browser.alert_messages.visibility_changed.body';
  const alertTitleLocaleKey = (visibilityValue === 'yes' || visibilityValue.indexOf('public') > -1) ?
    'shared.asset_browser.alert_messages.visibility_changed.title_public' :
    'shared.asset_browser.alert_messages.visibility_changed.title_private';

  return fetch(apiPath, fetchOptions).
    then(checkStatus).
    then(() => dispatch(showAlert(alertTitleLocaleKey, alertBodyLocaleKey))).
    then(() => dispatch(closeModal())).
    then(() => { document.body.click(); }). // Close action dropdown menu
    then(() => dispatch(performingActionSuccess(ACTION_TYPE))).
    catch(() => dispatch(performingActionFailure(ACTION_TYPE)));
};
