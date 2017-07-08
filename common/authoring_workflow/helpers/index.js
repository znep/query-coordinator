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
