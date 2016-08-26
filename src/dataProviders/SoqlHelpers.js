var utils = require('socrata-utils');
var _ = require('lodash');

var VALID_BINARY_OPERATORS = ['=', '!=', '<', '<=', '>', '>='];

/**
 * 'Public' methods
 */

/**
 * @param {Object} vif
 * @param {Number} seriesIndex
 *
 * Note: Only works with VIF versions >= 2
 */
function dimension(vif, seriesIndex) {
  var aggregationFunction = _.get(
    vif.series[seriesIndex],
    'dataSource.dimension.aggregationFunction'
  );
  var columnName = _.get(
    vif.series[seriesIndex],
    'dataSource.dimension.columnName'
  );

  switch (aggregationFunction) {

    case 'sum':
      return ' SUM(`{0}`)'.format(columnName);

    case 'count':
      return 'COUNT(*)';

    default:
      return '`{0}`'.format(columnName);
  }
}

/**
 * Returns a safe alias for all dimension SQL references.
 */
function dimensionAlias() {
  return '__dimension_alias__';
}

/**
 * @param {Object} vif
 * @param {Number} seriesIndex
 *
 * Note: Only works with VIF versions >= 2
 */
function measure(vif, seriesIndex) {
  var aggregationFunction = _.get(
    vif.series[seriesIndex],
    'dataSource.measure.aggregationFunction'
  );
  var columnName = _.get(
    vif.series[seriesIndex],
    'dataSource.measure.columnName'
  );

  switch (aggregationFunction) {

    case 'sum':
      return ' SUM(`{0}`)'.format(columnName);

    case 'count':
      return 'COUNT(*)';

    default:
      return '`{0}`'.format(columnName);
  }
}

/**
 * Returns a safe alias for all measure SQL references.
 */
function measureAlias() {
  return '__measure_alias__';
}

/**
 * @param {Object} vif
 * @param {Number} seriesIndex
 * @param {String} dimensionOrMeasure
 *
 * If using with a version 1 VIF, only the first argument is required.
 */
function aggregationClause(vif, seriesIndex, dimensionOrMeasure) {
  var version = parseInt(_.get(vif, 'format.version', 1), 10);
  var aggregationFunction;
  var columnName;

  if (version === 1) {

    switch (_.get(vif, 'aggregation.function')) {

      case 'sum':
        return 'SUM(`{0}`)'.format(_.get(vif, 'aggregation.field'));

      case 'count':
      default:
        return 'COUNT(*)';
    }
  } else {

    utils.assert(
      dimensionOrMeasure === 'dimension' || dimensionOrMeasure === 'measure',
      `dimensionOrMeasure must be "dimension" or "measure", but was: ${dimensionOrMeasure}`
    );
    utils.assertIsOneOfTypes(seriesIndex, 'number', 'money');

    aggregationFunction = _.get(
      vif.series[seriesIndex],
      `dataSource.${dimensionOrMeasure}.aggregationFunction`
    );
    columnName = _.get(
      vif.series[seriesIndex],
      `dataSource.${dimensionOrMeasure}.columnName`
    );

    switch (aggregationFunction) {

      case 'sum':
        return 'SUM(`{0}`)'.format(columnName);

      case 'count':
        return 'COUNT(*)';

      default:
        return '`{0}`'.format(columnName);
    }
  }
}

/**
 * @param {Object} vif
 * @param {Number} seriesIndex
 *
 * If using with a version 1 VIF, only the first argument is required.
 */
function whereClauseNotFilteringOwnColumn(vif, seriesIndex) {
  var version = parseInt(_.get(vif, 'format.version', 1), 10);
  var whereClauseComponents;

  if (version === 1) {
    whereClauseComponents = whereClauseFromVif(vif, false);
  } else {
    whereClauseComponents = whereClauseFromSeries(vif, seriesIndex, false);
  }

  return (whereClauseComponents) ? whereClauseComponents : '';
}

/**
 * @param {Object} vif
 * @param {Number} seriesIndex
 *
 * If using with a version 1 VIF, only the first argument is required.
 */
function whereClauseFilteringOwnColumn(vif, seriesIndex) {
  var version = parseInt(_.get(vif, 'format.version', 1), 10);
  var whereClauseComponents;

  if (version === 1) {
    whereClauseComponents = whereClauseFromVif(vif, true);
  } else {
    whereClauseComponents = whereClauseFromSeries(vif, seriesIndex, true);
  }

  return (whereClauseComponents) ? whereClauseComponents : '';
}

