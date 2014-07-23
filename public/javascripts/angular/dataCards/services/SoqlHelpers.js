angular.module('dataCards').factory('SoqlHelpers', function() {
  var timeIntervalToDateTrunc = {
    DAY: 'ymd',
    MONTH: 'ym',
    YEAR: 'y'
  }
  var SoqlHelpers = {
    encodeSoqlString: encodeSoqlString,
    encodePrimitive: encodePrimitive,
    replaceHyphensWithUnderscores: replaceHyphensWithUnderscores,
    timeIntervalToDateTrunc: timeIntervalToDateTrunc
  };

  function encodeSoqlString(string) {
    return "'" + string.replace(/'/g, "''") + "'";
  };

  function encodePrimitive(primitive) {
    if (_.isString(primitive)) {
      return SoqlHelpers.encodeSoqlString(primitive);
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
