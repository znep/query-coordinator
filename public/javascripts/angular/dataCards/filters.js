(function() {
  'use strict';

  angular.module('dataCards.filters', []).

  // Maps a soql aggregation function name (count, sum)
  // to a user-facing string, or undefined if no mapping
  // or invalid input is found.
  filter('aggregationFunctionToDisplayText', function() {
    return function(input) {
      if (!_.isString(input)) {
        return undefined;
      } else {
        return input === 'count' ? 'number' : input;
      }
    };
  }).

  filter('I18n', function(I18n) {
    return function() {
      return I18n.t.apply(this, arguments);
    };
  }).

  filter('pluralize', function(PluralizeService) {
    return function() {
      return PluralizeService.pluralize.apply(this, arguments);
    };
  }).

  filter('ellipsify', function() {
    return function(value, length) {
      if (_.isString(value) && _.isFinite(length) && length < value.length && length >= 0) {
        return '{0}...'.format(value.slice(0, length));
      } else {
        return value;
      }
    };
  });
})();
