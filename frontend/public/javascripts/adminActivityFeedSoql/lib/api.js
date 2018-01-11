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
import {
  NUMBER_OF_DAYS_RESTORABLE_QUERY,
  GET_DELETED_VIEW_QUERY,
  RESTORE_QUERY
} from '../constants';

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

const fetchNumberOfDaysRestorable = () => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);

  return fetch(NUMBER_OF_DAYS_RESTORABLE_QUERY, fetchOptions).
    then(checkStatus).
    then(response => response.text()).
    then(parseInt);
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

const checkDatasetRestorable = (id) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);

  return fetch(GET_DELETED_VIEW_QUERY.replace('${id}', id), fetchOptions).
    then(checkStatus).
    then(response => response.json()).
    then(dataset => _.get(dataset, 'flags', []).includes('restorable')).
    catch(() => false);
};

const restoreDataset = (id) => {
  const fetchOptions = Object.assign({ method: 'PATCH' }, defaultFetchOptions);

  return fetch(RESTORE_QUERY.replace('${id}', id), fetchOptions).
    then(checkStatus);
};

export {
  fetchTable,
  fetchRowCount,
  fetchNumberOfDaysRestorable,
  checkDatasetRestorable,
  restoreDataset
};
