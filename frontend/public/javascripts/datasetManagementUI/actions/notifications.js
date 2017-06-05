export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const addNotification = (kind, showDetails, callId, uploadId) => ({
  type: ADD_NOTIFICATION,
  notification: {
    kind,
    showDetails,
    callId,
    uploadId
  }
});

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const removeNotification = callId => ({
  type: REMOVE_NOTIFICATION,
  callId
});

const NOTIFICATION_TIMEOUT_MS = 5000;

export function removeNotificationAfterTimeout(callId) {
  return dispatch => {
    setTimeout(() => {
      dispatch(removeNotification(callId));
    }, NOTIFICATION_TIMEOUT_MS);
  };
}
