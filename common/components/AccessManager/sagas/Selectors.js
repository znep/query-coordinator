import { findUserWithAccessLevel } from 'common/components/AccessManager/Util';
import { ACCESS_LEVELS } from 'common/components/AccessManager/Constants';

export const getUiMode = state => state.ui.mode;

// accessManager selectors
export const getAssetUid = state => state.permissions.view.id;
export const getPermissions = state => state.permissions.permissions;
export const getAddedUsers = state => state.permissions.permissions.users;
export const getCurrentOwner =
  state => findUserWithAccessLevel(state.permissions.permissions.users || [], ACCESS_LEVELS.CURRENT_OWNER);

// userSearch selectors
export const getCurrentUserSearchQuery = state => state.addUsers.query;
export const getSelectedUsers = state => state.addUsers.selectedUsers;

// permissions selectors
export const getCurrentView = state => state.permissions.view;
export const getCurrentScope =
  state => (state.permissions.permissions ? state.permissions.permissions.scope : null);
