import { fetchJson, defaultHeaders } from 'common/http';
import isEmpty from 'lodash/isEmpty';
import camelCase from 'lodash/camelCase';
import 'url-search-params-polyfill';

const convertUserListFromApi = users => {
  return users.map(user => {
    user.role_id = user.role_id.toString();
    const converted = {};
    Object.keys(user).forEach(key => {
      converted[camelCase(key)] = user[key];
    });
    return converted;
  });
};

export const SORT_KEYS = {
  EMAIL: 'email',
  LAST_AUTHENTICATED_AT: 'last_authenticated_at',
  ROLE_NAME: 'role_name',
  SCREEN_NAME: 'screen_name'
};

export const SORT_DIRECTION = {
  ASC: 'ASC',
  DESC: 'DESC'
};

const getUsers = (
  domain,
  {
    query,
    filters,
    orderBy = SORT_KEYS.SCREEN_NAME,
    sortDirection = SORT_DIRECTION.ASC,
    limit,
    offset = 0
  } = {}
) => {
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  let apiPath = `/api/catalog/v1/users?domain=${domain}&limit=${limit}&offset=${offset}`;
  if (!isEmpty(query)) {
    apiPath = `${apiPath}&q=${query}`;
  } else {
    apiPath = `${apiPath}&order=${orderBy}+${sortDirection}`;
  }
  if (!isEmpty(filters)) {
    Object.keys(filters).forEach(key => {
      const val = filters[key];
      if (!isEmpty(val)) {
        apiPath = `${apiPath}&${key}=${val}`;
      }
    });
  }

  return fetchJson(apiPath, fetchOptions).then(json => ({
    ...json,
    resultCount: json.resultSetSize,
    users: convertUserListFromApi(json.results)
  }));
};

const autocomplete = (domain, query) => {
  const apiPath = `/api/catalog/v1/users/autocomplete?domain=${domain}&q=${query}`;

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  return fetchJson(apiPath, fetchOptions).then(searchResults => {
    return {
      ...searchResults,
      results: searchResults.results.map(result => {
        return {
          ...result,
          title: result.user.screen_name
        };
      })
    };
  });
};

const resetPassword = userId => {
  const apiPath = `/admin/users/${userId}/reset_password`;

  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'POST'
  };

  return fetchJson(apiPath, fetchOptions);
};

export default {
  autocomplete,
  getUsers,
  resetPassword
};
