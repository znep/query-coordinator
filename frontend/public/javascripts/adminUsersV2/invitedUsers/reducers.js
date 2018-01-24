import * as Actions from './actions';
import * as UsersActions from '../users/actions';

import curryRight from 'lodash/fp/curryRight';
import get from 'lodash/fp/get';
import getOr from 'lodash/fp/getOr';
import find from 'lodash/fp/find';
import flow from 'lodash/fp/flow';
import filter from 'lodash/fp/filter';
import omit from 'lodash/fp/omit';

export const initialState = {
  invitedUsers: [],
  loadingData: true
};

const handleLoadInvitedUsersSuccess = (state, { invitedUsers }) => ({ ...state, loadingData: false, invitedUsers });

const handleRemoveInvitedUserSuccess = (state, { id }) => ({
  ...state,
  invitedUsers: flow(getInvitedUsers, filter(user => user.id !== id))(state)
});

const handleRemoveInvitedUser = (state, { id }) => ({
  ...state,
  invitedUsers: getInvitedUsers(state).map(u => u.id === id ? { ...u, isRemoving: true } : u)
});

const handleRemoveInvitedUserFailure = (state, { id }) => ({
  ...state,
  invitedUsers: getInvitedUsers(state).map(u => u.id === id ? omit('isRemoving', u) : u)
});

const handleSubmitNewUsersSuccess = (state, { invitedUsers }) => ({
  ...state,
  invitedUsers
});

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case Actions.LOAD_INVITED_USERS_SUCCESS:
      return handleLoadInvitedUsersSuccess(state, payload);
    case Actions.REMOVE_INVITED_USER:
      return handleRemoveInvitedUser(state, payload);
    case Actions.REMOVE_INVITED_USER_SUCCESS:
      return handleRemoveInvitedUserSuccess(state, payload);
    case Actions.REMOVE_INVITED_USER_FAILURE:
      return handleRemoveInvitedUserFailure(state, payload);

    case UsersActions.ADD_USERS_SUCCESS:
      return handleSubmitNewUsersSuccess(state, payload);

    default:
      return state;
  }
};

export const getInvitedUsers = get('invitedUsers');
export const getInvitedUserCount = flow(getInvitedUsers, getOr(0, 'length'));
export const getInvitedUsersLoading = get('loadingData');
const findInvitedUserById = id => find(user => user.id === id);
export const getInvitedUserById = (state, id) => flow(getInvitedUsers, findInvitedUserById(id))(state);
export const getInvitedUserEmailById = (state, id) => flow(curryRight(getInvitedUserById)(id), get('email'))(state);

export default reducer;
