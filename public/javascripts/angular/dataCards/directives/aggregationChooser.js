(function() {
  'use strict';

  // Mapping of aggregation types to human-readable names
  // Also serves as whitelist for available aggregation functions
  var availableAggregationFunctions = [
    { type: 'count', name: 'number' },
    { type: 'sum', name: 'sum' }
  ];

  // Helper function for taking a name and returning a map of the different
  // pluralized and capitalized versions (saves having to use filters in the HTML)
  var pluralizeAndCapitalize = function(value) {
    var name = (value || '').toLowerCase();
    var plural = name === '' ? '' : name.pluralize();
    return {
      name: name,
      plural: plural,
      capitalized: name.capitalizeEachWord(),
      pluralCapitalized: plural.capitalizeEachWord()
    };
  };

  function AggregationChooser(Constants, Dataset, FlyoutService, WindowState, ServerConfig) {

    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/aggregationChooser.html',
      scope: {
        page: '='
      },
      link: function($scope, element) {
        /*
         * Scope variables
         */
        $scope.panelActive = false;

        /*
         * Setup Hover Listeners
         */

        // Observable of hovers over a aggregation-type selector
        var aggregationHoverObservable = WindowState.mousePositionSubject.
          takeUntil($scope.$destroyAsObservable(element)).
          map(function(positionData) {
            return $(positionData.target).closest('[data-aggregation-type]');
          });

        // Observable that goes true when hovering the 'count' aggregation-type selector
        var countFunctionHoverObservable = aggregationHoverObservable.
          map(function(aggregationType) {
            return aggregationType.is('[data-aggregation-type="count"]');
          }).
          startWith(false).
          distinctUntilChanged();

        $scope.$bindObservable('countFunctionHover', countFunctionHoverObservable);

        // Observable that goes true when hovering a non-'count' aggregation-type selector
        var aggregateFunctionHoverObservable = aggregationHoverObservable.
          map(function(aggregationType) {
            return aggregationType.length > 0 && !aggregationType.is('[data-aggregation-type="count"]');
          }).
          startWith(false).
          distinctUntilChanged();

        $scope.$bindObservable('aggregateFunctionHover', aggregateFunctionHoverObservable);

        /*
         * Setup Dataset Observables
         */

        var dataset = $scope.page.observe('dataset');
        var columnsObservable = dataset.observeOnLatest('columns');
        var aggregationSequence = $scope.page.observe('aggregation');
        var rowDisplayUnitObservable = aggregationSequence.pluck('unit');

        // Page model aggregation observables
        var pagePrimaryAggregationObservable = aggregationSequence.pluck('function');
        var pagePrimaryAmountFieldObservable = aggregationSequence.pluck('fieldName');

        // Default to 'count' if no primary aggregation function is selected
        var aggregationFunctionObservable = Rx.Observable.combineLatest(
          Rx.Observable.returnValue('count'),
          pagePrimaryAggregationObservable,
          function(defaultValue, pageValue) {
            if (_.isPresent(pageValue)) {
              return pageValue;
            } else {
              return defaultValue;
            }
          });

        // Default to 'rowDisplayUnit' for aggregation field display
        var activeAggregationObservable = Rx.Observable.combineLatest(
          rowDisplayUnitObservable,
          pagePrimaryAmountFieldObservable,
          function(rowDisplayUnit, pagePrimaryAmountField) {
            if (_.isPresent(pagePrimaryAmountField)) {
              return pagePrimaryAmountField;
            } else {
              return rowDisplayUnit;
            }
          }
        );

        var validColumnFilter = function(column, fieldName) {
          // TODO: Once a "logical" type property is available, this will need to be updated
          var fieldNamesThatCannotBeAggregated = ['latitude', 'longitude', 'lat', 'lng', 'long', 'x', 'y']
          return (column.physicalDatatype === 'number' || column.physicalDatatype === 'money') &&
            (!_.contains(fieldNamesThatCannotBeAggregated, fieldName));
        };

        // Observable that goes true if we should show the dropdown selector, false otherwise
        var canAggregateObservable = columnsObservable.map(function(columns) {
          var numberColumns = _(columns).filter(validColumnFilter).value();
          var maxNumberColumns = Constants.AGGREGATION_MAX_COLUMN_COUNT;
          return numberColumns.length > 0 && numberColumns.length <= maxNumberColumns;
        });

        // Observable that maps all columns to just number columns and augments with
        // Human-readable labels and whether that column is enabled for selection
        var aggregationColumnsObservable = Rx.Observable.
          combineLatest(
          aggregationFunctionObservable,
          columnsObservable,
          function(aggregationFunction, columns) {
            return _(columns).
              pick(function(column, fieldName) {
                return !column.isSystemColumn && fieldName !== '*';
              }).
              pick(validColumnFilter).
              map(function(column, fieldName) {
                var enabled = aggregationFunction !== 'count';
                return _.extend(
                  pluralizeAndCapitalize(Dataset.extractHumanReadableColumnName(column)),
                  { id: fieldName, enabled: enabled }
                );
              }).
              value();
          });

        // Observable that goes true when we're hovering over a non-count aggregation option
        // And we have not already selected a column field
        var highlightFirstColumnObservable = Rx.Observable.combineLatest(
          aggregateFunctionHoverObservable,
          aggregationColumnsObservable,
          activeAggregationObservable,
          function(aggregateHover, columns, active) {
            var column = _(columns).find({ id: active });
            return aggregateHover && _.isUndefined(column);
          });

        // Generate human-readable labels for the row display unit
        var unitLabelObservable = rowDisplayUnitObservable.map(pluralizeAndCapitalize);

        // Maps the active aggregation field identifier to human-readable values
        var labeledFieldObservable = Rx.Observable.combineLatest(
          columnsObservable,
          activeAggregationObservable,
          function(columns, activeAggregation) {
            var column = columns[activeAggregation];
            if (_.isDefined(column)) {
              return _.extend(
                { id: activeAggregation },
                pluralizeAndCapitalize(Dataset.extractHumanReadableColumnName(column))
              );
            } else {
              return _.extend(pluralizeAndCapitalize(activeAggregation));
            }
          });

        // Maps active aggregation function to human-readable values
        var labeledFunctionObservable = aggregationFunctionObservable.
          map(function(value) {
            var type = { type: value };
            var fn = _.find(availableAggregationFunctions, type);
            return _.extend(type, pluralizeAndCapitalize(fn.name));
          });

        var rowDisplayUnitLabelObservable = aggregationSequence.pluck('rowDisplayUnit').map(pluralizeAndCapitalize);
        $scope.$bindObservable('highlightFirstColumn', highlightFirstColumnObservable);
        $scope.$bindObservable('canAggregate', canAggregateObservable);
        $scope.$bindObservable('rowDisplayUnitLabel', rowDisplayUnitLabelObservable);
        $scope.$bindObservable('unitLabel', unitLabelObservable);
        $scope.$bindObservable('aggregationFunction', labeledFunctionObservable);
        $scope.$bindObservable('aggregationColumns', aggregationColumnsObservable);
        $scope.$bindObservable('activeAggregation', labeledFieldObservable);

        /*
         * Panel toggling
         */
        WindowState.closeDialogEventObservable.takeUntil($scope.$destroyAsObservable(element)).
          filter(function(e) {
            return e.type === 'keydown' || ($scope.panelActive && $(e.target).closest(element).length === 0);
          }).
          subscribe(function() {
            $scope.$safeApply(function() {
              $scope.panelActive = false;
            });
          });

        /*
         * Register flyout for disabled aggregation columns
         */

        FlyoutService.register({
          className: 'aggregation-option',
          render: function(element) {
            if ($(element).is('.disabled.no-count')) {
              return '<span class="flyout-cell">{0}</span>'.
                format('This column cannot be used with a<br>number of aggregate');
            }
          },
          destroySignal: $scope.$destroyAsObservable(element),
          trackCursor: true
        });

        /*
         * Callback functions
         */

        // Callback for setting the page aggregation function
        $scope.setAggregationFunction = function($event, value, currentFunction, newColumn) {
          $scope.page.set('primaryAggregation', value);
          // In the case we're selecting from count to something else, also set the primaryAmountField
          // Otherwise, set it to null (i.e. the rowDisplayUnit)
          if (value !== 'count' && currentFunction === 'count' && _.isDefined(newColumn)) {
            $scope.page.set('primaryAmountField', newColumn);
          } else if (value === 'count') {
            $scope.page.set('primaryAmountField', null);
          }

          $event.stopPropagation();
        };

        // Callback for setting the page aggregation field
        $scope.setAggregationColumn = function($event, value, enabled) {
          if (_.isUndefined(enabled) || enabled) {
            $scope.page.set('primaryAmountField', value);
          }

          $event.stopPropagation();
        };

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('aggregationChooser', AggregationChooser);

})();
