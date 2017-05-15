import _ from 'lodash';
import 'whatwg-fetch';

import httpHelpers from 'common/http';

export default class MockHttpClient {
  constructor() {
    this.responds = {};
    this.requests = {};
  }

  respondWith(method, url, status, content) {
    this.responds[method] = this.responds[method] || [];
    this.responds[method].push((requestUrl) => {
      if (typeof(url) === 'string' && url === requestUrl) {
        return {content, status};
      } else if (typeof(url.test) === 'function' && url.test(requestUrl)) {
        return {content, status};
      }

      return null;
    });
  }

  reset() {
    this.responds = {};
    this.requests = {};
  }

  assertRequestMade(method, url, contentAssert = () => {}) {
    const request = this.requests[method] && this.requests[method][url];
    assert(request, `Expected to have an http request to made to ${method} ${url}`);
    contentAssert(this.requests[method][url]);
  }

  assertRequestNotMade(method, url) {
    const request = this.requests[method] && this.requests[method][url];
    assert(!request, `Expected a request to ${method} ${url} shouldn't being made`)
  }

  request(url, method, payload, otherOptions) {
    const defaultHeaders = _.omitBy(_.merge(httpHelpers, {
      'Accept': otherOptions.json ? 'application/json' : null,
      'Content-Type': otherOptions.json? 'application/json' : null
    }), _.isNil);

    const options = _.merge({
      method,
      credentials: 'same-origin',
      headers: defaultHeaders
    }, _.omit(otherOptions, 'json'));

    if (!options.body && !_.isNil(payload)) {
      options.body = otherOptions.json ? JSON.stringify(payload) : payload
    }

    if (!this.requests[method]) {
      this.requests[method] = {};
    }

    this.requests[method][url] = { url, options };
    
    const handlers = this.responds[method] || [];
    const handler = _.find(handlers, (handler) => handler(url));

    if (handler) {
      return Promise.resolve(handler(url)).
        then(response => this._checkXhrStatus(response, options) && response).
        then(response => response.content);
    } else {
      throw new Error(`Unexpected HTTP request: ${method} ${url}`);
    }
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

  _checkXhrStatus(response, options) {
    const success = response.status >= 200 && response.status < 300;

    if (!success) {
      throw response;
    }

    return response;
  }
}
