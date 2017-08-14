import { ADD_NOTIFICATION, REMOVE_NOTIFICATION } from 'reduxStuff/actions/notifications';

export default function notificationReducer(state = [], action) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return [...state, action.notification];

    case REMOVE_NOTIFICATION:
      return state.filter(notification => notification.id !== action.id);

    default:
      return state;
  }
}
