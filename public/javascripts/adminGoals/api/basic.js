import _ from 'lodash';
import 'es6-promise';
import 'whatwg-fetch';
import { fetchOptions } from '../constants';

function checkXhrStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function request(apiVersion, method, path, otherOptions) {
  const url = `/stat/api/${apiVersion}/${path}`;
  const options = _.merge(_.clone(fetchOptions), {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, otherOptions);

  return fetch(url, options).
    then(checkXhrStatus).
    then(response => response.json()).
    then(json => {
      if (json.error) {
        throw json.error.toString();
      }

      return json;
    });
}

export function get(apiVersion, path, options) {
  return request(apiVersion, 'GET', path, options);
}

export function put(apiVersion, path, options) {
  return request(apiVersion, 'PUT', path, options);
}

export function post(apiVersion, path, options) {
  return request(apiVersion, 'POST', path, options);
}

export function destroy(apiVersion, path, options) {
  return request(apiVersion, 'DELETE', path, options);
}
