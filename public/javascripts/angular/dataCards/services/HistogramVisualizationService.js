(function() {
  'use strict';

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
      var hover = {
        unfilteredBucket: null,
        filteredBucket: null,
        selectedBuckets: null,
        isFiltered: false,
        rowDisplayUnit: '',
        showFlyout: true,
        deregisterFlyout: function() {
          FlyoutService.deregister('.histogram-hover-shield', renderFilterFlyout);
        }
      };

      function renderHoverFlyoutTemplate(
        unfilteredBucket,
        filteredBucket,
        hoverOutsideSelection
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

          if (hover.selectionActive && !hoverOutsideSelection) {
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

            if (hover.isFiltered || hoverOutsideSelection) {
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

      function renderFilterFlyout() {
        if (!hover.showFlyout || hover.selectionInProgress) {
          return;
        }
        var unfilteredBucket = hover.unfilteredBucket;
        var filteredBucket = hover.filteredBucket;
        var selectedBuckets = hover.selectedBuckets;

        if (_.isEmpty(unfilteredBucket) || _.isEmpty(filteredBucket)) {
          return;
        }
        var hoverOutsideSelection = _.isEmpty(selectedBuckets) ?
          false :
          filteredBucket.start < selectedBuckets.start ||
          filteredBucket.end > selectedBuckets.end;

        var template = renderHoverFlyoutTemplate(
          unfilteredBucket,
          filteredBucket,
          hoverOutsideSelection
        );

        var valueRange = I18n.filter.valueRange.format(
          $.toHumaneNumber(unfilteredBucket.start),
          $.toHumaneNumber(unfilteredBucket.end)
        );

        return template.format({
            valueRange: valueRange,
            total: I18n.flyout.total,
            currentFilter: I18n.flyout.currentFilter,
            clearRangeFilterLong: I18n.flyout.clearRangeFilterLong,
            filteredAmount: I18n.flyout.filteredAmount,
            rangeTotal: $.toHumaneNumber(unfilteredBucket.value),
            rangeTotalRowDisplayUnit: (unfilteredBucket.value === 1) ?
              hover.rowDisplayUnit :
              hover.rowDisplayUnit.pluralize(),
            rangeFilteredAmount: $.toHumaneNumber(hoverOutsideSelection ?
              0 :
              filteredBucket.value),
            rangeFilteredRowDisplayUnit: (filteredBucket.value === 1) ?
              hover.rowDisplayUnit :
              hover.rowDisplayUnit.pluralize()
          }
        );
      }

      function renderFilteredRangeFlyout() {
        var unfilteredBucket = hover.unfilteredBucket;
        var selectedBuckets = hover.selectedBuckets;
        if (_.isEmpty(selectedBuckets)) {
          return;
        }
        var template = renderHoverFlyoutTemplate(unfilteredBucket, selectedBuckets);

        var valueRange = I18n.filter.valueRange.format(
          $.toHumaneNumber(selectedBuckets.start),
          $.toHumaneNumber(selectedBuckets.end)
        );

        return template.format({
            valueRange: valueRange,
            total: I18n.flyout.total,
            currentFilter: I18n.flyout.currentFilter,
            clearRangeFilterLong: I18n.flyout.clearRangeFilterLong,
            filteredAmount: I18n.flyout.filteredAmount,
            rangeTotal: $.toHumaneNumber(selectedBuckets.unfilteredValue),
            rangeTotalRowDisplayUnit: (selectedBuckets.unfilteredValue === 1) ?
              hover.rowDisplayUnit :
              hover.rowDisplayUnit.pluralize(),
            rangeFilteredAmount: $.toHumaneNumber(selectedBuckets.value),
            rangeFilteredRowDisplayUnit: (selectedBuckets.value === 1) ?
              hover.rowDisplayUnit :
              hover.rowDisplayUnit.pluralize()

          });
      }

      dom.svg.on('mouseover', function() {
        FlyoutService.register({
          selector: '.histogram-hover-shield',
          render: renderFilterFlyout,
          positionOn: function() {
            return dom.hoverTarget.node();
          }
        });
      });

      var renderFilteredRangeSelectors = [
        '.brush-clear-background',
        '.brush-clear-text',
        '.filter-icon'
      ];

      FlyoutService.register({
        selector: renderFilteredRangeSelectors.join(', '),
        render: renderFilteredRangeFlyout,
        positionOn: function() {
          return dom.blockHoverTarget.node();
        }
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

    function updateHover(options) {
      var leftOffset = _.get(options, 'dom.margin.left', 0);

      if (!options.dom.hoverShield) {
        // We need to insert the hoverShield into the brush node hierarchy in order
        // to maintain functionality of both
        options.dom.hoverShield = options.dom.brush.
          insert('rect', '.resize.e').
          classed('histogram-hover-shield', true);
      }

      if (!options.dom.hoverBlock) {
        options.dom.hoverBlock = options.dom.brush.
          insert('rect', '.histogram-hover-shield').
          classed('histogram-hover-block', true).
          attr('transform', 'translate({0}, 0)'.format(leftOffset));
      }

      if (_.isPresent(options.selectionValues) && _.isPresent(options.selectionIndices)) {
        var unfilteredValueInSelection = _(options.data.unfiltered).chain().
          slice(options.selectionIndices[0], options.selectionIndices[1] + 1).
          reduce(function(total, bucket) { return total + bucket.value; }, 0).
          value();

        var filteredValueInSelection = _(options.data.filtered).chain().
          slice(options.selectionIndices[0], options.selectionIndices[1] + 1).
          reduce(function(total, bucket) { return total + bucket.value; }, 0).
          value();

        options.hover.selectedBuckets = {
          start: options.selectionValues[0],
          end: options.selectionValues[1],
          unfilteredValue: unfilteredValueInSelection,
          value: filteredValueInSelection
        };
      } else {
        options.hover.selectedBuckets = {};
      }

      options.dom.svg.on('mousemove', function() {
        var mouseX = Math.max(0, d3.mouse(options.dom.hoverShield.node())[0] - leftOffset);
        var bucketWidth = options.scale.x.rangeBand();
        var bucketIndex = (mouseX === 0 || bucketWidth === 0) ?
          0 :
          Math.floor(mouseX / bucketWidth);

        if (bucketIndex < 0 || bucketIndex >= options.data.unfiltered.length) {
          return;
        }
        options.hover.unfilteredBucket = options.data.unfiltered[bucketIndex];
        options.hover.filteredBucket = options.data.filtered[bucketIndex];

        if (options.hover.showFlyout) {
          options.dom.hoverBlock.
            attr('visibility', 'visible').
            attr('x', bucketIndex * bucketWidth).
            attr('y', 0).
            attr('width', bucketWidth);
          var filteredValue = _.get(options.hover, 'filteredBucket.value', 0);
          var unfilteredValue = _.get(options.hover, 'unfilteredBucket.value', 0);
          var maxValueOrZero = Math.max(0, filteredValue, unfilteredValue);
          var hoverTargetY = options.scale.y(maxValueOrZero);
          options.dom.hoverTarget.
            attr('x1', bucketIndex * bucketWidth).
            attr('x2', bucketIndex * bucketWidth + bucketWidth).
            attr('y1', hoverTargetY).
            attr('y2', hoverTargetY);
        }
      });

      options.dom.hoverDispatcher.on('hover', function(brushLeft, brushRight) {
        if (_.isUndefined(brushLeft) && _.isUndefined(brushRight)) {
          options.hover.showFlyout = true;
          options.dom.hoverBlock.
            attr('visibility', 'hidden');
        } else {
          options.hover.showFlyout = false;
          options.dom.hoverBlock.
            attr('visibility', 'visible').
            attr('x', brushLeft).
            attr('y', 0).
            attr('width', brushRight - brushLeft);

          var filteredBucket = _.get(options.hover, 'filteredBucket.value', 0);
          var unfilteredBucket = _.get(options.hover, 'unfilteredBucket.value', 0);
          var maxValueOrZero = Math.max(0, filteredBucket, unfilteredBucket);
          var hoverTargetY = options.scale.y(maxValueOrZero);
          options.dom.hoverTarget.
            attr('x1', brushLeft).
            attr('x2', brushRight).
            attr('y1', hoverTargetY).
            attr('y2', hoverTargetY);

        }
      });

      options.hover.isFiltered = options.isFiltered;
      options.hover.selectionActive = options.selectionActive;
      options.hover.selectionInProgress = options.selectionInProgress;
      options.hover.rowDisplayUnit = options.rowDisplayUnit;

      return options.hover;
    }

    // Renders the card
    function render(options) {
      var margin = options.dom.margin;
      var width = options.dimensions.width;
      var height = options.dimensions.height;

      options.dom.svg.
        attr('width', width + margin.left + margin.right).
        attr('height', height + margin.top + margin.bottom);

      options.dom.hoverShield.
        attr('width', options.dom.svg.attr('width')).
        attr('height', options.dom.svg.attr('height'));

      options.dom.hoverBlock.
        attr('height', height + margin.top);

      options.dom.chart.
        attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      options.dom.xTicks.attr('transform', 'translate(0,' + height + ')');
      options.dom.yTicks.attr('transform', 'translate(' + width + ',0)');

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

      options.dom.xTicks.
        call(options.axis.x).
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

      options.dom.yTicks.
        call(options.axis.y.tickSize(width)).
        call(positionYLabels).
        call(applyYTickZeroClass);

      // Helper function to render areas + lines.
      function renderArea(filterType, domElement) {
        domElement = domElement || filterType;

        // Introduce artificial start and end points, which are handled as
        // a special case by the svg accessors (updateSVG)
        var dataWithEndpoints = ['start'].concat(options.data[filterType]).concat('end');

        options.dom.area[domElement].
          datum(dataWithEndpoints).
          attr('d', options.svg[filterType].area);

        options.dom.line[domElement].
          datum(dataWithEndpoints).
          attr('d', options.svg[filterType].line);
      }

      renderArea('unfiltered');
      renderArea('filtered');
      renderArea('selected');
      renderArea('unfiltered', 'selectedUnfiltered');
      _.each(['area','line'], function(value) {
        options.dom[value].filtered.style('visibility', options.data.hasSelection ? 'hidden' : null);
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
