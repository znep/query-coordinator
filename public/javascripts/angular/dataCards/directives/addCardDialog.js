(function() {
  'use strict';

  function addCardDialog(Card, FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        datasetColumns: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardCardSize = null;
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

        scope.$on('modal-open', function(e, data) {
          scope.addCardCardSize = parseInt(data.cardSize, 10);
          // Reset the contents of the modal on each open event.
          scope.addCardSelectedColumnFieldName = null;
          scope.addCardModel = null;
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
            scope.closeAddCardDialog();
          }
        };

        scope.closeAddCardDialog = function() {
          scope.$emit('modal-close-surrogate', {id: 'add-card-dialog'});
        };

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
