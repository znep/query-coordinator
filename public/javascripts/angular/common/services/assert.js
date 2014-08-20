angular.module('socrataCommon.services').factory('Assert', function() {
  return function(condition, message) {
    if (!condition) { throw new Error(message || 'Assertion failed'); }
  };
});
