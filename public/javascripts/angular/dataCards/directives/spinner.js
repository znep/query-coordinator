var templateUrl = require('angular_templates/dataCards/spinner.html');
const angular = require('angular');
function spinner() {
  return {
    restrict: 'E',
    templateUrl: templateUrl
  };
}

angular.
  module('dataCards.directives').
  directive('spinner', spinner);

