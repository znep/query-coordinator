import { loadInvitedUsers } from './invitedUsers/actions';
import { loadRoles } from './roles/actions';
import { loadUsers } from './users/actions';

import _ from 'lodash';

// Async Stages
export const START = 'START';
export const COMPLETE_SUCCESS = 'COMPLETE_SUCCESS';
export const COMPLETE_FAIL = 'COMPLETE_FAIL';

export const LOAD_DATA = 'LOAD_DATA';
export const loadData = () => (dispatch, getState) => {
  const state = getState();
  const filters = state.filters;
  const query = _.get(state, 'autocomplete.query');
  const ACTION = {
    type: LOAD_DATA
  };

  dispatch({ ...ACTION, stage: START });
  return Promise.all([
    loadUsers({ filters, query }),
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
