// Vendor Imports
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
// Project Imports
const ColumnFormattingHelpers = require('../helpers/ColumnFormattingHelpers');
const SvgVisualization = require('./SvgVisualization');
const I18n = require('common/i18n').default;
// Constants
import {
  AXIS_LABEL_MARGIN,
  DEFAULT_LINE_HIGHLIGHT_FILL,
  ERROR_BARS_DEFAULT_BAR_COLOR,
  ERROR_BARS_MAX_END_BAR_LENGTH,
  ERROR_BARS_STROKE_WIDTH,
  LEGEND_BAR_HEIGHT,
  REFERENCE_LINES_STROKE_DASHARRAY,
  REFERENCE_LINES_STROKE_WIDTH,
  REFERENCE_LINES_UNDERLAY_THICKNESS
} from './SvgStyleConstants';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 32,
  RIGHT: 32,
  BOTTOM: 0,
  LEFT: 32
};
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABELS_DEFAULT_WIDTH = 115;
const DIMENSION_LABELS_ROTATION_ANGLE = 0;
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_PIXEL_PER_CHARACTER = 115 / 11; // Empirically determined to work well enough.
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
// Limits width of dimension chart labels.
const MIN_WIDTH_RESERVED_FOR_CHART = 25;
const SMALL_VIEWPORT_WIDTH = 400;

const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');
const otherLabel = I18n.t('shared.visualizations.charts.common.other_category');

