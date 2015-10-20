(function() {
  'use strict';

  function lensType() {
    return {
      templateUrl: '/angular_templates/dataCards/lensType.html',
      restrict: 'E',
      scope: true,
      link: function($scope) {
        $scope.$bindObservable('lensType', $scope.page.observe('provenance'));
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('lensType', lensType);

})();
