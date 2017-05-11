export const types = {
  show: 'notification.show',
  hide: 'notification.hide'
};

/**
 * Action creator for showing global notification.
 * @param {String} notificationType Alert type (default | info | success | warning | error)
 * @param {String} message Alert message
 * @returns {Object}
 */
export const showNotification = (notificationType, message) => (dispatch) => {
  dispatch({
    type: types.show,
    notificationType,
    message
  });
  setTimeout(
    () => {
      dispatch({
        type: types.hide
      });
    },
    6000
  );
};