/**
 * 'Private' methods
 */

function whereClauseFromVif(vif, filterOwnColumn) {
  var filters = vif.filters || [];
  var isTable = false;

  utils.assertHasProperties(
    vif,
    'type',
    'filters'
  );

  if (vif.type === 'table') {
    isTable = true;
  } else {

    utils.assertHasProperties(
      vif,
      'columnName'
    );
    utils.assertIsOneOfTypes(vif.columnName, 'string');
  }

  utils.assertInstanceOf(filters, Array);

  return filters.
    filter(
      function(filter) {
        return (isTable) ?
          true :
          filterOwnColumn || (filter.columnName !== vif.columnName);
      }
    ).
    map(filterToWhereClauseComponent).
    join(' AND ');
}

function whereClauseFromSeries(vif, seriesIndex, filterOwnColumn) {
  var series;
  var filters;
  var isTable = false;

  utils.assertHasProperty(
    vif,
    'series'
  );
  utils.assert(
    vif.series.length && vif.series.length >= seriesIndex,
    '`vif.series` is not an array or seriesIndex is out of bounds.'
  );

  series = vif.series[seriesIndex];

  utils.assertHasProperty(
    series,
    'dataSource'
  );
  utils.assertHasProperties(
    series.dataSource,
    'dimension',
    'filters',
    'type'
  );

  if (series.type === 'table') {
    isTable = true;
  } else {

    utils.assertHasProperty(
      series.dataSource.dimension,
      'columnName'
    );
    utils.assertIsOneOfTypes(
      series.dataSource.dimension.columnName,
      'string'
    );
  }

  utils.assertInstanceOf(series.dataSource.filters, Array);

  filters = series.dataSource.filters;

  return filters.
    filter(
      function(filter) {
        return (isTable) ?
          true :
          (
            filterOwnColumn ||
            (filter.columnName !== series.dataSource.dimension.columnName)
          );
      }
    ).
    map(filterToWhereClauseComponent).
    join(' AND ');
}

function orderByClauseFromSeries(vif, seriesIndex) {
  const series = _.get(vif, `series[${seriesIndex}]`);
  const dimensionAggregation = _.get(series, 'dataSource.dimension.aggregationFunction');
  const measureAggregation = _.get(series, 'dataSource.measure.aggregationFunction');
  const isUnaggregated = _.isNull(dimensionAggregation) && _.isNull(measureAggregation);
  const orderBy = _.get(series, 'dataSource.orderBy', {
    parameter: isUnaggregated ? 'measure' : 'dimension',
    sort: isUnaggregated ? 'desc' : 'asc'
  });

  utils.assertIsOneOfTypes(orderBy.parameter, 'string');
  utils.assertIsOneOfTypes(orderBy.sort, 'string');

  utils.assert(
     _.includes(['dimension', 'measure'], _.lowerCase(orderBy.parameter)),
     'The key parameter must have a value of "dimension" or "measure".'
  );

  utils.assert(
    _.includes(['asc', 'desc'], _.lowerCase(orderBy.sort)),
    'The key sort must have a value of "asc" or "desc"'
  );

  const sort = _.lowerCase(orderBy.sort) === 'asc' ?  'ASC' : 'DESC';
  const parameter = _.lowerCase(orderBy.parameter) === 'dimension' ?
    dimensionAlias() :
    measureAlias();

  return `${parameter} ${sort}`;
}

function filterToWhereClauseComponent(filter) {
  utils.assertHasProperties(
    filter,
    'columnName',
    'function',
    'arguments'
  );

  switch (filter.function) {
    case 'binaryOperator':
      return binaryOperatorWhereClauseComponent(filter);
    case 'binaryComputedGeoregionOperator':
      return binaryComputedGeoregionOperatorWhereClauseComponent(filter);
    case 'isNull':
      return isNullWhereClauseComponent(filter);
    case 'timeRange':
      return timeRangeWhereClauseComponent(filter);
    case 'valueRange':
      return valueRangeWhereClauseComponent(filter);
    default:
      throw new Error(
        'Invalid filter function: `{0}`.'.format(filter.function)
      );
  }
}

function soqlEncodeColumnName(columnName) {
  utils.assertIsOneOfTypes(columnName, 'string');

  return '`{0}`'.format(
    columnName.replace(/\-/g, '_')
  );
}

