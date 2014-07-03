angular.module('dataCards').factory('SoqlHelpers', function(ModelHelper) {
  function encodeSoqlString(string) {
    return "'" + string.replace(/'/g, "''") + "'";
  };

  return {
    encodeSoqlString: encodeSoqlString
  };
});
