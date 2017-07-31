import { defaultHeaders, checkStatus } from 'common/http';

// Async Stages
export const START = 'START';
export const COMPLETE_SUCCESS = 'COMPLETE_SUCCESS';
export const COMPLETE_FAIL = 'COMPLETE_FAIL';

export const USER_ROLE_CHANGE = 'USER_ROLE_CHANGE';
export const changeUserRole = (userId, newRole) => (dispatch) => {
  const ACTION = {
    type: USER_ROLE_CHANGE,
    userId,
    newRole
  };

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'PUT'
  };

  const apiPath = `/api/users?method=promote&name=${userId}&role=${newRole}`;

  dispatch({ ...ACTION, stage: START });
  return fetch(apiPath, fetchOptions).
    then(checkStatus).
    then(() => dispatch({ ...ACTION, stage: COMPLETE_SUCCESS })).
    catch(() => dispatch({ ...ACTION, stage: COMPLETE_FAIL }));
};

export const USER_SELECTION = 'USER_SELECTION';
export const userSelection = (userId, selectionState, selectAll = false) => {
  return {
    type: USER_SELECTION,
    userId,
    selectionState,
    selectAll
  };
};
