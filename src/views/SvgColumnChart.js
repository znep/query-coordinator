const utils = require('socrata-utils');
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const SvgVisualization = require('./SvgVisualization');
const I18n = require('../I18n');

// These values have been eyeballed to provide enough space for axis labels
// that have been observed 'in the wild'. They may need to be adjusted slightly
// in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 16,
  RIGHT: 0,
  BOTTOM: 0,
  LEFT: 50
};
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABEL_ANGLE = 45;
const DIMENSION_LABEL_FONT_SIZE = 14;
const DIMENSION_LABEL_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABEL_MAX_CHARACTERS = 14;
const MEASURE_LABEL_FONT_SIZE = 14;
const MEASURE_LABEL_FONT_COLOR = '#5e5e5e';
const DEFAULT_DESKTOP_COLUMN_WIDTH = 20;
const DEFAULT_MOBILE_COLUMN_WIDTH = 50;
const MAX_COLUMN_COUNT_WITHOUT_PAN = 30;
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const NO_VALUE_SENTINEL = '__NO_VALUE__';
/**
 * Since `_.clamp()` apparently doesn't exist in the version of lodash that we
 * are using. This is called `clampValue` in order to prevent confusion due to
 * d3 also exposing a `.clamp()` method.
 */

function clampValue(value, min, max) {

  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
}

