(function() {
  'use strict';

  function columnAndVisualizationSelector(Constants, Card, Dataset, FlyoutService, $log) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        datasetColumns: '=',
        cardSize: '='
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

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.selectedCardModel = null;
        scope.availableCardTypes = [];

        Rx.Observable.subscribeLatest(
          scope.$observe('addCardSelectedColumnFieldName'),
          scope.$observe('datasetColumns').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset.columns').filter(_.isDefined),
          function(fieldName, scopeDatasetColumns, dataset, columns) {

            var serializedCard;
            var column;

            if (_.isNull(fieldName)) {
              scope.selectedCardModel = null;
              return;
            }

            if (_.include(scope.datasetColumns.available, fieldName)) {
              column = columns[fieldName];
            }

            if (_.isUndefined(column)) {
              $log.error('Could not get available column by fieldName.');
              scope.selectedCardModel = null;
              return;
            }

            scope.availableCardTypes = column.availableCardTypes;

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardSize': parseInt(scope.cardSize, 10),
              'expanded': false,
              'fieldName': fieldName
            };

            serializedCard.cardType = column.defaultCardType;
            // TODO: We're going towards passing in serialized blobs to Model constructors.
            // Revisit this line when that effort reaches Card.
            scope.selectedCardModel = Card.deserialize(scope.page, serializedCard);
          }
        );

        scope.$watch('selectedCardModel', function(selectedCardModel) {
          scope.$emit('card-model-selected', selectedCardModel);
        });

        scope.onCustomizeCard = function(selectedCardModel) {
          scope.$emit('customize-card-with-model', selectedCardModel);
        };

        scope.$bindObservable(
          'isCustomizableMap',
          scope.$observe('selectedCardModel').observeOnLatest('isCustomizableMap')
        );
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('columnAndVisualizationSelector', columnAndVisualizationSelector);

})();
