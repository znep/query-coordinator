var utils = require('socrata-utils');
var SvgVisualization = require('./SvgVisualization');
var d3 = require('d3');
var _ = require('lodash');
var $ = require('jquery');

var MARGINS = {
  TOP: 16,
  RIGHT: 0,
  BOTTOM: 24,
  LEFT: 50
};
var FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
var DEFAULT_GRID_LINE_COLOR = '#ebebeb';
var DIMENSION_LABEL_FONT_SIZE = 14;
var MEASURE_LABEL_FONT_SIZE = 14;
var MINIMUM_DESKTOP_DATUM_WIDTH = 20;
var MINIMUM_MOBILE_DATUM_WIDTH = 50;

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

    if (newVif) {
      this.updateVif(newVif);
    }

    if (newData) {
      dataToRender = newData;
    }

    renderData();
  };

  this.renderError = function() {
    // TODO: Some helpful error message.
  };

  this.invalidateSize = function() {

    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  this.destroy = function() {

    d3.
      select(this.element[0]).
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
    var width = Math.max(
      viewportWidth,
      (
        minimumDatumWidth *
        d3.max(
          dataToRender,
          function(seriesResponse) { return seriesResponse.rows.length; }
        )
      )
    );
    var viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    var height = viewportHeight;
    var xAxisPanningEnabled = viewportWidth !== width;
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
    var startDate;
    var endDate;
    var maxSeriesLength;
    var lastRenderableDatumIndex;
    var d3XScaleDomainStartDate;
    var d3XScaleDomainEndDate;
    var d3YScaleMinValue;
    var d3YScaleMaxValue;
    var d3XAxis;
    var d3YAxis;
    var d3Series;
    var d3Zoom;
    var chartSvg;
    var viewportSvg;

    function renderXAxis() {

      viewportSvg.
        select('.x.axis').
          attr(
            'transform',
            'translate(0,' + height + ')'
          ).
          call(d3XAxis).
            selectAll('line, path').
              attr('fill', 'none').
              attr('stroke', '#888').
              attr('shape-rendering', 'crispEdges');

      viewportSvg.
        select('.x.axis.zero').
          attr(
            'transform',
            'translate(0,' + d3YScale(0) + ')'
          ).
          selectAll('line, path').
            attr('fill', 'none').
            attr('stroke', '#888').
            attr('shape-rendering', 'crispEdges');

      viewportSvg.
        selectAll('.x.axis').
          selectAll('text').
            attr('font-family', FONT_STACK).
            attr('font-size', DIMENSION_LABEL_FONT_SIZE + 'px').
            attr('fill', '#888').
            attr('stroke', 'none');
    }

    function renderYAxis() {
      var yAxisSvg = viewportSvg.
        select('.y.axis');
      var yGridSvg = viewportSvg.
        select('.y.grid');

      yAxisSvg.
        call(d3YAxis).
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
        call(
          d3YAxis.
            tickSize(viewportWidth).
            tickFormat('')
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

    function renderValues() {
      var fill;
      var stroke;

      dataToRender.forEach(function(series, seriesIndex) {
        var seriesTypeVariant = self.getTypeVariantBySeriesIndex(seriesIndex);
        var dimensionIndex = dimensionIndices[seriesIndex];
        var measureIndex = measureIndices[seriesIndex];

        if (seriesTypeVariant === 'line') {
          fill = 'none';
          stroke = self.getPrimaryColorBySeriesIndex(seriesIndex);
        } else {
          fill = self.getPrimaryColorBySeriesIndex(seriesIndex);
          stroke = self.getSecondaryColorBySeriesIndex(seriesIndex);
        }

        viewportSvg.
          select('.series-' + seriesIndex + '-' + seriesTypeVariant).
            attr('d', d3Series[seriesIndex]).
            attr('clip-path', 'url(#' + d3ClipPathId + ')').
            attr('fill', fill).
            attr('stroke', stroke);

        if (seriesTypeVariant === 'line') {

          viewportSvg.
            select('.series-' + seriesIndex + '-line-dots').
              attr('clip-path', 'url(#' + d3ClipPathId + ')').
              selectAll('circle').
                attr('r', 2).
                attr('cx', function(d) { return d3XScale(parseDate(d[dimensionIndex])); }).
                attr('cy', function(d) { return d3YScale(d[measureIndex]); }).
                attr('fill', self.getPrimaryColorBySeriesIndex(seriesIndex)).
                attr('stroke', self.getSecondaryColorBySeriesIndex(seriesIndex));
        }
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

    if ((minimumDatumWidth * maxSeriesLength) <= viewportWidth) {

      d3XScaleDomainStartDate = parseDate(startDate);
      d3XScaleDomainEndDate = parseDate(endDate);
    } else {

      lastRenderableDatumIndex = Math.floor(
        viewportWidth /
        minimumDatumWidth
      );

      d3XScaleDomainStartDate = parseDate(startDate);
      d3XScaleDomainEndDate = parseDate(
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

    d3YScaleMinValue = d3.min(
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
    d3YScaleMaxValue = d3.max(
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

    d3XScale = d3.
      time.
        scale.
          utc().
            domain([d3XScaleDomainStartDate, d3XScaleDomainEndDate]).
            range([0, viewportWidth]);

    d3YScale = d3.
      scale.
        linear().
          domain([
            Math.min(
              0,
              d3YScaleMinValue
            ),
            d3YScaleMaxValue
          ]).
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

    d3Series = dataToRender.
      map(
        function(series, seriesIndex) {
          var dimensionIndex = dimensionIndices[seriesIndex];
          var measureIndex = measureIndices[seriesIndex];

          if (self.getTypeVariantBySeriesIndex(seriesIndex) === 'line') {

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
                  y0(viewportHeight).
                  y1(
                    function(d) {
                      return d3YScale(d[measureIndex]);
                    }
                  );
          }
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
      attr('class', 'x axis zero');

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
                  'series-{0}-{1}'.format(
                    seriesIndex,
                    seriesTypeVariant
                  )
                );

          if (seriesTypeVariant === 'line') {

            viewportSvg.
              append('g').
                attr('class', 'series-' + seriesIndex + '-line-dots').
                  selectAll('.series-' + seriesIndex + '-line-dot').
                    data(series.rows).
                      enter().
                        append('circle');
          }
        }
      );

    viewportSvg.
      append('rect').
        attr('class', 'highlight').
        attr('fill', 'rgba(0, 0, 0, 0.2)').
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

      self.showPanningNotice();
    } else {

      self.hidePanningNotice();
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
          attr('width', scaledEndDate - scaledStartDate - 2).
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
              'series[{0}].label'.format(value.seriesIndex)
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
              datumValueString = self.getLocalization('NO_VALUE');
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

    $table.
      append($labelValueRows);

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
          d3YScale(
            d3.max(
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
            )
          )
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
