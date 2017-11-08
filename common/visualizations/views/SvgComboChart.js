// Vendor Imports
import d3 from 'd3';
import _ from 'lodash';
import $ from 'jquery';
import utils from 'common/js_utils';

// Project Imports
import {
  formatValueHTML,
  formatValuePlainText
} from '../helpers/ColumnFormattingHelpers';
import SvgVisualization from './SvgVisualization';
import I18n from 'common/i18n';

// Constants
import {
  AXIS_LABEL_MARGIN,
  DEFAULT_CIRCLE_HIGHLIGHT_RADIUS,
  DEFAULT_LINE_HIGHLIGHT_FILL,
  ERROR_BARS_DEFAULT_BAR_COLOR,
  ERROR_BARS_MAX_END_BAR_LENGTH,
  ERROR_BARS_STROKE_WIDTH,
  LEGEND_BAR_HEIGHT,
  REFERENCE_LINES_STROKE_DASHARRAY,
  REFERENCE_LINES_STROKE_WIDTH,
  REFERENCE_LINES_UNDERLAY_THICKNESS
} from './SvgStyleConstants';

import { getMeasures } from '../helpers/measure';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
// The LEFT and RIGHT margins has been removed because it will be dynamically calculated.
const MARGINS = {
  TOP: 32,
  BOTTOM: 0
};

const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const COMBO_CHART_COLUMN = 'comboChart.column';
const COMBO_CHART_LINE = 'comboChart.line';
const DEFAULT_DESKTOP_COLUMN_WIDTH = 14;
const DEFAULT_MOBILE_COLUMN_WIDTH = 50;
const DIMENSION_LABELS_FIXED_HEIGHT = 88;
const DIMENSION_LABELS_ROTATION_ANGLE = 82.5;
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_MAX_CHARACTERS = 8;
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const LABEL_NO_VALUE = I18n.t('shared.visualizations.charts.common.no_value');
const LABEL_OTHER = I18n.t('shared.visualizations.charts.common.other_category');
const LABEL_PADDING_WIDTH = 15;
const MEASURE_LABELS_FONT_COLOR = '#5e5e5e';
const MEASURE_LABELS_FONT_SIZE = 14;
const MINIMUM_LABEL_WIDTH = 35;

