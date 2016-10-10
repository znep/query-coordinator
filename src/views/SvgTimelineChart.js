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
const MAX_POINT_COUNT_WITHOUT_PAN = 1000;
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const HIGHLIGHT_COLOR = 'rgba(44, 44, 44, 0.18)';
const AREA_STROKE_WIDTH = '3px';

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

function SvgTimelineChart($element, vif) {
  const self = this;
  const parseDate = d3.
    time.
    // A 'floating timestamp', e.g. '2008-01-18T00:00:00.000'
    // (Note the lack of timezone information).
    format('%Y-%m-%dT%H:%M:%S.%L').
    parse;

  let $chartElement;
  let dataToRender;
  let minYValue;
  let maxYValue;
  let d3XScale;
  let d3YScale;
  let lastRenderedStartDate;
  let lastRenderedEndDate;
  let lastRenderedZoomTranslateOffsetFromEnd;
  let dateBisectors;

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
    const rootElement = d3.select(this.$element[0]);

    rootElement.
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
        'class': 'timeline-chart'
      }
    );

    self.
      $element.
      find('.socrata-visualization-container').
      append($chartElement);
  }

  /**
   * Visualization renderer and helper functions
   */

  function renderData() {
    const minimumDatumWidth = (self.isMobile()) ?
      MINIMUM_MOBILE_DATUM_WIDTH :
      MINIMUM_DESKTOP_DATUM_WIDTH;
    const viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    const d3ClipPathId = `timeline-chart-clip-path-${_.uniqueId()}`;
    const dimensionIndices = dataToRender.
      map(getDimensionIndexFromSeriesData);
    const measureIndices = dataToRender.
      map(getMeasureIndexFromSeriesData);
    const maxPointCount = d3.max(
      dataToRender,
      (seriesResponse) => seriesResponse.rows.length
    );
    const maxSeriesLength = d3.max(
      dataToRender.map((series) => series.rows.length)
    );

    let width;
    let xAxisPanningEnabled;
    let viewportHeight;
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

      dataToRender.forEach(function(series, seriesIndex) {
        const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
        const dimensionIndex = dimensionIndices[seriesIndex];
        const measureIndex = measureIndices[seriesIndex];

        // If we *are not* drawing a line chart, we need to draw the area fill
        // first so that the line sits on top of it in the z-stack.
        if (seriesTypeVariant !== 'line') {

          let seriesAreaSvg = viewportSvg.
            select(`.series-${seriesIndex}-${seriesTypeVariant}-area`);

          seriesAreaSvg.
            attr('d', d3AreaSeries[seriesIndex]).
            attr('clip-path', `url(#${d3ClipPathId})`).
            attr('fill', self.getSecondaryColorBySeriesIndex(seriesIndex)).
            attr('stroke', self.getSecondaryColorBySeriesIndex(seriesIndex)).
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
          attr('stroke', self.getPrimaryColorBySeriesIndex(seriesIndex)).
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
              return d3XScale(parseDate(d[dimensionIndex]));
            } else {

              // For area (bucketed) variants, we need to shift the rendered
              // points by half the width of the domain interval to the right
              // in order for the peaks to appear in the middle of the
              // intervals, as opposed to the beginning of them (if we do not
              // do this shift, the a range of 2001 - 2002 and a value of 1000
              // looks like the 1000 was measured on Jan 1, 2001).
              return d3XScale(
                new Date(
                  parseDate(d[dimensionIndex]).getTime() +
                  getSeriesHalfIntervalWidthInMs(series)
                )
              );
            }
          }).
          attr('cy', (d) => {

            return (d[measureIndex] !== null) ?
              d3YScale(d[measureIndex]) :
              -100;
          }).
          attr('fill', self.getPrimaryColorBySeriesIndex(seriesIndex)).
          attr('stroke', self.getPrimaryColorBySeriesIndex(seriesIndex));
      });
    }

    function handleZoom() {
      const translate = d3Zoom.translate();
      const translateY = translate[1];

      let translateX = translate[0];

      translateX = Math.min(translateX, 0);
      translateX = clampValue(
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

      // If a re-render is triggered before the user has panned the chart,
      // we set lastRenderedZoomTranslateOffsetFromEnd to the width of the
      // chart so that the below code won't try to interpret undefined as
      // a number and fail spectacularly (this variable is set when the user
      // pans the chart, and is initialized without a value. Setting it to
      // the width of the chart causes the chart to re-render as if it has not
      // been zoomed.
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

    // Actual execution begins here.

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      width = viewportWidth;
      xAxisPanningEnabled = false;

      if (maxPointCount > MAX_POINT_COUNT_WITHOUT_PAN) {

        self.renderError(
          I18n.translate(
            'visualizations.timeline_chart.error_exceeded_max_point_count_without_pan'
          ).format(MAX_POINT_COUNT_WITHOUT_PAN)
        );
        return;
      }
    } else {

      width = Math.max(
        viewportWidth,
        (
          minimumDatumWidth *
          maxPointCount
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
    viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    height = viewportHeight;

    // Next we can set up some data that we only want to compute once.
    dateBisectors = dataToRender.map((series, seriesIndex) => {

      return d3.
        bisector((d) => parseDate(d[dimensionIndices[seriesIndex]])).
        left;
    });

    startDate = d3.min(
      dataToRender.map((series, seriesIndex) => {
        return d3.min(series.rows, (d) => d[dimensionIndices[seriesIndex]]);
      })
    );
    endDate = d3.max(
      dataToRender.map((series, seriesIndex) => {
        return d3.max(series.rows, (d) => d[dimensionIndices[seriesIndex]]);
      })
    );

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      domainStartDate = parseDate(startDate);
      domainEndDate = parseDate(endDate);
    } else {

      if ((minimumDatumWidth * maxSeriesLength) <= viewportWidth) {

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
            dataToRender.map((series, seriesIndex) => {
              const dimensionIndex = dimensionIndices[seriesIndex];
              const lastRenderableSeriesRowIndex = Math.min(
                lastRenderableDatumIndex,
                series.rows.length - 1
              );

              return series.rows[lastRenderableSeriesRowIndex][dimensionIndex];
            })
          )
        );
      }
    }

    const dataMinYValue = d3.min(
      dataToRender.map((series, seriesIndex) => {

        return d3.min(
          series.rows,
          (d) => d[measureIndices[seriesIndex]]
        );
      })
    );

    const dataMaxYValue = d3.max(
      dataToRender.map((series, seriesIndex) => {

        return d3.max(
          series.rows,
          (d) => d[measureIndices[seriesIndex]]
        );
      })
    );

    try {
      const limitMin = self.getMeasureAxisMinValue();

      if (self.getYAxisScalingMode() === 'showZero' && !limitMin) {
        minYValue = _.min([dataMinYValue, 0]);
      } else if (limitMin) {
        minYValue = limitMin;
      } else {
        minYValue = dataMinYValue;
      }

      const limitMax = self.getMeasureAxisMaxValue();

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
      // The value 4 is somewhat arbitrary, but was chosen to coax d3
      // into not drawing too many ticks when the interval between data
      // is only a day or two.
      //
      // Values of 3 or less caused d3 to draw too few ticks (and
      // sometimes none at all) whereas values higher than 7 caused no
      // discernible change from the default behavior resulting from not
      // calling `ticks()` at all for the baseline visualization width of
      // 640px.
      //
      // I understand this value as representing the number of ticks
      // that d3 should attempt to fit into the VIEWPORT, not the entire
      // domain of the chart. Given that, 4 ticks across the viewport
      // seems pretty reasonable; it will likely look the worst on very
      // wide visualizations, but the flyouts will still provide precise
      // date values to help users orient data in terms of time.
      //
      // More robust solutions to this issue such as wrapping tick label
      // text to the width of the datum (bl.ocks.org/mbostock/7555321)
      // would introduce significant complexity, and I'm not convinced
      // that the payoff justifies the cost at the moment.
      ticks(4);

    d3YAxis = d3.svg.axis().
      scale(d3YScale).
      orient('left').
      tickFormat((d) => utils.formatNumber(d));

    d3AreaSeries = dataToRender.map((series, seriesIndex) => {
      const seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
      const dimensionIndex = dimensionIndices[seriesIndex];
      const measureIndex = measureIndices[seriesIndex];

      if (seriesTypeVariant === 'line') {
        return null;
      } else {

        return d3.svg.area().
          defined((d) => !_.isNull(d[measureIndex])).
          x((d) => {

            if (allSeriesAreLineVariant()) {
              return d3XScale(parseDate(d[dimensionIndex]));
            } else {

              // For area (bucketed) variants, we need to shift the rendered
              // points by half the width of the domain interval to the right
              // in order for the peaks to appear in the middle of the
              // intervals, as opposed to the beginning of them (if we do not
              // do this shift, the a range of 2001 - 2002 and a value of 1000
              // looks like the 1000 was measured on Jan 1, 2001).
              return d3XScale(
                new Date(
                  parseDate(d[dimensionIndex]).getTime() +
                  getSeriesHalfIntervalWidthInMs(series)
                )
              );
            }
          }).
          /* eslint-disable no-unused-vars */
          y0((d) => d3YScale(0)).
          /* eslint-enable no-unused-vars */
          y1((d) => d3YScale(d[measureIndex]));
      }
    });

    d3LineSeries = dataToRender.map((series, seriesIndex) => {
      const dimensionIndex = dimensionIndices[seriesIndex];
      const measureIndex = measureIndices[seriesIndex];

      return d3.svg.line().
        defined((d) => !_.isNull(d[measureIndex])).
        x((d) => {

          if (allSeriesAreLineVariant()) {
            return d3XScale(parseDate(d[dimensionIndex]));
          } else {

            // For area (bucketed) variants, we need to shift the rendered
            // points by half the width of the domain interval to the right
            // in order for the peaks to appear in the middle of the
            // intervals, as opposed to the beginning of them (if we do not
            // do this shift, the a range of 2001 - 2002 and a value of 1000
            // looks like the 1000 was measured on Jan 1, 2001).
            return d3XScale(
              new Date(
                parseDate(d[dimensionIndex]).getTime() +
                getSeriesHalfIntervalWidthInMs(series)
              )
            );
          }
        }).
        y((d) => {
          const value = maxYValue ? _.min([maxYValue, d[measureIndex]]) : d[measureIndex];
          return d3YScale(value);
        });
    });

    // Remove any existing root svg element.
    rootElement = d3.select($chartElement[0]);
    rootElement.select('svg').remove();

    // Render a new root svg element.
    chartSvg = rootElement.append('svg');
    chartSvg.
      attr('width', width + MARGINS.LEFT + MARGINS.RIGHT).
      attr('height', height + MARGINS.TOP + MARGINS.BOTTOM);

    // Render the viewport group.
    viewportSvg = chartSvg.append('g');
    viewportSvg.
      attr('class', 'viewport').
      attr('transform', `translate(${MARGINS.LEFT},${MARGINS.TOP})`);

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
    dataToRender.forEach((series, seriesIndex) => {
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
        // By default the zoom behavior seems to capture every conceivable
        // kind of zooming action; we actually just want it to zoom when the
        // user clicks and drags, so we need to immediately deregister the
        // event handlers for the other types.
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

    lastRenderedStartDate = startDate;
    lastRenderedEndDate = endDate;
  }

  function getDimensionIndexFromSeriesData(seriesData) {
    return seriesData.columns.indexOf('dimension');
  }

  function getMeasureIndexFromSeriesData(seriesData) {
    return seriesData.columns.indexOf('measure');
  }

  // Returns one half of the interval between the first and second data in the
  // series, in milliseconds. This is used to offset points representing
  // bucketed data so that the points fall in the middle of the bucketed
  // interval, as opposed to at its start.
  function getSeriesHalfIntervalWidthInMs(series) {
    const seriesDimensionIndex = getDimensionIndexFromSeriesData(series);

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

  function handleMouseMove() {
    const rawDate = d3XScale.invert(d3.mouse(this)[0]);
    const firstSeriesRows = dataToRender[0].rows;
    const firstSeriesDimensionIndex = dataToRender[0].
      columns.
      indexOf('dimension');
    const firstSeriesIndex = clampValue(
      dateBisectors[0](firstSeriesRows, rawDate) - 1,
      0,
      firstSeriesRows.length - 1
    );

    let startDate;
    let endDate;
    let flyoutXOffset;

    if (firstSeriesIndex === firstSeriesRows.length - 1) {

      startDate = parseDate(
        firstSeriesRows[firstSeriesIndex - 1][firstSeriesDimensionIndex]
      );
      endDate = parseDate(
        firstSeriesRows[firstSeriesIndex][firstSeriesDimensionIndex]
      );
    } else {

      startDate = parseDate(
        firstSeriesRows[firstSeriesIndex][firstSeriesDimensionIndex]
      );
      endDate = parseDate(
        firstSeriesRows[firstSeriesIndex + 1][firstSeriesDimensionIndex]
      );
    }

    if (allSeriesAreLineVariant()) {
      flyoutXOffset = d3XScale(startDate);
    } else {

      // For area (bucketed) variants, we need to shift the rendered
      // points by half the width of the domain interval to the right
      // in order for the peaks to appear in the middle of the
      // intervals, as opposed to the beginning of them (if we do not
      // do this shift, the a range of 2001 - 2002 and a value of 1000
      // looks like the 1000 was measured on Jan 1, 2001).
      flyoutXOffset = d3XScale(
        new Date(
          startDate.getTime() +
          getSeriesHalfIntervalWidthInMs(dataToRender[0])
        )
      );
    }

    const flyoutValues = dataToRender.
      map((series, seriesIndex) => {
        const dimensionIndex = getDimensionIndexFromSeriesData(series);

        let valueIndex;
        let valueDate;

        if (firstSeriesIndex === 0) {
          valueIndex = seriesIndex;
        } else {

          valueIndex = clampValue(
            dateBisectors[seriesIndex](series.rows, endDate) - 1,
            0,
            series.rows.length - 1
          );
        }

        valueDate = parseDate(
          series.rows[valueIndex][dimensionIndex]
        );

        if (valueDate >= startDate && valueDate <= endDate) {

          return {
            seriesIndex: seriesIndex,
            datum: series.rows[valueIndex]
          };
        } else {
          return null;
        }
      }).
      filter((datum) => datum !== null);

    showHighlight(startDate, endDate);
    showFlyout({
      startDate: startDate,
      endDate: endDate,
      xOffset: flyoutXOffset,
      values: flyoutValues
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

    const $labelValueRows = flyoutData.values.
      sort((value1, value2) => {
        const measureIndex1 = dataToRender[value1.seriesIndex].
          columns.
          indexOf('measure');
        const measureIndex2 = dataToRender[value2.seriesIndex].
          columns.
          indexOf('measure');

        return value1.datum[measureIndex1] <= value2.datum[measureIndex2];
      }).
      map((value) => {
        const measureIndex = dataToRender[value.seriesIndex].
          columns.
          indexOf('measure');
        const label = _.get(
          self.getVif(),
          `series[${value.seriesIndex}].label`,
          I18n.translate('visualizations.common.flyout_value_label')
        );
        const datumValue = value.datum[measureIndex];
        const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
          text(label).
          css('color', self.getPrimaryColorBySeriesIndex(value.seriesIndex));

        let datumValueString;

        if (datumValue === null) {
          datumValueString = I18n.translate('visualizations.common.no_value');
        } else {

          let formattedDatumValue = utils.formatNumber(datumValue);
          let datumValueUnit = (datumValue === 1) ?
            self.getUnitOneBySeriesIndex(value.seriesIndex) :
            self.getUnitOtherBySeriesIndex(value.seriesIndex);

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

    $table.append($labelValueRows);

    // Note: d3.max will return undefined if passed an array of non-numbers
    // (such as when we try to show a flyout for a null value).
    const maxFlyoutValue = d3.max(
      flyoutData.values.
        map((value) => {
          const measureIndex = dataToRender[value.seriesIndex].
            columns.
            indexOf('measure');

          return value.datum[measureIndex];
        })
    );

    let maxFlyoutValueOffset;

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
