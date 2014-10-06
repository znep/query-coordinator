(function() {
  'use strict';

  function modalDialog() {
    return {
      restrict: 'E',
      scope: {},
      transclude: true,
      templateUrl: '/angular_templates/dataCards/modalDialog.html',
      link: function (scope, element, attrs) {

        // Toggles modal dialog visibility
        scope.show = false;

        scope.showModal = function() {
          scope.show = true;
        }

        scope.hideModal = function() {
          scope.show = false;
        }

        scope.$on('modal-open', function (e, data) {
          if (element.attr('id') === data.id) {
            scope.showModal();
          }
        });

        scope.$on('modal-close', function (e, data) {
          if (element.attr('id') === data.id) {
            scope.hideModal();
          }
        });

        document.addEventListener('keydown', function (e) {
          console.log(e);
          // Escape key
          console.log(e.keyCode, e.which);
          if (e.which === 27) {
            scope.$apply(function () {
              scope.hideModal();
            })
          }
        });

      }
    };
  }

  angular.module('dataCards.directives').
    directive('modalDialog', modalDialog);

})();