(function() {
  'use strict';

  function modalDialog(WindowState, AngularRxExtensions) {
    return {
      restrict: 'E',
      scope: {
        // Toggles modal dialog visibility
        state: '=?dialogState'
      },
      transclude: true,
      templateUrl: '/angular_templates/dataCards/modalDialog.html',
      link: function (scope, element, attrs) {
        AngularRxExtensions.install(scope);

        if (!scope.state) {
          scope.state = {show: false};
        }

        // The various conditions under which we can close the dialog
        function closeDialog() {
          scope.$apply(function() {
            scope.state.show = false;
          });
        }
        element.on('click', '.modal-overlay', closeDialog);
        WindowState.escapeKeyObservable.filter(function(e) {
          // Only close this dialog if we're the one on top
          var dialog = element.find('.modal-dialog');
          var testPoint = dialog.position();
          // Make sure we're within the dialog
          testPoint.top += 1;
          testPoint.left += 1;
          var topMostElement = document.elementFromPoint(testPoint.left, testPoint.top);
          return dialog[0] === topMostElement;
        }).takeUntil(scope.observeDestroy(element)).subscribe(closeDialog);
      }
    };
  }

  angular.module('dataCards.directives').
    directive('modalDialog', modalDialog);

})();
