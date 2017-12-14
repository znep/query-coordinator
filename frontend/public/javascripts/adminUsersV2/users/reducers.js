import {
  COMPLETE_FAIL,
  COMPLETE_SUCCESS,
  LOAD_DATA,
  START
} from '../actions';

import {
  ROLE_FILTER_CHANGED,
  USER_ROLE_CHANGE
} from '../roles/actions';

import {
  USER_SEARCH
} from './actions';

const userRoleChange = (state, action) => {
  return state.map(user => {
    if (user.id !== action.userId) return user;
    switch (action.stage) {
      case START:
        return {
          ...user,
          pendingRole: action.newRole
        };
      case COMPLETE_FAIL:
        return {
          ...user,
          pendingRole: undefined
        };
      case COMPLETE_SUCCESS:
        return {
          ...user,
          pendingRole: undefined,
          roleId: action.newRole
        };
      default:
        console.warn(`Invalid stage ${action.stage} for action`, action);
        return user;
    }
  });
};

const users = (state = [], action) => {
  switch (action.type) {
    case USER_ROLE_CHANGE:
      return userRoleChange(state, action);

    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.users;
      }
      return state;

    case USER_SEARCH:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.users;
      }
      return state;

    case ROLE_FILTER_CHANGED:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.users;
      }
      return state;

    default:
      return state;
  }
};

export default users;
