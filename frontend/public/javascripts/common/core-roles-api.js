/* eslint new-cap: 0 */
import { DefaultApiFp } from './generated-core-roles-api';
import { csrfToken, appToken } from 'common/http';

const wrappedApi = {};
const wrappedFetch = (url, options) => fetch(url, Object.assign({ credentials: 'same-origin' }, options));
const api = DefaultApiFp();

Object.keys(api).forEach(key => {
  wrappedApi[key] = (...args) => {
    const newArgs = [...args, { xCSRFToken: csrfToken(), xAppToken: appToken() }];
    return api[key].apply(null, newArgs)(wrappedFetch, '');
  };
});


export default wrappedApi;
