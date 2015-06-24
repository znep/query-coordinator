(function() {
  'use strict';

  function extentComparer(originalValue, newValue) {
    if (_.isArray(originalValue) && _.isArray(newValue)) {
      return (originalValue[0] === newValue[0]) && (originalValue[1] === newValue[1]);
    }
    else {
      return originalValue === newValue;
    }
  }

  function histogramDirective(FlyoutService, HistogramVisualizationService, WindowState) {
    return {
      restrict: 'E',
      scope: {
        cardData: '=',
        rowDisplayUnit: '=',
        isFiltered: '=',
        expanded: '=',
        currentRangeFilterValues: '='
      },
      template: '<div class="histogram" ng-class="{\'has-selection\': hasSelection}"></div>',
      link: function($scope, element) {
        var service = HistogramVisualizationService;
        var container = element.find('.histogram')[0];

        // Setup
        var dom = service.setupDOM($scope.$id, container);
        var scale = service.setupScale();
        var axis = service.setupAxis(scale);
        var svg = service.setupSVG();
        var brush = service.setupBrush(dom, scale);
        var hover = service.setupHover(dom);

        // Observables
        var cardData$ = $scope.$observe('cardData').
          map(function(data) {
            return (_.isObject(data) && _.isPresent(data.error)) ?
              null :
              data;
          }).
          doAction(function(data) {
            // If the histogram gets into an error-like state, re-render a blank
            // chart so that the error doesn't appear over previously valid data
            if (_.isNull(data)) {
              dom = service.setupDOM($scope.$id, container);
            }
          }).
          filter(_.isPresent);

        var cardDimensions$ = element.closest('.card-visualization').observeDimensions().
          map(function(dimensions) {
            return {
              width: Math.max(dimensions.width - dom.margin.left - dom.margin.right, 0),
              height: Math.max(dimensions.height - dom.margin.top - dom.margin.bottom, 0)
            };
          }).
          filter(function(value) {
            return value.width !== 0 && value.height !== 0;
          }).
          distinctUntilChanged();

        // Listen for our custom brush start and end events
        var brushStartIndices$ = Rx.Observable.fromEventPattern(function(handler) {
          brush.brushDispatcher.on('start', handler);
        }).
        share();

        var brushEndIndices$ = Rx.Observable.fromEventPattern(function(handler) {
          brush.brushDispatcher.on('end', handler);
        }).
        share();

        // Merge brush start / ends into an observable indication brushing in progress
        var selectionInProgress$ = Rx.Observable.merge(
            brushStartIndices$.map(_.constant(true)),
            brushEndIndices$.map(_.constant(false))
          ).
          share().
          startWith(false);

        // Listen for brush clears emitted from the chart
        var brushClearIndices$ = Rx.Observable.fromEventPattern(function(handler) {
            brush.brushDispatcher.on('clear', handler);
          }).
          subscribe(function() {
            brush.updateExtent([0, 0]);
            brush.brushDispatcher.end(null);
          });

        // Combine the brush indices with data to get indices and values
        var brushIndicesAndValues$ = brushEndIndices$.
          combineLatest(cardData$, function(brushIndices, cardData) {
            if (_.isNull(brushIndices)) {
              return {
                indices: null,
                values: null
              };
            }
            var endIndex = cardData.unfiltered.length - 1;
            var start = cardData.unfiltered[Math.max(0, Math.min(endIndex, brushIndices[0]))].start;
            var end = cardData.unfiltered[Math.min(endIndex, brushIndices[1] - 1)].end;
            return {
              indices: brushIndices,
              values: [start, end]
            };
          }).
          share();

        // Signal to the card visualization layer when brushing has happened
        // sending the new filter values
        var filter$ = brushIndicesAndValues$.
          pluck('values').
          distinctUntilChanged(_.identity, extentComparer).
          share();

        $scope.$emitEventsFromObservable(
          'toggle-dataset-filter:histogram',
          filter$
        );
        $scope.$emitEventsFromObservable(
          'dataset-filter:histogram',
          filter$.filter(_.isPresent)
        );
        $scope.$emitEventsFromObservable(
          'dataset-filter-clear:histogram',
          filter$.filter(_.isEmpty)
        );

        // Approximates the y value of the x-center of the selection path
        // Updates a placeholder element for positioning the flyout upon
        Rx.Observable.merge(brushIndicesAndValues$, cardDimensions$).
          subscribe(function() {
            var extentCenter = { x: 0, y: 0 };
            var extent = brush.control.extent();
            var targetX = extent[0] + (extent[1] - extent[0]) / 2;
            var yValues = _(['filtered', 'unfiltered']).
              map(function(selector) {
                var path = _.get(dom, 'line.{0}'.format(selector));
                path = path.node() || null;
                if (_.isPresent(path)) {
                  var point = brush.bisectPath(path, targetX);
                  return point.y;
                }
              }).
              filter(_.isFinite).
              value();

            extentCenter = {
              x: targetX,
              y: Math.min.apply(null, yValues.concat([scale.y(0)]))
            };

            HistogramVisualizationService.updateHistogramHoverTarget(dom, extentCenter);
          });

        // This is the current range coming from the filters "source of truth"
        var currentRangeFilterValues$ = $scope.$observe('currentRangeFilterValues').
          distinctUntilChanged(_.identity, extentComparer);

        // Combine Observables
        var uiUpdate$ = Rx.Observable.combineLatest(
          cardData$,
          cardDimensions$,
          currentRangeFilterValues$,
          brushStartIndices$.startWith(null),
          function(cardData, dimensions, currentRangeFilterValues) {
            var indices = null;
            var selectionPixels = [0, 0];
            // Add a selected path/area to our data that duplicates the filtered version
            var cardDataWithSelection = _.extend({
              selected: _.slice(cardData.filtered)
            }, cardData);

            // Find the indicies of the filtered selection
            if (_.isArray(currentRangeFilterValues)) {
              var start = _.findIndex(cardData.unfiltered, function(item) {
                return item.start === currentRangeFilterValues[0];
              });
              var end = _.findIndex(cardData.unfiltered, function(item) {
                return item.end === currentRangeFilterValues[1];
              });
              indices = [start, end];
            }

            return {
              axis: axis,
              brush: brush,
              data: cardDataWithSelection,
              dimensions: dimensions,
              dom: dom,
              hasSelection: _.isPresent(currentRangeFilterValues),
              hover: hover,
              isFiltered: $scope.isFiltered,
              rowDisplayUnit: $scope.rowDisplayUnit,
              scale: scale,
              selectionIndices: indices,
              selectionValues: currentRangeFilterValues,
              svg: svg
            };
          }).
          withLatestFrom(selectionInProgress$, function(options, selectionInProgress) {
            return _.extend(options, { selectionInProgress: selectionInProgress });
          }).
          share();

        uiUpdate$.
          subscribe(function(options) {
            $scope.$emit('render:start', {
              source: 'histogram_{0}'.format($scope.$id),
              timestamp: _.now()
            });

            scale = service.updateScale(
              options.scale,
              options.data,
              options.dimensions
            );
            svg = service.updateSVG(
              options.svg,
              options.data,
              options.scale
            );
            brush = service.updateBrush(
              options.dom,
              options.brush,
              options.selectionValues,
              options.dimensions,
              options.selectionInProgress
            );
            hover = service.updateHover(
              options.brush,
              options.data,
              options.dom,
              options.hover,
              options.isFiltered,
              options.rowDisplayUnit,
              options.scale,
              options.hasSelection,
              options.selectionIndices,
              options.selectionInProgress,
              options.selectionValues
            );

            service.render(
              options.axis,
              options.data,
              options.dimensions,
              options.dom,
              options.svg,
              options.selectionIndices,
              options.brush
            );

            $scope.$emit('render:complete', {
              source: 'histogram_{0}'.format($scope.$id),
              timestamp: _.now()
            });
          });

        // Clean up after ourselves
        $scope.$destroyAsObservable(element).
          subscribe(function() {
            service.destroyHover(hover);
            service.destroyBrush(brush);
          });

        // This modifies html classes on the chart
        var hasSelection$ = uiUpdate$.pluck('hasSelection');
        $scope.$bindObservable('hasSelection', hasSelection$);

      }
    }
  }

  angular.
    module('dataCards.directives').
    directive('histogram', histogramDirective);

})();

