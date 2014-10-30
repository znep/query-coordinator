(function() {
  'use strict';

  function modalDialog(WindowState) {
    return {
      restrict: 'E',
      scope: {
        // Toggles modal dialog visibility
        state: '=?dialogState'
      },
      transclude: true,
      templateUrl: '/angular_templates/dataCards/modalDialog.html',
      link: function (scope, element, attrs) {
        var subscriptions = [];

        if (!scope.state) {
          scope.state = {show: false};
        }

        subscriptions.push(WindowState.closeDialogEventObservable.filter(function(e) {
          return !$(e.target).closest('.modal-dialog').length;
        }).subscribe(function(e) {
          scope.$apply(function() {
            scope.state.show = false;
          })
        }));

        // Clean up after ourselves
        scope.$on('$destroy', function() {
          _.invoke(subscriptions, 'dispose');
        });
      }
    };
  }

  angular.module('dataCards.directives').
    directive('modalDialog', modalDialog);

})();
