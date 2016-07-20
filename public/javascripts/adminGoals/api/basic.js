import { fetchOptions } from '../constants';

function checkXhrStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function request(method, version, path, otherOptions) {
  const url = `/stat/api/v1/${path}`;
  const options = _.merge(_.clone(fetchOptions), {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'If-Match': version
    }
  }, otherOptions);

  return fetch(url, options).
    then(checkXhrStatus).
    then(response => response.json());
}

export function get(version, path, options) {
  return request('GET', version, path, options);
}

export function put(version, path, options) {
  return request('PUT', version, path, options);
}

export function post(version, path, options) {
  return request('POST', version, path, options);
}

export function destroy(version, path, options) {
  return request('DELETE', version, path, options);
}
