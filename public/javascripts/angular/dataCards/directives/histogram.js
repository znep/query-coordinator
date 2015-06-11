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

  function histogramDirective(FlyoutService, HistogramVisualizationService, HistogramBrushService) {
    return {
      restrict: 'E',
      scope: {
        cardData: '=',
        rowDisplayUnit: '=',
        isFiltered: '=',
        expanded: '=',
        selectionExtent: '='
      },
      template: '<div class="histogram" ng-class="{\'has-selection\': hasSelection}"></div>',
      link: function($scope, element) {
        var service = HistogramVisualizationService;
        var container = element.find('.histogram')[0];

        // Setup
        var dom = service.setupDOM(container);
        var histogramBrush = HistogramBrushService.create($scope.$id, dom);
        histogramBrush.setupDOM(dom);
        var scale = service.setupScale();
        var axis = service.setupAxis(scale);
        var svg = service.setupSVG();
        var brush = histogramBrush.setupBrush(scale);
        var hover = service.setupHover(dom);

        // Observables
        var cardData$ = $scope.$observe('cardData').
          map(function(data) {
            return (_.isObject(data) && _.isPresent(data.error)) ?
              null :
              data;
          }).
          doAction(function(data) {
            if (_.isNull(data)) {
              dom = service.setupDOM(container);
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

        // Emitted while brushing/selecting in chart
        var brushEvent$ = Rx.Observable.fromEventPattern(_.partial(brush.on, 'brush', _)).
          map(function() {
            return brush.extent();
          }).
          distinctUntilChanged(_.identity, extentComparer).
          share();

        // Emitted when mousing down in the brushable area
        var brushMouseDown$ = Rx.Observable.fromEventPattern(function(handler) {
          dom.brush.call(function(g) {
            g.on('mousedown', handler);
          });
        }).share();

        // Emitted when mousing up in the brushable area
        var brushMouseUp$ = Rx.Observable.fromEventPattern(function(handler) {
          dom.brush.call(function(g) {
            g.on('mouseup', handler);
          });
        }).share();

        // Brush / selection start and end events emitted by D3
        var brushStartEvents$ = Rx.Observable.
          fromEventPattern(_.partial(brush.on, 'brushstart', _)).
          share().
          map(_.constant(true));

        var brushEndEvent$ = Rx.Observable.
          fromEventPattern(_.partial(brush.on, 'brushend', _)).
          share().
          map(_.constant(false));

        // Since D3 emits brush events whenever the extent is changed, and if
        // we change the extent outside of its brushing we need to tell it to
        // emit events, the events it emits do not correspond one-to-one to
        // user interactions.
        // These two observables rectify that.
        var brushStart$ = brushMouseDown$.
          withLatestFrom(brushStartEvents$, function(brushMouseDown, brushStart) {
            return brushStart;
          });

        var brushEnd$ = brushMouseUp$.
          withLatestFrom(brushEndEvent$, function(brushMouseUp, brushEnd) {
            return brushEnd;
          });

        var selectionInProgress$ = brushStart$.
          merge(brushEnd$).
          startWith(false).
          distinctUntilChanged();

        var brushClear$ = Rx.Observable.fromEventPattern(function(handler) {
          histogramBrush.brushDispatcher.on('clear', handler);
        }).
        map(_.constant(undefined)).
        share();

        brushClear$.subscribe(function() {
          _.defer(function() {
            FlyoutService.refreshFlyout({ clientX: 0, clientY: 0, target: null });
          });
        });

        var bucketedSelectionInPixels$ = brushEvent$.
          combineLatest(cardData$, cardDimensions$, function (bucketedSelectionInPixels, cardData) {
            var bucketWidth = scale.x.rangeBand();

            return _.map(bucketedSelectionInPixels, function(value, index) {
              var fixedValue = (value / bucketWidth).toFixed(1);
              var bucketIndex = Math[index === 0 ? 'floor' : 'ceil'](fixedValue);
              var boundedBucketIndex = Math.min(bucketIndex, cardData.unfiltered.length);
              bucketIndex = index === 1 ? boundedBucketIndex : bucketIndex;
              return bucketIndex * bucketWidth;
            });
          });

        bucketedSelectionInPixels$.subscribe(function(bucketedSelectionInPixels) {
          dom.brush.call(brush.extent(bucketedSelectionInPixels)).call(brush.event);
        });

        var bucketedSelectionIndices$ = bucketedSelectionInPixels$.
          map(function(bucketedSelectionInPixels) {
            var bucketWidth = scale.x.rangeBand();

            return _.map(bucketedSelectionInPixels, function(value) {
              return Math.round(value / bucketWidth);
            });
          });

        var bucketedSelectionValues$ = bucketedSelectionIndices$.
          withLatestFrom(cardData$, function(bucketedSelectionIndices, cardData) {
            if (bucketedSelectionIndices[0] === 0 && bucketedSelectionIndices[1] === 0) {
              return;
            }
            var start = cardData.unfiltered[Math.max(0, Math.min(cardData.unfiltered.length - 1, bucketedSelectionIndices[0]))].start;
            var end = cardData.unfiltered[Math.min(cardData.unfiltered.length - 1, bucketedSelectionIndices[1] - 1)].end;
            return [start, end];
          }).
          startWith(undefined).
          distinctUntilChanged(_.identity, extentComparer).
          merge(brushClear$);

        // Add a collection of data buckets that mirrors the filtered data
        // to be rendered as the brushed selection
        var cardDataWithSelection$ = cardData$.
          combineLatest(bucketedSelectionValues$, function(cardData, selectionValues) {
            return _.extend({
              selected: cardData.filtered,
              hasSelection: _.isDefined(selectionValues)
            }, cardData);
          });

        var filter$ = brushMouseUp$.
          merge(brushClear$).
          withLatestFrom(bucketedSelectionValues$, function(brushMouseUp, valueExtent) { return valueExtent; }).
          distinctUntilChanged(_.identity, extentComparer).
          share();

        $scope.$emitEventsFromObservable(
          'toggle-dataset-filter:histogram',
          filter$
        );
        $scope.$emitEventsFromObservable(
          'dataset-filter:histogram',
          filter$.filter(_.isDefined)
        );
        $scope.$emitEventsFromObservable(
          'dataset-filter-clear:histogram',
          filter$.filter(_.isUndefined)
        );

        var brushStartWithBucketedSelectionValues$ = brushStart$.
          withLatestFrom(
            bucketedSelectionValues$,
            function(brushStart, bucketedSelectionValues) {
              return bucketedSelectionValues;
            });

        var brushEndWithBucketedSelectionValues$ = brushEnd$.
          withLatestFrom(
            bucketedSelectionValues$,
            function(brushEnd, bucketedSelectionValues) {
              return bucketedSelectionValues;
            });

        // Approximates the y value of the x-center of the selection path
        // Updates a placeholder element for positioning the flyout upon
        Rx.Observable.merge(brushEnd$, bucketedSelectionValues$, cardDimensions$).
          subscribe(function() {
            var extentCenter = { x: 0, y: 0 };

            // TODO - Think about this more...
            function findXPositionOnPath(x, path) {
              var pointOnPath = path.getPointAtLength(x);
              var xOnPath = pointOnPath.x;
              var steps = 10;
              var delta = x - xOnPath;
              while (xOnPath < x && steps > 0) {
                delta += Math.abs(x - xOnPath) / 2;
                pointOnPath = path.getPointAtLength(x + delta);
                xOnPath = pointOnPath.x;
                steps -= 1;
              }
              steps = 10;
              while (xOnPath > x && steps > 0) {
                delta -= 10;
                pointOnPath = path.getPointAtLength(x + delta);
                xOnPath = pointOnPath.x;
                steps -= 1;
              }
              return pointOnPath;
            }
            var extent = brush.extent();
            var unfilteredPath = _.get(dom, 'line.unfiltered');
            unfilteredPath = unfilteredPath.node() || null;
            _.defer(function() {
              if (_.isPresent(unfilteredPath)) {
                var centerPosition = extent[0] + (extent[1] - extent[0]) / 2;
                var centerPointOnPath = findXPositionOnPath(centerPosition, unfilteredPath);
                extentCenter = {
                  x: centerPosition,
                  y: centerPointOnPath.y
                };
              }

              HistogramVisualizationService.updateHistogramHoverTarget(dom, extentCenter);
            });
          });

        // Handles selection start and ends, clearing the selection if a single
        // bucket selection is clicked on
        brushEndWithBucketedSelectionValues$.
          withLatestFrom(
            bucketedSelectionIndices$,
            brushStartWithBucketedSelectionValues$,
            function(brushEnd, bucketedSelectionIndices, brushStart) {
              return {
                didNotChange: extentComparer(brushEnd, brushStart),
                singleBucket: _.isArray(bucketedSelectionIndices) &&
                  bucketedSelectionIndices[1] === bucketedSelectionIndices[0] + 1
              };
            }).
          subscribe(function(selectionStatus) {
            if (selectionStatus.didNotChange && selectionStatus.singleBucket) {
              _.defer(function() { histogramBrush.brushDispatcher.clear() });
            }
          });

        var selectionExtent$ = $scope.$observe('selectionExtent');
        var selectionIndices$ = selectionExtent$.
          combineLatest(cardData$, function(selectionExtent, cardData) {
            if (
              !_.isArray(selectionExtent) ||
              (selectionExtent[0] === 0 && selectionExtent[1] === 0)
            ) {
              return;
            }
            var start = _.findIndex(cardData.unfiltered, function(item) {
              return item.start === selectionExtent[0];
            });
            var end = _.findIndex(cardData.unfiltered, function(item) {
              return item.end === selectionExtent[1];
            });
            return [start, end];
          });

        // Combine Observables
        var uiUpdate$ = Rx.Observable.combineLatest(
          cardDataWithSelection$,
          cardDimensions$,
          bucketedSelectionValues$,
          selectionIndices$,
          brushEnd$.startWith(null),
          function(data, dimensions, selectionValues, selectionIndices) {
            return {
              axis: axis,
              data: data,
              dimensions: dimensions,
              dom: dom,
              hover: hover,
              isFiltered: $scope.isFiltered,
              selectionActive: _.isPresent(selectionValues),
              rowDisplayUnit: $scope.rowDisplayUnit,
              scale: scale,
              selectionIndices: selectionIndices,
              selectionValues: selectionValues,
              svg: svg
            };
          }).
          // Using withLatestFrom here to avoid a (Rx?) issue where combineLatest
          // with both brushStart and brushEnd events would not trigger brushing
          withLatestFrom(selectionInProgress$, function(options, selectionInProgress) {
            return _.extend({ selectionInProgress: selectionInProgress }, options);
          }).
          // Using doAction for these side-effects to guarantee ordering with
          // subscriptions below
          doAction(function(options) {
            scale = service.updateScale(scale, options.data, options.dimensions);
            svg = service.updateSVG(svg, options.data, scale);
            histogramBrush.updateBrush(dom, brush, options.dimensions.height, options.selectionValues);
            hover = service.updateHover(options);
          }).
          share();

        uiUpdate$.
          subscribe(function(options) {
            service.render(options);
          });

        // Clean up after ourselves
        $scope.$destroyAsObservable(element).
          subscribe(function() {
            service.destroyHover(hover);
          });

        selectionIndices$.combineLatest(
          uiUpdate$,
          function(selectionIndices) {
            if (_.isUndefined(selectionIndices)) {
              return [0, 0];
            }
            var bucketWidth = scale.x.rangeBand();
            var start = selectionIndices[0] * bucketWidth;
            var end = (selectionIndices[1] + 1) * bucketWidth;

            return [start, end];
          }).
          distinctUntilChanged(_.identity, extentComparer).
          subscribe(function(extent) {
            dom.brush.call(brush.extent(extent)).call(brush.event);
          });

        var hasSelection$ = cardDataWithSelection$.pluck('hasSelection');
        $scope.$bindObservable('hasSelection', hasSelection$);

      }
    }
  }

  angular.
    module('dataCards.directives').
    directive('histogram', histogramDirective);

})();
