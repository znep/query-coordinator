import { createSelector } from 'reselect';

export const getCurrentVif = (state) => {
  return state.vifs[state.selectedVisualizationType];
};

export const isValidChoroplethMapVif = (state) => true;
export const isValidColumnChartVif = (state) => {
  var columnChart = state.vifs.columnChart;

  var hasDimension = _.isString(_.get(columnChart, 'series[0].dataSource.dimension.columnName'));
  var hasMeasure = _.isString(_.get(columnChart, 'series[0].dataSource.measure.columnName'));
  var hasDatasetUid = _.isString(_.get(columnChart, 'series[0].dataSource.datasetUid'));
  var hasDomain = _.isString(_.get(columnChart, 'series[0].dataSource.domain'));

  return hasDimension && hasMeasure && hasDatasetUid && hasDomain;
};

export const isValidFeatureMapVif = (state) => true;
export const isValidTimelineChartVif = (state) => true;
