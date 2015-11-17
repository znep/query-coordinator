(function() {
  'use strict';

  function modalDialog(WindowState, $window) {
    return {
      restrict: 'E',
      scope: {
        // Toggles modal dialog visibility
        state: '=?dialogState'
      },
      transclude: true,
      templateUrl: '/angular_templates/dataCards/modalDialog.html',
      link: function(scope, element) {
        if (!scope.state) {
          scope.state = { show: false };
        }

        // Close the dialog unless we have disabled closing the dialog
        // (i.e. during saving).
        scope.closeDialog = function() {
          if (!scope.state.disableCloseDialog) {
            scope.$safeApply(function() {
              scope.state.show = false;
            });
          }
        };

        WindowState.escapeKey$.filter(function() {
          // Only close this dialog if we're the one on top
          var dialog = element.find('.modal-dialog');
          var testPoint = dialog.position();
          // Make sure we're within the dialog
          testPoint.top += 1;
          testPoint.left += 1;
          var topMostElement = $window.document.elementFromPoint(testPoint.left, testPoint.top);
          return dialog[0] === topMostElement;
        }).takeUntil(scope.$destroyAsObservable(element)).subscribe(scope.closeDialog);
      }
    };
  }

  angular.module('dataCards.directives').
    directive('modalDialog', modalDialog);

})();
