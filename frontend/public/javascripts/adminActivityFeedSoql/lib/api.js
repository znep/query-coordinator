import _ from 'lodash';
import 'whatwg-fetch';
import { defaultHeaders } from 'common/http';
import {
  buildOffsetClause,
  buildLimitClause,
  buildWhereClause,
  buildOrderClause,
  apiQuery,
  buildSelectClause
} from '../lib/queryBuilder';

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

const fetchRowCount = (options) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);

  const parts = [
    buildSelectClause('count(*) as COLUMN_ALIAS_GUARD__count'),
    buildWhereClause(options.filters)
  ];

  return fetch(apiQuery(parts), fetchOptions).
    then(checkStatus).
    then(response => response.json()).
    then(apiResponse => _.get(apiResponse, '[0].COLUMN_ALIAS_GUARD__count', null));
};

const fetchTable = (options) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);
  const parts = [
    buildOffsetClause(options.offset),
    buildLimitClause(options.limit),
    buildWhereClause(options.filters),
    buildOrderClause(options.order)
  ];

  return fetch(apiQuery(parts), fetchOptions).
    then(checkStatus).
    then(response => response.json());
};

export { fetchTable, fetchRowCount };
