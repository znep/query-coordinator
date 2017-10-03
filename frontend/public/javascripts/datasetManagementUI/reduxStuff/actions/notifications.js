import uuid from 'uuid';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (kind, subject) => ({
  type: ADD_NOTIFICATION,
  notification: {
    id: uuid(),
    kind,
    subject
  }
});

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const removeNotification = subject => ({
  type: REMOVE_NOTIFICATION,
  subject
});

const NOTIFICATION_TIMEOUT_MS = 5000;

export const removeNotificationAfterTimeout = subject => dispatch =>
  setTimeout(() => {
    dispatch(removeNotification(subject));
  }, NOTIFICATION_TIMEOUT_MS);
