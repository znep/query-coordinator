var SoqlHelpers = (function(_, utils) {
  'use strict';

  var VALID_BINARY_OPERATORS = ['=', '!=', '<', '<=', '>', '>='];

  /**
   * 'Public' methods
   */

  /**
   * @param {Object} vif
   */
  function whereClauseNotFilteringOwnColumn(vif) {
    var whereClauseComponents = _whereClauseFromVif(vif, false);

    if (whereClauseComponents) {
      return whereClauseComponents;
    }

    return '';
  }

  /**
   * @param {Object} vif
   */
  function whereClauseFilteringOwnColumn(vif) {
    var whereClauseComponents = _whereClauseFromVif(vif, true);

    if (whereClauseComponents) {
      return whereClauseComponents;
    }

    return '';
  }

  /**
   * 'Private' methods
   */

  function _whereClauseFromVif(vif, filterOwnColumn) {
    utils.assertHasProperties(
      vif,
      'columnName',
      'filters'
    );
    utils.assertIsOneOfTypes(vif.columnName, 'string');
    utils.assertIsOneOfTypes(vif.filters, 'object');
    utils.assert(_.isArray(vif.filters), '`vif.filters` must be an array.');

    return vif.
    filters.
    filter(
      function(filter) {
        return filterOwnColumn || (filter.columnName !== vif.columnName);
      }
    ).map(
      _filterToWhereClauseComponent
    ).
    join(' AND ');
  }

  function _filterToWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'function',
      'arguments'
    );

    switch (filter['function']) {
      case 'binaryOperator':
        if (filter.arguments instanceof Array) {
          return _multipleBinaryOperatorWhereClauseComponent(filter);
        } else {
          return _binaryOperatorWhereClauseComponent(filter);
        }
        break;
      case 'binaryComputedGeoregionOperator':
        return _binaryComputedGeoregionOperatorWhereClauseComponent(filter);
      case 'isNull':
        return _isNullWhereClauseComponent(filter);
      case 'timeRange':
        return _timeRangeWhereClauseComponent(filter);
      case 'valueRange':
        return _valueRangeWhereClauseComponent(filter);
      default:
        throw new Error(
          'Invalid filter function: `{0}`.'.format(filter['function'])
        );
    }
  }

  function _soqlEncodeColumnName(columnName) {
    utils.assertIsOneOfTypes(columnName, 'string');

    return '`{0}`'.format(
      columnName.replace(/\-/g, '_')
    );
  }

  function _soqlEncodeValue(value) {
    // Note: These conditionals will fall through.
    if (_.isString(value)) {
      return _soqlEncodeString(value);
    }

    if (_.isDate(value)) {
      return _soqlEncodeDate(value);
    }

    if (_.isNumber(value) || _.isBoolean(value)) {
      return value;
    }

    throw new Error(
      'Cannot soql-encode value of type: {0}'.format(typeof value)
    );
  }

  function _soqlEncodeString(value) {
    return "'{0}'".format(value.replace(/'/g, "''")); // eslint-disable-line quotes
  }

  function _soqlEncodeDate(value) {
    return _soqlEncodeString(
      _serializeFloatingTimestamp(
        value
      )
    );
  }

  function _serializeFloatingTimestamp(date) {
    function _formatToTwoPlaces(value) {
      return (value < 10) ?
      '0' + value.toString() :
        value.toString();
    }

    return '{0}-{1}-{2}T{3}:{4}:{5}'.format(
      date.getFullYear(),
      // The month component of JavaScript dates is 0-indexed (I have no idea
      // why) so when we are serializing a JavaScript date as ISO-8601 date we
      // need to increment the month value.
      _formatToTwoPlaces(date.getMonth() + 1),
      _formatToTwoPlaces(date.getDate()),
      _formatToTwoPlaces(date.getHours()),
      _formatToTwoPlaces(date.getMinutes()),
      _formatToTwoPlaces(date.getSeconds())
    );
  }

  function _binaryOperatorWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments',
      'arguments.operator',
      'arguments.operand'
    );
    utils.assert(
      VALID_BINARY_OPERATORS.indexOf(filter.arguments.operator) > -1,
      'Invalid binary operator: `{0}`'.format(filter.arguments.operator)
    );

    return '{0} {1} {2}'.format(
      _soqlEncodeColumnName(filter.columnName),
      filter.arguments.operator,
      _soqlEncodeValue(filter.arguments.operand)
    );
  }

  function _multipleBinaryOperatorWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments'
    );

    var clauses = [];

    for (var i = 0; filter.arguments.length > i; i++ ) {
      utils.assert(
        VALID_BINARY_OPERATORS.indexOf(filter.arguments[i].operator) > -1,
        'Invalid binary operator: `{0}`'.format(filter.arguments[i].operator)
      );

      clauses.push('{0} {1} {2}'.format(
        _soqlEncodeColumnName(filter.columnName),
        filter.arguments[i].operator,
        _soqlEncodeValue(filter.arguments[i].operand)
      ));
    }

    return '(' + clauses.join(' OR ') + ')';
  }

  function _binaryComputedGeoregionOperatorWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments',
      'arguments.computedColumnName',
      'arguments.operator',
      'arguments.operand'
    );
    utils.assert(
      VALID_BINARY_OPERATORS.indexOf(filter.arguments.operator) > -1,
      'Invalid binary operator: `{0}`'.format(filter.arguments.operator)
    );

    return '{0} {1} {2}'.format(
      _soqlEncodeColumnName(filter.arguments.computedColumnName),
      filter.arguments.operator,
      _soqlEncodeValue(filter.arguments.operand)
    );
  }

  function _isNullWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments',
      'arguments.isNull'
    );

    return '{0} {1}' .format(
      _soqlEncodeColumnName(filter.columnName),
      filter.arguments.isNull ? 'IS NULL' : 'IS NOT NULL'
    );
  }

  function _timeRangeWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments',
      'arguments.start',
      'arguments.end'
    );

    if (filter.arguments.start && filter.arguments.end) {
      return '{0} >= {1} AND {0} < {2}'.format(
        _soqlEncodeColumnName(filter.columnName),
        _soqlEncodeValue(filter.arguments.start),
        _soqlEncodeValue(filter.arguments.end)
      );
    } else if (filter.arguments.start) {
      return '{0} >= {1}'.format(
        _soqlEncodeColumnName(filter.columnName),
        _soqlEncodeValue(filter.arguments.start)
      );
    } else if (filter.arguments.end) {
      return '{0} < {1}'.format(
        _soqlEncodeColumnName(filter.columnName),
        _soqlEncodeValue(filter.arguments.end)
      );
    }
  }

  function _valueRangeWhereClauseComponent(filter) {
    utils.assertHasProperties(
      filter,
      'columnName',
      'arguments',
      'arguments.start',
      'arguments.end'
    );

    if (filter.arguments.start && filter.arguments.end) {
      return '{0} >= {1} AND {0} < {2}'.format(
          _soqlEncodeColumnName(filter.columnName),
          _soqlEncodeValue(filter.arguments.start),
          _soqlEncodeValue(filter.arguments.end)
      );
    } else if (filter.arguments.start) {
      return '{0} >= {1}'.format(
          _soqlEncodeColumnName(filter.columnName),
          _soqlEncodeValue(filter.arguments.start)
      );
    } else if (filter.arguments.end) {
      return '{0} < {1}'.format(
          _soqlEncodeColumnName(filter.columnName),
          _soqlEncodeValue(filter.arguments.end)
      );
    }
  }

  return {
    whereClauseNotFilteringOwnColumn: whereClauseNotFilteringOwnColumn,
    whereClauseFilteringOwnColumn: whereClauseFilteringOwnColumn
  };

})(_, window.socrata.utils);
