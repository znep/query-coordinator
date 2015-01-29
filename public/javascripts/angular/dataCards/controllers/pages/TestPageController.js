(function() {
  'use strict';

  function TestPageController($scope, $rootScope, $log, AngularRxExtensions) {

    AngularRxExtensions.install($scope);

  };

  angular.
    module('dataCards.controllers').
      controller('TestPageController', TestPageController);

})();
