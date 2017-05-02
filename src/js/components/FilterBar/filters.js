import _ from 'lodash';
import { translate as t } from '../../common/I18n';
import { getPrecision, roundToPrecision } from '../../common/numbers';
import { formatDate } from '../../common/dates';

export function getDefaultFilterForColumn(column) {
  return {
    function: 'noop',
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
      function: 'binaryOperator',
      joinOn: isNegated ? 'AND' : 'OR',
      arguments: _.map(values, toArgument)
    });
  }
}

export function getFilterToggleText(filter, column) {
  if (filter.function === 'noop') {
    return column.name;
  }

  switch (column.dataTypeName) {
    case 'calendar_date': {
      const { start, end } = filter.arguments;

      if (start && end) {
        const startLabel = formatDate(start, 'l');
        const endLabel = formatDate(end, 'l');

        return t('filter_bar.range_filter.range_label').format(startLabel, endLabel);
      } else {
        return column.name;
      }
    }

    case 'money':
    case 'number': {
      const { start, end } = _.defaultTo(filter.arguments, {});

      const step = _.min(_.map([column.rangeMin, column.rangeMax], getPrecision));
      const startLabel = roundToPrecision(start, step);
      const endLabel = roundToPrecision(end, step);

      const hasMinValue = _.isFinite(start) && !_.isEqual(column.rangeMin, startLabel);
      const hasMaxValue = _.isFinite(end) && !_.isEqual(column.rangeMax, endLabel);

      if (hasMinValue && hasMaxValue) {
        return t('filter_bar.range_filter.range_label').format(startLabel, endLabel);
      } else if (hasMinValue) {
        return t('filter_bar.range_filter.greater_label').format(startLabel);
      } else if (hasMaxValue) {
        return t('filter_bar.range_filter.less_label').format(endLabel);
      } else {
        return column.name;
      }
    }

    case 'text': {
      const values = _.map(filter.arguments, 'operand');
      const valueCount = _.size(values);
      const firstValue = _.first(values);
      const isNegated = _.toLower(filter.joinOn) === 'and';

      if (isNegated) {
        if (valueCount > 1) {
          return t('filter_bar.text_filter.n_values_negated').format(valueCount);
        } else if (_.isString(firstValue)) {
          return t('filter_bar.text_filter.single_value_negated').format(firstValue);
        } else {
          return t('filter_bar.text_filter.no_value_negated');
        }
      } else if (valueCount > 1) {
        return t('filter_bar.text_filter.n_values').format(valueCount);
      } else if (_.isString(firstValue)) {
        return firstValue;
      } else {
        return t('filter_bar.text_filter.no_value');
      }
    }

    default:
      console.error(`Unsupported column type "${column.dataTypeName}"`);
  }
}
