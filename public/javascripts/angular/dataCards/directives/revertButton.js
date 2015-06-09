(function() {
  'use strict';

  function revertButton(FlyoutService, I18n) {
    return {
      restrict: 'E',
      scope: {
        pageHasChanges: '=',
        revertInitiated: '='
      },
      templateUrl: '/angular_templates/dataCards/revertButton.html',
      link: function(scope, element) {
         FlyoutService.register({
           selector: '.revert-btn',
           render: function() {
             if (scope.pageHasChanges) {
               return '<div class="flyout-title">{0}</div>'.format(I18n.revertButton.flyoutHasChanges);
             } else {
               return '<div class="flyout-title">{0}</div>'.format(I18n.revertButton.flyoutNoChanges);
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
