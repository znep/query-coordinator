import _ from 'lodash';
import { createSelector } from 'reselect';
import { COLOR_PALETTES, ERROR_BARS_DEFAULT_BAR_COLOR } from '../constants';

export const getVifs = state => _.get(state, 'vifs', {})
export const getCheckpointVifs = state => _.get(state, 'authoring.checkpointVifs', {});

export const getFilters = state => _.get(state, 'filters', []);

export const getSelectedVisualizationType = state => _.get(state, 'authoring.selectedVisualizationType', null)
export const getShowCenteringAndZoomingSaveMessage = state => _.get(state, 'authoring.showCenteringAndZoomingSaveMessage', null);
export const isUserCurrentlyActive = state => _.get(state, 'authoring.userCurrentlyActive', false);
export const getCustomColorPaletteError = state => _.get(state, 'authoring.customColorPaletteError', null);

export const getCurrentVif = createSelector(
  getVifs,
  getSelectedVisualizationType,
  (vifs, selectedVisualizationType) => _.get(vifs, selectedVisualizationType, {})
);

export const getConfiguration = createSelector(
  getCurrentVif,
  (vif) => vif.configuration
);

export const getDimension = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.dimension', null)
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
  (vif) => _.get(vif, 'series[0].dataSource.measure', null)
);

export const getReferenceLines = createSelector(
  getCurrentVif,
  (vif) =>  _.get(vif, 'referenceLines', [])
);

export const hasReferenceLineLabels = createSelector(
  getReferenceLines,
  (lines) => _.filter(lines, (line) => !_.isEmpty(line.label)).length > 0
);

export const getSeries = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series', [])
);

export const getTitle = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'title', null)
);

export const getDescription = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'description', null)
);

export const getPrimaryColor = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].color.primary', null)
);

export const getSecondaryColor = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].color.secondary', null)
);

export const getPointOpacity = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.pointOpacity', 1) * 100
);

export const getPointSize = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.pointSize', 1)
);

export const getColorScale = createSelector(
  getCurrentVif,
  (vif) => {
    return {
      negativeColor: _.get(vif, 'configuration.legend.negativeColor'),
      zeroColor: _.get(vif, 'configuration.legend.zeroColor'),
      positiveColor: _.get(vif, 'configuration.legend.positiveColor'),
    };
  }
);

export const getColorPalette = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].color.palette', null)
);

export const getBaseLayer = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.baseLayerUrl')
);

export const getBaseLayerOpacity = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.baseLayerOpacity', 1) * 100
);

export const getShapefileUid = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.shapefile.uid', null)
);

export const getUnitOne = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].unit.one', null)
);

export const getUnitOther = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].unit.other', null)
);

export const getRowInspectorTitleColumnName = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.rowInspectorTitleColumnName', null)
);

export const getDatasetUid = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.datasetUid')
);

export const getDomain = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.domain')
);

export const getAxisLabels = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.axisLabels')
);

export const getViewSourceDataLink = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.viewSourceDataLink', true)
);

export const getShowDimensionLabels = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.showDimensionLabels', false)
);

export const getShowValueLabels = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.showValueLabels', false)
);

export const getShowValueLabelsAsPercent = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.showValueLabelsAsPercent', false)
);

export const getShowLegend = (defaultValue = false) => createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.showLegend', defaultValue)
);

export const getXAxisScalingMode = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.xAxisScalingMode')
);

export const getMeasureAxisMinValue = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.measureAxisMinValue', null)
);

export const getMeasureAxisMaxValue = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.measureAxisMaxValue', null)
);

export const getDimensionGroupingColumnName = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.dimension.grouping.columnName', null)
);

export const getErrorBarsLowerBoundColumnName = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].errorBars.lowerBoundColumnName')
);

export const getErrorBarsUpperBoundColumnName = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].errorBars.upperBoundColumnName')
);

export const getErrorBarsColor = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].errorBars.barColor', ERROR_BARS_DEFAULT_BAR_COLOR)
);

export const hasErrorBars = createSelector(
  getErrorBarsLowerBoundColumnName,
  getErrorBarsUpperBoundColumnName,
  (lowerBoundColumnName, upperBoundColumnName) => !_.isUndefined(lowerBoundColumnName) && !_.isUndefined(upperBoundColumnName)
);

export const getStacked = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].stacked', false)
);

export const hasDimensionGroupingColumnName = createSelector(
  getDimensionGroupingColumnName,
  (groupingColumnName) => !_.isEmpty(groupingColumnName)
);

