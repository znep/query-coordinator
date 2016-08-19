export const types = {
  show: 'notification.showGlobal',
  hide: 'notification.hideGlobal'
};

/**
 * WARNING!
 *
 * Do not use showNotification action creator directly. Instead add `notification`
 * field to your action. Notification related actions will be dispatched
 * automatically by `notifyUser` middleware.
 *
 * Example:
 *
 * ```js
 * fetchGoalsFailed () {
 *   return {
 *     type: FETCH_GOALS_FAILED,
 *     notification: {
 *       type: 'error',
 *       message: 'Something went wrong...'
 *     }
 *   };
 * }
 * ```
 *
 * See: middlewares/notifyUser.js
 *
 * Action creator for showing global notification
 * @param {String} notificationType Alert type (default | info | success | warning | error)
 * @param {String} message Alert message
 * @returns {Object}
 */
export const showNotification = (notificationType, message) => ({
  type: types.show,
  notificationType,
  message
});

/**
 * Action creator for dismissing global notification
 * @returns {Object}
 */
export const dismissNotification = () => ({
  type: types.hide
});
