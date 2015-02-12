(function() {
  'use strict';

  function getColumnByFieldName(columns, fieldName) {
    var selectedColumn = null;
    return _.find(columns, function(column) { return column.name === fieldName; });
  }

  function addCardDialog(Constants, CardTypeMapping, Card, FlyoutService, AngularRxExtensions) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        datasetColumns: '=',
        dialogState: '=',
        // A function to call to start the customize-card flow
        onCustomizeCard: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {
        AngularRxExtensions.install(scope);

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
        scope.showCardinalityWarning = false;
        scope.availableCardTypes = [];

        scope.$watch('addCardSelectedColumnFieldName', function(fieldName) {

          var columnCardinality;

          if (_.isDefined(scope.datasetColumns)) {

            if (fieldName === null) {
              scope.addCardModel = null;
              return;
            }

            column = getColumnByFieldName(scope.datasetColumns.available, fieldName);

            if (_.isUndefined(column)) {
              $log.error('Could not get column by fieldName.');
              scope.addCardModel = null;
              return;
            }

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardCustomStyle': {},
              'cardSize': parseInt(scope.dialogState.cardSize, 10),
              'cardType': CardTypeMapping.defaultVisualizationForColumn(column),
              'displayMode': 'visualization',
              'expanded': false,
              'expandedCustomStyle': {},
              'fieldName': fieldName
            };

            scope.availableCardTypes = CardTypeMapping.availableVisualizationsForColumn(column);
            scope.addCardModel = Card.deserialize(scope.page, serializedCard);

            if (column.hasOwnProperty('cardinality')) {
              columnCardinality = parseInt(column.cardinality, 10);
            } else {
              columnCardinality = 0;
            }

            scope.showCardinalityWarning = (columnCardinality > parseInt(Constants['COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD'], 10));

          }
        });

        scope.setCardType = function(cardType) {

          if (scope.addCardModel === null ||
              scope.availableCardTypes.indexOf(cardType) === -1) {
            $log.error('Could not set card type of "{0}".'.format(cardType));
            return;
          }

          scope.addCardModel.set('cardType', cardType);

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

          if (scope.showCardinalityWarning && $(el).hasClass('warn')) {
            return '<div class="flyout-title">WARNING: Visualizing this column as a column chart will result in more than one hundred columns and may degrade performance</div>';
          } else {
            return '<div class="flyout-title">Visualize this column as a {0}</div>'.format(visualizationName);
          }

        }, scope.eventToObservable('$destroy'));

        FlyoutService.register('warning-icon', function(el) {

          return '<div class="flyout-title">WARNING: Visualizing this column as a column chart will result in more than one hundred columns and may degrade performance</div>';

        }, scope.eventToObservable('$destroy'));

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