export const getColorPaletteGroupingColumnName = createSelector(
  getCurrentVif,
  getSelectedVisualizationType,
  getDimensionGroupingColumnName,
  (vif, visualizationType, grouping) => {
    return visualizationType === 'pieChart' ?
      _.get(vif, 'series[0].dataSource.dimension.columnName', null) :
      grouping;
  }
);

export const getCustomColorPalette = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].color.customPalette', {})
);

export const hasCustomColorPalette = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].color.palette') === 'custom'
);

export const getOrderBy = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.orderBy')
);

export const getPrecision = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.precision')
);

export const getTreatNullValuesAsZero = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'configuration.treatNullValuesAsZero')
);

export const getLimitCount = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].dataSource.limit', null)
);

export const getShowOtherCategory = createSelector(
  getCurrentVif,
  (vif) => {

    return (
      !_.isNull(_.get(vif, 'series[0].dataSource.limit')) &&
      _.get(vif, 'configuration.showOtherCategory')
    );
  }
);

export const getVisualizationType = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].type', null)
);

export const hasVisualizationType = createSelector(
  getVisualizationType,
  (type) => _.isString(type)
);

export const hasVisualizationDimension = createSelector(
  getDimension,
  (dimension) => dimension !== null
);

export const isGrouping = createSelector(
  getDimensionGroupingColumnName,
  (dimensionGroupingColumnName) => _.isString(dimensionGroupingColumnName)
);

export const isMultiSeries = createSelector(
  getSeries,
  (series) => series.length > 1
);

export const isGroupingOrMultiSeries = createSelector(
  isGrouping,
  isMultiSeries,
  (isGrouping, isMultiSeries) => isGrouping || isMultiSeries
);

export const isStacked = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].stacked', false)
);

export const isOneHundredPercentStacked = createSelector(
  getCurrentVif,
  (vif) => _.get(vif, 'series[0].stacked.oneHundredPercent', false)
);

export const isRegionMap = createSelector(
  getVisualizationType,
  (type) => type === 'regionMap'
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

export const isBarChart = createSelector(
  getVisualizationType,
  (type) => type === 'barChart'
);

export const isValidBarChartVif = createSelector(
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

export const isColumnChart = createSelector(
  getVisualizationType,
  (type) => type === 'columnChart'
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
  (type) => type === 'histogram'
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
  (type) => type === 'featureMap'
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
  (type) => type === 'timelineChart'
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

export const isPieChart = createSelector(
  getVisualizationType,
  (type) => type === 'pieChart'
);

export const isValidPieChartVif = createSelector(
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
  isBarChart,
  isValidBarChartVif,
  isRegionMap,
  isValidRegionMapVif,
  isColumnChart,
  isValidColumnChartVif,
  isPieChart,
  isValidPieChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isTimelineChart,
  isValidTimelineChartVif,
  isHistogram,
  isValidHistogramVif,
  getShowCenteringAndZoomingSaveMessage,
  (
    isBarChart,
    validBarChart,
    isRegionMap,
    validRegionMap,
    isColumnChart,
    validColumnChart,
    isPieChart,
    validPieChart,
    isFeatureMap,
    validFeatureMap,
    isTimelineChart,
    validTimelineChart,
    isHistogram,
    validHistogramVif,
    showCenteringAndZoomingSaveMessage
  ) => {
    return !showCenteringAndZoomingSaveMessage && (
      isBarChart && validBarChart ||
      isRegionMap && validRegionMap ||
      isColumnChart && validColumnChart ||
      isPieChart && validPieChart ||
      isFeatureMap && validFeatureMap ||
      isTimelineChart && validTimelineChart ||
      isHistogram && validHistogramVif
    );
  }
);

export const isMap = createSelector(
  isRegionMap,
  isFeatureMap,
  (isRegionMap, isFeatureMap) => isRegionMap || isFeatureMap
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

export const hasMadeChangesToVifs = createSelector(
  getVifs,
  getCheckpointVifs,
  (modifiedVifs, checkpointVifs) => {
    const clonedModifiedVifs = _.cloneDeep(modifiedVifs);
    const clonedCheckpointVifs = _.cloneDeep(checkpointVifs);

    // Tables aren't a configurable visualization
    // and have their own thing going on, so
    // don't compare them.
    _.unset(clonedModifiedVifs, 'table');
    _.unset(clonedCheckpointVifs, 'table');

    return !_.isEqual(clonedModifiedVifs, clonedCheckpointVifs);
  }
);

