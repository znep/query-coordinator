// Vendor Imports
const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
// Project Imports
const ColumnFormattingHelpers = require('../helpers/ColumnFormattingHelpers');
const SvgVisualization = require('./SvgVisualization');
const DataTypeFormatter = require('./DataTypeFormatter');
const I18n = require('common/i18n').default;

// Constants
import {
  AXIS_LABEL_MARGIN,
  LEGEND_BAR_HEIGHT
} from './SvgStyleConstants';

// The MARGINS values have been eyeballed to provide enough space for axis
// labels that have been observed 'in the wild'. They may need to be adjusted
// slightly in the future, but the adjustments will likely be small in scale.
// The LEFT margin has been removed because it will be dynamically calculated.
const MARGINS = {
  TOP: 16,
  RIGHT: 0,
  BOTTOM: 0
};
const MINIMUM_LABEL_WIDTH = 35;
const LABEL_PADDING_WIDTH = 15;
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
/* eslint-disable no-unused-vars */
const MAX_COLUMN_COUNT_WITHOUT_PAN = 50;
/* eslint-enable no-unused-vars */
const AXIS_DEFAULT_COLOR = '#979797';
const AXIS_TICK_COLOR = '#adadad';
const AXIS_GRID_COLOR = '#f1f1f1';
const NO_VALUE_SENTINEL = '__NO_VALUE__';

