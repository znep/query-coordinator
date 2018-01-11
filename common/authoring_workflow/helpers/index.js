import _ from 'lodash';
import utils from 'common/js_utils';
import I18n from 'common/i18n';
import {
  AGGREGATION_TYPES,
  COLOR_PALETTE_VALUES,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  SERIES_TYPE_COMBO_CHART,
  SERIES_TYPE_COMBO_CHART_COLUMN,
  SERIES_TYPE_FLYOUT,
  SERIES_VARIANT_COLUMN
} from '../constants';

export const setStringValueOrDefaultValue = (object, path, value, defaultValue) => {
  const hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath && !_.isUndefined(defaultValue)) {
    _.set(object, path, defaultValue);
  }
};

export const setBooleanValueOrDefaultValue = (object, path, value, defaultValue) => {
  const hasPath = _.has(object, path);

  if (_.isBoolean(value)) {
    _.set(object, path, value);
  } else if (hasPath && !_.isUndefined(defaultValue)) {
    _.set(object, path, defaultValue);
  }
};

export const setStringValueOrDeleteProperty = (object, path, value) => {
  const hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath) {
    _.unset(object, path);
  }
};

export const setNumericValueOrDeleteProperty = (object, path, value) => {
  const hasPath = _.has(object, path);

  if (value) {
    _.set(object, path, parseFloat(value));
  } else if (hasPath) {
    _.unset(object, path);
  }
};

export const setBooleanValueOrDeleteProperty = (object, path, value) => {
  const hasPath = _.has(object, path);

  if (_.isBoolean(value) && value === true) {
    _.set(object, path, value);
  } else if (hasPath) {
    _.unset(object, path);
  }
};

export const forEachSeries = (state, callback) => {
  _.each(state.series, callback);
};

export const isNonEmptyString = string => {
  return _.isString(string) && string.trim().length > 0;
};

export const setUnits = (series, action) => {
  const rowDisplayUnit = _.get(action, 'baseViewMetadata.metadata.rowLabel', null);
  const unitOne = _.get(series, 'unit.one', null);
  const unitOther = _.get(series, 'unit.other', null);
  const defaultUnitRegex = new RegExp(`^${I18n.t('shared.visualizations.charts.common.unit.one')}$`);

  // If the rowDisplayUnit looks like our default display unit, don't set it as a custom unit
  if (!_.isEmpty(rowDisplayUnit) && rowDisplayUnit.match(defaultUnitRegex)) {
    return;
  }

  // EN-13353 - Error Creating Region Map
  //
  // Some customers may have overridden 'rowDisplayUnit' to be an empty string.
  // The `utils.pluralize` function incorrectly pluralizes an empty string as
  // 's', so instead we don't want to override the defaults (which are also
  // empty strings, just for both `unit.one` and `unit.other`) in this case.
  if (unitOne === null && !_.isEmpty(rowDisplayUnit)) {
    setStringValueOrDefaultValue(series, 'unit.one', rowDisplayUnit);
  }

  if (unitOther === null && !_.isEmpty(rowDisplayUnit)) {
    setStringValueOrDefaultValue(series, 'unit.other', utils.pluralize(rowDisplayUnit));
  }
};

export const setDimensionGroupingColumnName = (state, dimensionGroupingColumnName) => {

  // Note that the 'dimension.grouping.columnName' property is only valid on
  // the first series of a vif, so we are not setting it on all series but
  // rather only the first.
  //
  // In this context, 'state' is the vif itself.
  _.set(
    state,
    'series[0].dataSource.dimension.grouping.columnName',
    dimensionGroupingColumnName
  );

  if (dimensionGroupingColumnName === null) { // removing grouping

    // Remove any properties that do not apply
    _.unset(state, 'series[0].color.palette');
    _.unset(state, 'series[0].dataSource.dimension.grouping');
    _.unset(state, 'series[0].stacked');

    // Try to remove legend
    tryUnsetShowLegend(state);

  } else { // applying grouping

    // Assign the default color palette
    if (_.isEmpty(_.get(state, 'series[0].color.palette'))) {
      _.set(state, 'series[0].color.palette', 'categorical');
    }

    // Remove any flyout series
    for (var i = state.series.length - 1; i >= 0; i--) {
      if (state.series[i].type === SERIES_TYPE_FLYOUT) {
        state.series.splice(i, 1);
      }
    }

    // Try to show legend
    trySetShowLegend(state);
  }
};

