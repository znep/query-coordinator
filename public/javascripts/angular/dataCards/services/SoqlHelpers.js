angular.module('dataCards').factory('SoqlHelpers', function() {
  var SoqlHelpers = {
    encodeSoqlString: encodeSoqlString,
    encodePrimitive: encodePrimitive
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

  return SoqlHelpers;
});
