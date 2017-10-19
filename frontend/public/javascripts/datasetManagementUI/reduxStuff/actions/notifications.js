import uuid from 'uuid';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (kind, subject, attrs) => ({
  type: ADD_NOTIFICATION,
  notification: {
    id: uuid(),
    kind,
    subject,
    ...(attrs || {})
  }
});

export const UPDATE_NOTIFICATION = 'UPDATE_NOTIFICATION';
export const updateNotification = (subject, change) => ({
  type: UPDATE_NOTIFICATION,
  notification: {
    subject,
    change
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
