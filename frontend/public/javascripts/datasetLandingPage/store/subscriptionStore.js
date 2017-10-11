import 'whatwg-fetch';
import airbrake from 'common/airbrake';
import { defaultHeaders } from 'common/http';

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
        error: `Error while subscribe dataset: ${errorMessage}`
      });
    } catch (err) {}
    throw new Error(errorMessage);
  }
}

export const subscriptionStore = (() => {
  return {
    subscribe: (datasetId) => {
      return fetch('/api/notifications_and_alerts/subscriptions', {
        method: 'POST',
        headers: defaultHeaders,
        credentials: 'same-origin',
        body: JSON.stringify({
          subscription: {
            domain: window.location.host,
            dataset: datasetId,
            activity: 'WATCH_DATASET'
          }
        })
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((subscribedResult) => subscribedResult.data);
    },
    unsubscribe: (subscriptionId) => {
      return fetch(`/api/notifications_and_alerts/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: defaultHeaders,
        credentials: 'same-origin'
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((unsubscribedResult) => unsubscribedResult.data);
    }
  };
})();

export default subscriptionStore;
