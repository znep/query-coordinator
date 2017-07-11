// Vendor Imports
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
// Project Imports
const SvgVisualization = require('./SvgVisualization');
const I18n = require('common/i18n').default;
// Constants
import {
  AXIS_LABEL_MARGIN,
  LEGEND_BAR_HEIGHT
} from './SvgStyleConstants';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 16,
  RIGHT: 24,
  BOTTOM: 24,
  LEFT: 50
};
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABEL_FONT_SIZE = 14;
const DIMENSION_LABEL_FONT_COLOR = '#5e5e5e';
const MEASURE_LABEL_FONT_SIZE = 14;
const MEASURE_LABEL_FONT_COLOR = '#5e5e5e';
const MINIMUM_DESKTOP_DATUM_WIDTH = 20;
const MINIMUM_MOBILE_DATUM_WIDTH = 50;
const MAX_ROW_COUNT_WITHOUT_PAN = 1000;
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const HIGHLIGHT_COLOR = 'rgba(44, 44, 44, 0.18)';
const AREA_STROKE_WIDTH = '3px';

function SvgTimelineChart($element, vif, options) {
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
  let dataToRender;
  let dataToRenderBySeries;
  let minYValue;
  let maxYValue;
  let d3XScale;
  let d3YScale;
  let lastRenderedStartDate;
  let lastRenderedEndDate;
  let lastRenderedZoomTranslateOffsetFromEnd;
  let dateBisector;
  let measureLabels;

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

    renderData();
  };

  this.invalidateSize = function() {

    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  this.destroy = function() {
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
    measureLabels = dataTable.columns.slice(dataTableDimensionIndex + 1);
    const dataTablesBySeries = measureLabels.map((measureLabel, i) => {
      const dataTableMeasureIndex = dataTableDimensionIndex + 1 + i;
      const rows = dataTable.rows.map((row) => {
        return [
          row[dataTableDimensionIndex],
          row[dataTableMeasureIndex]
        ];
      });

      return {
        columns: ['dimension', measureLabel],
        rows: rows
      };
    });

    return dataTablesBySeries;
  }

  /**
   * Visualization renderer and helper functions
   */

  function renderData() {
    const minimumDatumWidth = (self.isMobile()) ?
      MINIMUM_MOBILE_DATUM_WIDTH :
      MINIMUM_DESKTOP_DATUM_WIDTH;

    const axisLabels = self.getAxisLabels();
    const leftMargin = MARGINS.LEFT + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);
    const rightMargin = MARGINS.RIGHT + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);

    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);
    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

    const d3ClipPathId = `timeline-chart-clip-path-${_.uniqueId()}`;
    const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
    const seriesDimensionIndex = 0;
    const seriesMeasureIndex = 1;

    let width;
    let xAxisPanningEnabled;
    let height;
    let startDate;
    let endDate;
    let domainStartDate;
    let domainEndDate;
    let d3XAxis;
    let d3YAxis;
    let d3LineSeries;
    let d3AreaSeries;
    let d3Zoom;
    let rootElement;
    let chartSvg;
    let viewportSvg;

    function renderXAxis() {
      const renderedXAxisSvg = viewportSvg.select('.x.axis');
      const renderedXAxisBaselineSvg = viewportSvg.select('.x.axis.baseline');

      renderedXAxisSvg.
        attr(
          'transform',
          `translate(0,${height})`
        ).
        call(d3XAxis);

      renderedXAxisSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');

      renderedXAxisSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_TICK_COLOR).
        attr('shape-rendering', 'crispEdges');

      renderedXAxisSvg.selectAll('text').
        attr('font-family', FONT_STACK).
        attr('font-size', `${DIMENSION_LABEL_FONT_SIZE}px`).
        attr('fill', DIMENSION_LABEL_FONT_COLOR).
        attr('stroke', 'none');

      const baselineValue = _.clamp(0, minYValue, maxYValue);

      let d3XBaselineAxis = d3XAxis.
        tickFormat('').
        tickSize(0);

      renderedXAxisBaselineSvg.
        attr(
          'transform',
          `translate(0,${d3YScale(baselineValue)})`
        ).
        call(d3XBaselineAxis);

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
        attr(
          'transform',
          `translate(${viewportWidth},0)`
        ).
        call(d3YGridAxis);

      renderedYAxisGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      renderedYAxisGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    function renderValues() {

      dataToRenderBySeries.forEach(function(seriesData, seriesIndex) {
        const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

        // If we *are not* drawing a line chart, we need to draw the area fill
        // first so that the line sits on top of it in the z-stack.
        if (seriesTypeVariant !== 'line') {

          let seriesAreaSvg = viewportSvg.
            select(`.series-${seriesIndex}-${seriesTypeVariant}-area`);

          seriesAreaSvg.
            attr('d', d3AreaSeries[seriesIndex]).
            attr('clip-path', `url(#${d3ClipPathId})`).
            // Note that temporarily, the type variant defaults to 'area' if it
            // is not set, but direction from UX is to never show a shaded area,
            // only the area's top contour. As such, we make the area itself
            // transparent (instead of getting a color from the VIF or defaults
            // using self.getSecondaryColorBySeriesIndex()).
            attr(
              'fill',
              'transparent'
            ).
            attr(
              'stroke',
              'transparent'
            ).
            attr('stroke-width', AREA_STROKE_WIDTH).
            attr('opacity', '0.1');
        }

        // We draw the line for all type variants of timeline chart.
        let seriesLineSvg = viewportSvg.
          select(`.series-${seriesIndex}-${seriesTypeVariant}-line`);

        seriesLineSvg.
          attr('d', d3LineSeries[seriesIndex]).
          attr('clip-path', `url(#${d3ClipPathId})`).
          attr('fill', 'none').
          attr(
            'stroke',
            getColorByVariantAndSeriesIndex('primary', seriesIndex)
          ).
          attr('stroke-width', AREA_STROKE_WIDTH);

        const seriesDotsPathSvg = viewportSvg.
          select(`.series-${seriesIndex}-line-dots`);

        seriesDotsPathSvg.attr('clip-path', `url(#${d3ClipPathId})`);

        const seriesDotsSvg = seriesDotsPathSvg.selectAll('circle');
        // If we *are* drawing a line chart we also draw the dots bigger to
        // indicate individual points in the data. If we are drawing an area
        // chart the dots help to indicate non-contiguous sections which may
        // be drawn at 1 pixel wide and nearly invisible with the fill color
        // alone.
        const radius = (seriesTypeVariant === 'line') ? 2 : 1;

        seriesDotsSvg.
          attr('r', radius).
          attr('cx', (d) => {

            if (allSeriesAreLineVariant()) {
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
          }).
          attr('cy', (d) => {

            return (d[seriesMeasureIndex] !== null) ?
              d3YScale(d[seriesMeasureIndex]) :
              -100;
          }).
          attr(
            'fill',
            getColorByVariantAndSeriesIndex('primary', seriesIndex)
          ).
          attr(
            'stroke',
            getColorByVariantAndSeriesIndex('primary', seriesIndex)
          );
      });
    }

    function handleZoom() {
      const translate = d3Zoom.translate();
      const translateY = translate[1];

      let translateX = translate[0];

      translateX = Math.min(translateX, 0);
      translateX = _.clamp(
        translateX,
        -(width - viewportWidth),
        0
      );

      lastRenderedZoomTranslateOffsetFromEnd = width - Math.abs(translateX);

      d3Zoom.translate([translateX, translateY]);

      renderXAxis();
      renderValues();

      if (self.isMobile()) {

        hideHighlight();
        hideFlyout();
      }
    }

    function restoreLastRenderedZoom() {
      let translateX;

      // If a re-render is triggered before the user has panned the chart, we
      // set lastRenderedZoomTranslateOffsetFromEnd to the width of the chart so
      // that the below code won't try to interpret undefined as a number and
      // fail spectacularly (this variable is set when the user pans the chart,
      // and is initialized without a value. Setting it to the width of the
      // chart causes the chart to re-render as if it has not been zoomed.
      if (!_.isNumber(lastRenderedZoomTranslateOffsetFromEnd)) {
        lastRenderedZoomTranslateOffsetFromEnd = width;
      }

      translateX = Math.max(
        (width - lastRenderedZoomTranslateOffsetFromEnd) * -1,
        (width - viewportWidth) * -1
      );

      d3Zoom.translate([translateX, 0]);

      renderXAxis();
      renderValues();
    }

    function renderLegend() {
      const alreadyDisplayingLegendBar = (self.$container.find('.socrata-visualization-legend-bar-inner-container').length > 0);

      if (self.getShowLegend()) {

        self.renderLegendBar(measureLabels, (i) => self.getColor(dataTableDimensionIndex, i, measureLabels));
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
        (
          minimumDatumWidth *
          dataToRender.rows.length
        )
      );
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
    height = viewportHeight;

    // Next we can set up some data that we only want to compute once.
    dateBisector = d3.bisector((d) => parseDate(d[seriesDimensionIndex])).left;

    startDate = d3.min(
      dataToRenderBySeries.map((seriesData) => {
        return d3.min(seriesData.rows, (d) => d[seriesDimensionIndex]);
      })
    );
    endDate = d3.max(
      dataToRenderBySeries.map((series) => {
        return d3.max(series.rows, (d) => d[seriesDimensionIndex]);
      })
    );

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      domainStartDate = parseDate(startDate);
      domainEndDate = parseDate(endDate);
    } else {

      if ((minimumDatumWidth * dataToRender.rows.length) <= viewportWidth) {

        domainStartDate = parseDate(startDate);
        domainEndDate = parseDate(endDate);
      } else {

        const lastRenderableDatumIndex = Math.floor(
          viewportWidth /
          minimumDatumWidth
        );

        domainStartDate = parseDate(startDate);
        domainEndDate = parseDate(
          d3.min(
            dataToRenderBySeries.map((series) => {
              const lastRenderableRowIndex = Math.min(
                lastRenderableDatumIndex,
                series.rows.length - 1
              );

              return series.rows[lastRenderableRowIndex][seriesDimensionIndex];
            })
          )
        );
      }
    }
    const allMeasureValues = _.flatMap(
      dataToRender.rows.map((row) => {
        return row.slice(dataTableDimensionIndex + 1);
      })
    );
    const dataMinYValue = d3.min(allMeasureValues);
    const dataMaxYValue = d3.max(allMeasureValues);

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

    d3XScale = d3.time.scale.
      utc().
      domain([domainStartDate, domainEndDate]).
      range([0, viewportWidth]);

    d3YScale = d3.scale.
      linear().
      domain([minYValue, maxYValue]).
      range([viewportHeight, 0]).
      clamp(true);

    d3XAxis = d3.svg.axis().
      scale(d3XScale).
      orient('bottom').
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
      ticks(4);

    d3YAxis = d3.svg.axis().
      scale(d3YScale).
      orient('left').
      tickFormat((d) => {
        // This is a workaround for a bug in D3 v3.x, (fixed in v4.x): https://github.com/d3/d3/issues/1722
        return Math.abs(parseFloat(d)) < 0.00000001 ? utils.formatNumber(0) : utils.formatNumber(d);
      });

    d3AreaSeries = dataToRenderBySeries.map((series, seriesIndex) => {
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);

      if (seriesTypeVariant === 'line') {
        return null;
      } else {

        return d3.svg.area().
          defined((d) => !_.isNull(d[seriesMeasureIndex])).
          x((d) => {

            if (allSeriesAreLineVariant()) {
              return d3XScale(parseDate(d[seriesDimensionIndex]));
            } else {

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
            }
          }).
          /* eslint-disable no-unused-vars */
          y0((d) => d3YScale(0)).
          /* eslint-enable no-unused-vars */
          y1((d) => d3YScale(d[seriesMeasureIndex]));
      }
    });

    d3LineSeries = dataToRenderBySeries.map((series) => {

      return d3.svg.line().
        defined((d) => !_.isNull(d[seriesMeasureIndex])).
        x((d) => {

          if (allSeriesAreLineVariant()) {
            return d3XScale(parseDate(d[seriesDimensionIndex]));
          } else {

            // For area (bucketed) variants, we need to shift the rendered
            // points by half the width of the domain interval to the right in
            // order for the peaks to appear in the middle of the intervals, as
            // opposed to the beginning of them (if we do not do this shift, the
            // a range of 2001-2002 and a value of 1000 looks like the 1000 was
            // measured on Jan 1, 2001).
            return d3XScale(
              new Date(
                parseDate(d[seriesDimensionIndex]).getTime() +
                getSeriesHalfIntervalWidthInMs(series)
              )
            );
          }
        }).
        y((d) => {
          const value = (maxYValue) ?
            _.min([maxYValue, d[seriesMeasureIndex]]) :
            d[seriesMeasureIndex];

          return d3YScale(value);
        });
    });

    // Remove any existing root svg element.
    rootElement = d3.select($chartElement[0]);
    rootElement.select('svg').remove();

    // Render a new root svg element.
    chartSvg = rootElement.append('svg');
    chartSvg.
      attr('width', width + leftMargin + rightMargin).
      attr('height', height + topMargin + bottomMargin);

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
      attr('width', viewportWidth).
      attr('height', viewportHeight);

    // Render the y- and x-axis.
    const yAxisSvg = viewportSvg.append('g');
    yAxisSvg.attr('class', 'y axis');

    const yAxisGridSvg = viewportSvg.append('g');
    yAxisGridSvg.attr('class', 'y grid');

    const xAxisSvg =  viewportSvg.append('g');
    xAxisSvg.attr('class', 'x axis');

    const xAxisBaselineSvg = viewportSvg.append('g');
    xAxisBaselineSvg.attr('class', 'x axis baseline');

    // Render the actual marks.
    dataToRenderBySeries.forEach((series, seriesIndex) => {
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
      const areaSvg = viewportSvg.append('path');
      const lineSvg = viewportSvg.append('path');
      const dotsGroupSvg = viewportSvg.append('g');
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

    const highlightSvg = viewportSvg.append('rect');
    highlightSvg.
      attr('class', 'highlight').
      attr('fill', HIGHLIGHT_COLOR).
      attr('stroke', 'none').
      attr('opacity', '0').
      attr('height', height);

    const overlaySvg = viewportSvg.append('rect');
    overlaySvg.
      attr('class', 'overlay').
      attr('width', width).
      attr('height', height).
      attr('fill', 'none').
      attr('stroke', 'none').
      on('mousemove', handleMouseMove).
      on(
        'mouseleave',
        () => {

          hideHighlight();
          hideFlyout();
        }
      );

    renderXAxis();
    renderYAxis();
    renderValues();

    if (xAxisPanningEnabled) {

      d3Zoom = d3.behavior.zoom().
        scaleExtent([1, 1]).
        x(d3XScale).
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

      if (
        startDate === lastRenderedStartDate &&
        endDate === lastRenderedEndDate
      ) {
        restoreLastRenderedZoom();
      }
    }

    self.renderAxisLabels(chartSvg, {
      x: leftMargin,
      y: topMargin,
      width: viewportWidth,
      height: viewportHeight
    });

    lastRenderedStartDate = startDate;
    lastRenderedEndDate = endDate;
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

  function getColorByVariantAndSeriesIndex(colorVariant, seriesIndex) {
    const isGrouping = !_.isNull(
      _.get(
        self.getVif(),
        'series[0].dataSource.dimension.grouping.columnName',
        null
      )
    );
    const usingColorPalette = _.get(
      self.getVif(),
      'series[0].color.palette',
      false
    );

    function getColorFromPalette() {
      const palette = usingColorPalette === 'custom' ?
        self.getColorPaletteByColumnTitles(measureLabels) :
        self.getColorPaletteBySeriesIndex(seriesIndex);

      return palette[seriesIndex];
    }

    function getColorFromVif() {

      switch (colorVariant) {

        case 'primary':
          return self.getPrimaryColorBySeriesIndex(seriesIndex);

        case 'secondary':
          return self.getSecondaryColorBySeriesIndex(seriesIndex);

        default:
          throw new Error(
            `Unable to select unrecognized color variant "${colorVariant}""`
          );
      }
    }

    return (isGrouping) ?
      getColorFromPalette() :
      getColorFromVif();
  }

  function handleMouseMove() {
    const rawDate = d3XScale.invert(d3.mouse(this)[0]);
    const firstSeriesRows = dataToRenderBySeries[0].rows;
    const firstSeriesIndex = _.clamp(
      dateBisector(firstSeriesRows, rawDate) - 1,
      0,
      firstSeriesRows.length - 1
    );
    const seriesDimensionIndex = 0;

    let startDate;
    let endDate;
    let flyoutXOffset;

    if (firstSeriesIndex === firstSeriesRows.length - 1) {

      startDate = parseDate(
        firstSeriesRows[firstSeriesIndex - 1][seriesDimensionIndex]
      );
      endDate = parseDate(
        firstSeriesRows[firstSeriesIndex][seriesDimensionIndex]
      );
    } else {

      startDate = parseDate(
        firstSeriesRows[firstSeriesIndex][seriesDimensionIndex]
      );
      endDate = parseDate(
        firstSeriesRows[firstSeriesIndex + 1][seriesDimensionIndex]
      );
    }

    if (allSeriesAreLineVariant()) {
      flyoutXOffset = d3XScale(startDate);
    } else {

      // For area (bucketed) variants, we need to shift the rendered points by
      // half the width of the domain interval to the right in order for the
      // peaks to appear in the middle of the intervals, as opposed to the
      // beginning of them (if we do not do this shift, the a range of 2001-2002
      // and a value of 1000 looks like the 1000 was measured on Jan 1, 2001).
      flyoutXOffset = d3XScale(
        new Date(
          startDate.getTime() +
          getSeriesHalfIntervalWidthInMs(dataToRenderBySeries[0])
        )
      );
    }

    const flyoutData = dataToRenderBySeries.map((series) => {
      const measureIndex = 1;
      const label = series.columns[measureIndex];

      return {
        label: label,
        value: series.rows[firstSeriesIndex][measureIndex]
      };
    });

    showHighlight(startDate, endDate);
    showFlyout({
      startDate: startDate,
      endDate: endDate,
      xOffset: flyoutXOffset,
      data: flyoutData
    });
  }

  function showHighlight(startDate, endDate) {
    const scaledStartDate = d3XScale(startDate);
    const scaledEndDate = d3XScale(endDate);
    const rootElement = d3.select($chartElement[0]);

    let highlightWidth = Math.max(2, scaledEndDate - scaledStartDate - 2);
    let highlightXTranslation = (allSeriesAreLineVariant()) ?
      scaledStartDate - (highlightWidth / 2) :
      scaledStartDate;

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

  function showFlyout(flyoutData) {
    const boundingClientRect = self.
      $element.
      find('.timeline-chart')[0].
      getBoundingClientRect();
    const formattedStartDate = formatDateForFlyout(flyoutData.startDate);
    const formattedEndDate = formatDateForFlyout(flyoutData.endDate);
    const title = (allSeriesAreLineVariant()) ?
      `${formattedStartDate}` :
      `${formattedStartDate} to ${formattedEndDate}`;
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append($('<td>', {'colspan': 2}).text(title ? title : ''));
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    const $labelValueRows = flyoutData.data.
      map((datum, seriesIndex) => {
        const labelMatcher = new RegExp(I18n.t('shared.visualizations.charts.common.unlabeled_measure_prefix') + seriesIndex);
        const label = labelMatcher.test(datum.label) ? '' : datum.label;
        const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
          text(label).
          css('color', getColorByVariantAndSeriesIndex('primary', seriesIndex));

        let datumValueString;

        if (datum.value === null) {
          datumValueString = I18n.t('shared.visualizations.charts.common.no_value');
        } else {

          const formattedDatumValue = utils.formatNumber(datum.value);
          const datumValueUnit = (datum.value === 1) ?
            self.getUnitOneBySeriesIndex(seriesIndex) :
            self.getUnitOtherBySeriesIndex(seriesIndex);

          datumValueString = `${formattedDatumValue} ${datumValueUnit}`;
        }

        const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'}).
          text(datumValueString);

        return $('<tr>', {'class': 'socrata-flyout-row'}).
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
}

module.exports = SvgTimelineChart;
