import { types as notificationTypes } from '../components/Notification';

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';
export const showNotification = (content, type = 'default') =>
  ({ type: SHOW_NOTIFICATION, payload: { content, type } });
export const showLocalizedNotification = (translationKey, type, options = {}) =>
  showNotification({ ...options, translationKey }, type);
export const showLocalizedSuccessNotification = (translationKey, options = {}) =>
  showLocalizedNotification(translationKey, notificationTypes.SUCCESS, options);
export const showLocalizedErrorNotification = (translationKey, options = {}) =>
  showLocalizedNotification(translationKey, notificationTypes.ERROR, options);
export const hideNotification = () => ({ type: HIDE_NOTIFICATION });
