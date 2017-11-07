const utils = require('common/js_utils');
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const SvgVisualization = require('./SvgVisualization');
const ColumnFormattingHelpers = require('../helpers/ColumnFormattingHelpers');
const I18n = require('common/i18n').default;

// These values have been eyeballed to provide enough space for axis labels
// that have been observed 'in the wild'. They may need to be adjusted slightly
// in the future, but the adjustments will likely be small in scale.
import {
  AXIS_LABEL_MARGIN,
  DEFAULT_LINE_HIGHLIGHT_FILL,
  REFERENCE_LINES_STROKE_DASHARRAY,
  REFERENCE_LINES_STROKE_WIDTH,
  REFERENCE_LINES_UNDERLAY_THICKNESS,
  LEGEND_BAR_HEIGHT
} from './SvgStyleConstants';

import { getMeasures } from '../helpers/measure';

const MARGINS = {
  TOP: 16,
  RIGHT: 24,
  BOTTOM: 0,
  LEFT: 50
};
const CHART_PADDING = {
  RIGHT: 16
};
const COLUMN_MARGIN = 1;
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DIMENSION_LABEL_FONT_SIZE = 14;
const DIMENSION_LABEL_FONT_COLOR = '#5e5e5e';
const DIMENSION_LABELS_HEIGHT = 30;
const MEASURE_LABEL_FONT_SIZE = 14;
const MEASURE_LABEL_FONT_COLOR = '#5e5e5e';
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const SMALL_VIEWPORT_WIDTH = 440; // Not including margins, y-axis, or padding.
const MIN_TICK_WIDTH = 80; // Rough minimum size for a tick label to avoid overlap.

// Just a safeguard; the data fetching code should never make a huge # of buckets.
const MAX_BUCKET_COUNT = 500;

// Ideally the chart is pure SVG to enable image exports, but D3 won't make
// good decisions on label placement unless we pre-load the styling we intend
// to use. We're doing this in JS as opposed to CSS files because:
// * No other chart styling is in CSS files.
// * Every value must be shared with the JS anyway.
// On completion of chart render, equivalent inline attributes will be applied
// to the nodes in question, so the chart should still render as pure SVG.
function bindStyles() {
  const styleElementId = 'socrata-histogram-styles';
  if ($(`#${styleElementId}`).length === 0) {
    $('head').append(`<style type="text/css" id="${styleElementId}">
      .histogram .axis text {
        font-family: ${FONT_STACK};
      }
      .histogram .y.axis text {
        font-size: ${MEASURE_LABEL_FONT_SIZE};
      }
      .histogram .x.axis text {
        font-size: ${DIMENSION_LABEL_FONT_SIZE};
      }
    </style>`);
  }
}

