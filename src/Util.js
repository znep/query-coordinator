/* eslint-disable no-console */
import 'whatwg-fetch';

// eslint-disable-next-line
export function getNotifications(callback) {
  fetch('/notifications', { credentials: 'same-origin' })
    .then(response => response.json())
    .then(
      callback,
      (error) => {
        console.error('Failed to fetch data', error);
        callback(null);
      },
    ).catch((ex) => {
      console.error('Error parsing JSON', ex);
      callback(null);
    });
}

export function updateNotificationLastSeen(dateTime) {
  fetch(
    `/api/notifications?method=setLastNotificationSeenAt&dateTime=${dateTime.getTime()}`, {
      method: 'PATCH',
      credentials: 'same-origin'
    });
}
