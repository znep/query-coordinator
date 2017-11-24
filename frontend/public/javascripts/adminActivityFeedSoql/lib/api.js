import _ from 'lodash';
import 'whatwg-fetch';
import * as constants from '../constants';
import { defaultHeaders } from 'common/http';
import { formatToInclusiveSoqlDateRange } from 'common/dates';

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
    const eventList = constants.DATA_UPDATE_METHODS.
      map(method => `DataUpdate.${method}.Failure`);

    ands.push(`activity_type in ('${eventList.join("','")}')`);
  }

  if (filters.activeTab === 'deleted') {
    ands.push('activity_type=\'AssetDeleted\'');
  }

  if (filters.assetType) {
    ands.push(`asset_type='${filters.assetType}'`);
  }

  if (filters.event) {
    const dataUpdateMatch = filters.event.
      match(/^DataUpdate\.(Started|InProgress|SuccessWithDataErrors|Success|Failure)/);

    if (dataUpdateMatch) {
      const eventList = constants.DATA_UPDATE_METHODS.
        map(method => `DataUpdate.${method}.${dataUpdateMatch[1]}`);

      ands.push(`activity_type in ('${eventList.join("','")}')`);
    } else {
      ands.push(`activity_type='${filters.event}'`);
    }
  }

  if (filters.date && filters.date.start && filters.date.end) {
    const dateRange = formatToInclusiveSoqlDateRange(filters.date);
    ands.push(`(created_at between '${dateRange.start}' and '${dateRange.end}')`);
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
