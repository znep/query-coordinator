(function() {
  'use strict';

  function addCardDialog(Card, FlyoutService, CardTypeMapping) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        cardSize: '=',
        datasetColumns: '=',
        dialogState: '=?',
        // A function to call to start the customize-card flow
        onCustomizeCard: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {
        if (!scope.dialogState) {
          scope.dialogState = { show: true };
        }

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardModel = null;

        scope.$watch('addCardSelectedColumnFieldName', function(fieldName) {

          if (_.isDefined(scope.datasetColumns)) {

            if (fieldName === null) {
              scope.addCardModel = null; 
            } else {
              // TODO: Enforce some kind of schema validation at this step.
              var serializedCard = {
                'fieldName': fieldName,
                'cardSize': parseInt(scope.cardSize, 10),
                'cardCustomStyle': {},
                'expandedCustomStyle': {},
                'displayMode': 'visualization',
                'expanded': false
              };
              scope.addCardModel = Card.deserialize(scope.page, serializedCard);
            }
          }
        });

        scope.addCard = function() {
          if (scope.addCardModel !== null) {
            scope.page.addCard(scope.addCardModel);
            scope.dialogState.show = false;
          }
        };

        scope.isCustomizable = CardTypeMapping.modelIsCustomizable;
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
