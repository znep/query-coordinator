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

// Save button was clicked
export const SAVE_BUTTON_CLICKED = 'SAVE_BUTTON_CLICKED';
export const saveButtonClicked = () => ({ type: SAVE_BUTTON_CLICKED });

// Save succeeded!
export const SAVE_SUCCESS = 'SAVE_SUCCESS';
export const saveSuccess = () => ({ type: SAVE_SUCCESS });

// Save failed
export const SAVE_FAIL = 'SAVE_FAIL';
export const saveFail = error => ({ type: SAVE_FAIL, error });

// The cancel button was clicked (close the modal)
export const CANCEL_BUTTON_CLICKED = 'CANCEL_BUTTON_CLICKED';
export const cancelButtonClicked = () => ({ type: CANCEL_BUTTON_CLICKED });

// A function gets added to window that basically dispatches this action when called
export const SHOW_ACCESS_MANAGER = 'SHOW_ACCESS_MANAGER';
export const showAccessManager = () => ({ type: SHOW_ACCESS_MANAGER });
