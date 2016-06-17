import { createSelector } from 'reselect';

export const getVifs = state => {
  return _.get(state, 'vifs', {});
};

export const getSelectedVisualizationType = state => {
  return _.get(state, 'authoring.selectedVisualizationType', null);
};

export const getCurrentVif = createSelector(
  getVifs,
  getSelectedVisualizationType,
  (vifs, selectedVisualizationType) => {
    return _.get(vifs, selectedVisualizationType, {});
  }
);

export const getConfiguration = createSelector(
  getCurrentVif,
  vif => vif.configuration
);

export const getDimension = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].dataSource.dimension', null);
  }
);

export const getMeasure = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].dataSource.measure', null);
  }
);

export const getTitle = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'title', null);
  }
);

export const getDescription = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'description', null);
  }
);

export const getBaseColor = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].color.primary', null);
  }
);

export const getPointColor = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.pointColor', null);
  }
);

export const getPointOpacity = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.pointOpacity', 1) * 100;
  }
);


export const getColorScale = createSelector(
  getCurrentVif,
  vif => {
    return {
      negativeColor: _.get(vif, 'configuration.legend.negativeColor'),
      zeroColor: _.get(vif, 'configuration.legend.zeroColor'),
      positiveColor: _.get(vif, 'configuration.legend.positiveColor'),
    };
  }
);

export const getBaseLayer = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.baseLayerUri');
  }
);

export const getBaseLayerOpacity = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.baseLayerOpacity', 1) * 100;
  }
);

export const getShapefileUid = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.shapefile.uid', null);
  }
);

export const getUnitOne = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].unit.one', null);
  }
);

export const getUnitOther = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].unit.other', null);
  }
);

export const getFlyoutTitleColumn = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'configuration.flyoutTitleColumnName', null);
  }
);

export const getDatasetUid = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].dataSource.datasetUid');
  }
);

export const getDomain = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].dataSource.domain');
  }
);

export const getVisualizationType = createSelector(
  getCurrentVif,
  vif => {
    return _.get(vif, 'series[0].type', null);
  }
);

export const hasVisualizationType = createSelector(
  getVisualizationType,
  type => _.isString
);

export const isChoroplethMap = createSelector(
  getVisualizationType,
  type => {
    return type === 'choroplethMap';
  }
);

export const isValidChoroplethMapVif = createSelector(
  getConfiguration,
  getDimension,
  getMeasure,
  getDatasetUid,
  getDomain,
  (configuration, dimension, measure, datasetUid, domain) => {
    var hasComputedColumnName = _.isString(_.get(configuration, 'computedColumnName'));
    var hasShapeFileUid = _.isString(_.get(configuration, 'shapefile.uid'));
    var hasDimension = _.isString(_.get(dimension, 'columnName'));

    var hasMeasureAggregation = _.isString(_.get(measure, 'aggregationFunction'));

    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasComputedColumnName &&
      hasShapeFileUid &&
      hasDimension &&
      hasDatasetUid &&
      hasDomain &&
      hasMeasureAggregation;
  }
);

export const isColumnChart = createSelector(
  getVisualizationType,
  type => {
    return type === 'columnChart';
  }
);

export const isValidColumnChartVif = createSelector(
  getDimension,
  getMeasure,
  getDatasetUid,
  getDomain,
  (dimension, measure, datasetUid, domain) => {
    var hasDimension = _.isString(_.get(dimension, 'columnName'));
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasDatasetUid && hasDomain;
  }
);

export const isFeatureMap = createSelector(
  getVisualizationType,
  type => {
    return type === 'featureMap';
  }
);

export const isValidFeatureMapVif = createSelector(
  getDimension,
  getDatasetUid,
  getDomain,
  (dimension, datasetUid, domain) => {
    var hasDimension = _.isString(_.get(dimension, 'columnName'));
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasDatasetUid && hasDomain;
  }
);

export const isTimelineChart = createSelector(
  getVisualizationType,
  type => {
    return type === 'timelineChart';
  }
);

export const isValidTimelineChartVif = createSelector(
  getDimension,
  getMeasure,
  getDatasetUid,
  getDomain,
  (dimension, measure, datasetUid, domain) => {
    var hasDimension = _.isString(_.get(dimension, 'columnName'));
    var hasDatasetUid = _.isString(datasetUid);
    var hasDomain = _.isString(domain);

    return hasDimension && hasDatasetUid && hasDomain;
  }
);

export const isInsertableVisualization = createSelector(
  isChoroplethMap,
  isValidChoroplethMapVif,
  isColumnChart,
  isValidColumnChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isTimelineChart,
  isValidTimelineChartVif,
  (isChoroplethMap, validChoropleth, isColumnChart, validColumnChart, isFeatureMap, validFeatureMap, isTimelineChart, validTimelineChart) => {
    return (
      isChoroplethMap && validChoropleth ||
      isColumnChart && validColumnChart ||
      isFeatureMap && validFeatureMap ||
      isTimelineChart && validTimelineChart
    );
  }
);