function soqlEncodeValue(value) {
  // Note: These conditionals will fall through.
  if (_.isString(value)) {
    return soqlEncodeString(value);
  }

  if (_.isDate(value)) {
    return soqlEncodeDate(value);
  }

  if (_.isNumber(value) || _.isBoolean(value)) {
    return value;
  }

  throw new Error(
    'Cannot soql-encode value of type: {0}'.format(typeof value)
  );
}

function soqlEncodeString(value) {
  return "'{0}'".format(value.replace(/'/g, "''"));
}

function soqlEncodeDate(value) {
  return soqlEncodeString(
    serializeFloatingTimestamp(
      value
    )
  );
}

function serializeFloatingTimestamp(date) {
  function formatToTwoPlaces(value) {
    return (value < 10) ?
      '0' + value.toString() :
      value.toString();
  }

  return '{0}-{1}-{2}T{3}:{4}:{5}'.format(
    date.getFullYear(),
    // The month component of JavaScript dates is 0-indexed (I have no idea
    // why) so when we are serializing a JavaScript date as ISO-8601 date we
    // need to increment the month value.
    formatToTwoPlaces(date.getMonth() + 1),
    formatToTwoPlaces(date.getDate()),
    formatToTwoPlaces(date.getHours()),
    formatToTwoPlaces(date.getMinutes()),
    formatToTwoPlaces(date.getSeconds())
  );
}

function binaryOperatorWhereClauseComponent(filter) {
  utils.assertHasProperties(
    filter,
    'columnName',
    'arguments'
  );

  // If `arguments` is an array, that means that we want multiple binary
  // operators to be joined with an 'OR'.
  if (_.isArray(filter.arguments)) {

    filter.arguments.forEach(function(argument) {

      utils.assertHasProperties(
        argument,
        'operator',
        'operand'
      );

      utils.assert(
        VALID_BINARY_OPERATORS.indexOf(argument.operator) > -1,
        'Invalid binary operator: `{0}`'.format(argument.operator)
      );
    });

    return '({0})'.format(
      filter.
        arguments.
        map(function(argument) {
          return '{0} {1} {2}'.format(
            soqlEncodeColumnName(filter.columnName),
            argument.operator,
            soqlEncodeValue(argument.operand)
          );
        }).
        join(' OR ')
      );
  // If `arguments` is an object, that means that we want this binary
  // operator to exist on its own (as if arguments were an array with one
  // element.
  } else {

    utils.assertHasProperties(
      filter,
      'arguments.operator',
      'arguments.operand'
    );

    utils.assert(
      VALID_BINARY_OPERATORS.indexOf(filter.arguments.operator) > -1,
      'Invalid binary operator: `{0}`'.format(filter.arguments.operator)
    );

    return '{0} {1} {2}'.format(
      soqlEncodeColumnName(filter.columnName),
      filter.arguments.operator,
      soqlEncodeValue(filter.arguments.operand)
    );
  }
}

function binaryComputedGeoregionOperatorWhereClauseComponent(filter) {
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
    soqlEncodeColumnName(filter.arguments.computedColumnName),
    filter.arguments.operator,
    soqlEncodeValue(filter.arguments.operand)
  );
}

function isNullWhereClauseComponent(filter) {
  utils.assertHasProperties(
    filter,
    'columnName',
    'arguments',
    'arguments.isNull'
  );

  return '{0} {1}' .format(
    soqlEncodeColumnName(filter.columnName),
    filter.arguments.isNull ? 'IS NULL' : 'IS NOT NULL'
  );
}

function timeRangeWhereClauseComponent(filter) {
  utils.assertHasProperties(
    filter,
    'columnName',
    'arguments',
    'arguments.start',
    'arguments.end'
  );

  return '{0} >= {1} AND {0} < {2}'.format(
    soqlEncodeColumnName(filter.columnName),
    soqlEncodeValue(filter.arguments.start),
    soqlEncodeValue(filter.arguments.end)
  );
}

function valueRangeWhereClauseComponent(filter) {
  utils.assertHasProperties(
    filter,
    'columnName',
    'arguments',
    'arguments.start',
    'arguments.end'
  );

  return '{0} >= {1} AND {0} < {2}'.format(
    soqlEncodeColumnName(filter.columnName),
    soqlEncodeValue(filter.arguments.start),
    soqlEncodeValue(filter.arguments.end)
  );
}

module.exports = {
  dimension,
  dimensionAlias,
  measure,
  measureAlias,
  aggregationClause,
  orderByClauseFromSeries,
  whereClauseNotFilteringOwnColumn,
  whereClauseFilteringOwnColumn
};
