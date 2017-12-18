import I18n from 'common/i18n';

import * as uiActions from '../actions/UiActions';
import * as permissionsActions from '../actions/PermissionsActions';

// changing the header text
const changeHeader = (state, action) => ({
  ...state,
  headerText: action.title,
  headerSubtitle: action.subtitle
});

// main cancel button is clicked; close the modal
const cancelButtonClicked = (state) => {
  return { ...state, visible: false };
};

// see the saga for the calls this action actually does
const saveButtonClicked = state => ({ ...state, saveInProgress: true });

// usually outside forces telling us to show the access manager modal
const showAccessManager = (state, action) => {
  return {
    ...state,
    visible: true,

    // optionally refresh the page when saving succeeds
    refreshPageOnSave: action.refreshPageOnSave
  };
};

// called by the AccessManagerSaga when API returns success
// hide the modal and show a success toast notification
const saveSuccess = (state) => {
  const { refreshPageOnSave } = state;

  // if we've been told ro refresh the page on save success, do so now
  // (this is mostly for when elements showing permissions on a view
  // but don't get updated when they change in this component)
  if (refreshPageOnSave) {
    window.location.reload();
    return state;
  }

  // else show a toast
  return {
    ...state,
    saveInProgress: false,
    visible: false,

    // see UiSagas for where this notification gets automatically dismissed
    toastMessage: I18n.t('shared.site_chrome.access_manager.permissions_saved'),
    toastMessageVisible: true
  };
};

// called by the AccessManagerSaga when the api call fails
const saveFail = (state, action) => {
  console.error('Save failed', action.error);
  return {
    ...state,
    saveInProgress: false,
    errors: [...state.errors, action.error.message]
  };
};

// called by AccessManagerSaga when fetching permissions fails
const fetchPermissionsFail = (state, action) => {
  console.error('Error fetching permissions', action.error);
  return {
    ...state,
    errors: [...state.errors, action.error.message]
  };
};

const dismissToastMessage = (state) => ({
  ...state,
  toastMessageVisible: false
});

export default (state = {}, action) => {
  switch (action.type) {
    // uiActions
    case uiActions.CHANGE_HEADER:
      return changeHeader(state, action);
    case uiActions.CANCEL_BUTTON_CLICKED:
      return cancelButtonClicked(state, action);
    case uiActions.SAVE_BUTTON_CLICKED:
      return saveButtonClicked(state, action);
    case uiActions.SHOW_ACCESS_MANAGER:
      return showAccessManager(state, action);
    case uiActions.DISMISS_TOAST_MESSAGE:
      return dismissToastMessage(state, action);

    // permissionsActions
    case permissionsActions.SAVE_SUCCESS:
      return saveSuccess(state, action);
    case permissionsActions.SAVE_FAIL:
      return saveFail(state, action);
    case permissionsActions.FETCH_PERMISSIONS_FAIL:
      return fetchPermissionsFail(state, action);
    default:
      return state;
  }
};
