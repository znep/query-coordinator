import _ from 'lodash';
import { get as getCookie } from 'browser-cookies';

if (_.isUndefined(window.serverConfig)) {
  console.warn('WARNING: window.serverConfig is undefined.');
}

// Because consistency is hard.
export function csrfToken() {
  const tokens = [
    _.get(window, 'serverConfig.csrfToken'),
    getCookie('socrata-csrf-token'),
    _.get(document.querySelector('meta[name="csrf-token"]'), 'content')
  ];
  return _.first(_.compact(tokens));
}

// Like, really hard, y'all.
export function appToken() {
  const tokens = [
    _.get(window, 'serverConfig.appToken'),
    _.get(window, 'socrata.siteChrome.appToken'),
    _.get(window, 'blist.configuration.appToken')
  ];
  return _.first(_.compact(tokens));
}

export const defaultHeaders = _.omitBy({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrfToken(),
  'X-App-Token': appToken()
}, _.isNil);

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

export const fetchJson = (apiPath, options) =>
  fetch(apiPath, options).
  then(checkStatus).
  then(response => response.json());
