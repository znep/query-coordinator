(function() {
  'use strict';

  function saveButton() {
    return {
      restrict: 'E',
      scope: {
        enabled: '=',
        saveStatus: '='
      },
      templateUrl: '/angular_templates/dataCards/saveButton.html',
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
        if (status === 'saving') { return I18n.saveButton.saving; }
        if (status === 'saved') { return I18n.saveButton.saved; }
        if (status === 'failed') { return I18n.saveButton.failed; }

        return 'Save';
      };
    }).
    directive('saveButton', saveButton);

})();
