export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (notification) => ({
  type: ADD_NOTIFICATION,
  notification
});

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const removeNotification = (notification) => ({
  type: REMOVE_NOTIFICATION,
  notification
});

const NOTIFICATION_TIMEOUT_MS = 5000;

export function removeNotificationAfterTimeout(notification) {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(removeNotification(notification));
    }, NOTIFICATION_TIMEOUT_MS);
  };
}
