import * as actions from '../actions/AccessManagerActions';
import { getUsersFromPermissions, isPublicPermission } from '../Util';

const fetchPermissionsSuccess = (state, action) => {
  return {
    ...state,
    permissions: action.permissions,
    users: getUsersFromPermissions(action.permissions)
  };
};

const fetchPermissionsFail = (state, action) => {
  console.error('Error fetching permissions', action.error);
  return {
    ...state,
    permissions: null,
    errors: [...state.errors, action.error.message]
  };
};

const cancelButtonClicked = (state) => {
  return { ...state, visible: false };
};

const changeAudienceScope = (state, action) => {
  const permissions = [...state.permissions];

  const publicPermissionIndex = permissions.findIndex(isPublicPermission);

  // this is a hack for now; eventually the API will improve and this will not be needed
  // note that this does not persist until the save button is clicked
  if (action.scope === 'public') {
    if (publicPermissionIndex === -1) {
      permissions.push({ 'public': true, type: 'read' });
    }
  } else if (action.scope === 'private') {
    if (publicPermissionIndex !== -1) {
      permissions.splice(publicPermissionIndex, 1);
    }
  }

  return { ...state, permissions: [...permissions] };
};

// see the saga for the calls this action actually does
const saveButtonClicked = state => ({ ...state, saveInProgress: true });

const saveSuccess = (state) => {
  console.log('Saved permissions!');
  return { ...state, saveInProgress: false };
};

const saveFail = (state, action) => {
  console.error('Save failed', action.error);
  return {
    ...state,
    saveInProgress: false,
    errors: [...state.errors, action.error.message]
  };
};

const showAccessManager = (state) => {
  return { ...state, visible: true };
};

export default function(state = {}, action) {
  switch (action.type) {
    case actions.FETCH_PERMISSIONS_SUCCESS:
      return fetchPermissionsSuccess(state, action);
    case actions.FETCH_PERMISSIONS_FAIL:
      return fetchPermissionsFail(state, action);
    case actions.CHANGE_AUDIENCE_SCOPE:
      return changeAudienceScope(state, action);
    case actions.CANCEL_BUTTON_CLICKED:
      return cancelButtonClicked(state, action);
    case actions.SAVE_BUTTON_CLICKED:
      return saveButtonClicked(state, action);
    case actions.SAVE_SUCCESS:
      return saveSuccess(state, action);
    case actions.SAVE_FAIL:
      return saveFail(state, action);
    case actions.SHOW_ACCESS_MANAGER:
      return showAccessManager(state, action);
    default:
      return state;
  }
}
