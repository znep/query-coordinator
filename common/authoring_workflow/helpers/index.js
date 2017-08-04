import _ from 'lodash';
import utils from 'common/js_utils';
import I18n from 'common/i18n';
import { AGGREGATION_TYPES, COLOR_PALETTE_VALUES } from '../constants';

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

  if (dimensionGroupingColumnName === null) {

    // If the dimension grouping functionality is being disabled, then we
    // also want to remove any color palette and legend visibility that has been set.
    _.unset(state, 'series[0].color.palette');
    _.unset(state, 'configuration.showLegend');
    _.unset(state, 'series[0].dataSource.dimension.grouping');

  } else {

    // Otherwise, if the color palette has not yet been set, then assign
    // the default palette.
    if (_.get(state, 'series[0].color.palette') === undefined) {
      _.set(state, 'series[0].color.palette', 'categorical');
    }

    // If legend visibility has not yet been set, then set it to visible
    if (_.get(state, 'configuration.showLegend') === undefined) {
      _.set(state, 'configuration.showLegend', true);
    }
  };
};

export const appendSeries = (state, isInitialLoad) => {

  // For multi-series, we use the color palette on the first series, but the palettes on all series should be in sync
  // so that if the first series is deleted, the palette can be obtained from the second (now first) series.
  // 
  // The 'custom' palette for multi-series, does not apply.  We simply set the primary color on each series.
  //
  // If we are transitioning to multi-series in this method (and not during the initial load), set the palette to 'categorical'.
  //
  if ((state.series.length == 1) && !isInitialLoad) {
    _.set(state, 'series[0].color.palette', 'categorical');
  }

  // Now create the new series, by cloning the first series.
  //
  const clonedSeries = _.cloneDeep(state.series[0]);

  // Set the measure properties
  //
  _.set(clonedSeries, 'dataSource.measure.aggregationFunction', 'count');
  _.set(clonedSeries, 'dataSource.measure.columnName', null);

  // Set primary color equal to the index color of the current color palette.  If no palette is set, use categorical.
  //
  const palette = _.get(clonedSeries, 'color.palette', 'categorical');
  const colors = COLOR_PALETTE_VALUES[palette];
  const index = state.series.length % colors.length;

  _.set(clonedSeries, 'color.primary', colors[index]);
  _.set(clonedSeries, 'color.secondary', colors[index]);

  // Append the series
  //
  state.series.push(clonedSeries);

  // Adjust any other properties in the vif for multi-series
  //
  forEachSeries(state, series => {
    _.unset(series, 'dataSource.dimension.grouping');
  });

  // If legend visibility has not yet been set, then set it to visible.
  //
  if (_.get(state, 'configuration.showLegend') === undefined) {
    _.set(state, 'configuration.showLegend', true);
  }
};

export const removeSeries = (state, seriesIndex) => {

  // Remove the series
  //
  state.series.splice(seriesIndex, 1);

  // If no longer multi-series, remove multi-series properties
  //
  if (state.series.length == 1) {

    _.unset(state, 'configuration.showLegend');
    _.unset(state, 'series[0].color.palette');

    const color = COLOR_PALETTE_VALUES.categorical[0];
    _.set(state, 'series[0].color.primary', color);
    _.set(state, 'series[0].color.secondary', color);
  }
};

export const isGroupingOrMultiSeries = (state) => {

  const isGrouping = (_.get(state, 'series[0].dataSource.dimension.grouping') !== undefined);
  const isMultiSeries = (state.series.length > 1);

  return isGrouping || isMultiSeries;
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
