import _ from 'lodash';
import 'whatwg-fetch';

const defaultFetchOptions = {
  credentials: 'same-origin',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const headersForWrites = {
  'X-CSRF-Token': window.serverConfig.csrfToken,
  'X-App-Token': window.serverConfig.appToken
};

export function socrataFetch(path, options = {}) {
  // only need to add in authenticityToken for non-GET requests
  const mergedBasic = _.merge(options, defaultFetchOptions);
  const mergedForWrites = (!_.isUndefined(options.method) && options.method.toUpperCase() !== 'GET') ?
    _.merge(mergedBasic, { headers: headersForWrites }) :
    mergedBasic;
  return fetch(path, mergedForWrites);
}

// Used to throw errors from non-200 responses when using fetch.
export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function checkStatusForPoll(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else if (response.status >= 500) {
    return null; // We want to retry these but not actually try to process them.
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

export function getJson(resp) {
  if (resp) {
    return resp.json();
  } else {
    return resp;
  }
}

export function getError(err) {
  return err.response.json().then((body) => {
    err.body = body;
    throw err;
  });
}
