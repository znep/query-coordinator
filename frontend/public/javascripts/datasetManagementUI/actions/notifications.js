import uuid from 'uuid';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (kind, callId, sourceId) => ({
  type: ADD_NOTIFICATION,
  notification: {
    id: uuid(),
    kind,
    callId,
    sourceId
  }
});

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const removeNotification = id => ({
  type: REMOVE_NOTIFICATION,
  id
});

const NOTIFICATION_TIMEOUT_MS = 5000;

export const removeNotificationAfterTimeout = id => dispatch =>
  setTimeout(() => {
    dispatch(removeNotification(id));
  }, NOTIFICATION_TIMEOUT_MS);
