import 'whatwg-fetch';
import { get as getCookie } from 'browser-cookies';

export function getNotifications(callback) {
  fetch('/notifications', { credentials: 'same-origin' })
    .then(response => response.json())
    .then(
      callback,
      () => {
        callback(null);
      }
    ).catch(() => {
      callback(null);
    });
}

export function updateNotificationLastSeen() {
  /* eslint-disable-next-line no-undef */
  const headers = new Headers();
  headers.append('X-CSRF-Token', getCookie('socrata-csrf-token'));

  fetch('/notifications/setLastNotificationSeenAt', {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers
  });
}
