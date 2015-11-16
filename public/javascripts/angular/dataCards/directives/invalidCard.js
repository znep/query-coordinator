var templateUrl = require('angular_templates/dataCards/invalidCard.html');
const angular = require('angular');
function InvalidCard() {
  return {
    restrict: 'E',
    scope: false,
    templateUrl: templateUrl,
    controller: function($scope, $log) {
      $scope.model.observe('fieldName').subscribe(function(fieldName) {
        $log.warn(`Invalid cardType for column ${fieldName}`);
      });
    }
  };
}

angular.
  module('dataCards.directives').
  directive('invalidCard', InvalidCard);
