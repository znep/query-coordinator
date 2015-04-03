(function() {
  'use strict';

  function lensType() {
    return {
      templateUrl: '/angular_templates/dataCards/lensType.html',
      restrict: 'E',
      scope: {},
      link: function($scope) {
        // Currently no lenses can be non-official so we can hard-code this.
        $scope.lensType = 'official';
      }
    }
  }

  angular.
    module('dataCards.directives').
    directive('lensType', lensType);

})();