function SvgBarChart($element, vif, options) {
  const self = this;
  let $chartElement;
  let dataToRender;
  let d3DimensionYScale;
  let d3GroupingYScale;
  let d3XScale;
  let lastRenderedSeriesHeight = 0;
  let lastRenderedZoomTranslate = 0;
  let measureLabels;
  let referenceLines;

  const labelResizeState = {
    draggerElement: null,

    // True during interactive resize, false otherwise.
    dragging: false,

    // Controls how much horizontal space the labels take up.
    // The override persists until cleared by a VIF update.
    // The override is active if this value is defined.
    // Otherwise, the chart falls back to the space
    // configured in the VIF or the default.
    overriddenAreaSize: undefined
  };

  _.extend(this, new SvgVisualization($element, vif, options));

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData, newColumns) {

    if (!newData && !dataToRender) {
      return;
    }

    // Forget the label area size the user set - we're
    // loading a brand new vif.
    labelResizeState.overriddenAreaSize = undefined;

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

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    $(labelResizeState.draggerElement).toggleClass('enabled', self.getShowDimensionLabels());

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

  function labelWidthDragger() {
    const dragger = document.createElement('div');
    labelResizeState.draggerElement = dragger;

    dragger.setAttribute('class', 'label-width-dragger');

    d3.select(dragger).call(d3.behavior.drag().
      on('dragstart', () => {
        $chartElement.addClass('dragging-label-width-dragger');
        labelResizeState.dragging = true;
        labelResizeState.overriddenAreaSize = computeLabelWidth();
      }).
      on('drag', () => {
        labelResizeState.overriddenAreaSize += d3.event.dx;
        renderData();
        hideFlyout();
      }).
      on('dragend', () => {
        $chartElement.removeClass('dragging-label-width-dragger');
        labelResizeState.dragging = false;
        renderData();
        self.emitEvent('SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED', labelResizeState.overriddenAreaSize);
      })
    );

    return dragger;
  }

  function updateLabelWidthDragger(leftOffset, topOffset, height) {
    // Only move if not dragging. Otherwise,
    // d3's dragger becomes confused.
    if (!labelResizeState.dragging) {
      labelResizeState.draggerElement.setAttribute(
        'style',
        `left: ${leftOffset}px; top: ${topOffset}px; height: ${height}px`
      );
    }
  }

  function renderTemplate() {

    $chartElement = $(
      '<div>',
      {
        'class': 'bar-chart'
      }
    ).append(labelWidthDragger());

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  function computeLabelWidth() {
    let configuredSize = _.get(self.getVif(), 'configuration.dimensionLabelAreaSize');
    if (!_.isFinite(configuredSize)) {
      configuredSize = DIMENSION_LABELS_DEFAULT_WIDTH;
    }

    const width = _.isFinite(labelResizeState.overriddenAreaSize) ?
      labelResizeState.overriddenAreaSize : configuredSize;

    const axisLabels = self.getAxisLabels();
    const leftMargin = MARGINS.LEFT + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);
    const rightMargin = MARGINS.RIGHT +
      (axisLabels.right ? AXIS_LABEL_MARGIN : 0) +
      MIN_WIDTH_RESERVED_FOR_CHART;

    return _.clamp(
      width,
      0,
      $chartElement.width() - (leftMargin + rightMargin)
    );
  }

  function renderData() {
    const barHeight = self.isMobile() ?
      DEFAULT_MOBILE_BAR_HEIGHT :
      DEFAULT_DESKTOP_BAR_HEIGHT;

    const dimensionLabelsWidth = self.getShowDimensionLabels() ?
      computeLabelWidth() : 0;

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

    const columns = dataToRender.columns.slice(dataTableDimensionIndex + 1);

    if (self.isMultiSeries()) {
      measureLabels = columns.map((column, index) => {
        const measureColumnName = _.get(self.getVif(), `series[${index}].dataSource.measure.columnName`);

        if (_.isEmpty(measureColumnName)) {
          return I18n.t('shared.visualizations.panes.data.fields.measure.no_value');
        }

        const measureColumnFormat = dataToRender.columnFormats[measureColumnName];
        return _.isUndefined(measureColumnFormat) ? column : measureColumnFormat.name;
      });
    }
    else {

      // Grouped bar charts will have multiple columns. If one of those columns is null (which is
      // a valid value for it to be if there are nulls in the dataset), we need to replace it with
      // the no value label. If there are not multiple columns, that's an expected null that we
      // should not overwrite with the no value label.

      measureLabels = columns.map((column) => {
        return self.isGrouping() ? column || noValueLabel : column;
      });
    }

    referenceLines = self.getReferenceLines();

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
    let barSvgs;
    let barUnderlaySvgs;
    let referenceLineSvgs;
    let referenceLineUnderlaySvgs;
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

    function renderReferenceLines() {
      // Because the line stroke thickness is 2px, the half of the line can be clipped on the left or right edge
      // of the chart area.  This function shifts the clipped line right 1 pixel when at the left edge and left 1
      // pixel when at the right edge.  All the other lines are rendered in normal positions.
      const getXPosition = (referenceLine) => {
        const value = isOneHundredPercentStacked ? (referenceLine.value / 100) : referenceLine.value;

        if (value == minXValue) {
          return d3XScale(value) + 1; // shift right a pixel if at the left edge of chart area
        } else if (value == maxXValue) {
          return d3XScale(value) - 1; // shift left a pixel if at the right edge of chart area
        } else {
          return d3XScale(value);
        }
      };

      const getLineThickness = (referenceLine) => {
        const value = isOneHundredPercentStacked ? (referenceLine.value / 100) : referenceLine.value;
        return self.isInRange(value, minXValue, maxXValue) ? REFERENCE_LINES_STROKE_WIDTH : 0;
      };

      const getUnderlayThickness = (referenceLine) => {
        const value = isOneHundredPercentStacked ? (referenceLine.value / 100) : referenceLine.value;
        return self.isInRange(value, minXValue, maxXValue) ? REFERENCE_LINES_UNDERLAY_THICKNESS : 0;
      };

      // This places the underlay half to the left of the line and half to the right of the line.
      const underlayLeftwardShift = REFERENCE_LINES_UNDERLAY_THICKNESS / 2;

      referenceLineUnderlaySvgs.
        attr('data-reference-line-index', (referenceLine, index) => index).
        attr('fill', DEFAULT_LINE_HIGHLIGHT_FILL).
        attr('fill-opacity', 0).
        attr('x', (referenceLine) => getXPosition(referenceLine) - underlayLeftwardShift).
        attr('y', 0).
        attr('width', getUnderlayThickness).
        attr('height', height);

      referenceLineSvgs.
        attr('shape-rendering', 'crispEdges').
        attr('stroke', (referenceLine) => referenceLine.color).
        attr('stroke-dasharray', REFERENCE_LINES_STROKE_DASHARRAY).
        attr('stroke-width', getLineThickness).
        attr('x1', getXPosition).
        attr('y1', 0).
        attr('x2', getXPosition).
        attr('y2', height);
    }

    function renderErrorBars() {
      if (_.isUndefined(dataToRender.errorBars)) {
        return;
      }

      const barHeight = d3GroupingYScale.rangeBand() - 1;
      const errorBarHeight = Math.min(barHeight, ERROR_BARS_MAX_END_BAR_LENGTH);
      const color = _.get(self.getVif(), 'series[0].errorBars.barColor', ERROR_BARS_DEFAULT_BAR_COLOR);

      const getMinErrorBarXPosition = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        const minValue = _.clamp(d3.min(errorBarValues), minXValue, maxXValue);
        return d3XScale(minValue);
      };

      const getMaxErrorBarXPosition = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        const maxValue = _.clamp(d3.max(errorBarValues), minXValue, maxXValue);
        return d3XScale(maxValue);
      };

      const getMinErrorBarWidth = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        return self.isInRange(d3.min(errorBarValues), minXValue, maxXValue) ? ERROR_BARS_STROKE_WIDTH : 0;
      };

      const getMaxErrorBarWidth = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        return self.isInRange(d3.max(errorBarValues), minXValue, maxXValue) ? ERROR_BARS_STROKE_WIDTH : 0;
      };

      const getErrorBarYPosition = (d, measureIndex) => {
        return ((barHeight - errorBarHeight) / 2) + d3GroupingYScale(measureIndex);
      };

      dimensionGroupSvgs.selectAll('.error-bar-left').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', getMinErrorBarWidth).
        attr('x1', getMinErrorBarXPosition).
        attr('y1', getErrorBarYPosition).
        attr('x2', getMinErrorBarXPosition).
        attr('y2', (d, measureIndex) => getErrorBarYPosition(d, measureIndex) + errorBarHeight);

      dimensionGroupSvgs.selectAll('.error-bar-right').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', getMaxErrorBarWidth).
        attr('x1', getMaxErrorBarXPosition).
        attr('y1', getErrorBarYPosition).
        attr('x2', getMaxErrorBarXPosition).
        attr('y2', (d, measureIndex) => getErrorBarYPosition(d, measureIndex) + errorBarHeight);

      dimensionGroupSvgs.selectAll('.error-bar-middle').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', ERROR_BARS_STROKE_WIDTH).
        attr('x1', getMinErrorBarXPosition).
        attr('y1', (d, measureIndex) => getErrorBarYPosition(d, measureIndex) + (errorBarHeight / 2)).
        attr('x2', getMaxErrorBarXPosition).
        attr('y2', (d, measureIndex) => getErrorBarYPosition(d, measureIndex) + (errorBarHeight / 2));
    }

    // Note that renderXAxis(), renderYAxis() and renderSeries() all update the
    // elements that have been created by binding the data (which is done
    // inline in this function below).
    function renderSeries() {
      if (!isStacked && (referenceLines.length == 0)) {
        dimensionGroupSvgs.selectAll('.bar-underlay').
          attr('x', 0).
          attr('y', (d, measureIndex) => d3GroupingYScale(measureIndex)).
          attr('width', width).
          attr('height', Math.max(d3GroupingYScale.rangeBand() - 1, 0)).
          attr('stroke', 'none').
          attr('fill', 'transparent').
          attr(
            'data-default-fill',
            (d, measureIndex, dimensionIndex) => self.getColor(dimensionIndex, measureIndex, measureLabels));
      }

      const bars = dimensionGroupSvgs.selectAll('.bar');

      bars.
        attr(
          'x',
          (d, measureIndex, dimensionIndex) => {
            const position = positions[dimensionIndex][measureIndex];
            return d3XScale(position.start);
          }
        ).
        attr(
          'width',
          (d, measureIndex, dimensionIndex) => {
            const position = positions[dimensionIndex][measureIndex];
            const value = position.end - position.start;
            return Math.max(d3XScale(value) - d3XScale(0), 0);
          }
        ).
        attr('shape-rendering', 'crispEdges').
        attr('stroke', 'none').
        attr(
          'fill',
          (d, measureIndex, dimensionIndex) => self.getColor(dimensionIndex, measureIndex, measureLabels)
        ).
        attr(
          'data-default-fill',
          (d, measureIndex, dimensionIndex) => self.getColor(dimensionIndex, measureIndex, measureLabels)
        );

      if (isOneHundredPercentStacked) {
        bars.
          attr(
            'data-percent',
            (d, measureIndex, dimensionIndex) => positions[dimensionIndex][measureIndex].percent
          );
      }

      if (isStacked) {
        bars.
          attr('y', 0).
          attr('height', Math.max(d3DimensionYScale.rangeBand() - 1, 0));
      } else {
        bars.
          attr('y', (d, measureIndex) => d3GroupingYScale(measureIndex)).
          attr('height', Math.max(d3GroupingYScale.rangeBand() - 1, 0));
      }

      if (self.getShowValueLabels() && !isStacked && _.isUndefined(dataToRender.errorBars)) {

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
              return d3GroupingYScale(measureIndex) +
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
          html((d, measureIndex, dimensionIndex) => {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);

            if (_.isNil(d)) {
              return noValueLabel;
            } else if (d === otherLabel) {
              return otherLabel;
            } else if (_.isNumber(d)) {
              return ColumnFormattingHelpers.formatValueHTML(d, column, dataToRender, true);
            } else {
              return '';
            }
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
            const translateX = -dimensionLabelsWidth;
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
            const translateX = -dimensionLabelsWidth;
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

    function renderLegend() {
      const alreadyDisplayingLegendBar = (self.$container.find('.socrata-visualization-legend-bar-inner-container').length > 0);

      if (self.getShowLegend()) {

        const legendItems = self.getLegendItems({dataTableDimensionIndex, measureLabels, referenceLines});

        self.renderLegendBar(legendItems);
        self.attachLegendBarEventHandlers();

        if (!alreadyDisplayingLegendBar) {
          viewportHeight -= LEGEND_BAR_HEIGHT;
        }

      } else {

        self.removeLegendBar();

        if (alreadyDisplayingLegendBar) {
          viewportHeight += LEGEND_BAR_HEIGHT;
        }
      }
    }

    /**
     * 1. Prepare the data for rendering (unfortunately we need to do grouping
     *    on the client at the moment).
     */
    renderLegend();

    const isStacked = self.isStacked();
    const isOneHundredPercentStacked = _.get(self.getVif(), 'series[0].stacked.oneHundredPercent', false);

    groupedDataToRender = dataToRender.rows;
    numberOfGroups = groupedDataToRender.length;
    numberOfItemsPerGroup = isStacked ? 1 : dataToRender.rows[0].length - 1;

    // TODO: Figure out how we want to handle scaling modes.
    // // Compute height based on the x-axis scaling mode.
    // if (self.getYAxisScalingMode() === 'fit') {

    //   const barCount = numberOfGroups * maxBarsPerGroup;

    //   // We limit the total bar count to a constant defined at the top of
    //   // this file when not allowing panning so that the the labels do not
    //   // overlap each other.
    //   if (barCount >= MAX_BAR_COUNT_WITHOUT_PAN) {

    //     self.renderError(
    //       I18n.t(
    //         'shared.visualizations.charts.bar_chart.' +
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
    let positions;

    if (isOneHundredPercentStacked) {
      positions = self.getOneHundredPercentStackedPositionsForRange(groupedDataToRender, minXValue, maxXValue);
    } else if (isStacked) {
      positions = self.getStackedPositionsForRange(groupedDataToRender, minXValue, maxXValue)
    } else {
      positions = self.getPositionsForRange(groupedDataToRender, minXValue, maxXValue)
    }

    try {

      const dataMinXValue = getMinXValue(dataToRender, dataTableDimensionIndex, referenceLines);
      const dataMaxXValue = getMaxXValue(dataToRender, dataTableDimensionIndex, referenceLines);

      const dataMinSummedXValue = getMinSummedXValue(groupedDataToRender, dataTableDimensionIndex, referenceLines);
      const dataMaxSummedXValue = getMaxSummedXValue(groupedDataToRender, dataTableDimensionIndex, referenceLines);

      const measureAxisMinValue = self.getMeasureAxisMinValue();
      const measureAxisMaxValue = self.getMeasureAxisMaxValue();

      if (
        measureAxisMinValue &&
        measureAxisMaxValue &&
        measureAxisMinValue >= measureAxisMaxValue
      ) {

        self.renderError(
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      if (isOneHundredPercentStacked) {
        minXValue = self.getMinOneHundredPercentStackedValue(positions);
        maxXValue = self.getMaxOneHundredPercentStackedValue(positions);
      } else if (isStacked) {
        minXValue = measureAxisMinValue || Math.min(dataMinSummedXValue, 0);
        maxXValue = measureAxisMaxValue || Math.max(dataMaxSummedXValue, 0);
      } else {
        minXValue = measureAxisMinValue || Math.min(dataMinXValue, 0);
        maxXValue = measureAxisMaxValue || Math.max(dataMaxXValue, 0);
      }

      if (minXValue > maxXValue) {
        self.renderError(
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
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
    d3XAxis = generateXAxis(d3XScale, width);

    /**
     * 3. Set up the y-scale and -axis.
     */

    // This scale is used for dimension categories.
    d3DimensionYScale = generateYScale(
      dimensionValues,
      height,
      self.isGroupingOrMultiSeries()
    );

    // This scale is used for groupings of bars under a single dimension category.
    d3GroupingYScale = generateYGroupScale(
      self.getOrdinalDomainFromMeasureLabels(measureLabels),
      d3DimensionYScale);

    d3YAxis = generateYAxis(d3DimensionYScale, dimensionLabelsWidth);

    /**
     * 4. Clear out any existing chart.
     * TODO: This really needs to use d3's ability to update
     * elements in-place.
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
            `translate(${-dimensionLabelsWidth},0)` :
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
        'data-dimension-value-html',
        (d, dimensionIndex, measureIndex) => {
          const value = d[0];

          if (_.isNil(value)) {
            return NO_VALUE_SENTINEL;
          } else if (value === otherLabel) {
            return otherLabel;
          } else {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
            return ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender);
          }

      }).
      attr('transform', (d) => `translate(0,${d3DimensionYScale(d[0])})`);

    if (!isStacked) {

      barUnderlaySvgs = dimensionGroupSvgs.selectAll('rect.bar-underlay').
        data((d) => d.slice(1)).
        enter().
        append('rect');

      barUnderlaySvgs.
        attr('class', 'bar-underlay').
        attr(
          'data-dimension-value-html',
          (datum, measureIndex, dimensionIndex) => {
            const value = dimensionValues[dimensionIndex];

            if (_.isNil(value)) {
              return NO_VALUE_SENTINEL;
            } else if (value === otherLabel) {
              return otherLabel;
            } else {
              const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
              const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
              return ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender);
            }
          }
        ).
        attr(
          'data-dimension-index',
          (datum, measureIndex, dimensionIndex) => dimensionIndex
        ).
        attr(
          'data-measure-index',
          (datum, measureIndex) => measureIndex
        );
    }

    barSvgs = dimensionGroupSvgs.selectAll('rect.bar').
      data((d) => d.slice(1)).
      enter().
      append('rect');

    barSvgs.
      attr('class', 'bar').
      attr(
        'data-dimension-value-html',
        (datum, measureIndex, dimensionIndex) => {
          const value = dimensionValues[dimensionIndex];

          if (value === otherLabel) {
            return otherLabel;
          } else {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
            return ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender);
          }
        }
      ).
      attr(
        'data-dimension-index',
        (datum, measureIndex, dimensionIndex) => dimensionIndex
      ).
      attr(
        'data-measure-index',
        (datum, measureIndex) => measureIndex
      );

    referenceLineSvgs = seriesSvg.selectAll('line.reference-line').
      data(referenceLines).
      enter().
      append('line').
      attr('class', 'reference-line');

    referenceLineUnderlaySvgs = seriesSvg.selectAll('rect.reference-line-underlay').
      data(referenceLines).
      enter().
      append('rect').
      attr('class', 'reference-line-underlay');

      if (!_.isUndefined(dataToRender.errorBars)) {
      dimensionGroupSvgs.selectAll('line.error-bar-left').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-left');

      dimensionGroupSvgs.selectAll('line.error-bar-middle').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-middle');

      dimensionGroupSvgs.selectAll('line.error-bar-right').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-right');
    }

    if (self.getShowValueLabels()) {

      barTextSvgs = dimensionGroupSvgs.selectAll('text').
        data((d) => d.slice(1)).
        enter().
        append('text');

      barTextSvgs.
        attr(
          'data-dimension-value-html',
          (datum, measureIndex, dimensionIndex) => {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
            const value = dimensionValues[dimensionIndex];

            if (value === otherLabel) {
              return otherLabel;
            } else {
              return ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender);
            }
          }
        ).
        attr(
          'data-dimension-index',
          (datum, measureIndex, dimensionIndex) => dimensionIndex
        ).
        attr(
          'data-measure-index',
          (datum, measureIndex) => measureIndex
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
      renderReferenceLines();
      renderErrorBars();

      updateLabelWidthDragger(leftMargin, topMargin, height);
    // See TODO above.
    // }

    /**
     * 6. Set up event handlers for mouse interactions.
     */
    if (!isStacked) {

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
              const color = self.getColor(dimensionIndex, measureIndex, measureLabels);
              const label = measureLabels[measureIndex];

              // d3's .datum() method gives us the entire row, whereas everywhere
              // else measureIndex refers only to measure values. We therefore
              // add one to measure index to get the actual measure value from
              // the raw row data provided by d3 (the value at element 0 of the
              // array returned by .datum() is the dimension value).
              const value = d3.select(this.parentNode).datum()[measureIndex + 1];

              showBarHighlight(siblingBar);
              showBarFlyout(siblingBar, { measureIndex, color, label, value });
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
    }

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
            const color = self.getColor(dimensionIndex, measureIndex, measureLabels);
            const label = measureLabels[measureIndex];

            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];
            const percent = parseFloat(this.getAttribute('data-percent'));

            showBarHighlight(this);
            showBarFlyout(this, { measureIndex, color, label, value, percent });
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

    chartSvg.selectAll('.reference-line-underlay').
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
      on('mousemove', function() {
        if (!isCurrentlyPanning()) {
          const underlayWidth = parseInt($(this).attr('width'), 10);
          const flyoutOffset = {
            left: $(this).offset().left + (underlayWidth / 2) - window.scrollX,
            top: d3.event.clientY
          };

          self.showReferenceLineFlyout(this, referenceLines, isOneHundredPercentStacked, flyoutOffset);
          $(this).attr('fill-opacity', 1);
        }
      }).
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
      on('mouseleave',
        function() {
          if (!isCurrentlyPanning()) {
            hideFlyout();
            $(this).attr('fill-opacity', 0);
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
            const color = self.getColor(dimensionIndex, measureIndex, measureLabels);
            const label = measureLabels[measureIndex];

            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];
            const percent = parseFloat(this.getAttribute('data-percent'));

            showBarHighlight(siblingBar);
            showBarFlyout(siblingBar, { measureIndex, color, label, value, percent });
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
          (datum, dimensionIndex, measureIndex) => {

            if (!isCurrentlyPanning()) {
              let dimensionValue;

              if (_.isNil(datum[0])) {
                dimensionValue = NO_VALUE_SENTINEL;
              } else if (datum[0] === otherLabel) {
                dimensionValue = otherLabel;
              } else {
                const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
                const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
                dimensionValue = ColumnFormattingHelpers.formatValueHTML(datum[0], column, dataToRender);
              }

              // We need to find nodes with a data-dimension-value-html attribute matching dimensionValue.
              // We can't easily use a CSS selector because we lack a simple API to apply CSS-string escaping
              // rules.
              // There's a working draft for a CSS.escape and jQuery >= 3.0 has a $.escapeSelector,
              // but both of those are out of reach for us at the moment.
              //
              // Don't use a strict equality comparison in the filter as getAttribute returns a string and
              // dimensionValue may not be a string.
              //
              const dimensionGroup = d3.select(
                _(yAxisAndSeriesSvg.node().querySelectorAll('g.dimension-group[data-dimension-value-html]')).
                  filter((group) => group.getAttribute('data-dimension-value-html') == dimensionValue).
                  first()
              );

              if (dimensionGroup.empty()) {
                return;
              }

              const seriesElement = yAxisAndSeriesSvg.select('g.series')[0][0];
              showGroupFlyout(seriesElement, dimensionGroup, dimensionValues, positions);
            }
          }
        ).
        on(
          'mouseleave',
          () => {

            if (!isCurrentlyPanning()) {
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

  function generateYAxis(yScale, allowedLabelWidth) {
    // This sucks, but linear interpolation seems good enough.
    const allowedLabelCharCount = Math.ceil(allowedLabelWidth / DIMENSION_LABELS_PIXEL_PER_CHARACTER);

    function conditionallyTruncateLabel(label) {
      label = _.isEmpty(label) ? noValueLabel : label;

      return (label.length >= allowedLabelCharCount) ?
        `${label.substring(0, allowedLabelCharCount - 1).trim()}…` :
        label;
    }

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
          let label;

          if (_.isNil(d)) {
            label = noValueLabel;
          } else if (d === otherLabel) {
            label = otherLabel;
          } else {
            const column = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
            // NOTE: We must use plain text; our axes are SVG (not HTML).
            label = ColumnFormattingHelpers.formatValuePlainText(d, column, dataToRender, true);
          }

          return conditionallyTruncateLabel(label);
        // See TODO above.
        // }
      }).
      outerTickSize(0);
  }

  function getMinXValue(data, dimensionIndex, referenceLines) {
    const minRowValue = d3.min(
      data.rows.map(
        (row) => d3.min(
          row.slice(dimensionIndex + 1)
        )
      )
    );

    const minReferenceLinesValue = d3.min(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    if (_.isUndefined(data.errorBars)) {
      return d3.min([minRowValue, minReferenceLinesValue]);
    }

    const minErrorBarValue = d3.min(
      data.errorBars.map(
        (row) => d3.min(
          row.slice(dimensionIndex + 1).map(
            (errorBarValues) => d3.min(
              errorBarValues.map(
                (errorBarValue) => errorBarValue || 0)
            )
          )
        )
      )
    );

    return d3.min([minRowValue, minReferenceLinesValue, minErrorBarValue]);
  }

  function getMaxXValue(data, dimensionIndex, referenceLines) {
    const maxRowValue = d3.max(
      data.rows.map(
        (row) => d3.max(
          row.slice(dimensionIndex + 1)
        )
      )
    );

    const maxReferenceLinesValue = d3.max(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    if (_.isUndefined(data.errorBars)) {
      return d3.max([maxRowValue, maxReferenceLinesValue]);
    }

    const maxErrorBarValue = d3.max(
      data.errorBars.map(
        (row) => d3.max(
          row.slice(dimensionIndex + 1).map(
            (errorBarValues) => d3.max(
              errorBarValues.map(
                (errorBarValue) => errorBarValue || 0)
            )
          )
        )
      )
    );

    return d3.max([maxRowValue, maxReferenceLinesValue, maxErrorBarValue]);
  }

  function getMinSummedXValue(groupedData, dimensionIndex, referenceLines) {
    const minRowValue = d3.min(
      groupedData.map(
        (row) => d3.sum(
          _.filter(row.slice(dimensionIndex + 1), (i) => i < 0)
        )
      )
    );

    const minReferenceLinesValue = d3.min(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.min([minRowValue, minReferenceLinesValue]);
  }

  function getMaxSummedXValue(groupedData, dimensionIndex, referenceLines) {
    const maxRowValue = d3.max(
      groupedData.map(
        (row) => d3.sum(
          _.filter(row.slice(dimensionIndex + 1), (i) => i > 0)
        )
      )
    );

    const maxReferenceLinesValue = d3.max(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.max([maxRowValue, maxReferenceLinesValue]);
  }

  function generateXScale(minValue, maxValue, width) {
    return d3.scale.linear().
      domain([minValue, maxValue]).
      range([0, width]);
  }

  function generateXAxis(xScale, width) {
    const isOneHundredPercentStacked = _.get(self.getVif(), 'series[0].stacked.oneHundredPercent', false);
    let formatter;

    if (isOneHundredPercentStacked) {
      formatter = d3.format('.0%'); // rounds to a whole number percentage
    } else {
      const column = _.get(self.getVif(), `series[0].dataSource.measure.columnName`);
      formatter = (d) => ColumnFormattingHelpers.formatValueHTML(d, column, dataToRender, true);
    }

    const axis = d3.svg.axis().
      scale(xScale).
      orient('top').
      tickFormat(formatter);

    if (width <= SMALL_VIEWPORT_WIDTH) {
      axis.ticks(Math.ceil(width / 100));
    }

    return axis;
  }

  function getSeriesIndexByMeasureIndex(measureIndex) {
    const columnName = _.get(self.getVif(), 'series[0].dataSource.dimension.grouping.columnName');
    return _.isEmpty(columnName) ? measureIndex : 0;
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

  function showGroupFlyout(seriesElement, groupElement, dimensionValues, positions) {
    const titleHTML = groupElement.attr('data-dimension-value-html');

    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).html(
          (titleHTML === NO_VALUE_SENTINEL) ? noValueLabel : titleHTML
        )
      );
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    const dimensionValue = groupElement.data()[0][0];
    const dimensionIndex = dimensionValues.indexOf(dimensionValue);
    const measureValues = groupElement.data()[0].slice(1);

    let $labelValueRows;

    // 0th element of row data is always the dimension, everything after that
    // is a measure value.
    $labelValueRows = measureValues.map((value, measureIndex) => {
      const label = measureLabels[measureIndex];

      const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
        text(label).
        css('color', self.getColor(dimensionIndex, measureIndex, measureLabels));
      const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
      const unitOne = self.getUnitOneBySeriesIndex(
        getSeriesIndexByMeasureIndex(measureIndex)
      );
      const unitOther = self.getUnitOtherBySeriesIndex(
        getSeriesIndexByMeasureIndex(measureIndex)
      );

      let valueHTML;

      if (value === null) {
        valueHTML = noValueLabel;
      } else {
        const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
        const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
        valueHTML = ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender, true);

        if (value === 1) {
          valueHTML += ` ${_.escape(unitOne)}`;
        } else {
          valueHTML += ` ${_.escape(unitOther)}`;
        }
      }

      const percent = parseFloat(positions[dimensionIndex][measureIndex].percent);
      const percentSymbol = I18n.t('shared.visualizations.charts.common.percent_symbol');
      const percentAsString = isNaN(percent) ? '' : `(${Math.round(percent)}${percentSymbol})`;

      $valueCell.html(`${valueHTML} ${percentAsString}`);

      return $('<tr>', {'class': 'socrata-flyout-row'}).
        append([
          $labelCell,
          $valueCell
        ]);
    });

    $table.append($labelValueRows);

    const payload = {
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
      const flyoutElementBoundingClientRect = groupElement[0][0].getBoundingClientRect();
      const flyoutElementHeight = flyoutElementBoundingClientRect.height;
      const flyoutElementTopOffset = flyoutElementBoundingClientRect.top;

      const maxEnd = _.max(positions[dimensionIndex].map((position) => position.end));
      const seriesBoundingClientRect = seriesElement.getBoundingClientRect();
      const flyoutLeftOffset = seriesBoundingClientRect.left + d3XScale(maxEnd);

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

  function showBarFlyout(barElement, { measureIndex, color, label, value, percent }) {
    const titleHTML = barElement.getAttribute('data-dimension-value-html') || noValueLabel;
    const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);

    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).html(
          (titleHTML) ? titleHTML : ''
        )
      );
    const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', color);
    const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
    const $valueRow = $('<tr>', {'class': 'socrata-flyout-row'});
    const $table = $('<table>', {'class': 'socrata-flyout-table'});

    let valueHTML;

    if (value === null) {
      valueHTML = noValueLabel;
    } else {
      const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
      const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
      valueHTML = ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender, true);

      if (value === 1) {
        valueHTML += ` ${_.escape(self.getUnitOneBySeriesIndex(seriesIndex))}`;
      } else {
        valueHTML += ` ${_.escape(self.getUnitOtherBySeriesIndex(seriesIndex))}`;
      }
    }

    const percentSymbol = I18n.t('shared.visualizations.charts.common.percent_symbol');
    const percentAsString = isNaN(percent) ? '' : `(${Math.round(percent)}${percentSymbol})`;

    $valueCell.html(`${valueHTML} ${percentAsString}`);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $title,
      $valueRow
    ]);

    const payload = {
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
