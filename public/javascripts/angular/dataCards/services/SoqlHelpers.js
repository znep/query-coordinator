angular.module('dataCards.services').factory('SoqlHelpers', function(Constants, DateHelpers) {
  'use strict';

  var timeIntervalToDateTrunc = {
    DAY: 'ymd',
    MONTH: 'ym',
    YEAR: 'y'
  };
  var SoqlHelpers = {
    encodeSoqlString: encodeSoqlString,
    encodeSoqlDate: encodeSoqlDate,
    encodePrimitive: encodePrimitive,
    formatFieldName: formatFieldName,
    getFieldNameAlias: getFieldNameAlias,
    timeIntervalToDateTrunc: timeIntervalToDateTrunc,
    stripWhereClauseFragmentForFieldName: stripWhereClauseFragmentForFieldName
  };

  function encodeSoqlString(string) {
    return "'{0}'".format(string.replace(/'/g, "''")); //eslint-disable-line quotes
  }

  function encodeSoqlDate(date) {
    return SoqlHelpers.encodeSoqlString(
      DateHelpers.serializeFloatingTimestamp(date)
    );
  }

  function encodePrimitive(primitive) {
    if (_.isString(primitive)) {
      return SoqlHelpers.encodeSoqlString(primitive);
    } else if (_.isDate(primitive)) {
      return SoqlHelpers.encodeSoqlDate(primitive);
    } else if (_.isNumber(primitive) || _.isBoolean(primitive)) {
      return primitive;
    } else {
      throw new Error('Unsupported encode passed to SoqlHelpers.encodePrimitive');
    }
  }

  // Wrap fieldName in backticks and replace hyphens with underscores
  function formatFieldName(fieldName) {
    if (typeof fieldName !== 'string') {
      throw new Error('Cannot format fieldName for non-string arguments.');
    }
    return '`{0}`'.format(fieldName.replace(/\-/g, '_'));
  }

  // Returns an alias for a field that is very unlikely to cause a circular alias error.
  function getFieldNameAlias(fieldName) {
    if (!_.isPresent(fieldName)) {
      return '';
    }

    var plainFieldName = fieldName.replace(/[^\w]*/g, '');
    return Constants.COLUMN_ALIAS_GUARD_PREFIX + plainFieldName.toUpperCase();
  }

  /**
   * @param fieldName - The name of the field for which the where clause will be NOOPed
   * @param whereClause - The existing where clause containing all where clause fragments for all fields
   * @param activeFilters - The array of activeFilters from the card model
   *
   * This function replaces an existing whereClauseFragment with a tautology (i.e. 1=1)
   * in order to NOOP that particular clause. An example of where this is used is the
   * timeline chart which uses it to prevent filtering on its own selection.
   */
  function stripWhereClauseFragmentForFieldName(fieldName, whereClause, activeFilters) {

    if (_.isEmpty(whereClause)) {
      return;
    }

    window.socrata.utils.assert(_.isPresent(fieldName), 'fieldName cannot be blank');
    window.socrata.utils.assert(_.isArray(activeFilters), 'activeFilters must be an array');
    var myWhereClauseFragments = _.invoke(activeFilters, 'generateSoqlWhereFragment', fieldName);

    _.each(myWhereClauseFragments, function(fragment) {
      whereClause = whereClause.replace(fragment, '(1=1)');
    });

    return whereClause;
  }

  return SoqlHelpers;
});
