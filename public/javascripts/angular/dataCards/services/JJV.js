(function() {
  'use strict';

  angular.module('dataCards.services').factory('JJV', function($window) {
    return $window.jjv();
  });
})();