function SvgColumnChart($element, vif) {
  var self = this;
  var $chartElement;
  var dataToRender;
  var d3DimensionXScale;
  var d3GroupingXScale;
  var d3YScale;
  var lastRenderedSeriesWidth = 0;
  var lastRenderedZoomTranslate = 0;

  _.extend(this, new SvgVisualization($element, vif));

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData) {

    if (!newData && !dataToRender) {
      return;
    }

    this.clearError();

    if (newVif) {
      this.updateVif(newVif);
    }

    if (newData) {
      dataToRender = newData;
    }

    renderData();
  };

  this.invalidateSize = function() {

    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  this.destroy = function() {

    d3.
      select(self.$element[0]).
        select('svg').
          remove();

    self.
      $element.
        find('.visualization-container').
          remove();
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    $chartElement = $(
      '<div>',
      {
        'class': 'column-chart'
      }
    );

    self.
      $element.
        find('.visualization-container').
          append($chartElement);
  }

  function renderData() {
    var columnWidth = (self.isMobile()) ?
      DEFAULT_MOBILE_COLUMN_WIDTH :
      DEFAULT_DESKTOP_COLUMN_WIDTH;
    var viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    var width;
    var viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    var height;
    var d3ClipPathId = 'column-chart-clip-path-' + _.uniqueId();
    var dimensionIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('dimension');
        }
      );
    var dimensionValues = _.union(
      _.flatten(
        dataToRender.
          map(
            function(series) {
              var dimensionIndex = series.columns.indexOf('dimension');

              return series.
                rows.
                map(
                  function(row) {
                    return row[dimensionIndex];
                  }
                );
            }
          )
      )
    );
    var longestTruncatedDimensionLabel = d3.
      max(
        dimensionValues.
          map(
            function(dimensionValue) {

              return conditionallyTruncateLabel(dimensionValue).length;
            }
          )
      );
    // After trying and failing to reliably derive the optimal height of the
    // dimension label area trigonometrically, I broke down and just took a
    // bunch of measurements in the browser and then did a regression analysis
    // to derive a function that maps the number of characters in the longest
    // label to an approximation of what the browser's layout height will
    // actually be.
    //
    // See: "https://www.wolframalpha.com/input/?i=linear+fit+%7B22.66,+29.81,\
    // +36.96,+44.11,+51.25,+58.4,+65.55,+72.7,+79.85,+87,+94.14,+101.29,+108.\
    // 44,+118.34,+122.74,+129.9%7D"
    //
    // I obtained these numbers by overriding the dimension labels when
    // rendering with strings of n characters, where 1 <= n <= 16. One of these
    // strings was the character 'w' repeated n times, which I used to force a
    // wide character (as opposed to 'i' or something). I then queried the DOM
    // after layout was complete to get the offset height of the entire x-axis
    // group using jQuery; the table I came up with looked like this:
    //
    // CHARS     HEIGHT
    // 1         22.66
    // 2         29.81
    // 3         36.96
    // 4         44.11
    // 5         51.25
    // 6         58.4
    // 7         65.55
    // 8         72.7
    // 9         79.85
    // 10        87
    // 11        94.14
    // 12        101.29
    // 13        108.44
    // 14        118.34
    // 15        122.74
    // 16        129.9
    //
    // Naturally, these measurements will be invalidated if/when the font or
    // angle of rotation for the dimension labels changes.
    var dimensionLabelsHeight = Math.ceil(
      7.19312 *
      longestTruncatedDimensionLabel +
      14.3048
    );
    var measureIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('measure');
        }
      );
    var measureLabels = self.
      getVif().
        series.
          map(
            function(series) {
              return series.label;
            }
          );
    var groupedDataToRender;
    var columnCount;
    var minYValue;
    var maxYValue;
    var d3XAxis;
    var d3YAxis;
    var d3Zoom;
    var chartSvg;
    var viewportSvg;
    var xAxisAndSeriesSvg;
    var seriesSvg;
    var dimensionGroupSvgs;
    var xAxisPanDistance;
    var xAxisPanningEnabled;
    var xAxisBound = false;
    var yAxisBound = false;

    /**
     * Functions defined inside the scope of renderData() are stateful enough
     * to benefit from sharing variables within a single render cycle.
     */

    // See comment in renderXAxis() for an explanation as to why this is
    // separate.
    function bindXAxisOnce() {

      if (!xAxisBound) {

        xAxisAndSeriesSvg.
          append('g').
            attr('class', 'x axis').
              call(d3XAxis);

        xAxisAndSeriesSvg.
          append('g').
          attr('class', 'x axis baseline').
            call(
              d3XAxis.
                tickFormat('').
                tickSize(0)
            );

        // Bind the chart data to the x-axis tick labels so that when the user
        // hovers over them we have enough information to distinctly identify
        // the column which should be highlighted and show the flyout.
        chartSvg.
          selectAll('.x.axis .tick text').
            data(groupedDataToRender);

        xAxisBound = true;
      }
    }

    function renderXAxis() {
      var xAxisSvg;
      var xBaselineSvg;
      var baselineValue;

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderXAxis() as idempotent.
      bindXAxisOnce();

      xAxisSvg = viewportSvg.select('.x.axis');
      xBaselineSvg = viewportSvg.select('.x.axis.baseline');

      xAxisSvg.
        attr(
          'transform',
          'translate(0,{0})'.format(height)
        );

      xAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');

      xAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_TICK_COLOR).
        attr('shape-rendering', 'crispEdges');

      xAxisSvg.selectAll('text').
        attr('font-family', FONT_STACK).
        attr('font-size', DIMENSION_LABEL_FONT_SIZE + 'px').
        attr('fill', DIMENSION_LABEL_FONT_COLOR).
        attr('stroke', 'none').
        attr('style', 'text-anchor: start').
        attr(
          'transform',
          'translate({0}, 0), rotate({1})'.
            format(
              (columnWidth / 2),
              DIMENSION_LABEL_ANGLE
            )
        ).
        attr(
          'data-row-index',
          function(label, rowIndex) {
            return rowIndex;
          }
        );

      if (minYValue > 0) {
        baselineValue = minYValue;
      } else if (maxYValue < 0) {
        baselineValue = maxYValue;
      } else {
        baselineValue = 0;
      }

      xBaselineSvg.
        attr(
          'transform',
          'translate(0,{0})'.format(d3YScale(baselineValue))
        );

      xBaselineSvg.selectAll('line, path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    function bindYAxisOnce() {

      if (!yAxisBound) {

        chartSvg.
          select('.y.axis').
            call(d3YAxis);

        chartSvg.
          select('.y.grid').
            call(
              d3YAxis.
                tickSize(viewportWidth).
                tickFormat('')
            );

        yAxisBound = true;
      }
    }

    function renderYAxis() {
      var yAxisSvg = chartSvg.
        select('.y.axis');
      var yGridSvg = chartSvg.
        select('.y.grid');

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderYAxis() as idempotent.
      bindYAxisOnce();

      yAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');

      yAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_TICK_COLOR).
        attr('shape-rendering', 'crispEdges');

      yAxisSvg.selectAll('text').
        attr('font-family', FONT_STACK).
        attr('font-size', MEASURE_LABEL_FONT_SIZE + 'px').
        attr('fill', MEASURE_LABEL_FONT_COLOR).
        attr('stroke', 'none');

      yGridSvg.
        attr(
          'transform',
          'translate(' + (viewportWidth) + ',0)'
        );
      yGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      yGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // Note that renderXAxis(), renderYAxis() and renderSeries() all update the
    // elements that have been created by binding the data (which is done
    // inline in this function below).
    function renderSeries() {

      // Since we annotate each column-underlay and column element with its
      // series index using the 'data-series-index' attribute) on enter() we
      // can rely on that data attribute instead of having to derive the series
      // index from the individual datum bound to the element.
      function getPrimaryColorOrNone() {
        var seriesIndex = this.getAttribute('data-series-index');
        var primaryColor = self.getPrimaryColorBySeriesIndex(
          seriesIndex
        );

        return (primaryColor !== null) ?
          primaryColor :
          'none';
      }

      dimensionGroupSvgs.
        selectAll('.column-underlay').
          attr(
            'x',
            function(d) {
              return d3GroupingXScale(d[0]);
            }
          ).
          attr('y', 0).
          attr(
            'width',
            d3GroupingXScale.rangeBand() - 1
          ).
          attr('height', height).
          attr('stroke', 'none').
          attr('fill', 'transparent').
          attr('data-default-fill', getPrimaryColorOrNone);

      dimensionGroupSvgs.
        selectAll('.column').
          attr(
            'x',
            function(d) {
              return d3GroupingXScale(d[0]);
            }
          ).
          attr(
            'y',
            function(d) {
              var yAttr;

              // If the value is zero or null we want it to be present at the
              // baseline for the rest of the bars (at the bottom of the chart
              // if the minimum value is 0 or more, at the top of the chart if
              // the maximum value is less than zero.
              if (d[1] === null || d[1] === 0) {

                if (minYValue > 0) {
                  yAttr = d3YScale(minYValue) - 0.0001;
                } else if (maxYValue < 0) {
                  yAttr = d3YScale(maxYValue) + 0.0001;
                } else {
                  yAttr = d3YScale(0) - 0.0001;
                }

              } else if (d[1] > 0) {

                if (minYValue > 0) {

                  yAttr = Math.min(
                    d3YScale(d[1]),
                    d3YScale(minYValue) - 1
                  );
                } else {

                  yAttr = Math.min(
                    d3YScale(d[1]),
                    d3YScale(0) - 1
                  );
                }

              } else if (d[1] < 0) {


                if (maxYValue <= 0) {

                  yAttr = Math.max(
                    d3YScale(maxYValue),
                    1
                  );

                } else {
                  yAttr = d3YScale(0);
                }

              }

              return yAttr;
            }
          ).
          attr(
            'width',
            d3GroupingXScale.rangeBand() - 1
          ).
          attr(
            'height',
            function(d) {
              var baselineValue;

              if (d[1] === null || d[1] === 0) {
                // We want the flyout for null or zero values to appear along
                // the x axis, rather than at the top of the chart.
                //
                // This means that we need to push the container element for
                // null values down to the x axis, rather than the default
                // behavior which places it at the top of the visualization
                // container. This is accomplished by the 'y' attribute, but
                // that does not have the expected behavior if the element is
                // not visible (or in this case, has a height of zero).
                //
                // Ultimately the way we force the column's container to
                // actually do the intended layout is to give the element a very
                // small height which should be more or less indiscernable,
                // which causes the layout to do the right thing.
                return 0.0001;
              } else if (d[1] > 0) {

                if (minYValue > 0) {
                  baselineValue = minYValue;
                } else {
                  baselineValue = 0;
                }
              } else if (d[1] < 0) {

                if (maxYValue < 0) {
                  baselineValue = maxYValue;
                } else {
                  baselineValue = 0;
                }
              }

              // See comment about setting the y attribute above for the
              // rationale behind ensuring a minimum height of one pixel for
              // non-null and non-zero values.
              return Math.max(
                1,
                Math.abs(d3YScale(d[1]) - d3YScale(baselineValue))
              );
            }
          ).
          attr('stroke', 'none').
          attr('fill', getPrimaryColorOrNone).
          attr('data-default-fill', getPrimaryColorOrNone);

      lastRenderedSeriesWidth = xAxisAndSeriesSvg.
        node().
          getBBox().
            width;

      xAxisAndSeriesSvg.
        attr(
          'transform',
          'translate(0,0)'
        );
    }

    function handleZoom() {

      lastRenderedZoomTranslate = clampValue(
        d3.event.translate[0],
        -1 * xAxisPanDistance,
        0
      );

      // We need to override d3's internal translation since it doesn't seem to
      // respect our snapping to the beginning and end of the rendered data.
      d3Zoom.translate([lastRenderedZoomTranslate, 0]);

      chartSvg.
        select('#' + d3ClipPathId).
        select('rect').
          attr(
            'transform',
            'translate(' + (-1 * lastRenderedZoomTranslate) + ',0)'
          );

      xAxisAndSeriesSvg.
        attr(
          'transform',
          'translate(' + lastRenderedZoomTranslate + ',0)'
        );

      if (self.isMobile()) {

        hideHighlight();
        hideFlyout();
      }
    }

    function restoreLastRenderedZoom() {
      var translateXRatio = (lastRenderedSeriesWidth !== 0) ?
        Math.abs(lastRenderedZoomTranslate / lastRenderedSeriesWidth) :
        0;
      var currentWidth = xAxisAndSeriesSvg.
        node().
          getBBox().
            width;

      lastRenderedZoomTranslate = clampValue(
        -1 * translateXRatio * currentWidth,
        -1 * xAxisPanDistance,
        0
      );

      d3Zoom.translate([lastRenderedZoomTranslate, 0]);

      chartSvg.
        select('#' + d3ClipPathId).
        select('rect').
          attr(
            'transform',
            'translate(' + -lastRenderedZoomTranslate + ',0)'
          );

      xAxisAndSeriesSvg.
        attr(
          'transform',
          'translate(' + lastRenderedZoomTranslate + ',0)'
        );
    }

    /**
     * 1. Prepare the data for rendering (unfortunately we need to do grouping
     *    on the client at the moment).
     */

    groupedDataToRender = dimensionValues.
      map(function(dimensionValue) {

        return [dimensionValue].concat([
          dataToRender.
            map(function(series, seriesIndex) {
              var matchingRows = series.
                rows.
                filter(
                  function(row) {
                    return (
                      dimensionValue === row[dimensionIndices[seriesIndex]]
                    );
                  }
                );

              return (matchingRows.length > 0) ?
                [
                  measureLabels[seriesIndex],
                  matchingRows[0][measureIndices[seriesIndex]]
                ] :
                [
                  measureLabels[seriesIndex],
                  null
                ];
            })
        ]);
    });

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      width = viewportWidth;
      height = viewportHeight - dimensionLabelsHeight;

      // We limit the total column count to 30 when not allowing panning so
      // that the the labels do not overlap each other.
      columnCount = (
        // The first term is the number of groups we are rendering.
        groupedDataToRender.length *
        // The second term finds the maximum number of columns per group.
        d3.max(
          groupedDataToRender,
          function(d) {
            return d[1].length;
          }
        )
      );

      if (columnCount >= MAX_COLUMN_COUNT_WITHOUT_PAN) {

        self.renderError(
          I18n.translate(
            'visualizations.column_chart.error_exceeded_max_column_count_without_pan'
          ).format(MAX_COLUMN_COUNT_WITHOUT_PAN)
        );
        return;
      }
    } else {

      // When we do allow panning we get a little more sophisticated; primarily
      // we will attempt to adjust the width we give to d3 to account for the
      // width of the labels, which will extend past the edge of the chart
      // since they are rotated by 45 degrees.
      //
      // Since we know the maximum number of items in a group and the total
      // number of groups we can estimate the total width of the chart (this
      // will necessarily be incorrect because we won't actually know the width
      // of the last label until we render it, at which time we will
      // re-measure. This estimate will be sufficient to get d3 to render the
      // columns at widths that are in line with our expectations, however.
      width = Math.max(
        viewportWidth,
        (
          // The first term is our target column width.
          columnWidth *
          // The second term finds the maximum number of columns per group.
          d3.max(
            groupedDataToRender,
            function(d) {
              return d[1].length;
            }
          ) *
          // The third term is how many groups we want to render in total
          groupedDataToRender.length
        )
      );
      height = viewportHeight - dimensionLabelsHeight;
    }

    /**
     * 2. Set up the x-scale and -axis.
     */

    // This scale is used for dimension categories.
    d3DimensionXScale = generateXScale(dimensionValues, width);
    // This scale is used for groupings of columns under a single dimension
    // category.
    d3GroupingXScale = generateXGroupScale(measureLabels, d3DimensionXScale);
    d3XAxis = generateXAxis(d3DimensionXScale);

    /**
     * 3. Set up the y-scale and -axis.
     */

    minYValue = getMinYValue(groupedDataToRender);
    maxYValue = getMaxYValue(groupedDataToRender);

    if (self.getYAxisScalingMode() === 'showZero') {

      // Normalize min and max values so that we always show 0 if the user has
      // specified that behavior in the Vif.
      minYValue = Math.min(minYValue, 0);
      maxYValue = Math.max(0, maxYValue);
    }

    d3YScale = generateYScale(minYValue, maxYValue, height);
    d3YAxis = generateYAxis(d3YScale);

    /**
     * 4. Clear out any existing chart.
     */

    d3.
      select($chartElement[0]).
        select('svg').
          remove();

    /**
     * 5. Render the chart.
     */

    // Create the top-level <svg> element first.
    chartSvg = d3.
      select($chartElement[0]).
        append('svg').
          attr(
            'width',
            (
              width +
              MARGINS.LEFT +
              MARGINS.RIGHT
            )
          ).
          attr(
            'height',
            (
              viewportHeight +
              MARGINS.TOP +
              MARGINS.BOTTOM
            )
          );

    // The viewport represents the area within the chart's container that can
    // be used to draw the x-axis, y-axis and chart marks.
    viewportSvg = chartSvg.
      append('g').
        attr('class', 'viewport').
        attr(
          'transform',
          (
            'translate(' +
            MARGINS.LEFT +
            ',' +
            MARGINS.TOP +
            ')'
          )
        );

    // The clip path is used as a mask. It is attached to another svg element,
    // at which time all children of that svg element that would be drawn
    // outside of the clip path's bounds will not be rendered. The clip path
    // is used in this implementation to hide the extent of the chart that lies
    // outside of the viewport when the chart is wider than the viewport.
    //
    // The overall effect is for the chart to appear to pan.
    chartSvg.
      append('clipPath').
        attr('id', d3ClipPathId).
          append('rect').
            attr('x', 0).
            attr('y', 0).
            attr('width', viewportWidth).
            attr('height', viewportHeight + MARGINS.TOP + MARGINS.BOTTOM);

    viewportSvg.
      append('g').
        attr('class', 'y axis');

    viewportSvg.
      append('g').
        attr('class', 'y grid');

    // This <rect> exists to capture mouse actions on the chart, but not
    // directly on the columns or labels, that should result in a pan behavior.
    // If we set stroke and fill to none, the mouse events don't seem to get
    // picked up, so we instead set opacity to 0.
    viewportSvg.
      append('rect').
        attr('class', 'dragger').
        attr('width', width).
        attr('height', viewportHeight).
        attr('opacity', 0);

    // The x-axis and series are groups since they all need to conform to the
    // same clip path for the appearance of panning to be upheld.
    xAxisAndSeriesSvg = viewportSvg.
      append('g').
        attr('class', 'x-axis-and-series').
        attr('clip-path', 'url(#' + d3ClipPathId + ')');

    xAxisAndSeriesSvg.
      append('g').
        attr('class', 'series');

    seriesSvg = xAxisAndSeriesSvg.
      select('.series');

    dimensionGroupSvgs = seriesSvg.
      selectAll('.dimension-group').
        data(groupedDataToRender).
          enter().
            append('g').
              attr('class', 'dimension-group').
              attr('data-group-category', function(d) {
                return (d[0] === null || typeof d[0] === 'undefined') ?
                  NO_VALUE_SENTINEL :
                  d[0];
              }).
              attr(
                'transform',
                function(d) {
                  return 'translate(' + d3DimensionXScale(d[0]) + ',0)';
                }
              );

    dimensionGroupSvgs.
      selectAll('rect.column-underlay').
        data(function(d) { return d[1]; }).
          enter().
            append('rect').
              attr('class', 'column-underlay').
              attr(
                'data-column-category',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return groupedDataToRender[rowIndex][0];
                }
              ).
              attr(
                'data-series-index',
                /* eslint-disable no-unused-vars */
                function(datum, seriesIndex, rowIndex) {
                /* eslint-enable no-unused-vars */
                  return seriesIndex;
                }
              ).
              attr(
                'data-row-index',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return rowIndex;
                }
              );

    dimensionGroupSvgs.
      selectAll('rect.column').
        data(function(d) { return d[1]; }).
          enter().
            append('rect').
              attr('class', 'column').
              attr(
                'data-column-category',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return groupedDataToRender[rowIndex][0];
                }
              ).
              attr(
                'data-series-index',
                /* eslint-disable no-unused-vars */
                function(datum, seriesIndex, rowIndex) {
                /* eslint-enable no-unused-vars */
                  return seriesIndex;
                }
              ).
              attr(
                'data-row-index',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return rowIndex;
                }
              );

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      // If we do not have to support panning then rendering is somewhat more
      // straightforward.
      renderXAxis();
      renderSeries();
      renderYAxis();
    } else {

      // Unfortunately, we need to render the x-axis and the series before we
      // can measure whether or not the chart will pan. Since showing the
      // panning notice also affects the height available to the chart, that
      // means that we need to render once to measure if the chart to pan and if
      // it does, show the panning notice and then re-render the x-axis and the
      // series at the new (smaller) height to accommodate the notice.
      //
      // Also note that we must render the x-axis before setting up the event
      // handlers for flyouts below, since it attempts to bind data to elements
      // that will not exist before the x-axis has been rendered.
      renderXAxis();
      renderSeries();

      // This is the actual rendered width (which accounts for the labels
      // extending beyond what d3 considers the right edge of the chart on
      // account of their being rotated 45 degrees.
      width = xAxisAndSeriesSvg.
        node().
          getBBox().
            width;

      xAxisPanDistance = width - viewportWidth;

      xAxisPanningEnabled = (xAxisPanDistance > 0) ? true : false;

      if (xAxisPanningEnabled) {

        self.showPanningNotice();

        viewportHeight = (
          $chartElement.height() -
          MARGINS.TOP -
          MARGINS.BOTTOM
        );
        height = viewportHeight - dimensionLabelsHeight;

        d3YScale = generateYScale(minYValue, maxYValue, height);
        d3YAxis = generateYAxis(d3YScale);

        renderXAxis();
        renderSeries();
      } else {
        self.hidePanningNotice();
      }

      // We only have to render the y-axis once, after we have decided whether
      // we will show or hide the panning notice.
      renderYAxis();
    }

    /**
     * 6. Set up event handlers for mouse interactions.
     */

    dimensionGroupSvgs.
      selectAll('.column-underlay').
        on(
          'mousemove',
          function() {
            var seriesIndex = this.getAttribute('data-series-index');
            var dimensionGroup = this.parentNode;
            var siblingColumn = d3.
              select(dimensionGroup).
                select(
                  '.column[data-series-index="{0}"]'.format(seriesIndex)
                )[0][0];
            var datum = d3.select(this.parentNode).datum()[1][seriesIndex];

            showColumnHighlight(siblingColumn);
            showColumnFlyout(siblingColumn, datum);
          }
        ).
        on(
          'mouseleave',
          function() {

            hideHighlight();
            hideFlyout();
          }
        );

    dimensionGroupSvgs.
      selectAll('.column').
        on(
          'mousemove',
          function() {
            var seriesIndex = this.getAttribute('data-series-index');
            var datum = d3.select(this.parentNode).datum()[1][seriesIndex];

            showColumnHighlight(this);
            showColumnFlyout(this, datum);
          }
        ).
        on(
          'mouseleave',
          function() {

            hideHighlight();
            hideFlyout();
          }
        );

    chartSvg.
      selectAll('.x.axis .tick text').
        on(
          'mousemove',
          function(d) {
            var groupCategory = (d[0] === null || typeof d[0] === 'undefined') ?
              NO_VALUE_SENTINEL :
              d[0];
            var dimensionGroup = xAxisAndSeriesSvg.
              select(
                '.dimension-group[data-group-category="{0}"]'.format(groupCategory)
              );

            showGroupHighlight(dimensionGroup);
            showGroupFlyout(dimensionGroup);
          }
        ).
        on(
          'mouseleave',
          function() {

            hideHighlight();
            hideFlyout();
          }
        );

    /**
     * 7. Conditionally set up the zoom behavior, which is actually used for
     *    panning the chart along the x-axis if panning is enabled.
     */

    if (xAxisPanningEnabled) {

      d3Zoom = d3.
        behavior.
          zoom().
            on('zoom', handleZoom);

      viewportSvg.
        attr('cursor', 'move').
        call(d3Zoom).
        // By default the zoom behavior seems to capture every conceivable
        // kind of zooming action; we actually just want it to zoom when
        // the user clicks and drags, so we need to immediately deregister
        // the event handlers for the other types.
        //
        // Note that although we listen for the zoom event on the zoom
        // behavior we must detach the zooming actions we do not want to
        // respond to from the element to which the zoom behavior is
        // attached.
        on('dblclick.zoom', null).
        on('wheel.zoom', null).
        on('mousewheel.zoom', null).
        on('MozMousePixelScroll.zoom', null);

      restoreLastRenderedZoom();

      chartSvg.
        selectAll('text').
          attr('cursor', null);
    } else {

      chartSvg.
        selectAll('text').
          attr('cursor', 'default');
    }
  }

  function conditionallyTruncateLabel(label) {
    label = label || I18n.translate('visualizations.common.no_value');

    return (label.length >= DIMENSION_LABEL_MAX_CHARACTERS) ?
      '{0}…'.format(
        label.substring(0, DIMENSION_LABEL_MAX_CHARACTERS - 1).trim()
      ) :
      label;
  }

  function generateXScale(domain, width) {

    return d3.
      scale.
        ordinal().
          domain(domain).
          // .rangeRoundBands(<interval>, <padding>, <outer padding>)
          //
          // From the documentation:
          //
          // ---
          //
          // Note that rounding necessarily introduces additional outer padding
          // which is, on average, proportional to the length of the domain.
          // For example, for a domain of size 50, an additional 25px of outer
          // padding on either side may be required. Modifying the range extent
          // to be closer to a multiple of the domain length may reduce the
          // additional padding.
          //
          // ---
          // The outer padding looks pretty funny for our use cases, so we
          // override it to be zero, which looks like what we expect.
          rangeRoundBands([0, width], 0.1, 0.05);
  }

  function generateXGroupScale(domain, xScale) {

    return d3.
      scale.
        ordinal().
          domain(domain).
          rangeRoundBands([0, xScale.rangeBand()]);
  }

  function generateXAxis(xScale) {

    return d3.
      svg.
        axis().
          scale(xScale).
            orient('bottom').
            tickFormat(
              function(d, i) {

                if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {
                  if (i < 5) {
                    return conditionallyTruncateLabel(d);
                  } else {
                    return '';
                  }
                } else {
                  return conditionallyTruncateLabel(d);
                }
              }
            ).
            outerTickSize(0);
  }

  function getMinYValue(groupedData) {

    return d3.
      min(
        groupedData.
          map(
            function(row) {

              return d3.min(
                row[1].
                  map(
                    function(d) {
                      // If we wanted to get the minimum x value instead of the
                      // minimum y value, we could access the item at d[0]
                      // instead of d[1].
                      return d[1];
                    }
                  )
              );
            }
          )
      );
  }

  function getMaxYValue(groupedData) {

    return d3.
      max(
        groupedData.
          map(
            function(row) {

              return d3.max(
                row[1].
                  map(
                    function(d) {
                      return d[1];
                    }
                  )
              );
            }
          )
      );
  }

  function generateYScale(minValue, maxValue, height) {

    return d3.
      scale.
        linear().
          domain([minValue, maxValue]).
          range([height, 0]);
  }

  function generateYAxis(yScale) {

    return d3.
      svg.
        axis().
          scale(yScale).
            orient('left').
            tickFormat(function(d) { return utils.formatNumber(d); });
  }

  function showGroupHighlight(groupElement) {

    groupElement.
      selectAll('.column').
        each(
          function() {
            var selection = d3.
              select(this);

            selection.
              attr(
                'fill',
                function() {
                  var seriesIndex = this.getAttribute('data-series-index');
                  var highlightColor = self.getHighlightColorBySeriesIndex(
                    seriesIndex
                  );

                  return (highlightColor !== null) ?
                    highlightColor :
                    selection.attr('fill');
                }
              );
          }
        );
  }

  function showColumnHighlight(columnElement) {

    var selection = d3.
      select(columnElement);

      selection.
        attr(
          'fill',
          function() {
            var seriesIndex = this.getAttribute('data-series-index');
            var highlightColor = self.getHighlightColorBySeriesIndex(
              seriesIndex
            );

            return (highlightColor !== null) ?
              highlightColor :
              selection.attr('fill');
          }
        );
  }

  function hideHighlight() {

    d3.
      selectAll('.column').
        each(
          function() {
            var selection = d3.
              select(this);

            selection.
              attr('fill', selection.attr('data-default-fill'));
          }
        );
  }

  function showGroupFlyout(groupElement) {
    var title = groupElement.attr('data-group-category');
    var $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title === NO_VALUE_SENTINEL) ?
              I18n.translate('visualizations.common.no_value') :
              title
          )
        );
    var labelValuePairs = groupElement.data()[0][1];
    var $labelValueRows;
    var $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    var flyoutElement;
    var payload = null;

    $labelValueRows = labelValuePairs.
      map(
        function(datum) {
          var label = datum[0];
          var value = datum[1];
          var seriesIndex = self.getSeriesIndexByLabel(label);
          var valueString;
          var $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
            text(label).
            css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
          var $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});

          if (value === null) {
            valueString = I18n.translate('visualizations.common.no_value');
          } else {
            valueString = '{0} {1}'.
              format(
                utils.formatNumber(value),
                (value === 1) ?
                  self.getUnitOneBySeriesIndex(seriesIndex) :
                  self.getUnitOtherBySeriesIndex(seriesIndex)
              );
          }

          $valueCell.
            text(valueString);

          return $('<tr>', {'class': 'socrata-flyout-row'}).
            append([
              $labelCell,
              $valueCell
            ]);
        }
      );

    $table.
      append($labelValueRows);

    // If there is only one column in the group then we can position the flyout
    // over the column itself, not the column group.
    if (groupElement.selectAll('.column')[0].length === 1) {
      flyoutElement = groupElement[0][0].childNodes[1];
    // If there is more than one column, however, we don't really know where to
    // position the flyout so we need to put it at the top of the group.
    } else {
      flyoutElement = groupElement[0][0];
    }

    payload = {
      element: flyoutElement,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT',
      payload
    );
  }

  function showColumnFlyout(columnElement, datum) {
    var title = (
      columnElement.getAttribute('data-column-category') ||
      I18n.translate('visualizations.common.no_value')
    );
    var label = datum[0];
    var value = datum[1];
    var seriesIndex = self.getSeriesIndexByLabel(label);
    var valueString;
    var payload = null;
    var $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title) ? title : ''
          )
        );
    var $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
    var $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
    var $valueRow = $('<tr>', {'class': 'socrata-flyout-row'});
    var $table = $('<table>', {'class': 'socrata-flyout-table'});

    if (value === null) {
      valueString = I18n.translate('visualizations.common.no_value');
    } else {
      valueString = '{0} {1}'.
        format(
          utils.formatNumber(value),
          (value === 1) ?
            self.getUnitOneBySeriesIndex(seriesIndex) :
            self.getUnitOtherBySeriesIndex(seriesIndex)
        );
    }

    $valueCell.
      text(valueString);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $title,
      $valueRow
    ]);

    payload = {
      element: columnElement,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT',
      null
    );
  }
}

module.exports = SvgColumnChart;
