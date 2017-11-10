import _ from 'lodash';
import 'whatwg-fetch';
import * as constants from '../constants';
import { defaultHeaders } from 'common/http';

const defaultFetchOptions = {
  headers: defaultHeaders,
  credentials: 'same-origin'
};

const checkStatus = (response) => {
  if (response.ok) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

const fetchRowCount = () => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);
  const query = `${constants.API_URL}?$query=SELECT count(*) as COLUMN_ALIAS_GUARD__count`;

  return fetch(query, fetchOptions).
    then(checkStatus).
    then(response => response.json()).
    then(apiResponse => _.get(apiResponse, '[0].COLUMN_ALIAS_GUARD__count', null));
};

const fetchTable = (options) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);
  const query = `${constants.API_URL}?$query=SELECT * OFFSET ${options.offset} LIMIT ${options.limit}`;

  return fetch(query, fetchOptions).
    then(checkStatus).
    then(response => response.json());
};

export { fetchTable, fetchRowCount };
