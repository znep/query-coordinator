var templateUrl = require('angular_templates/dataCards/mobileWarningDialog.html');
const angular = require('angular');
function mobileWarningDialog() {
  return {
    restrict: 'E',
    scope: {
      dialogState: '='
    },
    templateUrl: templateUrl
  };
}

angular.
  module('dataCards.directives').
    directive('mobileWarningDialog', mobileWarningDialog);
