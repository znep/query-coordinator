import 'whatwg-fetch';
import _ from 'lodash';

import airbrake from 'common/airbrake';
import { checkStatus, defaultHeaders, fetchJson } from 'common/http';

export default class CreateAlertApi {
  static validate = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts/validate_raw_soql', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: alertParams })
    });
  };

  static validateCustomAlert = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts/validate_abstract_params', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: alertParams })
    });
  };

  static create = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: alertParams })
    }).then((response) => response.data);
  };

  static update = (params, alertId) => {
    return fetchJson(`/api/notifications_and_alerts/alerts/${alertId}`, {
      method: 'PUT',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: params })
    }).then((response) => response.data);
  };

  static deleteAlert = (alertId) => {
    return fetch(`/api/notifications_and_alerts/alerts/${alertId}`, {
      method: 'DELETE',
      headers: defaultHeaders,
      credentials: 'same-origin'
    }).then(checkStatus);
  };
}
