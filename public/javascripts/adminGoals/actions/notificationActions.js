import {
  SHOW_GLOBAL_NOTIFICATION,
  DISMISS_GLOBAL_NOTIFICATION
} from '../actionTypes';

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
 * @param {String} type Alert type (default | info | success | warning | error)
 * @param {String} message Alert message
 * @returns {Object}
 */
export function showNotification(notificationType, message) {
  return {
    type: SHOW_GLOBAL_NOTIFICATION,
    notificationType,
    message
  };
}

/**
 * Action creator for dismissing global notification
 * @returns {Object}
 */
export function dismissNotification() {
  return {
    type: DISMISS_GLOBAL_NOTIFICATION
  };
}
