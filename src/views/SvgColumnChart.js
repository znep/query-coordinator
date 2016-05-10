var utils = require('socrata-utils');
var SvgVisualization = require('./SvgVisualization');
var d3 = require('d3');
var _ = require('lodash');
var $ = require('jquery');

// These values have been eyeballed to provide enough space for axis labels
// that have been observed 'in the wild'. They may need to be adjusted slightly
// in the future, but the adjustments will likely be small in scale.
var MARGINS = {
  TOP: 16,
  RIGHT: 0,
  BOTTOM: 0,
  LEFT: 46
};
var FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
var DEFAULT_GRID_LINE_COLOR = '#ebebeb';
var DIMENSION_LABEL_ANGLE = 45;
var DIMENSION_LABEL_FONT_SIZE = 14;
var DIMENSION_LABEL_MAX_CHARACTERS = 14;
// This is a number that was eyeballed to work correctly as a scaling
// factor to convert a font size (height) into an approximate maximum character
// width for the font in question (Open Sans).
var DIMENSION_LABEL_FONT_WIDTH_FACTOR = 1.1;
var MEASURE_LABEL_FONT_SIZE = 14;
var DEFAULT_DESKTOP_COLUMN_WIDTH = 20;
var DEFAULT_MOBILE_COLUMN_WIDTH = 50;

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

