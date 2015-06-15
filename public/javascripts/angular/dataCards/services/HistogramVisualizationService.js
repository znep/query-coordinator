(function() {
  'use strict';

  function pluralizeBasedOnValue(string, value) {
    return (value === 1) ? string : string.pluralize()
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

  function HistogramVisualizationService(Constants, FlyoutService, I18n) {

    function setupDOM(container) {
      var dom = {};

      dom.margin = Constants.HISTOGRAM_MARGINS;

      container.innerHTML = '';
      dom.container = container;
      dom.svg = d3.select(dom.container).append('svg');
      dom.chart = dom.svg.append('g');

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

      dom.xTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-x', true);
      dom.yTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-y', true);

      dom.hoverTarget = dom.chart.append('line').
        classed('histogram-hover-target', true);

      dom.hoverDispatcher = d3.dispatch('hover');

      dom.blockHoverTarget = dom.chart.selectAll('.block-hover-target').data([[0,0]]);
      dom.blockHoverTarget.enter().append('line').classed('block-hover-target', true);

      return dom;
    }

    function setupScale() {
      return {
        x: d3.scale.ordinal(),
        y: d3.scale.linear()
      };
    }

    function setupAxis(scale) {
      var axis = {
        x: d3.svg.axis(),
        y: d3.svg.axis()
      };

      axis.x.
        scale(scale.x).
        orient('bottom').
        tickFormat($.toHumaneNumber);

      axis.y.
        scale(scale.y).
        orient('left').
        tickFormat($.toHumaneNumber).
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
      function renderFilteredFlyout(ignored, renderFilteredRange) {
        var unfilteredBucket = hover.unfilteredBucket;
        var filteredBucket = hover.filteredBucket;
        var selectedBuckets = hover.selectedBuckets;
        var emptyRangeWithSelection = renderFilteredRange && _.isEmpty(selectedBuckets);
        var emptyBucketsWithoutSelection = !renderFilteredRange &&
          _.isEmpty(unfilteredBucket) ||
          _.isEmpty(filteredBucket);
        var selectionActive = !renderFilteredRange &&
          !hover.showFlyout ||
          hover.selectionInProgress;

        if (emptyRangeWithSelection || emptyBucketsWithoutSelection || selectionActive) {
          return;
        }

        var hoverOutsideSelection = (!renderFilteredRange && _.isEmpty(selectedBuckets)) ?
          false :
          filteredBucket.start < selectedBuckets.start ||
          filteredBucket.end > selectedBuckets.end;

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
          $.toHumaneNumber(bucketOfInterest.start),
          $.toHumaneNumber(bucketOfInterest.end)
        );

        var pluralizeRowDisplayUnit = _.partial(pluralizeBasedOnValue, hover.rowDisplayUnit, _);

        return template.format({
          valueRange: valueRange,
          total: I18n.flyout.total,
          currentFilter: I18n.flyout.currentFilter,
          clearRangeFilterLong: I18n.flyout.clearRangeFilterLong,
          filteredAmount: I18n.flyout.filteredAmount,
          rangeTotal: $.toHumaneNumber(rangeTotal),
          rangeTotalRowDisplayUnit: pluralizeRowDisplayUnit(rangeTotal),
          rangeFilteredAmount: $.toHumaneNumber(rangeFilteredAmount),
          rangeFilteredRowDisplayUnit: pluralizeRowDisplayUnit(rangeFilteredAmount)
        });
      }

      var renderFilteredRangeFlyout = _.partial(renderFilteredFlyout, _, true);

      var renderFilteredRangeSelectors = [
        '.brush-clear-background',
        '.brush-clear-text',
        '.filter-icon'
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
          FlyoutService.deregister(renderFilteredRangeSelectors, renderFilteredFlyout);
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

    function destroyHover(hover) {
      hover.deregisterFlyout();
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
      }
      else if (extentY[0] < 0 && extentY[1] < 0) {
        extentY[1] = 0;
      }

      scale.y.domain(extentY);

      // The above domains get mapped to pixel values (ranges) here. The
      // rangeBands function for ordinal scales will map things to the
      // 'middle of the bucket', which is nice. The negative padding (-0.5) is
      // there to smoosh the first and last buckets to the edge of the chart.
      scale.x.rangeBands([0, dimensions.width], 0, -0.5);
      scale.y.range([dimensions.height, 0]);

      return scale;
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
          y0(function(d) { return scale.y(0); });
      });

      return svg;
    }

    function updateHistogramHoverTarget(dom, position) {
      dom.blockHoverTarget.
        data([position]).
        attr('x1', function(d) { return d.x - 10; }).
        attr('x2', function(d) { return d.x + 10; }).
        attr('y1', function(d) { return d.y; }).
        attr('y2', function(d) { return d.y; });
    }

    function updateHover(
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
      var leftOffset = _.get(dom, 'margin.left', 0);

      if (!dom.hoverShield) {
        // We need to insert the hoverShield into the brush node hierarchy in order
        // to maintain functionality of both
        dom.hoverShield = dom.brush.
          insert('rect', '.resize.e').
          classed('histogram-hover-shield', true);
      }

      if (!dom.hoverBlock) {
        dom.hoverBlock = dom.brush.
          insert('rect', '.histogram-hover-shield').
          classed('histogram-hover-block', true).
          attr('transform', 'translate({0}, 0)'.format(leftOffset));
      }

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
        var mouseX = Math.max(0, d3.mouse(dom.hoverShield.node())[0] - leftOffset);
        var bucketWidth = scale.x.rangeBand();
        var bucketIndex = (mouseX === 0 || bucketWidth === 0) ?
          0 :
          Math.floor(mouseX / bucketWidth);

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
            attr('y', 0).
            attr('width', bucketWidth);
          var filteredValue = _.get(hover, 'filteredBucket.value', 0);
          var unfilteredValue = _.get(hover, 'unfilteredBucket.value', 0);
          var maxValueOrZero = Math.max(0, filteredValue, unfilteredValue);
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
            attr('y', 0).
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

    // Renders the card
    function render(axis, data, dimensions, dom, svg) {
      var margin = dom.margin;
      var width = dimensions.width;
      var height = dimensions.height;

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
        call(fixXTickEdgeLabels).
        call(applyXTickZeroClass);

      // Custom y axis positioning/rendering.
      function positionYLabels(selection) {
        selection.selectAll('.tick text').
          attr('transform', function(d, i) {
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
        dom[value].filtered.style('visibility', data.hasSelection ? 'hidden' : null);
      });

    }

    return {
      setupDOM: setupDOM,
      setupScale: setupScale,
      setupAxis: setupAxis,
      setupSVG: setupSVG,
      setupHover: setupHover,
      destroyHover: destroyHover,
      updateScale: updateScale,
      updateSVG: updateSVG,
      updateHover: updateHover,
      updateHistogramHoverTarget: updateHistogramHoverTarget,
      render: render
    };
  }

  angular.
    module('dataCards.services').
      factory('HistogramVisualizationService', HistogramVisualizationService);

})();
