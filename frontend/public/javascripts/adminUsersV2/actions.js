import { defaultHeaders, fetchJson } from 'common/http';
import CoreFutureAccountsApi from 'common/core-future-accounts-api';
import CoreRolesApi from 'common/core-roles-api';
import * as Validators from './validators';

import _ from 'lodash';

// Async Stages
export const START = 'START';
export const COMPLETE_SUCCESS = 'COMPLETE_SUCCESS';
export const COMPLETE_FAIL = 'COMPLETE_FAIL';
export const VALIDATION_FAIL = 'VALIDATION_FAIL';

export const USER_ROLE_CHANGE = 'USER_ROLE_CHANGE';
export const changeUserRole = (userId, newRole) => dispatch => {
  const ACTION = {
    type: USER_ROLE_CHANGE,
    userId,
    newRole
  };

  dispatch({ ...ACTION, stage: START });
  return CoreRolesApi.assignRoleToUser({ userId, roleId: newRole }).then(
    () => {
      dispatch({ ...ACTION, stage: COMPLETE_SUCCESS });
    },
    err => {
      console.error(err);
      dispatch({ ...ACTION, stage: COMPLETE_FAIL });
      if (err.status == 400) {
        err.json().then(
          data => {
            if (data.message === 'Cannot change your own role') {
              dispatch(
                showNotification({ translationKey: 'users.errors.own_role' }, 'error')
              );
            } else {
              dispatch(
                showNotification({ translationKey: 'users.errors.unknown' }, 'error')
              );
            }
          }
        );
      }
    }
  );
};

const convertUserListFromApi = users => {
  return users.map(user => {
    user.role_id = user.role_id.toString();
    const converted = {};
    Object.keys(user).forEach(key => {
      converted[_.camelCase(key)] = user[key];
    });
    return converted;
  });
};

const loadUsers = query => {
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  let apiPath = `/api/catalog/v1/users?domain=${serverConfig.domain}`;
  if (!_.isEmpty(query)) {
    apiPath = `${apiPath}&q=${query}`;
  }

  return fetchJson(apiPath, fetchOptions).
    then(json => json.results).
    then(convertUserListFromApi);
};

const loadFutureUsers = () =>
  CoreFutureAccountsApi.getFutureUsers().
    then(values => values.map(value => _.pick(value, ['createdAt', 'email', 'id', 'pendingRoleId']))).
    catch(error => {
      console.warn('Unable to load future users, showing empty list.', error);
      return [];
    });

const loadRoles = () => {
  return CoreRolesApi.getAllRoles().then(roles =>
    roles.map(({ name, id, isDefault }) => {
      return {
        name,
        id: id.toString(),
        isDefault
      };
    })
  );
};

export const LOAD_DATA = 'LOAD_DATA';
export const loadData = () => dispatch => {
  const ACTION = {
    type: LOAD_DATA
  };

  dispatch({ ...ACTION, stage: START });
  return Promise.all([loadUsers(), loadRoles(), loadFutureUsers()]).then(([users, roles, futureUsers]) => {
    dispatch({
      ...ACTION,
      stage: COMPLETE_SUCCESS,
      users,
      roles,
      futureUsers
    });
  });
};

export const USER_SEARCH = 'USER_SEARCH';
export const userSearch = query => dispatch => {
  const ACTION = {
    type: USER_SEARCH,
    query
  };

  dispatch({ ...ACTION, stage: START });
  return loadUsers(query).then(users => dispatch({ ...ACTION, stage: COMPLETE_SUCCESS, users }));
};

export const userAutocomplete = (query, callback) => {
  if (query === '') {
    return;
  }

  const apiPath = `/api/catalog/v1/users/autocomplete?domain=${serverConfig.domain}&q=${query}`;

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  fetchJson(apiPath, fetchOptions).
    then(searchResults => {
      return {
        ...searchResults,
        results: searchResults.results.map(result => {
          return {
            ...result,
            title: result.user.screen_name
          };
        })
      };
    }).
    then(searchResults => callback(searchResults), error => console.error('Failed to fetch data', error)).
    catch(ex => console.error('Error parsing JSON', ex));
};

export const removeUserRole = (userId, roleId) => dispatch => {
  const ACTION = {
    type: USER_ROLE_CHANGE,
    userId,
    newRole: 'none'
  };

  dispatch({ ...ACTION, stage: START });
  CoreRolesApi.removeRoleFromUser({ userId, roleId }).then(
    () => {
      dispatch({ ...ACTION, stage: COMPLETE_SUCCESS });
    },
    err => {
      console.error(err);
      dispatch({ ...ACTION, stage: COMPLETE_FAIL });
    }
  );
};

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const showNotification = (content, type = 'default') => dispatch => {
  const timeout = setTimeout(() => {
    dispatch({ type: SHOW_NOTIFICATION, stage: COMPLETE_SUCCESS });
  }, 2500);
  dispatch({ type: SHOW_NOTIFICATION, stage: START, payload: { content, timeout, type } });
};

