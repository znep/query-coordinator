import _ from 'lodash';
import utils from 'socrata-utils';
import { translate } from '../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';

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
  const rowDisplayUnit = _.get(action, 'phidippidesMetadata.rowDisplayUnit', translate('visualizations.common.unit.one'));
  const unitOne = _.get(series, 'unit.one', null);
  const unitOther = _.get(series, 'unit.other', null);

  if (unitOne === null) {
    setStringValueOrDefaultValue(series, 'unit.one', rowDisplayUnit);
  }

  if (unitOther === null) {
    setStringValueOrDefaultValue(series, 'unit.other', utils.pluralize(rowDisplayUnit));
  }
};

/**
 * Adds a debounce of some constant time (defined in constants.js)
 * to an arbitrary function that will be passed event.target.value
 * or use the specified valueHandler function's return value.
 *
 * onDebouncedEvent is a workaround for React synthentic event
 * pooling. We can't asynchronously access the event that is
 * passed to a React event handler because of its reuse (React
 * immediately nulls the value).
 *
 * Usage:
 * <input onChange={onDebouncedEvent(this, this.props.onChangeText)} />
 * <input onChange={onDebouncedEvent(this, this.props.onChangeOtherText, () => 'always')} />
 * ...
 * this.props.onChangeText = (text) => dispatch(changeText(text));
 * this.props.onChangeOtherText = (text) => {
 *   assert(text === 'always');
 *   dispatch(changeOtherText(text));
 * });
 *
 * // What happens under the hood?
 * this['onChangeText9290df02'] ||= _.debounce(this.props.onChangeText, INPUT_DEBOUNCE_MILLISECONDS);
 * this['onChangeText9290df02'](event.target.value);
 *
 * Caveats:
 * - Only use in a React component.
 * - Only use synchronous computations in the valueHandler.
 */
export const onDebouncedEvent = (componentInstance, propertyEventHandler, valueHandler) => {
  return (event) => {
    const value = _.isFunction(valueHandler) ? valueHandler(event) : event.target.value;
    const fingerprint = btoa(propertyEventHandler);
    const debouncedEventHandler = `onDebouncedEvent${fingerprint}`;
    const isAlreadyDebounced = _.isFunction(componentInstance[debouncedEventHandler]);

    componentInstance[debouncedEventHandler] = isAlreadyDebounced ?
      componentInstance[debouncedEventHandler] :
      _.debounce(propertyEventHandler, INPUT_DEBOUNCE_MILLISECONDS);

    componentInstance[debouncedEventHandler](value);
  };
}