function SvgColumnChart($element, vif) {
  var self = this;
  var $chartElement;
  var dataToRender;
  var mergedDataToRender;
  var d3DimensionXScale;
  var d3GroupingXScale;
  var d3YScale;
  var lastRenderedSeriesWidth = 0;
  var lastRenderedZoomTranslate = 0;

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
        'class': 'column-chart'
      }
    );

    self.
      $element.
        find('.visualization-container').
          append($chartElement);
  }

  function renderData() {
    var viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    var viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    var d3ClipPathId = 'column-chart-clip-path-' + _.uniqueId();
    var dimensionIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('dimension');
        }
      );
    var dimensionValues = _.union(
      _.flatten(
        dataToRender.
          map(
            function(series) {
              var dimensionIndex = series.columns.indexOf('dimension');

              return series.
                rows.
                map(
                  function(row) {
                    return row[dimensionIndex];
                  }
                );
            }
          )
      )
    );
    var longestDimensionLabel = d3.
      max(
        dimensionValues.
          map(
            function(dimensionValue) {

              return dimensionValue.length;
            }
          )
      );
    // This is a bit complex but in essence all it is doing is attempting to
    // predict what the DOM layout height for the x-axis will be once labels
    // have been rotated (hence the trigonometry) and conditionally truncated.
    var dimensionLabelsHeight = clampValue(
      Math.max(
        DIMENSION_LABEL_FONT_SIZE,
        (
          Math.cos(DIMENSION_LABEL_ANGLE) *
          longestDimensionLabel *
          DIMENSION_LABEL_FONT_SIZE *
          DIMENSION_LABEL_FONT_WIDTH_FACTOR
        )
      ),
      0,
      (
        Math.cos(DIMENSION_LABEL_ANGLE) *
        DIMENSION_LABEL_MAX_CHARACTERS *
        DIMENSION_LABEL_FONT_SIZE *
        DIMENSION_LABEL_FONT_WIDTH_FACTOR
      )
    );
    var measureIndices = dataToRender.
      map(
        function(series) {
          return series.columns.indexOf('measure');
        }
      );
    var measureLabels = self.
      getVif().
        series.
        map(
          function(series) {
            return series.label;
          }
        );
    var columnWidth = (self.isMobile()) ?
      DEFAULT_MOBILE_COLUMN_WIDTH :
      DEFAULT_DESKTOP_COLUMN_WIDTH;
    var width = Math.max(
      viewportWidth,
      (
        columnWidth *
        d3.max(
          dataToRender.
            map(
              function(series) {
                return series.rows.length;
              }
            )
        )
      )
    );
    var height = viewportHeight - dimensionLabelsHeight;
    var minYValue;
    var maxYValue;
    var d3XAxis;
    var d3YAxis;
    var d3Zoom;
    var chartSvg;
    var viewportSvg;
    var xAxisAndSeriesSvg;
    var seriesSvg;
    var xAxisPanDistance;

    function conditionallyTruncateLabel(label) {

      return (label.length >= DIMENSION_LABEL_MAX_CHARACTERS) ?
        '{0}…'.format(
          label.substring(0, DIMENSION_LABEL_MAX_CHARACTERS - 1).trim()
        ) :
        label;
    }

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
          call(
            d3XAxis.
              tickFormat('').
              tickSize(0)
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
            attr('stroke', 'none').
            attr('style', 'text-anchor: start').
            attr(
              'transform',
              'translate({0},0), rotate({1})'.
                format(
                  (columnWidth / 2),
                  DIMENSION_LABEL_ANGLE
                )
            ).
            attr(
              'data-row-index',
              function(label, rowIndex) {
                return rowIndex;
              }
            );
    }

    function renderYAxis() {
      var yAxisSvg = chartSvg.
        select('.y.axis');
      var yGridSvg = chartSvg.
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

    function renderSeries() {

      lastRenderedSeriesWidth = xAxisAndSeriesSvg.
        node().
          getBoundingClientRect().
            width;

      xAxisAndSeriesSvg.
        attr(
          'transform',
          'translate(0,0)'
        );
    }

    function handleZoom() {

      lastRenderedZoomTranslate = clampValue(
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
            'translate(' + -lastRenderedZoomTranslate + ',0)'
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
      var translateXRatio = (lastRenderedSeriesWidth !== 0) ?
        Math.abs(lastRenderedZoomTranslate / lastRenderedSeriesWidth) :
        0;
      var currentWidth = xAxisAndSeriesSvg.
        node().
          getBoundingClientRect().
            width;

      lastRenderedZoomTranslate = clampValue(
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

    // Execution starts here

    mergedDataToRender = dimensionValues.
      map(function(dimensionValue) {

        return [dimensionValue].concat([
          dataToRender.
            map(function(series, seriesIndex) {
              var matchingRows = series.
                rows.
                filter(
                  function(row) {
                    return (
                      dimensionValue === row[dimensionIndices[seriesIndex]]
                    );
                  }
                );

              return (matchingRows.length > 0) ?
                [measureLabels[seriesIndex], matchingRows[0][measureIndices[seriesIndex]]] :
                [measureLabels[seriesIndex], null];
            })
        ]);
    });

    minYValue = Math.min(
      0,
      d3.min(
        mergedDataToRender.
          map(
            function(row) {

              return d3.min(
                row[1].
                  map(
                    function(d) {
                      return d[1];
                    }
                  )
              );
            }
          )
      )
    );

    maxYValue = d3.max(
      mergedDataToRender.
        map(
          function(row) {

            return d3.max(
              row[1].
                map(
                  function(d) {
                    return d[1];
                  }
                )
            );
          }
        )
    );

    d3DimensionXScale = d3.
      scale.
        ordinal().
          domain(dimensionValues).
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
          // override it to be zero, which looks like what we expect.
          rangeRoundBands([0, width], 0.1, 0.05);

    // This scale is used for groupings of columns under a single dimension
    // category.
    d3GroupingXScale = d3.
      scale.
        ordinal().
          domain(measureLabels).
          rangeRoundBands([0, d3DimensionXScale.rangeBand()]);

    d3YScale = d3.
      scale.
        linear().
          domain([minYValue, maxYValue]).
          range([height, 0]);

    d3XAxis = d3.
      svg.
        axis().
          scale(d3DimensionXScale).
            orient('bottom').
            tickFormat(conditionallyTruncateLabel);

    d3YAxis = d3.
      svg.
        axis().
          scale(d3YScale).
            orient('left').
            tickFormat(function(d) { return utils.formatNumber(d); });

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
              viewportHeight +
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
            attr('height', viewportHeight + MARGINS.TOP + MARGINS.BOTTOM);

    viewportSvg.
      append('g').
        attr('class', 'y axis');

    viewportSvg.
      append('g').
        attr('class', 'y grid');

    // This <rect> exists to capture mouse actions on the chart, but not
    // directly on the columns or labels, that should result in a pan behavior.
    // If we set stroke and fill to none, the mouse events don't seem to get
    // picked up, so we instead set opacity to 0.
    viewportSvg.
      append('rect').
        attr('class', 'dragger').
        attr('width', width).
        attr('height', viewportHeight).
        attr('opacity', 0);

    // The x axis and series are groups since they all need to conform to the
    // same clip path.
    xAxisAndSeriesSvg = viewportSvg.
      append('g').
        attr('class', 'x-axis-and-series').
        attr('clip-path', 'url(#' + d3ClipPathId + ')');

    xAxisAndSeriesSvg.
      append('g').
        attr('class', 'x axis');

    xAxisAndSeriesSvg.
      append('g').
      attr('class', 'x axis zero');

    xAxisAndSeriesSvg.
      append('g').
        attr('class', 'series');

    seriesSvg = xAxisAndSeriesSvg.
      select('.series').
        selectAll('.dimension-group').
          data(mergedDataToRender).
            enter().
              append('g').
                attr('class', 'dimension-group').
                attr('data-group-category', function(d) { return d[0]; }).
                attr(
                  'transform',
                  function(d) {
                    return 'translate(' + d3DimensionXScale(d[0]) + ',0)';
                  }
                );

    seriesSvg.
      selectAll('rect').
        data(function(d) { return d[1]; }).
          enter().
            append('rect').
              attr('class', 'column').
              attr(
                'data-column-category',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return mergedDataToRender[rowIndex][0];
                }
              ).
              attr(
                'data-row-index',
                // Not sure if what the second argument actually is, but it is
                // the third argument that seems to track the row index.
                function(datum, seriesIndex, rowIndex) {
                  return rowIndex;
                }
              ).
              attr(
                'x',
                function(d) {
                  return d3GroupingXScale(d[0]);
                }
              ).
              attr(
                'y',
                function(d) {
                  var yAttr;

                  if (d[1] === null) {
                    yAttr = d3YScale(0);
                  } else {

                    yAttr = (d[1] <= 0) ?
                      d3YScale(0) :
                      d3YScale(d[1]);
                  }

                  return yAttr;
                }
              ).
              attr(
                'width',
                d3GroupingXScale.rangeBand() - 1
              ).
              attr(
                'height',
                function(d) {

                  return (d[1] === null || d[1] === 0) ?
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
                    0.0001 :
                    Math.abs(d3YScale(d[1]) - d3YScale(0));
                }
              ).
              attr(
                'stroke',
                function(d) {
                  var secondaryColor = self.getSecondaryColorBySeriesIndex(
                    self.getSeriesIndexByLabel(d[0])
                  );

                  return (secondaryColor !== null) ?
                    secondaryColor :
                    'none';
                }
              ).
              attr(
                'fill',
                function(d) {
                  var primaryColor = self.getPrimaryColorBySeriesIndex(
                    self.getSeriesIndexByLabel(d[0])
                  );

                  return (primaryColor !== null) ?
                    primaryColor :
                    'none';
                }
              ).
              attr(
                'data-default-fill',
                function(d) {
                  var primaryColor = self.getPrimaryColorBySeriesIndex(
                    self.getSeriesIndexByLabel(d[0])
                  );

                  return (primaryColor !== null) ?
                    primaryColor :
                    'none';
                }
              );

    // Note that we must render the x-axis before setting up the event handlers
    // for flyouts below, since it attempts to bind data to elements that will
    // not exist before the x-axis has been rendered.
    renderXAxis();
    renderYAxis();
    renderSeries();

    seriesSvg.
      selectAll('.column').
        on(
          'mousemove',
          function(d) {

            showColumnHighlight(this);
            showColumnFlyout(this, d);
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
      selectAll('.x.axis .tick text').
        data(mergedDataToRender).
          on(
            'mousemove',
            function(d) {
              var dimensionGroup = xAxisAndSeriesSvg.
                select(
                  '.dimension-group[data-group-category="{0}"]'.format(d[0])
                );

              showGroupHighlight(dimensionGroup);
              showGroupFlyout(dimensionGroup);
            }
          ).
          on(
            'mouseleave',
            function() {

              hideHighlight();
              hideFlyout();
            }
          );

    xAxisPanDistance = (
      (
        xAxisAndSeriesSvg.
          select('.x.axis')[0][0].
            getBoundingClientRect().
              width
      ) -
      viewportWidth
    );

    if (xAxisPanDistance > 0) {

      d3Zoom = d3.
        behavior.
          zoom().
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

      chartSvg.
        selectAll('text').
          attr('cursor', null);

      self.showPanningNotice();
    } else {

      chartSvg.
        selectAll('text').
          attr('cursor', 'default');

      self.hidePanningNotice();
    }
  }

  function showGroupHighlight(groupElement) {

    groupElement.
      selectAll('.column').
        each(
          function() {
            var selection = d3.
              select(this);

            selection.
                attr(
                  'fill',
                  function(d) {
                    var highlightColor = self.getHighlightColorBySeriesIndex(
                      self.getSeriesIndexByLabel(d[0])
                    );

                    return (highlightColor !== null) ?
                      highlightColor :
                      selection.attr('fill');
                  }
                );
          }
        );
  }

  function showColumnHighlight(columnElement) {
    var selection = d3.
      select(columnElement);

      selection.
        attr(
          'fill',
          function(d) {
            var highlightColor = self.getHighlightColorBySeriesIndex(
              self.getSeriesIndexByLabel(d[0])
            );

            return (highlightColor !== null) ?
              highlightColor :
              selection.attr('fill');
          }
        );
  }

  function hideHighlight() {

    d3.
      selectAll('.column').
        each(
          function() {
            var selection = d3.
              select(this);

            selection.
              attr('fill', selection.attr('data-default-fill'));
          }
        );
  }

  function showGroupFlyout(groupElement) {
    var title = groupElement.attr('data-group-category');
    var $title = $('<tr>', {'class': 'socrata-flyout-title'}).
      append(
        $('<td>', {'colspan': 2}).
          text(
            (title) ? title : ''
          )
        );
    var labelValuePairs = [];
    var $labelValueRows;
    var $table = $('<table>', {'class': 'socrata-flyout-table'}).
      append($title);
    var payload = null;

    groupElement.
      selectAll('.column').
        each(
          function(d) {
            labelValuePairs.push(d);
          }
        );

    $labelValueRows = labelValuePairs.
      map(
        function(datum) {
          var label = datum[0];
          var value = datum[1];
          var seriesIndex = self.getSeriesIndexByLabel(label);
          var valueString;
          var $labelCell = $('<td>', {'class': 'socrata-flyout-cell'}).
            text(label).
            css('color', self.getPrimaryColorBySeriesIndex(seriesIndex));
          var $valueCell = $('<td>', {'class': 'socrata-flyout-cell'});

          if (value === null) {
            valueString = self.getLocalization('NO_VALUE');
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
      element: groupElement[0][0],
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

  function showColumnFlyout(columnElement, datum) {
    var title = columnElement.getAttribute('data-column-category');
    var label = datum[0];
    var value = datum[1];
    var seriesIndex = self.getSeriesIndexByLabel(label);
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
      valueString = self.getLocalization('NO_VALUE');
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

module.exports = SvgColumnChart;
