(function() {
  'use strict';

  function HistogramVisualizationService(Constants, FlyoutService) {

    function setupDOM(container) {
      var dom = {};

      dom.margin = {top: 5, right: 0, bottom: 30, left: 0};

      container.innerHTML = '';
      dom.container = container;
      dom.svg = d3.select(dom.container).append('svg');
      dom.chart = dom.svg.append('g');

      dom.xTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-x', true);
      dom.yTicks = dom.chart.append('g').
        classed('histogram-axis histogram-axis-y', true);

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

      dom.hoverBlock = dom.chart.append('rect').
        classed('histogram-hover-block', true);

      dom.hoverTarget = dom.chart.append('line').
        classed('histogram-hover-target', true);

      dom.hoverShield = dom.svg.append('rect').
        classed('histogram-hover-shield', true);

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
        }
      };
    }

    function setupHover(dom) {
      var hover = {
        unfilteredBucket: null,
        filteredBucket: null,
        isFiltered: false,
        rowDisplayUnit: '',
        deregisterFlyout: function() {
          FlyoutService.deregister('.histogram-hover-shield', renderFlyout);
        }
      };

      function renderFlyout() {
        var unfilteredBucket = hover.unfilteredBucket;
        var filteredBucket = hover.filteredBucket;
        var lines = [];

        if (_.isPresent(unfilteredBucket) && _.isPresent(filteredBucket)) {
          lines = lines.concat([
            '<div class="flyout-title">{0} to {1}</div>',
            '<div class="flyout-row">',
              '<span class="flyout-cell">Total:</span>',
              '<span class="flyout-cell">{2} {4}</span>',
            '</div>'
          ]);

          if (hover.isFiltered) {
            lines = lines.concat([
              '<div class="flyout-row">',
                '<span class="flyout-cell is-highlighted">Filtered Amount:</span>',
                '<span class="flyout-cell is-highlighted">{3} {5}</span>',
              '</div>'
            ]);
          }
        }

        return lines.join('').format(
          $.toHumaneNumber(unfilteredBucket.start),
          $.toHumaneNumber(unfilteredBucket.end),
          $.toHumaneNumber(unfilteredBucket.value),
          $.toHumaneNumber(filteredBucket.value),
          (unfilteredBucket.value === 1) ? hover.rowDisplayUnit : hover.rowDisplayUnit.pluralize(),
          (filteredBucket.value === 1) ? hover.rowDisplayUnit : hover.rowDisplayUnit.pluralize()
        );
      }

      dom.svg.on('mouseover', function() {
        FlyoutService.register({
          selector: '.histogram-hover-shield',
          render: renderFlyout,
          positionOn: function() {
            return dom.hoverTarget.node();
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
      _.each(['filtered', 'unfiltered'], function(type) {
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

    function updateHover(hover, data, isFiltered, rowDisplayUnit, dom, scale) {
      dom.svg.on('mousemove', function() {
        var mouseX = d3.mouse(dom.hoverShield.node())[0];
        var bucketWidth = scale.x.rangeBand();
        var bucketIndex = Math.floor(mouseX / bucketWidth);

        hover.unfilteredBucket = data.unfiltered[bucketIndex];
        hover.filteredBucket = data.filtered[bucketIndex];

        var hoverBlockExtraHeight = 1;

        dom.hoverBlock.
          attr('visibility', 'visible').
          attr('x', bucketIndex * bucketWidth).
          attr('y', -Constants.HISTOGRAM_HOVER_BLOCK_EXTRA_HEIGHT).
          attr('width', bucketWidth);

        var maxValueOrZero = Math.max(0, hover.filteredBucket.value, hover.unfilteredBucket.value);
        var hoverTargetY = scale.y(maxValueOrZero);
        dom.hoverTarget.
          attr('x1', bucketIndex * bucketWidth).
          attr('x2', bucketIndex * bucketWidth + bucketWidth).
          attr('y1', hoverTargetY).
          attr('y2', hoverTargetY);
      });

      hover.isFiltered = isFiltered;
      hover.rowDisplayUnit = rowDisplayUnit;

      return hover;
    }

    // Renders the card
    function render(dom, data, dimensions, scale, axis, svg) {
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
        attr('height', height + Constants.HISTOGRAM_HOVER_BLOCK_EXTRA_HEIGHT);

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

      function applyYTickZeroClass(selection) {
        selection.selectAll('.tick').
          filter(function(d) { return d === 0; }).
          classed('is-zero', true);
      }

      dom.yTicks.
        call(axis.y.tickSize(width)).
        call(positionYLabels).
        call(applyYTickZeroClass);

      // Apply a class to the zero tick (it is bolder/darker than other ticks).
      // Helper function to render areas + lines.
      function renderArea(filterType) {

        // Introduce artificial start and end points, which are handled as
        // a special case by the svg accessors (updateSVG)
        var dataWithEndpoints = ['start'].concat(data[filterType]).concat('end');

        dom.area[filterType].
          datum(dataWithEndpoints).
          attr('d', svg[filterType].area);

        dom.line[filterType].
          datum(dataWithEndpoints).
          attr('d', svg[filterType].line);
      }

      renderArea('unfiltered');
      renderArea('filtered');
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
      render: render
    };
  }

  angular.
    module('dataCards.services').
      factory('HistogramVisualizationService', HistogramVisualizationService);

})();
