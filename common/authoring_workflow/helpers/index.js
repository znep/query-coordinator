import _ from 'lodash';
import utils from 'common/js_utils';
import I18n from 'common/i18n';

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
  const rowDisplayUnit = _.get(action, 'phidippidesMetadata.rowDisplayUnit', null);
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
    if (_.get(state, 'series[0].color.palette', null) === null) {
      _.set(state, 'series[0].color.palette', 'categorical');
    }

    // If legend visibility has not yet been set, then set it to visible
    if (_.get(state, 'configuration.showLegend', null) === null) {
      _.set(state, 'configuration.showLegend', true);
    }
  };
};

export const appendSeriesWithMeasure = (state, measure) => {

    // Clone the first series
    //
    const clonedSeries = _.cloneDeep(state.series[0]);

    // Set the measure properties
    //
    _.set(clonedSeries, 'dataSource.measure.aggregationFunction', measure.aggregationFunction);
    _.set(clonedSeries, 'dataSource.measure.columnName', measure.columnName);
    _.set(clonedSeries, 'dataSource.measure.label', measure.label);

    // Append the series
    //
    state.series.push(clonedSeries);

    // Adjust any other properties in the vif for multi-series
    //
    forEachSeries(state, series => {

      // Remove any properties that do not apply to multi-series
      //
      _.unset(series, 'dataSource.dimension.grouping');

      // If the color palette has not yet been set, then assign the default palette.
      //
      if (_.get(series, 'color.palette', null) === null) {
        _.set(series, 'color.palette', 'categorical');
      }
    });

    // If legend visibility has not yet been set, then set it to visible
    //
    if (_.get(state, 'configuration.showLegend', null) === null) {
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

    forEachSeries(state, series => {
      _.unset(series, 'color.palette');
    });
  }
};

export const isGroupingOrMultiseries = (state) => {

  const isGrouping = (_.get(state, 'series[0].dataSource.dimension.grouping', null) !== null);
  const isMultiseries = (state.series.length > 1);

  return isGrouping || isMultiseries;
};