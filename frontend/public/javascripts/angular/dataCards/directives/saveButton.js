var templateUrl = require('angular_templates/dataCards/saveButton.html');

module.exports = function saveButton() {
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
};
