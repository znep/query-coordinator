import utils from 'socrata-utils';

export var defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-CSRF-Token': window.serverConfig.csrfToken
};

// Used to throw errors from non-200 responses when using fetch.
export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  var error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function getCoreCSRFToken() {
  return utils.getCookie('socrata-csrf-token');
}
