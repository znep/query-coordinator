import { combineReducers } from 'redux';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import {
  COMPLETE_FAIL,
  COMPLETE_SUCCESS,
  LOAD_DATA, REMOVE_FUTURE_USER,
  SET_ADD_USER_ERRORS, SHOW_NOTIFICATION,
  START,
  SUBMIT_NEW_USERS,
  TOGGLE_ADD_USER_UI,
  USER_ROLE_CHANGE,
  USER_SEARCH
} from './actions';
import _ from 'lodash';

const userRoleChange = (state, action) => {
  return state.map(user => {
    if (user.id !== action.userId) return user;
    switch (action.stage) {
      case START:
        return {
          ...user,
          pendingRole: action.newRole
        };
      case COMPLETE_FAIL:
        return {
          ...user,
          pendingRole: undefined
        };
      case COMPLETE_SUCCESS:
        return {
          ...user,
          pendingRole: undefined,
          roleId: action.newRole
        };
      default:
        console.warn(`Invalid stage ${action.stage} for action`, action);
        return user;
    }
  });
};

const users = (state = [], action) => {
  switch (action.type) {
    case USER_ROLE_CHANGE:
      return userRoleChange(state, action);

    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.users;
      }
      return state;

    case USER_SEARCH:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.users;
      }
      return state;

    default:
      return state;
  }
};

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
        addUserErrors: _.get(action, 'payload.errors', [])
      };
    case SHOW_NOTIFICATION:
      if (action.stage === START) {
        return {
          ...state,
          showNotification: true,
          notificationTimeout: _.get(action, 'payload.timeout', null),
          notificationType: _.get(action, 'payload.type', 'default'),
          notificationContent: _.get(action, 'payload.content', '')
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
        showAddUserUi: _.get(action, 'payload.isOpen', !state.showAddUserUi)
      };
    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return {
          ...state,
          loadingData: false
        };
      }
      return state;
    default:
      return state;
  }
};

const futureUsers = (state = [], action) => {
  switch (action.type) {
    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.futureUsers;
      }
      return state;
    case REMOVE_FUTURE_USER:
      if (action.stage === COMPLETE_SUCCESS) {
        return state.filter(user => user.id !== _.get(action, 'payload.id', null));
      }
      return state;
    case SUBMIT_NEW_USERS:
      if (action.stage === COMPLETE_SUCCESS) {
        return state.concat(_.get(action, 'payload.futureUsers', []));
      }
      return state;
    default:
      return state;
  }
};

const roles = (state = [], action) => {
  if (action.type === LOAD_DATA && action.stage === COMPLETE_SUCCESS) {
    return action.roles;
  } else {
    return state;
  }
};

const config = initialConfig => (state = initialConfig) => state;

const filters = initialFilters => (state = initialFilters) => state;

export default (initialConfig, initialFilters) =>
  combineReducers({
    ui,
    users,
    futureUsers,
    roles,
    config: config(initialConfig),
    autocomplete,
    filters: filters(initialFilters)
  });
