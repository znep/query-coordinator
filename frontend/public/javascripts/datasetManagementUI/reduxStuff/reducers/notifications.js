import {
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION,
  UPDATE_NOTIFICATION
} from 'datasetManagementUI/reduxStuff/actions/notifications';

export default function notificationReducer(state = [], action) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return [...state, action.notification];

    case UPDATE_NOTIFICATION:
      return state.map(notification => {
        if (notification.subject === action.notification.subject) {
          return { ...notification, ...action.notification.change };
        }
        return notification;
      });

    case REMOVE_NOTIFICATION:
      return state.filter(notification => (
        notification.subject !== action.subject && notification.id !== action.subject
      ));

    default:
      return state;
  }
}
