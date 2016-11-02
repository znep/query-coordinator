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
const DIMENSION_LABELS_FIXED_HEIGHT = 88;
const DIMENSION_LABELS_ROTATION_ANGLE = 82.5;
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_MAX_CHARACTERS = 8;
const MEASURE_LABELS_FONT_SIZE = 14;
const MEASURE_LABELS_FONT_COLOR = '#5e5e5e';
const DEFAULT_DESKTOP_COLUMN_WIDTH = 14;
const DEFAULT_MOBILE_COLUMN_WIDTH = 50;
const MAX_COLUMN_COUNT_WITHOUT_PAN = 50;
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
  const self = this;
  let $chartElement;
  let dataToRender;
  let d3DimensionXScale;
  let d3GroupingXScale;
  let d3YScale;
  let lastRenderedSeriesWidth = 0;
  let lastRenderedZoomTranslate = 0;

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
      if (!_.isEqual(this.getVif().series, newVif.series)) {
        lastRenderedZoomTranslate = 0;
      }

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
        find('.socrata-visualization-container').
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
        find('.socrata-visualization-container').
          append($chartElement);
  }

  function renderData() {
    const columnWidth = (self.isMobile()) ?
      DEFAULT_MOBILE_COLUMN_WIDTH :
      DEFAULT_DESKTOP_COLUMN_WIDTH;
    const viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    let width;
    let viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    let height;
    const d3ClipPathId = 'column-chart-clip-path-' + _.uniqueId();
    const dimensionIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('dimension');
        }
      );
    const dimensionValues = _.union(
      _.flatten(
        dataToRender.
          map(
            function(series) {
              const dimensionIndex = series.columns.indexOf('dimension');

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
    const measureIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('measure');
        }
      );
    const measureLabels = self.
      getVif().
        series.
          map(
            function(series) {
              return series.label;
            }
          );
    let groupedDataToRender;
    let columnCount;
    let minYValue;
    let maxYValue;
    let d3XAxis;
    let d3YAxis;
    let d3Zoom;
    let chartSvg;
    let viewportSvg;
    let xAxisAndSeriesSvg;
    let seriesSvg;
    let dimensionGroupSvgs;
    let xAxisPanDistance;
    let xAxisPanningEnabled;
    let xAxisBound = false;
    let yAxisBound = false;

    /**
     * Functions defined inside the scope of renderData() are stateful enough
     * to benefit from sharing variables within a single render cycle.
     */

    // See comment in renderXAxis() for an explanation as to why this is
    // separate.
    function bindXAxisOnce() {

      if (!xAxisBound) {

        let xAxisFormatter;

        if (self.getShowDimensionLabels()) {
          xAxisFormatter = d3XAxis;
        } else {

          xAxisFormatter = d3XAxis.
            tickFormat('').
            tickSize(0);
        }

        xAxisAndSeriesSvg.
          append('g').
            attr('class', 'x axis').
              call(xAxisFormatter);

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
      const dimensionLabelTranslation =
        `translate(${columnWidth},${columnWidth * .75})`;
      const dimensionLabelRotation =
        `rotate(${DIMENSION_LABELS_ROTATION_ANGLE})`;

      let xAxisSvg;
      let xBaselineSvg;
      let baselineValue;

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
        attr('font-size', DIMENSION_LABELS_FONT_SIZE + 'px').
        attr('fill', DIMENSION_LABELS_FONT_COLOR).
        attr('stroke', 'none').
        attr('style', 'text-anchor: start').
        attr(
          'transform',
          `${dimensionLabelTranslation}, ${dimensionLabelRotation}`
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
      const yAxisSvg = chartSvg.
        select('.y.axis');
      const yGridSvg = chartSvg.
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
        attr('font-size', MEASURE_LABELS_FONT_SIZE + 'px').
        attr('fill', MEASURE_LABELS_FONT_COLOR).
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
        const seriesIndex = this.getAttribute('data-series-index');
        const primaryColor = self.getPrimaryColorBySeriesIndex(
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
              let yAttr;

              const value = maxYValue ? _.min([maxYValue, d[1]]) : d[1];

              // If the value is zero or null we want it to be present at the
              // baseline for the rest of the bars (at the bottom of the chart
              // if the minimum value is 0 or more, at the top of the chart if
              // the maximum value is less than zero.
              if (value === null || value === 0) {

                if (minYValue > 0) {
                  yAttr = d3YScale(minYValue) - 0.0001;
                } else if (maxYValue < 0) {
                  yAttr = d3YScale(maxYValue) + 0.0001;
                } else {
                  yAttr = d3YScale(0) - 0.0001;
                }

              } else if (value > 0) {

                if (minYValue > 0) {

                  yAttr = Math.min(
                    d3YScale(value),
                    d3YScale(minYValue) - 1
                  );
                } else {

                  yAttr = Math.min(
                    d3YScale(value),
                    d3YScale(0) - 1
                  );
                }

              } else if (value < 0) {

                if (value < minYValue) {
                  yAttr = d3YScale(minYValue) + 1;
                } else if (maxYValue <= 0) {
                  yAttr = _.max([d3YScale(maxYValue), 1]);
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
          attr('height', (d) => {
            if (d[1] === 0 || !_.isFinite(d[1])) {
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
              // small height which should be more or less indiscernible,
              // which causes the layout to do the right thing.
              return 0.0001;
            } else {
              // Value of column clamped between min and max possible values.
              const value = _.clamp(d[1], minYValue, maxYValue);

              // Calculating baseline depending on column value
              // Value;
              //   > 0 : Baseline should be 0 or minYValue depending on which is lower.
              //   < 0 : Baseline should be 0 or maxYValue depending on which is higher.
              const baselineValue = value > 0 ? _.max([minYValue, 0]) : _.min([maxYValue, 0]);

              // Height / width calculated based on the difference between value and baseline
              const length = Math.abs(d3YScale(value) - d3YScale(baselineValue));

              // See comment about setting the y attribute above for the
              // rationale behind ensuring a minimum height of one pixel for
              // non-null and non-zero values.
              return _.max([1, length]);
            }
          }).
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
      const translateXRatio = (lastRenderedSeriesWidth !== 0) ?
        Math.abs(lastRenderedZoomTranslate / lastRenderedSeriesWidth) :
        0;
      const currentWidth = xAxisAndSeriesSvg.
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
              const matchingRows = series.
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

    // Compute width based on the x-axis scaling mode.
    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      width = viewportWidth;

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
    }

    // Compute height based on the presence or absence of x-axis data labels.
    if (self.getShowDimensionLabels()) {
      height = viewportHeight - DIMENSION_LABELS_FIXED_HEIGHT;
    } else {
      // In this case we want to mirror the top margin on the bottom so
      // that the chart is visually centered (column charts have no bottom
      // margin by default).
      height = viewportHeight - MARGINS.TOP;
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

    try {
      const dataMinYValue = getMinYValue(groupedDataToRender);
      const dataMaxYValue = getMaxYValue(groupedDataToRender);

      const limitMin = self.getMeasureAxisMinValue();
      const limitMax = self.getMeasureAxisMaxValue();

      if (limitMin && limitMax && limitMin >= limitMax) {
        self.renderError(
          I18n.translate(
            'visualizations.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      if (self.getYAxisScalingMode() === 'showZero' && !limitMin) {
        minYValue = _.min([dataMinYValue, 0]);
      } else if (limitMin) {
        minYValue = limitMin;
      } else {
        minYValue = dataMinYValue;
      }

      if (self.getYAxisScalingMode() === 'showZero' && !limitMax) {
        maxYValue = _.max([dataMaxYValue, 0]);
      } else if (limitMax) {
        maxYValue = limitMax;
      } else {
        maxYValue = dataMaxYValue;
      }
    } catch (error) {
      self.renderError(error.message);
      return;
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

        if (self.getShowDimensionLabels()) {
          // Note that we need to recompute height here since
          // $chartElement.height() may have changed when we showed the panning
          // notice.
          height = viewportHeight - DIMENSION_LABELS_FIXED_HEIGHT;
        } else {
          height = viewportHeight - MARGINS.TOP;
        }

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
            const seriesIndex = this.getAttribute('data-series-index');
            const dimensionGroup = this.parentNode;
            const siblingColumn = d3.
              select(dimensionGroup).
                select(
                  '.column[data-series-index="{0}"]'.format(seriesIndex)
                )[0][0];
            const datum = d3.select(this.parentNode).datum()[1][seriesIndex];

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
            const seriesIndex = this.getAttribute('data-series-index');
            const datum = d3.select(this.parentNode).datum()[1][seriesIndex];

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
            const groupCategory = (d[0] === null || typeof d[0] === 'undefined') ?
              NO_VALUE_SENTINEL :
              d[0];
            const dimensionGroup = xAxisAndSeriesSvg.
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

    return (label.length >= DIMENSION_LABELS_MAX_CHARACTERS) ?
      '{0}…'.format(
        label.substring(0, DIMENSION_LABELS_MAX_CHARACTERS - 1).trim()
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
            const selection = d3.
              select(this);

            selection.
              attr(
                'fill',
                function() {
                  const seriesIndex = this.getAttribute('data-series-index');
                  const highlightColor = self.getHighlightColorBySeriesIndex(
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

    const selection = d3.
      select(columnElement);

      selection.
        attr(
          'fill',
          function() {
            const seriesIndex = this.getAttribute('data-series-index');
            const highlightColor = self.getHighlightColorBySeriesIndex(
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
            const selection = d3.
              select(this);

            selection.
              attr('fill', selection.attr('data-default-fill'));
          }
        );
  }

  function showGroupFlyout(groupElement) {
    const title = groupElement.attr('data-group-category');
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title === NO_VALUE_SENTINEL) ?
              I18n.translate('visualizations.common.no_value') :
              title
          )
        );
    const labelValuePairs = groupElement.data()[0][1];
    let $labelValueRows;
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    let flyoutElement;
    let payload = null;

    $labelValueRows = labelValuePairs.
      map(
        function(datum) {
          const label = datum[0];
          const value = datum[1];
          const seriesIndex = self.getSeriesIndexByLabel(label);
          let valueString;
          const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
            text(label).
            css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
          const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});

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
    const title = (
      columnElement.getAttribute('data-column-category') ||
      I18n.translate('visualizations.common.no_value')
    );
    const label = datum[0];
    const value = datum[1];
    const seriesIndex = self.getSeriesIndexByLabel(label);
    let valueString;
    let payload = null;
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title) ? title : ''
          )
        );
    const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
    const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
    const $valueRow = $('<tr>', {'class': 'socrata-flyout-row'});
    const $table = $('<table>', {'class': 'socrata-flyout-table'});

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
