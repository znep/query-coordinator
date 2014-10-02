(function() {
  'use strict';

  function addCardDialog(Constants, AngularRxExtensions, Card, FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        datasetColumns: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardCardSize = null;
        scope.addCardModel = null;

        scope.$watch('addCardSelectedColumnFieldName', function(fieldName) {

          if (scope.page.getCurrentValue('dataset') !== null) {

            var columns = scope.page.getCurrentValue('dataset').getCurrentValue('columns');

            if (fieldName === null) {
              scope.addCardModel = null; 
            } else {
              var serializedCard = {
                'fieldName': columns[fieldName].name,
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

        // Rebroadcast events back down the scope chain to allow siblings to communicate with each other
        scope.$on('modal-open', function(e, data) {
          scope.addCardCardSize = data.cardSize;
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

        FlyoutService.register('add-card-button', function(el) {
            if ($(el).hasClass('disabled')) {
              return '<div class="flyout-title">All cards are present</div>';
            }
          });

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
