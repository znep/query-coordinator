import 'whatwg-fetch';
import airbrake from 'common/airbrake';
import _ from 'lodash';

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
        error: `Error while creating alert: ${errorMessage}`
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

export const createAlertApi = (() => {
  return {
    validate: (alertParams) => {
      return fetch('/api/notifications_and_alerts/alerts/validate_raw_soql', {
        method: 'POST',
        headers: getDefaultHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ alert: alertParams })
      }).
      then(checkStatus).
      then((response) => response.json());
    },
    create: (alertParams) => {
      return fetch('/api/notifications_and_alerts/alerts', {
        method: 'POST',
        headers: getDefaultHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ alert: alertParams })
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((response) => response.data);
    },
    update: (params, alertId) => {
      return fetch(`/api/notifications_and_alerts/alerts/${alertId}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ alert: params })
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((response) => response.data);
    },
    delete: (alertId) => {
      return fetch(`/api/notifications_and_alerts/alerts/${alertId}`, {
        method: 'DELETE',
        headers: getDefaultHeaders(),
        credentials: 'same-origin'
      }).
      then(checkStatus);
    }
  };
})();

export default createAlertApi;
