(function() {
  'use strict';

  function addCardDialog() {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        dialogState: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope) {

        if (!scope.dialogState) {
          scope.dialogState = { show: true };
        }

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardModel = null;
        scope.addCardSelectedColumnFieldName = null;

        scope.$on('card-model-selected', function(event, addCardModel) {
          scope.addCardModel = addCardModel;
        });

        scope.addCard = function() {
          if (!_.isNull(scope.addCardModel)) {
            scope.page.addCard(scope.addCardModel);
            scope.dialogState.show = false;
          }
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
