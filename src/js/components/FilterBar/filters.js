import _ from 'lodash';
import { translate as t } from '../../common/I18n';

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
      var value = _.get(filter, 'parameters.arguments', {});

      var hasMinValue = _.isFinite(value.start) && !_.isEqual(column.rangeMin, value.start);
      var hasMaxValue = _.isFinite(value.end) && !_.isEqual(column.rangeMax, value.end);

      if (hasMinValue && hasMaxValue) {
        return t('filter_bar.range_filter.range_label').format(value.start, value.end);
      } else if (hasMinValue) {
        return t('filter_bar.range_filter.greater_label').format(value.start);
      } else if (hasMaxValue) {
        return t('filter_bar.range_filter.less_label').format(value.end);
      } else {
        return t('filter_bar.all');
      }

    case 'text':
      return _.defaultTo(filter.parameters.arguments.operand, t('filter_bar.all'));

    default:
      return '';
  }
}
