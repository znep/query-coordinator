import _ from 'lodash';

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
    return getDefaultFilterForColumn(column);
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

    return _.merge({}, filter, {
      'function': 'binaryOperator',
      joinOn: isNegated ? 'AND' : 'OR',
      arguments: _.map(values, toArgument)
    });
  }
}
