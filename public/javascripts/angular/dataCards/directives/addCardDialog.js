(function() {
  'use strict';

  function getColumnByFieldName(columns, fieldName) {
    var selectedColumn = null;
    _.each(columns, function(column) {
      if (column.name === fieldName) {
        selectedColumn = column;
      }
    });
    return selectedColumn;
  }

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

        var serializedCard;
        var column;

        if (!scope.dialogState) {
          scope.dialogState = { show: true };
        }

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardModel = null;
        scope.availableCardTypes = [];

        scope.$watch('addCardSelectedColumnFieldName', function(fieldName) {

          if (_.isDefined(scope.datasetColumns)) {

            if (fieldName === null) {
              scope.addCardModel = null; 
            } else {

              column = getColumnByFieldName(scope.datasetColumns.available, fieldName);

              // TODO: Enforce some kind of schema validation at this step.
              serializedCard = {
                'cardCustomStyle': {},
                'cardSize': parseInt(scope.cardSize, 10),
                'cardType': CardTypeMapping.defaultVisualizationForColumn(column),
                'displayMode': 'visualization',
                'expanded': false,
                'expandedCustomStyle': {},
                'fieldName': fieldName
              };

              scope.availableCardTypes = CardTypeMapping.availableVisualizationsForColumn(column);
              scope.addCardModel = Card.deserialize(scope.page, serializedCard);

            }
          }
        });

        scope.setCardType = function(cardType) {

          if (scope.addCardModel !== null &&
              scope.availableCardTypes.indexOf(cardType) > -1) {

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardCustomStyle': {},
              'cardSize': parseInt(scope.cardSize, 10),
              'cardType': cardType,
              'displayMode': 'visualization',
              'expanded': false,
              'expandedCustomStyle': {},
              'fieldName': scope.addCardModel.fieldName
            };

            scope.addCardModel = Card.deserialize(scope.page, serializedCard);
          }
        };

        scope.addCard = function() {
          if (scope.addCardModel !== null) {
            scope.page.addCard(scope.addCardModel);
            scope.dialogState.show = false;
          }
        };

        scope.isCustomizable = CardTypeMapping.modelIsCustomizable;

        FlyoutService.register('add-card-type-option', function(el) {

          var visualizationName = el.getAttribute('data-visualization-name');

          if (visualizationName === null) {
            return;
          }

          return '<div class="flyout-title">Visualize this column as a {0}</div>'.format(visualizationName);

        });

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
