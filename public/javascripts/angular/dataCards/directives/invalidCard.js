(function() {
  'use strict';

  function InvalidCard() {
    return {
      restrict: 'E',
      scope: false,
      templateUrl: '/angular_templates/dataCards/invalidCard.html',
      controller: function($scope, $log) {
        $scope.model.observe('fieldName').subscribe(function(fieldName) {
          $log.warn('Invalid cardType for column {0}'.format(fieldName));
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('invalidCard', InvalidCard);
})();
