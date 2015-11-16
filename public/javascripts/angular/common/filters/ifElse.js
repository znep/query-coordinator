const angular = require('angular');
function IfElseFilter() {
  return function(predicate, affirmativeValue, negativeValue) {
    return predicate ? affirmativeValue : negativeValue;
  };
}

angular.
  module('socrataCommon.filters').
  filter('ifElse', IfElseFilter);
