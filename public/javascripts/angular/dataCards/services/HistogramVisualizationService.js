(function() {
  'use strict';

  function pluralizeBasedOnValue(string, value) {
    return (value === 1) ? string : string.pluralize();
  }

  function renderHoverFlyoutTemplate(
    unfilteredBucket,
    filteredBucket,
    hoverOutsideSelection,
    selectionActive,
    isFiltered
  ) {
    var lines = [];

    if (_.isPresent(unfilteredBucket) && _.isPresent(filteredBucket)) {
      lines = lines.concat([
        '<div class="flyout-title">{valueRange}</div>',
        '<div class="flyout-row">',
        '<span class="flyout-cell">{total}:</span>',
        '<span class="flyout-cell">{rangeTotal} {rangeTotalRowDisplayUnit}</span>',
        '</div>'
      ]);

      if (selectionActive && !hoverOutsideSelection) {
        lines = lines.concat([
          '<div class="flyout-row">',
          '<span class="flyout-cell is-selected">{currentFilter}:</span>',
          '<span class="flyout-cell is-selected">',
          '{rangeFilteredAmount} {rangeFilteredRowDisplayUnit}',
          '</span>',
          '</div>',
          '<div class="flyout-row">',
          '<span class="flyout-cell">{clearRangeFilterLong}</span>',
          '<span class="flyout-cell"></span>',
          '</div>'
        ]);

      } else {

        if (isFiltered || hoverOutsideSelection) {
          lines = lines.concat([
            '<div class="flyout-row">',
            '<span class="flyout-cell is-highlighted">{filteredAmount}:</span>',
            '<span class="flyout-cell is-highlighted">',
            '{rangeFilteredAmount} {rangeFilteredRowDisplayUnit}',
            '</span>',
            '</div>'
          ]);
        }
      }
    }
    return lines.join('');
  }

  function HistogramVisualizationService(Constants, FlyoutService, I18n, FormatService) {
    function setupDOM(id, container) {
      var dom = {};

      dom.margin = Constants.HISTOGRAM_MARGINS;

      container.innerHTML = '';
      dom.container = container;
      dom.svg = d3.select(dom.container).append('svg');
      dom.chart = dom.svg.append('g');

      // Normal areas and lines
      dom.area = {};
      dom.line = {};
      dom.area.unfiltered = dom.chart.append('path').
        classed('histogram-area histogram-area-unfiltered', true);
      dom.line.unfiltered = dom.chart.append('path').
        classed('histogram-trace histogram-trace-unfiltered', true);

      dom.area.filtered = dom.chart.append('path').
        classed('histogram-area histogram-area-filtered', true);
      dom.line.filtered = dom.chart.append('path').
        classed('histogram-trace histogram-trace-filtered', true);

      // Selected areas and lines
      dom.area.selectedUnfiltered = dom.chart.
        selectAll('.histogram-area.histogram-area-selected-unfiltered').data([0]);
      dom.line.selectedUnfiltered = dom.chart.
        selectAll('.histogram-area.histogram-trace-selected-unfiltered').data([0]);

      dom.area.selectedUnfiltered.enter().
        append('path').
        attr('clip-path', 'url(#clip-{0})'.format(id)).
        classed('histogram-area histogram-area-selected-unfiltered', true);

      dom.line.selectedUnfiltered.enter().
        append('path').
        attr('clip-path', 'url(#clip-{0})'.format(id)).
        classed('histogram-trace histogram-trace-selected-unfiltered', true);

      dom.area.selected = dom.chart.
        selectAll('.histogram-area.histogram-area-selected').data([0]);
      dom.line.selected = dom.chart.
        selectAll('.histogram-area.histogram-trace-selected').data([0]);

      dom.area.selected.enter().
        append('path').
        attr('clip-path', 'url(#clip-{0})'.format(id)).
        classed('histogram-area histogram-area-selected', true);

      dom.line.selected.enter().
        append('path').
        attr('clip-path', 'url(#clip-{0})'.format(id)).
        classed('histogram-trace histogram-trace-selected', true);

      // Axes
      dom.xTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-x', true);
      dom.yTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-y', true);

      dom.hoverTarget = dom.chart.append('line').
        classed('histogram-hover-target', true);

      dom.hoverDispatcher = d3.dispatch('hover');

      dom.blockHoverTarget = dom.chart.selectAll('.block-hover-target').data([[0, 0]]);
      dom.blockHoverTarget.enter().append('line').classed('block-hover-target', true);

      // Brush
      dom.brush = dom.chart.selectAll('.brush').data([0]);

      dom.brush.enter().
        append('g').classed('brush', true).
        attr('transform', 'translate(0, 0)').
        append('clipPath').
        attr('id', 'clip-{0}'.format(id)).
        append('rect').
        classed('extent', true);

      return dom;
    }

    function setupScale() {
      return {
        x: d3.scale.ordinal(),
        y: d3.scale.linear(),
        linearX: d3.scale.linear()
      };
    }

    function setupAxis(scale) {

      var axis = {
        x: d3.svg.axis(),
        xLabels: [],
        y: d3.svg.axis()
      };

      axis.x.
        scale(scale.x).
        orient('bottom').
        tickFormat(function(d) { return FormatService.formatNumber(d); });

      axis.y.
        scale(scale.y).
        orient('left').
        tickFormat(function(d) { return FormatService.formatNumber(d); }).
        ticks(3);

      return axis;
    }

    function setupSVG() {
      function generateSVGRenderer(type) {
        return d3.svg[type]().
          defined(function(d) {
            return _.isString(d) || (_.isObject(d) && _.isFinite(d.value));
          }).
          interpolate('monotone');
      }

      return {
        unfiltered: {
          area: generateSVGRenderer('area'),
          line: generateSVGRenderer('line')
        },
        filtered: {
          area: generateSVGRenderer('area'),
          line: generateSVGRenderer('line')
        },
        selected: {
          area: generateSVGRenderer('area'),
          line: generateSVGRenderer('line')
        }
      };
    }

    function setupHover(dom) {
      function renderFilteredFlyout(target, flyoutTarget, renderFilteredRange) {

        var unfilteredBucket = hover.unfilteredBucket;
        var filteredBucket = hover.filteredBucket;
        var selectedBuckets = hover.selectedBuckets;
        var emptyRangeWithSelection = renderFilteredRange && _.isEmpty(selectedBuckets);
        var emptyBucketsWithoutSelection = !renderFilteredRange &&
          _.isEmpty(unfilteredBucket) ||
          _.isEmpty(filteredBucket);
        var selectionActive = !renderFilteredRange &&
          (!hover.showFlyout ||
          hover.selectionInProgress);

        if (emptyRangeWithSelection || emptyBucketsWithoutSelection || selectionActive) {
          return;
        }

        var hoverOutsideSelection = (!renderFilteredRange && _.isEmpty(selectedBuckets)) ?
          false :
          unfilteredBucket.start < selectedBuckets.start ||
          unfilteredBucket.end > selectedBuckets.end;

        var bucketOfInterest = renderFilteredRange ?
          selectedBuckets :
          unfilteredBucket;

        var template = renderHoverFlyoutTemplate(
          unfilteredBucket,
          bucketOfInterest,
          hoverOutsideSelection,
          hover.selectionActive,
          hover.isFiltered
        );

        var rangeTotal = renderFilteredRange ?
          selectedBuckets.unfilteredValue :
          unfilteredBucket.value;

        var rangeFilteredAmount = renderFilteredRange ?
          selectedBuckets.value :
          filteredBucket.value;

        if (hoverOutsideSelection) {
          rangeFilteredAmount = 0;
        }

        var valueRange = I18n.filter.valueRange.format(
          FormatService.formatNumber(bucketOfInterest.start),
          FormatService.formatNumber(bucketOfInterest.end)
        );

        var pluralizeRowDisplayUnit = _.partial(pluralizeBasedOnValue, hover.rowDisplayUnit, _);

        return template.format({
          valueRange: valueRange,
          total: I18n.flyout.total,
          currentFilter: I18n.flyout.currentFilter,
          clearRangeFilterLong: I18n.flyout.clearRangeFilterLong,
          filteredAmount: I18n.flyout.filteredAmount,
          rangeTotal: FormatService.formatNumber(rangeTotal),
          rangeTotalRowDisplayUnit: pluralizeRowDisplayUnit(rangeTotal),
          rangeFilteredAmount: FormatService.formatNumber(rangeFilteredAmount),
          rangeFilteredRowDisplayUnit: pluralizeRowDisplayUnit(rangeFilteredAmount)
        });
      }

      var renderFilteredRangeFlyout = _.partial(renderFilteredFlyout, _, true);

      var renderFilteredRangeSelectors = [
        '.histogram-brush-clear-background',
        '.histogram-brush-clear-range',
        '.histogram-brush-clear-label',
        '.histogram-filter-icon'
      ].join(', ');

      var hover = {
        unfilteredBucket: null,
        filteredBucket: null,
        selectedBuckets: null,
        isFiltered: false,
        rowDisplayUnit: '',
        showFlyout: true,
        deregisterFlyout: function() {
          FlyoutService.deregister('.histogram-hover-shield', renderFilteredFlyout);
          FlyoutService.deregister(renderFilteredRangeSelectors, renderFilteredRangeFlyout);
        }
      };

      dom.svg.on('mouseover', function() {
        FlyoutService.register({
          selector: '.histogram-hover-shield',
          render: renderFilteredFlyout,
          positionOn: function() {
            return dom.hoverTarget.node();
          }
        });

        FlyoutService.register({
          selector: renderFilteredRangeSelectors,
          render: renderFilteredRangeFlyout,
          positionOn: function() {
            return dom.blockHoverTarget.node();
          }
        });
      });

      dom.svg.on('mouseout', function() {
        hover.deregisterFlyout();
        dom.hoverBlock.attr('visibility', 'hidden');
      });

      return hover;
    }

    function setupBrush(dom, scale) {
      var brush = {};
      brush.control = d3.svg.brush();
      brush.brushDispatcher = d3.dispatch('clear', 'start', 'end');
      brush.selectionClearFlyout = _.constant(
        '<div class="flyout-title">{0}</div>'.
          format(I18n.distributionChart.dragClearHelp)
      );
      brush.brushDragFlyout = _.constant('<div class="flyout-title">{0}</div>'.
        format(I18n.distributionChart.dragHelp)
      );

      brush.control.
        x(scale.x).
        clamp(true).
        on('brushstart', brushstart).
        on('brush', brushmove).
        on('brushend', brushend);

      brush.bisectPath = function(path, targetX) {
        var pathLength = path.getTotalLength();

        return (function findXPositionOnPath(low, high, mid) {
          var point = path.getPointAtLength(mid);

          if (Math.abs(point.x - targetX) < 1) {
            return point;
          } else if (point.x < targetX) {
            low = mid;
            mid = (low + high) / 2;
          } else {
            high = mid;
            mid = (low + high) / 2;
          }

          return findXPositionOnPath(low, high, mid);
        })(0, pathLength, pathLength / 2);
      };

      brush.indexFromPoint = function indexFromPoint(point, operation) {
        var scaledPoint = scale.linearX.invert(point);
        return operation ? Math[operation](scaledPoint) : d3.round(scaledPoint);
      };

      brush.pointFromIndex = function pointFromIndex(index) {
        var bucketWidth = scale.x.rangeBand();
        return index * bucketWidth;
      };

      brush.updateExtent = function updateExtent(newExtentInPixels) {
        var extent = dom.brush.select('.extent');
        var resize = [
          dom.brush.select('.resize.w'),
          dom.brush.select('.resize.e')
        ];

        if (newExtentInPixels[0] === newExtentInPixels[1]) {
          brush.control.clear();
        } else {
          brush.control.extent(newExtentInPixels);
        }
        extent.
          attr('x', newExtentInPixels[0]).
          attr('width', newExtentInPixels[1] - newExtentInPixels[0]);
        resize[0].
          style('display', brush.control.empty() ? 'none' : null).
          attr('transform', 'translate(' + newExtentInPixels[0] + ', 0)');
        resize[1].
          style('display', brush.control.empty() ? 'none' : null).
          attr('transform', 'translate(' + newExtentInPixels[1] + ', 0)');
      };

      var startLocation;
      var startExtent;
      var startedEmpty;

      function brushstart() {
        startLocation = d3.mouse(this)[0];
        startExtent = d3.event.target.extent();
        startExtent = [
          d3.round(startExtent[0]),
          d3.round(startExtent[1])
        ];
        startedEmpty = d3.event.target.empty();
        brush.brushDispatcher.start([
          brush.indexFromPoint(startExtent[0]),
          brush.indexFromPoint(startExtent[1])
        ]);

      }

      function brushmove() {
        var extentInPixels = d3.event.target.extent();
        if ((startLocation !== null) && (startLocation !== d3.mouse(this)[0])) {
          startLocation = null;
        }

        // Add / subtract one to prevent floating point precision issues with floor/ceil
        var extentAsIndices = [
          brush.indexFromPoint(extentInPixels[0] + 1, 'floor'),
          brush.indexFromPoint(extentInPixels[1] - 1, 'ceil')
        ];
        var newExtentInPixels = [
          scale.linearX(extentAsIndices[0]),
          scale.linearX(extentAsIndices[1])
        ];
        brush.updateExtent(newExtentInPixels);
      }

      function brushend() {
        var pixelValues;
        if (startLocation !== null) { // click, no move
          var startIndex = brush.indexFromPoint(startLocation, 'floor');
          var indices = [
            startIndex,
            startIndex + 1
          ];
          if (startedEmpty) { // clicked empty extent
            pixelValues = [scale.linearX(indices[0]), scale.linearX(indices[1])];
          } else if (startLocation < startExtent[0] || startExtent[1] < startLocation) {
            // click outside existing extent
            pixelValues = [scale.linearX(indices[0]), scale.linearX(indices[1])];
          } else { // clicked in existing extent
            var startIndices = [
              brush.indexFromPoint(startExtent[0]),
              brush.indexFromPoint(startExtent[1])
            ];
            if (Math.abs(startIndices[0] - startIndices[1]) !== 1) { // clicked existing multi bucket extent
              pixelValues = [scale.linearX(indices[0]), scale.linearX(indices[1])];
            } else {
              pixelValues = [0, 0];
            }
          }
        }
        if (pixelValues) {
          brush.updateExtent(pixelValues);
        }

        if (brush.control.empty()) {
          brush.brushDispatcher.end(null);
        }
        else {
          var newExtent = brush.control.extent();

          brush.brushDispatcher.end([
            brush.indexFromPoint(newExtent[0]),
            brush.indexFromPoint(newExtent[1])
          ]);
        }
      }

      FlyoutService.register({
        selector: '.histogram-brush-clear-target',
        render: brush.selectionClearFlyout
      });

      FlyoutService.register({
        selector: '.histogram-brush-handle-target',
        render: brush.brushDragFlyout
      });

      return brush;
    }

    function destroyHover(hover) {
      hover.deregisterFlyout();
    }

    function destroyBrush(brush) {
      FlyoutService.deregister('.histogram-brush-clear-x',
        brush.selectionClearFlyout
      );

      FlyoutService.deregister('.histogram-brush-handle-target',
        brush.brushDragFlyout
      );
    }

    function updateScale(scale, data, dimensions) {

      // First, generate an array of bucket boundaries. This includes all of the
      // bucket 'start' values, as well as the 'end' value of the last bucket.
      // This array is the domain of the ordinal scale.
      var buckets = _.pluck(data.unfiltered, 'start');
      if (!_.isEmpty(buckets)) {
        buckets.push(_.last(data.unfiltered).end);
      }
      scale.x.domain(buckets);

      // Possible performance refactor (lots of extent calls)
      // The y-domain consists of the min and max value of both the filtered and
      // unfiltered sets of data.
      var dataRangeUnfiltered = d3.extent(data.unfiltered, _.property('value'));
      var dataRangeFiltered = d3.extent(data.filtered, _.property('value'));
      var extentY = d3.extent(dataRangeUnfiltered.concat(dataRangeFiltered));

      // Ensure y-domain includes 0
      if (extentY[0] > 0) {
        extentY[0] = 0;
      } else if (extentY[0] < 0 && extentY[1] < 0) {
        extentY[1] = 0;
      }

      scale.y.domain(extentY);

      // The above domains get mapped to pixel values (ranges) here. The
      // rangeBands function for ordinal scales will map things to the
      // 'middle of the bucket', which is nice. The negative padding (-0.5) is
      // there to smoosh the first and last buckets to the edge of the chart.
      scale.x.rangeBands([0, dimensions.width], 0, -0.5);
      scale.y.range([dimensions.height, 0]);

      scale.linearX.
        domain([0, scale.x.range().length - 1]).
        range([0, dimensions.width]).
        clamp(true);

      return scale;
    }

    function updateAxis(scale, dimensions, axis) {

      var xDomain = scale.x.domain();
      var defaultNumberOfLabels = xDomain.length;
      var visibleLabels;

      var zeroIndex = xDomain.indexOf(0); // zero is always present in the domain
      var totalNegativeLabels = zeroIndex;
      var totalPositiveLabels = defaultNumberOfLabels - zeroIndex - 1;

      var maxPossibleLabels = Math.floor(dimensions.width / Constants.HISTOGRAM_REQUIRED_LABEL_WIDTH);

      // Calculate the number of labels that will be shown when labeling every n
      // numbers to the right and left of 0
      var calculateLabels = function(n) {
        if (n === 1) {
          return defaultNumberOfLabels;
        }
        return (Math.floor(totalPositiveLabels / n) + Math.floor(totalNegativeLabels / n) + 1);
      };

      // Determine the labels that will be displayed, equally spacing them.
      var labelEveryN = _.find(Constants.AXIS_LABEL_SETS, function(n) {
        return calculateLabels(n) <= maxPossibleLabels;
      });

      // Set every n labels that can be shown on either side of 0 to be visible.
      // If only one label can be shown, only mark 0 as visible.
      if (_.isUndefined(labelEveryN)) { // none of the standard label sets will fit
        visibleLabels = xDomain.map(function() { return false; });
        visibleLabels[zeroIndex] = true;
      } else {
        var referencePoint = zeroIndex % labelEveryN;
        visibleLabels = xDomain.map(function(tick, i) {
          return (i % labelEveryN) === referencePoint;
        });
      }
      axis.xLabels = visibleLabels;

      return axis;
    }

    function updateSVG(svg, data, scale) {
      _.each(['filtered', 'unfiltered', 'selected'], function(type) {
        var first = _.first(data[type]).value;
        var last = _.last(data[type]).value;

        var line = svg[type].line;
        var area = svg[type].area;

        var axisLine = scale.y(0);

        // The x and y functions of the svg renderers convert bound data into
        // pixel values, ultimately creating a path attribute. Here we also
        // handle the 'start' and 'end' special cases to extend the range of
        // the left-most and right-most buckets to the edge of the histogram.
        line.
          x(function(d) {
            if (d === 'start') {
              return scale.x.rangeExtent()[0];
            } else if (d === 'end') {
              return scale.x.rangeExtent()[1];
            } else {
              return scale.x(d.end);
            }
          }).
          y(function(d) {
            if (d === 'start') {
              return scale.y(first);
            } else if (d === 'end') {
              return scale.y(last);
            } else {
              var scaledValue = scale.y(d.value);

              // Values close to but not equal zero be at least 2 pixels away
              // from the axis line for readability. Note the flipped plus and
              // minus signs due to the fact that the y axis is reversed.
              if (d.value !== 0 && Math.round(scaledValue) === Math.round(axisLine)) {
                if (d.value > 0) {
                  return axisLine - Constants.HISTOGRAM_NONZERO_PIXEL_THRESHOLD;
                } else {
                  return axisLine + Constants.HISTOGRAM_NONZERO_PIXEL_THRESHOLD;
                }
              } else {
                return scaledValue;
              }
            }
          });

        area.
          x(line.x()).
          y1(line.y()).
          y0(function() { return scale.y(0); });
      });

      return svg;
    }

    function updateHistogramHoverTarget(dom, position) {
      dom.blockHoverTarget.
        data([position]).
        attr('x1', function(d) { return d.x - Constants.HISTOGRAM_HOVER_TARGET_SIZE; }).
        attr('x2', function(d) { return d.x + Constants.HISTOGRAM_HOVER_TARGET_SIZE; }).
        attr('y1', function(d) { return d.y; }).
        attr('y2', function(d) { return d.y; });
    }

    function updateHover(
      brush,
      data,
      dom,
      hover,
      isFiltered,
      rowDisplayUnit,
      scale,
      selectionActive,
      selectionIndices,
      selectionInProgress,
      selectionValues
    ) {

      if (_.isPresent(selectionValues) && _.isPresent(selectionIndices)) {
        var unfilteredValueInSelection = _(data.unfiltered).chain().
          slice(selectionIndices[0], selectionIndices[1] + 1).
          reduce(function(total, bucket) { return total + bucket.value; }, 0).
          value();

        var filteredValueInSelection = _(data.filtered).chain().
          slice(selectionIndices[0], selectionIndices[1] + 1).
          reduce(function(total, bucket) { return total + bucket.value; }, 0).
          value();

        hover.selectedBuckets = {
          start: selectionValues[0],
          end: selectionValues[1],
          unfilteredValue: unfilteredValueInSelection,
          value: filteredValueInSelection
        };
      } else {
        hover.selectedBuckets = {};
      }

      dom.svg.on('mousemove', function() {
        var mouseX = Math.max(0, d3.mouse(dom.hoverShield.node())[0]);
        var bucketWidth = scale.x.rangeBand();
        var bucketIndex = brush.indexFromPoint(mouseX, 'floor');

        if (bucketIndex < 0 || bucketIndex >= data.unfiltered.length) {
          return;
        }

        hover.unfilteredBucket = data.unfiltered[bucketIndex];
        hover.filteredBucket = data.filtered[bucketIndex];

        if (hover.showFlyout) {
          var totalWidth = bucketIndex * bucketWidth;
          dom.hoverBlock.
            attr('visibility', 'visible').
            attr('x', totalWidth).
            attr('y', -1).
            attr('width', bucketWidth);
          var filteredValue = _.get(hover, 'filteredBucket.value', 0);
          var unfilteredValue = _.get(hover, 'unfilteredBucket.value', 0);
          var maxValueOrZero = _.isEmpty(hover.selectedBuckets) ?
            Math.max(0, filteredValue, unfilteredValue) :
            Math.max(0, unfilteredValue);
          var hoverTargetY = scale.y(maxValueOrZero);
          dom.hoverTarget.
            attr('x1', totalWidth).
            attr('x2', totalWidth + bucketWidth).
            attr('y1', hoverTargetY).
            attr('y2', hoverTargetY);
        }
      });

      dom.hoverDispatcher.on('hover', function(brushLeft, brushRight) {
        if (_.isUndefined(brushLeft) && _.isUndefined(brushRight)) {
          hover.showFlyout = true;
          dom.hoverBlock.
            attr('visibility', 'hidden');
        } else {
          hover.showFlyout = false;
          dom.hoverBlock.
            attr('visibility', 'visible').
            attr('x', brushLeft).
            attr('y', -1).
            attr('width', brushRight - brushLeft);

          var filteredBucket = _.get(hover, 'filteredBucket.value', 0);
          var unfilteredBucket = _.get(hover, 'unfilteredBucket.value', 0);
          var maxValueOrZero = Math.max(0, filteredBucket, unfilteredBucket);
          var hoverTargetY = scale.y(maxValueOrZero);
          dom.hoverTarget.
            attr('x1', brushLeft).
            attr('x2', brushRight).
            attr('y1', hoverTargetY).
            attr('y2', hoverTargetY);
        }
      });

      return _.extend(hover, {
        isFiltered: isFiltered,
        selectionActive: selectionActive,
        selectionInProgress: selectionInProgress,
        rowDisplayUnit: rowDisplayUnit
      });
    }

    function updateBrush(
      dom,
      brush,
      selectionValues,
      dimensions,
      selectionInProgress,
      selectionIndices,
      maxIndex
    ) {

      function setupBrushHandles(selection, height, leftOffset) {

        var handleHeight = Constants.HISTOGRAM_HANDLE_HEIGHT;

        function brushLine(gBrush) {
          gBrush.append('line').
            classed('histogram-brush-line', true).
            attr('y1', 0);
        }

        function brushHandle(path, gBrush) {
          gBrush.append('path').
            attr('class', 'histogram-brush-handle').
            attr('d', path);
        }

        function brushHoverTarget(xTranslation, gBrush) {
          gBrush.append('rect').
            attr('class', 'histogram-brush-handle-target').
            style('fill', 'transparent').
            attr('height', '100%').
            attr('width', function() {
              return gBrush.node().getBoundingClientRect().width;
            }).
            attr('transform', function() {
              return 'translate({0}, 0)'.format(xTranslation);
            });
        }

        function buildBrushHandle(side, path) {
          var direction = side === 'right' ? 'e' : 'w';
          if (selection.select('.histogram-brush-{0}'.format(side)).empty()) {
            selection.select('.resize.{0}'.format(direction)).
              attr('transform', 'translate({0}, 0)'.format(
                Constants.HISTOGRAM_DRAG_TARGET_WIDTH + leftOffset
              )).
              append('g').attr('class', 'histogram-brush-{0}'.format(side)).
              call(brushLine).
              call(_.partial(brushHandle, path, _)).
              call(_.partial(brushHoverTarget, side === 'right' ? 0 : -10, _));
          }
          selection.selectAll('.histogram-brush-line').
            attr('y2', height + handleHeight);
        }

        buildBrushHandle('right', 'M0,0L10,0L10,8L0,16Z');
        buildBrushHandle('left', 'M0,0L-10,0L-10,8L0,16Z');
      }

      dom.brush.
        call(brush.control).
        select('.extent').
        attr('y', -(Constants.HISTOGRAM_HANDLE_HEIGHT / 2)).
        attr('height', dimensions.height + Constants.HISTOGRAM_HANDLE_HEIGHT);

      dom.hoverBlock = dom.brush.selectAll('.histogram-hover-block').data([0]);
      dom.hoverBlock.enter().
        insert('rect', '.resize').
        classed('histogram-hover-block', true);

      dom.hoverShield = dom.brush.selectAll('.histogram-hover-shield').data([0]);
      dom.hoverShield.enter().
        insert('rect', '.resize').
        classed('histogram-hover-shield', true);

      var brushLeft = 0;
      var brushRight = 0;

      if (_.isPresent(selectionIndices)) {
        brushLeft = brush.pointFromIndex(selectionIndices[0]);
        brushRight = brush.pointFromIndex(selectionIndices[1] + 1);
      }

      var labelString = _.isPresent(selectionValues) ?
        I18n.t(
          'filter.valueRange',
          FormatService.formatNumber(selectionValues[0]),
          FormatService.formatNumber(selectionValues[1])
        ) :
        '';

      var brushClearData = [{
        brushLeft: brushLeft,
        brushRight: brushRight,
        brushWidth: brushRight - brushLeft,
        brushMax: brush.pointFromIndex(maxIndex) - dom.margin.left,
        brushHasExtent: !brush.control.empty(),
        offset: 5,
        backgroundHeight: '3em',
        top: dimensions.height,
        selectionInProgress: selectionInProgress,
        labelString: labelString
      }];

      var brushClearTextOffset;
      var brushClearTextWidth;

      var brushClear = dom.brush.selectAll('.histogram-brush-clear').
        data(brushClearData);

      brushClear.enter().
        append('g').classed('histogram-brush-clear', true).
        on('mouseover.histogram-brush-clear', function(d) {
          FlyoutService.refreshFlyout();
          dom.hoverDispatcher.hover(d.brushLeft, d.brushRight);
        }).
        on('mouseout.histogram-brush-clear', function() {
          FlyoutService.refreshFlyout();
          dom.hoverDispatcher.hover();
        }).
        on('mousedown.histogram-brush-clear-text', function() {
          d3.event.stopPropagation();
          brush.brushDispatcher.clear();
          var evt = new MouseEvent('mousemove', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          });
          document.body.dispatchEvent(evt);
        });

      var brushClearRange = brushClear.selectAll('.histogram-brush-clear-range').
        data(brushClearData);

      brushClearRange.enter().
        insert('rect').
        classed('histogram-brush-clear-range', true).
        style('fill', 'none');

      brushClearRange.
        attr('height', _.property('backgroundHeight')).
        attr('width', function(d) {
          return Math.max(0, d.brushRight - d.brushLeft);
        });

      var brushClearText = brushClear.selectAll('.histogram-brush-clear-text').
        data(brushClearData);

      brushClearText.enter().
        insert('text').
        classed('histogram-brush-clear-text', true);

      var brushClearFilter = brushClearText.
        selectAll('.histogram-filter-icon').
        data([0]);

      brushClearFilter.
        enter().
        append('tspan').
        classed('histogram-filter-icon', true).
        text(Constants.FILTER_ICON_UNICODE_GLYPH);

      var brushClearLabel = brushClearText.
        selectAll('.histogram-brush-clear-label').
        data(function(d) { return [d]; });

      brushClearLabel.
        enter().
        append('tspan').
        classed('histogram-brush-clear-label', true);

      brushClearLabel.
        attr('dx', Constants.HISTOGRAM_TSPAN_OFFSET).
        text(_.property('labelString'));

      brushClearText.
        selectAll('.histogram-brush-clear-x').
        data([0]).
        enter().
        append('tspan').
        classed('histogram-brush-clear-x', true).
        attr('dx', Constants.HISTOGRAM_TSPAN_OFFSET).
        attr('dy', '-0.25em').
        text(Constants.CLOSE_ICON_UNICODE_GLYPH);

      brushClearText.
        attr('dy', '1em').
        attr('dx', function(d) {
          var rect = this.getBoundingClientRect();
          // Firefox doesn't report a width until the rectangle has
          // been rendered in the DOM, so we estimate it
          var width = rect.width === 0 ?
            (d.labelString.length + 2) * 6 :
            rect.width;
          var dx = d.brushWidth / 2;
          dx -= (width / 2);
          if (width > d.brushWidth) {
            var dxLeft = d.brushLeft + dx;
            if (dxLeft < 0) {
              dx = 0;
            } else {
              var dxRight = dxLeft + width + dom.margin.right;
              if (dxRight > d.brushMax) {
                dx = d.brushMax - dxRight;
              }
            }
          }
          brushClearTextOffset = dx;
          brushClearTextWidth = width;
          return dx;
        });

      brushClear.
        style('display', function(d) {
          return (d.brushHasExtent && !d.selectionInProgress) ? null : 'none';
        }).
        attr('transform', function(d) {
          return 'translate({0}, {1})'.format(d.brushLeft, d.top + dom.margin.top);
        }).
        attr('height', '2em').
        attr('width', _.property('brushWidth'));

      brushClear.exit().remove();

      var brushClearBackground = brushClear.selectAll('.histogram-brush-clear-background').
        data(function(d) {
          var rect = brushClearText.node().getBoundingClientRect();
          return [{
            brushWidth: d.brushWidth,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          }];
        });

      brushClearBackground.enter().
        insert('rect', '.histogram-brush-clear-text').
        classed('histogram-brush-clear-background', true);

      brushClearBackground.
        attr('width', _.property('width')).
        attr('height', _.property('height')).
        attr('transform', function(d) {
          var dx = d.brushWidth / 2;
          dx -= (d.width / 2);
          dx = Math.max(0, dx);

          return 'translate({0}, 0)'.format(dx);
        });

      var brushClearTarget = brushClear.
        selectAll('.histogram-brush-clear-target').
        data(function() {
          return [{
            brushClearTextWidth: brushClearTextWidth,
            brushClearTextOffset: brushClearTextOffset
          }];
        });

      brushClearTarget.
        enter().
        append('rect').
        attr('width', '0.5em').
        attr('height', '1em').
        style('fill', 'none').
        classed('histogram-brush-clear-target', true);

      brushClearTarget.
        attr('transform', function(d) {
          var width = this.getBoundingClientRect().width;
          var brushClearTextWidth = d.brushClearTextWidth;
          var brushClearTextOffset = d.brushClearTextOffset;
          return 'translate({0}, 0)'.
            format(brushClearTextOffset + brushClearTextWidth - width);
        });

      brush.brushClearTarget = brushClearTarget.node();

      dom.brush.selectAll('.background').
        attr('width', dimensions.width).
        attr('height', dimensions.height).
        attr('transform', 'translate({0}, 0)'.format(-dom.margin.left)).
        attr('style', 'fill: transparent; cursor: pointer; pointer-events: all;');

      dom.svg.call(setupBrushHandles, dimensions.height, dom.margin.left);

      return brush;
    }

    // Renders the card
    function render(axis, data, dimensions, dom, svg, selectionIndices, brush) {
      var margin = dom.margin;
      var width = dimensions.width;
      var height = dimensions.height;
      var hasSelection = _.isPresent(selectionIndices);

      dom.svg.
        attr('width', width + margin.left + margin.right).
        attr('height', height + margin.top + margin.bottom);

      dom.hoverShield.
        attr('width', dom.svg.attr('width')).
        attr('height', dom.svg.attr('height'));

      dom.hoverBlock.
        attr('height', height + margin.top);

      dom.chart.
        attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      dom.xTicks.attr('transform', 'translate(0,' + height + ')');
      dom.yTicks.attr('transform', 'translate(' + width + ',0)');

      // Custom x axis positioning/rendering.
      function positionXTicks(selection) {
        selection.selectAll('.tick line').
          attr('y1', -2).
          attr('y2', 2);
      }

      // Limit visible x axis labels to only those that will fit within the
      // given card width, equally spaced and including 0
      function filterXLabels(selection) {
        selection.selectAll('.tick text').
          style('visibility', function(d, i) {
            return axis.xLabels[i] ? null : 'hidden';
          });
      }

      function fixXTickEdgeLabels(selection) {
        var labels = selection.selectAll('.tick text')[0];
        if (labels.length >= 2) {
          _.first(labels).style.textAnchor = 'start';
          _.last(labels).style.textAnchor = 'end';
        }
      }

      function applyXTickZeroClass(selection) {
        selection.selectAll('.tick').
          filter(function (d) { return d === 0; }).
          classed('is-zero', true);
      }

      dom.xTicks.
        call(axis.x).
        call(positionXTicks).
        call(filterXLabels).
        call(fixXTickEdgeLabels).
        call(applyXTickZeroClass);

      // Custom y axis positioning/rendering.
      function positionYLabels(selection) {
        selection.selectAll('.tick text').
          attr('transform', function(d) {
            var transformAttr = d3.select(this.parentNode).attr('transform');
            var transform = d3.transform(transformAttr);
            var translateY = transform.translate[1];
            var template = 'translate({0},{1})';
            var offset = Constants.HISTOGRAM_Y_TICK_LABEL_OFFSET;
            return template.format(width, translateY < offset ? offset : -offset);
          });
      }

      // Apply a class to the zero tick (it is bolder/darker than other ticks).
      function applyYTickZeroClass(selection) {
        selection.selectAll('.tick').
          filter(function(d) { return d === 0; }).
          classed('is-zero', true);
      }

      dom.yTicks.
        call(axis.y.tickSize(width)).
        call(positionYLabels).
        call(applyYTickZeroClass);

      // Helper function to render areas + lines.
      function renderArea(filterType, domElement) {
        domElement = domElement || filterType;

        // Introduce artificial start and end points, which are handled as
        // a special case by the svg accessors (updateSVG)
        var dataWithEndpoints = ['start'].concat(data[filterType]).concat('end');

        dom.area[domElement].
          datum(dataWithEndpoints).
          attr('d', svg[filterType].area);

        dom.line[domElement].
          datum(dataWithEndpoints).
          attr('d', svg[filterType].line);
      }

      renderArea('unfiltered');
      renderArea('filtered');
      renderArea('selected');
      renderArea('unfiltered', 'selectedUnfiltered');
      _.each(['area', 'line'], function(value) {
        dom[value].filtered.style('visibility', hasSelection ? 'hidden' : null);
      });

      dom.brush.selectAll('.histogram-brush-clear').style('visibility', hasSelection ? null : 'none');

      var selectionPixels;
      if (_.isPresent(selectionIndices)) {
        selectionPixels = [
          brush.pointFromIndex(selectionIndices[0]),
          brush.pointFromIndex(selectionIndices[1] + 1)
        ];
        brush.updateExtent(selectionPixels);
      } else {
        brush.updateExtent([0, 0]);
      }

      if (brush.control.empty()) {
        brush.brushDispatcher.end(null);
      } else {
        var newExtent = brush.control.extent();

        brush.brushDispatcher.end([
          brush.indexFromPoint(newExtent[0]),
          brush.indexFromPoint(newExtent[1])
        ]);
      }
    }

    return {
      setupDOM: setupDOM,
      setupScale: setupScale,
      setupAxis: setupAxis,
      setupSVG: setupSVG,
      setupHover: setupHover,
      setupBrush: setupBrush,
      destroyHover: destroyHover,
      destroyBrush: destroyBrush,
      updateScale: updateScale,
      updateAxis: updateAxis,
      updateSVG: updateSVG,
      updateHover: updateHover,
      updateHistogramHoverTarget: updateHistogramHoverTarget,
      updateBrush: updateBrush,
      render: render
    };
  }

  angular.
    module('dataCards.services').
      factory('HistogramVisualizationService', HistogramVisualizationService);

})();