export const TOGGLE_ADD_USER_UI = 'TOGGLE_ADD_USER_UI';
export const toggleAddUserUi = (isOpen = false) => ({ type: TOGGLE_ADD_USER_UI, payload: { isOpen } });
export const cancelAddUser = () => dispatch => {
  dispatch(clearAddUserErrors());
  dispatch(toggleAddUserUi(false));
};

export const SET_ADD_USER_ERRORS = 'SET_ADD_USER_ERRORS';
export const setAddUserErrors = errors => ({ type: SET_ADD_USER_ERRORS, payload: { errors } });
export const clearAddUserErrors = () => ({ type: SET_ADD_USER_ERRORS, payload: { errors: [] } });

export const SUBMIT_NEW_USERS = 'SUBMIT_NEW_USERS';
const postNewUsers = (emails, roleId, dispatch) => {
  CoreFutureAccountsApi.postFutureUsers(emails, roleId).
    then(createdEmails => {
      const futureUsers = createdEmails.map((email, i) => ({
        createdAt: Date.now() / 1000,
        email,
        id: Date.now() + i,
        pendingRoleId: roleId
      }));
      dispatch({ type: SUBMIT_NEW_USERS, stage: COMPLETE_SUCCESS, payload: { futureUsers } });
      dispatch(toggleAddUserUi(false));
    }).
    catch(error => {
      console.warn(error);
      const errors =
        error instanceof CoreFutureAccountsApi.FutureAccountsCreationError
          ? error.errors
          : [{ translationKey: 'users.errors.server_error_html' }];

      dispatch({ type: SUBMIT_NEW_USERS, stage: COMPLETE_FAIL, payload: { errors } });
      dispatch(setAddUserErrors(errors));
    });
};

export const submitNewUsers = (emails, id) => dispatch => {
  const roleId = parseInt(id, 10);
  dispatch({ type: SUBMIT_NEW_USERS, stage: START, payload: { emails, roleId } });
  dispatch(clearAddUserErrors());
  const validation = Validators.isValidEmailGroup(emails).concat(Validators.isValidRoleId(roleId));
  validation.matchWith({
    Success: () => postNewUsers(emails, roleId, dispatch),
    Failure: failedValidation => {
      const validationErrors = failedValidation.value;
      dispatch({ type: SUBMIT_NEW_USERS, stage: VALIDATION_FAIL, payload: { validationErrors } });
      dispatch(setAddUserErrors(validationErrors));
    }
  });
};

export const REMOVE_FUTURE_USER = 'REMOVE_FUTURE_USER';
export const removeFutureUser = (id) => dispatch => {
  dispatch({ type: REMOVE_FUTURE_USER, stage: START, payload: { id }});
  CoreFutureAccountsApi.removeFutureUser(id).
    then(() => {
      dispatch({ type: REMOVE_FUTURE_USER, stage: COMPLETE_SUCCESS, payload: { id }});
      dispatch(showNotification({ translationKey: 'users.notifications.pending_user_removed' }, 'success'));
    }).
    catch(error => {
      dispatch({ type: REMOVE_FUTURE_USER, stage: COMPLETE_FAIL, payload: { id, error }});
      dispatch(showNotification({ translationKey: 'users.errors.server_error_html' }, 'error'));
    });
};

export const RESEND_FUTURE_USER_EMAIL = 'RESEND_FUTURE_USER_EMAIL';
export const resendPendingUserEmail = (email) => dispatch => {
  dispatch({ type: RESEND_FUTURE_USER_EMAIL, stage: START, payload: { email }});
  CoreFutureAccountsApi.resendFutureUserEmail(email).
  then(() => {
    dispatch({ type: RESEND_FUTURE_USER_EMAIL, stage: COMPLETE_SUCCESS, payload: { email }});
    dispatch(showNotification({ translationKey: 'users.notifications.resent_email_success' }, 'success'));
  }).
  catch(error => {
    dispatch({ type: RESEND_FUTURE_USER_EMAIL, stage: COMPLETE_FAIL, payload: { email, error }});
    dispatch(showNotification({ translationKey: 'users.errors.server_error_html' }, 'error'));
  });
};
