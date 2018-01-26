import 'whatwg-fetch';
import _ from 'lodash';

import airbrake from 'common/airbrake';
import { defaultHeaders, fetchJson } from 'common/http';

export const createAlertApi = (() => {
  return {
    validate: (alertParams) => {
      return fetchJson('/api/notifications_and_alerts/alerts/validate_raw_soql', {
        method: 'POST',
        headers: defaultHeaders,
        credentials: 'same-origin',
        body: JSON.stringify({ alert: alertParams })
      });
    },
    validateCustomAlert: (alertParams) => {
      return fetchJson('/api/notifications_and_alerts/alerts/validate_abstract_params', {
        method: 'POST',
        headers: defaultHeaders,
        credentials: 'same-origin',
        body: JSON.stringify({ alert: alertParams })
      });
    },
    create: (alertParams) => {
      return fetchJson('/api/notifications_and_alerts/alerts', {
        method: 'POST',
        headers: defaultHeaders,
        credentials: 'same-origin',
        body: JSON.stringify({ alert: alertParams })
      }).
      then((response) => response.data);
    },
    update: (params, alertId) => {
      return fetchJson(`/api/notifications_and_alerts/alerts/${alertId}`, {
        method: 'PUT',
        headers: defaultHeaders,
        credentials: 'same-origin',
        body: JSON.stringify({ alert: params })
      }).
      then((response) => response.data);
    },
    delete: (alertId) => {
      return fetchJson(`/api/notifications_and_alerts/alerts/${alertId}`, {
        method: 'DELETE',
        headers: defaultHeaders,
        credentials: 'same-origin'
      });
    }
  };
})();

export default createAlertApi;
