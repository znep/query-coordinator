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

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

export function updateNotificationLastSeen() {
  /* eslint-disable-next-line no-undef */
  const headers = new Headers();
  headers.append('X-CSRF-Token', getCookie('socrata-csrf-token'));

  fetch('/notifications/setLastNotificationSeenAt', {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers
  }).then(checkStatus).catch(function(error) {
    if (error.response.status === 401) {
      console.warn("Unable to update notification last seen due to failed authorization. This is probably as the result of an expired session cookie.");
    } else {
      console.log("Unable to update notification last seen due to an unknown error: " + error);
    }
  });
}
