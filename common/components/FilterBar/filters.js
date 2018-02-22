import _ from 'lodash';
import I18n from 'common/i18n';
import { getPrecision, roundToPrecision } from 'common/numbers';
import { formatDate } from 'common/dates';
import { assertIsString } from 'common/js_utils';

export function getDefaultFilterForColumn(column) {
  return {
    'function': 'noop',
    columnName: column.fieldName,
    arguments: null,
    isHidden: true
  };
}

export function getTextFilter(column, filter, values, isNegated) {
  if (_.isEmpty(values)) {
    const { isHidden } = filter;
    return _.merge({}, getDefaultFilterForColumn(column), { isHidden });
  } else {
    const toArgument = (value) => {
      if (_.isNull(value)) {
        return {
          operator: isNegated ? 'IS NOT NULL' : 'IS NULL'
        };
      } else {
        return {
          operator: isNegated ? '!=' : '=',
          operand: value
        };
      }
    };

    return _.assign({}, filter, {
      'function': 'binaryOperator',
      joinOn: isNegated ? 'AND' : 'OR',
      arguments: _.map(values, toArgument)
    });
  }
}

export function getCheckboxFilter(column, filter, values) {
  if (_.isEmpty(values)) {
    const { isHidden } = filter;
    return _.merge({}, getDefaultFilterForColumn(column), { isHidden });
  } else {
    const toArgument = (value) => {
      if (_.isNull(value)) {
        return {
          operator: 'IS NULL'
        };
      } else {
        return {
          operator: '=',
          operand: value
        };
      }
    };

    return _.assign({}, filter, {
      'function': 'binaryOperator',
      joinOn: 'OR',
      arguments: _.map(values, toArgument)
    });
  }
}

export function getFilterHumanText(filter, column) {
  if (filter.function === 'noop') { // eslint-disable-line dot-notation
    return I18n.t('shared.components.filter_bar.select');
  }

  switch (column.renderTypeName) {
    case 'calendar_date': {
      const { start, end } = filter.arguments;

      if (start && end) {
        const startLabel = formatDate(start, 'l');
        const endLabel = formatDate(end, 'l');

        return I18n.t('shared.components.filter_bar.range_filter.range_label').format(startLabel, endLabel);
      } else {
        return column.name;
      }
    }

    case 'money':
    case 'number':
      return getNumberFilterHumanText(filter, column);

    case 'text':
      return getTextFilterHumanText(filter, column);

    case 'checkbox':
      return getCheckboxFilterHumanText(filter, column);

    default:
      console.error(`Unsupported column type "${column.renderTypeName}"`); // eslint-disable-line no-console
  }
}

// Private functions

function getNumberFilterHumanText(filter, column) {
  const filterFunction = filter.function;
  assertIsString(filterFunction, `Expected 'function' property to be a string, was: ${filter.function}`);

    // Apart from valueRange, these filters use strings in their arguments for arbitrary numerical precision.
  const { start, end, value } = _.defaultTo(filter.arguments, {});

  if (filterFunction === 'valueRange') {
    // Old-style ambiguous filter. We won't generate new ones, but we still need
    // to display them. They're migrated when the user opens the dropdown.

    const step = _.min(_.map([column.rangeMin, column.rangeMax], getPrecision));
    const startLabel = roundToPrecision(start, step);
    const endLabel = roundToPrecision(end, step);

    const hasMinValue = _.isFinite(start) && !_.isEqual(column.rangeMin, startLabel);
    const hasMaxValue = _.isFinite(end) && !_.isEqual(column.rangeMax, endLabel);

    if (hasMinValue || hasMaxValue) {
      return I18n.t('shared.components.filter_bar.range_filter.range_label').format(startLabel, endLabel);
    } else {
      return column.name;
    }
  }

  // Note early return above.
  let key;
  if (filterFunction === 'rangeInclusive') {
    assertIsString(start);
    assertIsString(end);
    key = 'shared.components.filter_bar.range_filter.range_inclusive_label';
  } else if (filterFunction === 'rangeExclusive') {
    assertIsString(start);
    assertIsString(end);
    key = 'shared.components.filter_bar.range_filter.range_exclusive_label';
  } else if (filterFunction === '>') {
    assertIsString(value);
    key = 'shared.components.filter_bar.range_filter.above_label';
  } else if (filterFunction === '>=') {
    assertIsString(value);
    key = 'shared.components.filter_bar.range_filter.at_least_label';
  } else if (filterFunction === '<') {
    assertIsString(value);
    key = 'shared.components.filter_bar.range_filter.below_label';
  } else if (filterFunction === '<=') {
    assertIsString(value);
    key = 'shared.components.filter_bar.range_filter.at_most_label';
  } else {
    throw new Error(`Unknown function: ${filterFunction}`);
  }

  // Punting on number formatting for now.
  return I18n.t(key).format(filter.arguments || {});
}

function getTextFilterHumanText(filter, column) {
  const values = _.map(filter.arguments, 'operand');
  const valueCount = _.size(values);
  const firstValue = _.first(values);
  const isNegated = _.toLower(filter.joinOn) === 'and';

  if (isNegated) {
    if (valueCount > 1) {
      return I18n.t('shared.components.filter_bar.text_filter.n_values_negated').format(valueCount);
    } else if (_.isString(firstValue)) {
      return I18n.t('shared.components.filter_bar.text_filter.single_value_negated').format(firstValue);
    } else {
      return I18n.t('shared.components.filter_bar.text_filter.no_value_negated');
    }
  } else if (valueCount > 1) {
    return I18n.t('shared.components.filter_bar.text_filter.n_values').format(valueCount);
  } else if (_.isString(firstValue)) {
    return firstValue;
  } else {
    return I18n.t('shared.components.filter_bar.text_filter.no_value');
  }
}

function getCheckboxFilterHumanText(filter, column) {
  const values = _.map(filter.arguments, 'operand');
  const valueCount = _.size(values);
  const firstValue = _.first(values);

  if (valueCount > 1) {
    return I18n.t('shared.components.filter_bar.checkbox_filter.n_values').format(valueCount);
  } else if (_.isBoolean(firstValue)) {
    return boolToString(firstValue);
  } else {
    return I18n.t('shared.components.filter_bar.checkbox_filter.no_value');
  }
}

function boolToString(value) {
  if (value === true) {
    return I18n.t('shared.components.filter_bar.checkbox_filter.true_value');
  } else if (value === false) {
    return I18n.t('shared.components.filter_bar.checkbox_filter.false_value');
  } else {
    return I18n.t('shared.components.filter_bar.checkbox_filter.no_value');
  }
}