export const appendSeries = (state, { isFlyoutSeries, isInitialLoad, measureColumnName, seriesVariant }) => {
  const series = _.get(state, 'series', []);
  const seriesType = _.get(state, 'series[0].type', '');

  let seriesIndex;

  // This is the ordering of series:
  // Combo chart: .column, .line, .flyout
  // Others: no variants, .flyout
  if (isFlyoutSeries) {

    // Insert flyout series at the end
    seriesIndex = series.length;

  } else if (seriesType.includes(SERIES_TYPE_COMBO_CHART) && (seriesVariant === SERIES_VARIANT_COLUMN)) {

    // For comboChart, insert column series after the last column series or if there are none, insert it at index 0.
    seriesIndex = _.findLastIndex(series, (item) => item.type === SERIES_TYPE_COMBO_CHART_COLUMN) + 1;

  } else {

    // For other chart types, insert series after the last non-flyout series  or if there are none, insert it at index 0.
    seriesIndex = _.findLastIndex(series, (item) => (item.type !== SERIES_TYPE_FLYOUT)) + 1;
  }

  addSeries(state, { isFlyoutSeries, isInitialLoad, measureColumnName, seriesIndex, seriesVariant });
};

export const addSeries = (state, { isFlyoutSeries, isInitialLoad, measureColumnName, seriesIndex, seriesVariant }) => {
  // All vizualizations that support multi-series renderings have the same number of series.  For
  // example, combo chart will have some series types that are comboChart.column or comboChart.line
  // the total number of renderable series is the same any other visualization that supports multi-
  // series rendering.
  //
  // For multi-series, we use the color palette on the first series, but the palettes on all series
  // should be in sync so that if the first series is deleted, the palette can be obtained from the
  // second (now first) series.
  //
  // If we are transitioning to multi-series in this method (and not during the initial load), set
  // the palette to 'categorical' and set the primary and secondary colors of the first series to
  // the first color in the 'categorical' color palette.
  //
  const nonFlyoutSeries = _.filter(state.series, (item) => item.type !== SERIES_TYPE_FLYOUT);

  if ((nonFlyoutSeries.length == 1) && !isInitialLoad && !isFlyoutSeries) {
    const color = COLOR_PALETTE_VALUES.categorical[0];

    _.set(state, 'series[0].color.palette', 'categorical');
    _.set(state.series[0], 'color.primary', color);
    _.set(state.series[0], 'color.secondary', color);
  }

  // Now create the new series, by cloning the first series.
  //
  const clonedSeries = _.cloneDeep(state.series[0]);

  // Set the measure properties
  //
  _.set(clonedSeries, 'dataSource.measure.aggregationFunction', 'count');
  _.set(clonedSeries, 'dataSource.measure.columnName', null);

  // Set primary color equal to the index color of the current color palette.  If no palette is
  // set, use categorical.
  //
  let palette = _.get(clonedSeries, 'color.palette', 'categorical');

  if (_.isNil(palette) || (palette === 'custom')) {
    palette = 'categorical';
  }

  const colors = COLOR_PALETTE_VALUES[palette];
  const index = state.series.length % colors.length;

  _.set(clonedSeries, 'color.primary', colors[index]);
  _.set(clonedSeries, 'color.secondary', colors[index]);

  // Set series type like: "comboChart.line" or "flyout"
  if (!_.isNil(seriesVariant)) {

    const seriesType = _.get(clonedSeries, 'type', '').split('.')[0];

    // If this is a comboChart and the series variant is specified, append to the series type like
    // "comboChart.column" or "comboChart.line"
    if (seriesType === SERIES_TYPE_COMBO_CHART) {
      _.set(clonedSeries, 'type', `${seriesType}.${seriesVariant}`);
    }

  } else if (isFlyoutSeries) {

    // If this is a flyout series, set type to "flyout"
    _.set(clonedSeries, 'type', SERIES_TYPE_FLYOUT);
  }

  // Unset any properties we don't want cloned
  //
  _.unset(clonedSeries, 'unit');

  // Add the series
  //
  state.series.splice(seriesIndex, 0, clonedSeries);

  // Set measure column name
  //
  if (!_.isNil(measureColumnName)) {
    setMeasureColumnAtSeriesIndex(state, {
      columnName: measureColumnName,
      seriesIndex
    });
  }

  // Adjust any other properties in the vif for multi-series
  //
  forEachSeries(state, series => {
    _.unset(series, 'dataSource.dimension.grouping');
  });

  // If legend visibility has not yet been set, then set it to visible.
  //
  trySetShowLegend(state);
};

export const setMeasureAggregation = (state, { aggregationFunction, isFlyoutSeries, relativeIndex }) => {
  const seriesIndex = isFlyoutSeries ?
    getSeriesIndexFromFlyoutSeriesRelativeIndex(state, relativeIndex) :
    relativeIndex;

  // Set aggregation function
  const series = state.series[seriesIndex];
  _.set(series, 'dataSource.measure.aggregationFunction', aggregationFunction);
};

