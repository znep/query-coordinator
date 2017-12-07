import { findUserWithAccessLevel } from '../Util';
import { ACCESS_LEVELS } from '../Constants';

// accessManager selectors
export const getAssetUid = state => state.permissions.view.id;
export const getPermissions = state => state.permissions.permissions;
export const getAddedUsers = state => state.permissions.permissions.users;
export const getCurrentOwner =
  state => findUserWithAccessLevel(state.permissions.permissions.users || [], ACCESS_LEVELS.CURRENT_OWNER);

// userSearch selectors
export const getCurrentUserSearchQuery = state => state.addUsers.query;
export const getSelectedUsers = state => state.addUsers.selectedUsers;
