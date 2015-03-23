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
        $scope.additionalClasses = element[0].className;
      }
    };
  }

  angular.
    module('dataCards.directives').
    filter('saveStatusText', function() {
      return function saveStatusTextMapping(status) {
        if (status === 'saving') { return 'Saving'; }
        if (status === 'saved') { return 'Saved!'; }
        if (status === 'failed') { return 'Failed'; }

        return 'Save';
      };
    }).
    directive('saveButton', saveButton);

})();