export const setMeasureColumn = (state, { columnName, isFlyoutSeries, relativeIndex }) => {
  const seriesIndex = isFlyoutSeries ?
    getSeriesIndexFromFlyoutSeriesRelativeIndex(state, relativeIndex) :
    relativeIndex;

  setMeasureColumnAtSeriesIndex(state, { columnName, seriesIndex });
};

function setMeasureColumnAtSeriesIndex(state, { columnName, seriesIndex }) {

  // Set column name and aggregation function
  const series = state.series[seriesIndex];
  _.set(series, 'dataSource.measure.columnName', columnName);

  if (_.isNull(columnName)) {
    _.set(series, 'dataSource.measure.aggregationFunction', 'count');
  } else if (series.dataSource.measure.aggregationFunction === 'count') {
    _.set(series, 'dataSource.measure.aggregationFunction', 'sum');
  }
}

export const removeSeries = (state, { isFlyoutSeries, relativeIndex }) => {
  const seriesIndex = isFlyoutSeries ?
    getSeriesIndexFromFlyoutSeriesRelativeIndex(state, relativeIndex) :
    relativeIndex;

  // Remove the series
  //
  state.series.splice(seriesIndex, 1);

  // If no longer multi-series, remove multi-series properties
  //
  const renderableSeries = _.filter(state.series, (item) => item.type !== SERIES_TYPE_FLYOUT);

  if (renderableSeries.length == 1) {
    _.unset(state, 'series[0].color.palette');
    _.unset(state, 'series[0].stacked');

    _.set(state, 'series[0].color.primary', DEFAULT_PRIMARY_COLOR);
    _.set(state, 'series[0].color.secondary', DEFAULT_SECONDARY_COLOR);
  }

  tryUnsetShowLegend(state);
};

export const setSeriesVariant = (state, { seriesIndex, seriesVariant }) => {
  if (seriesIndex < state.series.length) {
    const series = state.series[seriesIndex];
    let parts = series.type.split('.');

    if (parts.length == 1) {
      parts.push(seriesVariant);
    } else if (parts.length > 1) {
      parts[1] = seriesVariant;
    }

    const seriesType = parts.join('.');
    _.set(series, 'type', seriesType);
  }
};

// This tries to unset the showLegend property, but only if it is not still grouping, multi-series,
// or having reference line labels.
//
export const tryUnsetShowLegend = (state) => {

  if (isGroupingOrHasMultipleNonFlyoutSeries(state)) {
    return;
  }

  const referenceLinesWithLabels = _.filter(state.referenceLines, (line) => !_.isEmpty(line.label));
  if (referenceLinesWithLabels.length > 0) {
    return;
  }

  _.unset(state, 'configuration.showLegend');
};

// This tries to set the showLegend property to true, but only if it is currently grouping, multi-series,
// or having reference line labels.
//
export const trySetShowLegend = (state) => {
  const referenceLinesWithLabels = _.filter(state.referenceLines, (line) => !_.isEmpty(line.label));

  if (!isGroupingOrHasMultipleNonFlyoutSeries(state) && (referenceLinesWithLabels.length == 0)) {
    return;
  }

  _.set(state, 'configuration.showLegend', true);
};

export const isGroupingOrHasMultipleNonFlyoutSeries = (state) => {
  const isGrouping = !_.isNil(_.get(state, 'series[0].dataSource.dimension.grouping'));

  const filteredSeries = _.filter(state.series, (item) => item.type !== SERIES_TYPE_FLYOUT);
  return isGrouping || (filteredSeries.length > 1);
};

export const getMeasureTitle = (metadata, series) => {
  const measure = series.dataSource.measure;
  const column = _.find(metadata.data.columns, (column) => column.fieldName === measure.columnName);
  const aggregationTypes = AGGREGATION_TYPES.filter(item => item.type === measure.aggregationFunction);
  const aggregationType = (aggregationTypes.length > 0) ? aggregationTypes[0] : null;

  if (!_.isUndefined(column) && !_.isEmpty(column.name) && (aggregationType !== null) && !_.isEmpty(aggregationType.title)) {
    return I18n.t('shared.visualizations.panes.data.fields.measure.color_and_flyout_label').
      format(column.name, aggregationType.title);
  } else if (!_.isUndefined(column) && !_.isEmpty(column.name)) {
    return column.name;
  } else {
    return I18n.t('shared.visualizations.panes.data.fields.measure.no_value');
  }
};

// Private functions
//
function getSeriesIndexFromFlyoutSeriesRelativeIndex(state, flyoutSeriesIndex) {

  const firstFlyoutSeriesIndex = _.findIndex(state.series, (item) => item.type === SERIES_TYPE_FLYOUT);

  const seriesIndex = (firstFlyoutSeriesIndex == -1) ?
    flyoutSeriesIndex :
    firstFlyoutSeriesIndex + flyoutSeriesIndex;

  return seriesIndex;
}
