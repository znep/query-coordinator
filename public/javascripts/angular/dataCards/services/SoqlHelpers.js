angular.module('dataCards').factory('SoqlHelpers', function() {
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
    replaceHyphensWithUnderscores: replaceHyphensWithUnderscores,
    timeIntervalToDateTrunc: timeIntervalToDateTrunc,
    stripWhereClauseFragmentForFieldName: stripWhereClauseFragmentForFieldName
  };

  function encodeSoqlString(string) {
    return "'{0}'".format(string.replace(/'/g, "''"));
  }

  function encodeSoqlDate(date) {
    // Slice off the time zone.
    return SoqlHelpers.encodeSoqlString(moment(date).format().slice(0, -6));
  }

  function encodePrimitive(primitive) {
    if (_.isString(primitive)) {
      return SoqlHelpers.encodeSoqlString(primitive);
    } else if (_.isDate(primitive) || primitive instanceof moment().constructor) {
      return SoqlHelpers.encodeSoqlDate(primitive);
    } else if (_.isNumber(primitive) || _.isBoolean(primitive)) {
      return primitive;
    } else {
      throw new Error('Unsupported encode passed to SoqlHelpers.encodePrimitive');
    }
  }

  function replaceHyphensWithUnderscores(fragment) {
    if (typeof fragment !== 'string') {
      throw new Error('Cannot replace hyphens with underscores for non-string arguments.');
    }
    return fragment.replace(/\-/g, '_');
  }


  // Since we need to be able to render the unfiltered values outside
  // of a timeline chart's current selection area, we need to 'filter'
  // those data outside the selection manually rather than using SoQL.
  // As a result, we need to make sure we never exclude any data that
  // belongs to the card making the request; this function will look
  // through a SoQL query string that is about to be used in a data
  // request and remove any where clauses that reference the fieldName
  // that corresponds to this instance of the visualization.
  function stripWhereClauseFragmentForFieldName(fieldName, whereClause, activeFilters) {
    if (_.isEmpty(whereClause)) {
      return;
    }

    var myWhereClauseFragments =_.invoke(activeFilters, 'generateSoqlWhereFragment', fieldName);

    _.each(myWhereClauseFragments, function(fragment) {
      whereClause = whereClause.replace(fragment, '');
    });

    return whereClause;
  }

  return SoqlHelpers;
});
