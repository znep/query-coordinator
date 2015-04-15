(function() {
  'use strict';

  function mobileWarningDialog(AngularRxExtensions, localStorageService) {
    return {
      restrict: 'E',
      scope: {
        dialogState: '='
      },
      templateUrl: '/angular_templates/dataCards/mobileWarningDialog.html'
    };
  }

  angular.
    module('dataCards.directives').
      directive('mobileWarningDialog', mobileWarningDialog);

})();
