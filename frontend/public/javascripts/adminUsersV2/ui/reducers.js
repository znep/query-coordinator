import * as Actions from './actions';
import * as UsersActions from '../users/actions';
import get from 'lodash/fp/get';

const initialUiState = {
  notificationContent: '',
  notificationType: 'default',
  showAddUsersModal: false,
  addUsersModalDisabled: false,
  showNotification: false,
  submittingUsers: false,
  loadingData: true
};

const handleShowNotification = (state, { type, content }) => ({
  ...state,
  showNotification: true,
  notificationType: type,
  notificationContent: content
});

const handleHideNotification = (state) => ({
  ...state,
  showNotification: false
});

const handleShowAddUsersModal = state => ({
  ...state,
  showAddUsersModal: true
});

const handleHideAddUsersModal = state => ({
  ...state,
  showAddUsersModal: false
});

const handleAddUsersComplete = state => ({
  ...state,
  submittingUsers: false
});

const handleEnableUsersModal = state => ({
  ...state,
  addUsersModalDisabled: false
});

const handleDisableUsersModal = state => ({
  ...state,
  addUsersModalDisabled: true
});

const reducer = (state = initialUiState, { type, payload }) => {
  switch (type) {
    case Actions.SHOW_NOTIFICATION:
      return handleShowNotification(state, payload);

    case Actions.HIDE_NOTIFICATION:
      return handleHideNotification(state);

    case UsersActions.SHOW_ADD_USERS_MODAL:
      return handleShowAddUsersModal(state);

    case UsersActions.HIDE_ADD_USERS_MODAL:
      return handleHideAddUsersModal(state);

    case UsersActions.ENABLE_ADD_USERS_MODAL:
      return handleEnableUsersModal(state);

    case UsersActions.DISABLE_ADD_USERS_MODAL:
      return handleDisableUsersModal(state);

    case UsersActions.ADD_USERS_SUCCESS:
    case UsersActions.ADD_USERS_FAILURE:
      return handleAddUsersComplete(state);

    default:
      return state;
  }
};

export const getNotificationContent = get('notificationContent');
export const getNotificationType = get('notificationType');
export const getShowNotification = get('showNotification');
export const getShowAddUsersModal = get('showAddUsersModal');
export const getAddUsersModalDisabled = get('addUsersModalDisabled');

export default reducer;
