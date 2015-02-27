(function() {
  'use strict';

  function addCardDialog(AngularRxExtensions, Constants, CardTypeMapping, CardV0, FlyoutService, $log) {
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

        scope.bindObservable(
          'columnHumanNameFn',
          scope.observe('page').observeOnLatest('dataset.columns').map(
            function(datasetColumns) {
              return function(fieldName) {
                var column = datasetColumns[fieldName];
                return column.dataset.version === '0' ? column.title : column.name;
              }
            }
          )
        );

        var serializedCard;

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

        Rx.Observable.subscribeLatest(
          scope.observe('addCardSelectedColumnFieldName'),
          scope.observe('datasetColumns').filter(_.isDefined),
          scope.observe('page').observeOnLatest('dataset'),
          scope.observe('page').observeOnLatest('dataset.columns'),
          function(fieldName, scopeDatasetColumns, dataset, columns) {
            var columnCardinality;

            if (fieldName === null) {
              scope.addCardModel = null;
              return;
            }

            var column;

            if (_.include(scope.datasetColumns.available, fieldName)) {
              column = columns[fieldName];
            }

            if (_.isUndefined(column)) {
              $log.error('Could not get available column by fieldName.');
              scope.addCardModel = null;
              return;
            }

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardCustomStyle': {},
              'cardSize': parseInt(scope.dialogState.cardSize, 10),
              'cardType': CardTypeMapping.defaultVisualizationForColumn(dataset, fieldName),
              'displayMode': 'visualization',
              'expanded': false,
              'expandedCustomStyle': {},
              'fieldName': fieldName
            };

            scope.availableCardTypes = CardTypeMapping.availableVisualizationsForColumn(dataset, fieldName);
            scope.addCardModel = CardV0.deserialize(scope.page, serializedCard);

            if (column.hasOwnProperty('cardinality')) {
              columnCardinality = parseInt(column.cardinality, 10);
            } else {
              columnCardinality = 0;
            }

            scope.showCardinalityWarning = (columnCardinality > parseInt(Constants['COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD'], 10));
          }
        );

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

        scope.isCustomizable = function(model) {
          return _.isPresent(model) ? CardTypeMapping.modelIsCustomizable : false;
        };

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

        }, scope.observeDestroy(element));

        FlyoutService.register('warning-icon', function(el) {

          return '<div class="flyout-title">WARNING: Visualizing this column as a column chart will result in more than one hundred columns and may degrade performance</div>';

        }, scope.observeDestroy(element));

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
