import * as permissionsActions from '../actions/PermissionsActions';
import * as changeOwnerActions from '../actions/ChangeOwnerActions';
import { ACCESS_LEVELS } from '../Constants';
import { userHasAccessLevel, findUserIndexWithAccessLevel } from '../Util';

// called by AccessManagerSaga when permissions are fetched
const fetchPermissionsSuccess = (state, action) => ({
  ...state,
  permissions: action.permissions
});

// called by AccessManagerSaga when fetching permissions fails
const fetchPermissionsFail = (state) => {
  return {
    ...state,
    permissions: null
  };
};

// change the "scope" of the permissions (i.e. public, private)
const changeAudienceScope = (state, action) => {
  const permissions = { ...state.permissions };

  return {
    ...state,
    permissions: {
      ...permissions,
      scope: action.scope
    }
  };
};

// change the access level of a specific user
// (that is, their "view-level" role)
const changeUserAccessLevel = (state, action) => {
  const { permissions } = state;
  const { user, accessLevel } = action;
  const userIndex = permissions.users.findIndex(u =>
    u.email === user.email &&
    // can't change the owner using this!
    !userHasAccessLevel(u, ACCESS_LEVELS.CURRENT_OWNER)
  );

  if (userIndex < 0) {
    console.error(`No user found for ${user}`);
    return state;
  }

  const updatedUsers = [...permissions.users];
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    accessLevels: [accessLevel]
  };

  return {
    ...state,
    permissions: {
      ...permissions,
      users: updatedUsers
    }
  };
};

// revoke a users' permissions
// this actually just removed them from the list;
// when PUTing to the API, their absence will remove their permission
const removeUser = (state, action) => {
  const { permissions } = state;
  const { user } = action;
  const userIndex = permissions.users.findIndex(u =>
    u.email === user.email &&
    // can't delete the owner!
    !userHasAccessLevel(u, ACCESS_LEVELS.CURRENT_OWNER)
  );

  if (userIndex < 0) {
    console.error(`No user found for ${user}`);
    return state;
  }

  const updatedUsers = [...permissions.users];
  updatedUsers.splice(userIndex, 1);

  return {
    ...state,
    permissions: {
      ...permissions,
      users: updatedUsers
    }
  };
};

// add a list of users with a given access level
// (from the UserSearch multi-select component)
const addUsers = (state, action) => {
  const { users, accessLevel } = action;

  return {
    ...state,
    permissions: {
      ...state.permissions,
      users: [
        ...state.permissions.users,
        ...users.map(user => ({
          id: user.id,

          // this is how the catalog gives it to us...
          displayName: user.screen_name,
          email: user.email,

          // TODO this needs to be updated once we introduce the
          // concept of groups/teams to the catalog
          type: 'user',

          // just one access level for now; if we ever want multiple
          // access levels in the future, this will need to be changed
          // along with the dropdown
          accessLevels: [accessLevel]
        }))
      ]
    }
  };
};

// change the "true" owner of a dataset
const changeOwner = (state, action) => {
  const { permissions } = state;
  const { owner } = action;

  // we're just going to replace the user at the index of the current owner,
  // effectively "transferring" the ownership to them
  const currentOwnerIndex = findUserIndexWithAccessLevel(permissions.users, ACCESS_LEVELS.CURRENT_OWNER);

  // if the user ownership is being transferred to already has access,
  // we want to remove their access before making them owner
  const existingUserIndex =
    permissions.users.findIndex(
      user => user.email === owner.email
    );

  const updatedUsers = [...permissions.users];

  // replace the owner in the list
  updatedUsers[currentOwnerIndex] = {
    id: owner.id,
    displayName: owner.screen_name,
    email: owner.email,
    accessLevels: [
      {
        name: 'current_owner',
        version: 'all'
      }
    ]
  };

  // remove user being made owner, if they already exist
  if (existingUserIndex > -1) {
    updatedUsers.splice(existingUserIndex, 1);
  }

  return {
    ...state,
    permissions: {
      ...state.permissions,
      users: updatedUsers
    }
  };
};

export default (state = {}, action) => {
  switch (action.type) {
    // permissionsActions
    case permissionsActions.FETCH_PERMISSIONS_SUCCESS:
      return fetchPermissionsSuccess(state, action);
    case permissionsActions.FETCH_PERMISSIONS_FAIL:
      return fetchPermissionsFail(state, action);
    case permissionsActions.CHANGE_AUDIENCE_SCOPE:
      return changeAudienceScope(state, action);
    case permissionsActions.CHANGE_USER_ACCESS_LEVEL:
      return changeUserAccessLevel(state, action);
    case permissionsActions.REMOVE_USER_ACCESS:
      return removeUser(state, action);
    case permissionsActions.ADD_USERS:
      return addUsers(state, action);

    // changeOwnerActions
    case changeOwnerActions.CONFIRM_SELECTED_OWNER:
      return changeOwner(state, action);
    default:
      return state;
  }
};
