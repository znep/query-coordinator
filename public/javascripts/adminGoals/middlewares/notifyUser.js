import { showNotification } from '../actions/notificationActions';
import translator from '../helpers/translator';

/**
 * This middleware dispatches SHOW_GLOBAL_NOTIFICATION actions if
 * the dispatched action object has notification field set.
 *
 * To show a notification to the user please make sure type and
 * message fields in notification objects are set.
 *
 * Examples
 * ========
 *
 * Direct notification:
 * {
 *   type: SOME_ACTION_TYPE,
 *   notification: {
 *     type: 'success',
 *     message: 'Some direct message'
 *   }
 * }
 *
 * Using translation:
 * {
 *   type: SOME_ACTION_TYPE,
 *   notification: {
 *     type: 'success',
 *     message: {
 *       path: 'admin.bulk_edit.success_message', // {0} Items updated
 *       values: [12]
 *     }
 *   }
 * }
 */
const usageWarning = 'Please do not use notification field in your action object.' +
  ' Notification field is reserved for showing global notification messages to user.' +
  ' If you are trying to show a notification make sure you add type and message fields into it.';

export default store => next => action => {
  const result = next(action);
  const translations = store.getState().get('translations');
  const notification = action.notification;

  if (action.notification) {
    if (!action.notification.type || !action.notification.message) {
      if (window.serverConfig.environment === 'development') {
        console.error(usageWarning);
      }
    } else {
      if (typeof notification.message === 'object') {
        const message = translator(translations, notification.message.path, notification.message.values);
        store.dispatch(showNotification(notification.type, message));
      } else {
        store.dispatch(showNotification(notification.type, notification.message));
      }
    }
  }

  return result;
};
