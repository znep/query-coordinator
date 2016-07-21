var utils = require('socrata-utils');
var SvgVisualization = require('./SvgVisualization');
var d3 = require('d3');
var _ = require('lodash');
var $ = require('jquery');
var translate = require('../authoringWorkflow/I18n').translate;

// These values have been eyeballed to provide enough space for axis labels
// that have been observed 'in the wild'. They may need to be adjusted slightly
// in the future, but the adjustments will likely be small in scale.
const MARGINS = {
  TOP: 16,
  RIGHT: 16,
  BOTTOM: 0,
  LEFT: 46
};
const CHART_PADDING = {
  RIGHT: 16
};
const COLUMN_MARGIN = 1;
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const DEFAULT_GRID_LINE_COLOR = '#ebebeb';
const MEASURE_LABEL_FONT_SIZE = 14;
const DIMENSION_LABEL_FONT_SIZE = 14;
const DIMENSION_LABELS_HEIGHT = 30;

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

function SvgHistogram($element, vif) {
  var self = this;
  var $chartElement;
  var dataToRender;
  var d3DimensionXScale;
  var d3YScale;

  _.extend(this, new SvgVisualization($element, vif));

  bindStyles();
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
      validateData(newData);
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
        find('.visualization-container').
          remove();
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    $chartElement = $(
      '<div>',
      {
        'class': 'histogram'
      }
    );

    self.
      $element.
        find('.visualization-container').
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
      series.rows.forEach((row) => utils.assert(row.length === 3, `row has ${row.length} columns, expected 3`));
    });

  }

  // Returns scaling to use ('linear' or 'logarithmic').
  // Scale is determined via two factors, in decreasing priority:
  // * Our vif's scale.x.scaling.
  // * The method actually used to bucket the data. This is a concern
  //   of the code passing us data to render, and is available per-series
  //   at dataToRender[...].bucketType. If series specifiy different
  //   bucketing methods, the first series scaling is used (TODO -
  //   revisit once we support multiple series).
  //
  //  Failing those, the default scale is linear.
  function determineXScaleType(data) {
    return _.get(
      self.getVif(),
      'scale.x.scaling',
      _.get(data, '[0].bucketType')
    ) || 'linear';
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

    var viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    var chartWidth;
    var viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    var chartHeight;
    // TODO: If we end up supporting multiple series,
    // we'll have to figure out how to merge bucket ranges.
    // For now, this does a naive implementation.
    var groupedDataToRender = _.flatMap(dataToRender, (series) =>
      series.rows.map((row) => (
        {
          x0: bucketStartFromRow(row),
          x1: bucketEndFromRow(row),
          values: [ measureFromRow(row) ] // Note provision for multiple values.
        }
      ))
    );

    var chartSvg;
    var viewportSvg;
    var xAxisAndSeriesSvg;
    var seriesSvg;
    var bucketGroupSvgs;

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
      var baselineValue;

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderXAxis() as idempotent.
      bindXAxisOnce();

      viewportSvg.
        select('.x.axis').
          attr(
            'transform',
            'translate(0,{0})'.format(chartHeight)
          ).
          selectAll('line, path').
            attr('fill', 'none').
            attr('stroke', '#888').
            attr('shape-rendering', 'crispEdges');

      viewportSvg.
        selectAll('.x.axis text').
          attr('font-family', FONT_STACK).
          attr('font-size', DIMENSION_LABEL_FONT_SIZE + 'px').
          attr('fill', '#888').
          attr('stroke', 'none').
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

      viewportSvg.
        select('.x.axis.baseline').
          attr(
            'transform',
            'translate(0,{0})'.format(d3YScale(baselineValue))
          ).
          selectAll('line, path').
            attr('fill', 'none').
            attr('stroke', '#888').
            attr('shape-rendering', 'crispEdges');
    }

    // See comment in renderYAxis() for an explanation as to why this is
    // separate.
    const bindYAxisOnce = _.once(() => {
      const d3YAxis = d3.svg.axis().
        scale(d3YScale).
        orient('left').
        tickFormat(function(d) { return utils.formatNumber(d); });

      chartSvg.
        select('.y.axis').
          call(d3YAxis);

      d3YAxis.
        tickSize(viewportWidth).
        tickFormat('');

      chartSvg.
        select('.y.grid').
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

      yAxisSvg.
        selectAll('line, path').
          attr('fill', 'none').
          attr('stroke', '#888').
          attr('shape-rendering', 'crispEdges');

      yAxisSvg.
        selectAll('text').
          attr('font-family', FONT_STACK).
          attr('font-size', MEASURE_LABEL_FONT_SIZE + 'px').
          attr('fill', '#888').
          attr('stroke', 'none');

      yGridSvg.
        attr(
          'transform',
          'translate(' + (viewportWidth) + ',0)'
        ).
        selectAll('path').
          attr('fill', 'none').
          attr('stroke', 'none');

      yGridSvg.
        selectAll('line').
          attr('fill', 'none').
          attr('stroke', DEFAULT_GRID_LINE_COLOR).
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
        var seriesIndex = this.getAttribute('data-series-index');
        var primaryColor = self.getPrimaryColorBySeriesIndex(
          seriesIndex
        );

        return (primaryColor !== null) ?
          primaryColor :
          'none';
      }

      bucketGroupSvgs.
        selectAll('.column-underlay').
          attr('y', 0).
          attr(
            'width',
            (d) => d3DimensionXScale(d.x1) - d3DimensionXScale(d.x0)
          ).
          attr('height', chartHeight).
          attr('stroke', 'none').
          attr('fill', 'transparent').
          attr('data-default-fill', getPrimaryColorOrNone);

      bucketGroupSvgs.
        selectAll('.column').
          attr(
            'y',
            function(d) {
              var yAttr;
              var value = d.value;

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


                if (maxYValue <= 0) {

                  yAttr = Math.max(
                    d3YScale(maxYValue),
                    1
                  );

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
          attr(
            'height',
            function(d) {
              var baselineValue;
              var value = d.value;

              if (value === 0 || !_.isFinite(value)) {
                // We want the flyout for null or zero values to appear
                // along the x axis, rather than at the top of the chart.
                // This means that we need to push the container element
                // for null values down to the x axis, rather than the
                // default behavior which places it at the top of the
                // visualization container. This is accomplished by the 'y'
                // attribute, but that does not have the expected behavior
                // if the element is not visible (or in this case, has a
                // height of zero).
                //
                // Ultimately the way we force the column's container to
                // actually do the intended layout is to give the element
                // a very small height which should be more or less
                // indiscernable, which causes the layout to do the right
                // thing.
                return 0.0001;
              } else if (value > 0) {

                if (minYValue > 0) {
                  baselineValue = minYValue;
                } else {
                  baselineValue = 0;
                }
              } else if (value < 0) {

                if (maxYValue < 0) {
                  baselineValue = maxYValue;
                } else {
                  baselineValue = 0;
                }
              }

              // See comment about setting the y attribute above for the
              // rationale behind ensuring a minimum height of one pixel for
              // non-null and non-zero values.
              return Math.max(
                1,
                Math.abs(d3YScale(value) - d3YScale(baselineValue))
              );
            }
          ).
          attr('stroke', 'none').
          attr('fill', getPrimaryColorOrNone).
          attr('data-default-fill', getPrimaryColorOrNone);

      xAxisAndSeriesSvg.
        attr(
          'transform',
          'translate(0,0)'
        );
    }

    chartWidth = viewportWidth;
    chartHeight = viewportHeight - DIMENSION_LABELS_HEIGHT;

    if (_(dataToRender).map('rows.length').max() >= MAX_BUCKET_COUNT) {
      self.renderError(
        translate('visualizations.histogram.error_exceeded_max_bucket_count').format(MAX_BUCKET_COUNT)
      );
      return;
    }

    /**
     * 2. Set up the x-scale
     */

    if (xScaleType === 'linear') {
      d3DimensionXScale = d3.scale.linear().
        domain(d3.extent(_.flatMap(
          dataToRender,
          (series) =>
            [
              d3.min(series.rows, bucketStartFromRow),
              d3.max(series.rows, bucketEndFromRow)
            ]
        )));
    } else {
      d3DimensionXScale = d3.scale.log().
        domain(d3.extent(_.flatMap(
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
            translate('visualizations.histogram.error_domain_includes_zero')
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
    const minYValue = measureExtent[0];
    const maxYValue = measureExtent[1];

    d3YScale = d3.scale.linear().
      domain(measureExtent).
      nice().
      range([chartHeight, 0]);

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
              chartWidth +
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

    viewportSvg.
      append('g').
        attr('class', 'y axis');

    viewportSvg.
      append('g').
        attr('class', 'y grid');

    xAxisAndSeriesSvg = viewportSvg.
      append('g').
        attr('class', 'x-axis-and-series');

    xAxisAndSeriesSvg.
      append('g').
        attr('class', 'series');

    seriesSvg = xAxisAndSeriesSvg.
      select('.series');

    bucketGroupSvgs = seriesSvg.
      selectAll('.bucket-group').
        data(groupedDataToRender).
          enter().
            append('g').
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

    bucketGroupSvgs.
      selectAll('rect.column-underlay').
        data(toIndividualColumns).
          enter().
            append('rect').
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

    bucketGroupSvgs.
      selectAll('rect.column').
        data(toIndividualColumns).
          enter().
            append('rect').
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

    renderXAxis();
    renderSeries();
    renderYAxis();

    /**
     * 6. Set up event handlers for mouse interactions.
     */

    function hideHighlight() {
      chartSvg.selectAll('.column').each(function() {
        this.setAttribute('fill', this.getAttribute('data-default-fill'));
      });
    }

    bucketGroupSvgs.
      selectAll('.column-underlay, .column').
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

    chartSvg.
      selectAll('text').
        attr('cursor', 'default');
  }

  function showColumnHighlight(columnElement) {

    var selection = d3.
      select(columnElement);

      selection.
        attr(
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

  function bucketTitle(bucketData) {
    //TODO units
    return `${utils.formatNumber(bucketData.x0)} to ${utils.formatNumber(bucketData.x1)}`;
  }

  function seriesLabel(seriesIndex) {
    return _.get(
      self.getVif(), ['series', seriesIndex, 'label'],
      translate('visualizations.histogram.default_series_label')
    );
  }

  function showColumnFlyout(columnElement, datum, seriesIndex) {

    utils.assertIsOneOfTypes(seriesIndex, 'number');

    var title = bucketTitle(datum);
    var label = seriesLabel(seriesIndex);
    var value = datum.value;
    var valueString;
    var payload = null;
    var $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title) ? title : ''
          )
        );
    var $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
      text(label).
      css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
    var $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});
    var $valueRow = $('<tr>', {'class': 'socrata-flyout-row'});
    var $table = $('<table>', {'class': 'socrata-flyout-table'});

    if (value === null) {
      valueString = translate('visualizations.histogram.no_value');
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

module.exports = SvgHistogram;
