import 'whatwg-fetch';
import _ from 'lodash';

import airbrake from 'common/airbrake';
import { checkStatus, defaultHeaders, fetchJson } from 'common/http';
import { toApiParams } from './AlertConverter';

export default class CreateAlertApi {
  static validate = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts/validate_raw_soql', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: toApiParams(alertParams) })
    });
  };

  static validateCustomAlert = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts/validate_abstract_params', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: toApiParams(alertParams) })
    });
  };

  static create = (alertParams) => {
    return fetchJson('/api/notifications_and_alerts/alerts', {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: toApiParams(alertParams) })
    }).then((response) => response.data);
  };

  static update = (params, alertId) => {
    return fetchJson(`/api/notifications_and_alerts/alerts/${alertId}`, {
      method: 'PUT',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ alert: toApiParams(params) })
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
