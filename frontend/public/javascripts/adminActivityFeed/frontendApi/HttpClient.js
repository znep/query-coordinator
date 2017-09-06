import 'whatwg-fetch';
import _ from 'lodash';

import * as httpHelpers from 'common/http';

export default class HttpClient {
  request(url, method, payload, otherOptions) {
    const defaultHeaders = _.omitBy(_.merge(httpHelpers.defaultHeaders, {
      'Accept': otherOptions.json ? 'application/json' : null,
      'Content-Type': otherOptions.json ? 'application/json' : null
    }), _.isNil);

    const options = _.merge({
      method,
      credentials: 'same-origin',
      headers: defaultHeaders
    }, _.omit(otherOptions, 'json'));

    if (!options.body && !_.isNil(payload)) {
      options.body = otherOptions.json ? JSON.stringify(payload) : payload;
    }

    return fetch(url, options).
      then(response => this._checkXhrStatus(response)).
      then(response => (otherOptions.json ? response.json() : response));
  }

  get(url, options = {}) {
    return this.request(url, 'GET', null, options);
  }

  put(url, payload, options = {}) {
    return this.request(url, 'PUT', payload, options);
  }

  patch(url, payload, options = {}) {
    return this.request(url, 'PATCH', payload, options);
  }

  post(url, payload, options = {}) {
    return this.request(url, 'POST', payload, options);
  }

  destroy(url, options = {}) {
    return this.request(url, 'DELETE', null, options);
  }

  _checkXhrStatus(response) {
    const success = response.status >= 200 && response.status < 300;

    if (!success) {
      let error = new Error(`${response.status}: ${response.statusText}`);
      error.response = response;
      throw error;
    }

    return response;
  }
}
