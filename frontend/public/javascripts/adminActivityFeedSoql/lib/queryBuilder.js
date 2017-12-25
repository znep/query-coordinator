import _ from 'lodash';
import * as constants from '../constants';
import { formatToInclusiveSoqlDateRange } from 'common/dates';

export const buildSelectClause = (columns) => {
  if (_.isArray(columns)) {
    return `$select=${encodeURIComponent(columns.join(','))}`;
  } else if (_.isString(columns)) {
    return `$select=${encodeURIComponent(columns)}`;
  }

  return null;
};

export const buildOffsetClause = (offset) => (_.isNumber(offset) ?
  `$offset=${offset}` : null);

export const buildLimitClause = (limit) => (_.isNumber(limit) ?
  `$limit=${limit}` : null);

export const buildWhereClause = (filters) => {
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

  if (filters.affectedItemSearch) {
    ands.push(`affected_item like '${filters.affectedItemSearch}%'`);
  }

  if (filters.date && filters.date.start && filters.date.end) {
    const dateRange = formatToInclusiveSoqlDateRange(filters.date);
    ands.push(`(created_at between '${dateRange.start}' and '${dateRange.end}')`);
  }

  return ands.length > 0 ? `$where=${encodeURIComponent(ands.join(' and '))}` : null;
};

export const buildOrderClause = (order) => {
  const { column, direction } = order || {};
  const orderText = `${column} ${direction}`;

  return `$order=${encodeURIComponent(orderText)}`;
};

export const buildQuery = (parts) => parts.filter(_.isString).join('&');

export const apiQuery = (parts) => `${constants.API_URL}?${buildQuery(parts)}`;

export const downloadQuery = (parts) => `${constants.DOWNLOAD_URL}?${buildQuery(parts)}`;
