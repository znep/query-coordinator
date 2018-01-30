import I18n from 'common/i18n';

import {
  confirmButtonDisabledByDefault,
  confirmButtonBusyByDefault
} from 'common/components/AccessManager/Util';
import { AUDIENCE_SCOPES } from 'common/components/AccessManager/Constants';

import * as uiActions from 'common/components/AccessManager/actions/UiActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';

// main cancel button is clicked; close the modal
const cancelButtonClicked = (state) => ({
  ...state,
  visible: false
});

// see the saga for the calls this action actually does
const saveButtonClicked = state => ({
  ...state,
  footer: {
    ...state.footer,
    confirmButtonBusy: true
  }
});

const setConfirmButtonDisabled = (state, action) => ({
  ...state,
  footer: {
    ...state.footer,
    confirmButtonDisabled: action.disabled
  }
});

// usually outside forces telling us to show the access manager modal
const showAccessManager = (state, action) => {
  return {
    ...state,
    visible: true,

    // optionally refresh the page when saving succeeds
    refreshPageOnSave: action.refreshPageOnSave,

    mode: action.mode,

    footer: {
      ...state.footer,
      confirmButtonDisabled: confirmButtonDisabledByDefault(action.mode),
      confirmButtonBusy: confirmButtonBusyByDefault(action.mode)
    }
  };
};

// called by the AccessManagerSaga when API returns success
// hide the modal and show a success toast notification
const saveSuccess = (state) => {
  const { refreshPageOnSave } = state;

  // if we've been told to refresh the page on save success, do so now
  // (this is mostly for when elements showing permissions on a view
  // but don't get updated when they change in this component)
  if (refreshPageOnSave) {
    window.location.reload();
    return state;
  }

  // else show a toast
  return {
    ...state,
    confirmButtonBusy: false,
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
    confirmButtonBusy: false,
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

const redirectTo = (state, action) => {
  const { url } = action;

  window.location.href = url;

  return state;
};

const showApprovalMessageChanged = (state, action) => ({
  ...state,
  showApprovalMessage: action.showApprovalMessage,
  footer: {
    ...state.footer,
    confirmButtonDisabled: false,
    confirmButtonBusy: false
  }
});

const changeAudienceScope = (state, action) => {
  const { scope } = action;

  return {
    ...state,
    showApprovalMessage: false,
    footer: {
      ...state.footer,

      // we disable the confirm button until we know if the asset will go
      // through approvals or not (see UiSagas)
      confirmButtonDisabled: scope === AUDIENCE_SCOPES.PUBLIC,
      confirmButtonBusy: scope === AUDIENCE_SCOPES.PUBLIC
    }
  };
};

export default (state = {}, action) => {
  switch (action.type) {
    // uiActions
    case uiActions.CANCEL_BUTTON_CLICKED:
      return cancelButtonClicked(state, action);
    case uiActions.SAVE_BUTTON_CLICKED:
      return saveButtonClicked(state, action);
    case uiActions.SHOW_ACCESS_MANAGER:
      return showAccessManager(state, action);
    case uiActions.DISMISS_TOAST_MESSAGE:
      return dismissToastMessage(state, action);
    case uiActions.REDIRECT_TO:
      return redirectTo(state, action);
    case uiActions.SET_CONFIRM_BUTTON_DISABLED:
      return setConfirmButtonDisabled(state, action);
    case uiActions.SHOW_APPROVAL_MESSAGE_CHANGED:
      return showApprovalMessageChanged(state, action);

    // permissionsActions
    case permissionsActions.SAVE_SUCCESS:
      return saveSuccess(state, action);
    case permissionsActions.SAVE_FAIL:
      return saveFail(state, action);
    case permissionsActions.FETCH_PERMISSIONS_FAIL:
      return fetchPermissionsFail(state, action);
    case permissionsActions.CHANGE_AUDIENCE_SCOPE:
      return changeAudienceScope(state, action);

    default:
      return state;
  }
};
