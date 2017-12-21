import { loadInvitedUsers } from './invitedUsers/actions';
import { loadRoles } from './roles/actions';
import { loadUsers } from './users/actions';

import {
  getFilters, getUsersOffset, getUsersOrderBy, getUsersQuery, getUsersResultsLimit,
  getUsersSortDirection
} from './reducers';

// Async Stages
export const START = 'START';
export const COMPLETE_SUCCESS = 'COMPLETE_SUCCESS';
export const COMPLETE_FAIL = 'COMPLETE_FAIL';

export const LOAD_DATA = 'LOAD_DATA';
export const loadData = () => (dispatch, getState) => {
  const state = getState();
  const filters = getFilters(state);
  const offset = getUsersOffset(state);
  const query = getUsersQuery(state);
  const limit = getUsersResultsLimit(state);
  const orderBy = getUsersOrderBy(state);
  const sortDirection = getUsersSortDirection(state);
  const ACTION = {
    type: LOAD_DATA
  };

  dispatch({ ...ACTION, stage: START });
  return Promise.all([
    loadUsers({ filters, limit, offset, query, orderBy, sortDirection }),
    loadRoles(),
    loadInvitedUsers()
  ]).then(([users, roles, invitedUsers]) => {
    dispatch({
      ...ACTION,
      stage: COMPLETE_SUCCESS,
      users,
      roles,
      invitedUsers
    });
  });
};

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const showNotification = (content, type = 'default') => dispatch => {
  const timeout = setTimeout(() => {
    dispatch({ type: SHOW_NOTIFICATION, stage: COMPLETE_SUCCESS });
  }, 2500);
  dispatch({ type: SHOW_NOTIFICATION, stage: START, payload: { content, timeout, type } });
};
