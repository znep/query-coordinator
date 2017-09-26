import { defaultHeaders, checkStatus } from 'common/http';
import CoreApi from 'common/core-roles-api';

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

  dispatch({ ...ACTION, stage: START });
  return CoreApi.assignRoleToUser({ userId, roleId: newRole })
    .then(
      () => { dispatch({ ...ACTION, stage: COMPLETE_SUCCESS }); },
      (err) => {
        console.error(err);
        dispatch({ ...ACTION, stage: COMPLETE_FAIL });
      }
    );
};

const convertUserListFromApi = (users) => {
  return users.map((user) => {
    user.role_id = user.role_id.toString();
    const converted = {};
    Object.keys(user).forEach((key) => {
      converted[_.camelCase(key)] = user[key];
    });
    return converted;
  });
};

const loadUsers = () => {
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  const apiPath = `/api/catalog/v1/users?domain=${window.location.hostname}`;

  return fetch(apiPath, fetchOptions)
    .then(checkStatus)
    .then((response) => response.json())
    .then((json) => json.results)
    .then(convertUserListFromApi);
};

const loadRoles = () => {
  return CoreApi.getAllRoles()
    .then((roles) => roles.map(({ name, id, isDefault }) => {
      return {
        name,
        id: id.toString(),
        isDefault
      };
    }));
};

export const LOAD_DATA = 'LOAD_DATA';
export const loadData = () => (dispatch) => {
  const ACTION = {
    type: LOAD_DATA
  };

  dispatch({ ...ACTION, stage: START });
  return Promise.all([loadUsers(), loadRoles()])
    .then(([users, roles]) => {
      dispatch({
        ...ACTION,
        stage: COMPLETE_SUCCESS,
        users,
        roles
      });
    });
};
