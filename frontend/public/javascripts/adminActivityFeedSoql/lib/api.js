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

const buildWhereClause = (filters) => {
  const ands = [];

  if (filters.activeTab === 'failure') {
    ands.push('activity_type=\'DataUpdate.Upsert.SuccessWithDataErrors\'');
  }

  if (filters.activeTab === 'deleted') {
    ands.push('activity_type=\'AssetDeleted\'');
  }

  return ands.length > 0 ? `$where=${ands.join(' and ')}` : null;
};

const buildQuery = (parts) => {

  return `${constants.API_URL}?${parts.filter(_.isString).join('&')}`;
};

const fetchRowCount = (options) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);

  const parts = [
    '$select=count(*) as COLUMN_ALIAS_GUARD__count',
    buildWhereClause(options.filters)
  ];

  return fetch(buildQuery(parts), fetchOptions).
    then(checkStatus).
    then(response => response.json()).
    then(apiResponse => _.get(apiResponse, '[0].COLUMN_ALIAS_GUARD__count', null));
};

const fetchTable = (options) => {
  const fetchOptions = Object.assign({ method: 'GET' }, defaultFetchOptions);
  const parts = [
    `$offset=${options.offset}`,
    `$limit=${options.limit}`,
    buildWhereClause(options.filters)
  ];

  return fetch(buildQuery(parts), fetchOptions).
    then(checkStatus).
    then(response => response.json());
};

export { fetchTable, fetchRowCount };
