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
  TOP: 26,
  RIGHT: 16,
  BOTTOM: 0,
  LEFT: 16
};
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABELS_FIXED_WIDTH = 112;
const DIMENSION_LABELS_ROTATION_ANGLE = 0;
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_MAX_CHARACTERS = 12;
const MEASURE_LABELS_FONT_SIZE = 14;
const MEASURE_LABELS_FONT_COLOR = '#5e5e5e';
const MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH = 50;
const MEASURE_VALUE_TEXT_INSIDE_BAR_COLOR = '#f8f8f8';
const MEASURE_VALUE_TEXT_OUTSIDE_BAR_COLOR = '#5e5e5e';
const MEASURE_VALUE_TEXT_X_PADDING = 3;
const MEASURE_VALUE_TEXT_Y_PADDING = 3;
const DEFAULT_DESKTOP_BAR_HEIGHT = 14;
const DEFAULT_MOBILE_BAR_HEIGHT = 50;
/* eslint-disable no-unused-vars */
const MAX_BAR_COUNT_WITHOUT_PAN = 50;
/* eslint-enable no-unused-vars */
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const NO_VALUE_SENTINEL = '__NO_VALUE__';

function SvgBarChart($element, vif) {
  const self = this;
  let $chartElement;
  let dataToRender;
  let d3DimensionYScale;
  let d3GroupingYScale;
  let d3XScale;
  let lastRenderedSeriesHeight = 0;
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

    d3.select(self.$element[0]).select('svg').
      remove();

    self.$element.find('.socrata-visualization-container').
      remove();
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    $chartElement = $(
      '<div>',
      {
        'class': 'bar-chart'
      }
    );

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  function renderData() {
    const barHeight = (self.isMobile()) ?
      DEFAULT_MOBILE_BAR_HEIGHT :
      DEFAULT_DESKTOP_BAR_HEIGHT;
    const viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    const d3ClipPathId = `bar-chart-clip-path-${_.uniqueId()}`;
    const dimensionIndices = dataToRender.map(
      (series) => series.columns.indexOf('dimension')
    );
    const dimensionValues = _.union(
      _.flatten(
        dataToRender.map((series) => {
          const dimensionIndex = series.columns.indexOf('dimension');

          return series.rows.map((row) => row[dimensionIndex]);
        })
      )
    );
    const measureIndices = dataToRender.map(
      (series) => series.columns.indexOf('measure')
    );
    const measureLabels = self.getVif().series.map((series) => series.label);

    let viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    let width;
    let height;
    let groupedDataToRender;
    let maxBarsPerGroup;
    let numberOfGroups;
    let minXValue;
    let maxXValue;
    let d3YAxis;
    let d3XAxis;
    let d3Zoom;
    let chartSvg;
    let viewportSvg;
    let clipPathSvg;
    let yAxisAndSeriesSvg;
    let seriesSvg;
    let dimensionGroupSvgs;
    let barUnderlaySvgs;
    let barSvgs;
    let barTextSvgs;
    let xAxisBound = false;
    let yAxisBound = false;
    let yAxisPanDistance;
    let yAxisPanningEnabled;

    /**
     * Functions defined inside the scope of renderData() are stateful enough
     * to benefit from sharing variables within a single render cycle.
     */

    // See comment in renderXAxis() for an explanation as to why this is
    // separate.
    function bindXAxisOnce() {

      if (!xAxisBound) {

        chartSvg.select('.x.axis').
          call(d3XAxis);

        chartSvg.select('.x.grid').
          call(
            d3XAxis.
              tickSize(viewportHeight).
              tickFormat('')
          );

        xAxisBound = true;
      }
    }

    function renderXAxis() {
      const xAxisSvg = chartSvg.select('.x.axis');
      const xGridSvg = chartSvg.select('.x.grid');

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderXAxis() as idempotent.
      bindXAxisOnce();

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
        attr('font-size', MEASURE_LABELS_FONT_SIZE + 'px').
        attr('fill', MEASURE_LABELS_FONT_COLOR).
        attr('stroke', 'none');

      xGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      xGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    function bindYAxisOnce() {

      if (!yAxisBound) {

        let yAxisFormatter;

        if (self.getShowDimensionLabels()) {
          yAxisFormatter = d3YAxis;
        } else {

          yAxisFormatter = d3YAxis.
            tickFormat('').
            tickSize(0);
        }

        yAxisAndSeriesSvg.append('g').
          attr('class', 'y axis').
          call(yAxisFormatter);

        yAxisAndSeriesSvg.append('g').
          attr('class', 'y axis baseline').
          call(
            d3YAxis.
              tickFormat('').
              tickSize(0)
          );

        // Bind the chart data to the y-axis tick labels so that when the user
        // hovers over them we have enough information to distinctly identify
        // the bar which should be highlighted and show the flyout.
        chartSvg.selectAll('.y.axis .tick text').
          data(groupedDataToRender);

        yAxisBound = true;
      }
    }

    function renderYAxis() {
      const yAxisSvg = viewportSvg.select('.y.axis');
      const yBaselineSvg = viewportSvg.select('.y.axis.baseline');

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
        attr('font-size', `${DIMENSION_LABELS_FONT_SIZE}px`).
        attr('fill', DIMENSION_LABELS_FONT_COLOR).
        attr('stroke', 'none').
        attr('style', 'text-anchor: end').
        attr('transform', `rotate(${DIMENSION_LABELS_ROTATION_ANGLE})`).
        attr(
          'data-row-index',
          (label, rowIndex) => rowIndex
        );

      let baselineValue = 0;

      if (minXValue > 0) {
        baselineValue = minXValue;
      } else if (maxXValue < 0) {
        baselineValue = maxXValue;
      }

      yBaselineSvg.
        attr('transform', `translate(${d3XScale(baselineValue)},0)`);

      yBaselineSvg.selectAll('line, path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // Note that renderXAxis(), renderYAxis() and renderSeries() all update the
    // elements that have been created by binding the data (which is done
    // inline in this function below).
    function renderSeries() {

      // Since we annotate each bar-underlay and bar element with its series
      // index using the 'data-series-index' attribute) on enter() we can rely
      // on that data attribute instead of having to derive the series index
      // from the individual datum bound to the element.
      function getPrimaryColorOrNone() {
        const seriesIndex = this.getAttribute('data-series-index');
        const primaryColor = self.getPrimaryColorBySeriesIndex(seriesIndex);

        return (primaryColor !== null) ?
          primaryColor :
          'none';
      }

      dimensionGroupSvgs.selectAll('rect.bar-underlay').
        attr('y', (d) => d3GroupingYScale(d[0])).
        attr('x', 0).
        attr('height', d3GroupingYScale.rangeBand() - 1).
        attr('width', width).
        attr('stroke', 'none').
        attr('fill', 'transparent').
        attr('data-default-fill', getPrimaryColorOrNone);

      dimensionGroupSvgs.selectAll('rect.bar').
        attr(
          'x',
          (d) => {
            const value = _.clamp(
              d[1],
              (minXValue) ? minXValue : d[1],
              (maxXValue) ? maxXValue : d[1]
            );

            let xAttr;

            // If the value is zero or null we want it to be present at the
            // baseline for the rest of the bars (on the left of the chart if
            // the minimum value is 0 or more, on the right of the chart if the
            // maximum value is less than zero.
            if (value === null || value === 0) {

              if (minXValue > 0) {
                xAttr = d3XScale(minXValue) - 0.0001;
              } else if (maxXValue < 0) {
                xAttr = d3XScale(maxXValue) + 0.0001;
              } else {
                xAttr = d3XScale(0) - 0.0001;
              }
            } else if (value > 0) {

              if (minXValue > 0) {

                if (value < minXValue) {
                  xAttr = d3XScale(minXValue) + 1;
                } else {
                  xAttr = Math.min(
                    d3XScale(value),
                    d3XScale(minXValue) + 1
                  );
                }

              } else {

                xAttr = Math.min(
                  d3XScale(value),
                  d3XScale(0) + 1
                );
              }
            } else if (value < 0) {

              if (value < minXValue) {
                xAttr = d3XScale(minXValue) - 1;
              } else if (maxXValue <= 0) {
                xAttr = _.max([d3XScale(value), 1]);
              } else {
                xAttr = d3XScale(value);
              }

            }

            return xAttr;
          }
        ).
        attr('y', (d) => d3GroupingYScale(d[0])).
        attr('width', (d) => {

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
            const value = _.clamp(d[1], minXValue, maxXValue);

            // Calculating baseline depending on column value
            // Value;
            //   > 0 : Baseline should be 0 or minXValue depending on which is lower.
            //   < 0 : Baseline should be 0 or maxXValue depending on which is higher.
            const baselineValue = (value > 0) ? _.max([minXValue, 0]) : _.min([maxXValue, 0]);

            // Height / width calculated based on the difference between value and baseline
            const length = Math.abs(d3XScale(value) - d3XScale(baselineValue));

            // See comment about setting the y attribute above for the
            // rationale behind ensuring a minimum height of one pixel for
            // non-null and non-zero values.
            return _.max([2, length]);
          }
        }).
        attr('height', d3GroupingYScale.rangeBand() - 1).
        attr('stroke', 'none').
        attr('fill', getPrimaryColorOrNone).
        attr('data-default-fill', getPrimaryColorOrNone);

      if (self.getShowValueLabels()) {

        dimensionGroupSvgs.selectAll('text').
          attr(
            'x',
            (d) => {
              const value = _.clamp(
                d[1],
                (minXValue) ? minXValue : d[1],
                (maxXValue) ? maxXValue : d[1]
              );
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let xAttr;

              if (value >= 0) {

                // If the value is positive and the bar is wide enough to render
                // the text label inside of itself, then position the text label
                // just inside the right edge of the bar by subtracting the
                // padding amount from what d3 has determined is the
                // x-coordinate of the value.
                if (barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH) {
                  xAttr = scaledValue - MEASURE_VALUE_TEXT_X_PADDING;
                // Otherwise, position the text label just outside the right
                // edge of the bar by adding the padding amount to what d3 has
                // determined is the x-coordinate of the value.
                } else {
                  xAttr = scaledValue + MEASURE_VALUE_TEXT_X_PADDING;
                }
              } else {

                // If the value is negative and the bar is wide enough to render
                // the text label inside of itself, then position the text label
                // just inside the left edge of the bar by adding the padding
                // amount to what d3 has determined is the x-coordinate of the
                // value.
                if (barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH) {
                  xAttr = scaledValue + MEASURE_VALUE_TEXT_X_PADDING;
                // Otherwise, position the text label just outside the left edge
                // of the bar by subtracting the padding amount from what d3 has
                // determined is the x-coordinate of the value.
                } else {
                  xAttr = scaledValue - MEASURE_VALUE_TEXT_X_PADDING;
                }
              }

              return xAttr;
            }
          ).
          attr(
            'y',
            (d) => {

              // We want to position the text label roughly in the center of the
              // bar, so we determine the offset of the top of the bar in a
              // group from the top of the scale using d3GroupingYScale and then
              // add the scale's rangeBand (the number of pixels assigned to
              // each series in the group) by two, which will give us the rough
              // midpoint. Because of the way strokes are used and a few other
              // peculiarities, we have eyeballed an additional padding value
              // to add to the result of the above calculation which causes the
              // labels to actually appear vertically-centered in a bar.
              return d3GroupingYScale(d[0]) +
                (d3GroupingYScale.rangeBand() / 2) +
                MEASURE_VALUE_TEXT_Y_PADDING;
            }
          ).
          attr('font-family', FONT_STACK).
          attr('font-size', (DIMENSION_LABELS_FONT_SIZE - 4) + 'px').
          attr(
            'fill',
            (d) => {
              const value = d[1];
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let fillAttr;

              // If the bar is wide enough to accommodate the text label inside
              // of itself, then make the text label the 'inside' color
              // (off-white).
              if (barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH) {
                fillAttr = MEASURE_VALUE_TEXT_INSIDE_BAR_COLOR;
              // Otherwise, make the text label the 'outside' color (dark grey).
              } else {
                fillAttr = MEASURE_VALUE_TEXT_OUTSIDE_BAR_COLOR;
              }

              return fillAttr;
            }
          ).
          attr('stroke', 'none').
          attr(
            'style',
            (d) => {
              const value = d[1];
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let styleAttr;

              if (value >= 0) {

                // If this is a positive value, text inside the bar should be
                // anchored on the right ('text-anchor: end') so that it ends at
                // the right edge of the bar and continues to the left toward
                // zero.
                if (barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH) {
                  styleAttr = 'text-anchor:end';
                // Meanwhile, text outside the bar should be anchored on the
                // left ('text-anchor: start') so that it starts at the right
                // edge of the bar and continues to the right away from zero.
                } else {
                  styleAttr = 'text-anchor:start';
                }

              } else {

                // If this is a negative value, text inside the bar should be
                // anchored on the left ('text-anchor: start') so that it starts
                // at the left edge of the bar and continues to the right toward
                // zero.
                if (barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH) {
                  styleAttr = 'text-anchor:start';
                // Meanwhile, text outside the bar should be anchored on the
                // right ('text-anchor: end') so that it ends at the left edge
                // of the bar and extends left away from zero.
                } else {
                  styleAttr = 'text-anchor:end';
                }
              }

              return styleAttr;
            }
          ).
          text((d) => (_.isNumber(d[1])) ? utils.formatNumber(d[1]) : '');
      }

      lastRenderedSeriesHeight = yAxisAndSeriesSvg.node().getBBox().height;
    }

    function handleZoom() {

      lastRenderedZoomTranslate = _.clamp(
        d3.event.translate[1],
        -1 * yAxisPanDistance,
        0
      );

      // We need to override d3's internal translation since it doesn't seem to
      // respect our snapping to the beginning and end of the rendered data.
      d3Zoom.translate([0, lastRenderedZoomTranslate]);

      chartSvg.select(`#${d3ClipPathId}`).select('rect').
        attr(
          'transform',
          () => {
            const translateX = -DIMENSION_LABELS_FIXED_WIDTH;
            const translateY = -lastRenderedZoomTranslate;

            return (self.getShowDimensionLabels()) ?
              `translate(${translateX},${translateY})` :
              `translate(0,${translateY})`;
          }
        );

      yAxisAndSeriesSvg.
        attr(
          'transform',
          `translate(0,${lastRenderedZoomTranslate})`
        );

      hideHighlight();
      hideFlyout();
    }

    function restoreLastRenderedZoom() {
      const translateYRatio = (lastRenderedSeriesHeight !== 0) ?
        Math.abs(lastRenderedZoomTranslate / lastRenderedSeriesHeight) :
        0;
      const currentHeight = yAxisAndSeriesSvg.node().getBBox().height;

      lastRenderedZoomTranslate = _.clamp(
        -1 * translateYRatio * currentHeight,
        -1 * yAxisPanDistance,
        0
      );

      d3Zoom.translate([0, lastRenderedZoomTranslate]);

      chartSvg.select('#' + d3ClipPathId).select('rect').
        attr(
          'transform',
          () => {
            const translateX = -DIMENSION_LABELS_FIXED_WIDTH;
            const translateY = -lastRenderedZoomTranslate;

              return (self.getShowDimensionLabels()) ?
                `translate(${translateX},${translateY})` :
                `translate(0,${translateY})`;
          }
        );

      yAxisAndSeriesSvg.
        attr(
          'transform',
          `translate(0,${lastRenderedZoomTranslate})`
        );
    }

    /**
     * 1. Prepare the data for rendering (unfortunately we need to do grouping
     *    on the client at the moment).
     */

    groupedDataToRender = dimensionValues.map((dimensionValue) => {

      return [dimensionValue].concat([
        dataToRender.map((series, seriesIndex) => {
          const matchingRows = series.rows.filter((row) => {
            return dimensionValue === row[dimensionIndices[seriesIndex]];
          });

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

    maxBarsPerGroup = d3.max(
      groupedDataToRender,
      (d) => d[1].length
    );
    numberOfGroups = groupedDataToRender.length;

    // TODO: Figure out how we want to handle scaling modes.
    // // Compute height based on the x-axis scaling mode.
    // if (self.getYAxisScalingMode() === 'fit') {

    //   const barCount = numberOfGroups * maxBarsPerGroup;

    //   // We limit the total bar count to a constant defined at the top of
    //   // this file when not allowing panning so that the the labels do not
    //   // overlap each other.
    //   if (barCount >= MAX_BAR_COUNT_WITHOUT_PAN) {

    //     self.renderError(
    //       I18n.translate(
    //         'visualizations.bar_chart.' +
    //         'error_exceeded_max_bar_count_without_pan'
    //       ).format(MAX_BAR_COUNT_WITHOUT_PAN)
    //     );
    //     return;
    //   }

    //   height = viewportHeight;
    // } else {

      // When we do allow panning we get a little more sophisticated; primarily
      // we will attempt to adjust the height we give to d3 to account for the
      // height of the labels, which will extend past the edge of the chart
      // since they are rotated by 45 degrees.
      //
      // Since we know the maximum number of items in a group and the total
      // number of groups we can estimate the total height of the chart (this
      // will necessarily be incorrect because we won't actually know the height
      // of the last label until we render it, at which time we will
      // re-measure. This estimate will be sufficient to get d3 to render the
      // bars at widths that are in line with our expectations, however.
      height = Math.max(
        viewportHeight,
        barHeight * maxBarsPerGroup * numberOfGroups
      );
    // See TODO above.
    // }

    // Compute width based on the presence or absence of y-axis data labels.
    if (self.getShowDimensionLabels()) {
      width = viewportWidth - DIMENSION_LABELS_FIXED_WIDTH;
    } else {

      // In this case we want to mirror the right margin on the bottom so
      // that the chart is visually centered (bar charts have no bottom
      // margin by default).
      width = viewportWidth;
    }

    /**
     * 2. Set up the x-scale and -axis.
     */
    const dataMinXValue = getMinXValue(groupedDataToRender);
    const dataMaxXValue = getMaxXValue(groupedDataToRender);

    try {
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

      minXValue = limitMin || _.min([dataMinXValue, 0]);
      maxXValue = limitMax || _.max([dataMaxXValue, 0]);
    } catch (error) {
      self.renderError(error.message);
      return;
    }

    // TODO: Figure out how we want to handle scaling modes.
    // if (self.getXAxisScalingModeBySeriesIndex(0) === 'showZero') {

      // Normalize min and max values so that we always show 0 if the user
      // has specified that behavior in the Vif.
      //if (_.isNull(limitMin) && _.isNull(limitMax)) {
      //  minXValue = Math.min(minXValue, 0);
      //  maxXValue = Math.max(0, maxXValue);
      //}

    // See TODO above.
    // }

    d3XScale = generateXScale(minXValue, maxXValue, width);
    d3XAxis = generateXAxis(d3XScale);

    /**
     * 3. Set up the y-scale and -axis.
     */

    // This scale is used for dimension categories.
    d3DimensionYScale = generateYScale(dimensionValues, height);
    // This scale is used for groupings of bars under a single dimension
    // category.
    d3GroupingYScale = generateYGroupScale(measureLabels, d3DimensionYScale);
    d3YAxis = generateYAxis(d3DimensionYScale);

    /**
     * 4. Clear out any existing chart.
     */

    d3.select($chartElement[0]).select('svg').
      remove();

    /**
     * 5. Render the chart.
     */

    // Create the top-level <svg> element first.
    chartSvg = d3.select($chartElement[0]).append('svg').
      attr('width', viewportWidth + MARGINS.RIGHT + MARGINS.LEFT).
      attr('height', height + MARGINS.TOP + MARGINS.BOTTOM);

    // The viewport represents the area within the chart's container that can
    // be used to draw the x-axis, y-axis and chart marks.
    const viewportXTranslation = (self.getShowDimensionLabels()) ?
      DIMENSION_LABELS_FIXED_WIDTH + MARGINS.LEFT :
      MARGINS.LEFT;

    viewportSvg = chartSvg.append('g').
      attr('class', 'viewport').
      attr(
        'transform',
        (
          'translate(' +
          viewportXTranslation +
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
    clipPathSvg = chartSvg.append('clipPath').
      attr('id', d3ClipPathId);

    clipPathSvg.append('rect').
      attr('x', 0).
      attr('y', 0).
      attr(
        'width',
        () => {
          const defaultWidth = viewportWidth + MARGINS.RIGHT + MARGINS.LEFT;

          return (self.getShowDimensionLabels()) ?
            defaultWidth + DIMENSION_LABELS_FIXED_WIDTH :
            defaultWidth;
        }
      ).
      attr('height', viewportHeight + MARGINS.TOP + MARGINS.BOTTOM).
      attr(
        'transform',
        () => {

          return (self.getShowDimensionLabels()) ?
            `translate(${-DIMENSION_LABELS_FIXED_WIDTH},0)` :
            '';
        }
      );

    viewportSvg.append('g').
      attr('class', 'x axis');

    viewportSvg.append('g').
      attr('class', 'x grid').
      attr('transform', `translate(0,${viewportHeight})`);

    // This <rect> exists to capture mouse actions on the chart, but not
    // directly on the bars or labels, that should result in a pan behavior.
    // If we set stroke and fill to none, the mouse events don't seem to get
    // picked up, so we instead set opacity to 0.
    viewportSvg.append('rect').
      attr('class', 'dragger').
      attr('width', viewportWidth).
      attr('height', height).
      attr('opacity', 0);

    // The y-axis and series are groups since they all need to conform to the
    // same clip path for the appearance of panning to be upheld.
    yAxisAndSeriesSvg = viewportSvg.append('g').
      attr('class', 'y-axis-and-series').
      attr('clip-path', `url(#${d3ClipPathId})`);

    yAxisAndSeriesSvg.append('g').
      attr('class', 'series');

    seriesSvg = yAxisAndSeriesSvg.select('.series');

    dimensionGroupSvgs = seriesSvg.selectAll('.dimension-group').
      data(groupedDataToRender).
      enter().
      append('g');

    dimensionGroupSvgs.
      attr('class', 'dimension-group').
      attr(
        'data-group-category',
        (d) => {

          return (d[0] === null || typeof d[0] === 'undefined') ?
            NO_VALUE_SENTINEL :
            d[0];
        }
      ).
      attr('transform', (d) => `translate(0,${d3DimensionYScale(d[0])})`);

    barUnderlaySvgs = dimensionGroupSvgs.selectAll('rect.bar-underlay').
      data((d) => d[1]).
      enter().
      append('rect');

    barUnderlaySvgs.
      attr('class', 'bar-underlay').
      attr(
        'data-bar-category',
        // Not sure if what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        (datum, seriesIndex, rowIndex) => groupedDataToRender[rowIndex][0]
      ).
      attr(
        'data-series-index',
        /* eslint-disable no-unused-vars */
        (datum, seriesIndex, rowIndex) => seriesIndex
        /* eslint-enable no-unused-vars */
      ).
      attr(
        'data-row-index',
        // Not sure if what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        (datum, seriesIndex, rowIndex) => rowIndex
      );

    barSvgs = dimensionGroupSvgs.selectAll('rect.bar').
      data((d) => d[1]).
      enter().
      append('rect');

    barSvgs.
      attr('class', 'bar').
      attr(
        'data-bar-category',
        // Not sure if what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        (datum, seriesIndex, rowIndex) => groupedDataToRender[rowIndex][0]
      ).
      attr(
        'data-series-index',
        /* eslint-disable no-unused-vars */
        (datum, seriesIndex, rowIndex) => seriesIndex
        /* eslint-enable no-unused-vars */
      ).
      attr(
        'data-row-index',
        // Not sure if what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        (datum, seriesIndex, rowIndex) => rowIndex
      );

    if (self.getShowValueLabels()) {

      barTextSvgs = dimensionGroupSvgs.selectAll('text').
        data(function(d) { return d[1]; }).
        enter().
        append('text');

      barTextSvgs.
        attr(
          'data-bar-category',
          // Not sure if what the second argument actually is, but it is
          // the third argument that seems to track the row index.
          (datum, seriesIndex, rowIndex) => groupedDataToRender[rowIndex][0]
        ).
        attr(
          'data-series-index',
          /* eslint-disable no-unused-vars */
          (datum, seriesIndex, rowIndex) => seriesIndex
          /* eslint-enable no-unused-vars */
        ).
        attr(
          'data-row-index',
          // Not sure if what the second argument actually is, but it is
          // the third argument that seems to track the row index.
          (datum, seriesIndex, rowIndex) => rowIndex
        );
    }

    // TODO: Figure out how we want to handle scaling modes.
    // if (self.getYAxisScalingMode() === 'fit') {

    //   // If we do not have to support panning then rendering is somewhat more
    //   // straightforward.
    //   renderYAxis();
    //   renderSeries();
    //   renderXAxis();
    // } else {

      // We need to render the y-axis before we can determine whether or not to
      // enable panning, since panning depends on the actual rendered height of
      // the axis.
      renderYAxis();

      // This is the actual rendered height.
      height = yAxisAndSeriesSvg.node().getBBox().height;

      yAxisPanDistance = height - viewportHeight;

      yAxisPanningEnabled = (yAxisPanDistance > 0) ? true : false;

      if (yAxisPanningEnabled) {

        self.showPanningNotice();

        // If we are showing the panning notice, it may be that the info bar
        // was previously hidden but is now shown. If this is the case, we need
        // to recompute the viewport height to accommodate the new, decreased
        // vertical space available in which to draw the chart. We also need
        // to immediately recompute yAxisPanDistance, because it is derived
        // from the viewport height and using the stale value will cause the
        // panning behavior to be incorrect (it will become impossible to pan
        // the bottom-most edge of the chart into view).
        viewportHeight = (
          $chartElement.height() -
          MARGINS.TOP -
          MARGINS.BOTTOM
        );

        yAxisPanDistance = height - viewportHeight;
      } else {
        self.hidePanningNotice();
      }

      // Now that we have determined if panning is enabled and potentially
      // updated the viewport height, we need to render everything at the new
      // viewport size.
      renderYAxis();
      renderSeries();
      renderXAxis();
    // See TODO above.
    // }

    /**
     * 6. Set up event handlers for mouse interactions.
     */

    dimensionGroupSvgs.selectAll('rect.bar-underlay').
      on(
        'mousemove',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
        function() {

          if (!isCurrentlyPanning()) {
            const seriesIndex = this.getAttribute('data-series-index');
            const dimensionGroup = this.parentNode;
            const siblingBar = d3.select(dimensionGroup).select(
              `rect.bar[data-series-index="${seriesIndex}"]`
            )[0][0];
            const datum = d3.select(this.parentNode).datum()[1][seriesIndex];

            showBarHighlight(siblingBar);
            showBarFlyout(siblingBar, datum);
          }
        }
      ).
      on(
        'mouseleave',
        () => {

          if (!isCurrentlyPanning()) {

            hideHighlight();
            hideFlyout();
          }
        }
      );

    dimensionGroupSvgs.selectAll('rect.bar').
      on(
        'mousemove',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
        function() {

          if (!isCurrentlyPanning()) {
            const seriesIndex = this.getAttribute('data-series-index');
            const datum = d3.select(this.parentNode).datum()[1][seriesIndex];

            showBarHighlight(this);
            showBarFlyout(this, datum);
          }
        }
      ).
      on(
        'mouseleave',
        () => {

          if (!isCurrentlyPanning()) {

            hideHighlight();
            hideFlyout();
          }
        }
      );

    dimensionGroupSvgs.selectAll('text').
      on(
        'mousemove',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
        function() {

          if (!isCurrentlyPanning()) {
            const seriesIndex = this.getAttribute('data-series-index');
            const dimensionGroup = this.parentNode;
            const siblingBar = d3.select(dimensionGroup).select(
              `rect.bar[data-series-index="${seriesIndex}"]`
            )[0][0];
            const datum = d3.select(this.parentNode).datum()[1][seriesIndex];

            showBarHighlight(siblingBar);
            showBarFlyout(siblingBar, datum);
          }
        }
      ).
      on(
        'mouseleave',
        () => {

          if (!isCurrentlyPanning()) {

            hideHighlight();
            hideFlyout();
          }
        }
      );

    chartSvg.
      selectAll('.y.axis .tick text').
        on(
          'mousemove',
          (d) => {

            if (!isCurrentlyPanning()) {
              const groupCategory = (_.isNull(d[0]) || _.isUndefined(d[0])) ?
                NO_VALUE_SENTINEL :
                d[0];
              const dimensionGroup = yAxisAndSeriesSvg.select(
                `g.dimension-group[data-group-category="${groupCategory}"]`
              );

              showGroupHighlight(dimensionGroup);
              showGroupFlyout(dimensionGroup);
            }
          }
        ).
        on(
          'mouseleave',
          () => {

            if (!isCurrentlyPanning()) {
              hideHighlight();
              hideFlyout();
            }
          }
        );

    /**
     * 7. Conditionally set up the zoom behavior, which is actually used for
     *    panning the chart along the x-axis if panning is enabled.
     */

    if (yAxisPanningEnabled) {

      d3Zoom = d3.behavior.zoom().
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

      chartSvg.selectAll('text').
        attr('cursor', null);
    } else {

      chartSvg.selectAll('text').
        attr('cursor', 'default');
    }
  }

  function conditionallyTruncateLabel(label) {
    label = label || I18n.translate('visualizations.common.no_value');

    return (label.length >= DIMENSION_LABELS_MAX_CHARACTERS) ?
      `${label.substring(0, DIMENSION_LABELS_MAX_CHARACTERS - 1).trim()}…` :
      label;
  }

  function generateYScale(domain, height) {

    return d3.scale.ordinal().
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
      // override it to be 0.05, which looks like what we expect.
      rangeRoundBands([0, height], 0.1, 0.05);
  }

  function generateYGroupScale(domain, yScale) {

    return d3.scale.ordinal().
      domain(domain).
      rangeRoundBands([0, yScale.rangeBand()]);
  }

  function generateYAxis(yScale) {

    return d3.svg.axis().
      scale(yScale).
      orient('left').
      /* eslint-disable no-unused-vars */
      tickFormat((d, i) => {
      /* eslint-enable no-unused-vars */

        // TODO: Figure out how we want to handle scaling modes.
        // if (self.getYAxisScalingMode() === 'fit') {

        //   if (i < 5) {
        //     return conditionallyTruncateLabel(d);
        //   } else {
        //     return '';
        //   }
        // } else {
          return conditionallyTruncateLabel(d);
        // See TODO above.
        // }
      }).
      outerTickSize(0);
  }

  function getMinXValue(groupedData) {

    return d3.min(
      groupedData.map((row) => {

        return d3.min(
          row[1].map((d) => d[1])
        );
      })
    );
  }

  function getMaxXValue(groupedData) {

    return d3.max(
      groupedData.map((row) => {

        return d3.max(
          row[1].map((d) => d[1])
        );
      })
    );
  }

  function generateXScale(minValue, maxValue, width) {

    return d3.scale.linear().
      domain([minValue, maxValue]).
      range([0, width]);
  }

  function generateXAxis(xScale) {

    return d3.svg.axis().
      scale(xScale).
      orient('top').
      tickFormat(function(d) { return utils.formatNumber(d); });
  }

  function isCurrentlyPanning() {

    // EN-10810 - Bar Chart flyouts do not appear in Safari
    //
    // Internet Explorer will apparently always return a non-zero value for
    // d3.event.which and even d3.event.button, so we need to check
    // d3.event.buttons for a non-zero value (which indicates that a button is
    // being pressed).
    //
    // Safari apparently does not support d3.event.buttons, however, so if it
    // is not a number then we will fall back to d3.event.which to check for a
    // non-zero value there instead.
    //
    // Chrome appears to support both cases, and in the conditional below
    // Chrome will check d3.event.buttons for a non-zero value.
    return (_.isNumber(d3.event.buttons)) ?
      d3.event.buttons !== 0 :
      d3.event.which !== 0;
  }

  function showGroupHighlight(groupElement) {

    // NOTE: The below function depends on this being set by d3, so it is not
    // possible to use the () => {} syntax here.
    groupElement.selectAll('.bar').each(function() {
      const selection = d3.select(this);

      selection.attr(
        'fill',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
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
    });
  }

  function showBarHighlight(barElement) {
    const selection = d3.select(barElement);

    selection.attr(
      'fill',
      // NOTE: The below function depends on this being set by d3, so it is not
      // possible to use the () => {} syntax here.
      function() {
        const seriesIndex = this.getAttribute('data-series-index');
        const highlightColor = self.getHighlightColorBySeriesIndex(seriesIndex);

        return (highlightColor !== null) ?
          highlightColor :
          selection.attr('fill');
      }
    );
  }

  function hideHighlight() {

    // NOTE: The below function depends on this being set by d3, so it is not
    // possible to use the () => {} syntax here.
    d3.selectAll('.bar').each(function() {
      const selection = d3.select(this);

      selection.attr('fill', selection.attr('data-default-fill'));
    });
  }

  function showGroupFlyout(groupElement) {
    const title = groupElement.attr('data-group-category');
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).text(
          (title === NO_VALUE_SENTINEL) ?
            I18n.translate('visualizations.common.no_value') :
            title
        )
      );
    const labelValuePairs = groupElement.data()[0][1];
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);

    let $labelValueRows;
    let payload = null;

    $labelValueRows = labelValuePairs.map((datum) => {
      const label = datum[0];
      const value = datum[1];
      const seriesIndex = self.getSeriesIndexByLabel(label);
      const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
        text(label).
        css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
      const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});

      let valueString;

      if (value === null) {
        valueString = I18n.translate('visualizations.common.no_value');
      } else {

        valueString = utils.formatNumber(value);

        if (value === 1) {
          valueString += ` ${self.getUnitOneBySeriesIndex(seriesIndex)}`;
        } else {
          valueString += ` ${self.getUnitOtherBySeriesIndex(seriesIndex)}`;
        }
      }

      $valueCell.text(valueString);

      return $('<tr>', {'class': 'socrata-flyout-row'}).
        append([
          $labelCell,
          $valueCell
        ]);
    });

    $table.append($labelValueRows);

    payload = {
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    // If there is only one bar in the group then we can position the flyout
    // over the bar itself, not the bar group.
    if (groupElement.selectAll('.bar')[0].length === 1) {
      _.set(payload, 'element', groupElement[0][0].childNodes[1]);
    // If there is more than one bar we can measure the widths of each bar in
    // the group and then calculate a point that is at the right side and
    // vertically centered on the bars in the group (we can't rely on the
    // default behavior of the flyout renderer to position the flyout above and
    // in the center of the element passed to it as a target since, in this
    // case, the group element will always extend to the full width of the
    // chart.
    } else {

      // Calculate the offsets from screen (0, 0) to the right edge of the
      // widest bar in the group and half-way from its top edge to its bottom
      // edge. If we pass a 'flyoutOffset' property to the flyout renderer, it
      // will use those values as offsets for the fixed-positioned flyout
      // instead of deriving its own offsets from the position of the 'element'
      // property.
      const flyoutElementBoundingClientRect = groupElement[0][0].
        getBoundingClientRect();
      const flyoutElementHeight = flyoutElementBoundingClientRect.height;
      const flyoutElementTopOffset = flyoutElementBoundingClientRect.top;
      const flyoutElementLeftOffset = flyoutElementBoundingClientRect.left;
      const flyoutValues = labelValuePairs.map((d) => d[1]);
      const maxFlyoutValue = Math.max(...flyoutValues);

      let flyoutLeftOffset;

      if (maxFlyoutValue <= 0) {
        flyoutLeftOffset = flyoutElementLeftOffset + d3XScale(0);
      } else {
        flyoutLeftOffset = flyoutElementLeftOffset + d3XScale(maxFlyoutValue);
      }

      _.set(
        payload,
        'flyoutOffset',
        {
          left: flyoutLeftOffset,
          top: flyoutElementTopOffset + (flyoutElementHeight / 2) - 1
        }
      );
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_BAR_CHART_FLYOUT',
      payload
    );
  }

  function showBarFlyout(barElement, datum) {
    const title = (
      barElement.getAttribute('data-bar-category') ||
      I18n.translate('visualizations.common.no_value')
    );
    const label = datum[0];
    const value = datum[1];
    const seriesIndex = self.getSeriesIndexByLabel(label);
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).text(
          (title) ? title : ''
        )
      );
    const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
    const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
    const $valueRow = $('<tr>', {'class': 'socrata-flyout-row'});
    const $table = $('<table>', {'class': 'socrata-flyout-table'});

    let valueString;
    let payload = null;

    if (value === null) {
      valueString = I18n.translate('visualizations.common.no_value');
    } else {

      valueString = utils.formatNumber(value);

      if (value === 1) {
        valueString += ` ${self.getUnitOneBySeriesIndex(seriesIndex)}`;
      } else {
        valueString += ` ${self.getUnitOtherBySeriesIndex(seriesIndex)}`;
      }
    }

    $valueCell.text(valueString);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $title,
      $valueRow
    ]);

    payload = {
      element: barElement,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_BAR_CHART_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_BAR_CHART_FLYOUT',
      null
    );
  }
}

module.exports = SvgBarChart;
