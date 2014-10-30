(function() {
  'use strict';

  function addCardDialog(Card, FlyoutService, CardTypeMappingService) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        cardSize: '=',
        datasetColumns: '=',
        dialogState: '=?',
        // A function to call to start the customize-card flow
        customizeCard: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {
        if (!scope.dialogState) {
          dialogState = {show: true};
        }

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardCardSize = parseInt(scope.cardSize, 10);
        scope.addCardModel = null;

        scope.$watch('addCardSelectedColumnFieldName', function(fieldName) {

          if (_.isDefined(scope.datasetColumns)) {

            if (fieldName === null) {
              scope.addCardModel = null; 
            } else {
              // TODO: Enforce some kind of schema validation at this step.
              var serializedCard = {
                'fieldName': fieldName,
                'cardSize': scope.addCardCardSize,
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
          var newCardModels = [];
          var i = 0;

          if (scope.addCardModel !== null) {

            var preceedingCardCount = scope.
              cardModels.
              filter(function(card) {
                return card.getCurrentValue('cardSize') <= scope.addCardCardSize; }).length;

            // TODO: There's certainly a less garbage way to do this.
            newCardModels = scope.cardModels.slice(0, preceedingCardCount).
              concat([scope.addCardModel]).
              concat(scope.cardModels.slice(preceedingCardCount));

            scope.page.set('cards', newCardModels);
            scope.dialogState.show = false;
          }
        };

        scope.isCustomizable = CardTypeMappingService.isCustomizable;
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
