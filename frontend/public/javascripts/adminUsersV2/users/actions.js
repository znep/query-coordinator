import CoreFutureAccountsApi from 'common/core-future-accounts-api';
import * as Validators from '../validators';
import { showNotification, START, COMPLETE_SUCCESS, COMPLETE_FAIL } from '../actions';
import UsersApi from 'common/users-api';
import { getFilters, getUsersOffset, getUsersOrderBy, getUsersResultsLimit, getUsersSortDirection } from '../reducers';
import { loadInvitedUsers } from '../invitedUsers/actions';

// Async Stages
export const VALIDATION_FAIL = 'VALIDATION_FAIL';

export const loadUsers = (options = {}) => UsersApi.getUsers(serverConfig.domain, options);

export const USER_SEARCH = 'USER_SEARCH';
export const userSearch = query => (dispatch, getState) => {
  const ACTION = {
    type: USER_SEARCH,
    query
  };
  const state = getState();
  const filters = getFilters(state);
  const offset = getUsersOffset(state);
  const limit = getUsersResultsLimit(state);
  const orderBy = getUsersOrderBy(state);
  const sortDirection = getUsersSortDirection(state);
  dispatch({ ...ACTION, stage: START });
  return loadUsers({ query, filters, limit, offset, orderBy, sortDirection }).
    then(results => dispatch({ ...ACTION, stage: COMPLETE_SUCCESS, payload: results })).
    catch(ex => console.error('Error parsing JSON', ex));
};

export const userAutocomplete = (query, callback) => {
  if (query === '') {
    return;
  }

  UsersApi.autocomplete(serverConfig.domain, query).
    then(searchResults => callback(searchResults), error => console.error('Failed to fetch data', error)).
    catch(ex => console.error('Error parsing JSON', ex));
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
    then(loadInvitedUsers).
    then(invitedUsers => {
      dispatch({ type: SUBMIT_NEW_USERS, stage: COMPLETE_SUCCESS, payload: { invitedUsers } });
      dispatch(toggleAddUserUi(false));
      dispatch(showNotification({ translationKey: 'users.notifications.add_user_success' }, 'success'));
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

export const RESET_PASSWORD = 'RESET_PASSWORD';
export const resetPassword = userId => dispatch => {
  dispatch({ type: RESET_PASSWORD, stage: START, userId });
  UsersApi.resetPassword(userId).
    then(response => {
      if (response.success) {
        dispatch({ type: RESET_PASSWORD, stage: COMPLETE_SUCCESS, userId });
        dispatch(showNotification({ translationKey: 'users.notifications.password_reset' }, 'success'));
      } else {
        dispatch(showNotification({ translationsKey: 'users.errors.unknown' }, 'error'));
      }
    }).
    catch(err => {
      console.error(err);
    });
};

export const GOTO_PAGE = 'GOTO_PAGE';
export const gotoPage = page => dispatch => {
  dispatch({ type: GOTO_PAGE, payload: { page }});
  dispatch(userSearch());
};

export const SORT_COLUMN = 'SORT_COLUMN';
export const sortColumn = columnKey => dispatch => {
  dispatch({ type: SORT_COLUMN, payload: { columnKey }});
  dispatch(userSearch());
};
