(function() {
  'use strict';

  angular.module('dataCards.filters', []).

  // Maps a soql aggregation function name (count, sum)
  // to a user-facing string, or undefined if no mapping
  // or invalid input is found.
  filter('aggregationFunctionToDisplayText', function() {
    return function(input) {
      if (!_.isString(input)) return undefined;
      else return input === 'count' ? 'number' : input;
    };
  }).

  filter('I18n', function(I18n) {
    return function() {
      return I18n.t.apply(this, arguments);
    }
  });
})();
