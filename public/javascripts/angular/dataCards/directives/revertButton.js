(function() {
  'use strict';

  function revertButton(FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        pageHasChanges: '=',
        revertInitiated: '='
      },
      templateUrl: '/angular_templates/dataCards/revertButton.html',
      link: function(scope, element) {
         FlyoutService.register({
           className: 'revert-btn',
           render: function() {
             if (scope.pageHasChanges) {
               return '<div class="flyout-title">Click to undo all changes since you last saved</div>';
             } else {
               return '<div class="flyout-title">No changes to be reverted</div>';
             }
           },
           destroySignal: scope.$destroyAsObservable(element)
         });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('revertButton', revertButton);

})();
