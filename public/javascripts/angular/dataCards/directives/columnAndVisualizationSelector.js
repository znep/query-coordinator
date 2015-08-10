(function() {
  'use strict';

  function columnAndVisualizationSelector(Constants, Card, Dataset, FlyoutService, $log) {
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
      templateUrl: '/angular_templates/dataCards/columnAndVisualizationSelector.html',
      link: function(scope) {
        scope.$bindObservable(
          'columnHumanNameFn',
          scope.$observe('page').observeOnLatest('dataset.columns').map(
            function(datasetColumns) {
              return function(fieldName) {
                var column = datasetColumns[fieldName];
                return Dataset.extractHumanReadableColumnName(column);
              };
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
          scope.$observe('addCardSelectedColumnFieldName'),
          scope.$observe('datasetColumns').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset.columns').filter(_.isDefined),
          function(fieldName, scopeDatasetColumns, dataset, columns) {

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

            scope.availableCardTypes = column.availableCardTypes;

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardSize': parseInt(scope.dialogState.cardSize, 10) || 1,
              'expanded': false,
              'fieldName': fieldName
            };

            serializedCard.cardType = column.defaultCardType;
            // TODO: We're going towards passing in serialized blobs to Model constructors.
            //Revisit this line when that effort reaches Card.
            scope.addCardModel = Card.deserialize(scope.page, serializedCard);
          }
        );


        scope.onCustomizeCard = function(addCardModel) {
          scope.$emit('customize-card-with-model', addCardModel);
        };

        scope.$bindObservable(
          'isCustomizableMap',
          scope.$observe('addCardModel').observeOnLatest('isCustomizableMap')
        );
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('columnAndVisualizationSelector', columnAndVisualizationSelector);

})();
