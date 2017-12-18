import { combineReducers } from 'redux';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import { COMPLETE_SUCCESS, LOAD_DATA, SHOW_NOTIFICATION, START } from './actions';
import { TOGGLE_ADD_USER_UI, SUBMIT_NEW_USERS, SET_ADD_USER_ERRORS } from './users/actions';
import { ROLE_FILTER_CHANGED } from './roles/actions';
import invitedUsers from './invitedUsers/reducers';
import roles from './roles/reducers';
import users, * as fromUsers from './users/reducers';

import get from 'lodash/get';

const initialUiState = {
  addUserErrors: [],
  notificationContent: '',
  notificationType: 'default',
  notificationTimeout: null,
  showAddUserUi: false,
  showNotification: false,
  loadingData: true
};

const ui = (state = initialUiState, action) => {
  switch (action.type) {
    case SET_ADD_USER_ERRORS:
      return {
        ...state,
        addUserErrors: get(action, 'payload.errors', [])
      };
    case SHOW_NOTIFICATION:
      if (action.stage === START) {
        return {
          ...state,
          showNotification: true,
          notificationTimeout: get(action, 'payload.timeout', null),
          notificationType: get(action, 'payload.type', 'default'),
          notificationContent: get(action, 'payload.content', '')
        };
      } else if (action.stage === COMPLETE_SUCCESS) {
        return {
          ...state,
          showNotification: false,
          notificationTimeout: null
        };
      }
      return state;
    case TOGGLE_ADD_USER_UI:
      return {
        ...state,
        showAddUserUi: get(action, 'payload.isOpen', !state.showAddUserUi)
      };
    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return {
          ...state,
          loadingData: false
        };
      }
      return state;
    case SUBMIT_NEW_USERS:
      if (action.stage === START) {
        return {
          ...state,
          submittingUsers: true
        };
      } else {
        return {
          ...state,
          submittingUsers: false
        };
      }
    default:
      return state;
  }
};

const config = (state = {}) => state;

const filters = (state = {}, action) => {
  switch (action.type) {
    case ROLE_FILTER_CHANGED:
      if (action.roleId === 'all') {
        return {
          ...state,
          role_ids: undefined
        };
      } else {
        return {
          ...state,
          role_ids: action.roleId
        };
      }
    default:
      return state;
  }
};

export const getFilters = state => state.filters;
export const getUsersCurrentPage = state => fromUsers.getCurrentPage(state.users);
export const getUsersOffset = state => fromUsers.getOffset(state.users);
export const getUsersOrderBy = state => fromUsers.getOrderBy(state.users);
export const getUsersSortDirection = state => fromUsers.getSortDirection(state.users);
export const getUsersResultCount = state => fromUsers.getResultCount(state.users);
export const getUsers = state => fromUsers.getUsers(state.users);
export const getUsersQuery = state => get(state, 'autocomplete.query');
export const getLoadingData = state => get(state, 'ui.loadingData');
export const getUsersResultsLimit = state => get(state, 'config.usersResultsLimit');
export const getUsersLoadingData = state => fromUsers.getLoadingData(state.users);
export const getAddUserErrors = state => get(state, 'ui.addUserErrors');

export default combineReducers({
    ui,
    users,
    invitedUsers,
    roles,
    config,
    autocomplete,
    filters
  });
