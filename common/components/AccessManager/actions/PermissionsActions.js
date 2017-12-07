// Call out to core to get all the permissions for the assigned asset
export const FETCH_PERMISSIONS = 'FETCH_PERMISSIONS';
export const fetchPermissions = assetUid => ({ type: FETCH_PERMISSIONS, assetUid });

// Permissions were fetched sucessfully from core
export const FETCH_PERMISSIONS_SUCCESS = 'FETCH_PERMISSIONS_SUCCESS';
export const fetchPermissionsSuccess = permissions => ({ type: FETCH_PERMISSIONS_SUCCESS, permissions });

// There was an error fetching the permissions
export const FETCH_PERMISSIONS_FAIL = 'FETCH_PERMISSIONS_FAIL';
export const fetchPermissionsFail = error => ({ type: FETCH_PERMISSIONS_FAIL, error });

// Request to change the audience scope of the dataset in the store.
// Note that this does not persist to the database until the save button is clicked.
export const CHANGE_AUDIENCE_SCOPE = 'CHANGE_AUDIENCE_SCOPE';
export const changeAudienceScope = scope => ({ type: CHANGE_AUDIENCE_SCOPE, scope });

// Change the access level for a user
export const CHANGE_USER_ACCESS_LEVEL = 'CHANGE_USER_ACCESS_LEVEL';
export const changeUserAccessLevel = (user, accessLevel) =>
  ({ type: CHANGE_USER_ACCESS_LEVEL, user, accessLevel });

// Remove a user from the list
export const REMOVE_USER_ACCESS = 'REMOVE_USER_ACCESS';
export const removeUserAccess = user => ({ type: REMOVE_USER_ACCESS, user });

// Add user(s) to the list with access levels
export const ADD_USERS = 'ADD_USERS';
export const addUsers = (users, accessLevel) => ({ type: ADD_USERS, users, accessLevel });

// Save succeeded!
export const SAVE_SUCCESS = 'SAVE_SUCCESS';
export const saveSuccess = () => ({ type: SAVE_SUCCESS });

// Save failed
export const SAVE_FAIL = 'SAVE_FAIL';
export const saveFail = error => ({ type: SAVE_FAIL, error });
