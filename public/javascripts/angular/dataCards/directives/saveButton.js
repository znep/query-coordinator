var templateUrl = require('angular_templates/dataCards/saveButton.html');
const angular = require('angular');
function saveButton() {
  return {
    restrict: 'E',
    scope: {
      enabled: '=',
      saveStatus: '=',
      buttonClass: '@'
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      $scope.additionalClasses = element[0].className.
        // Remove classes that angular automatically puts on, like ng-isolate-scope
        replace(/\bng-[^ ]*\b/g, '');
    }
  };
}

angular.
  module('dataCards.directives').
  filter('saveStatusText', function(I18n) {
    return function saveStatusTextMapping(status) {
      switch (status) {
        case 'saving':
          return I18n.saveButton.saving;
        case 'saved':
          return I18n.saveButton.saved;
        case 'failed':
          return I18n.saveButton.failed;
        default:
          return I18n.saveButton.save;
      }
    };
  }).
  directive('saveButton', saveButton);
