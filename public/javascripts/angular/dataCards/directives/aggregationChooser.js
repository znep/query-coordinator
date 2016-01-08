var templateUrl = require('angular_templates/dataCards/aggregationChooser.html');
const angular = require('angular');
// Mapping of aggregation types to human-readable names
// Also serves as whitelist for available aggregation functions
var availableAggregationFunctions = [
  { type: 'count', name: 'number' },
  { type: 'sum', name: 'sum' }
];

function AggregationChooser(
  Constants,
  Dataset,
  FlyoutService,
  WindowState,
  ServerConfig,
  I18n,
  PluralizeService,
  rx) {
  const Rx = rx;

  return {
    restrict: 'E',
    templateUrl: templateUrl,
    scope: {
      page: '=',
      isStandaloneVisualization: '='
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
      var aggregationHover$ = WindowState.mousePosition$.
        takeUntil($scope.$destroyAsObservable(element)).
        map(function(positionData) {
          return $(positionData.target).closest('[data-aggregation-type]');
        });

      // Observable that goes true when hovering the 'count' aggregation-type selector
      var countFunctionHover$ = aggregationHover$.
        map(function(aggregationType) {
          return aggregationType.is('[data-aggregation-type="count"]');
        }).
        startWith(false).
        distinctUntilChanged();

      $scope.$bindObservable('countFunctionHover', countFunctionHover$);

      // Observable that goes true when hovering a non-'count' aggregation-type selector
      var aggregateFunctionHover$ = aggregationHover$.
        map(function(aggregationType) {
          return aggregationType.length > 0 && !aggregationType.is('[data-aggregation-type="count"]');
        }).
        startWith(false).
        distinctUntilChanged();

      $scope.$bindObservable('aggregateFunctionHover', aggregateFunctionHover$);

      /*
       * Setup Dataset Observables
       */

      var dataset = $scope.page.observe('dataset');
      var columns$ = dataset.observeOnLatest('columns');
      var aggregation$ = $scope.page.observe('aggregation');
      var aggregationUnit$ = aggregation$.pluck('unit');
      var rowDisplayUnit$ = aggregation$.pluck('rowDisplayUnit');
      var pagePrimaryAggregation$ = aggregation$.pluck('function');
      var pagePrimaryAmountField$ = aggregation$.pluck('fieldName');

      // Default to 'count' if no primary aggregation function is selected
      var aggregationFunction$ = Rx.Observable.combineLatest(
        Rx.Observable.returnValue('count'),
        pagePrimaryAggregation$,
        function(defaultValue, pageValue) {
          if (_.isPresent(pageValue)) {
            return pageValue;
          } else {
            return defaultValue;
          }
        });

      // Default to the aggregationUnit for aggregation field display
      var activeAggregation$ = Rx.Observable.combineLatest(
        aggregationUnit$,
        pagePrimaryAmountField$,
        function(aggregationUnit, pagePrimaryAmountField) {
          if (_.isPresent(pagePrimaryAmountField)) {
            return pagePrimaryAmountField;
          } else {
            return aggregationUnit;
          }
        }
      );

      var validColumnFilter = function(column, fieldName) {
        return (column.physicalDatatype === 'number' || column.physicalDatatype === 'money') &&
          !column.isSystemColumn &&
          (!_.contains(Constants.FIELD_NAMES_THAT_CANNOT_BE_AGGREGATED, fieldName));
      };

      // Observable that goes true if we should show the dropdown selector, false otherwise
      var hasAggregableColumns$ = columns$.map(function(columns) {
        var numberColumns = _(columns).filter(validColumnFilter).value();
        return numberColumns.length > 0;
      });

      // Observable that goes true if we should show the warning flyout, false otherwise
      var canChooseAggregation$ = columns$.map(function(columns) {
        var numberColumns = _(columns).filter(validColumnFilter).value();
        var maxNumberColumns = Constants.AGGREGATION_MAX_COLUMN_COUNT;
        return numberColumns.length > 0 && numberColumns.length <= maxNumberColumns;
      });

      // Observable that maps all columns to just number columns and augments with
      // Human-readable labels and whether that column is enabled for selection
      var aggregationColumns$ = Rx.Observable.
        combineLatest(
        aggregationFunction$,
        columns$,
        function(aggregationFunction, columns) {
          return _(columns).
            pick(function(column, fieldName) {
              return !column.isSystemColumn && fieldName !== '*';
            }).
            pick(validColumnFilter).
            map(function(column, fieldName) {
              var enabled = aggregationFunction !== 'count';
              return {
                id: fieldName,
                enabled: enabled,
                label: Dataset.extractHumanReadableColumnName(column)
              };
            }).
            value();
        });

      // Observable that goes true when we're hovering over a non-count aggregation option
      // And we have not already selected a column field
      var highlightFirstColumn$ = Rx.Observable.combineLatest(
        aggregateFunctionHover$,
        aggregationColumns$,
        activeAggregation$,
        function(aggregateHover, columns, activeAggregation) {
          var column = _(columns).find({ id: activeAggregation });
          return aggregateHover && _.isUndefined(column);
        });

      // Maps the active aggregation field identifier to human-readable values
      var labeledField$ = Rx.Observable.combineLatest(
        columns$,
        activeAggregation$,
        function(columns, activeAggregation) {
          var column = columns[activeAggregation];
          if (_.isDefined(column)) {
            return {
              id: activeAggregation,
              label: Dataset.extractHumanReadableColumnName(column)
            };
          } else {
            return { label: activeAggregation };
          }
        });

      // Maps active aggregation function to human-readable values
      var labeledFunction$ = aggregationFunction$.
        map(function(value) {
          var type = { type: value };
          var fn = _.find(availableAggregationFunctions, type);
          return _.extend(type, {
            label: fn.name,
            capitalized: _.capitalize(fn.name)
          });
        });

      $scope.$bindObservable('highlightFirstColumn', highlightFirstColumn$);
      $scope.$bindObservable('hasAggregableColumns', hasAggregableColumns$);
      $scope.$bindObservable('canChooseAggregation', canChooseAggregation$);
      $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
      $scope.$bindObservable('pluralRowDisplayUnit', rowDisplayUnit$.map(PluralizeService.pluralize));
      $scope.$bindObservable('aggregationUnit', aggregationUnit$);
      $scope.$bindObservable('aggregationFunction', labeledFunction$);
      $scope.$bindObservable('aggregationColumns', aggregationColumns$);
      $scope.$bindObservable('activeAggregation', labeledField$);

      /*
       * Panel toggling
       */
      WindowState.closeDialogEvent$.takeUntil($scope.$destroyAsObservable(element)).
        filter(function(e) {
          return e.type === 'keydown' || ($scope.panelActive && $(e.target).closest(element).length === 0);
        }).
        subscribe(function() {
          $scope.$safeApply(function() {
            $scope.panelActive = false;
          });
        });

      $scope.togglePanel = function() {
        if (!$scope.isStandaloneVisualization && $scope.canChooseAggregation) {
          $scope.panelActive = !$scope.panelActive;
        }
      };

      /*
       * Register flyout for disabled aggregation columns
       */

      if (!$scope.isStandaloneVisualization) {
        FlyoutService.register({
          selector: '.aggregation-option',
          render: function(flyoutElement) {
            if ($(flyoutElement).is('.disabled.no-count')) {
              return `<span class="flyout-cell">${I18n.aggregationChooser.optionDisabled}</span>`;
            }
          },
          destroySignal: $scope.$destroyAsObservable(element),
          trackCursor: true
        });

        var aggregationChooserSelectors = [
          '.aggregation-chooser-trigger.disabled',
          '.aggregation-chooser-trigger.disabled span'
        ];

        FlyoutService.register({
          selector: aggregationChooserSelectors.join(', '),
          positionOn: function() {

            // Targets the span element whose ::after pseudoelement we're using
            // to render the down-arrow "icon".
            return $(`${aggregationChooserSelectors[0]} .tool-panel-cue`)[0];
          },
          render: _.constant(
            `<span class="icon-warning"></span><span class="flyout-title">${I18n.t(
              'aggregationChooser.tooManyColumns.title',
              Constants.AGGREGATION_MAX_COLUMN_COUNT
            )}</span><p>${I18n.t(
              'aggregationChooser.tooManyColumns.message',
              Constants.AGGREGATION_MAX_COLUMN_COUNT
            )}</p>`
          ),
          belowTarget: true,
          classes: 'aggregation-chooser',
          destroySignal: $scope.$destroyAsObservable(element)
        });
      }

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