function SvgComboChart($element, vif, options) {
  const self = this;
  // Embeds needs to wait to define noValueLabel until after hydration.
  const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');

  let $chartElement;
  let dataToRender;
  let d3DimensionXScale;
  let d3GroupingXScale;
  let d3PrimaryYScale;
  let d3SecondaryYScale;
  let lastRenderedSeriesWidth = 0;
  let lastRenderedZoomTranslate = 0;
  let measureLabels;
  let measures;
  let referenceLines;

  _.extend(this, new SvgVisualization($element, vif, options));

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData, newColumns) {

    if (!newData && !dataToRender && !newColumns) {
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
      this.addSeriesIndices(dataToRender);
    }

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    renderData();
  };

  this.addSeriesIndices = (dataToRender) => {

    dataToRender.seriesIndices = [null]; // first column is dimension

    for (var i = 0; i < dataToRender.columns.length - 1; i++) {
      dataToRender.seriesIndices.push(i);
    }
  };

  this.invalidateSize = () => {

    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  this.destroy = () => {

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
        'class': 'combo-chart'
      }
    );

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  function renderData() {
    const columnWidth = self.isMobile() ?
      DEFAULT_MOBILE_COLUMN_WIDTH :
      DEFAULT_DESKTOP_COLUMN_WIDTH;

    const axisLabels = self.getAxisLabels();
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);
    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);
    const d3ClipPathId = `combo-chart-clip-path-${_.uniqueId()}`;
    const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
    const dimensionValues = dataToRender.rows.map((row) => row[dataTableDimensionIndex]);
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

    } else {

      // Grouped column charts will have multiple columns. If one of those columns is null (which is
      // a valid value for it to be if there are nulls in the dataset), we need to replace it with
      // the no value label. If there are not multiple columns, that's an expected null that we
      // should not overwrite with the no value label.

      measureLabels = columns.map((column) => {
        return self.isGrouping() ? column || LABEL_NO_VALUE : column;
      });
    }

    measures = getMeasures(self, dataToRender);
    referenceLines = self.getReferenceLines();

    let chartSvg;
    let circlePositions;
    let circleSvgs;
    let clipPathSvg;
    let columnPositions;
    let columnSvgs;
    let columnUnderlaySvgs;
    let d3PrimaryYAxis;
    let d3SecondaryYAxis;
    let d3XAxis;
    let d3Zoom;
    let dimensionGroupSvgs;
    let height;
    let linePositions;
    let lineSvgs;
    let numberOfGroups;
    let numberOfItemsPerGroup;
    let primaryYAxisBound = false;
    let primaryYAxisMaxValue;
    let primaryYAxisMinValue;
    let referenceLineSvgs;
    let referenceLineUnderlaySvgs;
    let secondaryYAxisBound = false;
    let secondaryYAxisMaxValue;
    let secondaryYAxisMinValue;
    let seriesSvg;
    let viewportSvg;
    let width;
    let xAxisAndSeriesSvg;
    let xAxisBound = false;
    let xAxisPanDistance;
    let xAxisPanningEnabled;

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
            data(dataToRender.rows);

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

      if (primaryYAxisMinValue > 0) {
        baselineValue = primaryYAxisMinValue;
      } else if (primaryYAxisMaxValue < 0) {
        baselineValue = primaryYAxisMaxValue;
      } else {
        baselineValue = 0;
      }

      xBaselineSvg.
        attr(
          'transform',
          'translate(0,{0})'.format(d3PrimaryYScale(baselineValue))
        );

      xBaselineSvg.selectAll('line, path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    function bindPrimaryYAxisOnce() {

      if (!primaryYAxisBound) {

        chartSvg.
          select('.y.axis').
            call(d3PrimaryYAxis);

        chartSvg.
          select('.y.grid').
            call(
              d3PrimaryYAxis.
                tickSize(viewportWidth).
                tickFormat('')
            );

        primaryYAxisBound = true;
      }
    }

    function renderPrimaryYAxis() {

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderYAxis() as idempotent.
      bindPrimaryYAxisOnce();

      const yAxisSvg = chartSvg.select('.y.axis');

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

      const yGridSvg = chartSvg.select('.y.grid');

      yGridSvg.
        attr('transform', `translate(${viewportWidth},0)`);

      yGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      yGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    function bindSecondaryYAxisOnce() {

      if (!secondaryYAxisBound) {

        chartSvg.
          select('.y.secondaryAxis').
            call(d3SecondaryYAxis);

        chartSvg.
          select('.y.secondaryGrid').
            call(
              d3SecondaryYAxis.
                tickSize(viewportWidth).
                tickFormat('')
            );

        secondaryYAxisBound = true;
      }
    }

    function renderSecondaryYAxis() {

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderYAxis() as idempotent.
      bindSecondaryYAxisOnce();

      const yAxisSvg = chartSvg.select('.y.secondaryAxis');

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

      const yGridSvg = chartSvg.select('.y.secondaryGrid');

      yGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');
    }

    function renderReferenceLines() {
      // Because the line stroke thickness is 2px, the half of the line can be clipped on the top or bottom edge
      // of the chart area.  This function shifts the clipped line down 1 pixel when at the top edge and up 1 pixel
      // when at the bottom edge.  All the other lines are rendered in normal positions.
      const getYPosition = (referenceLine) => {
        const value = referenceLine.value;

        if (value == primaryYAxisMaxValue) {
          return d3PrimaryYScale(value) + 1; // shift down a pixel if at the top of chart area
        } else if (value == primaryYAxisMinValue) {
          return d3PrimaryYScale(value) - 1; // shift up a pixel if at the bottom of chart area
        } else {
          return d3PrimaryYScale(value);
        }
      };

      const getLineThickness = (referenceLine) => {
        const value = referenceLine.value;
        return self.isInRange(value, primaryYAxisMinValue, primaryYAxisMaxValue) ? REFERENCE_LINES_STROKE_WIDTH : 0;
      };

      const getUnderlayThickness = (referenceLine) => {
        const value = referenceLine.value;
        return self.isInRange(value, primaryYAxisMinValue, primaryYAxisMaxValue) ? REFERENCE_LINES_UNDERLAY_THICKNESS : 0;
      };

      // This places the underlay half above the line and half below the line.
      const underlayUpwardShift = (REFERENCE_LINES_UNDERLAY_THICKNESS) / 2;

      referenceLineUnderlaySvgs.
        attr('data-reference-line-index', (referenceLine, index) => index).
        attr('fill', DEFAULT_LINE_HIGHLIGHT_FILL).
        attr('fill-opacity', 0).
        attr('x', 0).
        attr('y', (referenceLine) => getYPosition(referenceLine) - underlayUpwardShift).
        attr('width', width).
        attr('height', getUnderlayThickness);

      referenceLineSvgs.
        attr('shape-rendering', 'crispEdges').
        attr('stroke', (referenceLine) => referenceLine.color).
        attr('stroke-dasharray', REFERENCE_LINES_STROKE_DASHARRAY).
        attr('stroke-width', getLineThickness).
        attr('x1', 0).
        attr('y1', getYPosition).
        attr('x2', width).
        attr('y2', getYPosition);
    }

    function renderErrorBars() {
      if (_.isUndefined(dataToRender.errorBars)) {
        return;
      }

      const d3ColumnYScale = isUsingSecondaryAxisForColumns() ? d3SecondaryYScale : d3PrimaryYScale;

      const columnWidth = d3GroupingXScale.rangeBand() - 1;
      const errorBarWidth = Math.min(columnWidth, ERROR_BARS_MAX_END_BAR_LENGTH);
      const color = _.get(self.getVif(), 'series[0].errorBars.barColor', ERROR_BARS_DEFAULT_BAR_COLOR);

      const getMinErrorBarPosition = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        const minValue = _.clamp(d3.min(errorBarValues), primaryYAxisMinValue, primaryYAxisMaxValue);
        return d3ColumnYScale(minValue);
      };

      const getMaxErrorBarYPosition = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        const maxValue = _.clamp(d3.max(errorBarValues), primaryYAxisMinValue, primaryYAxisMaxValue);
        return d3ColumnYScale(maxValue);
      };

      // Because the line stroke thickness is 2px, the half of the top horizontal bar is clipped.  This function shifts
      // the clipped bar down 1 pixel.  All the other bars are rendered in normal positions.
      const getMaxErrorBarYPositionAdjusted = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        const maxValue = _.clamp(d3.max(errorBarValues), primaryYAxisMinValue, primaryYAxisMaxValue);
        return (maxValue == primaryYAxisMaxValue) ? d3ColumnYScale(maxValue) + 1 : d3ColumnYScale(maxValue); // shift down a pixel if at top of viewport
      };

      const getMinErrorBarWidth = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        return self.isInRange(d3.min(errorBarValues), primaryYAxisMinValue, primaryYAxisMaxValue) ? ERROR_BARS_STROKE_WIDTH : 0;
      };

      const getMaxErrorBarWidth = (d, measureIndex, dimensionIndex) => {
        const errorBarValues = dataToRender.errorBars[dimensionIndex][measureIndex + 1]; // 0th column holds the dimension value
        return self.isInRange(d3.max(errorBarValues), primaryYAxisMinValue, primaryYAxisMaxValue) ? ERROR_BARS_STROKE_WIDTH : 0;
      };

      const getErrorBarXPosition = (d, measureIndex) => {
        return ((columnWidth - errorBarWidth) / 2) + d3GroupingXScale(measureIndex);
      };

      dimensionGroupSvgs.selectAll('.error-bar-bottom').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', getMinErrorBarWidth).
        attr('x1', getErrorBarXPosition).
        attr('y1', getMinErrorBarPosition).
        attr('x2', (d, measureIndex) => getErrorBarXPosition(d, measureIndex) + errorBarWidth).
        attr('y2', getMinErrorBarPosition);

      dimensionGroupSvgs.selectAll('.error-bar-top').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', getMaxErrorBarWidth).
        attr('x1', getErrorBarXPosition).
        attr('y1', getMaxErrorBarYPositionAdjusted).
        attr('x2', (d, measureIndex) => getErrorBarXPosition(d, measureIndex) + errorBarWidth).
        attr('y2', getMaxErrorBarYPositionAdjusted);

      dimensionGroupSvgs.selectAll('.error-bar-middle').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', color).
        attr('stroke-width', ERROR_BARS_STROKE_WIDTH).
        attr('x1', (d, measureIndex) => getErrorBarXPosition(d, measureIndex) + (errorBarWidth / 2)).
        attr('y1', getMinErrorBarPosition).
        attr('x2', (d, measureIndex) => getErrorBarXPosition(d, measureIndex) + (errorBarWidth / 2)).
        attr('y2', getMaxErrorBarYPosition);
    }

    // Note that renderXAxis(), renderYAxis(), renderColumnSeries(), etc. all update the elements that have been
    // created by binding the data (which is done inline in this function below).
    //
    function renderColumnSeries() {
      const getColor = (d, measureIndex) => {
        const measure = measures[measureIndex];
        utils.assert(measureIndex === measure.measureIndex);
        return measure.getColor();
      };

      const getDataDimensionValueHtml = (d, measureIndex, dimensionIndex) => {
        const value = dimensionValues[dimensionIndex];

        if (_.isNil(value)) {
          return LABEL_NO_VALUE;
        } else if (value === LABEL_OTHER) {
          return LABEL_OTHER;
        } else {
          const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
          const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
          return formatValueHTML(value, column, dataToRender);
        }
      };

      // Column underlays
      //
      dimensionGroupSvgs.selectAll('.column-underlay').
        attr('data-default-fill', getColor).
        attr('data-dimension-index', (d, measureIndex, dimensionIndex) => dimensionIndex).
        attr('data-dimension-value-html', getDataDimensionValueHtml).
        attr('data-measure-index', (d, measureIndex) => measureIndex).
        attr('fill', 'transparent').
        attr('height', height).
        attr('stroke', 'none').
        attr('width', Math.max(d3GroupingXScale.rangeBand() - 1, 0)).
        attr('x', (d, measureIndex) => d3GroupingXScale(measureIndex)).
        attr('y', 0);

      // Columns
      //
      const d3ColumnYScale = isUsingSecondaryAxisForColumns() ? d3SecondaryYScale : d3PrimaryYScale;

      dimensionGroupSvgs.selectAll('.column').
        attr(
          'y',
          (d, measureIndex, dimensionIndex) => {
            const position = columnPositions[dimensionIndex][measureIndex];
            return d3ColumnYScale(position.end);
          }
        ).
        attr(
          'height',
          (d, measureIndex, dimensionIndex) => {
            const position = columnPositions[dimensionIndex][measureIndex];
            const value = position.end - position.start;
            return Math.max(d3ColumnYScale(0) - d3ColumnYScale(value), 0);
          }
        ).
        attr('data-default-fill', getColor).
        attr('data-dimension-index', (d, measureIndex, dimensionIndex) => dimensionIndex).
        attr('data-dimension-value-html', getDataDimensionValueHtml).
        attr('data-measure-index', (d, measureIndex) => measureIndex).
        attr('fill', getColor).
        attr('shape-rendering', 'crispEdges').
        attr('stroke', 'none').
        attr('x', (d, measureIndex) => d3GroupingXScale(measureIndex)).
        attr('width', Math.max(d3GroupingXScale.rangeBand() - 1, 0));

      lastRenderedSeriesWidth = xAxisAndSeriesSvg.node().getBBox().width;
    }

    function renderLineSeries() {
      const d3LineYScale = isUsingSecondaryAxisForLines() ? d3SecondaryYScale : d3PrimaryYScale;

      const getLineColor = (d) => {
        const measure = measures[d[0].seriesIndex];
        utils.assert(d[0].seriesIndex === measure.measureIndex);
        return measure.getColor();
      };

      const getLine = (d) => d3.svg.line().x(getX).y(getY)(d);
      const getX = (d) => d3DimensionXScale(dimensionValues[d.dimensionIndex]) + Math.max((d3DimensionXScale.rangeBand() - 1) / 2, 0);
      const getY = (d) => d3LineYScale(d.value);
      const getDimensionIndex = (d) => d.dimensionIndex;
      const getSeriesIndex = (d) => d.seriesIndex;
      const getDataDimensionValueHtml = (d) => {
        const value = dimensionValues[d.dimensionIndex];

        if (_.isNil(value)) {
          return LABEL_NO_VALUE;
        } else if (value === LABEL_OTHER) {
          return LABEL_OTHER;
        } else {
          const column = _.get(self.getVif(), `series[${d.seriesIndex}].dataSource.dimension.columnName`);
          return formatValueHTML(value, column, dataToRender);
        }
      };

      lineSvgs.
        attr('d', getLine).
        attr('stroke', getLineColor);

      circleSvgs.
        attr('cx', getX).
        attr('cy', getY).
        attr('data-default-fill', 'transparent').
        attr('data-dimension-index', getDimensionIndex).
        attr('data-dimension-value-html', getDataDimensionValueHtml).
        attr('data-measure-index', getSeriesIndex).
        attr('fill', 'transparent').
        attr('r', DEFAULT_CIRCLE_HIGHLIGHT_RADIUS);
    }

    function handleZoom() {
      lastRenderedZoomTranslate = _.clamp(
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

      lastRenderedZoomTranslate = _.clamp(
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

    function renderLegend() {
      const alreadyDisplayingLegendBar = (self.$container.find('.socrata-visualization-legend-bar-inner-container').length > 0);

      if (self.getShowLegend()) {
        const legendItems = self.getLegendItems({ dataTableDimensionIndex, measures, referenceLines });
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

    function getMaxMinYValues(dataToRender, measureAxisMaxValue, measureAxisMinValue, referenceLines) {
      let minYValue;
      let maxYValue;

      const dataMinYValue = getMinYValue(dataToRender, dataTableDimensionIndex, referenceLines);
      const dataMaxYValue = getMaxYValue(dataToRender, dataTableDimensionIndex, referenceLines);

      if (self.getYAxisScalingMode() === 'showZero' && !measureAxisMinValue) {
        minYValue = Math.min(dataMinYValue, 0);
      } else if (measureAxisMinValue) {
        minYValue = measureAxisMinValue;
      } else {
        minYValue = dataMinYValue;
      }

      if (self.getYAxisScalingMode() === 'showZero' && !measureAxisMaxValue) {
        maxYValue = Math.max(dataMaxYValue, 0);
      } else if (measureAxisMaxValue) {
        maxYValue = measureAxisMaxValue;
      } else {
        maxYValue = dataMaxYValue;
      }

      return { maxYValue, minYValue };
    }

    /**
     * 1. Prepare the data for rendering (unfortunately we need to do grouping
     *    on the client at the moment).
     */
    renderLegend();

    const columnDataToRender = getDataToRenderOfSeriesType(dataToRender, COMBO_CHART_COLUMN);
    const lineDataToRender = getDataToRenderOfSeriesType(dataToRender, COMBO_CHART_LINE);

    // Get the data for primary and secondary axes
    //
    let primaryAxisDataToRender;
    let secondaryAxisDataToRender;

    if (isUsingSecondaryAxisForColumns() && !isUsingSecondaryAxisForLines()) {
      primaryAxisDataToRender = lineDataToRender;
      secondaryAxisDataToRender = columnDataToRender;
    } else if (!isUsingSecondaryAxisForColumns() && isUsingSecondaryAxisForLines()) {
      primaryAxisDataToRender = columnDataToRender;
      secondaryAxisDataToRender = lineDataToRender;
    } else if (!isUsingSecondaryAxisForColumns() && !isUsingSecondaryAxisForLines()) {
      primaryAxisDataToRender = dataToRender;
      secondaryAxisDataToRender = null;
    } else {
      primaryAxisDataToRender = null;
      secondaryAxisDataToRender = dataToRender;
    }

    // Get the left and right margins and viewportWidth
    //
    const leftMargin = calculateLeftRightMargin(primaryAxisDataToRender, viewportHeight, 'left') + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);
    const rightMargin = calculateLeftRightMargin(secondaryAxisDataToRender, viewportHeight, 'right') + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);

    numberOfGroups = dataToRender.rows.length;
    numberOfItemsPerGroup = columnDataToRender.rows[0].length - 1;

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
      columnWidth * numberOfGroups * numberOfItemsPerGroup
    );

    // Compute height based on the presence or absence of x-axis data labels.
    if (self.getShowDimensionLabels()) {
      height = Math.max(0, viewportHeight - DIMENSION_LABELS_FIXED_HEIGHT);
    } else {
      // In this case we want to mirror the top margin on the bottom so
      // that the chart is visually centered (column charts have no bottom
      // margin by default).
      height = Math.max(0, viewportHeight - MARGINS.TOP);
    }

    /**
     * 2. Set up the x-scale and -axis.
     */

    // This scale is used for dimension categories.
    d3DimensionXScale = generateXScale(
      dimensionValues,
      width,
      self.isGroupingOrMultiSeries()
    );

    // This scale is used for groupings of columns under a single dimension
    // category.
    d3GroupingXScale = generateXGroupScale(
      _.range(0, columnDataToRender.rows[0].length - 1),
      d3DimensionXScale);

    d3XAxis = generateXAxis(d3DimensionXScale);

    /**
     * 3. Set up the y-scale and y-axis.
     */

    try {
      // Get primary measure axis bounds
      //
      const primaryMeasureAxisMinValue = self.getMeasureAxisMinValue();
      const primaryMeasureAxisMaxValue = self.getMeasureAxisMaxValue();

      if (
        primaryMeasureAxisMinValue &&
        primaryMeasureAxisMaxValue &&
        primaryMeasureAxisMinValue >= primaryMeasureAxisMaxValue
      ) {

        self.renderError(
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      // Get secondary measure axis bounds
      //
      const secondaryMeasureAxisMinValue = self.getSecondaryMeasureAxisMinValue();
      const secondaryMeasureAxisMaxValue = self.getSecondaryMeasureAxisMaxValue();

      if (
        secondaryMeasureAxisMinValue &&
        secondaryMeasureAxisMaxValue &&
        secondaryMeasureAxisMinValue >= secondaryMeasureAxisMaxValue
      ) {

        self.renderError(
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      // Get max and min for primary Y axis
      //
      if (isUsingPrimaryAxis()) {

        let primaryAxisMaxMinYValues = getMaxMinYValues(
          primaryAxisDataToRender,
          primaryMeasureAxisMaxValue,
          primaryMeasureAxisMinValue,
          referenceLines // reference lines use the primary axis
        );

        (
          {
            maxYValue: primaryYAxisMaxValue,
            minYValue: primaryYAxisMinValue
          } = primaryAxisMaxMinYValues
        );

        if (primaryYAxisMinValue > primaryYAxisMaxValue) {
          self.renderError(
            I18n.t(
              'shared.visualizations.charts.common.validation.errors.' +
              'measure_axis_biggest_value_should_be_more_than_min_limit'
            )
          );
          return;
        }
      }

      // Get max and min for secondary Y axis
      //
      if (isUsingSecondaryAxis()) {

        let secondaryAxisMaxMinYValues = getMaxMinYValues(
          secondaryAxisDataToRender,
          secondaryMeasureAxisMaxValue,
          secondaryMeasureAxisMinValue
        );

        (
          {
            maxYValue: secondaryYAxisMaxValue,
            minYValue: secondaryYAxisMinValue
          } = secondaryAxisMaxMinYValues
        );

        if (secondaryYAxisMinValue > secondaryYAxisMaxValue) {
          self.renderError(
            I18n.t(
              'shared.visualizations.charts.common.validation.errors.' +
              'measure_axis_biggest_value_should_be_more_than_min_limit'
            )
          );
          return;
        }
      }

    } catch (error) {
      self.renderError(error.message);
      return;
    }

    // Get the column positions
    //
    columnPositions = getColumnPositions(
      columnDataToRender,
      isUsingSecondaryAxisForColumns() ? secondaryYAxisMaxValue : primaryYAxisMaxValue,
      isUsingSecondaryAxisForColumns() ? secondaryYAxisMinValue : primaryYAxisMinValue
    );

    // Get the line positions
    //
    linePositions = getLinePositions(
      lineDataToRender,
      isUsingSecondaryAxisForLines() ? secondaryYAxisMaxValue : primaryYAxisMaxValue,
      isUsingSecondaryAxisForLines() ? secondaryYAxisMinValue : primaryYAxisMinValue
    );

    // Get the circle positions
    //
    circlePositions = _.flatten(linePositions);

    // Get the Y scales
    //
    if (isUsingPrimaryAxis()) {
      d3PrimaryYScale = generateYScale(primaryYAxisMinValue, primaryYAxisMaxValue, height);
      d3PrimaryYAxis = generateYAxis(d3PrimaryYScale, 'left');
    }

    if (isUsingSecondaryAxis()) {
      d3SecondaryYScale = generateYScale(secondaryYAxisMinValue, secondaryYAxisMaxValue, height);
      d3SecondaryYAxis = generateYAxis(d3SecondaryYScale, 'right');
    }

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
      attr('width', width + leftMargin + rightMargin).
      attr('height', viewportHeight + topMargin + bottomMargin);

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
      attr('width', viewportWidth).
      attr('height', viewportHeight + topMargin + bottomMargin);

    viewportSvg.append('g').
      attr('class', 'y axis');

    viewportSvg.append('g').
      attr('class', 'y grid');

    viewportSvg.append('g').
      attr('class', 'y secondaryAxis').
      attr('transform', `translate(${viewportWidth}, 0)`);

    viewportSvg.append('g').
      attr('class', 'y secondaryGrid');

    // This <rect> exists to capture mouse actions on the chart, but not
    // directly on the columns or labels, that should result in a pan behavior.
    // If we set stroke and fill to none, the mouse events don't seem to get
    // picked up, so we instead set opacity to 0.
    viewportSvg.append('rect').
      attr('class', 'dragger').
      attr('width', width).
      attr('height', viewportHeight).
      attr('opacity', 0);

    // The x-axis and series are groups since they all need to conform to the
    // same clip path for the appearance of panning to be upheld.
    xAxisAndSeriesSvg = viewportSvg.append('g').
      attr('class', 'x-axis-and-series').
      attr('clip-path', 'url(#' + d3ClipPathId + ')');

    xAxisAndSeriesSvg.append('g').
      attr('class', 'series');

    seriesSvg = xAxisAndSeriesSvg.select('.series');

    dimensionGroupSvgs = seriesSvg.selectAll('.dimension-group').
      data(columnDataToRender.rows).
      enter().
      append('g');

    dimensionGroupSvgs.
      attr('class', 'dimension-group').
      attr('data-dimension-value-html', (datum, dimensionIndex, measureIndex) => {
        if (_.isNil(datum[0])) {
          return LABEL_NO_VALUE;
        } else if (datum[0] === LABEL_OTHER) {
          return LABEL_OTHER;
        } else {
          const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
          const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
          return formatValueHTML(datum[0], column, dataToRender);
        }
      }).
      attr('transform', (d) => `translate(${d3DimensionXScale(d[0])},0)`);

    columnUnderlaySvgs = dimensionGroupSvgs.selectAll('rect.column-underlay').
      data((d) => d.slice(1)).
      enter().
      append('rect').
      attr('class', 'column-underlay');

    columnSvgs = dimensionGroupSvgs.selectAll('rect.column').
      data((d) => d.slice(1)).
      enter().
      append('rect').
      attr('class', 'column');

    lineSvgs = seriesSvg.selectAll('path.line-series').
      data(linePositions).
      enter().
      append('path').
      attr('class', 'line-series');

    circleSvgs = seriesSvg.selectAll('circle.circle-series').
      data(circlePositions).
      enter().
      append('circle').
      attr('class', 'circle-series');

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
      dimensionGroupSvgs.selectAll('line.error-bar-top').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-top');

      dimensionGroupSvgs.selectAll('line.error-bar-middle').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-middle');

      dimensionGroupSvgs.selectAll('line.error-bar-bottom').
        data((d) => d.slice(1)).
        enter().
        append('line').
        attr('class', 'error-bar-bottom');
    }

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
    renderColumnSeries();
    renderLineSeries();

    // This is the actual rendered width (which accounts for the labels
    // extending beyond what d3 considers the right edge of the chart on
    // account of their being rotated 45 degrees.
    width = xAxisAndSeriesSvg.node().getBBox().width;

    xAxisPanDistance = width - viewportWidth;
    xAxisPanningEnabled = xAxisPanDistance > 0;

    if (xAxisPanningEnabled) {
      self.showPanningNotice();
      viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

      if (self.getShowDimensionLabels()) {
        // Note that we need to recompute height here since
        // $chartElement.height() may have changed when we showed the panning
        // notice.
        height = Math.max(0, viewportHeight - DIMENSION_LABELS_FIXED_HEIGHT);
      } else {
        height = Math.max(0, viewportHeight - MARGINS.TOP);
      }

      if (isUsingPrimaryAxis()) {
        d3PrimaryYScale = generateYScale(primaryYAxisMinValue, primaryYAxisMaxValue, height);
        d3PrimaryYAxis = generateYAxis(d3PrimaryYScale, 'left');
      }

      if (isUsingSecondaryAxis()) {
        d3SecondaryYScale = generateYScale(secondaryYAxisMinValue, secondaryYAxisMaxValue, height);
        d3SecondaryYAxis = generateYAxis(d3SecondaryYScale, 'right');
      }

      renderXAxis();
      renderColumnSeries();
      renderLineSeries();
    } else {
      self.hidePanningNotice();
    }

    // We only have to render the y-axis once, after we have decided whether
    // we will show or hide the panning notice.
    if (isUsingPrimaryAxis()) {
      renderPrimaryYAxis();
    }

    if (isUsingSecondaryAxis()) {
      renderSecondaryYAxis();
    }

    renderReferenceLines();
    renderErrorBars();

    /**
     * 6. Set up event handlers for mouse interactions.
     */
    if (referenceLines.length == 0) {

      dimensionGroupSvgs.selectAll('rect.column-underlay').
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
              const siblingColumn = d3.select(dimensionGroup).select(
                `rect.column[data-measure-index="${measureIndex}"]`
              )[0][0];

              const measure = measures[measureIndex];

              // d3's .datum() method gives us the entire row, whereas everywhere
              // else measureIndex refers only to measure values. We therefore
              // add one to measure index to get the actual measure value from
              // the raw row data provided by d3 (the value at element 0 of the
              // array returned by .datum() is the dimension value).
              const value = d3.select(this.parentNode).datum()[measureIndex + 1];

              showColumnHighlight(siblingColumn);
              showColumnFlyout(siblingColumn, { measure, value });
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

    dimensionGroupSvgs.selectAll('rect.column').
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

            const measure = measures[measureIndex];

            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];
            const percent = parseFloat(this.getAttribute('data-percent'));

            showColumnHighlight(this);
            showColumnFlyout(this, { measure, value, percent });
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

    seriesSvg.selectAll('circle.circle-series').
      on(
        'mousemove',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
        function() {

          if (!isCurrentlyPanning()) {
            const dimensionIndex = parseInt(this.getAttribute('data-dimension-index'), 10);
            const measureIndex = parseInt(this.getAttribute('data-measure-index'), 10);

            const measure = measures[measureIndex];

            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this).datum().value;
            showCircleHighlight(this, measure);
            showColumnFlyout(this, { measure, value });
          }
        }
      ).
      on(
        'mouseleave',
        // NOTE: The below function depends on this being set by d3, so it is
        // not possible to use the () => {} syntax here.
        function() {
          if (!isCurrentlyPanning()) {
            hideHighlight();
            hideFlyout();
          }
        }
      );

    chartSvg.
      selectAll('.x.axis .tick text').
        on(
          'mousemove',
          (datum, dimensionIndex, measureIndex) => {

            if (!isCurrentlyPanning()) {
              let dimensionValue;

              if (_.isNil(datum[0])) {
                dimensionValue = LABEL_NO_VALUE;
              } else if (datum[0] === LABEL_OTHER) {
                dimensionValue = LABEL_OTHER;
              } else {
                const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
                const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
                dimensionValue = formatValueHTML(datum[0], column, dataToRender);
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
                _(xAxisAndSeriesSvg.node().querySelectorAll('g.dimension-group[data-dimension-value-html]')).
                  filter((group) => group.getAttribute('data-dimension-value-html') == dimensionValue).
                  first()
              );

              if (dimensionGroup.empty()) {
                return;
              }

              showGroupFlyout(dimensionGroup, dimensionValues, dataToRender);
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

    seriesSvg.selectAll('.reference-line-underlay').
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
      on('mousemove', function() {
        if (!isCurrentlyPanning()) {
          self.showReferenceLineFlyout(this, referenceLines, false);
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

    /**
     * 7. Conditionally set up the zoom behavior, which is actually used for
     *    panning the chart along the x-axis if panning is enabled.
     */

    if (xAxisPanningEnabled) {

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
      height: viewportHeight - xAxisAndSeriesSvg.select('.x.axis').node().getBBox().height
    });
  }

  function conditionallyTruncateLabel(label) {
    label = _.isNull(label) ? LABEL_NO_VALUE : label;

    return (label.length >= DIMENSION_LABELS_MAX_CHARACTERS) ?
      '{0}…'.format(
        label.substring(0, DIMENSION_LABELS_MAX_CHARACTERS - 1).trim()
      ) :
      label;
  }

  function generateXScale(domain, width, isMultiSeries) {
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
      // padding on either side may be required. Modifying the range extent to
      // be closer to a multiple of the domain length may reduce the additional
      // padding.
      //
      // ---
      // The outer padding looks pretty funny for our use cases, so we
      // override it to be zero, which looks like what we expect.
      rangeRoundBands([0, width], padding, 0.05);
  }

  function generateXGroupScale(domain, xScale) {
    return d3.scale.ordinal().
      domain(domain).
      rangeRoundBands([0, xScale.rangeBand()]);
  }

  function generateXAxis(xScale) {
    return d3.svg.axis().
      scale(xScale).
      orient('bottom').
      tickFormat((d, i) => {
        let label;

        if (_.isNil(d)) {
          label = LABEL_NO_VALUE;
        } else if (d === LABEL_OTHER) {
          label = LABEL_OTHER;
        } else {
          const column = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
          // NOTE: We must use plain text; our axes are SVG (not HTML).
          label = formatValuePlainText(d, column, dataToRender);
        }

        return conditionallyTruncateLabel(label);
      }).
      outerTickSize(0);
  }

  function getDataToRenderOfSeriesType(dataToRender, seriesType) {
    const clonedDataToRender = _.cloneDeep(dataToRender);

    // Get indices of anything that is not our seriesType
    //
    const series = _.get(self.getVif(), 'series');
    const indicesToExcise = series.reduce((indices, seriesItem, index) => {
      if (seriesItem.type !== seriesType) {
        indices.push(index + 1);
      }
      return indices;
    }, []);

    // Excise from columns
    //
    for (var j = indicesToExcise.length - 1; j >= 0; j--) {
      clonedDataToRender.columns.splice(indicesToExcise[j], 1);
    }

    // Excise from seriesIndices
    //
    for (var k = indicesToExcise.length - 1; k >= 0; k--) {
      clonedDataToRender.seriesIndices.splice(indicesToExcise[k], 1);
    }

    // Excise from rows
    //
    clonedDataToRender.rows = clonedDataToRender.rows.map((row) => {
      for (var i = indicesToExcise.length - 1; i >= 0; i--) {
        row.splice(indicesToExcise[i], 1);
      }

      return row;
    });

    return clonedDataToRender;
  }

  function getColumnPositions(columnDataToRender, maxYValue, minYValue) {
    return self.getPositionsForRange(columnDataToRender.rows, minYValue, maxYValue);
  }

  // getLinePositions returns data for the line SVGs to render.  It takes a dataToRender object,
  // maxYValue and minYValue, and returns an array of series data of the following form:
  //
  // [{
  //   dimensionIndex: 0,
  //   seriesIndex: 0,
  //   value: 103000
  // }]
  //
  function getLinePositions(dataToRender, maxYValue, minYValue) {
    const table = dataToRender.rows.map((row) => row.slice(1));   // remove dimension column
    const transposedTable = _.unzip(table);                       // transpose rows and columns

    return transposedTable.map((row, measureIndex) =>             // for each row
      row.map((value, dimensionIndex) =>                          // for each item in row
        _.extend({}, {                                            // extend each item with dimensionIndex & seriesIndex
          dimensionIndex,
          seriesIndex: dataToRender.seriesIndices[measureIndex + 1],
          value: _.clamp(value, minYValue, maxYValue)
        })
      )
    );
  }

  function getMinYValue(data, dimensionIndex, referenceLines) {
    let minReferenceLinesValue;
    let minErrorBarValue;

    // Data
    //
    const minRowValue = d3.min(
      data.rows.map(
        (row) => d3.min(
          row.slice(dimensionIndex + 1)
        )
      )
    );

    // Reference lines
    //
    if (!_.isUndefined(referenceLines)) {
      minReferenceLinesValue = d3.min(
        referenceLines.map(
          (referenceLine) => referenceLine.value)
      );
    }

    // Error bars
    //
    if (!_.isUndefined(data.errorBars)) {
      minErrorBarValue = d3.min(
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
    }

    return d3.min([minRowValue, minReferenceLinesValue, minErrorBarValue]);
  }

  function getMaxYValue(data, dimensionIndex, referenceLines) {
    let maxReferenceLinesValue;
    let maxErrorBarValue;

    // Data
    //
    const maxRowValue = d3.max(
      data.rows.map(
        (row) => d3.max(
          row.slice(dimensionIndex + 1)
        )
      )
    );

    // Reference lines
    //
    if (!_.isUndefined(referenceLines)) {
      maxReferenceLinesValue = d3.max(
        referenceLines.map(
          (referenceLine) => referenceLine.value)
      );
    }

    // Error bars
    //
    if (!_.isUndefined(data.errorBars)) {
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
    }

    return d3.max([maxRowValue, maxReferenceLinesValue, maxErrorBarValue]);
  }

  function getMinSummedYValue(groupedData, dimensionIndex, referenceLines) {
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

  function getMaxSummedYValue(groupedData, dimensionIndex, referenceLines) {
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

  function generateYScale(minValue, maxValue, height) {
    return d3.scale.linear().
      domain([minValue, maxValue]).
      range([height, 0]);
  }

  function generateYAxis(yScale, orient) {
    const column = _.get(self.getVif(), 'series[0].dataSource.measure.columnName');
    const formatter = (d) => formatValueHTML(d, column, dataToRender, true);

    const yAxis = d3.svg.axis().
      scale(yScale).
      orient(orient).
      tickFormat(formatter);

    const isCount = _.get(vif, 'series[0].dataSource.measure.aggregationFunction') === 'count';
    if (isCount) {
      // If the number of possible values is small, limit number of ticks to force integer values.
      const [minYValue, maxYValue] = yScale.domain();
      const span = maxYValue - minYValue;
      if (span < 10) {
        const ticks = d3.range(minYValue, maxYValue + 1, 1);
        yAxis.tickValues(ticks);
      } else {
        yAxis.ticks(10);
      }
    }

    return yAxis;
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

  function showCircleHighlight(circleElement, measure) {
    d3.select(circleElement).attr('fill', measure.getColor());
  }

  function showColumnHighlight(columnElement) {
    const selection = d3.select(columnElement);

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
    d3.selectAll('rect.column').each(function() {
      const selection = d3.select(this);
      selection.attr('fill', selection.attr('data-default-fill'));
    });

    // NOTE: The below function depends on this being set by d3, so it is not
    // possible to use the () => {} syntax here.
    d3.selectAll('circle.circle-series').each(function() {
      const selection = d3.select(this);
      selection.attr('fill', selection.attr('data-default-fill'));
    });
  }

  function showGroupFlyout(groupElement, dimensionValues, dataToRender) {
    const titleHTML = groupElement.attr('data-dimension-value-html') || LABEL_NO_VALUE;
    const $title = $('<tr>', { 'class': 'socrata-flyout-title' }).
    append($('<td>', { 'colspan': 2 }).
    html(titleHTML));

    const $table = $('<table>', { 'class': 'socrata-flyout-table' }).
      append($title);

    const dimensionValue = groupElement.data()[0][0];
    const dimensionIndex = dimensionValues.indexOf(dimensionValue);
    const measureValues = dataToRender.rows[dimensionIndex].slice(1);

    let $labelValueRows;
    let payload = null;

    // 0th element of row data is always the dimension, everything after that
    // is a measure value.
    $labelValueRows = measureValues.map((value, measureIndex) => {
      const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
      const measure = measures[measureIndex];
      const $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
        html(measure.labelHtml).
        css('color', measure.getColor());
      const $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' });
      const unitOne = self.getUnitOneBySeriesIndex(seriesIndex);
      const unitOther = self.getUnitOtherBySeriesIndex(seriesIndex);

      let valueHTML;

      if (value === null) {
        valueHTML = LABEL_NO_VALUE;
      } else {
        const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
        valueHTML = formatValueHTML(value, column, dataToRender, true);

        if (value === 1) {
          valueHTML += ` ${_.escape(unitOne)}`;
        } else {
          valueHTML += ` ${_.escape(unitOther)}`;
        }
      }

      $valueCell.html(valueHTML);

      return $('<tr>', { 'class': 'socrata-flyout-row' }).
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
    if (groupElement.selectAll('rect.column')[0].length === 1) {
      _.set(payload, 'element', groupElement[0][0].childNodes[1]);
    } else {

      // Calculate the offsets from screen (0, 0) to the top of the tallest
      // column (where at least one value in the group is > 0) or 0 on the
      // y-axis (where all values in the group are <= 0) and the horizontal
      // center of the group in question.
      const flyoutElementBoundingClientRect = groupElement[0][0].getBoundingClientRect();
      const flyoutElementWidth = flyoutElementBoundingClientRect.width;
      const flyoutElementTopOffset = flyoutElementBoundingClientRect.top;
      const flyoutElementLeftOffset = flyoutElementBoundingClientRect.left;

      _.set(
        payload,
        'flyoutOffset',
        {
          top: flyoutElementTopOffset,
          left: flyoutElementLeftOffset + (flyoutElementWidth / 2) - 1
        }
      );
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
      payload
    );
  }

  function showColumnFlyout(columnElement, { measure, value, percent }) {
    const titleHTML = columnElement.getAttribute('data-dimension-value-html') || noValueLabel;
    const seriesIndex = getSeriesIndexByMeasureIndex(measure.measureIndex);

    const $title = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append(
        $('<td>', { 'colspan': 2 }).html(
          (titleHTML) ? titleHTML : ''
        )
      );

    const $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
      html(measure.labelHtml).
      css('color', measure.getColor());

    const $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' });
    const $valueRow = $('<tr>', { 'class': 'socrata-flyout-row' });
    const $table = $('<table>', { 'class': 'socrata-flyout-table' });

    let valueHTML;
    let payload = null;

    if (value === null) {
      valueHTML = noValueLabel;
    } else {
      const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
      valueHTML = formatValueHTML(value, column, dataToRender, true);

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

    payload = {
      element: columnElement,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
      payload
    );
  }

  function hideFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
      null
    );
  }

  function isUsingPrimaryAxis() {
    return !isUsingSecondaryAxisForColumns() || !isUsingSecondaryAxisForLines();
  }

  function isUsingSecondaryAxis() {
    return isUsingSecondaryAxisForColumns() || isUsingSecondaryAxisForLines();
  }

  function isUsingSecondaryAxisForColumns() {
    return _.get(self.getVif(), 'configuration.useSecondaryAxisForColumns', false);
  }

  function isUsingSecondaryAxisForLines() {
    return _.get(self.getVif(), 'configuration.useSecondaryAxisForLines', false);
  }

  // Calculates the proper left margin for the chart using a simulated Y axis.
  function calculateLeftRightMargin(dataToRender, viewportHeight, orient) {
    if (_.isNil(dataToRender)) {
      return MINIMUM_LABEL_WIDTH + LABEL_PADDING_WIDTH;
    }

    const values = _.flatMap(dataToRender.rows, (row) => _.tail(row).map(parseFloat));

    // Generate a Y axis on a fake chart using our real axis generator.
    const testSvg = d3.select('body').append('svg');
    const testScale = generateYScale(_.min(values), _.max(values), viewportHeight);
    testSvg.append('g').
      attr('class', 'y axis').
      call(generateYAxis(testScale, orient));

    // Get the widths of all generated tick labels.
    const testLabelWidths = _.map(
      testSvg.selectAll('.tick text')[0],
      (el) => el.textLength.baseVal.value
    );

    // Clean up the fake chart.
    testSvg.remove();

    // Return the largest label width (minimum 35px), plus a bit of padding.
    // For reference, the original chart width was hard-coded to 50px.
    return _.max(testLabelWidths.concat(MINIMUM_LABEL_WIDTH)) + LABEL_PADDING_WIDTH;
  }

  // Formats a value from the dataset for rendering within the chart.
}

module.exports = SvgComboChart;
