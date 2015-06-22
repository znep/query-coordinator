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
        activeFilters: '=',
        expanded: '=',
        selectionRange: '='
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
        var brush = service.setupBrush(scale);
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

        // Emitted while brushing/selecting in chart
        var brushEvent$ = Rx.Observable.fromEventPattern(_.partial(brush.control.on, 'brush', _)).
          map(function() {
            return brush.control.extent();
          }).
          distinctUntilChanged(_.identity, extentComparer).
          share();

        // Emitted when mousing down in the brushable area
        var brushMouseDown$ = Rx.Observable.fromEventPattern(function(handler) {
          dom.brush.call(function(g) {
            g.on('mousedown', handler);
          });
        }).share();

        // Emitted when mousing up after initially mousing down in the chart
        var brushMouseUp$ = brushMouseDown$.flatMapLatest(function() {
          return Rx.Observable.fromEvent(document, 'mouseup');
        });

        // Brush / selection start and end events emitted by D3
        var brushStartEvents$ = Rx.Observable.
          fromEventPattern(_.partial(brush.control.on, 'brushstart', _)).
          share().
          map(_.constant(true));

        var brushEndEvent$ = Rx.Observable.
          fromEventPattern(_.partial(brush.control.on, 'brushend', _)).
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

        var activeFilters$ = $scope.$observe('activeFilters').
          filter(function(activeFilters) {
            return _.isArray(activeFilters) && _.isEmpty(activeFilters);
          });

        var brushClear$ = Rx.Observable.fromEventPattern(function(handler) {
          brush.brushDispatcher.on('clear', handler);
        }).
        merge(activeFilters$).
        map(_.constant(undefined)).
        share();

        brushClear$.subscribe(function() {
          _.defer(function() {
            FlyoutService.refreshFlyout({ clientX: 0, clientY: 0, target: null });
          });
        });

        var bucketedSelectionIndices$ = brushEvent$.
          combineLatest(cardData$, cardDimensions$, function (bucketedSelectionInPixels, cardData) {
            var bucketWidth = scale.x.rangeBand();

            return _.map(
              bucketedSelectionInPixels,
              _.partial(service.bucketedIndexValue, bucketWidth, cardData.unfiltered.length)
            );
          });

        var bucketedSelectionInPixels$ = bucketedSelectionIndices$.
          map(function(bucketedSelectionIndices) {
            var bucketWidth = scale.x.rangeBand();
            return _.map(bucketedSelectionIndices, function(value) { return value * bucketWidth; });
          });

        bucketedSelectionInPixels$.subscribe(function(bucketedSelectionInPixels) {
          dom.brush.call(brush.control.extent(bucketedSelectionInPixels)).call(brush.control.event);
        });

        var bucketedSelectionValues$ = bucketedSelectionIndices$.
          withLatestFrom(cardData$, function(bucketedSelectionIndices, cardData) {
            if (bucketedSelectionIndices[0] === 0 && bucketedSelectionIndices[1] === 0) {
              return;
            }
            var endIndex = cardData.unfiltered.length - 1;
            var start = cardData.unfiltered[Math.max(0, Math.min(endIndex, bucketedSelectionIndices[0]))].start;
            var end = cardData.unfiltered[Math.min(endIndex, bucketedSelectionIndices[1] - 1)].end;
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
            var extent = brush.control.extent();
            var targetX = extent[0] + (extent[1] - extent[0]) / 2;
            var yValues = _(['filtered', 'unfiltered']).
              map(function(selector) {
                var path = _.get(dom, 'line.{0}'.format(selector));
                path = path.node() || null;
                if (_.isPresent(path)) {
                  var pathLength = path.getTotalLength();

                  var point = (function findXPositionOnPath(low, high, mid) {
                    var point = path.getPointAtLength(mid);

                    if (Math.abs(point.x - targetX) < 1) {
                      return point;
                    }
                    else if (point.x < targetX) {
                      low = mid;
                      mid = (low + high) / 2;
                    }
                    else {
                      high = mid;
                      mid = (low + high) / 2;
                    }

                    return findXPositionOnPath(low, high, mid);
                  })(0, pathLength, pathLength / 2);

                  return point.y;
                }
              }).
              filter(_.isNumber).
              value();

            extentCenter = {
              x: targetX,
              y: Math.min.apply(null, yValues.concat([scale.y(0)]))
            };

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
              _.defer(function() { brush.brushDispatcher.clear() });
            }
          });

        var selectionRange$ = $scope.$observe('selectionRange');
        var selectionIndices$ = selectionRange$.
          combineLatest(cardData$, function(selectionRange, cardData) {
            if (
              !_.isArray(selectionRange) ||
              (selectionRange[0] === 0 && selectionRange[1] === 0)
            ) {
              return;
            }
            var start = _.findIndex(cardData.unfiltered, function(item) {
              return item.start === selectionRange[0];
            });
            var end = _.findIndex(cardData.unfiltered, function(item) {
              return item.end === selectionRange[1];
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
          function(data, dimensions, selectionValues, selectionRange) {
            return {
              axis: axis,
              brush: brush,
              data: data,
              dimensions: dimensions,
              dom: dom,
              hover: hover,
              isFiltered: $scope.isFiltered,
              selectionActive: _.isPresent(selectionValues),
              rowDisplayUnit: $scope.rowDisplayUnit,
              scale: scale,
              selectionRange: selectionRange,
              selectionValues: selectionValues,
              svg: svg
            };
          }).
          // Using withLatestFrom here to avoid a (Rx?) issue where combineLatest
          // with both brushStart and brushEnd events would not trigger brushing
          withLatestFrom(selectionInProgress$, function(options, selectionInProgress) {
            return _.extend(options, { selectionInProgress: selectionInProgress });
          }).
          // Using doAction for these side-effects to guarantee ordering with
          // subscriptions below
          doAction(function(options) {
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
              options.dimensions.height,
              options.selectionValues,
              options.selectionRange
            );
            hover = service.updateHover(
              options.data,
              options.dom,
              options.hover,
              options.isFiltered,
              options.rowDisplayUnit,
              options.scale,
              options.selectionActive,
              options.selectionRange,
              options.selectionInProgress,
              options.selectionValues
            );
          }).
          share();

        uiUpdate$.
          subscribe(function(options) {
            service.render(
              options.axis,
              options.data,
              options.dimensions,
              options.dom,
              options.svg
            );
          });

        // Clean up after ourselves
        $scope.$destroyAsObservable(element).
          subscribe(function() {
            service.destroyHover(hover);
            service.destroyBrush(brush);
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
            dom.brush.call(brush.control.extent(extent)).call(brush.control.event);
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
