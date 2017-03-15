// Vendor Imports
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
// Project Imports
const SvgVisualization = require('./SvgVisualization');
const I18n = require('../I18n');
// Constants
import {
  AXIS_LABEL_MARGIN
} from './SvgStyleConstants';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 26,
  RIGHT: 16,
  BOTTOM: 0,
  LEFT: 16
};
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABELS_FIXED_WIDTH = 115;
const DIMENSION_LABELS_ROTATION_ANGLE = 0;
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_MAX_CHARACTERS = 11;
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

    const dimensionLabelsWidth = (self.getShowDimensionLabels() ? DIMENSION_LABELS_FIXED_WIDTH : 0);

    const axisLabels = self.getAxisLabels();
    const leftMargin = MARGINS.LEFT + (axisLabels.left ? AXIS_LABEL_MARGIN : 0) + dimensionLabelsWidth;
    const rightMargin = MARGINS.RIGHT + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);

    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);
    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

    const d3ClipPathId = `bar-chart-clip-path-${_.uniqueId()}`;
    const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
    const dimensionValues = dataToRender.rows.map(
      (row) => row[dataTableDimensionIndex]
    );
    const measureLabels = dataToRender.columns.slice(
      dataTableDimensionIndex + 1
    );

    let width;
    let height;
    let groupedDataToRender;
    let numberOfGroups;
    let numberOfItemsPerGroup;
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
        attr('transform', `rotate(${DIMENSION_LABELS_ROTATION_ANGLE})`);

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

      dimensionGroupSvgs.selectAll('rect.bar-underlay').
        attr(
          'y',
          (d, measureIndex) => {
            return d3GroupingYScale(measureLabels[measureIndex]);
          }
        ).
        attr('x', 0).
        attr('height', d3GroupingYScale.rangeBand() - 1).
        attr('width', width).
        attr('stroke', 'none').
        attr('fill', 'transparent').
        attr(
          'data-default-fill',
          (measureValue, measureIndex, dimensionIndex) => {
            return getColor(dimensionIndex, measureIndex);
          }
        );

      dimensionGroupSvgs.selectAll('rect.bar').
        attr(
          'x',
          (d) => {
            // Note that _.clamp() will cast non-numeric values to the minimum,
            // so null values become 0.
            const value = _.clamp(d, minXValue, maxXValue);

            let xAttr;

            if (minXValue > 0) {
              xAttr = d3XScale(minXValue);
            } else if (maxXValue < 0) {
              xAttr = d3XScale(maxXValue);
            } else {
              xAttr = d3XScale(0);
            }

            if (value < 0) {
              xAttr = d3XScale(value);
            }

            return xAttr;
          }
        ).
        attr(
          'y',
          (d, measureIndex) => {
            return d3GroupingYScale(measureLabels[measureIndex]);
          }
        ).
        attr(
          'width',
          (d) => {

            if (d === 0 || !_.isFinite(d)) {
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
              const value = _.clamp(d, minXValue, maxXValue);

              // Calculating baseline depending on column value
              // Value;
              //   > 0 : Baseline should be 0 or minXValue depending on which is
              //         lower.
              //   < 0 : Baseline should be 0 or maxXValue depending on which is
              //         higher.
              const baselineValue = (value > 0) ?
                Math.max(minXValue, 0) :
                Math.min(maxXValue, 0);

              const barWidth = Math.abs(
                d3XScale(value) - d3XScale(baselineValue)
              );

              // See comment about setting the y attribute above for the
              // rationale behind ensuring a minimum height of one pixel for
              // non-null and non-zero values.
              return Math.max(1, barWidth);
            }
          }
        ).
        attr('height', d3GroupingYScale.rangeBand() - 1).
        attr('stroke', 'none').
        attr(
          'fill',
          (value, measureIndex, dimensionIndex) => {

            return getColor(dimensionIndex, measureIndex);
          }
        ).
        attr(
          'data-default-fill',
          (value, measureIndex, dimensionIndex) => {

            return getColor(dimensionIndex, measureIndex);
          }
        );

      if (self.getShowValueLabels()) {

        dimensionGroupSvgs.selectAll('text').
          attr(
            'x',
            (d) => {
              // Note that _.clamp() will cast non-numeric values to the
              // minimum, so null values become 0.
              const value = _.clamp(d, minXValue, maxXValue);
              const belowMeasureAxisMinValue = (
                self.getMeasureAxisMinValue() !== null &&
                self.getMeasureAxisMinValue() >= value
              );
              const aboveMeasureAxisMaxValue = (
                self.getMeasureAxisMaxValue() !== null &&
                self.getMeasureAxisMaxValue() <= value
              );
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let xAttr;

              // We need to override positioning if the measure axis min or max
              // values are set, since our zero-based logic will produce
              // incorrect results.
              if (belowMeasureAxisMinValue) {
                xAttr = scaledValue + MEASURE_VALUE_TEXT_X_PADDING;
              } else if (aboveMeasureAxisMaxValue) {
                xAttr = scaledValue - MEASURE_VALUE_TEXT_X_PADDING;
              } else if (value >= 0) {

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
            (d, measureIndex) => {

              // We want to position the text label roughly in the center of the
              // bar, so we determine the offset of the top of the bar in a
              // group from the top of the scale using d3GroupingYScale and then
              // add the scale's rangeBand (the number of pixels assigned to
              // each series in the group) by two, which will give us the rough
              // midpoint. Because of the way strokes are used and a few other
              // peculiarities, we have eyeballed an additional padding value
              // to add to the result of the above calculation which causes the
              // labels to actually appear vertically-centered in a bar.
              return d3GroupingYScale(measureLabels[measureIndex]) +
                (d3GroupingYScale.rangeBand() / 2) +
                MEASURE_VALUE_TEXT_Y_PADDING;
            }
          ).
          attr('font-family', FONT_STACK).
          attr('font-size', (DIMENSION_LABELS_FONT_SIZE - 4) + 'px').
          attr(
            'fill',
            (d) => {
              const value = d;
              const measureAxisMinValue = self.getMeasureAxisMinValue();
              const measureAxisMaxValue = self.getMeasureAxisMaxValue();
              const belowMeasureAxisMinValue = (
                measureAxisMinValue !== null &&
                measureAxisMinValue >= value
              );
              const aboveMeasureAxisMaxValue = (
                measureAxisMaxValue !== null &&
                measureAxisMaxValue <= value
              );
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let fillAttr;

              // We need to override positioning if the measure axis min or max
              // values are set, since our zero-based logic will produce
              // incorrect results.
              if (belowMeasureAxisMinValue) {

                if (measureAxisMinValue <= 0) {
                  fillAttr = MEASURE_VALUE_TEXT_INSIDE_BAR_COLOR;
                } else {
                  fillAttr = MEASURE_VALUE_TEXT_OUTSIDE_BAR_COLOR;
                }
              } else if (aboveMeasureAxisMaxValue) {

                if (measureAxisMaxValue >= 0) {
                  fillAttr = MEASURE_VALUE_TEXT_INSIDE_BAR_COLOR;
                } else {
                  fillAttr = MEASURE_VALUE_TEXT_OUTSIDE_BAR_COLOR;
                }
              // If the bar is wide enough to accommodate the text label inside
              // of itself, then make the text label the 'inside' color
              // (off-white).
              } else if (
                barWidth >= MEASURE_VALUE_TEXT_IN_BAR_MINIMUM_BAR_WIDTH
              ) {
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
              const value = d;
              const belowMeasureAxisMinValue = (
                self.getMeasureAxisMinValue() !== null &&
                self.getMeasureAxisMinValue() >= value
              );
              const aboveMeasureAxisMaxValue = (
                self.getMeasureAxisMaxValue() !== null &&
                self.getMeasureAxisMaxValue() <= value
              );
              const scaledValue = d3XScale(value);
              const barWidth = (value >= 0) ?
                scaledValue - d3XScale(0) :
                d3XScale(0) - scaledValue;

              let styleAttr;

              // We need to override positioning if the measure axis min or max
              // values are set, since our zero-based logic will produce
              // incorrect results.
              if (belowMeasureAxisMinValue) {
                styleAttr = 'text-anchor:start';
              } else if (aboveMeasureAxisMaxValue) {
                styleAttr = 'text-anchor:end';
              } else if (value >= 0) {

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
          text((d) => {
            return (_.isNumber(d)) ? utils.formatNumber(d) : '';
          });
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

    groupedDataToRender = dataToRender.rows;
    numberOfGroups = groupedDataToRender.length;
    numberOfItemsPerGroup = dataToRender.rows[0].length - 1;

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
        barHeight * numberOfGroups * numberOfItemsPerGroup
      );
    // See TODO above.
    // }

    width = viewportWidth;

    /**
     * 2. Set up the x-scale and -axis.
     */

    try {
      const dataMinXValue = getMinXValue(
        groupedDataToRender,
        dataTableDimensionIndex
      );
      const dataMaxXValue = getMaxXValue(
        groupedDataToRender,
        dataTableDimensionIndex
      );
      const measureAxisMinValue = self.getMeasureAxisMinValue();
      const measureAxisMaxValue = self.getMeasureAxisMaxValue();

      if (
        measureAxisMinValue &&
        measureAxisMaxValue &&
        measureAxisMinValue >= measureAxisMaxValue
      ) {

        self.renderError(
          I18n.translate(
            'visualizations.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      minXValue = measureAxisMinValue || Math.min(dataMinXValue, 0);
      maxXValue = measureAxisMaxValue || Math.max(dataMaxXValue, 0);

      if (minXValue >= maxXValue) {
        self.renderError(
          I18n.translate(
            'visualizations.common.validation.errors.' +
            'measure_axis_biggest_value_should_be_more_than_min_limit'
          )
        );
        return;
      }
    } catch (error) {
      self.renderError(error.message);
      return;
    }

    // TODO: Figure out how we want to handle scaling modes.
    // if (self.getXAxisScalingModeBySeriesIndex(0) === 'showZero') {

      // Normalize min and max values so that we always show 0 if the user
      // has specified that behavior in the Vif.
      //if (_.isNull(measureAxisMinValue) && _.isNull(measureAxisMaxValue)) {
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
    d3DimensionYScale = generateYScale(
      dimensionValues,
      height,
      self.isMultiSeries()
    );
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
      attr('width', viewportWidth + rightMargin + leftMargin).
      attr('height', height + topMargin + bottomMargin);

    // The viewport represents the area within the chart's container that can
    // be used to draw the x-axis, y-axis and chart marks.

    viewportSvg = chartSvg.append('g').
      attr('class', 'viewport').
      attr('transform', `translate(${leftMargin}, ${topMargin})`);

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
          return viewportWidth + leftMargin + rightMargin;
        }
      ).
      attr('height', viewportHeight + topMargin + bottomMargin).
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
        'data-dimension-value',
        (d) => {

          return (d[0] === null || typeof d[0] === 'undefined') ?
            NO_VALUE_SENTINEL :
            d[0];
        }
      ).
      attr('transform', (d) => `translate(0,${d3DimensionYScale(d[0])})`);

    barUnderlaySvgs = dimensionGroupSvgs.selectAll('rect.bar-underlay').
      data((d) => d.slice(1)).
      enter().
      append('rect');

    barUnderlaySvgs.
      attr('class', 'bar-underlay').
      attr(
        'data-dimension-value',
        (datum, measureIndex, dimensionIndex) => {
          return dimensionValues[dimensionIndex];
        }
      ).
      attr(
        'data-dimension-index',
        (datum, measureIndex, dimensionIndex) => dimensionIndex
      ).
      attr(
        'data-measure-index',
        /* eslint-disable no-unused-vars */
        (datum, measureIndex, dimensionIndex) => measureIndex
        /* eslint-enable no-unused-vars */
      );

    barSvgs = dimensionGroupSvgs.selectAll('rect.bar').
      data((d) => d.slice(1)).
      enter().
      append('rect');

    barSvgs.
      attr('class', 'bar').
      attr(
        'data-dimension-value',
        (datum, measureIndex, dimensionIndex) => {
          return dimensionValues[dimensionIndex];
        }
      ).
      attr(
        'data-dimension-index',
        /* eslint-disable no-unused-vars */
        (datum, measureIndex, dimensionIndex) => dimensionIndex
      ).
      attr(
        'data-measure-index',
        /* eslint-disable no-unused-vars */
        (datum, measureIndex, dimensionIndex) => measureIndex
      );

    if (self.getShowValueLabels()) {

      barTextSvgs = dimensionGroupSvgs.selectAll('text').
        data((d) => d.slice(1)).
        enter().
        append('text');

      barTextSvgs.
        attr(
          'data-dimension-value',
          (datum, measureIndex, dimensionIndex) => {
            return dimensionValues[dimensionIndex];
          }
        ).
        attr(
          'data-dimension-index',
          /* eslint-disable no-unused-vars */
          (datum, measureIndex, dimensionIndex) => dimensionIndex
        ).
        attr(
          'data-measure-index',
          /* eslint-disable no-unused-vars */
          (datum, measureIndex, dimensionIndex) => measureIndex
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

      yAxisPanningEnabled = yAxisPanDistance > 0;

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
        viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

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
            const dimensionIndex = parseInt(
              this.getAttribute('data-dimension-index'),
              10
            );
            const measureIndex = parseInt(
              this.getAttribute('data-measure-index'),
              10
            );
            const dimensionGroup = this.parentNode;
            const siblingBar = d3.select(dimensionGroup).select(
              `rect.bar[data-measure-index="${measureIndex}"]`
            )[0][0];
            const color = getColor(dimensionIndex, measureIndex);
            const label = measureLabels[measureIndex];
            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];

            showBarHighlight(siblingBar);
            showBarFlyout(siblingBar, color, label, value);
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
            const dimensionIndex = parseInt(
              this.getAttribute('data-dimension-index'),
              10
            );
            const measureIndex = parseInt(
              this.getAttribute('data-measure-index'),
              10
            );
            const color = getColor(dimensionIndex, measureIndex);
            const label = measureLabels[measureIndex];
            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];

            showBarHighlight(this);
            showBarFlyout(this, color, label, value);
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
            const dimensionIndex = parseInt(
              this.getAttribute('data-dimension-index'),
              10
            );
            const measureIndex = parseInt(
              this.getAttribute('data-measure-index'),
              10
            );
            const dimensionGroup = this.parentNode;
            const siblingBar = d3.select(dimensionGroup).select(
              `rect.bar[data-measure-index="${measureIndex}"]`
            )[0][0];
            const color = getColor(dimensionIndex, measureIndex);
            const label = measureLabels[measureIndex];
            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];

            showBarHighlight(siblingBar);
            showBarFlyout(siblingBar, color, label, value);
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
              const dimensionValue = (_.isNull(d[0]) || _.isUndefined(d[0])) ?
                NO_VALUE_SENTINEL :
                d[0];
              const dimensionGroup = yAxisAndSeriesSvg.select(
                `g.dimension-group[data-dimension-value="${dimensionValue}"]`
              );

              showGroupHighlight(dimensionGroup);
              showGroupFlyout(dimensionGroup, dimensionValues, measureLabels);
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

    self.renderAxisLabels(chartSvg, {
      x: leftMargin,
      y: topMargin,
      width: viewportWidth,
      height: viewportHeight -  viewportSvg.select('.x.axis').node().getBBox().height
    });
  }

  function getColor(dimensionIndex, measureIndex) {
    const isGrouping = !_.isNull(
      _.get(
        self.getVif(),
        'series[0].dataSource.dimension.grouping.columnName',
        null
      )
    );
    const usingColorPalette = _.get(
      self.getVif(),
      `series[${(isGrouping) ? 0 : dimensionIndex}].color.palette`,
      false
    );

    function getColorFromPalette() {
      const palette = self.getColorPaletteBySeriesIndex(0);

      return palette[measureIndex];
    }

    function getPrimaryColorOrNone() {
      const primaryColor = (isGrouping) ?
        self.getPrimaryColorBySeriesIndex(0) :
        self.getPrimaryColorBySeriesIndex(measureIndex);

      return (primaryColor !== null) ?
        primaryColor :
        'none';
    }

    return (usingColorPalette) ?
      getColorFromPalette() :
      getPrimaryColorOrNone();
  }

  function conditionallyTruncateLabel(label) {
    label = label || I18n.translate('visualizations.common.no_value');

    return (label.length >= DIMENSION_LABELS_MAX_CHARACTERS) ?
      `${label.substring(0, DIMENSION_LABELS_MAX_CHARACTERS - 1).trim()}…` :
      label;
  }

  function generateYScale(domain, height, isMultiSeries) {
    const padding = (isMultiSeries) ?
      0.3 :
      0.1;

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
      rangeRoundBands([0, height], padding, 0.05);
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

  function getMinXValue(groupedData, dimensionIndex) {

    return d3.min(
      groupedData.map(
        (row) => d3.min(
          row.slice(dimensionIndex + 1)
        )
      )
    );
  }

  function getMaxXValue(groupedData, dimensionIndex) {

    return d3.max(
      groupedData.map(
        (row) => d3.max(
          row.slice(dimensionIndex + 1)
        )
      )
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
      tickFormat((d) => { return utils.formatNumber(d); });
  }

  function getSeriesIndexByMeasureIndex(measureIndex) {
    const isGrouping = !_.isNull(
      _.get(
        self.getVif(),
        'series[0].dataSource.dimension.grouping.columnName',
        null
      )
    );

    return (isGrouping) ? 0 : measureIndex;
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
          const seriesIndex = getSeriesIndexByMeasureIndex(
            parseInt(this.getAttribute('data-measure-index'), 10)
          );
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
        const measureIndex = getSeriesIndexByMeasureIndex(
          parseInt(this.getAttribute('data-measure-index'), 10)
        );
        const highlightColor = self.getHighlightColorBySeriesIndex(
          measureIndex
        );

        return (highlightColor !== null) ?
          highlightColor :
          selection.attr('fill');
      }
    );
  }

  function hideHighlight() {

    // NOTE: The below function depends on this being set by d3, so it is not
    // possible to use the () => {} syntax here.
    d3.selectAll('rect.bar').each(function() {
      const selection = d3.select(this);

      selection.attr('fill', selection.attr('data-default-fill'));
    });
  }

  function showGroupFlyout(groupElement, dimensionValues, measureLabels) {
    const title = groupElement.attr('data-dimension-value');
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).text(
          (title === NO_VALUE_SENTINEL) ?
            I18n.translate('visualizations.common.no_value') :
            title
        )
      );
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    const dimensionValue = groupElement.attr('data-dimension-value');
    const dimensionIndex = dimensionValues.indexOf(dimensionValue);
    const measureValues = groupElement.data()[0].slice(1);

    let $labelValueRows;
    let payload = null;

    // 0th element of row data is always the dimension, everything after that
    // is a measure value.
    $labelValueRows = measureValues.map((value, measureIndex) => {
      const label = measureLabels[measureIndex];
      const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
        text(label).
        css('color', getColor(dimensionIndex, measureIndex));
      const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
      const unitOne = self.getUnitOneBySeriesIndex(
        getSeriesIndexByMeasureIndex(measureIndex)
      );
      const unitOther = self.getUnitOtherBySeriesIndex(
        getSeriesIndexByMeasureIndex(measureIndex)
      );

      let valueString;

      if (value === null) {
        valueString = I18n.translate('visualizations.common.no_value');
      } else {
        valueString = utils.formatNumber(value);

        if (value === 1) {
          valueString += ` ${unitOne}`;
        } else {
          valueString += ` ${unitOther}`;
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
    if (groupElement.selectAll('rect.bar')[0].length === 1) {
      _.set(payload, 'element', groupElement[0][0].childNodes[1]);
    } else {

      // Calculate the offsets from screen (0, 0) to the right of the widest
      // bar (where at least one value in the group is > 0) or 0 on the x-axis
      // (where all values in the group are <= 0) and the vertical center of
      // the group in question.
      const flyoutElementBoundingClientRect = groupElement[0][0].
        getBoundingClientRect();
      const flyoutElementHeight = flyoutElementBoundingClientRect.height;
      const flyoutElementTopOffset = flyoutElementBoundingClientRect.top;
      const flyoutElementLeftOffset = flyoutElementBoundingClientRect.left;
      const maxFlyoutValue = d3.max(measureValues);
      const measureAxisMaxValue = self.getMeasureAxisMaxValue();

      let flyoutLeftOffset;

      if (maxFlyoutValue >= 0) {

        if (
          measureAxisMaxValue !== null &&
          measureAxisMaxValue < maxFlyoutValue
        ) {

          flyoutLeftOffset = (
            flyoutElementLeftOffset + d3XScale(measureAxisMaxValue)
          );
        } else {

          flyoutLeftOffset = (
            flyoutElementLeftOffset + d3XScale(maxFlyoutValue)
          );
        }
      } else {

        if (measureAxisMaxValue !== null && measureAxisMaxValue < 0) {

          flyoutLeftOffset = (
            flyoutElementLeftOffset + d3XScale(measureAxisMaxValue)
          );
        } else {

          flyoutLeftOffset = (
            flyoutElementLeftOffset + d3XScale(0)
          );
        }
      }

      _.set(
        payload,
        'flyoutOffset',
        {
          top: flyoutElementTopOffset + (flyoutElementHeight / 2) - 1,
          left: flyoutLeftOffset
        }
      );
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_BAR_CHART_FLYOUT',
      payload
    );
  }

  function showBarFlyout(barElement, color, label, value) {
    const title = (
      barElement.getAttribute('data-dimension-value') ||
      I18n.translate('visualizations.common.no_value')
    );
    const measureIndex = self.getSeriesIndexByLabel(label);
    const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).text(
          (title) ? title : ''
        )
      );
    const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', color);
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
