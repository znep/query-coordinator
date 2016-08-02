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
  getCurrentVif,
  getVifs,
  (vif, vifs) => {
    return _.isEmpty(vif) ?
      _.get(vifs, 'columnChart.series[0].dataSource.dimension', null) :
      _.get(vif, 'series[0].dataSource.dimension', null);
  }
);

export const getMeasure = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].dataSource.measure', null)
);

export const getAnyMeasure = createSelector(
  getCurrentVif,
  getVifs,
  (vif, vifs) => {
    return _.isEmpty(vif) ?
      _.get(vifs, 'columnChart.series[0].dataSource.measure', null) :
      _.get(vif, 'series[0].dataSource.measure', null);
  }
);

export const getTitle = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'title', null)
);

export const getDescription = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'description', null)
);

export const getPrimaryColor = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].color.primary', null)
);

export const getSecondaryColor = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'series[0].color.secondary', null)
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

export const getRowInspectorTitleColumnName = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'configuration.rowInspectorTitleColumnName', null)
);

export const getDatasetUid = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].dataSource.datasetUid')
);

export const getDomain = createSelector(
  getCurrentVif,
  vif =>  _.get(vif, 'series[0].dataSource.domain')
);

export const getAxisLabels = createSelector(
  getCurrentVif,
  vif => _.get(vif, 'configuration.axisLabels')
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

export const isRegionMap = createSelector(
  getVisualizationType,
  type => type === 'regionMap'
);

export const isValidRegionMapVif = createSelector(
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

export const isHistogram = createSelector(
  getVisualizationType,
  type => type === 'histogram'
);

export const isValidHistogramVif = createSelector(
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
  isRegionMap,
  isValidRegionMapVif,
  isColumnChart,
  isValidColumnChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isTimelineChart,
  isValidTimelineChartVif,
  isHistogram,
  isValidHistogramVif,
  getShowCenteringAndZoomingSaveMessage,
  (
    isRegionMap,
    validRegionMap,
    isColumnChart,
    validColumnChart,
    isFeatureMap,
    validFeatureMap,
    isTimelineChart,
    validTimelineChart,
    isHistogram,
    validHistogramVif,
    showCenteringAndZoomingSaveMessage
  ) => {
    return !showCenteringAndZoomingSaveMessage && (
      isRegionMap && validRegionMap ||
      isColumnChart && validColumnChart ||
      isFeatureMap && validFeatureMap ||
      isTimelineChart && validTimelineChart ||
      isHistogram && validHistogramVif
    );
  }
);

export const isRenderableMap = createSelector(
  isRegionMap,
  isValidRegionMapVif,
  isFeatureMap,
  isValidFeatureMapVif,
  (isRegionMap, isValidRegionMapVif, isFeatureMap, isValidFeatureMapVif) => {
    return (isFeatureMap && isValidFeatureMapVif) || (isRegionMap && isValidRegionMapVif);
  }
);
