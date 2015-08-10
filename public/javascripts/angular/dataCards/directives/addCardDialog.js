(function() {
  'use strict';

  function addCardDialog(Constants, Card, Dataset, FlyoutService, $log) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        datasetColumns: '=',
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

        scope.$on('card-model-chosen', function(event, addCardModel) {
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
