(function() {
  'use strict';

  function revertButton(AngularRxExtensions, FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        pageHasChanges: '=',
        revertInitiated: '='
      },
      templateUrl: '/angular_templates/dataCards/revertButton.html',
      link: function(scope, element) {

        AngularRxExtensions.install(scope);

         FlyoutService.register(
           'revert-btn',
           function() {
             if (scope.pageHasChanges) {
               return '<div class="flyout-title">Click to revert all changes since you last saved</div>';
             } else {
               return '<div class="flyout-title">No changes to be reverted</div>';
             }
           },
           scope.observeDestroy(element)
         );
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('revertButton', revertButton);

})();
