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
    }
  };

  var validColumnFilter = function(column) {
    return column.physicalDatatype === 'number' && column.logicalDatatype === 'amount';
  };

  function AggregationChooser(AngularRxExtensions, DatasetDataService, FlyoutService, WindowState) {

    return {
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/aggregationChooser.html',
      scope: {
        page: '='
      },
      link: function($scope, element, attrs) {
        var subscriptions = [];
        AngularRxExtensions.install($scope);

        /*
         * Scope variables
         */
        $scope.panelActive = false;

        /*
         * Setup Hover Listeners
         */

        // Observable of hovers over a aggregation-type selector
        var aggregationHoverObservable = WindowState.mousePositionSubject.
          takeUntil($scope.eventToObservable('$destroy')).
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

        $scope.bindObservable('countFunctionHover', countFunctionHoverObservable);

        // Observable that goes true when hovering a non-'count' aggregation-type selector
        var aggregateFunctionHoverObservable = aggregationHoverObservable.
          map(function(aggregationType) {
            return aggregationType.length > 0 && !aggregationType.is('[data-aggregation-type="count"]');
          }).
          startWith(false).
          distinctUntilChanged();

        $scope.bindObservable('aggregateFunctionHover', aggregateFunctionHoverObservable);

        /*
         * Setup Dataset Observables
         */

        var dataset = $scope.page.observe('dataset');
        var columnsObservable = dataset.observeOnLatest('columns');
        var rowDisplayUnitObservable = dataset.observeOnLatest('rowDisplayUnit');

        // Page model aggregation observables
        var pagePrimaryAggregationObservable = $scope.page.observe('primaryAggregation');
        var pagePrimaryAmountFieldObservable = $scope.page.observe('primaryAmountField');

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

        // Observable that goes true if we should show the dropdown selector, false otherwise
        var canAggregateObservable = columnsObservable.map(function(columns) {
          var numberColumns = _(columns).filter(validColumnFilter).value();
          return numberColumns.length > 0 && numberColumns.length <= 10;
        });

        // Observable that maps all columns to just number columns and augments with
        // Human-readable labels and whether that column is enabled for selection
        var aggregationColumnsObservable = Rx.Observable.
          combineLatest(
          aggregationFunctionObservable,
          columnsObservable,
          function(aggregationFunction, columns) {
            return _(columns).
              reject(function(column) {
                return column.isSystemColumn || column.name === '*';
              }).
              filter(validColumnFilter).
              map(function(column) {
                var enabled = aggregationFunction !== 'count';
                return _.extend(pluralizeAndCapitalize(column.title), { id: column.name, enabled: enabled });
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
            var column = _(columns).find({ name: activeAggregation });
            if (_.isDefined(column)) {
              return _.extend({ id: activeAggregation }, pluralizeAndCapitalize(column.title));
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

        $scope.bindObservable('highlightFirstColumn', highlightFirstColumnObservable);
        $scope.bindObservable('canAggregate', canAggregateObservable);
        $scope.bindObservable('unitLabel', unitLabelObservable);
        $scope.bindObservable('aggregationFunction', labeledFunctionObservable);
        $scope.bindObservable('aggregationColumns', aggregationColumnsObservable);
        $scope.bindObservable('activeAggregation', labeledFieldObservable);

        /*
         * Panel toggling
         */
        WindowState.closeDialogEventObservable.takeUntil($scope.eventToObservable('$destroy')).
          filter(function(e) {
            return e.type === 'keydown' || ($scope.panelActive && $(e.target).closest(element).length === 0);
          }).
          subscribe(function() {
            $scope.safeApply(function() {
              $scope.panelActive = false;
            });
          });

        /*
         * Register flyout for disabled aggregation columns
         */

        FlyoutService.register('aggregation-option', function(element) {
          if ($(element).is('.disabled.no-count')) {
            return '<span class="flyout-cell">{0}</span>'.format('This column cannot be used with a<br>number of aggregate');
          }
        }, $scope.eventToObservable('$destroy'), true);

        /*
         * Callback functions
         */

        // Callback for setting the page aggregation function
        $scope.setAggregationFunction = function(value, currentFunction, newColumn) {
          $scope.page.set('primaryAggregation', value);
          // In the case we're selecting from count to something else, also set the primaryAmountField
          // Otherwise, set it to null (i.e. the rowDisplayUnit)
          if (value !== 'count' && currentFunction === 'count' && _.isDefined(newColumn)) {
            $scope.page.set('primaryAmountField', newColumn);
          } else if (value === 'count') {
            $scope.page.set('primaryAmountField', null);
          }
        };

        // Callback for setting the page aggregation field
        $scope.setAggregationColumn = function(value, enabled) {
          if (_.isUndefined(enabled) || enabled) {
            $scope.page.set('primaryAmountField', value);
          }
        };

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('aggregationChooser', AggregationChooser);

})();
