import 'whatwg-fetch';
import airbrake from 'common/airbrake';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

function checkStatus(response) {
  let errorMessage;
  if (response.status === 401 || response.status === 403) {
    // session may expired so we are reloading the page
    window.location.reload();
  } else if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    errorMessage = response.statusText;
    try {
      airbrake.notify({
        error: `Error while get my alerts: ${errorMessage}`
      });
    } catch (err) {
    }
    throw new Error(errorMessage);
  }
}


function getDefaultHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}


export const MyAlertsApi = (() => {
  return {
    get: () => {
      return fetch('/api/notifications_and_alerts/alerts', {
        method: 'GET',
        headers: getDefaultHeaders(),
        credentials: 'same-origin'
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((response) => response.data);
    }
  };
})();

export default MyAlertsApi;
