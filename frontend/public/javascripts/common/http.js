import _ from 'lodash';

export const defaultHeaders = _.omitBy({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-CSRF-Token': window.serverConfig.csrfToken,
  'X-App-Token': window.serverConfig.appToken
}, _.isUndefined);

// Used to throw errors from non-200 responses when using fetch.
export function checkStatus(response) {
  if (response.ok) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

// Object mapping of the current url params
export const urlParams = () => (
  _(document.location.search.slice(1).split('&')).
    map((item) => (item ? item.split('=') : null)).
    compact().
    fromPairs().
    value()
);

export const redirectToQueryString = (queryString) => {
  document.location.search = queryString;
};
