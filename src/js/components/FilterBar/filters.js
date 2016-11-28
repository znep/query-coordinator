import _ from 'lodash';
import { translate as t } from '../../common/I18n';
import { getPrecision, roundToPrecision } from '../../common/numbers';

export function getDefaultFilterForColumn(column) {
  let parameters;

  switch (column.dataTypeName) {
    case 'text':
      parameters = {
        'function': 'binaryOperator',
        columnName: column.fieldName,
        arguments: {
          operator: '=',
          operand: null
        }
      };
      break;

    case 'number':
      parameters = {
        'function': 'valueRange',
        columnName: column.fieldName,
        arguments: {
          start: column.rangeMin,
          end: column.rangeMax
        }
      };
      break;

    default:
      return null;
  }

  return {
    parameters,
    isLocked: false,
    isHidden: false,
    isRequired: false,
    allowMultiple: false
  };
}

export function getToggleTextForFilter(filter, column) {
  switch (column.dataTypeName) {
    case 'number':
      var { start, end } = _.get(filter, 'parameters.arguments', {});

      var hasMinValue = _.isFinite(start) && !_.isEqual(column.rangeMin, start);
      var hasMaxValue = _.isFinite(end) && !_.isEqual(column.rangeMax, end);
      var step = _.min(_.map([column.rangeMin, column.rangeMax], getPrecision));

      var startLabel = roundToPrecision(start, step);
      var endLabel = roundToPrecision(end, step);

      if (hasMinValue && hasMaxValue) {
        return t('filter_bar.range_filter.range_label').format(startLabel, endLabel);
      } else if (hasMinValue) {
        return t('filter_bar.range_filter.greater_label').format(startLabel);
      } else if (hasMaxValue) {
        return t('filter_bar.range_filter.less_label').format(endLabel);
      } else {
        return t('filter_bar.all');
      }

    case 'text':
      return _.defaultTo(filter.parameters.arguments.operand, t('filter_bar.all'));

    default:
      return '';
  }
}
