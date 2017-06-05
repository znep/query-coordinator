import { ADD_NOTIFICATION, REMOVE_NOTIFICATION } from 'actions/notifications';

export default function notificationReducer(state = [], action) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return [...state, action.notification];

    case REMOVE_NOTIFICATION:
      return state.filter(notification => notification.callId !== action.callId);

    default:
      return state;
  }
}
