(function() {
  'use strict';

  function momentProvider($window) {
    return $window.moment || window.moment;
  }

  angular.
    module('socrataCommon.services').
    factory('moment', momentProvider);
})();
