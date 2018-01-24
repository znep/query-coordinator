import * as RolesActions from '../roles/actions';
import * as Actions from './actions';
import { SORT_KEYS, SORT_DIRECTION } from 'common/users-api';

import get from 'lodash/fp/get';
import flow from 'lodash/fp/flow';
import add from 'lodash/fp/add';

export const initialState = {
  addUsersForm: { emails: '', roleId: null, errors: [] },
  filterRoleId: null,
  loadingData: true,
  orderBy: SORT_KEYS.SCREEN_NAME,
  resultCount: 0,
  searchQuery: null,
  searchResultCount: undefined,
  sortDirection: SORT_DIRECTION.ASC,
  users: [],
  zeroBasedPage: 0
};

const handleLoadUsers = state => ({
  ...state,
  loadingData: true
});

const handleLoadUsersSuccess = (state, { users, resultCount }) => ({
  ...state,
  loadingData: false,
  users,
  resultCount
});

const handleLoadUsersFailure = (state) => ({
  ...state,
  loadingData: false
});

const handleChangeUserRole = (state, { userId, newRole }) => ({
  ...state,
  users: state.users.map(user => user.id === userId ?
    { ...user, pendingRole: newRole } :
    user
  )
});

const handleChangeUserRoleSuccess = (state, { userId, newRole, newRoleName }) => ({
  ...state,
  users: state.users.map(user => user.id === userId ?
    { ...user, pendingRole: undefined, roleId: newRole, roleName: newRoleName } :
    user
  )
});

const handleChangeUserRoleFailure = (state, { userId }) => ({
  ...state,
  users: state.users.map(user => user.id === userId ?
    { ...user, pendingRole: undefined } :
    user
  )
});

const handleRemoveUserRole = (state, { userId }) => ({
  ...state,
  users: state.users.map(user => user.id === userId ?
    { ...user, removingRole: true } :
    user
  )
});

const handleRemoveUserRoleSuccess = (state, { userId }) => ({
  ...state,
  users: state.users.filter(user => user.id !== userId)
});

const handleRemoveUserRoleFailure = (state, { userId }) => ({
  ...state,
  users: state.users.map(user => user.id === userId ?
    { ...user, removingRole: undefined } :
    user
  )
});

const handleUserSearch = state => ({
  ...state,
  loadingData: true
});

const handleUserSearchSuccess = (state, { users, resultCount }) => ({
  ...state,
  loadingData: false,
  searchResultCount: resultCount,
  users
});

const handleUserSearchFailure = state => ({
  ...state,
  loadingData: false,
  searchResultCount: undefined,
  users: []
});

const handleGotoPage = (state, { page }) => ({
  ...state,
  zeroBasedPage: makeZeroBasedPageFromPager(page)
});

const handleColumnSort = (state, { columnKey }) => {
  const orderBy = getOrderBy(state);
  const sortDirection = getSortDirection(state);
  if (orderBy !== columnKey) {
    return { ...state, orderBy: columnKey, sortDirection: initialState.sortDirection };
  } else {
    return { ...state, sortDirection: SORT_DIRECTION[Object.values(SORT_DIRECTION).filter(val => val !== sortDirection)[0]] };
  }
};

const handleChangeAddUsersForm = (state, { emails, roleId }) => ({
  ...state,
  addUsersForm: { emails, roleId, errors: [] }
});

const handleSetAddUsersFormErrors = (state, { errors }) => ({
  ...state,
  addUsersForm: { ...state.addUsersForm, errors }
});

const handleClearAddUsersForm = state => ({
  ...state,
  addUsersForm: { ...initialState.addUsersForm }
});

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case RolesActions.CHANGE_USER_ROLE:
      return handleChangeUserRole(state, payload);
    case RolesActions.CHANGE_USER_ROLE_SUCCESS:
      return handleChangeUserRoleSuccess(state, payload);
    case RolesActions.CHANGE_USER_ROLE_FAILURE:
      return handleChangeUserRoleFailure(state, payload);

    case RolesActions.REMOVE_USER_ROLE:
      return handleRemoveUserRole(state, payload);
    case RolesActions.REMOVE_USER_ROLE_SUCCESS:
      return handleRemoveUserRoleSuccess(state, payload);
    case RolesActions.REMOVE_USER_ROLE_FAILURE:
      return handleRemoveUserRoleFailure(state, payload);

    case Actions.LOAD_USERS:
      return handleLoadUsers(state, payload);
    case Actions.LOAD_USERS_SUCCESS:
      return handleLoadUsersSuccess(state, payload);
    case Actions.LOAD_USERS_FAILURE:
      return handleLoadUsersFailure(state, payload);

    case Actions.USER_SEARCH:
      return handleUserSearch(state, payload);
    case Actions.USER_SEARCH_SUCCESS:
      return handleUserSearchSuccess(state, payload);
    case Actions.USER_SEARCH_FAILURE:
      return handleUserSearchFailure(state, payload);

    case Actions.CHANGE_ADD_USERS_FORM:
      return handleChangeAddUsersForm(state, payload);

    case Actions.SET_ADD_USERS_FORM_ERRORS:
      return handleSetAddUsersFormErrors(state, payload);

    case Actions.GOTO_USER_PAGE:
      return handleGotoPage(state, payload);

    case Actions.SORT_USER_COLUMN:
      return handleColumnSort(state, payload);

    case Actions.CLEAR_ADD_USERS_FORM:
      return handleClearAddUsersForm(state);

    default:
      return state;
  }
};

export default reducer;

export const makeZeroBasedPageFromPager = page => Math.max(0, page - 1);
export const getZeroBasedPage = get('zeroBasedPage');
export const getCurrentPage = flow(getZeroBasedPage, add(1));
export const getResultCount = get('resultCount');
export const getUsers = get('users');
export const getOrderBy = get('orderBy');
export const getSortDirection = get('sortDirection');
export const getLoadingData = get('loadingData');
export const getScreenNameFromUser = get('screen_name');
export const getEmailFromUser = get('email');
export const getIdFromUser = get('id');
export const getSearchResultCount = get('searchResultCount');

export const getAddUsersForm = get('addUsersForm');
export const getAddUsersFormEmails = flow(getAddUsersForm, get('emails'));
export const getAddUsersFormRoleId = flow(getAddUsersForm, get('roleId'));
export const getAddUsersFormErrors = flow(getAddUsersForm, get('errors'));
