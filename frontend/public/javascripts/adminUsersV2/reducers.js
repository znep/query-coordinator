import _ from 'lodash';
import { USER_ROLE_CHANGE, USER_SELECTION,
  START, COMPLETE_FAIL, COMPLETE_SUCCESS } from './actions';

const getInitialState = () => {
  const initialState = _.get(window, 'initialState');
  return {
    ...initialState,
    selectAll: false
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
          roleName: action.newRole
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

const userSelection = (state, action) => {
  const users = state.users.map((user) => {
    // update only the user specified in the action (or all users if `selectAll == true`)
    if (!action.selectAll && user.id !== action.userId) return user;
    return {
      ...user,
      isSelected: action.selectionState
    };
  });

  // if `selectAll` is true, update state to reflect new `selectionState`
  // else only change the value of `selectAll` if `selectionState` is false
  let selectAll = state.selectAll;
  if (action.selectAll) {
    selectAll = action.selectionState;
  } else if (!action.selectionState) {
    selectAll = false;
  }

  return {
    ...state,
    users,
    selectAll
  };
};

export default (state = getInitialState(), action) => {
  switch (action.type) {
    case USER_ROLE_CHANGE:
      return userRoleChange(state, action);

    case USER_SELECTION:
      return userSelection(state, action);

    default:
      return state;
  }
};
