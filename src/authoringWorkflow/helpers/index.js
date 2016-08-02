import _ from 'lodash';
import utils from 'socrata-utils';
import { translate } from '../../I18n';

export const setValueOrDefaultValue = (object, path, value, defaultValue) => {
  var hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath && !_.isUndefined(defaultValue)) {
    _.set(object, path, defaultValue);
  }
}

export const setValueOrDeleteProperty = (object, path, value) => {
  var hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath) {
    _.unset(object, path);
  }
}

export const forEachSeries = (state, callback) => {
  _.each(state.series, callback);
};

export const isNonEmptyString = string => {
  return _.isString(string) && string.trim().length > 0;
};

export const setUnits = (series, action) => {
  let rowDisplayUnit = _.get(action, 'phidippidesMetadata.rowDisplayUnit', translate('visualizations.common.unit.one'));
  let unitOne = _.get(series, 'unit.one', null);
  let unitOther = _.get(series, 'unit.other', null);

  if (unitOne === null) {
    setValueOrDefaultValue(series, 'unit.one', rowDisplayUnit);
  }

  if (unitOther === null) {
    setValueOrDefaultValue(series, 'unit.other', utils.pluralize(rowDisplayUnit));
  }
};
