(function() {
  'use strict';

  function columnAndVisualizationSelector(Constants, Card, Dataset, FlyoutService, $log) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardSize: '=',

        // Array of card types.
        // Optional, if set will limit available card types to the given list.
        supportedCardTypes: '=?'
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


        /******************************
        * Build Column Information
        *
        * Responsible for:
        * - Split columns into visualizable and non-visualizable groups
        * - Filtering out system columns
        * - Sort by field name
        *******************************/
        var datasetColumnsInfo$ = scope.
          $observe('page').
          observeOnLatest('dataset.columns').
          map(function(columns) {
            // Filter out system columns.
            return _.pairs(columns).
              map(function(columnPair) {
                return {
                  fieldName: columnPair[0],
                  columnInfo: columnPair[1]
                };
              }).
              filter(function(columnPair) {

                // We need to ignore 'system' fieldNames that begin with ':' but
                // retain computed column fieldNames, which (somewhat inconveniently)
                // begin with ':@'.
                return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
                       columnPair.columnInfo.physicalDatatype !== '*';
              });
          }).
          map(function(columns) {
            return _.sortBy(columns, 'fieldName');
          }).
          combineLatest(scope.$observe('supportedCardTypes'), function(sortedColumns, supportedCardTypes) {
            // Split into available and unsupported columns.
            var availableColumns = [];
            var unsupportedColumns = [];
            var adjustedDefaultCardTypeHash = {};

            _.forEach(sortedColumns, function(column) {
              var defaultCardType = column.columnInfo.defaultCardType;
              var supportedAndAvailableCardTypes;

              if (_.isDefined(supportedCardTypes)) {
                supportedAndAvailableCardTypes = _.intersection(
                  column.columnInfo.availableCardTypes,
                  supportedCardTypes
                );

                if (!_.includes(supportedAndAvailableCardTypes, defaultCardType)) {
                  defaultCardType = supportedAndAvailableCardTypes[0] || 'invalid';
                }
              }

              if (defaultCardType === 'invalid') {
                unsupportedColumns.push(column.fieldName);
              } else if (!column.columnInfo.isSubcolumn) {
              // CORE-4645: Do not allow subColumns to be available as cards to add
                availableColumns.push(column.fieldName);
                adjustedDefaultCardTypeHash[column.fieldName] = defaultCardType;
              }
            });

            return {
              available: availableColumns, // List of fieldNames
              unsupported: unsupportedColumns, // List of fieldNames
              adjustedDefaultCardTypeHash: adjustedDefaultCardTypeHash // Hash of fieldName -> cardType
            };

          });

        scope.$bindObservable('availableColumns', datasetColumnsInfo$.pluck('available'));
        scope.$bindObservable('unsupportedColumns', datasetColumnsInfo$.pluck('unsupported'));

        scope.addCardSelectedColumnFieldName = null;
        scope.selectedCardModel = null;
        scope.availableCardTypes = [];

        Rx.Observable.subscribeLatest(
          scope.$observe('addCardSelectedColumnFieldName'),
          datasetColumnsInfo$.filter(_.isDefined).pluck('available'),
          datasetColumnsInfo$.filter(_.isDefined).pluck('adjustedDefaultCardTypeHash'),
          scope.$observe('page').observeOnLatest('dataset.columns').filter(_.isDefined),
          function(fieldName, availableColumns, adjustedDefaultCardTypeHash, columns) {

            var serializedCard;
            var column;

            if (_.isNull(fieldName)) {
              scope.selectedCardModel = null;
              return;
            }

            if (_.include(availableColumns, fieldName)) {
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

            serializedCard.cardType = adjustedDefaultCardTypeHash[fieldName];
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
