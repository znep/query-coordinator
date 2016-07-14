import _ from 'lodash';
import { createSelector } from 'reselect';

export const getVifs = state => _.get(state, 'vifs', {})

export const getSelectedVisualizationType = state => _.get(state, 'authoring.selectedVisualizationType', null)
export const getShowCenteringAndZoomingSaveMessage = state => _.get(state, 'authoring.showCenteringAndZoomingSaveMessage', null);

export const getCurrentVif = createSelector(
  getVifs,
  getSelectedVisualizationType,
  (vifs, selectedVisualizationType) => _.get(vifs, selectedVisualizationType, {})
);

export const getConfiguration = createSelector(
  getCurrentVif,
  vif => vif.configuration
);

export const getDimension = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].dataSource.dimension', null)
);

// Warning: This should only be used if you know what you're doing.
// In other words, this is going to randomly choose a VIF and grab its
// dimension.
export const getAnyDimension = createSelector(
  getVifs,
  vifs => _.get(vifs, 'columnChart.series[0].dataSource.dimension', null)
);

export const getMeasure = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].dataSource.measure', null)
);

export const getAnyMeasure = createSelector(
  getVifs,
  vifs => _.get(vifs, 'columnChart.series[0].dataSource.measure', null)
);

export const getTitle = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'title', null)
);

export const getDescription = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'description', null)
);

export const getBaseColor = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].color.primary', null)
);

export const getPointColor = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'configuration.pointColor', null)
);

export const getPointOpacity = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'configuration.pointOpacity', 1) * 100
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
  vif => _.get(vif, 'configuration.baseLayerUrl')
);

export const getBaseLayerOpacity = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'configuration.baseLayerOpacity', 1) * 100
);

export const getShapefileUid = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'configuration.shapefile.uid', null)
);

export const getUnitOne = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].unit.one', null)
);

export const getUnitOther = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].unit.other', null)
);

export const getFlyoutTitleColumn = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'configuration.flyoutTitleColumnName', null)
);

export const getDatasetUid = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].dataSource.datasetUid')
);

export const getDomain = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].dataSource.domain')
);

export const getXAxisScalingMode = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'configuration.xAxisScalingMode')
);

export const getVisualizationType = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].type', null)
);

export const hasVisualizationType = createSelector(
  getVisualizationType,
  type => _.isString
);

export const isChoroplethMap = createSelector(
  getVisualizationType,
  type => type === 'choroplethMap'
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
  type => type === 'columnChart'
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
  type => type === 'featureMap'
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
  type => type === 'timelineChart'
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
  getShowCenteringAndZoomingSaveMessage,
  (
    isChoroplethMap,
    validChoropleth,
    isColumnChart,
    validColumnChart,
    isFeatureMap,
    validFeatureMap,
    isTimelineChart,
    validTimelineChart,
    showCenteringAndZoomingSaveMessage
  ) => {
    return !showCenteringAndZoomingSaveMessage && (
      isChoroplethMap && validChoropleth ||
      isColumnChart && validColumnChart ||
      isFeatureMap && validFeatureMap ||
      isTimelineChart && validTimelineChart
    );
  }
);

export const isRenderableMap = createSelector(
  isChoroplethMap,
  isValidChoroplethMapVif,
  isFeatureMap,
  isValidFeatureMapVif,
  (isChoroplethMap, isValidChoroplethMapVif, isFeatureMap, isValidFeatureMapVif) => {
    return (isFeatureMap && isValidFeatureMapVif) || (isChoroplethMap && isValidChoroplethMapVif);
  }
);
