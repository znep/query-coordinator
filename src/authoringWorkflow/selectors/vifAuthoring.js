import { createSelector } from 'reselect';


export const getCurrentVif = (state) => {
  return state.vifs[state.selectedVisualizationType];
};

const getConfiguration = createSelector(
  getCurrentVif,
  vif => vif.configuration
);

const getDimension = createSelector(
  getCurrentVif,
  (vif) => {
    return _.get(vif, 'series[0].dataSource.dimension');
  }
);

const getMeasure = createSelector(
  getCurrentVif,
  (vif) => {
    return _.get(vif, 'series[0].dataSource.measure');
  }
);

export const getDatasetUid = createSelector(
  getCurrentVif,
  (vif) => {
    return _.get(vif, 'series[0].dataSource.datasetUid');
  }
);

export const getDomain = createSelector(
  getCurrentVif,
  (vif) => {
    return _.get(vif, 'series[0].dataSource.domain');
  }
);

export const isChoroplethMap = createSelector(
  getCurrentVif,
  (vif) => {
    return _.get(vif, 'series[0].type') === 'choroplethMap';
  }
);

export const isValidChoroplethMapVif = createSelector(
  getConfiguration,
  getDimension,
  getDatasetUid,
  getDomain,
  (configuration, dimension, datasetUid, domain) => {
    var hasComputedColumnName = _.isString(configuration.computedColumnName);
    var hasShapeFileUid = _.isString(_.get(configuration, 'shapefile.uid'));
    var hasDimension = _.isString(dimension.columnName);
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasComputedColumnName && hasShapeFileUid && hasDimension && hasDatasetUid && hasDomain;
  }
);

export const isValidColumnChartVif = createSelector(
  getDimension,
  getMeasure,
  getDatasetUid,
  getDomain,
  (dimension, measure, datasetUid, domain) => {
    var hasDimension = _.isString(dimension.columnName);
    var hasMeasure = _.isString(measure.columnName);
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasMeasure && hasDatasetUid && hasDomain;
  }
);

export const isValidFeatureMapVif = createSelector(
  getDimension,
  getDatasetUid,
  getDomain,
  (dimension, datasetUid, domain) => {
    var hasDimension = _.isString(dimension.columnName);
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasDatasetUid && hasDomain;
  }
);

export const isValidTimelineChartVif = createSelector(
  getDimension,
  getMeasure,
  getDatasetUid,
  getDomain,
  (dimension, measure, datasetUid, domain) => {
    var hasDimension = _.isString(dimension.columnName);
    var hasMeasure = _.isString(measure.columnName);
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasDatasetUid && hasDomain;
  }
);
