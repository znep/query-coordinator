import { defaultHeaders, checkStatus } from 'common/http';
import CoreApi from 'common/core-roles-api';

import _ from 'lodash';

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

const loadUsers = (query) => {
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  let apiPath = `/api/catalog/v1/users?domain=${serverConfig.domain}`;
  if (!_.isEmpty(query)) {
    apiPath = `${apiPath}&q=${query}`;
  }

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

export const USER_SEARCH = 'USER_SEARCH';
export const userSearch = (query) => (dispatch) => {
  const ACTION = {
    type: USER_SEARCH,
    query
  };

  dispatch({ ...ACTION, stage: START });
  return loadUsers(query)
    .then((users) => dispatch({ ...ACTION, stage: COMPLETE_SUCCESS, users }));
};

export const userAutocomplete = (query, callback) => {
  if (query === '') { return; }

  const apiPath = `/api/catalog/v1/users/autocomplete?domain=${serverConfig.domain}&q=${query}`;

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  fetch(apiPath, fetchOptions)
    .then((response) => response.json())
    .then((searchResults) => {
      return {
        ...searchResults,
        results: searchResults.results.map((result) => {
          return {
            ...result,
            title: result.user.screen_name
          };
        })
      };
    })
    .then(
      (searchResults) => callback(searchResults),
      (error) => console.error('Failed to fetch data', error)
    )
    .catch((ex) => console.error('Error parsing JSON', ex));
};
