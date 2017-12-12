// Vendor Imports
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
// Project Imports
const SvgVisualization = require('./SvgVisualization');
import {
  createMoneyFormatter,
  formatValueHTML,
  formatValuePlainText
} from '../helpers/ColumnFormattingHelpers';
const I18n = require('common/i18n').default;
// Constants
import {
  AXIS_LABEL_MARGIN,
  DEFAULT_CIRCLE_HIGHLIGHT_RADIUS,
  DEFAULT_LINE_HIGHLIGHT_FILL,
  REFERENCE_LINES_STROKE_DASHARRAY,
  REFERENCE_LINES_STROKE_WIDTH,
  REFERENCE_LINES_UNDERLAY_THICKNESS,
  LEGEND_BAR_HEIGHT
} from './SvgStyleConstants';

import { getMeasures } from '../helpers/measure';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 32,
  RIGHT: 50,
  BOTTOM: 0,
  LEFT: 50
};
const AREA_DOT_RADIUS = 1;
const AREA_STROKE_WIDTH = 3;
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_GRID_COLOR = '#f1f1f1';
const AXIS_TICK_COLOR = '#adadad';
const DEFAULT_DESKTOP_DATUM_WIDTH = 14;
const DEFAULT_MOBILE_DATUM_WIDTH = 50;
const DIMENSION_LABELS_CATEGORICAL_FIXED_HEIGHT = 88;
const DIMENSION_LABELS_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_FONT_SIZE = 14;
const DIMENSION_LABELS_MAX_CHARACTERS = 8;
const DIMENSION_LABELS_ROTATION_ANGLE = 82.5;
const DIMENSION_LABELS_TIME_FIXED_HEIGHT = 24;
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const LABEL_NO_VALUE = I18n.t('shared.visualizations.charts.common.no_value');
const LABEL_OTHER = I18n.t('shared.visualizations.charts.common.other_category');
const LINE_DOT_RADIUS = 2;
const LINE_STROKE_WIDTH = 3;
const MAX_ROW_COUNT_WITHOUT_PAN = 1000;
const MEASURE_LABEL_FONT_COLOR = '#5e5e5e';
const MEASURE_LABEL_FONT_SIZE = 14;
const MINIMUM_HIGHLIGHT_WIDTH = 5;
const RECOMMENDED_TICK_DISTANCE = 150;

