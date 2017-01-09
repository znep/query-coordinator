import _ from 'lodash';
import { translate as t } from '../../common/I18n';
import { getPrecision, roundToPrecision } from '../../common/numbers';

export function getDefaultFilterForColumn(column) {
  return {
    'function': 'noop',
    columnName: column.fieldName,
    arguments: null,
    isLocked: false,
    isHidden: false,
    isRequired: false,
    allowMultiple: false
  };
}

export function getToggleTextForFilter(filter, column) {
  switch (column.dataTypeName) {
    case 'number':
      var { start, end } = _.defaultTo(filter.arguments, {});

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
      return _.get(filter, 'arguments.operand', t('filter_bar.all'));

    default:
      return '';
  }
}
