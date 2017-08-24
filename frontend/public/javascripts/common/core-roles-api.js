import { DefaultApiFp as api } from './generated-core-roles-api';
import { defaultHeaders } from 'common/http';

const wrappedApi = {};
const wrappedFetch = (url, options) => fetch(url, Object.assign({ credentials: 'same-origin' }, options));

Object.keys(api).forEach(key => {
  wrappedApi[key] = params =>
    api[key](
      Object.assign(
        { xCSRFToken: defaultHeaders['X-CSRF-Token'], xAppToken: defaultHeaders['X-App-Token'] },
        params
      )
    )(wrappedFetch, '/api');
});

export default wrappedApi;
