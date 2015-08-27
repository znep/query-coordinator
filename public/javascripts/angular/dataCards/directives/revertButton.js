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
          selector: '.customize-bar .revert-btn',
          render: function() {
            var flyoutTitle = scope.pageHasChanges ?
              I18n.revertButton.flyoutHasChanges :
              I18n.revertButton.flyoutNoChanges;

            return '<div class="flyout-title">{0}</div>'.format(flyoutTitle);
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
