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
const MAX_POINT_COUNT_WITHOUT_PAN = 500;
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
  var self = this;
  var $chartElement;
  var dataToRender;
  var minYValue;
  var maxYValue;
  var d3XScale;
  var d3YScale;
  var lastRenderedStartDate;
  var lastRenderedEndDate;
  var lastRenderedZoomTranslateOffsetFromEnd;
  var parseDate = d3.
    time.
    // A 'floating timestamp', e.g. '2008-01-18T00:00:00.000'
    // (Note the lack of timezone information).
    format('%Y-%m-%dT%H:%M:%S.%L').
    parse;
  var dateBisectors;

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

    d3.
      select(this.$element[0]).
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
        'class': 'timeline-chart'
      }
    );

    self.
      $element.
        find('.visualization-container').
          append($chartElement);
  }

  /**
   * Visualization renderer and helper functions
   */

  function renderData() {
    var minimumDatumWidth = (self.isMobile()) ?
      MINIMUM_MOBILE_DATUM_WIDTH :
      MINIMUM_DESKTOP_DATUM_WIDTH;
    var viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    var width;
    var xAxisPanningEnabled;
    var viewportHeight;
    var height;
    var d3ClipPathId = 'timeline-chart-clip-path-' + _.uniqueId();
    var dimensionIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('dimension');
        }
      );
    var measureIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('measure');
        }
      );
    var maxPointCount = d3.max(
      dataToRender,
      function(seriesResponse) { return seriesResponse.rows.length; }
    );
    var startDate;
    var endDate;
    var maxSeriesLength;
    var lastRenderableDatumIndex;
    var domainStartDate;
    var domainEndDate;
    var d3XAxis;
    var d3YAxis;
    var d3LineSeries;
    var d3AreaSeries;
    var d3Zoom;
    var chartSvg;
    var viewportSvg;

    function renderXAxis() {
      var xAxisSvg = viewportSvg.select('.x.axis');
      var xBaselineSvg = viewportSvg.select('.x.axis.baseline');
      var baselineValue;

      xAxisSvg.
        attr(
          'transform',
          'translate(0,' + height + ')'
        ).
        call(d3XAxis);

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
        attr('stroke', 'none');

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
          'translate(0,' + d3YScale(baselineValue) + ')'
        ).
        call(
          d3XAxis.
            tickFormat('').
            tickSize(0)
        );

      xBaselineSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', AXIS_DEFAULT_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    function renderYAxis() {
      var yAxisSvg = viewportSvg.
        select('.y.axis');
      var yGridSvg = viewportSvg.
        select('.y.grid');

      yAxisSvg.
        call(d3YAxis);

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
        ).
        call(
          d3YAxis.
            tickSize(viewportWidth).
            tickFormat('')
        );

      yGridSvg.selectAll('path').
        attr('fill', 'none').
        attr('stroke', 'none');

      yGridSvg.selectAll('line').
        attr('fill', 'none').
        attr('stroke', AXIS_GRID_COLOR).
        attr('shape-rendering', 'crispEdges');
    }

    function renderValues() {
      var radius;

      dataToRender.forEach(function(series, seriesIndex) {
        var seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
        var dimensionIndex = dimensionIndices[seriesIndex];
        var measureIndex = measureIndices[seriesIndex];

        // If we *are not* drawing a line chart, we need to draw the area fill
        // first so that the line sits on top of it in the z-stack.
        if (seriesTypeVariant !== 'line') {

          viewportSvg.
            select('.series-' + seriesIndex + '-' + seriesTypeVariant + '-area').
              attr('d', d3AreaSeries[seriesIndex]).
              attr('clip-path', 'url(#' + d3ClipPathId + ')').
              attr('fill', self.getSecondaryColorBySeriesIndex(seriesIndex)).
              attr('stroke', self.getSecondaryColorBySeriesIndex(seriesIndex)).
              attr('stroke-width', AREA_STROKE_WIDTH).
              attr('opacity', '0.1');
        }

        // We draw the line for all type variants of timeline chart.
        viewportSvg.
          select('.series-' + seriesIndex + '-' + seriesTypeVariant + '-line').
            attr('d', d3LineSeries[seriesIndex]).
            attr('clip-path', 'url(#' + d3ClipPathId + ')').
            attr('fill', 'none').
            attr('stroke', self.getPrimaryColorBySeriesIndex(seriesIndex)).
            attr('stroke-width', AREA_STROKE_WIDTH);

        // If we *are* drawing a line chart we also draw the dots bigger to
        // indicate individual points in the data. If we are drawing an area
        // chart the dots help to indicate non-contiguous sections which may
        // be drawn at 1 pixel wide and nearly invisible with the fill color
        // alone.
        if (seriesTypeVariant === 'line') {
          radius = 2;
        } else {
          radius = 1;
        }

        viewportSvg.
          select('.series-' + seriesIndex + '-line-dots').
            attr('clip-path', 'url(#' + d3ClipPathId + ')').
            selectAll('circle').
              attr('r', radius).
              attr('cx', function(d) { return d3XScale(parseDate(d[dimensionIndex])); }).
              attr('cy', function(d) { return (d[measureIndex] !== null) ? d3YScale(d[measureIndex]) : -100; }).
              attr('fill', self.getPrimaryColorBySeriesIndex(seriesIndex)).
              attr('stroke', self.getSecondaryColorBySeriesIndex(seriesIndex));
      });
    }

    function handleZoom() {
      var translate = d3Zoom.translate();
      var translateX = translate[0];
      var translateY = translate[1];

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
      var translateX;

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
    dateBisectors = dataToRender.
      map(
        function(series, seriesIndex) {

          return d3.
            bisector(
              function(d) {
                return parseDate(d[dimensionIndices[seriesIndex]]);
              }
            ).
            left;
        }
      );

    startDate = d3.min(
      dataToRender.
        map(
          function(series, seriesIndex) {
            return d3.min(
              series.rows,
              function(d) { return d[dimensionIndices[seriesIndex]]; }
            );
          }
        )
    );
    endDate = d3.max(
      dataToRender.
        map(
          function(series, seriesIndex) {
            return d3.max(
              series.rows,
              function(d) { return d[dimensionIndices[seriesIndex]]; }
            );
          }
        )
    );

    maxSeriesLength = d3.max(
      dataToRender.
        map(
          function(series) {
            return series.rows.length;
          }
        )
    );

    if (self.getXAxisScalingModeBySeriesIndex(0) === 'fit') {

      domainStartDate = parseDate(startDate);
      domainEndDate = parseDate(endDate);
    } else {

      if ((minimumDatumWidth * maxSeriesLength) <= viewportWidth) {

        domainStartDate = parseDate(startDate);
        domainEndDate = parseDate(endDate);
      } else {

        lastRenderableDatumIndex = Math.floor(
          viewportWidth /
          minimumDatumWidth
        );

        domainStartDate = parseDate(startDate);
        domainEndDate = parseDate(
          d3.min(
            dataToRender.
              map(
                function(series, seriesIndex) {
                  var dimensionIndex = dimensionIndices[seriesIndex];

                  return (series.rows.length > lastRenderableDatumIndex) ?
                    series.rows[lastRenderableDatumIndex][dimensionIndex] :
                    series.rows[series.rows.length - 1][dimensionIndex];
                }
              )
          )
        );
      }
    }

    minYValue = d3.min(
      dataToRender.
        map(
          function(series, seriesIndex) {

            return d3.min(
              series.rows,
              function(d) { return d[measureIndices[seriesIndex]]; }
            );
          }
        )
    );
    maxYValue = d3.max(
      dataToRender.
          map(
            function(series, seriesIndex) {

              return d3.max(
                series.rows,
                function(d) { return d[measureIndices[seriesIndex]]; }
              );
            }
          )
    );

    if (self.getYAxisScalingMode() === 'showZero') {

      // Normalize min and max values so that we always show 0 if the user has
      // specified that behavior in the Vif.
      minYValue = Math.min(minYValue, 0);
      maxYValue = Math.max(0, maxYValue);
    }

    d3XScale = d3.
      time.
        scale.
          utc().
            domain([domainStartDate, domainEndDate]).
            range([0, viewportWidth]);

    d3YScale = d3.
      scale.
        linear().
          domain([minYValue, maxYValue]).
          range([viewportHeight, 0]).
          clamp(true);

    d3XAxis = d3.
      svg.
        axis().
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

    d3YAxis = d3.
      svg.
        axis().
          scale(d3YScale).
            orient('left').
            tickFormat(function(d) { return utils.formatNumber(d); });

    d3AreaSeries = dataToRender.
      map(
        function(series, seriesIndex) {
          var seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
          var dimensionIndex = dimensionIndices[seriesIndex];
          var measureIndex = measureIndices[seriesIndex];

          if (seriesTypeVariant === 'line') {
            return null;
          } else {
            return d3.
              svg.
                area().
                  defined(
                    function(d) {
                      return !_.isNull(d[measureIndex]);
                    }
                  ).
                  x(
                    function(d) {
                      return d3XScale(parseDate(d[dimensionIndex]));
                    }
                  ).
                  y0(
                    /* eslint-disable no-unused-vars */
                    function(d) {
                    /* eslint-enable no-unused-vars */
                      return d3YScale(0);
                    }
                  ).
                  y1(
                    function(d) {
                      return d3YScale(d[measureIndex]);
                    }
                  );
          }
        }
      );

    d3LineSeries = dataToRender.
      map(
        function(series, seriesIndex) {
          var dimensionIndex = dimensionIndices[seriesIndex];
          var measureIndex = measureIndices[seriesIndex];

          return d3.
            svg.
              line().
                defined(
                  function(d) {
                    return !_.isNull(d[measureIndex]);
                  }
                ).
                x(
                  function(d) {
                    return d3XScale(parseDate(d[dimensionIndex]));
                  }
                ).
                y(
                  function(d) {
                    return d3YScale(d[measureIndex]);
                  }
                );
        }
      );

    // Clear out existing chart.
    d3.
      select($chartElement[0]).
        select('svg').
          remove();

    // Render the new one
    chartSvg = d3.
      select($chartElement[0]).
        append('svg').
          attr(
            'width',
            (
              width +
              MARGINS.LEFT +
              MARGINS.RIGHT
            )
          ).
          attr(
            'height',
            (
              height +
              MARGINS.TOP +
              MARGINS.BOTTOM
            )
          );

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

    chartSvg.
      append('clipPath').
        attr('id', d3ClipPathId).
          append('rect').
            attr('x', 0).
            attr('y', 0).
            attr('width', viewportWidth).
            attr('height', viewportHeight);

    viewportSvg.
      append('g').
        attr('class', 'y axis');

    viewportSvg.
      append('g').
        attr('class', 'y grid');

    viewportSvg.
      append('g').
        attr('class', 'x axis');

    viewportSvg.
      append('g').
      attr('class', 'x axis baseline');

    dataToRender.
      forEach(
        function(series, seriesIndex) {
          var seriesTypeVariant = self.getTypeVariantBySeriesIndex(
            seriesIndex
          );

          viewportSvg.
            append('path').
              datum(series.rows).
                attr(
                  'class',
                  'series-{0}-{1}-area'.format(
                    seriesIndex,
                    seriesTypeVariant
                  )
                );

          viewportSvg.
            append('path').
              datum(series.rows).
                attr(
                  'class',
                  'series-{0}-{1}-line'.format(
                    seriesIndex,
                    seriesTypeVariant
                  )
                );

          viewportSvg.
            append('g').
              attr('class', 'series-' + seriesIndex + '-line-dots').
                selectAll('.series-' + seriesIndex + '-line-dot').
                  data(series.rows).
                    enter().
                      append('circle');
        }
      );

    viewportSvg.
      append('rect').
        attr('class', 'highlight').
        attr('fill', HIGHLIGHT_COLOR).
        attr('stroke', 'none').
        attr('opacity', '0').
        attr('height', height);

    viewportSvg.
      append('rect').
        attr('class', 'overlay').
        attr('width', width).
        attr('height', height).
        attr('fill', 'none').
        attr('stroke', 'none').
        on('mousemove', handleMouseMove).
        on(
          'mouseleave',
          function() {

            hideHighlight();
            hideFlyout();
          }
        );

    renderXAxis();
    renderYAxis();
    renderValues();

    if (xAxisPanningEnabled) {

      d3Zoom = d3.
        behavior.
          zoom().
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



      if (startDate === lastRenderedStartDate && endDate === lastRenderedEndDate) {
        restoreLastRenderedZoom();
      }
    }

    lastRenderedStartDate = startDate;
    lastRenderedEndDate = endDate;
  }

  function handleMouseMove() {
    var firstSeriesRows = dataToRender[0].rows;
    var firstSeriesDimensionIndex = dataToRender[0].
      columns.
      indexOf('dimension');
    var rawDate;
    var firstSeriesIndex;
    var startDate;
    var endDate;
    var flyoutValues;

    rawDate = d3XScale.invert(d3.mouse(this)[0]);
    firstSeriesIndex = clampValue(
      dateBisectors[0](firstSeriesRows, rawDate) - 1,
      0,
      firstSeriesRows.length - 1
    );

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

    flyoutValues = dataToRender.
      map(
        function(series, seriesIndex) {
          var dimensionIndex = series.columns.indexOf('dimension');
          var valueIndex;
          var valueDate;

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

          if (
            valueDate >= startDate &&
            valueDate <= endDate
          ) {

            return {
              seriesIndex: seriesIndex,
              datum: series.rows[valueIndex]
            };
          } else {
            return null;
          }
        }
      ).
      filter(function(datum) {
        return datum !== null;
      });

    showHighlight(startDate, endDate);
    showFlyout({
      startDate: startDate,
      endDate: endDate,
      values: flyoutValues
    });
  }

  function showHighlight(startDate, endDate) {
    var scaledStartDate = d3XScale(startDate);
    var scaledEndDate = d3XScale(endDate);

    d3.
      select($chartElement[0]).
        select('.highlight').
          attr('display', 'block').
          attr('width', Math.max(2, scaledEndDate - scaledStartDate - 2)).
          attr('transform', 'translate(' + scaledStartDate + ',0)');
  }

  function hideHighlight() {

    d3.
      select($chartElement[0]).
        select('.highlight').
          attr('display', 'none');
  }

  function showFlyout(flyoutData) {
    var boundingClientRect = self.
      $element.
      find('.timeline-chart')[0].
        getBoundingClientRect();
    var title = '{0} to {1}'.format(
      formatDateForFlyout(flyoutData.startDate),
      formatDateForFlyout(flyoutData.endDate)
    );
    var $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title) ? title : ''
          )
        );
    var $labelValueRows;
    var $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    var maxFlyoutValue;
    var maxFlyoutValueOffset;
    var payload = null;

    function formatDateForFlyout(datetime) {
      var year = datetime.getFullYear();
      var month = [
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
      var date = datetime.getDate();


      return '{0} {1}, {2}'.
        format(
          month,
          date,
          year
        );
    }

    $labelValueRows = flyoutData.
      values.
        sort(
          function(value1, value2) {
            var measureIndex1 = dataToRender[value1.seriesIndex].
              columns.
              indexOf('measure');
            var measureIndex2 = dataToRender[value2.seriesIndex].
              columns.
              indexOf('measure');

            return value1.datum[measureIndex1] <= value2.datum[measureIndex2];
          }
        ).
        map(
          function(value) {
            var measureIndex = dataToRender[value.seriesIndex].
              columns.
              indexOf('measure');
            var label = _.get(
              self.getVif(),
              'series[{0}].label'.format(value.seriesIndex),
              I18n.translate('visualizations.common.flyout_value_label')
            );
            var datumValue = value.datum[measureIndex];
            var datumValueString;
            var $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
              text(label).
              css(
                'color',
                self.getPrimaryColorBySeriesIndex(value.seriesIndex)
              );
            var $valueCell;

            if (datumValue === null) {
              datumValueString = I18n.translate(
                'visualizations.common.no_value'
              );
            } else {
              datumValueString = '{0} {1}'.
                format(
                  utils.formatNumber(datumValue),
                  (datumValue === 1) ?
                    self.getUnitOneBySeriesIndex(value.seriesIndex) :
                    self.getUnitOtherBySeriesIndex(value.seriesIndex)
                );
            }

            $valueCell = $('<td>', {'class': 'socrata-flyout-cell'}).
              text(datumValueString);

            return $('<tr>', {'class': 'socrata-flyout-row'}).
              append([
                $labelCell,
                $valueCell
              ]);
          }
        );

    $table.append($labelValueRows);

    // Note: d3.max will return undefined if passed an array of non-numbers
    // (such as when we try to show a flyout for a null value).
    maxFlyoutValue = d3.max(
      flyoutData.
        values.
          map(
            function(value) {
              var measureIndex = dataToRender[value.seriesIndex].
                columns.
                indexOf('measure');

              return value.datum[measureIndex];
            }
          )
    );

    if (_.isNumber(maxFlyoutValue)) {
      maxFlyoutValueOffset = d3YScale(maxFlyoutValue);
    } else if (minYValue <= 0 && maxYValue >= 0) {
      maxFlyoutValueOffset = d3YScale(0);
    } else if (maxYValue < 0) {
      d3YScale(maxYValue);
    } else {
      d3YScale(minYValue);
    }

    payload = {
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      flyoutOffset: {
        left: (
          boundingClientRect.left +
          MARGINS.LEFT +
          d3XScale(
            flyoutData.startDate
          ) +
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

module.exports = SvgTimelineChart;
