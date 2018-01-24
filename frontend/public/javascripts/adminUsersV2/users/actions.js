export const LOAD_USERS = 'LOAD_USERS';
export const LOAD_USERS_SUCCESS = 'LOAD_USERS_SUCCESS';
export const LOAD_USERS_FAILURE = 'LOAD_USERS_FAILURE';

export const loadUsers = () => ({ type: LOAD_USERS });
export const loadUsersSuccess = (users, resultCount) => ({
  type: LOAD_USERS_SUCCESS,
  payload: { users, resultCount }
});
export const loadUsersFailure = error => ({ type: LOAD_USERS_FAILURE, error: true, payload: { error } });

export const USER_SEARCH = 'USER_SEARCH';
export const USER_SEARCH_SUCCESS = 'USER_SEARCH_SUCCESS';
export const USER_SEARCH_FAILURE = 'USER_SEARCH_FAILURE';

export const userSearch = query => ({ type: USER_SEARCH, payload: { query } });
export const userSearchSuccess = (users, resultCount) => ({
  type: USER_SEARCH_SUCCESS,
  payload: { users, resultCount }
});
export const userSearchFailure = error => ({ type: USER_SEARCH_FAILURE, error: true, payload: { error } });

export const USER_AUTOCOMPLETE = 'USER_AUTOCOMPLETE';
export const userAutocomplete = (query, callback) => ({
  type: USER_AUTOCOMPLETE,
  payload: { query, callback }
});

export const CLEAR_ADD_USERS_FORM_ERRORS = 'CLEAR_ADD_USERS_FORM_ERRORS';
export const SET_ADD_USERS_FORM_ERRORS = 'SET_ADD_USERS_FORM_ERRORS';
export const clearAddUsersFormErrors = () => ({ type: CLEAR_ADD_USERS_FORM_ERRORS });
export const setAddUsersFormErrors = errors => ({ type: SET_ADD_USERS_FORM_ERRORS, payload: { errors } });

export const SHOW_ADD_USERS_MODAL = 'SHOW_ADD_USERS_MODAL';
export const HIDE_ADD_USERS_MODAL = 'HIDE_ADD_USERS_MODAL';
export const DISABLE_ADD_USERS_MODAL = 'DISABLE_ADD_USERS_MODAL';
export const ENABLE_ADD_USERS_MODAL = 'ENABLE_ADD_USERS_MODAL';
export const CANCEL_ADD_USERS_MODAL = 'CANCEL_ADD_USERS_MODAL';
export const SUBMIT_ADD_USERS_MODAL = 'SUBMIT_ADD_USERS_MODAL';
export const showAddUsersModal = () => ({ type: SHOW_ADD_USERS_MODAL });
export const hideAddUsersModal = () => ({ type: HIDE_ADD_USERS_MODAL });
export const disableAddUsersModal = () => ({ type: DISABLE_ADD_USERS_MODAL });
export const enableAddUsersModal = () => ({ type: ENABLE_ADD_USERS_MODAL });
export const cancelAddUsersModal = () => ({ type: CANCEL_ADD_USERS_MODAL });
export const submitAddUsersModal = () => ({ type: SUBMIT_ADD_USERS_MODAL });

export const CHANGE_ADD_USERS_FORM = 'CHANGE_ADD_USERS_FORM';
export const CLEAR_ADD_USERS_FORM = 'CLEAR_ADD_USERS_FORM';
export const changeAddUsersForm = (emails, roleId) => ({
  type: CHANGE_ADD_USERS_FORM,
  payload: { emails, roleId }
});
export const clearAddUsersForm = () => ({ type: CLEAR_ADD_USERS_FORM });

export const ADD_USERS = 'ADD_USERS';
export const ADD_USERS_SUCCESS = 'ADD_USERS_SUCCESS';
export const ADD_USERS_FAILURE = 'ADD_USERS_FAILURE';
export const addUsers = () => ({ type: ADD_USERS });
export const addUsersSuccess = invitedUsers => ({ type: ADD_USERS_SUCCESS, payload: { invitedUsers } });
export const addUsersFailure = errors => ({ type: ADD_USERS_FAILURE, error: true, payload: { errors } });

export const RESET_PASSWORD = 'RESET_PASSWORD';
export const resetPassword = userId => ({ type: RESET_PASSWORD, payload: { userId } });

export const GOTO_USER_PAGE = 'GOTO_USER_PAGE';
export const gotoUserPage = page => ({ type: GOTO_USER_PAGE, payload: { page } });

export const SORT_USER_COLUMN = 'SORT_USER_COLUMN';
export const sortUserColumn = columnKey => ({ type: SORT_USER_COLUMN, payload: { columnKey } });
