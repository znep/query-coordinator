const angular = require('angular');
angular.module('dataCards.services').factory('JJV', function($window) {
  return $window.jjv();
});