function SvgTimelineChart($element, vif, options) {
  // Embeds needs to wait to define noValueLabel until after hydration.
  const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');
  const self = this;
  const parseDate = d3.
    time.
    // A 'floating timestamp', e.g. '2008-01-18T00:00:00.000' (Note the lack of
    // timezone information, since we need to treat all dates as in the
    // browser's local timezone when working with them in the browser, but treat
    // them as the same datetime, just in UTC, when communicating with the
    // outside world. We do this by selectively adding/removing the 'Z' for UTC
    // to datetimes represented as ISO-8601 strings).
    format('%Y-%m-%dT%H:%M:%S.%L').
    parse;

  let $chartElement;
  let bisectorDates;
  let d3XScale;
  let d3YScale;
  let dataToRender;
  let dataToRenderBySeries;
  let lastRenderedSeriesWidth = 0;
  let lastRenderedZoomTranslate = 0;
  let maxYValue;
  let minYValue;
  let precision;
  let measures;
  let referenceLines;
  let xAxisPanDistanceFromZoom = 0;

  _.extend(this, new SvgVisualization($element, vif, options));

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData, newColumns) {

    if (!newData && !dataToRender) {
      return;
    }

    this.clearError();

    if (newVif) {
      this.updateVif(newVif);
    }

    if (newData) {

      dataToRender = newData;
      // Note: the vast majority of rendering code reads from
      // 'dataToRenderBySeries', not 'dataToRender'. If memory usage becomes
      // problematic, the few places that read from 'dataToRender' can be
      // modified to read from 'dataToRenderBySeries' instead, trading a bit
      // of extra computation for halving memory usage. In this case, we would
      // not want to store a reference to 'newData' at all but rather just
      // to the result of 'mapDataTableToDataTablesBySeries()'.
      dataToRenderBySeries = mapDataTableToDataTablesBySeries(newData);
    }

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    referenceLines = self.getReferenceLines();
    renderData();
  };

  this.invalidateSize = () => {

    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  this.destroy = () => {
    const rootElement = d3.select(this.$element[0]);

    rootElement.select('svg').
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
        'class': 'timeline-chart'
      }
    );

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  // We are moving in the direction of representing multi-series data as a
  // single data table with one column for the dimension and then n columns for
  // measures, where n is the number of series. We believe this to be sensible
  // in the general case, but it conflicts with the way d3 expects to be given
  // multi-series data for lines/areas, and so we (somewhat wastefully) build
  // up a single data table object from n query results in the data fetching
  // code and then almost immediately turn around and deconstruct it back into
  // multiple indpependent tables, one for each series, when rendering a
  // Timeline Chart.
  //
  // It was felt that having a single data format across the entire library and
  // then messing with it to make it easier to draw Timeline charts (at a
  // slightly elevated processing/memory cost) was preferable to the
  // alternative (in other words, we have optimized for clarity and
  // predictibility as opposed to rendering performance).
  function mapDataTableToDataTablesBySeries(dataTable) {
    const dataTableDimensionIndex = dataTable.columns.indexOf('dimension');

    measures = getMeasures(self, dataToRender);

    const dataTablesBySeries = measures.map((measure, i) => {
      const dataTableMeasureIndex = dataTableDimensionIndex + 1 + i;
      let rows = dataTable.rows.map((row) => {
        return [
          row[dataTableDimensionIndex],
          row[dataTableMeasureIndex]
        ];
      });

      // Results with no precision are not bucketed and may have null dimension
      // values. If so, filter them out.
      const precision = _.get(self.getVif(), 'series[0].dataSource.precision');

      if (precision === 'none') {
        rows = rows.filter((row) => !_.isNull(row[dataTableDimensionIndex]));
      }

      return {
        columns: ['dimension', measure.tagValue],
        rows: rows,
        measure
      };
    });

    return dataTablesBySeries;
  }

  /**
   * Visualization renderer and helper functions
   */

  function renderData() {
    const minimumDatumWidth = self.isMobile() ?
      DEFAULT_MOBILE_DATUM_WIDTH :
      DEFAULT_DESKTOP_DATUM_WIDTH;

    const axisLabels = self.getAxisLabels();
    const leftMargin = MARGINS.LEFT + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);
    const rightMargin = MARGINS.RIGHT + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);

    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);
    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

    const d3ClipPathId = `timeline-chart-clip-path-${_.uniqueId()}`;
    const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
    const dimensionValues = dataToRender.rows.map(
      (row) => row[dataTableDimensionIndex]
    );

    const seriesDimensionIndex = 0;
    const seriesMeasureIndex = 1;

    let chartSvg;
    let d3AreaCategoricalSeries;
    let d3AreaTimeSeries;
    let d3LineCategoricalSeries;
    let d3LineTimeSeries;
    let d3XAxis;
    let d3YAxis;
    let d3Zoom;
    let domainEndDate;
    let domainStartDate;
    let endDate;
    let height;
    let lastRenderedZoomTranslate = 0;
    let referenceLineSvgs;
    let referenceLineUnderlaySvgs;
    let rootElement;
    let startDate;
    let viewportSvg;
    let width;
    let xAxisAndSeriesSvg;
    let xAxisBound = false;
    let xAxisPanDistance;
    let xAxisPanningEnabled;

    referenceLines = self.getReferenceLines();
    precision = _.get(self.getVif(), 'series[0].dataSource.precision');

    const dimensionColumnName = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
    const isUsingTimeScale = isDimensionCalendarDate(dimensionColumnName, dataToRender.columnFormats);

    // See comment in renderXAxis() for an explanation as to why this is
    // separate.
    function bindXAxisOnce() {
      const renderedXAxisSvg = viewportSvg.select('.x.axis');
      const renderedXAxisBaselineSvg = viewportSvg.select('.x.axis.baseline');

      if (!xAxisBound) {

        renderedXAxisSvg.
          call(d3XAxis);

        renderedXAxisBaselineSvg.
          call(
            d3XAxis.
              tickFormat('').
              tickSize(0));

        xAxisBound = true;
      }
    }

    function renderXAxis() {
      if (isUsingTimeScale) {
        renderTimeXAxis();
      } else {
        renderCategoricalXAxis();
      }
    }

    function renderCategoricalXAxis() {
      const dimensionLabelTranslation =
        `translate(${minimumDatumWidth},${minimumDatumWidth * .75})`;
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
        attr('transform', 'translate(0,{0})'.format(height));

      xAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', AXIS_DEFAULT_COLOR);

      xAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', AXIS_TICK_COLOR);

      xAxisSvg.selectAll('text').
        attr('fill', DIMENSION_LABELS_FONT_COLOR).
        attr('font-family', FONT_STACK).
        attr('font-size', DIMENSION_LABELS_FONT_SIZE + 'px').
        attr('stroke', 'none').
        attr('style', 'text-anchor: start').
        attr('transform', `${dimensionLabelTranslation}, ${dimensionLabelRotation}`).
        attr('data-row-index', (label, rowIndex) => rowIndex);

      if (minYValue > 0) {
        baselineValue = minYValue;
      } else if (maxYValue < 0) {
        baselineValue = maxYValue;
      } else {
        baselineValue = 0;
      }

      xBaselineSvg.
        attr('transform', 'translate(0,{0})'.format(d3YScale(baselineValue)));

      xBaselineSvg.selectAll('line, path').
        attr('fill', 'none').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', AXIS_DEFAULT_COLOR);
    }

    function renderTimeXAxis() {
      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderXAxis() as idempotent.
      bindXAxisOnce();

      const renderedXAxisSvg = viewportSvg.select('.x.axis');
      const renderedXAxisBaselineSvg = viewportSvg.select('.x.axis.baseline');

      renderedXAxisSvg.
        attr('transform', `translate(0,${height})`);

      renderedXAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('shape-rendering', 'crispEdges').
        attr('stroke', AXIS_DEFAULT_COLOR);

      renderedXAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_TICK_COLOR).
        attr('shape-rendering', 'crispEdges');

      renderedXAxisSvg.selectAll('text').
        attr('fill', DIMENSION_LABELS_FONT_COLOR).
        attr('font-family', FONT_STACK).
        attr('font-size', `${DIMENSION_LABELS_FONT_SIZE}px`).
        attr('stroke', 'none');

      const baselineValue = _.clamp(0, minYValue, maxYValue);

      renderedXAxisBaselineSvg.
        attr('transform', `translate(0,${d3YScale(baselineValue)})`);

      renderedXAxisBaselineSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    function renderYAxis() {
      const renderedYAxisSvg = viewportSvg.select('.y.axis');
      const renderedYAxisGridSvg = viewportSvg.select('.y.grid');

      renderedYAxisSvg.call(d3YAxis);

      renderedYAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');

      renderedYAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_TICK_COLOR).
        attr('shape-rendering', 'crispEdges');

      renderedYAxisSvg.selectAll('text').
        attr('font-family', FONT_STACK).
        attr('font-size', `${MEASURE_LABEL_FONT_SIZE}px`).
        attr('fill', MEASURE_LABEL_FONT_COLOR).
        attr('stroke', 'none');

      let d3YGridAxis = d3YAxis.
        tickSize(viewportWidth).
        tickFormat('');

      renderedYAxisGridSvg.
        attr('transform', `translate(${viewportWidth},0)`).
        call(d3YGridAxis);

      renderedYAxisGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      renderedYAxisGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    function renderReferenceLines() {
      // Because the line stroke thickness is 2px, the half of the line can be clipped on the top or bottom edge
      // of the chart area.  This function shifts the clipped line down 1 pixel when at the top edge and up 1 pixel
      // when at the bottom edge.  All the other lines are rendered in normal positions.
      const getYPosition = (referenceLine) => {
        if (referenceLine.value == maxYValue) {
          return d3YScale(referenceLine.value) + 1; // shift down a pixel if at the top of chart area
        } else if (referenceLine.value == minYValue) {
          return d3YScale(referenceLine.value) - 1; // shift up a pixel if at the bottom of chart area
        } else {
          return d3YScale(referenceLine.value);
        }
      };

      const getLineThickness = (referenceLine) => {
        return self.isInRange(referenceLine.value, minYValue, maxYValue) ? REFERENCE_LINES_STROKE_WIDTH : 0;
      };

      const getUnderlayThickness = (referenceLine) => {
        return self.isInRange(referenceLine.value, minYValue, maxYValue) ? REFERENCE_LINES_UNDERLAY_THICKNESS : 0;
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

    function renderValues() {
      dataToRenderBySeries.forEach((seriesData, seriesIndex) => {
        renderLines(seriesData, seriesIndex);
        renderCircles(seriesData, seriesIndex);
      });
    }

    function renderLines(seriesData, seriesIndex) {
      const { measure } = seriesData;
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

      // If we *are not* drawing a line chart, we need to draw the area fill
      // first so that the line sits on top of it in the z-stack.
      if (seriesTypeVariant !== 'line') {

        let seriesAreaSvg = viewportSvg.
          select(`.series-${seriesIndex}-${seriesTypeVariant}-area`);

        const d3AreaSeries = isUsingTimeScale ?
          d3AreaTimeSeries[seriesIndex] :
          d3AreaCategoricalSeries[seriesIndex];

        seriesAreaSvg.
          attr('d', d3AreaSeries).
          attr('clip-path', `url(#${d3ClipPathId})`).
          // Note that temporarily, the type variant defaults to 'area' if it
          // is not set, but direction from UX is to never show a shaded area,
          // only the area's top contour. As such, we make the area itself
          // transparent (instead of getting a color from the VIF or via the
          // measure palette.
          attr('fill', 'transparent').
          attr('stroke', 'transparent').
          attr('stroke-width', AREA_STROKE_WIDTH).
          attr('opacity', '0.1');
      }

      const color = measure.getColor();

      // We draw the line for all type variants of timeline chart.
      let seriesLineSvg = viewportSvg.
        select(`.series-${seriesIndex}-${seriesTypeVariant}-line`);

      const d3LineSeries = isUsingTimeScale ?
        d3LineTimeSeries[seriesIndex] :
        d3LineCategoricalSeries[seriesIndex];

      seriesLineSvg.
        attr('d', d3LineSeries).
        attr('clip-path', `url(#${d3ClipPathId})`).
        attr('fill', 'none').
        attr('stroke', color).
        attr('stroke-width', LINE_STROKE_WIDTH);
    }

    function renderCircles(seriesData, seriesIndex) {
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

      const seriesDotsPathSvg = viewportSvg.select(`.series-${seriesIndex}-line-dots`);
      seriesDotsPathSvg.attr('clip-path', `url(#${d3ClipPathId})`);

      const seriesDotsSvg = seriesDotsPathSvg.selectAll('circle');
      let radius;

      if (isUsingTimeScale) {

        // If we *are* drawing a line chart we also draw the dots bigger to
        // indicate individual points in the data. If we are drawing an area
        // chart the dots help to indicate non-contiguous sections which may
        // be drawn at 1 pixel wide and nearly invisible with the fill color
        // alone.
        radius = (seriesTypeVariant === 'line') ? LINE_DOT_RADIUS : AREA_DOT_RADIUS;

      } else {

        // Categorical scale uses the same size dots as the combo chart
        radius = DEFAULT_CIRCLE_HIGHLIGHT_RADIUS;
      }

      const getCx = (d) => {
        if (!isUsingTimeScale) {
          const halfBandWidth = Math.round(d3XScale.rangeBand() / 2.0);
          return d3XScale(d[seriesDimensionIndex]) + halfBandWidth;
        } else if (allSeriesAreLineVariant()) {
          return d3XScale(parseDate(d[seriesDimensionIndex]));
        } else if (precision === 'none') {
          return d3XScale(parseDate(d[seriesDimensionIndex]));
        } else {
          // For area (bucketed) variants, we need to shift the rendered
          // points by half the width of the domain interval to the right
          // in order for the peaks to appear in the middle of the
          // intervals, as opposed to the beginning of them (if we do not
          // do this shift, the a range of 2001-2002 and a value of 1000
          // looks like the 1000 was measured on Jan 1, 2001).
          return d3XScale(
            new Date(
              parseDate(d[seriesDimensionIndex]).getTime() +
              getSeriesHalfIntervalWidthInMs(seriesData)
            )
          );
        }
      };

      const getCy = (d) => (d[seriesMeasureIndex] !== null) ?
        d3YScale(d[seriesMeasureIndex]) :
        -100;

      seriesDotsSvg.
        attr('cx', getCx).
        attr('cy', getCy).
        attr('data-default-fill', 'transparent').
        attr('data-dimension-value-html', (d, index) => dimensionValues[index]).
        attr('data-measure-index', (d, index) => index).
        attr('data-series-index', seriesIndex).
        attr('fill', 'transparent').
        attr('r', radius);
    }

    function handleZoom() {
      lastRenderedZoomTranslate = _.clamp(
        d3.event.translate[0],
        -1 * xAxisPanDistance,
        0
      );
      xAxisPanDistanceFromZoom = lastRenderedZoomTranslate;

      // We need to override d3's internal translation since it doesn't seem to
      // respect our snapping to the beginning and end of the rendered data.
      d3Zoom.translate([lastRenderedZoomTranslate, 0]);

      chartSvg.
        select(`#${d3ClipPathId}`).
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
      const translateXRatio = (lastRenderedSeriesWidth !== 0) ? Math.abs(lastRenderedZoomTranslate / lastRenderedSeriesWidth) : 0;
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
        select(`#${d3ClipPathId}`).
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

        const legendItems = self.getLegendItems({ measures, referenceLines });

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

    // Actual execution begins here.
    //
    renderLegend();

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      width = viewportWidth;
      xAxisPanningEnabled = false;

      if (dataToRender.rows.length > MAX_ROW_COUNT_WITHOUT_PAN) {

        self.renderError(
          I18n.t(
            'shared.visualizations.charts.timeline_chart.' +
            'error_exceeded_max_row_count_without_pan'
          ).format(MAX_ROW_COUNT_WITHOUT_PAN)
        );
        return;
      }
    } else {

      width = Math.max(
        viewportWidth,
        minimumDatumWidth * dataToRender.rows.length
      );

      xAxisPanDistance = width - viewportWidth;
      xAxisPanningEnabled = (viewportWidth !== width);

      if (xAxisPanningEnabled) {
        self.showPanningNotice();
      } else {
        self.hidePanningNotice();
      }
    }

    // We only calculate the height after we have shown or hidden the panning
    // notice, since its presence or absence affects the total height of the
    // viewport.
    if (!isUsingTimeScale && self.getShowDimensionLabels()) {
      height = Math.max(0, viewportHeight - DIMENSION_LABELS_CATEGORICAL_FIXED_HEIGHT);
    } else {
      height = Math.max(0, viewportHeight - DIMENSION_LABELS_TIME_FIXED_HEIGHT);
    }

    // Next we can set up some data that we only want to compute once.
    //
    // The bisector is used to determine which data point or bucket to
    // highlight when moving along the x-axis.  For bucketed variants,
    // the axis is bisected on the dates themselves because the displayed
    // point is shifted to be in the middle of the bucket.
    //
    // For non-bucketed, the displayed point is the actual data point, so
    // we want to do the opposite, and set up bisector dates that are
    // mid-way between the data points in order for the highlight to
    // behave they way you would expect as you mouse along the x-axis.
    //
    if (isUsingTimeScale) {
      if (precision !== 'none') {
        bisectorDates = dataToRenderBySeries[0].rows.map((d) => parseDate(d[seriesDimensionIndex]));
      } else {
        bisectorDates = getPrecisionNoneBisectorDates(dataToRenderBySeries[0].rows);
      }

      startDate = d3.min(                      // Second, get the min dimension date of all series
        dataToRenderBySeries.map((series) => { // First, get the min dimension date of rows in a series
          return d3.min(series.rows, (d) => d[seriesDimensionIndex]);
        })
      );

      endDate = d3.max(                        // Second, get the max dimension date of all series
        dataToRenderBySeries.map((series) => { // First, get the max dimension date of rows in a series
          return d3.max(series.rows, (d) => d[seriesDimensionIndex]);
        })
      );

      domainStartDate = parseDate(startDate);
      domainEndDate = parseDate(endDate);

      // Add 1 year, month or day (depending on the precision) so that we render
      // the last time bucket properly.
      //
      if (precision !== 'none') {
        domainEndDate = getIncrementedDateByPrecision(domainEndDate, dataToRender.precision);
        endDate = domainEndDate.toISOString();
      }
    }

    const allMeasureValues = _.flatMap(
      dataToRender.rows.map((row) => {
        return row.slice(dataTableDimensionIndex + 1);
      })
    );

    const dataMinYValue = getMinYValue(allMeasureValues, referenceLines);
    const dataMaxYValue = getMaxYValue(allMeasureValues, referenceLines);

    try {
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
    } catch (error) {
      self.renderError(error.message);
      return;
    }

    d3XScale = isUsingTimeScale ?
      generateTimeXScale(domainStartDate, domainEndDate, width) :
      generateCategoricalXScale(dimensionValues, width);

    d3XAxis = generateXAxis(d3XScale, width, isUsingTimeScale);

    d3YScale = generateYScale(minYValue, maxYValue, height);
    d3YAxis = generateYAxis(d3YScale);

    const isCount = _.get(vif, 'series[0].dataSource.measure.aggregationFunction') === 'count';
    if (isCount) {
      const span = maxYValue - minYValue;
      if (span < 10) {
        const ticks = d3.range(minYValue, maxYValue + 1, 1);
        d3YAxis.tickValues(ticks);
      } else {
        d3YAxis.ticks(10);
      }
    }

    if (isUsingTimeScale) {

      d3AreaTimeSeries = dataToRenderBySeries.map((series, seriesIndex) => {
        const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

        if (seriesTypeVariant === 'line') {
          return null;
        } else {

          return d3.svg.area().
            defined((d) => !_.isNull(d[seriesMeasureIndex])).
            x((d) => {

              if (allSeriesAreLineVariant()) {
                return d3XScale(parseDate(d[seriesDimensionIndex]));
              } else if (precision !== 'none') {
                // For area (bucketed) variants, we need to shift the rendered
                // points by half the width of the domain interval to the right in
                // order for the peaks to appear in the middle of the intervals,
                // as opposed to the beginning of them (if we do not do this
                // shift, the a range of 2001-2002 and a value of 1000 looks like
                // the 1000 was measured on Jan 1, 2001).
                return d3XScale(
                  new Date(
                    parseDate(d[seriesDimensionIndex]).getTime() +
                    getSeriesHalfIntervalWidthInMs(series)
                  )
                );
              } else {
                return d3XScale(parseDate(d[seriesDimensionIndex]));
              }
            }).
            /* eslint-disable no-unused-vars */
            y0((d) => d3YScale(0)).
            /* eslint-enable no-unused-vars */
            y1((d) => d3YScale(d[seriesMeasureIndex]));
        }
      });

      d3LineTimeSeries = dataToRenderBySeries.map((series) => {
        return d3.svg.line().
          defined((d) => !_.isNull(d[seriesMeasureIndex])).
          x((d) => {

            if (allSeriesAreLineVariant()) {
              return d3XScale(parseDate(d[seriesDimensionIndex]));
            } else {

              if (precision !== 'none') {
                // For area (bucketed) variants, we need to shift the rendered
                // points by half the width of the domain interval to the right in
                // order for the peaks to appear in the middle of the intervals,
                // as opposed to the beginning of them (if we do not do this
                // shift, the a range of 2001-2002 and a value of 1000 looks like
                // the 1000 was measured on Jan 1, 2001).
                return d3XScale(
                  new Date(
                    parseDate(d[seriesDimensionIndex]).getTime() +
                    getSeriesHalfIntervalWidthInMs(series)
                  )
                );
              } else {
                return d3XScale(parseDate(d[seriesDimensionIndex]));
              }
            }
          }).
          y((d) => {
            const value = (maxYValue) ?
              _.min([maxYValue, d[seriesMeasureIndex]]) :
              d[seriesMeasureIndex];

            return d3YScale(value);
          });
      });

    } else {

      const halfBandWidth = Math.round(d3XScale.rangeBand() / 2.0);

      d3AreaCategoricalSeries = dataToRenderBySeries.map((series, seriesIndex) => {
        const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

        if (seriesTypeVariant === 'line') {
          return null;
        } else {
          return d3.svg.area().
            defined((d) => !_.isNull(d[seriesMeasureIndex])).
            x((d) => d3XScale(d[seriesDimensionIndex]) + halfBandWidth).
            y0(() => d3YScale(0)).
            y1((d) => d3YScale(d[seriesMeasureIndex]));
        }
      });

      d3LineCategoricalSeries = dataToRenderBySeries.map((series) => {
        return d3.svg.line().
          defined((d) => !_.isNull(d[seriesMeasureIndex])).
          x((d) => d3XScale(d[seriesDimensionIndex]) + halfBandWidth).
          y((d) => {

            const value = (maxYValue) ?
              _.min([maxYValue, d[seriesMeasureIndex]]) :
              d[seriesMeasureIndex];

            return d3YScale(value);
          });
      });
    }

    // Remove any existing root svg element.
    rootElement = d3.select($chartElement[0]);
    rootElement.select('svg').remove();

    // Render a new root svg element.
    chartSvg = rootElement.append('svg');
    chartSvg.
      attr('height', viewportHeight + topMargin + bottomMargin).
      attr('width', width + leftMargin + rightMargin);

    // Render the viewport group.
    viewportSvg = chartSvg.append('g');
    viewportSvg.
      attr('class', 'viewport').
      attr('transform', `translate(${leftMargin},${topMargin})`);

    // Render the clip path.
    const clipPathSvg = chartSvg.append('clipPath');
    clipPathSvg.attr('id', d3ClipPathId);

    const clipPathRectSvg = clipPathSvg.append('rect');
    clipPathRectSvg.
      attr('x', 0).
      attr('y', 0).
      attr('width', viewportWidth + leftMargin + rightMargin).
      attr('height', viewportHeight + topMargin + bottomMargin);

    // Render the y- and x-axis.
    const yAxisSvg = viewportSvg.append('g').
      attr('class', 'y axis');

    const yAxisGridSvg = viewportSvg.append('g').
      attr('class', 'y grid');

    xAxisAndSeriesSvg = viewportSvg.append('g').
      attr('class', 'x-axis-and-series').
      attr('clip-path', 'url(#' + d3ClipPathId + ')');

    const seriesSvg = xAxisAndSeriesSvg.append('g').
      attr('class', 'series');

    const xAxisSvg = xAxisAndSeriesSvg.append('g').
      attr('class', 'x axis');

    const xAxisBaselineSvg = xAxisAndSeriesSvg.append('g').
      attr('class', 'x axis baseline');

    // Render the actual marks.
    dataToRenderBySeries.forEach((series, seriesIndex) => {
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
      const areaSvg = seriesSvg.append('path');
      const lineSvg = seriesSvg.append('path');
      const dotsGroupSvg = seriesSvg.append('g');
      const dotsSvg = dotsGroupSvg.
        selectAll(`.series-${seriesIndex}-line-dot`);

      areaSvg.
        datum(series.rows).
        attr('class', `series-${seriesIndex}-${seriesTypeVariant}-area`);

      lineSvg.
        datum(series.rows).
        attr('class', `series-${seriesIndex}-${seriesTypeVariant}-line`);

      dotsGroupSvg.attr('class', `series-${seriesIndex}-line-dots`);

      dotsSvg.data(series.rows).enter().
        append('circle');
    });

    renderXAxis();
    renderYAxis();

    if (isUsingTimeScale) {

      viewportSvg.append('rect').
        attr('class', 'highlight').
        attr('fill', DEFAULT_LINE_HIGHLIGHT_FILL).
        attr('height', height).
        attr('opacity', '0').
        attr('stroke', 'none');

      viewportSvg.append('rect').
        attr('class', 'overlay').
        attr('fill', 'none').
        attr('height', viewportHeight).
        attr('stroke', 'none').
        attr('width', viewportWidth).
        on('mousemove', handleMouseMove).
        on(
          'mouseleave',
          () => {
            hideHighlight();
            hideFlyout();
          }
        );

    } else {

      const measureValueIndex = 1;

      seriesSvg.selectAll('circle').
        on(
          'mousemove',
          // NOTE: The below function depends on this being set by d3, so it is not
          // possible to use the () => {} syntax here.
          function(datum) {
            const seriesIndex = parseInt(this.getAttribute('data-series-index'), 10);

            if (!isCurrentlyPanning()) {
              const measure = measures[seriesIndex];
              const value = datum[measureValueIndex];

              showCircleHighlight(this, measure);
              showCircleFlyout(this, { measure, value });
            }
          }
        ).
        on(
          'mouseleave',
          () => {
            if (!isCurrentlyPanning()) {
              hideCircleHighlight();
              hideFlyout();
            }
          }
        );

      chartSvg.selectAll('.x.axis .tick text').
          on(
            'mousemove',
            (datum, dimensionIndex, measureIndex) => {

              if (!isCurrentlyPanning()) {
                let dimensionValue;

                if (_.isNil(datum)) {
                  dimensionValue = LABEL_NO_VALUE;
                } else if (datum === LABEL_OTHER) {
                  dimensionValue = LABEL_OTHER;
                } else {
                  const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
                  const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
                  dimensionValue = formatValueHTML(datum, column, dataToRender);
                }

                showGroupFlyout({
                  dataToRender,
                  datum,
                  dimensionIndex,
                  dimensionValue
                });
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
    }

    // Render reference lines
    referenceLineSvgs = viewportSvg.selectAll('line.reference-line').
      data(referenceLines).
      enter().
      append('line').
      attr('class', 'reference-line');

    referenceLineUnderlaySvgs = viewportSvg.selectAll('rect.reference-line-underlay').
      data(referenceLines).
      enter().
      append('rect').
      attr('class', 'reference-line-underlay').
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
      on('mousemove', function() {
        if (!isCurrentlyPanning()) {
          const underlayHeight = parseInt($(this).attr('height'), 10);
          const flyoutOffset = {
            left: d3.event.clientX,
            top: $(this).offset().top + (underlayHeight / 2) - window.scrollY
          };

          self.showReferenceLineFlyout(this, referenceLines, false, flyoutOffset);
          $(this).attr('fill-opacity', 1);
        }
      }).
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
      on('mouseleave', function() {
        if (!isCurrentlyPanning()) {
          hideFlyout();
          $(this).attr('fill-opacity', 0);
        }
      });

    renderValues();
    renderReferenceLines();

    if (xAxisPanningEnabled) {

      d3Zoom = d3.behavior.zoom().
        on('zoom', handleZoom);

      viewportSvg.
        attr('cursor', 'move').
        call(d3Zoom).
        // By default the zoom behavior seems to capture every conceivable kind
        // of zooming action; we actually just want it to zoom when the user
        // clicks and drags, so we need to immediately deregister the event
        // handlers for the other types.
        //
        // Note that although we listen for the zoom event on the zoom behavior
        // we must detach the zooming actions we do not want to respond to from
        // the element to which the zoom behavior is attached.
        on('dblclick.zoom', null).
        on('wheel.zoom', null).
        on('mousewheel.zoom', null).
        on('MozMousePixelScroll.zoom', null);

      restoreLastRenderedZoom();

      chartSvg.selectAll('text').
        attr('cursor', null);
    }

    self.renderAxisLabels(chartSvg, {
      x: leftMargin,
      y: topMargin,
      width: viewportWidth,
      height: viewportHeight
    });
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

  // Returns one half of the interval between the first and second data in the
  // series, in milliseconds. This is used to offset points representing
  // bucketed data so that the points fall in the middle of the bucketed
  // interval, as opposed to at its start.
  function getSeriesHalfIntervalWidthInMs(series) {
    const seriesDimensionIndex = 0;

    utils.assert(series.rows.length >= 2);

    return (
      parseDate(series.rows[1][seriesDimensionIndex]).getTime() -
      parseDate(series.rows[0][seriesDimensionIndex]).getTime()
    ) / 2;
  }

  function allSeriesAreLineVariant() {

    return _.get(self.getVif(), 'series', []).
      map((series, seriesIndex) => {
        return self.getTypeVariantBySeriesIndex(seriesIndex);
      }).
      every((type) => type === 'line');
  }

  function getMinYValue(data, referenceLines) {
    const minMeasureValue = d3.min(data);

    const minReferenceLinesValue = d3.min(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.min([minMeasureValue, minReferenceLinesValue]);
  }

  function getMaxYValue(data, referenceLines) {
    const maxMeasureValue = d3.max(data);

    const maxReferenceLinesValue = d3.max(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.max([maxMeasureValue, maxReferenceLinesValue]);
  }

  function handleMouseMove() {
    // XXX: EN-20686 required adding a bunch of ugliness, namely all the
    // *ForHighlight variables. It helps address a mismatch between the x-axis
    // as displayed and the x-axis coordinates detected by hovering over it for
    // the purposes of displaying a hover highlight. If a visualization has been
    // panned, then it will show a date range different from one the
    // showHighlight code expects to work with: showHighlight only correctly
    // renders the leftmost date range (which basically means it does not really
    // understand dates and probably should be fixed). If given the correct date
    // range, it renders the highlight off-screen.
    const precision = _.get(self.getVif(), 'series[0].dataSource.precision');
    const rawDate = d3XScale.invert(d3.mouse(this)[0] - xAxisPanDistanceFromZoom);
    const rawDateForHighlight = d3XScale.invert(d3.mouse(this)[0]);
    const bisectorIndex = d3.bisectLeft(bisectorDates, rawDate);
    const bisectorIndexForHighlight = d3.bisectLeft(bisectorDates, rawDateForHighlight);
    const firstSeriesRows = dataToRenderBySeries[0].rows;

    const firstSeriesIndex = _.clamp(
      (precision !== 'none') ? bisectorIndex - 1 : bisectorIndex,
      0,
      firstSeriesRows.length - 1
    );
    const firstSeriesIndexForHighlight = _.clamp(
      (precision !== 'none') ? bisectorIndexForHighlight - 1 : bisectorIndexForHighlight,
      0,
      firstSeriesRows.length - 1
    );

    const seriesDimensionIndex = 0;
    let flyoutXOffset;

    const startDate = parseDate(firstSeriesRows[firstSeriesIndex][seriesDimensionIndex]);
    const startDateForHighlight = parseDate(firstSeriesRows[firstSeriesIndexForHighlight][seriesDimensionIndex]);
    const endDate = getIncrementedDateByPrecision(startDate, dataToRender.precision);
    const endDateForHighlight = getIncrementedDateByPrecision(startDateForHighlight, dataToRender.precision);

    if (allSeriesAreLineVariant()) {
      flyoutXOffset = d3XScale(startDateForHighlight);
    } else {

      if (precision !== 'none') {
        // For area (bucketed) variants, we need to shift the rendered points by
        // half the width of the domain interval to the right in order for the
        // peaks to appear in the middle of the intervals, as opposed to the
        // beginning of them (if we do not do this shift, the a range of 2001-2002
        // and a value of 1000 looks like the 1000 was measured on Jan 1, 2001).
        flyoutXOffset = d3XScale(
          new Date(
            startDateForHighlight.getTime() +
            getSeriesHalfIntervalWidthInMs(dataToRenderBySeries[0])
          )
        );
      } else {
        flyoutXOffset = d3XScale(startDateForHighlight);
      }
    }

    const flyoutData = dataToRenderBySeries.map((series) => {
      const measureIndex = 1;

      let label = series.columns[measureIndex];
      // We do not want to apply formatting if the label is `(Other)` category
      if (!_.isEqual(label, I18n.t('shared.visualizations.charts.common.other_category'))) {
        const groupingColumn = _.get(self.getVif(), 'series[0].dataSource.dimension.grouping.columnName');
        label = _.isNil(groupingColumn) ? label : formatValueHTML(label, groupingColumn, dataToRender, true);
      }

      let value = series.rows[firstSeriesIndex][measureIndex];
      if (!_.isNil(value)) {
        const measureColumn = _.get(self.getVif(), 'series[0].dataSource.measure.columnName');
        value = formatValueHTML(value, measureColumn, dataToRender);
      }

      return {
        label: label,
        value: value
      };
    });

    const payload = {
      startDate,
      xOffset: flyoutXOffset,
      data: flyoutData
    };

    if (precision !== 'none') {
      payload.endDate = endDate;
    }

    showHighlight(startDateForHighlight, endDateForHighlight);
    showFlyout(payload);
  }

  function showCircleHighlight(circleElement, measure) {
    d3.select(circleElement).attr('fill', measure.getColor());
  }

  function hideCircleHighlight() {
    // NOTE: The below function depends on this being set by d3, so it is not
    // possible to use the () => {} syntax here.
    d3.selectAll('circle').each(function() {
      const selection = d3.select(this);
      selection.attr('fill', selection.attr('data-default-fill'));
    });
  }

  function showHighlight(startDate, endDate) {
    const scaledStartDate = d3XScale(startDate);
    const scaledEndDate = d3XScale(endDate);
    const rootElement = d3.select($chartElement[0]);

    let highlightWidth = Math.max(MINIMUM_HIGHLIGHT_WIDTH, scaledEndDate - scaledStartDate - 2);
    let highlightXTranslation;

    if (precision !== 'none') {
      highlightXTranslation = (allSeriesAreLineVariant()) ?
        scaledStartDate - (highlightWidth / 2) :
        scaledStartDate;
    } else {
      highlightXTranslation = scaledStartDate - (highlightWidth / 2);
    }

    // If we are offsetting the highlight left by half of its width but that
    // would place it beyond the y-axis, then start the highlight at the y-axis
    // and only render half of it. This will cause it to appear as if it has
    // been truncated by the y-axis.
    if (highlightXTranslation < 0) {
      highlightWidth = (highlightWidth / 2);
      highlightXTranslation = 0;
    }

    rootElement.select('.highlight').
      attr('display', 'block').
      attr('width', highlightWidth).
      attr('transform', `translate(${highlightXTranslation},0)`);
  }

  function hideHighlight() {
    const rootElement = d3.select($chartElement[0]);

    rootElement.select('.highlight').
      attr('display', 'none');
  }

  function showCircleFlyout(columnElement, { measure, value }) {
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

    $valueCell.html(valueHTML);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $title,
      $valueRow
    ]);

    const payload = {
      element: columnElement,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
      payload
    );
  }

  function showGroupFlyout({ dataToRender, datum, dimensionIndex, dimensionValue }) {

    // Content
    //
    const titleHTML = dimensionValue || LABEL_NO_VALUE;
    const $title = $('<tr>', { 'class': 'socrata-flyout-title' }).
    append($('<td>', { 'colspan': 2 }).
    html(titleHTML));

    const $table = $('<table>', { 'class': 'socrata-flyout-table' }).
      append($title);

    const measureValues = dataToRender.rows[dimensionIndex].slice(1);

    let $labelValueRows;

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

    // Positioning
    //
    const boundingClientRect = self.
      $element.
      find('.timeline-chart')[0].
      getBoundingClientRect();

    const flyoutXOffset = d3XScale(datum);
    let maxFlyoutValueOffset;

    if (minYValue <= 0 && maxYValue >= 0) {
      maxFlyoutValueOffset = d3YScale(0);
    } else if (maxYValue < 0) {
      maxFlyoutValueOffset = d3YScale(maxYValue);
    } else {
      maxFlyoutValueOffset = d3YScale(minYValue);
    }

    const parts = $('.x-axis-and-series').css('transform').replace(/[^0-9\-.,]/g, '').split(',');
    const translateXOffset = parseInt(parts[4], 10) || 0; // X translation when panned
    const halfBandWidth = Math.round(d3XScale.rangeBand() / 2);

    // Payload
    //
    const payload = {
      belowTarget: false,
      content: $table,
      dark: true,
      flyoutOffset: {
        left: (boundingClientRect.left + MARGINS.LEFT + flyoutXOffset + halfBandWidth + translateXOffset),
        top: (boundingClientRect.top + MARGINS.TOP + maxFlyoutValueOffset)
      },
      rightSideHint: false
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
      payload
    );
  }

  function showFlyout(flyoutData) {
    let title;

    if (_.isNil(flyoutData.endDate)) {

      const dimensionColumn = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
      const value = flyoutData.startDate.toISOString();
      title = formatValueHTML(value, dimensionColumn, dataToRender);

    } else if (allSeriesAreLineVariant()) {

      title = formatDateForFlyout(flyoutData.startDate);

    } else {

      const formattedStartDate = formatDateForFlyout(flyoutData.startDate);
      const formattedEndDate = formatDateForFlyout(flyoutData.endDate);
      title = `${formattedStartDate} to ${formattedEndDate}`;
    }

    const $title = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append($('<td>', { 'colspan': 2 }).text(title ? title : ''));

    const $table = $('<table>', { 'class': 'socrata-flyout-table' }).
      append($title);

    const $labelValueRows = flyoutData.data.
      map((datum, seriesIndex) => {
        const measure = dataToRenderBySeries[seriesIndex].measure;
        const labelMatcher = new RegExp(I18n.t('shared.visualizations.charts.common.unlabeled_measure_prefix') + seriesIndex);
        const label = labelMatcher.test(datum.label) ? '' : datum.label;

        const $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
          text(label).
          css('color', measure.getColor());

        let datumValueString;

        if (datum.value === null) {
          datumValueString = I18n.t('shared.visualizations.charts.common.no_value');
        } else {
          const datumValueUnit = (datum.value === 1) ?
            self.getUnitOneBySeriesIndex(seriesIndex) :
            self.getUnitOtherBySeriesIndex(seriesIndex);

          datumValueString = `${datum.value} ${datumValueUnit}`;
        }

        const $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
          text(datumValueString);

        return $('<tr>', { 'class': 'socrata-flyout-row' }).
          append([
            $labelCell,
            $valueCell
          ]);
      });

    // Note: d3.max will return undefined if passed an array of non-numbers
    // (such as when we try to show a flyout for a null value).
    const maxFlyoutValue = d3.max(
      flyoutData.data.map((datum) => datum.value)
    );

    let maxFlyoutValueOffset;

    function formatDateForFlyout(datetime) {
      const year = datetime.getFullYear();
      const month = [
        'Jan.',
        'Feb.',
        'Mar.',
        'Apr.',
        'May',
        'Jun.',
        'Jul.',
        'Aug.',
        'Sept.',
        'Oct.',
        'Nov.',
        'Dec.'
      ][datetime.getMonth()];
      const date = datetime.getDate();

      return `${month} ${date}, ${year}`;
    }

    $table.append($labelValueRows);

    if (_.isNumber(maxFlyoutValue)) {
      maxFlyoutValueOffset = d3YScale(maxFlyoutValue);
    } else if (minYValue <= 0 && maxYValue >= 0) {
      maxFlyoutValueOffset = d3YScale(0);
    } else if (maxYValue < 0) {
      maxFlyoutValueOffset = d3YScale(maxYValue);
    } else {
      maxFlyoutValueOffset = d3YScale(minYValue);
    }

    const boundingClientRect = self.
      $element.
      find('.timeline-chart')[0].
      getBoundingClientRect();

    const payload = {
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      flyoutOffset: {
        left: (
          boundingClientRect.left +
          MARGINS.LEFT +
          flyoutData.xOffset +
          1
        ),
        top: (
          boundingClientRect.top +
          MARGINS.TOP +
          maxFlyoutValueOffset
        )
      },
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
      null
    );
  }

  function getSeriesIndexByMeasureIndex(measureIndex) {
    const columnName = _.get(self.getVif(), 'series[0].dataSource.dimension.grouping.columnName');
    return _.isEmpty(columnName) ? measureIndex : 0;
  }

  function getIncrementedDateByPrecision(date, precision) {
    const nextDate = _.clone(date);

    switch (precision) {
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;

      case 'month':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;

      case 'day':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
    }

    return nextDate;
  }

  function conditionallyTruncateLabel(label) {
    label = _.isEmpty(label) ? noValueLabel : label;

    return (label.length >= DIMENSION_LABELS_MAX_CHARACTERS) ?
      '{0}…'.format(
        label.substring(0, DIMENSION_LABELS_MAX_CHARACTERS - 1).trim()
      ) :
      label;
  }

  function generateXAxis(xScale, width, isUsingTimeScale) {
    const xAxis = d3.svg.axis().
      scale(xScale).
      orient('bottom');

    if (isUsingTimeScale) {

      if (precision !== 'none') {
        // The value 4 is somewhat arbitrary, but was chosen to coax d3 into not
        // drawing too many ticks when the interval between data is only a day or
        // two.
        //
        // Values of 3 or less caused d3 to draw too few ticks (and sometimes none
        // at all) whereas values higher than 7 caused no discernible change from
        // the default behavior resulting from not calling `ticks()` at all for
        // the baseline visualization width of 640px.
        //
        // I understand this value as representing the number of ticks that d3
        // should attempt to fit into the VIEWPORT, not the entire domain of the
        // chart. Given that, 4 ticks across the viewport seems pretty reasonable;
        // it will likely look the worst on very wide visualizations, but the
        // flyouts will still provide precise date values to help users orient
        // data in terms of time.
        //
        // More robust solutions to this issue such as wrapping tick label text to
        // the width of the datum (bl.ocks.org/mbostock/7555321) would introduce
        // significant complexity, and I'm not convinced that the payoff justifies
        // the cost at the moment.
        xAxis.ticks(4);

      } else {

        // Display a tick every 150px or so for the non-bucketed timeline.
        let ticks = Math.floor(width / RECOMMENDED_TICK_DISTANCE);
        xAxis.ticks(ticks);
      }

    } else {

      xAxis.tickFormat((d) => {
        let label;

        if (_.isNil(d)) {
          label = noValueLabel;
        } else {
          const column = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
          label = formatValuePlainText(d, column, dataToRender);
        }

        return conditionallyTruncateLabel(label);
      });
    }

    return xAxis;
  }

  function generateYScale(minValue, maxValue, height) {
    return d3.scale.linear().
      domain([minValue, maxValue]).
      range([height, 0]);
  }

  function generateYAxis(yScale) {
    const vif = self.getVif();
    const column = _.get(vif, 'series[0].dataSource.measure.columnName');
    const renderType = _.get(dataToRender, `columnFormats.${column}.renderTypeName`);

    let formatter;
    if (renderType === 'money') {
      formatter = createMoneyFormatter(column, dataToRender);
    } else {
      formatter = (d) => formatValueHTML(d, column, dataToRender, true);
    }

    return d3.svg.axis().
      scale(yScale).
      orient('left').
      tickFormat(formatter);
  }

  function generateTimeXScale(domainStartDate, domainEndDate, width) {
    return d3.time.scale.
      utc().
      domain([domainStartDate, domainEndDate]).
      range([0, width]);
  }

  function generateCategoricalXScale(domain, width) {
    return d3.scale.ordinal().
      domain(domain).
      rangeRoundBands([0, width], 0.1, 0.05);
  }

  function isDimensionCalendarDate(dimensionColumnName, columnFormats) {
    const columnFormat = columnFormats[dimensionColumnName];
    return !_.isUndefined(columnFormat) && (columnFormat.dataTypeName === 'calendar_date');
  }

  // Gets the midpoint between each date for use as bisector dates for non-bucketed data
  //
  function getPrecisionNoneBisectorDates(rows) {
    let previousDate;
    const dates = [];

    rows.forEach((row) => {
      if (_.isNil(row[0])) {
        return;
      }

      let currentDate = parseDate(row[0]); // first index is the dimension data value

      if (!_.isNil(previousDate)) {
        dates.push(new Date((previousDate.getTime() + currentDate.getTime()) / 2));
      }

      previousDate = currentDate;
    });

    // Push a date after the last date to be the final bisector date so that we may select
    // the last data point.
    //
    if (!_.isNil(previousDate)) {
      let lastDate = new Date(previousDate.getTime());
      lastDate.setFullYear(lastDate.getFullYear() + 1); // doesn't matter how far in the future after the last date in row
      dates.push(lastDate);
    }

    return dates;
  }
}

module.exports = SvgTimelineChart;