function SvgHistogram($element, vif, options) {
  var self = this;
  var $chartElement;
  var dataToRender;
  var d3DimensionXScale;
  var d3YScale;
  let referenceLines;
  let measures;

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
      validateData(newData);
      dataToRender = newData;
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

    d3.select(self.$element[0]).
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

    bindStyles();

    $chartElement = $(
      '<div>',
      {
        'class': 'histogram'
      }
    );

    self.
      $element.
      find('.socrata-visualization-container').
      append($chartElement);
  }

  function validateData(newData) {
    utils.assertInstanceOf(newData, Array);
    const validateHasColumn = (series, column) =>
      utils.assert(series.columns.indexOf(column) >= 0, `columns array must specify a ${column} column`);

    newData.forEach((series) => {
      utils.assertHasProperties(series, 'rows', 'columns');
      validateHasColumn(series, 'bucket_start');
      validateHasColumn(series, 'bucket_end');
      validateHasColumn(series, 'measure');
      series.rows.forEach((row) => {
        utils.assert(row.length === 3, `row has ${row.length} columns, expected 3`);
        row.forEach((item) => utils.assertIsOneOfTypes(item, 'number'));
      });
    });

  }

  /**
   * Returns scaling to use ('linear' or 'logarithmic').
   *
   * Scale is determined by the method actually used to bucket the data. This
   * is a concern of the code passing us data to render, and is available per-
   * series at dataToRender[...].bucketType. If series specifiy different
   * bucketing methods, the first series scaling is used (TODO - revisit once
   * we support multiple series).
   *
   * Failing this, the default scale is linear.
   */
  function determineXScaleType(data) {
    return _.get(data, '[0].bucketType', 'linear');
  }

  function validateVif() {
    let currentVif = self.getVif();
    utils.assert(currentVif.series.length <= 1, 'Histogram does not currently support more than one series');
  }

  function renderData() {
    validateVif();
    const firstSeries = dataToRender[0]; // TODO support multiple series.

    // Figure out which physical columns measure, bucket_start, and bucket_end live in.
    const measureIndex = firstSeries ? firstSeries.columns.indexOf('measure') : undefined;
    const bucketStartIndex = firstSeries ? firstSeries.columns.indexOf('bucket_start') : undefined;
    const bucketEndIndex = firstSeries ? firstSeries.columns.indexOf('bucket_end') : undefined;
    const measureFromRow = (row) => row[measureIndex];
    const bucketStartFromRow = (row) => row[bucketStartIndex];
    const bucketEndFromRow = (row) => row[bucketEndIndex];

    const xScaleType = determineXScaleType(dataToRender);

    const axisLabels = self.getAxisLabels();
    const leftMargin = MARGINS.LEFT + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);
    const rightMargin = MARGINS.RIGHT + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);

    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);
    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

    var chartWidth;
    var chartHeight;
    // TODO: If we end up supporting multiple series,
    // we'll have to figure out how to merge bucket ranges.
    // For now, this does a naive implementation.
    var groupedDataToRender = _.flatMap(dataToRender, (series) =>
      series.rows.map((row) => (
        {
          x0: bucketStartFromRow(row),
          x1: bucketEndFromRow(row),
          values: [measureFromRow(row)] // Note provision for multiple values.
        }
      ))
    );

    measures = getMeasures(self, dataToRender[0]);
    referenceLines = self.getReferenceLines();

    var chartSvg;
    var viewportSvg;
    var xAxisAndSeriesSvg;
    var seriesSvg;
    var bucketGroupSvgs;
    var columnSvgs;
    var columnUnderlaySvgs;
    let referenceLineSvgs;
    let referenceLineUnderlaySvgs;
    let minYValue;
    let maxYValue;

    /**
     * Functions defined inside the scope of renderData() are stateful enough
     * to benefit from sharing variables within a single render cycle.
     */

    // See comment in renderXAxis() for an explanation as to why this is
    // separate.
    const bindXAxisOnce = _.once(() => {
      const d3XAxis = d3.svg.axis().
        scale(d3DimensionXScale).
        orient('bottom').
        tickFormat(function(d) { return utils.formatNumber(d); }).
        outerTickSize(0);

      if (viewportWidth < SMALL_VIEWPORT_WIDTH) {
        d3XAxis.ticks(Math.ceil(viewportWidth / MIN_TICK_WIDTH));
      }

      // d3's log scale potentially generates a large number of ticks.
      // Couldn't figure a way of limiting them sanely, so we'll just
      // generate 5 evenly-spaced ticks to use.
      if (xScaleType !== 'linear') {
        let range = d3DimensionXScale.range();
        let rangeMagnitude = range[1] - range[0];
        d3XAxis.tickValues(
          _.range(range[0], range[1], rangeMagnitude / 5).map(d3DimensionXScale.invert)
        );
      }

      xAxisAndSeriesSvg.
        append('g').
        attr('class', 'x axis').
        call(d3XAxis);

      // We don't need these for the baseline.
      d3XAxis.tickFormat('').tickSize(0);

      xAxisAndSeriesSvg.
        append('g').
        attr('class', 'x axis baseline').
        call(d3XAxis);
    });

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
          'translate(0,{0})'.format(chartHeight)
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
        attr(
          'data-row-index',
          (label, rowIndex) => rowIndex
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
        ).
        selectAll('path').
          attr('fill', 'none').
          attr('stroke', AXIS_DEFAULT_COLOR).
          attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    const bindYAxisOnce = _.once(() => {
      const d3YAxis = d3.svg.axis().
        scale(d3YScale).
        orient('left').
        tickFormat(function(d) { return utils.formatNumber(d); });

      chartSvg.select('.y.axis').
        call(d3YAxis);

      d3YAxis.
        tickSize(viewportWidth).
        tickFormat('');

      chartSvg.select('.y.grid').
        call(d3YAxis);
    });

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
        attr('width', chartWidth).
        attr('height', getUnderlayThickness);

      referenceLineSvgs.
        attr('shape-rendering', 'crispEdges').
        attr('stroke', (referenceLine) => referenceLine.color).
        attr('stroke-dasharray', REFERENCE_LINES_STROKE_DASHARRAY).
        attr('stroke-width', getLineThickness).
        attr('x1', 0).
        attr('y1', getYPosition).
        attr('x2', chartWidth).
        attr('y2', getYPosition);
    }

    function renderLegend() {
      const alreadyDisplayingLegendBar = (self.$container.find('.socrata-visualization-legend-bar-inner-container').length > 0);

      if (self.getShowLegend()) {

        const legendItems = self.getLegendItems({ referenceLines });

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
        // To implement this, we simply need a way of looking up measures by seriesIndex.
        // This is easily done naively via _.find(measures, { seriesIndex });
        // For more speed, consider caching _.indexBy(measures, 'seriesIndex');
        // Anyway, not implemented for now because we only support one series.
        utils.assert(seriesIndex === '0', 'Multiple series not supported in this chart yet');
        return measures[0].getColor();
      }

      bucketGroupSvgs.selectAll('.column-underlay').
        attr('y', 0).
        attr(
          'width',
          (d) => d3DimensionXScale(d.x1) - d3DimensionXScale(d.x0)
        ).
        attr('height', chartHeight).
        attr('stroke', 'none').
        attr('fill', 'transparent').
        attr('data-default-fill', getPrimaryColorOrNone);

      bucketGroupSvgs.selectAll('.column').
        attr(
          'y',
          function(d) {
            var yAttr;
            const value = maxYValue ? _.min([maxYValue, d.value]) : d.value;

            // If the value is zero or null we want it to be present at the
            // baseline for the rest of the bars (at the bottom of the chart
            // if the minimum value is 0 or more, at the top of the chart if
            // the maximum value is less than zero.
            if (value === 0 || !_.isFinite(value)) {

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
        attr('x', COLUMN_MARGIN).
        attr(
          'width',
          (d) => Math.max(1, d3DimensionXScale(d.x1) - d3DimensionXScale(d.x0) - COLUMN_MARGIN)
        ).
        attr('height', (d) => {
          if (d.value === 0 || !_.isFinite(d.value)) {
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
            const value = _.clamp(d.value, minYValue, maxYValue);

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

      xAxisAndSeriesSvg.attr(
        'transform',
        'translate(0,0)'
      );
    }

    renderLegend(); // adjusts the viewportHeight so must be called before chartHeight is set

    chartWidth = viewportWidth;
    chartHeight = viewportHeight - DIMENSION_LABELS_HEIGHT;

    if (_(dataToRender).map('rows.length').max() >= MAX_BUCKET_COUNT) {
      self.renderError(
        I18n.t('shared.visualizations.charts.histogram.error_exceeded_max_bucket_count').format(MAX_BUCKET_COUNT)
      );
      return;
    }

    /**
     * 2. Set up the x-scale
     */

    if (xScaleType === 'linear') {
      d3DimensionXScale = d3.scale.linear().domain(
        d3.extent(_.flatMap(
          dataToRender,
          (series) =>
            [
              d3.min(series.rows, bucketStartFromRow),
              d3.max(series.rows, bucketEndFromRow)
            ]
      )));
    } else {
      d3DimensionXScale = d3.scale.log().domain(
        d3.extent(_.flatMap(
          dataToRender,
          (series) =>
            [
              d3.min(series.rows, bucketStartFromRow),
              d3.max(series.rows, bucketEndFromRow)
            ]
      )));

      // Check if the domain includes or crosses zero.
      // If it does, it is impossible to display the data
      // on a log scale (as the scale would be infinite in
      // size). Another way to think about it is that the
      // range [0, 1] and [-1, 0] include an infinite number
      // of orders of magnitude.
      let domain = d3DimensionXScale.domain();
      let domainCrossesOrIncludesZero = (domain[0] * domain[1]) <= 0;
      if (domainCrossesOrIncludesZero) {
        self.renderError(
          I18n.t('shared.visualizations.charts.histogram.error_domain_includes_zero')
        );
        return;
      }
    }

    d3DimensionXScale.
      nice().
      rangeRound([0, chartWidth - CHART_PADDING.RIGHT]);

    /**
     * 3. Set up the y-scale
     */

    let measureRowExtents = _.flatMap(
      dataToRender,
      (series) => d3.extent(series.rows, measureFromRow)
    );

    if (self.getYAxisScalingMode() === 'showZero') {
      measureRowExtents.push(0);
    }

    const measureExtent = d3.extent(measureRowExtents);
    const dataMinYValue = getMinYValue(measureExtent[0], referenceLines);
    const dataMaxYValue = getMaxYValue(measureExtent[1], referenceLines);

    try {
      const limitMin = self.getMeasureAxisMinValue();
      const limitMax = self.getMeasureAxisMaxValue();

      if (limitMin && limitMax && limitMin >= limitMax) {
        self.renderError(
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      minYValue = limitMin || _.min([dataMinYValue, 0]);
      maxYValue = limitMax || _.max([dataMaxYValue, 0]);

      if (limitMin || limitMax) {
        d3YScale = d3.scale.linear().
          domain([minYValue, maxYValue]).
          range([chartHeight, 0]);
      } else {
        d3YScale = d3.scale.linear().
          domain([minYValue, maxYValue]).
          nice().
          range([chartHeight, 0]);
      }

    } catch (error) {
      self.renderError(error.message);
      return;
    }

    /**
     * 4. Clear out any existing chart.
     */

    d3.select($chartElement[0]).
      select('svg').
      remove();

    /**
     * 5. Render the chart.
     */

     // Create the top-level <svg> element first.
    chartSvg = d3.select($chartElement[0]).append('svg').
      attr('width', viewportWidth + leftMargin + rightMargin).
      attr('height', viewportHeight + topMargin + bottomMargin);

    // The viewport represents the area within the chart's container that can
    // be used to draw the x-axis, y-axis and chart marks.
    viewportSvg = chartSvg.append('g').
      attr('class', 'viewport').
      attr('transform', `translate(${leftMargin}, ${topMargin})`);

    viewportSvg.append('g').
      attr('class', 'y axis');

    viewportSvg.append('g').
      attr('class', 'y grid');

    xAxisAndSeriesSvg = viewportSvg.append('g').
      attr('class', 'x-axis-and-series');

    xAxisAndSeriesSvg.append('g').
      attr('class', 'series');

    seriesSvg = xAxisAndSeriesSvg.select('.series');

    bucketGroupSvgs = seriesSvg.selectAll('.bucket-group').
      data(groupedDataToRender);

    bucketGroupSvgs.enter().append('g').
      attr('class', 'bucket-group').
      attr(
        'transform',
        function(d) {
          return 'translate(' + d3DimensionXScale(d.x0) + ',0)';
        }
      );

    /*
     * From: [
     *   { x0: A, x1: B, values: [X, Y] }
     *   { x0: C, x1: D, values: [W, Z] }
     * ]
     *
     * To:[
     *   { x0: A, x1: B, value: X },
     *   { x0: A, x1: B, value: Y },
     *
     *   { x0: C, x1: D, value: W },
     *   { x0: C, x1: D, value: Z }
     * ]
     */
    const toIndividualColumns = (d) =>
      d.values.map((value) => ({ x0: d.x0, x1: d.x1, value: value }));

    columnUnderlaySvgs = bucketGroupSvgs.selectAll('rect.column-underlay').data(toIndividualColumns);

    columnUnderlaySvgs.enter().append('rect').
      attr('class', 'column-underlay').
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
        // Not sure what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        function(datum, seriesIndex, rowIndex) {
          return rowIndex;
        }
      );

    columnSvgs = bucketGroupSvgs.selectAll('rect.column').data(toIndividualColumns);
    columnSvgs.enter().append('rect').
      attr('class', 'column').
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
        // Not sure what the second argument actually is, but it is
        // the third argument that seems to track the row index.
        function(datum, seriesIndex, rowIndex) {
          return rowIndex;
        }
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

    renderXAxis();
    renderSeries();
    renderYAxis();
    renderReferenceLines();

    /**
     * 6. Set up event handlers for mouse interactions.
     */

    function hideHighlight() {
      chartSvg.selectAll('.column').each(function() {
        this.setAttribute('fill', this.getAttribute('data-default-fill'));
      });
    }

    bucketGroupSvgs.selectAll('.column-underlay, .column').
      on(
        'mousemove',
        function(datum) {
          const columnElement = this.parentNode.querySelector('.column');

          showColumnHighlight(columnElement);
          showColumnFlyout(
            columnElement,
            datum,
            parseInt(this.getAttribute('data-series-index'), 10)
          );
        }
      ).
      on(
        'mouseleave',
        function() {
          hideHighlight();
          hideFlyout();
        }
      );

    seriesSvg.selectAll('.reference-line-underlay').
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
      on('mouseleave',
      // NOTE: The below function depends on this being set by d3, so it is
      // not possible to use the () => {} syntax here.
        function() {
          if (!isCurrentlyPanning()) {
            hideFlyout();
            $(this).attr('fill-opacity', 0);
          }
        }
      );

    chartSvg.selectAll('text').
      attr('cursor', 'default');

    self.renderAxisLabels(chartSvg, {
      x: leftMargin,
      y: topMargin,
      width: viewportWidth,
      height: viewportHeight - DIMENSION_LABELS_HEIGHT
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

  function showColumnHighlight(columnElement) {

    var selection = d3.select(columnElement);

    selection.attr(
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

  function bucketTitleHTML(bucketData) {
    // TODO units
    const column = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
    return `${ColumnFormattingHelpers.formatValueHTML(bucketData.x0, column, dataToRender[0], true)} to ${ColumnFormattingHelpers.formatValueHTML(bucketData.x1, column, dataToRender[0], true)}`;
  }

  function seriesLabel(seriesIndex) {
    return _.get(
      self.getVif(), ['series', seriesIndex, 'label'],
      I18n.t('shared.visualizations.charts.common.flyout_value_label')
    );
  }

  function showColumnFlyout(columnElement, datum, seriesIndex) {

    utils.assert(seriesIndex === 0, 'Multiple series not supported in this chart yet');

    var titleHTML = bucketTitleHTML(datum);
    var label = seriesLabel(seriesIndex);
    var value = datum.value;
    var valueHTML;
    var payload = null;
    var $title = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append(
        $('<td>', { 'colspan': 2 }).
          html(
            (titleHTML) ? titleHTML : ''
          )
        );
    var $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
      text(label).
      css('color', measures[0].getColor());
    var $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' });
    var $valueRow = $('<tr>', { 'class': 'socrata-flyout-row' });
    var $table = $('<table>', { 'class': 'socrata-flyout-table' });

    if (value === null) {
      valueHTML = I18n.t('shared.visualizations.charts.common.no_value');
    } else {
      const unitOther = self.getUnitOtherBySeriesIndex(seriesIndex);
      const unitOne = self.getUnitOneBySeriesIndex(seriesIndex);

      const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
      valueHTML = ColumnFormattingHelpers.formatValueHTML(value, column, dataToRender[0], true);

      if (value == 1) {
        valueHTML += ` ${_.escape(unitOne)}`;
      } else {
        valueHTML += ` ${_.escape(unitOther)}`;
      }
    }

    $valueCell.
      html(valueHTML);

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

  function getMinYValue(measureExtent, referenceLines) {
    const minReferenceLinesValue = d3.min(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.min([measureExtent, minReferenceLinesValue]);
  }

  function getMaxYValue(measureExtent, referenceLines) {
    const maxReferenceLinesValue = d3.max(
      referenceLines.map(
        (referenceLine) => referenceLine.value
      )
    );

    return d3.max([measureExtent, maxReferenceLinesValue]);
  }
}

module.exports = SvgHistogram;