function SvgColumnChart($element, vif, options) {
  const self = this;
  let $chartElement;
  let dataToRender;
  let d3DimensionXScale;
  let d3GroupingXScale;
  let d3YScale;
  let lastRenderedSeriesWidth = 0;
  let lastRenderedZoomTranslate = 0;
  let measureLabels;

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
        'class': 'column-chart'
      }
    );

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  function renderData() {
    const columnWidth = (self.isMobile()) ?
      DEFAULT_MOBILE_COLUMN_WIDTH :
      DEFAULT_DESKTOP_COLUMN_WIDTH;

    const axisLabels = self.getAxisLabels();
    const rightMargin = MARGINS.RIGHT + (axisLabels.right ? AXIS_LABEL_MARGIN : 0);
    const topMargin = MARGINS.TOP + (axisLabels.top ? AXIS_LABEL_MARGIN : 0);
    const bottomMargin = MARGINS.BOTTOM + (axisLabels.bottom ? AXIS_LABEL_MARGIN : 0);

    let viewportHeight = Math.max(0, $chartElement.height() - topMargin - bottomMargin);

    const leftMargin = calculateLeftMargin(viewportHeight) + (axisLabels.left ? AXIS_LABEL_MARGIN : 0);

    const viewportWidth = Math.max(0, $chartElement.width() - leftMargin - rightMargin);

    const d3ClipPathId = `column-chart-clip-path-${_.uniqueId()}`;
    const dataTableDimensionIndex = dataToRender.columns.indexOf('dimension');
    const dimensionValues = dataToRender.rows.map(
      (row) => row[dataTableDimensionIndex]
    );
    // Grouped column charts will have multiple columns. If one of those columns is null (which is
    // a valid value for it to be if there are nulls in the dataset), we need to replace it with
    // the no value label. If there are not multiple columns, that's an expected null that we
    // should not overwrite with the no value label. "multiple columns" === greater than 2 because
    // the first element is going to be 'dimension'.
    const hasMultipleColumns = dataToRender.columns.length > 2;
    const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');
    measureLabels = dataToRender.columns.slice(dataTableDimensionIndex + 1).
      map((label) => hasMultipleColumns ? label || noValueLabel : label);

    let width;
    let height;
    let groupedDataToRender;
    let numberOfGroups;
    let numberOfItemsPerGroup;
    let minYValue;
    let maxYValue;
    let d3XAxis;
    let d3YAxis;
    let d3Zoom;
    let chartSvg;
    let viewportSvg;
    let clipPathSvg;
    let xAxisAndSeriesSvg;
    let seriesSvg;
    let dimensionGroupSvgs;
    let columnUnderlaySvgs;
    let columnSvgs;
    let xAxisBound = false;
    let yAxisBound = false;
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

      if (!isStacked) {

        dimensionGroupSvgs.selectAll('.column-underlay').
          attr(
            'x',
            (d, measureIndex) => {
              return d3GroupingXScale(measureLabels[measureIndex]);
            }
          ).
          attr('y', 0).
          attr('width', Math.max(d3GroupingXScale.rangeBand() - 1, 0)).
          attr('height', height).
          attr('stroke', 'none').
          attr('fill', 'transparent').
          attr(
            'data-default-fill',
            (measureValue, measureIndex, dimensionIndex) => {
              return self.getColor(dimensionIndex, measureIndex);
            }
          );
      }

      const columns = dimensionGroupSvgs.selectAll('.column');

      columns.
        attr('y', (d, measureIndex, dimensionIndex) => {
          const position = positions[dimensionIndex][measureIndex];
          return d3YScale(position.end);
        }).
        attr('height', (d, measureIndex, dimensionIndex) => {
          const position = positions[dimensionIndex][measureIndex];
          const value = position.end - position.start;
          return Math.max(d3YScale(0) - d3YScale(value), 1);
        }).
        attr('stroke', 'none').
        attr(
          'fill',
          (value, measureIndex, dimensionIndex) => {
            return self.getColor(dimensionIndex, measureIndex);
          }
        ).
        attr(
          'data-default-fill',
          (value, measureIndex, dimensionIndex) => {

            return self.getColor(dimensionIndex, measureIndex);
          }
        );

      if (isStacked) {

        columns.
          attr('x', 0).
          attr('width', Math.max(d3DimensionXScale.rangeBand() - 1, 0));

      } else {

        columns.
          attr('x', (d, measureIndex) => d3GroupingXScale(measureLabels[measureIndex])).
          attr('width', Math.max(d3GroupingXScale.rangeBand() - 1, 0));
      }

      lastRenderedSeriesWidth = xAxisAndSeriesSvg.node().getBBox().width;

      // xAxisAndSeriesSvg.
      //   attr(
      //     'transform',
      //     'translate(0,0)'
      //   );
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

        self.renderLegendBar(measureLabels, (i) => self.getColor(dataTableDimensionIndex, i));
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

    const isStacked = _.get(self.getVif(), 'series[0].stacked', false);

    groupedDataToRender = dataToRender.rows;
    numberOfGroups = groupedDataToRender.length;
    numberOfItemsPerGroup = isStacked ? 1 : dataToRender.rows[0].length - 1;

    // Compute width based on the x-axis scaling mode.
    // if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

    //   width = viewportWidth;

    //   // We limit the total column count to 30 when not allowing panning so
    //   // that the the labels do not overlap each other.
    //   columnCount = (
    //     // The first term is the number of groups we are rendering.
    //     groupedDataToRender.length *
    //     // The second term finds the maximum number of columns per group.
    //     d3.max(
    //       groupedDataToRender,
    //       function(d) {
    //         return d[1].length;
    //       }
    //     )
    //   );

    //   if (columnCount >= MAX_COLUMN_COUNT_WITHOUT_PAN) {

    //     self.renderError(
    //       I18n.t(
    //         'shared.visualizations.charts.column_chart.error_exceeded_max_column_count_without_pan'
    //       ).format(MAX_COLUMN_COUNT_WITHOUT_PAN)
    //     );
    //     return;
    //   }
    // } else {

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
    // See TODO above.
    // }

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
      self.isMultiSeries()
    );

    // This scale is used for groupings of columns under a single dimension
    // category.
    d3GroupingXScale = generateXGroupScale(measureLabels, d3DimensionXScale);
    d3XAxis = generateXAxis(d3DimensionXScale);

    /**
     * 3. Set up the y-scale and -axis.
     */

    try {

      const dataMinSummedYValue = getMinSummedYValue(
        groupedDataToRender,
        dataTableDimensionIndex
      );

      const dataMaxSummedYValue = getMaxSummedYValue(
        groupedDataToRender,
        dataTableDimensionIndex
      );

      const dataMinYValue = getMinYValue(
        groupedDataToRender,
        dataTableDimensionIndex
      );

      const dataMaxYValue = getMaxYValue(
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
          I18n.t(
            'shared.visualizations.charts.common.validation.errors.' +
            'measure_axis_min_should_be_lesser_then_max'
          )
        );
        return;
      }

      if (isStacked) {

        if (self.getYAxisScalingMode() === 'showZero' && !measureAxisMinValue) {
          minYValue = Math.min(dataMinSummedYValue, 0);
        } else if (measureAxisMinValue) {
          minYValue = measureAxisMinValue;
        } else {
          minYValue = dataMinSummedYValue;
        }

        if (self.getYAxisScalingMode() === 'showZero' && !measureAxisMaxValue) {
          maxYValue = Math.max(dataMaxSummedYValue, 0);
        } else if (measureAxisMaxValue) {
          maxYValue = measureAxisMaxValue;
        } else {
          maxYValue = dataMaxSummedYValue;
        }

      } else {

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
      }

      if (minYValue >= maxYValue) {
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

    d3YScale = generateYScale(minYValue, maxYValue, height);
    d3YAxis = generateYAxis(d3YScale);

    /**
     * 4. Clear out any existing chart.
     */

    d3.select($chartElement[0]).select('svg').
      remove();

    /**
     * 5. Render the chart.
     */
    const positions = isStacked ?
      self.getStackedPositionsForRange(groupedDataToRender, minYValue, maxYValue) :
      self.getPositionsForRange(groupedDataToRender, minYValue, maxYValue);

    // Create the top-level <svg> element first.
    chartSvg = d3.select($chartElement[0]).append('svg').
      attr('width', width + leftMargin + rightMargin).
      attr('height', viewportHeight + topMargin + bottomMargin);

    // The viewport represents the area within the chart's container that can
    // be used to draw the x-axis, y-axis and chart marks.
    viewportSvg = chartSvg.append('g').
      attr('class', 'viewport').
      attr('transform', `translate(${leftMargin}, ${topMargin})`) ;

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
      attr('width', viewportWidth + leftMargin + rightMargin).
      attr('height', viewportHeight + topMargin + bottomMargin);

    viewportSvg.append('g').
      attr('class', 'y axis');

    viewportSvg.append('g').
      attr('class', 'y grid');

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
      data(groupedDataToRender).
      enter().
      append('g');

    dimensionGroupSvgs.
      attr('class', 'dimension-group').
      attr('data-dimension-value', (datum, dimensionIndex, measureIndex) => {
        const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
        const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
        return _.isNil(datum[0]) ?
          NO_VALUE_SENTINEL :
          ColumnFormattingHelpers.formatValue(datum[0], column, dataToRender);
      }).
      attr('transform', (d) => `translate(${d3DimensionXScale(d[0])},0)`);

    if (!isStacked) {

      columnUnderlaySvgs = dimensionGroupSvgs.selectAll('rect.column-underlay').
        data((d) => d.slice(1)).
        enter().
        append('rect');

      columnUnderlaySvgs.
        attr('class', 'column-underlay').
        attr(
          'data-dimension-value',
          (datum, measureIndex, dimensionIndex) => {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
            return ColumnFormattingHelpers.formatValue(dimensionValues[dimensionIndex], column, dataToRender);
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

    columnSvgs = dimensionGroupSvgs.selectAll('rect.column').
      data((d) => d.slice(1)).
      enter().
      append('rect');

    columnSvgs.
      attr('class', 'column').
      attr(
        'data-dimension-value',
        (datum, measureIndex, dimensionIndex) => {
          const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
          const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
          return ColumnFormattingHelpers.formatValue(dimensionValues[dimensionIndex], column, dataToRender);
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

    // TODO: Figure out how we want to handle scaling modes.
    // if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

    //   // If we do not have to support panning then rendering is somewhat more
    //   // straightforward.
    //   renderXAxis();
    //   renderSeries();
    //   renderYAxis();
    // } else {

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
    // See TODO above.
    // }

    /**
     * 6. Set up event handlers for mouse interactions.
     */
    if (!isStacked) {

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
              const color = self.getColor(dimensionIndex, measureIndex);
              const label = measureLabels[measureIndex];
              // d3's .datum() method gives us the entire row, whereas everywhere
              // else measureIndex refers only to measure values. We therefore
              // add one to measure index to get the actual measure value from
              // the raw row data provided by d3 (the value at element 0 of the
              // array returned by .datum() is the dimension value).
              const value = d3.select(this.parentNode).datum()[measureIndex + 1];

              showColumnHighlight(siblingColumn);
              showColumnFlyout(siblingColumn, color, label, value);
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
            const color = self.getColor(dimensionIndex, measureIndex);
            const label = measureLabels[measureIndex];
            // d3's .datum() method gives us the entire row, whereas everywhere
            // else measureIndex refers only to measure values. We therefore
            // add one to measure index to get the actual measure value from
            // the raw row data provided by d3 (the value at element 0 of the
            // array returned by .datum() is the dimension value).
            const value = d3.select(this.parentNode).datum()[measureIndex + 1];

            showColumnHighlight(this);
            showColumnFlyout(this, color, label, value);
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

    chartSvg.selectAll('.x.axis .tick text').
      on(
        'mousemove',
        (datum, dimensionIndex, measureIndex) => {

          if (!isCurrentlyPanning()) {
            const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
            const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.dimension.columnName`);
            const dimensionValue = _.isNil(datum[0]) ?
              NO_VALUE_SENTINEL :
              ColumnFormattingHelpers.formatValue(datum[0], column, dataToRender);
            const dimensionGroup = xAxisAndSeriesSvg.select(
              `g.dimension-group[data-dimension-value="${dimensionValue}"]`
            );

            showGroupFlyout(dimensionGroup, dimensionValues);
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
    label = _.isNull(label) ? I18n.t('shared.visualizations.charts.common.no_value') : label;

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
      /* eslint-disable no-unused-vars */
      tickFormat((d, i) => {
      /* eslint-enable no-unused-vars */

        // TODO: Figure out how we want to handle scaling modes.
        // if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {
        //   if (i < 5) {
        //     return conditionallyTruncateLabel(d);
        //   } else {
        //     return '';
        //   }
        // } else {
          const column = _.get(self.getVif(), `series[0].dataSource.dimension.columnName`);
          const label = ColumnFormattingHelpers.formatValue(d, column, dataToRender);
          return conditionallyTruncateLabel(label);
        // See TODO above.
        // }
      }).
      outerTickSize(0);
  }

  function getMinYValue(groupedData, dimensionIndex) {

    return d3.min(
      groupedData.map(
        (row) => d3.min(
          row.slice(dimensionIndex + 1)
        )
      )
    );
  }

  function getMaxYValue(groupedData, dimensionIndex) {

    return d3.max(
      groupedData.map(
        (row) => d3.max(
          row.slice(dimensionIndex + 1)
        )
      )
    );
  }

  function getMinSummedYValue(groupedData, dimensionIndex) {

    return d3.min(
      groupedData.map(
        (row) => d3.sum(
          _.filter(row.slice(dimensionIndex + 1), (i) => i < 0)
        )
      )
    );
  }

  function getMaxSummedYValue(groupedData, dimensionIndex) {

    return d3.max(
      groupedData.map(
        (row) => d3.sum(
          _.filter(row.slice(dimensionIndex + 1), (i) => i > 0)
        )
      )
    );
  }

  function generateYScale(minValue, maxValue, height) {

    return d3.scale.linear().
      domain([minValue, maxValue]).
      range([height, 0]);
  }

  function generateYAxis(yScale) {

    return d3.svg.axis().
      scale(yScale).
      orient('left').
      tickFormat((d) => {
        const column = _.get(self.getVif(), `series[0].dataSource.measure.columnName`);
        return ColumnFormattingHelpers.formatValue(d, column, dataToRender, true);
      });
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
  }

  function showGroupFlyout(groupElement, dimensionValues) {
    const title = groupElement.attr('data-dimension-value');
    const $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).text(
          (title === NO_VALUE_SENTINEL) ?
            I18n.t('shared.visualizations.charts.common.no_value') :
            title
        )
      );
    const $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    const dimensionValue = groupElement.data()[0][0];
    const dimensionIndex = dimensionValues.indexOf(dimensionValue);
    const measureValues = groupElement.data()[0].slice(1);

    let $labelValueRows;
    let payload = null;

    // 0th element of row data is always the dimension, everything after that
    // is a measure value.
    $labelValueRows = measureValues.map((value, measureIndex) => {
      const seriesIndex = getSeriesIndexByMeasureIndex(measureIndex);
      const label = measureLabels[measureIndex];
      const $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
        text(label).
        css('color', self.getColor(dimensionIndex, measureIndex));
      const $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
      const unitOne = self.getUnitOneBySeriesIndex(seriesIndex);
      const unitOther = self.getUnitOtherBySeriesIndex(seriesIndex);

      let valueString;

      if (value === null) {
        valueString = I18n.t('shared.visualizations.charts.common.no_value');
      } else {
        const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
        valueString = ColumnFormattingHelpers.formatValue(value, column, dataToRender, true);

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

  function showColumnFlyout(columnElement, color, label, value) {
    const title = (
      columnElement.getAttribute('data-dimension-value') ||
      I18n.t('shared.visualizations.charts.common.no_value')
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
      valueString = I18n.t('shared.visualizations.charts.common.no_value');
    } else {
      const column = _.get(self.getVif(), `series[${seriesIndex}].dataSource.measure.columnName`);
      valueString = ColumnFormattingHelpers.formatValue(value, column, dataToRender, true);

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

  // Calculates the proper left margin for the chart using a simulated Y axis.
  function calculateLeftMargin(viewportHeight) {
    const values = _.flatMap(dataToRender.rows, (row) => _.tail(row).map(parseFloat));

    // Generate a Y axis on a fake chart using our real axis generator.
    const testSvg = d3.select('body').append('svg');
    const testScale = generateYScale(_.min(values), _.max(values), viewportHeight);
    testSvg.append('g').
      attr('class', 'y axis').
      call(generateYAxis(testScale));

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

module.exports = SvgColumnChart;
