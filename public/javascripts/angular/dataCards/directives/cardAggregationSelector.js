var templateUrl = require('angular_templates/dataCards/cardAggregationSelector.html');
const angular = require('angular');
/**
 * UI for configuring card-level aggregation.
 */
function cardAggregationSelector(Constants, I18n, PluralizeService, rx) {
  return {
    restrict: 'E',
    scope: {
      page: '=',
      cardModel: '='
    },
    templateUrl: templateUrl,
    link: function($scope) {

      var dataset$ = $scope.page.observe('dataset');
      var columns$ = dataset$.observeOnLatest('columns');

      var cardModel$ = $scope.$observe('cardModel').filter(_.isPresent);
      var aggregation$ = cardModel$.observeOnLatest('aggregation');
      var cardAggregationField$ = aggregation$.pluck('fieldName');
      var cardAggregationFunction$ = aggregation$.pluck('function');
      var rowDisplayUnit$ = aggregation$.pluck('rowDisplayUnit');

      // Setup count option label
      var pluralRowDisplayUnit$ = rowDisplayUnit$.
        map(function(unit) {
          var pluralizedUnit = PluralizeService.pluralize(unit);
          if (unit !== I18n.common.row) {
            pluralizedUnit += ` (${PluralizeService.pluralize(I18n.common.row)})`;
          }
          return pluralizedUnit;
        });

      // Setup aggregation field
      var aggregationField$ = cardAggregationField$.map(function(cardAggregationField) {
        return _.isPresent(cardAggregationField) ? cardAggregationField : '*';
      });

      // Find aggregation columns, make them human-readable
      var aggregationColumns$ = rx.Observable.combineLatest(
        columns$,
        cardModel$,
        function(columns, cardModel) {
          var validColumnFilter = function(column, fieldName) {
            var isValidType = column.physicalDatatype === 'number' || column.physicalDatatype === 'money';
            var isReservedColumn = column.isSystemColumn || fieldName === '*' || _.contains(Constants.FIELD_NAMES_THAT_CANNOT_BE_AGGREGATED, fieldName);
            var isSelf = fieldName === cardModel.fieldName;

            return isValidType && !(isReservedColumn || isSelf);
          };

          return _.chain(columns).
            pick(validColumnFilter).
            map(function(column, fieldName) {
              return {
                id: fieldName,
                label: column.name
              };
            }).
            value();
        }
      );

      // Persist aggregation selection to model
      $scope.$observe('aggregationField').skip(1).subscribe(function(aggregationField) {
        // aggregationField is actually null as far as the model is concerned,
        // but our select gets confused when we have multiple options with null
        // values, so we use '*' instead of null inside of the directive and
        // do the conversion back to null before saving it
        if (aggregationField === '*') {
          aggregationField = null;
        }

        $scope.cardModel.set('aggregationField', aggregationField);

        if (_.isNull(aggregationField)) {
          $scope.cardModel.set('aggregationFunction', 'count');
        } else {
          $scope.cardModel.set('aggregationFunction', 'sum');
        }
      });

      // Bind observables to scope
      $scope.$bindObservable('hasNoAggregableColumns', aggregationColumns$.map(_.isEmpty));
      $scope.$bindObservable('pluralRowDisplayUnit', pluralRowDisplayUnit$);
      $scope.$bindObservable('aggregationColumns', aggregationColumns$);
      $scope.$bindObservable('aggregationField', aggregationField$);
      $scope.$bindObservable('aggregationFunction', cardAggregationFunction$);
    }
  };
}

angular.
  module('dataCards.directives').
    directive('cardAggregationSelector', cardAggregationSelector);
