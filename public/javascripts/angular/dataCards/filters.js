(function() {
  'use strict';

  angular.module('dataCards.filters', []).

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
