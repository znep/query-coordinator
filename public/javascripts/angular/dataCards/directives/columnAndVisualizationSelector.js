var templateUrl = require('angular_templates/dataCards/columnAndVisualizationSelector.html');
const angular = require('angular');
/**
 * UI for configuring a visualization.
 *
 * The scope event 'card-model-selected' is emitted
 * when the user selects a visualization or changes
 * visualization settings. It is up to the consumer
 * to decide when the user has finished editing
 * (for example, an OK button).
 */
function columnAndVisualizationSelector(
  Card,
  Constants,
  DatasetColumnsService,
  $log,
  rx,
  ServerConfig) {
  const Rx = rx;
  return {
    restrict: 'E',
    scope: {
      page: '=',
      cardSize: '=',

      // Array of card types.
      // Optional, if set will limit available card types to the given list.
      supportedCardTypes: '=?',
      defaultCardTypeByColumn: '=?',
      // Override the DataLens-specific message about adding a new card
      addVisualizationPrompt: '=?',
      addCardSelectedColumnFieldName: '=',
      classicVisualization: '='
    },
    templateUrl: templateUrl,
    link: function($scope) {

      /************************
      * Add new card behavior *
      ************************/


      /******************************
      * Build Column Information
      *
      * Responsible for:
      * - Split columns into visualizable and non-visualizable groups
      * - Filtering out system columns and subcolumns
      * - Sort as sorted in table
      *******************************/

      // Get a sorted list of all dataset columns excluding system columns but
      // including computed columns
      var sortedDatasetColumns$ = DatasetColumnsService.getSortedColumns$($scope);

      // Determine which columns can be visualized and added as cards
      var datasetColumnsInfo$ = Rx.Observable.combineLatest(
        sortedDatasetColumns$,
        $scope.$observe('supportedCardTypes'),
        $scope.$observe('defaultCardTypeByColumn'),
        function(sortedColumns, supportedCardTypes, defaultCardTypeByColumn) {

          // Split into available and unsupported columns.
          var availableColumns = [];
          var unsupportedColumns = [];
          var adjustedDefaultCardTypeHash = {};

          _.forEach(sortedColumns, function(column) {
            var defaultCardType = column.columnInfo.defaultCardType;
            var supportedAndAvailableCardTypes;
            var defaultColumnCardType = _.get(defaultCardTypeByColumn, column.fieldName);

            if (_.isDefined(supportedCardTypes)) {
              supportedAndAvailableCardTypes = _.intersection(
                column.columnInfo.availableCardTypes,
                supportedCardTypes
              );

              if (_.include(supportedAndAvailableCardTypes, defaultColumnCardType)) {
                defaultCardType = defaultColumnCardType;
              }

              if (!_.include(supportedAndAvailableCardTypes, defaultCardType)) {
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

      var addCardSelectedColumnFieldName$ = $scope.$observe('addCardSelectedColumnFieldName');
      var columns$ = $scope.$observe('page').observeOnLatest('dataset.columns').filter(_.isDefined);
      var availableColumns$ = datasetColumnsInfo$.filter(_.isDefined).pluck('available');

      var column$ = Rx.Observable.combineLatest(
        columns$,
        availableColumns$,
        addCardSelectedColumnFieldName$,
        function(columns, availableColumns, fieldName) {
          var column;

          if (!fieldName) {
            return null;
          }

          if (_.include(availableColumns, fieldName)) {
            column = columns[fieldName];
          }

          if (_.isUndefined(column)) {
            $log.error('Could not get available column by fieldName.');
            return null;
          }

          return column;
        }
      );

      var selectedCardModel$ = Rx.Observable.combineLatest(
        addCardSelectedColumnFieldName$,
        column$,
        datasetColumnsInfo$.filter(_.isDefined).pluck('adjustedDefaultCardTypeHash'),
        function(fieldName, column, adjustedDefaultCardTypeHash) {
          var serializedCard;

          if (!column || !fieldName) {
            return null;
          } else {
            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardSize': parseInt($scope.cardSize, 10),
              'expanded': false,
              'fieldName': fieldName,
              'cardType': adjustedDefaultCardTypeHash[fieldName]
            };

            // TODO: We're going towards passing in serialized blobs to Model constructors.
            // Revisit this line when that effort reaches Card.
            return Card.deserialize($scope.page, serializedCard);
          }
        }
      ).share();

      $scope.selectedCardModel = null;
      $scope.availableCardTypes = [];
      $scope.addVisualizationPrompt = $scope.addVisualizationPrompt || 'addCardDialog.prompt';

      $scope.$bindObservable('shouldShowAggregationSelector', selectedCardModel$.
        observeOnLatest('cardType').
        map(function(cardType) {
          return $scope.page.version >= 4 &&
            ServerConfig.get('enableDataLensCardLevelAggregation') &&
            !_.contains(Constants.AGGREGATION_CARDTYPE_BLACKLIST, cardType);
        }));

      $scope.$bindObservable(
        'availableCardTypes',
        column$.map(function(column) {
          if (column) {
            return column.availableCardTypes;
          } else {
            return [];
          }
        })
      );

      $scope.$bindObservable('availableAndSupportedCardTypes', Rx.Observable.combineLatest(
        $scope.$observe('availableCardTypes'),
        $scope.$observe('supportedCardTypes'),
        function(availableCardTypes, supportedCardTypes) {
          // if supportedCardTypes is null, that means we support all card types.
          // Yes, I know, sorry :(
          return supportedCardTypes ? _.intersection(availableCardTypes, supportedCardTypes) : availableCardTypes;
        })
      );

      $scope.$bindObservable('availableColumns', datasetColumnsInfo$.pluck('available'));
      $scope.$bindObservable('unsupportedColumns', datasetColumnsInfo$.pluck('unsupported'));
      $scope.$bindObservable('columnHumanNameFn', DatasetColumnsService.getReadableColumnNameFn$($scope));
      $scope.$bindObservable('selectedCardModel', selectedCardModel$);
      $scope.$bindObservable(
        'isCustomizableMap',
        selectedCardModel$.observeOnLatest('isCustomizableMap')
      );

      // When a user selects a column,
      // emit card-model-selected.
      // It's not sufficient to simply monitor $scope.selectedCardModel
      // for changes, as that value can change for reasons outside
      // of the user making a selection inside this directive.
      // For instance, if the incoming binding of addCardSelectedColumnFieldName
      // changes, $scope.selectedCardModel will be updated to reflect the new
      // field, but this does not mean the user selected a column.
      $scope.$emitEventsFromObservable(
        'card-model-selected',
        selectedCardModel$.sample($scope.$eventToObservable('soc-select-change'))
      );

      // No idea why this one has to be structured like it is, but using
      // the same .sample() pattern as above ended up with it not triggering
      // in all cases. Giacomo suspects some misunderstood behavior in the
      // third-party angular rx extensions' .safeApply().
      $scope.$emitEventsFromObservable(
        'card-model-selected',
        selectedCardModel$.observeOnLatest('cardType').map(function() {
          return $scope.selectedCardModel;
        })
      );

      $scope.onCustomizeCard = function(selectedCardModel) {
        $scope.$emit('customize-card-with-model', selectedCardModel);
      };
    }
  };
}

angular.
  module('dataCards.directives').
    directive('columnAndVisualizationSelector', columnAndVisualizationSelector);
