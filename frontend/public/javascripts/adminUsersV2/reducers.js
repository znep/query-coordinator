import { USER_ROLE_CHANGE, LOAD_DATA,
  START, COMPLETE_FAIL, COMPLETE_SUCCESS } from './actions';

const getInitialState = () => {
  return {
    users: [],
    roles: []
  };
};

const userRoleChange = (state, action) => {
  const users = state.users.map((user) => {
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

  return {
    ...state,
    users
  };
};

export default (state = getInitialState(), action) => {
  switch (action.type) {
    case USER_ROLE_CHANGE:
      return userRoleChange(state, action);

    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        const { users, roles } = action;
        return {
          ...state,
          users,
          roles
        };
      }
      return state;

    default:
      return state;
  }
};
