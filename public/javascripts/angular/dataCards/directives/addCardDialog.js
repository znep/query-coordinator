(function() {
  'use strict';

  // TODO: In general there is a lot of logic here that will probably be
  // addressed by the inclusion of availableCardTypes and defaultCardType
  // on the column itself. Once we have accepted metadata transition phase
  // 3 and removed the branches on the transition phase, we should probably
  // revisit this directive to clean it up.

  function addCardDialog(AngularRxExtensions, Constants, CardTypeMapping, Card, FlyoutService, ServerConfig, $log) {
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
          scope.observe('page').observeOnLatest('dataset').filter(_.isDefined),
          scope.observe('page').observeOnLatest('dataset.columns').filter(_.isDefined),
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

            if (ServerConfig.metadataMigration.shouldUseLocalCardTypeMapping()) {
              scope.availableCardTypes = CardTypeMapping.availableVisualizationsForColumn(dataset, fieldName);
            } else {
              scope.availableCardTypes = column.availableCardTypes;
            }

            if (ServerConfig.metadataMigration.pageMetadata.useV0CardModels()) {
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
            } else {
              // TODO: Enforce some kind of schema validation at this step.
              serializedCard = {
                'cardSize': parseInt(scope.dialogState.cardSize, 10),
                'expanded': false,
                'fieldName': fieldName
              };

              if (ServerConfig.metadataMigration.shouldUseLocalCardTypeMapping()) {
                serializedCard['cardType'] = CardTypeMapping.defaultVisualizationForColumn(dataset, fieldName);
              } else {
                serializedCard['cardType'] = column.defaultCardType;
              }
            }
            // TODO: Should just use the constructor, which should be different between V0 and V1
            scope.addCardModel = Card.deserialize(scope.page, serializedCard);

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

        scope.onCustomizeCard = function(addCardModel) {
          scope.$emit('customize-card-with-model', addCardModel);
        };

        scope.bindObservable(
          'isCustomizable',
          scope.observe('addCardModel').observeOnLatest('isCustomizable')
        );

        var EXCESSIVE_COLUMN_WARNING = [
          '<div class="flyout-title">',
          'Note: This would result in a barchart with over a hundred bars, ',
          'it might be slower than other charts',
          '</div>'
        ].join('');
        FlyoutService.register('add-card-type-option', function(el) {

          var visualizationName = el.getAttribute('data-visualization-name');

          if (visualizationName === null) {
            return;
          }

          if (scope.showCardinalityWarning && $(el).hasClass('warn')) {
            return EXCESSIVE_COLUMN_WARNING;
          } else {
            return '<div class="flyout-title">Visualize this column as a {0}</div>'.format(visualizationName);
          }

        }, scope.observeDestroy(element));

        FlyoutService.register('warning-icon', function(el) {

          return EXCESSIVE_COLUMN_WARNING;

        }, scope.observeDestroy(element));

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
