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
    timeIntervalToDateTrunc: timeIntervalToDateTrunc
  };

  function encodeSoqlString(string) {
    return "'" + string.replace(/'/g, "''") + "'";
  };

  function encodeSoqlDate(date) {
    // Slice off the time zone.
    return SoqlHelpers.encodeSoqlString(moment(date).format().slice(0, -6));
  };

  function encodePrimitive(primitive) {
    if (_.isString(primitive)) {
      return SoqlHelpers.encodeSoqlString(primitive);
    } else if (_.isDate(primitive) || primitive instanceof moment().constructor) {
      return SoqlHelpers.encodeSoqlDate(primitive);
    } else {
      throw new Error('Unsupported encode passed to SoqlHelpers.encodePrimitive');
    }
  };

  function replaceHyphensWithUnderscores(fragment) {
    if (typeof fragment !== 'string') {
      throw new Error('Cannot replace hyphens with underscores for non-string arguments.');
    }
    return fragment.replace(/\-/g, '_');
  };

  return SoqlHelpers;
});
