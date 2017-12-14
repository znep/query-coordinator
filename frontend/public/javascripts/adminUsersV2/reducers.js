import { combineReducers } from 'redux';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import { COMPLETE_SUCCESS, LOAD_DATA, SHOW_NOTIFICATION, START } from './actions';
import { TOGGLE_ADD_USER_UI, SUBMIT_NEW_USERS, SET_ADD_USER_ERRORS } from './users/actions';
import { ROLE_FILTER_CHANGED } from './roles/actions';
import users from './users/reducers';
import invitedUsers from './invitedUsers/reducers';
import roles from './roles/reducers';

import _ from 'lodash';

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

const config = initialConfig => (state = initialConfig) => state;

const filters = initialFilters => (state = initialFilters, action) => {
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

export default (initialConfig, initialFilters) =>
  combineReducers({
    ui,
    users,
    invitedUsers,
    roles,
    config: config(initialConfig),
    autocomplete,
    filters: filters(initialFilters)
  });
