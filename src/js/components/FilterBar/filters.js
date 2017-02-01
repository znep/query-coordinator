import _ from 'lodash';
import { translate as t } from '../../common/I18n';
import { getPrecision, roundToPrecision } from '../../common/numbers';
import { formatDate, formatToInclusiveSoqlDateRange } from '../../common/dates';

export function getDefaultFilterForColumn(column) {
  return {
    'function': 'noop',
    columnName: column.fieldName,
    arguments: null,
    isHidden: true
  };
}

export function getToggleTextForFilter(filter, column) {
  switch (column.dataTypeName) {

    case 'calendar_date': {
      const { start, end } = _.defaultTo(filter.arguments, {});

      const inclusiveMinMax = formatToInclusiveSoqlDateRange({
        start: column.rangeMin,
        end: column.rangeMax
      });

      const isMinDateValue = _.isEqual(inclusiveMinMax.start, start);
      const isMaxDateValue = _.isEqual(inclusiveMinMax.end, end);

      if (_.isEmpty(filter.arguments) || (isMinDateValue && isMaxDateValue)) {
        return t('filter_bar.all');
      } else {
        return t('filter_bar.range_filter.range_label').format(formatDate(start), formatDate(end));
      }
    }

    case 'number': {
      const { start, end } = _.defaultTo(filter.arguments, {});

      const hasMinValue = _.isFinite(start) && !_.isEqual(column.rangeMin, start);
      const hasMaxValue = _.isFinite(end) && !_.isEqual(column.rangeMax, end);
      const step = _.min(_.map([column.rangeMin, column.rangeMax], getPrecision));

      const startLabel = roundToPrecision(start, step);
      const endLabel = roundToPrecision(end, step);

      if (hasMinValue && hasMaxValue) {
        return t('filter_bar.range_filter.range_label').format(startLabel, endLabel);
      } else if (hasMinValue) {
        return t('filter_bar.range_filter.greater_label').format(startLabel);
      } else if (hasMaxValue) {
        return t('filter_bar.range_filter.less_label').format(endLabel);
      } else {
        return t('filter_bar.all');
      }
    }

    case 'text':
      return _.get(filter, 'arguments.operand', t('filter_bar.all'));

    default:
      return '';
  }
}
