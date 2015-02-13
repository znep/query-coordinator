(function() {
  'use strict';

  function revertButton() {
    return {
      restrict: 'E',
      scope: {
        pageHasChanges: '=',
        revertInitiated: '='
      },
      templateUrl: '/angular_templates/dataCards/revertButton.html'
    };
  }

  angular.
    module('dataCards.directives').
    directive('revertButton', revertButton);

})();
