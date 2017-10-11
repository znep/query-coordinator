import _ from 'lodash';

if (_.isUndefined(window.serverConfig)) {
  console.warn('WARNING: window.serverConfig is undefined.');
}

export const defaultHeaders = _.omitBy({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-CSRF-Token': _.get(window, 'serverConfig.csrfToken'),
  'X-App-Token': _.get(window, 'serverConfig.appToken')
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

// Wrapper around `document.location.reload`, mainly to make testing easier.
export function reload() {
  document.location.reload();
}

// Object mapping of the current url params
export const urlParams = () => (
  _(document.location.search.slice(1).split('&')).
    map((item) => (item ? item.split('=') : null)).
    compact().
    fromPairs().
    value()
);

export const redirectToQueryString = (queryString, wait = 0) => {
  _.delay(() => {
    document.location.search = queryString;
  }, wait);
};

export const redirectTo = (location, wait = 0) => {
  _.delay(() => {
    document.location.assign(location);
  }, wait);
};
