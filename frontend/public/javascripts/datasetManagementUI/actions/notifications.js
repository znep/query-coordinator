import uuid from 'uuid';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (kind, callId, uploadId) => ({
  type: ADD_NOTIFICATION,
  notification: {
    id: uuid(),
    kind,
    callId,
    uploadId
  }
});

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const removeNotification = id => ({
  type: REMOVE_NOTIFICATION,
  id
});

const NOTIFICATION_TIMEOUT_MS = 5000;

export function removeNotificationAfterTimeout(id) {
  return dispatch => {
    setTimeout(() => {
      dispatch(removeNotification(id));
    }, NOTIFICATION_TIMEOUT_MS);
  };
}
