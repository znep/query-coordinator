(function() {
  'use strict';

  /*

  KNOWN BUGS

  1. The heuristic by which we decide when to display only some labels is
     pretty neat.

  TERMINOLOGY

  'selection' is the yellow region when the visualization is being filtered.
  'highlight' is the white region that follows the cursor.
  'filter' is the mechanism by which queries are altered.

  */

  function timelineChartDirective($timeout, AngularRxExtensions, WindowState, DateHelpers, FlyoutService, Constants) {

    return {
      templateUrl: '/angular_templates/dataCards/timelineChart.html',
      restrict: 'A',
      scope: {
        chartData: '=',
        expanded: '=',
        precision: '=',
        rowDisplayUnit: '=',
        activeFilters: '='
      },
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        // The following cached jQuery/d3 selectors are used throughout the
        // directive.
        var jqueryBodyElement = $('body');
        var jqueryChartElement = element.find('.timeline-chart-wrapper');
        var jqueryHighlightTargetElement = element.find('.timeline-chart-highlight-target');
        var jqueryChartSelectionElement = element.find('.timeline-chart-selection');
        var jqueryLeftSelectionMarker = element.find('.timeline-chart-left-selection-marker');
        var jqueryRightSelectionMarker = element.find('.timeline-chart-right-selection-marker');
        var jqueryClearSelectionLabel = element.find('.timeline-chart-clear-selection-label');
        var jqueryDatumLabel = element.find('.datum-label');
        var d3ChartElement = d3.select(jqueryChartElement[0]);

        // The X and Y scales that d3 uses are global to the directive so
        // that we can use the same ones between the renderChart and
        // renderChartHighlight functions.
        // They are initialized to null so that we don't accidentally try
        // to render a highlight before a chart is rendered.
        var d3XScale = null;
        var d3YScale = null;

        // currentDatum is used to persist information about the highlighted
        // region between the filterChartData and flyout rendering functions.
        var currentDatum = null;

        // datasetPrecision is used in multiple places in order to test and
        // modify dates, but we only really have a notion of it within the
        // context of Rx reactions; for this reason it's cached globally.
        var datasetPrecision = null;

        var labelPrecision = null;

        // Cache a bunch of stuff that is useful in a lot of places that don't
        // need to be wrapped in Rx mojo.
        var cachedChartDimensions = null;
        var cachedChartOffsets = null;
        var cachedChartData = null;
        var cachedRowDisplayUnit = null;

        // Keep track of whether or not this instance of a timeline chart is in
        // the 'dragging' state so that we can selectively listen for mouseup
        // and apply the 'goalpost' selection area.
        var currentlyDragging = false;

        // Keep track of whether or not the mouse position is within this
        // instance of a timeline chart's visualization area (the chart itself
        // and the x-axis labels beneath it).
        var mousePositionWithinChartElement = false;
        var mousePositionWithinChartDisplay = false;
        var mousePositionWithinChartLabels = true;

        // These two values are in pixels.
        var visualizedDatumWidth = 0;
        var halfVisualizedDatumWidth = 0;
        var halfDatumLabelWidth = parseInt(jqueryDatumLabel.css('width'), 10) / 2;

        var selectionIsCurrentlyRendered = false;

        // Keep track of the start and end of the selection.
        var selectionStartDate = null;
        var selectionEndDate = null;

        // We use these two values to 'dirty check' changes
        // to selectionStartDate and selectionEndDate and
        // conditionally NOOP in the selection rendering
        // code if what would be rendered has not changed.
        var renderedSelectionStartDate = null;
        var renderedSelectionEndDate = null;

        var allChartLabelsShown = true;

        var mouseLeftButtonChangesSubscription;
        var mouseMoveOrLeftButtonChangesSubscription;


        /**
         * Because we want the beginning and end of the highlights and
         * selection ranges to correspond with the ticks, and d3's ordinary
         * way of rendering area charts with data like ours would place the
         * ticks at the center of the highlights and selection ranges, we
         * need to decrement the dates of all the areas we render by one unit
         * of dataset precision.
         *
         * @return {Array} A nested array (like d3 expects) containing the
         *                 a query's response data but with all dates offest
         *                 by half of the dataset precision interval.
         */
        function transformValuesForRendering(values) {

          return values.map(function(value) {
            return {
              date: DateHelpers.decrementDateByHalfInterval(value.date, datasetPrecision),
              filtered: value.filtered,
              unfiltered: value.unfiltered
            };
          });

        }


        /**
         * Data can be filtered by the x-offset of the cursor from the left
         * edge of the chart or by arbitrary intervals specified with start-
         * and end Date objects.
         *
         * The two filter functions each have a SIDE-EFFECT: they both set
         * the global 'currentDatum' variable to a synthetic value which is
         * used by the flyout code to keep the highlighted areas and their
         * corresponding flyout labels in sync.
         *
         * @param {Number} offsetX - The left offset of the mouse cursor into the
         *                           visualization, in pixels.
         * @return {Object}
         *   @property {Array} highlightData - The data for the start and end
         *                                     date including the unfiltered
         *                                     and filtered values.
         *   @property {Number} left - The left offset of the selection,
         *                             in pixels.
         *   @property {Number} width - The width of one <datum>, in pixels.
         *   @property {Number} maxValue - the maximum unfiltered value in the
         *                                 latest data request.
         */
        function filterChartDataByOffset(offsetX) {

          var indexIntoChartData;
          var transformedStartDate;
          var transformedEndDate;
          var highlightData;
          var leftOffset;
          var width = visualizedDatumWidth;
          var maxValue = cachedChartData.maxValue;


          indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) * cachedChartData.values.length);

          // Note that currentDatum is a global variable that is set when the
          // user hovers over the visualization. The value of currentDatum is
          // read by the flyout code.
          currentDatum = cachedChartData.values[indexIntoChartData];

          transformedStartDate = DateHelpers.decrementDateByHalfInterval(currentDatum.date, datasetPrecision);
          transformedEndDate = DateHelpers.decrementDateByHalfInterval(moment(currentDatum.date).add(1, datasetPrecision).toDate(), datasetPrecision);

          highlightData = [
            {
              date: transformedStartDate,
              unfiltered: maxValue,
              filtered: maxValue
            },
            {
              date: transformedEndDate,
              unfiltered: maxValue,
              filtered: maxValue
            }
          ];

          leftOffset = d3XScale(transformedStartDate);

          return {
            data: highlightData,
            left: leftOffset,
            width: width,
            maxValue: maxValue
          };

        }


        /**
         *
         * Returns a bundle of stuff about the data points occurring between
         * two points in time.
         *
         * @param {Date} startDate
         * @param {Date} endDate
         * @return {Object}
         *   @property {Array} highlightData - The data for the start and end
         *                                     date including the unfiltered
         *                                     and filtered values.
         *   @property {Number} left - The left offset of the selection,
         *                             in pixels.
         *   @property {Number} width - The width of the selection, in pixels.
         *   @property {Number} maxValue - The maximum unfiltered value in the
         *                                 latest data request.
         */
        function filterChartDataByInterval(startDate, endDate) {

          var transformedStartDate = DateHelpers.decrementDateByHalfInterval(startDate, datasetPrecision);
          var transformedEndDate = DateHelpers.decrementDateByHalfInterval(endDate, datasetPrecision);
          var highlightData;
          var leftOffset = d3XScale(transformedStartDate);
          var width = d3XScale(transformedEndDate) - leftOffset;
          var maxValue = cachedChartData.maxValue;

          // We want the highlight to extend all the way to the top of the
          // visualization so we pass it the max value for filtered and
          // unfiltered. The effect this has is that d3 renders a rectangle
          // that is as tall as the tallest data point.
          highlightData = [
            {
              date: transformedStartDate,
              unfiltered: maxValue,
              filtered: maxValue
            },
            {
              date: transformedEndDate,
              unfiltered: maxValue,
              filtered: maxValue
            }
          ];

          return {
            data: highlightData,
            left: leftOffset,
            width: width,
            maxValue: maxValue
          };

        }


        /**
         *
         * This function renders the white highlight on the visualization.
         * It is agnostic to how the underlying data has been filtered and
         * simply takes a subset of the full chart data and renders it in a
         * similar fashion to how the filtered and unfiltered chart data
         * is rendered.
         *
         * @param {Object} highlightData - The output of either
         *                                 filterChartDataByOffset
         *                                 or filterChartDataByInterval.
         */
        function renderChartHighlight(highlightData) {

          var area;
          var selection;


          if (d3XScale === null || d3YScale === null) {
            return;
          }

          jqueryHighlightTargetElement.css({
            left: highlightData.left - Constants.TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN,
            width: highlightData.width + (Constants.TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN * 2),
            height: cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_BOTTOM
          });

          area = d3.
            svg.
              area().
                x(function(d) { return d3XScale(d.date); }).
                y0(cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_BOTTOM).
                y1(function(d) { return d3YScale(d.unfiltered); });

          d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              select('g').
                remove();

          selection = d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              attr('width', highlightData.width).
              attr('height', cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_BOTTOM).
              append('g');

          selection.
            append('path').
              datum(highlightData.data).
              attr('class', 'timeline-chart-highlight').
              attr('d', area);

        }


        function clearChartHighlight() {
          $('.timeline-chart-highlight-container > g > path').remove();
        }


        /**
         *
         * Converts a date and a unit into a string representation.
         *
         * @param {Date} labelDate - The date to format.
         * @param {Boolean} useFullMonthNames - Whether or not the date should
         *                                      be rendered with full month
         *                                      names.
         * @param {String} overriddenLabelPrecision - An optional precision
         *                                            to use in favor of the
         *                                            globally-defined dataset
         *                                            precision. Must be one of
         *                                            'decade', 'year', 'month'
         *                                            or 'day'.
         * @return {String} The formatted date.
         */
        function formatDateLabel(labelDate, useFullMonthNames, overriddenLabelPrecision) {

          function addLeadingZeroIfLessThanTen(number) {
            return ((number < 10) ? '0' : '') + number;
          }

          var FULL_MONTH_NAMES = [
            'January', 'February', 'March',
            'April', 'May', 'June',
            'July', 'August', 'September',
            'October', 'November', 'December'
          ];
          var SHORT_MONTH_NAMES = [
            'Jan', 'Feb', 'Mar',
            'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep',
            'Oct', 'Nov', 'Dec'
          ];
          var labelPrecisionToUse = overriddenLabelPrecision || labelPrecision;
          var label;


          switch (labelPrecisionToUse) {

            case 'DECADE':
              label = Math.floor(labelDate.getFullYear() / 10) + '0s';
              break;

            case 'YEAR':
              label = labelDate.getFullYear();
              break;

            case 'MONTH':
              if (useFullMonthNames) {
                label = FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {
                label = SHORT_MONTH_NAMES[labelDate.getMonth()] +
                        ' ’' +
                        (addLeadingZeroIfLessThanTen(labelDate.getFullYear() % 100));
              }
              break;

            case 'DAY':
              if (useFullMonthNames) {
                label = labelDate.getDate() + ' ' + FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {
                label = labelDate.getDate() + ' ' + SHORT_MONTH_NAMES[labelDate.getMonth()];
              }
              break;

            default:
              throw new Error('Cannot format date label for unrecognized unit "' + labelPrecisionToUse + '".');

          }

          return label;

        }


        /**
         * Similar to formatDateLabel but for ranges instead of discrete dates.
         *
         * @param {Date} startDate
         * @param {Date} endDate
         * @return {String} The formatteddate.
         */
        function formatDateRangeLabel(startDate, endDate) {

          function numberOfMonthsDifferent(date1, date2) {
            return moment(date2).diff(moment(date1), 'months', false);
          }

          function datesAreExactlyOneMonthDifferent(date1, date2) {
            var exactlyOneMonthDifferent = true;
            if (date2.getFullYear() !== date1.getFullYear()) {
              exactlyOneMonthDifferent = false;
            }
            if (date2.getMonth() - 1 !== date1.getMonth()) {
              exactlyOneMonthDifferent = false;
            }
            if (date2.getDate() !== date1.getDate()) {
              exactlyOneMonthDifferent = false;
            }
            return exactlyOneMonthDifferent;
          }

          // This is the expected behavior: an interval of exactly two months
          // should read 'Jan - Feb'.
          var adjustedEndDate = DateHelpers.decrementDateByHalfInterval(endDate, datasetPrecision);
          var difference;
          var dateFormatPrecision;
          var showRange = true;
          var formattedStartDate;
          var formattedEndDate;
          var label;


          switch (labelPrecision) {

            case 'DECADE':
              difference = endDate.getFullYear() - startDate.getFullYear();
              // We should not show a range if only a single year is selected.
              // Similarly, we should show exact years if the selection does
              // not fall on exact decade-by-decade boundaries. Otherwise, we
              // should show a decade-specific range, e.g. '1930s - 1940s'.
              if (difference === 10 && (startDate.getFullYear() % 10 === 0)) {
                showRange = false;
              } else if (startDate.getFullYear() % 10 !== 0 || endDate.getFullYear() % 10 !== 0) {
                dateFormatPrecision = 'YEAR';
              }
              break;

            case 'YEAR':
              difference = numberOfMonthsDifferent(startDate, endDate);
              // We should still show the month-to-month label even if
              // the interval is exactly one year in the case that the
              // start date is not January--otherwise we see a 1-year
              // span that, e.g., starts in June 2000 and ends in June
              // 2001 still listed as '2000'. 
              if (difference === 12 && startDate.getMonth() === 0) {
                showRange = false;
              } else {
                dateFormatPrecision = 'MONTH';
              }
              break;

            case 'MONTH':
              if (datesAreExactlyOneMonthDifferent(startDate, endDate) && startDate.getDate() === 1) {
                showRange = false;
              } else {
                dateFormatPrecision = 'DAY';
              }
              break;

            case 'DAY':
              difference = moment.duration(moment(endDate) - moment(startDate)).asDays();
              if (difference <= 1) {
                showRange = false;
              }
              break;

            default:
              break;

          }

          formattedStartDate = formatDateLabel(startDate, false, dateFormatPrecision);
          formattedEndDate = formatDateLabel(adjustedEndDate, false, dateFormatPrecision);

          if (showRange && (formattedStartDate !== formattedEndDate)) {
            label = '{0} - {1}'.format(formattedStartDate, formattedEndDate);
          } else {
            label = formattedStartDate;
          }

          return '{0} <span class="timeline-chart-clear-selection-button">×</span>'.format(label);

        }


        function renderChartSelection() {

          var minDate;
          var maxDate;
          var area;
          var svgChart;
          var selection;
          var selectionStartPosition;
          var selectionEndPosition;
          var labelWidth;
          var minLabelWidth;
          var labelNegativeXOffset;
          var dateRangeLabel;
          var labelLeftOffset;
          var labelRightPosition;
          var selectionDelta;
          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var transformedMinDate;
          var transformedMaxDate;
          var labelTextAlign;


          if (d3XScale === null || d3YScale === null) {
            return;
          }

          if (selectionStartDate < selectionEndDate) {
            minDate = selectionStartDate;
            maxDate = selectionEndDate;
          } else {
            minDate = selectionEndDate;
            maxDate = selectionStartDate;
          }

          if (minDate !== null && maxDate !== null) {

            // If the effective selection will not change because the selection
            // start and end dates have not changed, quit early.
            if (renderedSelectionStartDate !== null &&
                renderedSelectionEndDate !== null &&
                selectionStartDate.getTime() === renderedSelectionStartDate.getTime() &&
                selectionEndDate.getTime() === renderedSelectionEndDate.getTime()) {
              // Note that even if we are quitting early we still may need to
              // show the selection (since it may be possible that the same
              // interval was previously rendered but is now just hidden).
              jqueryChartSelectionElement.show();
              return;
            }

            margin = { top: 0, right: 0, bottom: Constants.TIMELINE_CHART_MARGIN_BOTTOM, left: 0 };

            // chartWidth and chartHeight do not include margins so that
            // we can use the margins to render axis ticks.
            chartWidth = cachedChartDimensions.width - margin.left - margin.right;
            chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

            values = [transformValuesForRendering(
              cachedChartData.values.filter(function(datum) {
                return datum.date >= minDate && datum.date <= maxDate;
              })
            )];

            // Because of the way the data is displayed, it is valid for a
            // selection to begin on the last datum and end on the last datum
            // + 1 <datasetPrecision> unit. Therefore we need to check to see
            // our selection's end date is after the last date in the actual
            // values and append a surrogate value to the filtered array with
            // an appropriate date to show as the end of the x scale along with
            // unfiltered and filtered values of 0 to prevent changing
            // aggregate values.
            if (cachedChartData.values[cachedChartData.values.length - 1].date.getTime() < maxDate.getTime()) {
              values[0].push({
                date: DateHelpers.decrementDateByHalfInterval(maxDate, datasetPrecision),
                unfiltered: 0,
                filtered: 0
              });
            }

            // Reset minDate and maxDate to accurately reflect the 'half-way'
            // interpolated values created by transformValuesForRendering.
            transformedMinDate = values[0][0].date;
            transformedMaxDate = values[0][values[0].length - 1].date;

            area = d3.
              svg.
                area().
                  x(function (d) { return d3XScale(d.date); }).
                  y0(function (d) { return d3YScale(0); }).
                  y1(function (d) { return d3YScale(d.filtered); });

            svgChart = d3ChartElement.
              select('svg.timeline-chart-selection').
                attr('width', chartWidth + margin.left + margin.right).
                attr('height', chartHeight + margin.top + margin.bottom).
              select('g').
                attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            selection = svgChart.
              selectAll('path').
                data(values);

            selection.
              enter().
                append('path');

            selection.
              exit().
                remove();

            selection.
              attr('class', 'selection').
              attr('d', area);

            selectionStartPosition = Math.floor(d3XScale(transformedMinDate));
            // Subtract one from the scaled and transformed maxDate in order to
            // prevent d3 from giving us a value that is outside the actual
            // element to which we are rendering.
            selectionEndPosition = Math.floor(d3XScale(transformedMaxDate)) - 1;

            // The ' - 12' and ' + 12' below are half the width of the
            // selection drag handles. We need to offset them away from the
            // selection area so that their activation zones do not overlap
            // the rendered selection area.
            jqueryLeftSelectionMarker.css(
              {
                left: selectionStartPosition - Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET - 12,
                height: cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_TOP - Constants.TIMELINE_CHART_MARGIN_BOTTOM
              }
            );

            jqueryRightSelectionMarker.css(
              {
                left: selectionEndPosition - Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET + 12,
                height: cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_TOP - Constants.TIMELINE_CHART_MARGIN_BOTTOM
              }
            );

            labelWidth = Math.floor(d3XScale(transformedMaxDate) - d3XScale(transformedMinDate));
            minLabelWidth = 150;
            labelNegativeXOffset = 0;

            if (labelWidth < minLabelWidth) {
              labelNegativeXOffset = (minLabelWidth - labelWidth) / 2;
              labelWidth = minLabelWidth;
            }

            dateRangeLabel = formatDateRangeLabel(minDate, maxDate);

            // Bounds-check the position of the label and keep it from
            // overflowing the card bounds
            labelLeftOffset = selectionStartPosition - labelNegativeXOffset;

            if (labelLeftOffset < -(Constants.TIMELINE_CHART_GUTTER)) {
              labelLeftOffset = -(Constants.TIMELINE_CHART_GUTTER);
            }

            labelRightPosition = labelLeftOffset + labelWidth;
            if (labelRightPosition > cachedChartDimensions.width) {
              selectionDelta = labelRightPosition - cachedChartDimensions.width;
              labelLeftOffset = labelLeftOffset -
                selectionDelta + Constants.TIMELINE_CHART_GUTTER;
            }

            labelTextAlign = 'center';

            if (labelLeftOffset < 0) {

              labelTextAlign = 'left';
              labelWidth += labelLeftOffset;
              labelLeftOffset = 0;

            } else if ((labelLeftOffset + labelWidth) > cachedChartDimensions.width) {

              labelWidth += (cachedChartDimensions.width - (labelLeftOffset + labelWidth));
              labelLeftOffset = cachedChartDimensions.width - labelWidth;
              labelTextAlign = 'right';

            }

            jqueryClearSelectionLabel.
              html(dateRangeLabel).
              css({
                left: labelLeftOffset,
                width: labelWidth,
                height: Constants.TIMELINE_CHART_MARGIN_BOTTOM,
                textAlign: labelTextAlign,
                top: cachedChartDimensions.height -
                  Constants.TIMELINE_CHART_MARGIN_TOP -
                  Constants.TIMELINE_CHART_MARGIN_BOTTOM
              });

            jqueryChartSelectionElement.show();

            renderedSelectionStartDate = selectionStartDate;
            renderedSelectionEndDate = selectionEndDate;

          }

        }


        function clearChartSelection() {

          selectionIsCurrentlyRendered = false;
          selectionStartDate = null;
          selectionEndDate = null;
          renderedSelectionStartDate = null;
          renderedSelectionEndDate = null;
          jqueryChartSelectionElement.hide();
          jqueryChartElement.removeClass('selected');

        }


        /**
         * Is probably the most complicated function in the directive
         * simply because of all the special casing that needs to happen for
         * sensible display of axis labels across multiple time intervals.
         */
        function renderChartXAxis() {



          function deriveXAxisLabelPrecision() {

            var domain;
            var xAxisLabelPrecision;

            domain = _.map(d3XScale.domain(), function(date) {
              return moment(date);
            });

            xAxisLabelPrecision = 'DECADE';

            // ...then use the domain to derive a timeline granularity.
            if (moment(domain[0]).add(2, 'months').isAfter(domain[1])) {
              xAxisLabelPrecision = 'DAY';
            } else if (moment(domain[0]).add(2, 'years').isAfter(domain[1])) {
              xAxisLabelPrecision = 'MONTH';
            } else if (moment(domain[0]).add(20, 'years').isAfter(domain[1])) {
              xAxisLabelPrecision = 'YEAR';
            }

            return xAxisLabelPrecision;

          }

          function deriveXAxisLabelDatumStep(labels) {

            var widthOfEachLabel = cachedChartDimensions.width / labels.length;
            var labelEveryN;

            if (widthOfEachLabel >= 50) {
              labelEveryN = 1;
            } else if ((widthOfEachLabel * 2) >= 50) {
              labelEveryN = 2;
            } else if ((widthOfEachLabel * 3) >= 50) {
              labelEveryN = 3;
            } else if ((widthOfEachLabel * 5) >= 50) {
              labelEveryN = 5;
            } else {
              labelEveryN = 7;
            }

            return labelEveryN;

          }

          function recordLabel(labels, startDate, endDate, pixelsPerDay, shouldLabel) {
            labels.push({
              startDate: startDate,
              endDate: endDate,
              left: d3XScale(startDate) - halfVisualizedDatumWidth,
              width: moment.duration(moment(endDate) - moment(startDate)).asDays() * pixelsPerDay,
              shouldLabel: shouldLabel
            });
          }

          var pixelsPerDay;
          var jqueryAxisContainer;
          var tickLocations = [];
          var labels = [];
          var i;
          var thisDate;
          var intervalStartDate = cachedChartData.values[0].date;
          var intervalEndDate = null;
          var shouldLabelEveryN;
          // This is half the width of each tick as defined in the accompanying CSS
          var halfTickWidth = 2;
          var jqueryAxisTick;
          var dataAggregate;
          var unfilteredAggregate;
          var filteredAggregate;
          var labelText;
          var jqueryAxisTickLabel;


          // Note that labelPrecision is actually global to the directive, but
          // it is set within the context of rendering the x-axis since it
          // seems as reasonable to do so here as anywhere else.
          labelPrecision = deriveXAxisLabelPrecision();

          pixelsPerDay = cachedChartDimensions.width /
            moment.duration(
              moment(cachedChartData.maxDate) -
              moment(cachedChartData.minDate)
            ).asDays();

          // Set up the container for the x-axis ticks.
          jqueryAxisContainer = $('<div>').
            addClass('x-ticks').
            css({
              width: cachedChartDimensions.width,
              height: Constants.TIMELINE_CHART_MARGIN_BOTTOM
            });

          for (i = 1; i < cachedChartData.values.length; i++) {

            thisDate = cachedChartData.values[i].date;

            switch (labelPrecision) {
              case 'DECADE':
                if (thisDate.getFullYear() % 10 === 0) {
                  tickLocations.push(i);
                  recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                  intervalStartDate = thisDate;
                }
                break;
              case 'YEAR':
                if (thisDate.getMonth() === 0) {
                  tickLocations.push(i);
                  recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                  intervalStartDate = thisDate;
                }
                break;
              case 'MONTH':
                if (thisDate.getDate() === 1) {
                  tickLocations.push(i);
                  recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                  intervalStartDate = thisDate;
                }
                break;
              case 'DAY':
                tickLocations.push(i);
                recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                intervalStartDate = thisDate;
                break;
            }

          }

          intervalEndDate = moment(cachedChartData.maxDate).add(1, datasetPrecision).toDate();

          // If the last date is not a tick, we still need a label to extend
          // from the last tick to the end of the visualization.
          // TODO: Verify that this will always be true and remove it as
          // necessary.
          if (labels[labels.length - 1].endDate !== intervalEndDate) {

            labels.push({
              startDate: intervalStartDate,
              endDate: intervalEndDate,
              width: cachedChartDimensions.width - d3XScale(intervalStartDate) + (2 * halfTickWidth) + halfVisualizedDatumWidth,
              left: d3XScale(intervalStartDate) - halfVisualizedDatumWidth,
              shouldLabel: false
            });

          }

          // Now that we know how many *labels* we can potentailly draw, we
          // decide whether or not we can draw all of them or just some.
          shouldLabelEveryN = deriveXAxisLabelDatumStep(labels);


          // Not ethat allChartLabelsShown is also actually global to the
          // directive and is also set within the context of rendering the
          // x-axis since it seems as reasonable to do so as anywhere else.
          allChartLabelsShown = shouldLabelEveryN === 1;


          // Finally, we filter the the group of all labels so that we only
          // label every Nth one.
          labels = labels.filter(function(label, i) {
            return (i % shouldLabelEveryN) === 0;
          });

          if (!allChartLabelsShown) {

            var halfExtendedLabelWidth = (visualizedDatumWidth * Math.floor(shouldLabelEveryN / 2));

            // Revisit each label and increase its width to accommodate the
            // space that would have been consumed by the missing labels.
            // The first one is a special case since it will only be enlarged
            // by half the amount that the others are, since it already sits at
            // the left edge of the labels. The last will be a special case
            // also, but it's easier to just adjust it after the map operation.
            labels.map(function(label) {
              label.left -= halfExtendedLabelWidth;
              label.width += (2 * halfExtendedLabelWidth);
            });

          }

          // Now we go through and draw ticks.
          for (i = 0; i < tickLocations.length; i++) {

            jqueryAxisTick = $('<rect>').
              addClass('x-tick').
              css({
                left: d3XScale(cachedChartData.values[tickLocations[i]].date) -
                      halfVisualizedDatumWidth -
                      halfTickWidth
              });

            jqueryAxisContainer.append(jqueryAxisTick);

          }

          // Now we to through and draw labels.
          for (i = 0; i < labels.length; i++) {

            // Calculate the data aggregates for this interval so we can
            // stash them as data-attributes and not need to recalculate
            // them whenever the mouse moves over this label.
            dataAggregate = cachedChartData.values.
              filter(function(datum) {
                return datum.date.getTime() >= labels[i].startDate.getTime() &&
                       datum.date.getTime() < labels[i].endDate.getTime();
              });

            unfilteredAggregate = dataAggregate.
              reduce(function(acc, datum) {
                return acc + datum.unfiltered;
              }, 0);

            filteredAggregate = dataAggregate.
              reduce(function(acc, datum) {
                return acc + datum.filtered;
              }, 0);

            labelText = labels[i].shouldLabel ? formatDateLabel(labels[i].startDate, false, labelPrecision) : '';

            // Finally, add the label to the x-axis container.
            jqueryAxisTickLabel = $('<span>').
              addClass('x-tick-label').
              attr('data-start', labels[i].startDate).
              attr('data-median', labels[i].startDate).
              attr('data-end', labels[i].endDate).
              attr('data-aggregate-unfiltered', unfilteredAggregate).
              attr('data-aggregate-filtered', filteredAggregate).
              attr('data-flyout-label', formatDateLabel(labels[i].startDate, true)).
              text(labelText).
              css({
                left: labels[i].left,
                width: labels[i].width - halfTickWidth
              });

            jqueryAxisContainer.append(jqueryAxisTickLabel);


          }

          // Replace the existing x-axis ticks with the new ones.
          jqueryChartElement.children('.x-ticks').replaceWith(jqueryAxisContainer);

        }


        /**
         * This function is comparatively straightforward, but operates
         * in the same way as renderChartXAxis.
         */
         function renderChartYAxis(chartWidth, chartHeight) {

          var jqueryAxisContainer;
          var labels;
          var ticks;
          var tickElement;


          jqueryAxisContainer = $('<div>').
            addClass('y-ticks').
            css({
              width: chartWidth,
              height: chartHeight
            });

          labels = [
            Math.round(cachedChartData.minValue),
            Math.round(cachedChartData.meanValue),
            Math.round(cachedChartData.maxValue)
          ];

          ticks = [0, 0.5, 1];

          // If our values straddle 0, then we need to force the middle tick to
          // be 0, not the average of the min and the max values.
          if (labels[0] * labels[2] < 0) {
            labels[1] = 0;
            ticks[1] = Math.abs(cachedChartData.minValue) /
                       (Math.abs(cachedChartData.minValue) + Math.abs(cachedChartData.maxValue));
          }

          _.each(ticks, function(tick, index) {

            tickElement = $('<div>').
                addClass('y-tick').
                css('bottom', Math.floor(chartHeight * tick)).
                text($.toHumaneNumber(labels[index]));

            if (labels[index] === 0) {
              tickElement.addClass('zero');
            }

            jqueryAxisContainer.append(tickElement);

          });

          // Remove old y-axis ticks and replace them
          jqueryChartElement.children('.y-ticks').replaceWith(jqueryAxisContainer);

        }


        /**
         * Rendering the chart's unfiltered and filtered values are decoupled
         * so that we can independently update and manipulate the filtered
         * values as selections are made.
         */
        function renderChartUnfilteredValues() {

          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var area;
          var svgChart;
          var selection;


          margin = { top: 0, right: 0, bottom: Constants.TIMELINE_CHART_MARGIN_BOTTOM, left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.left - margin.right;
          chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

          values = [transformValuesForRendering(cachedChartData.values)];

          area = d3.
            svg.
              area().
                x(function (d) { return d3XScale(d.date); }).
                y0(function (d) { return d3YScale(0); }).
                y1(function (d) { return d3YScale(d.unfiltered); });

          svgChart = d3ChartElement.
            select('svg.timeline-chart-unfiltered-visualization').
              attr('width', chartWidth + margin.left + margin.right).
              attr('height', chartHeight + margin.top + margin.bottom).
            select('g').
              attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          selection = svgChart.
            selectAll('path').
              data(values);

          selection.
            enter().
              append('path');

          selection.
            exit().
              remove();

          selection.
            attr('class', 'context').
            attr('d', area);

        }


        /**
         * Rendering the chart's unfiltered and filtered values are decoupled
         * so that we can independently update and manipulate the filtered
         * values as selections are made.
         */
        function renderChartFilteredValues() {

          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var area;
          var svgChart;
          var selection;


          margin = { top: 0, right: 0, bottom: Constants.TIMELINE_CHART_MARGIN_BOTTOM, left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.left - margin.right;
          chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

          if (selectionIsCurrentlyRendered) {
            values = [];
          } else {
            values = [transformValuesForRendering(cachedChartData.values)];
          }

          area = d3.
            svg.
              area().
                x(function (d) { return d3XScale(d.date); }).
                y0(function (d) { return d3YScale(0); }).
                y1(function (d) { return d3YScale(d.filtered); });

          svgChart = d3ChartElement.
            select('svg.timeline-chart-filtered-visualization').
              attr('width', chartWidth + margin.left + margin.right).
              attr('height', chartHeight + margin.top + margin.bottom).
            select('g').
              attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          selection = svgChart.
            selectAll('path').
              data(values);

          selection.
            enter().
              append('path');

          selection.
            exit().
              remove();

          selection.
            attr('class', 'shaded').
            attr('d', area);

        }


        /**
         * Basically just prepares the underlying chart data and then calls
         * special functions that render the x-axis, the y-axis, unfiltered
         * and filtered values.
         */
        function renderChart() {

          var margin;
          var chartWidth;
          var chartHeight;


          if (cachedChartDimensions.width <= 0 || cachedChartDimensions.height <= 0) {
            return;
          }

          //
          // Prepare dimensions used in chart rendering.
          //
          margin = { top: 0, right: 0, bottom: Constants.TIMELINE_CHART_MARGIN_BOTTOM, left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.left - margin.right;
          chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;


          //
          // Set up the scales and the chart-specific stack and area functions.
          // Also create the root svg element to which the other d3 functions
          // will append elements.
          //

          // d3XScale is global to the directive so that we can
          // access it without having to re-render.
          d3XScale = d3.
            time.
              scale().
                domain([
                  DateHelpers.decrementDateByHalfInterval(cachedChartData.minDate, datasetPrecision),
                  DateHelpers.incrementDateByHalfInterval(cachedChartData.maxDate, datasetPrecision)
                ]).
                range([0, chartWidth]);

          // d3YScale is global to the directive so that we can
          // access it without having to re-render.
          d3YScale = d3.
            scale.
              linear().
                domain([cachedChartData.minValue, cachedChartData.maxValue]).
                range([chartHeight, 0]).
                clamp(true);

          //
          // Render the x-axis.
          //
          renderChartXAxis();


          //
          // Render the y-axis. Since we eschew d3's built-in y-axis for a
          // custom implementation this calls out to a separate function.
          //
          renderChartYAxis(
            chartWidth,
            chartHeight
          );


          //
          // Render the unfiltered and filtered values of the chart.
          //
          renderChartUnfilteredValues();
          renderChartFilteredValues();

        }


        /**
         * @return {String} A string that is interpreted by moment to
         *                  format 'verbose' dates that appear in the flyout.
         */
        function getFlyoutDateFormatString() {

          var formatString;

          switch (datasetPrecision) {
            case 'DECADE':
              formatString = 'YYYYs';
              break;
            case 'YEAR':
              formatString = 'YYYY';
              break;
            case 'MONTH':
              formatString = 'MMMM YYYY';
              break;
            case 'DAY':
              formatString = 'D MMMM YYYY';
              break;
          }

          return formatString;

        }

        /**
         * @return {String} The HTML representation of the flyout content.
         */
        function renderFlyout() {

          var shouldDisplayFlyout = mousePositionWithinChartDisplay &&
                                    _.isDefined(currentDatum) &&
                                    currentDatum !== null &&
                                    datasetPrecision !== null &&
                                    !currentlyDragging;
          var dateString;
          var unfilteredUnit;
          var filteredUnit;
          var flyoutContent;


          if (shouldDisplayFlyout) {

            dateString = currentDatum.hasOwnProperty('flyoutLabel') ?
                           currentDatum.flyoutLabel :
                           moment(currentDatum.date).format(getFlyoutDateFormatString());

            unfilteredUnit = (currentDatum.unfiltered === 1) ?
                             cachedRowDisplayUnit :
                             cachedRowDisplayUnit.pluralize();

            filteredUnit = (currentDatum.filtered === 1) ?
                           cachedRowDisplayUnit :
                           cachedRowDisplayUnit.pluralize();

            if (currentDatum.filtered !== currentDatum.unfiltered) {

              flyoutContent = [
                  '<div class="flyout-title">{0}</div>',
                  '<div class="flyout-row">',
                    '<span class="flyout-cell">Total</span>',
                    '<span class="flyout-cell">{1} {2}</span>',
                  '</div>',
                  '<div class="flyout-row">',
                    '<span class="flyout-cell emphasis">Filtered amount</span>',
                    '<span class="flyout-cell emphasis">{3} {4}</span>',
                  '</div>'
               ].
               join('').
               format(
                 dateString,
                 $.toHumaneNumber(currentDatum.unfiltered),
                 unfilteredUnit,
                 $.toHumaneNumber(currentDatum.filtered),
                 filteredUnit
               );

            } else {

              flyoutContent = [
                 '<div class="flyout-title">{0}</div>',
                 '<div class="flyout-row">',
                   '<span class="flyout-cell">Total</span>',
                   '<span class="flyout-cell">{1} {2}</span>',
                 '</div>'
               ].
               join('').
               format(dateString, $.toHumaneNumber(currentDatum.unfiltered), unfilteredUnit);

            }

          }

          return flyoutContent;

        }

        /**
         * @param {DOM Element} target - The DOM element which triggered the
         *                               flyout.
         * @return {String} The HTML representation of the flyout content.
         */
        function renderIntervalFlyout(target) {

          var label = target.getAttribute('data-flyout-label');
          var unfilteredTotal = target.getAttribute('data-aggregate-unfiltered');
          var filteredTotal = target.getAttribute('data-aggregate-filtered');
          var shouldDisplayFlyout = mousePositionWithinChartLabels &&
                                    label !== null &&
                                    unfilteredTotal !== null &&
                                    filteredTotal !== null &&
                                    datasetPrecision !== null &&
                                    !currentlyDragging;
          var unfilteredUnit;
          var filteredUnit;
          var flyoutContent;


          if (shouldDisplayFlyout) {

            unfilteredUnit = (unfilteredTotal === 1) ?
                             cachedRowDisplayUnit :
                             cachedRowDisplayUnit.pluralize();

            filteredUnit = (filteredTotal === 1) ?
                           cachedRowDisplayUnit :
                           cachedRowDisplayUnit.pluralize();

            if (filteredTotal !== unfilteredTotal) {

              flyoutContent = [
                  '<div class="flyout-title">{0}</div>',
                  '<div class="flyout-row">',
                    '<span class="flyout-cell">Total</span>',
                    '<span class="flyout-cell">{1} {2}</span>',
                  '</div>',
                  '<div class="flyout-row">',
                    '<span class="flyout-cell emphasis">Filtered amount</span>',
                    '<span class="flyout-cell emphasis">{3} {4}</span>',
                  '</div>'
               ].
               join('').
               format(
                 label,
                 $.toHumaneNumber(parseFloat(unfilteredTotal)),
                 unfilteredUnit,
                 $.toHumaneNumber(parseFloat(filteredTotal)),
                 filteredUnit
               );

            } else {
              
              flyoutContent = [
                 '<div class="flyout-title">{0}</div>',
                 '<div class="flyout-row">',
                   '<span class="flyout-cell">Total</span>',
                   '<span class="flyout-cell">{1} {2}</span>',
                 '</div>'
               ].
               join('').
               format(label, $.toHumaneNumber(parseFloat(unfilteredTotal)), unfilteredUnit);

            }

          }

          return flyoutContent;

        }


        function renderSelectionMarkerFlyout() {
          if (mousePositionWithinChartDisplay && !currentlyDragging) {
            return '<div class="flyout-title">Drag to change filter range</div>';
          }
        }


        function renderClearSelectionMarkerFlyout() {
          if (mousePositionWithinChartLabels) {
            return '<div class="flyout-title">Clear filter range</div>';
          }
        }


        function hideDatumLabel() {
          jqueryDatumLabel.hide();
          jqueryChartElement.removeClass('dimmed');
        }


        function enterDraggingState() {
          currentlyDragging = true;
          selectionIsCurrentlyRendered = false;
          hideDatumLabel();
          jqueryChartElement.find('.timeline-chart-filtered-mask').hide();
          jqueryBodyElement.addClass('prevent-user-select');
          jqueryChartElement.removeClass('selected').addClass('selecting');
        }


        function enterSelectedState() {
          currentlyDragging = false;
          selectionIsCurrentlyRendered = true;
          hideDatumLabel();
          renderChartFilteredValues();
          jqueryChartElement.find('.timeline-chart-filtered-mask').show();
          jqueryBodyElement.removeClass('prevent-user-select');
          jqueryChartElement.removeClass('selecting').addClass('selected');
        }


        function enterDefaultState() {
          currentlyDragging = false;
          selectionIsCurrentlyRendered = false;
          clearChartSelection();
          hideDatumLabel();
          renderChartFilteredValues();
          jqueryBodyElement.removeClass('prevent-user-select');
          jqueryChartElement.removeClass('selecting').removeClass('selected');
        }


        function requestChartFilterByCurrentSelection() {
          var selectionStartDateAsMoment = moment(selectionStartDate);
          var selectionEndDateAsMoment = moment(selectionEndDate).add(1, datasetPrecision);
          if (selectionStartDateAsMoment.isValid() && selectionEndDateAsMoment.isValid()) {
            scope.$emit(
              'filter-timeline-chart',
              {
                start: moment(selectionStartDate),
                end: moment(selectionEndDate).add(1, datasetPrecision)
              }
            );
          }
        }


        function requestChartFilterReset() {
          scope.$emit('filter-timeline-chart', null);
        }


        /**
         * This is used to keep the flyout updated as you drag a selection
         * marker.
         */
        function setCurrentDatumByDate(date) {

          var i;
          var chartData = cachedChartData;


          for (i = 0; i < chartData.values.length; i++) {
            if (chartData.values[i].date >= date) {
              break;
            }
          }

          currentDatum = chartData.values[i];

        }


        /**
         * @param {Number} offsetX - The left offset of the mosue cursor into
         *                           the visualization, in pixels.
         * @return {Date} The date to which the mouse position is mapped by
         *                d3's x-scale.
         */
        function getDateFromMousePosition(offsetX) {

          var date = d3XScale.invert(offsetX);


          // Clear out unneeded precision from the date objects.
          // This intentionally falls through! Watch out!
          switch (datasetPrecision) {
            case 'YEAR':
              date.setMonth(0);
            case 'MONTH':
              date.setDate(1);
            default:
              date.setMilliseconds(0);
              date.setSeconds(0);
              date.setMinutes(0);
              date.setHours(0);
              break;
          }

          return date;

        }


        /**
         * @param {number} offsetX - The offset of the mouse pointer into the
         *                           visualization, in pixels
         * @param {DOM Element} target - The DOM element receiving the mouse
         *                               event.
         */
        function setSelectionStartAndEndDateByMousePosition(offsetX, target) {

          var candidateSelectionEndDate = null;


          if (mousePositionWithinChartLabels) {

            candidateSelectionEndDate = target.getAttribute('data-end');

            if (candidateSelectionEndDate === null) {
              return;
            }

            candidateSelectionEndDate = new Date(candidateSelectionEndDate);

            if (candidateSelectionEndDate <= selectionStartDate) {
              candidateSelectionEndDate = new Date(target.getAttribute('data-start'));
            }

          } else if (mousePositionWithinChartDisplay) {

            candidateSelectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

          } else {

            candidateSelectionEndDate = selectionEndDate;

          }

          if (candidateSelectionEndDate !== null && selectionStartDate !== null) {

            // Prevent null selections by auto-incrementing by a
            // 'datasetPrecision' unit if the calculated start and end dates
            // are the same.
            if (candidateSelectionEndDate.getTime() === selectionStartDate.getTime()) {
              candidateSelectionEndDate = getDateFromMousePosition(offsetX + halfVisualizedDatumWidth + visualizedDatumWidth);
            }

            if (candidateSelectionEndDate < cachedChartData.minDate) {
              candidateSelectionEndDate = cachedChartData.minDate;
            }

            if (candidateSelectionEndDate > cachedChartData.maxDate) {
              candidateSelectionEndDate = moment(cachedChartData.maxDate).add(1, datasetPrecision).toDate();
            }

            setCurrentDatumByDate(candidateSelectionEndDate);

            selectionEndDate = candidateSelectionEndDate;

            // Handle the special case wherein the start and end dates can end
            // up identical. This can happen when the cursor is placed on the
            // '0th' pixel of the interval. We solve it by selectively adding
            // or subtracting one <datasetPrecision> unit to/from the end date,
            // depending on whether or not subtracting from the end date would
            // put us outside the x-axis scale.
            if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
              if (selectionStartDate.getTime() === cachedChartData.minDate.getTime()) {
                selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
              } else {
                selectionEndDate = moment(selectionEndDate).subtract(1, datasetPrecision).toDate();
              }
            }

          }

        }


        /**
         * Interprets clicking and dragging and applies the expected state
         * transitions before conditionally rendering the chart selection.
         *
         * @param {Object} mouseStatus
         *   @property {Boolean} leftButtonPressed
         *   @property {Object} position
         *     @property {Number} clientX
         *     @property {Number} clientY
         */
        function handleChartSelectionEvents(mouseStatus) {

          function selectionIsExactlyTheSameAsHasBeenRendered(startDate, endDate) {

            return renderedSelectionStartDate !== null &&
                   renderedSelectionEndDate !== null &&
                   startDate.getTime() === renderedSelectionStartDate.getTime() &&
                   endDate.getTime() === renderedSelectionEndDate.getTime();
          }

          var offsetX;
          var candidateStartDate;


          // Fail early if the chart hasn't rendered itself at all yet.
          if (cachedChartDimensions === null || cachedChartOffsets === null) {
            return;
          }

          // Do not attempt to select the chart if we are clicking the
          // 'clear selection' button.
          if (mouseStatus.position.target.className === 'timeline-chart-clear-selection-button') {
            return;
          }

          offsetX = mouseStatus.position.clientX - cachedChartOffsets.left + halfVisualizedDatumWidth;

          // Mouse down while not dragging (start selecting):
          if (mouseStatus.leftButtonPressed && !currentlyDragging) {

            if (mousePositionWithinChartLabels) {

              candidateStartDate = mouseStatus.position.target.getAttribute('data-start');
              if (candidateStartDate !== null) {
                selectionStartDate = new Date(candidateStartDate);
                selectionEndDate = new Date(mouseStatus.position.target.getAttribute('data-end'));
                enterDraggingState();
              }

            } else if (mousePositionWithinChartElement) {

              // The target markers on the left and right of the selection have
              //  a 'data-selection-target' attribute value of 'left' and
              // 'right', respectively. Attempting to get that attribute on any
              // other element (e.g. the chart itself or, more specifically,
              // the highlight target that sits on top of it) will return null,
              // which will be caught by the default case and treated as a
              // normal selection-start event.
              switch (mouseStatus.position.target.getAttribute('data-selection-target')) {
                case 'left':
                  selectionStartDate = selectionEndDate;
                  selectionEndDate = getDateFromMousePosition(offsetX);
                  break;
                case 'right':
                  break;
                default:

                  // If the mouse is inside the chart element and inside the
                  // chart display, then we can just do the drag selection as
                  // normal.
                  if (mousePositionWithinChartDisplay) {

                    selectionStartDate = getDateFromMousePosition(offsetX);
                    selectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

                    if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
                      selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
                    }

                    // If the user is clicking on the same selection again,
                    // then we deselct it.
                    if (selectionIsExactlyTheSameAsHasBeenRendered(selectionStartDate, selectionEndDate)) {
                      enterDefaultState();
                      requestChartFilterReset();
                      return;
                    }

                  } else {

                    // If the mouse is inside the chart element but outside the
                    // chart display, then it must be in the left or right
                    // margin, in which case we want to anchor the min or max
                    // date to the chart's min or max date and make the
                    // selection 1 display unit wide.
                    if (offsetX < cachedChartDimensions.width / 2) {
                      selectionStartDate = cachedChartData.minDate;
                      selectionEndDate = moment(cachedChartData.minDate).add(1, datasetPrecision).toDate();
                    } else {
                      selectionStartDate = moment(cachedChartData.maxDate).add(1, datasetPrecision).toDate();
                      selectionEndDate = cachedChartData.maxDate;
                    }

                  }
                  break;
              }

              enterDraggingState();

            }

          }

          // Mouse up while dragging (stop selecting):
          if (currentlyDragging && !mouseStatus.leftButtonPressed) {

            clearChartHighlight();

            if (selectionStartDate > selectionEndDate) {

              // candidateStartDate is used here as a temporary variable
              // when swapping the two values so that the selectionStartDate
              // always occurs before the selectionEndDate.
              candidateStartDate = selectionStartDate;
              selectionStartDate = selectionEndDate;
              selectionEndDate = candidateStartDate;
            }

            if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
              selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
            }

            enterSelectedState();

            requestChartFilterByCurrentSelection();

          }

        }


        function handleChartMouseleaveEvent() {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
        }


        function handleClearSelectionLabelMousedownEvent() {
          requestChartFilterReset();
          enterDefaultState();
        }


        /**
         * @param {Date} startDate
         * @param {Date} endDate
         */
        function highlightChart(startDate, endDate) {

          var highlightData;


          highlightData = filterChartDataByInterval(
            startDate,
            endDate
          );

          setCurrentDatumByDate(startDate);

          renderChartHighlight(
            highlightData
          );

        }


        /**
         * @param {Number} offsetX - The left offset of the mouse cursor into
         *                           the visualization, in pixels.
         */
        function highlightChartByMouseOffset(offsetX) {

          var highlightData;


          if (mousePositionWithinChartDisplay || mousePositionWithinChartLabels) {

            highlightData = filterChartDataByOffset(offsetX);

            renderChartHighlight(
              highlightData
            );

            hideDatumLabel();

          }

        }


        /**
         * @param {Number} offsetX - The left offset of the mouse cursor into
         *                           the visualization, in pixels.
         */
        function highlightChartWithHiddenLabelsByMouseOffset(offsetX) {

          var indexIntoChartData;
          var startDate;
          var endDate;


          indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) * cachedChartData.values.length);

          // Note that currentDatum is a global variable that is set when the
          // user hovers over the visualization. The value of currentDatum is
          // read by the flyout code.
          currentDatum = cachedChartData.values[indexIntoChartData];

          startDate = currentDatum.date;
          endDate = moment(currentDatum.date).add(1, datasetPrecision).toDate();

          // 1. Dim all the existing labels
          // 2. Set the value of the datum label to the startDate
          // 3. Show the datum label
          jqueryChartElement.addClass('dimmed');
          jqueryDatumLabel.
            text(formatDateLabel(startDate, false)).
            attr('data-start', startDate).
            attr('data-end', endDate).
            attr('data-aggregate-unfiltered', currentDatum.unfiltered).
            attr('data-aggregate-filtered', currentDatum.filtered).
            attr('data-flyout-label', formatDateLabel(startDate, true)).
            css({
              left: Math.floor(d3XScale(startDate)) - halfDatumLabelWidth
            }).show();

          highlightChart(startDate, endDate);

          // This is left here as a reminder that we need to come up with some
          // way to trigger flyouts on something other than the explicit
          // mousemove event target.
          //fireMouseMoveEventOnHighlightTarget(mousePosition.clientX, mousePosition.clientY);

        }


        /**
         * @param {DOM Element} target - A DOM element with data attributes
         *                               describing an interval's start date,
         *                               end date, filtered and unfiltered
         *                               values and the formatted flyout label.
         */
        function highlightChartByInterval(target) {

          var startDate;
          var endDate;


          startDate = new Date(target.getAttribute('data-start'));
          endDate = new Date(target.getAttribute('data-end'));

          hideDatumLabel();

          // TODO: Factor this out. See also filterChartDataByOffset'S use.
          currentDatum = {
            unfiltered: target.getAttribute('data-aggregate-unfiltered'),
            filtered: target.getAttribute('data-aggregate-filtered'),
            flyoutLabel: target.getAttribute('data-flyout-label')
          };

          highlightChart(startDate, endDate);

        }


        /**
         * @param {Number} offsetX - The left offset of the mouse cursor into
         *                           the visualization, in pixels.
         * @param {Number} offsetY - The top offset of the mouse cursor into
         *                           the visualization, in pixels.
         * @return {Boolean}
         */
        function isMouseWithinChartDisplay(offsetX, offsetY) {

          return offsetX > 0 &&
                 offsetX <= cachedChartDimensions.width &&
                 offsetY > 0 &&
                 offsetY <= cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_BOTTOM;

        }


        /**
         * @param {Number} offsetX - The left offset of the mouse cursor into
         *                           the visualization, in pixels.
         * @param {Number} offsetY - The top offset of the mouse cursor into
         *                           the visualization, in pixels.
         * @return {Boolean}
         */
        function isMouseWithinChartLabels(offsetX, offsetY) {

          return offsetX > 0 &&
                 offsetX <= cachedChartDimensions.width &&
                 offsetY > cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN_BOTTOM &&
                 offsetY <= cachedChartDimensions.height;

        }


        /**
         * @param {DOM Element} target - The DOM element belonging to this
         *                               instance of the visualization.
         * @return {Boolean}
         */
        function isMouseOverChartElement(target) {

          var closestChart = $(target).closest('.timeline-chart');

          return closestChart.length > 0 && closestChart[0] === element[0];

        }


        // This sequence combines mouse movements with left mouse button
        // down/up events. We use this sequence to handle chart selection:
        // selection begins when the left mouse button is pressed and the
        // selection changes as the user moves the mouse. Selection ends
        // when the user releases the left mouse button.
        //
        // BUG: This does not update the mouse target if you click but don't
        // move the mouse, and that click causes a different element to fall
        // under the pointer for the second click (clicking to dismiss, for
        // example)
        mouseLeftButtonChangesSubscription = WindowState.mouseLeftButtonPressedSubject.flatMapLatest(
          function(mouseLeftButtonNowPressed) {
            return Rx.Observable.combineLatest(
              Rx.Observable.returnValue(mouseLeftButtonNowPressed),
              WindowState.mousePositionSubject.take(1),
              function(mouseLeftButtonNowPressedObservable, mousePositionObservable) {
                return {
                  leftButtonPressed: mouseLeftButtonNowPressedObservable,
                  position: mousePositionObservable
                };
              }
            );
          }
        ).subscribe(handleChartSelectionEvents);


        // This sequence represents ordinary mouse movement and is used
        // to update flyouts, labels and highlights.
        mouseMoveOrLeftButtonChangesSubscription = Rx.Observable.subscribeLatest(
          WindowState.mousePositionSubject,
          WindowState.scrollPositionSubject,
          WindowState.mouseLeftButtonPressedSubject,
          function(mousePosition, scrollPosition, mouseLeftButtonNowPressed) {

            var offsetX;
            var offsetY;
            var mousePositionTarget = $(mousePosition.target);


            // Fail early if the chart hasn't rendered itself at all yet.
            if (cachedChartDimensions === null || cachedChartOffsets === null) {
              return;
            }

            offsetX = mousePosition.clientX - cachedChartOffsets.left;
            offsetY = mousePosition.clientY + scrollPosition - cachedChartOffsets.top;

            // mousePositionWithinChartElement is a global variable that is
            // used elsewhere as well
            mousePositionWithinChartElement = isMouseOverChartElement(mousePosition.target);

            // First figure out which region (display, labels, outside) of the
            // visualization the mouse is currently over and cache the result
            // for this and other functions to use.
            //
            // mousePositionWithinChartDisplay and
            // mousePositionWithinChartLabels are both also global variables
            // that are used elsewhere as well.
            if (isMouseWithinChartDisplay(offsetX, offsetY) && mousePositionWithinChartElement) {

              mousePositionWithinChartDisplay = true;
              mousePositionWithinChartLabels = false;

            } else if (isMouseWithinChartLabels(offsetX, offsetY) && mousePositionWithinChartElement) {

              mousePositionWithinChartDisplay = false;
              mousePositionWithinChartLabels = true;

            } else {

              mousePositionWithinChartDisplay = false;
              mousePositionWithinChartLabels = false;

            }

            // If we are currently dragging, then we need to update and
            // re-render the selected area.
            if (currentlyDragging) {

              setSelectionStartAndEndDateByMousePosition(offsetX, mousePosition.target);

              renderChartSelection();

            // Otherwise we need to update and render an appropriate highlight
            // (by mouse position if the mouse is within the display or by
            // interval if the mouse is over the chart labels).
            } else {

              if (mousePositionWithinChartDisplay) {

                if (!allChartLabelsShown) {
                  highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePosition.target);
                } else {
                  highlightChartByMouseOffset(offsetX, mousePosition.target);
                }

              } else if (mousePositionWithinChartLabels && !mouseLeftButtonNowPressed) {

                // Clear the chart highlight if the mouse is currently over the
                // 'clear chart selection' button.
                if (mousePositionTarget.hasClass('timeline-chart-clear-selection-label') ||
                    mousePositionTarget.hasClass('timeline-chart-clear-selection-button')) {

                  clearChartHighlight();
                  hideDatumLabel();

                // Otherwise, render a highlight over the interval indicated by
                // the label that is currently under the mouse.
                } else {

                  if (!allChartLabelsShown) {

                    highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePosition.target);

                  } else {

                    highlightChartByInterval(mousePosition.target);

                  }

                }

              } else {

                jqueryChartElement.find('.x-tick-label').removeClass('emphasis');
                hideDatumLabel();

              }

            }

          }
        );


        //
        // Set up flyout registrations and event handlers.
        //
        FlyoutService.register('timeline-chart-highlight-target', renderFlyout);
        FlyoutService.register('x-tick-label', renderIntervalFlyout);
        FlyoutService.register('selection-marker', renderSelectionMarkerFlyout);
        FlyoutService.register('timeline-chart-clear-selection-label', renderClearSelectionMarkerFlyout);
        FlyoutService.register('timeline-chart-clear-selection-button', renderClearSelectionMarkerFlyout);

        jqueryChartElement.on('mouseleave', handleChartMouseleaveEvent);
        jqueryClearSelectionLabel.on('mousedown', handleClearSelectionLabelMousedownEvent);


        //
        // Dispose of WindowState windowStateSubscriptions, flyout registrations
        // and event handlers when the directive is destroyed.
        //
        scope.$on('$destroy', function() {

          mouseLeftButtonChangesSubscription.dispose();
          mouseMoveOrLeftButtonChangesSubscription.dispose();

          FlyoutService.deregister('timeline-chart-highlight-target', renderFlyout);
          FlyoutService.deregister('x-tick-label', renderIntervalFlyout);
          FlyoutService.deregister('selection-marker', renderSelectionMarkerFlyout);
          FlyoutService.deregister('timeline-chart-clear-selection-label', renderClearSelectionMarkerFlyout);
          FlyoutService.deregister('timeline-chart-clear-selection-button', renderClearSelectionMarkerFlyout);

          jqueryChartElement.off('mouseleave', handleChartMouseleaveEvent);
          jqueryClearSelectionLabel.off('mousedown', handleClearSelectionLabelMousedownEvent);

        });


        //
        // Render the chart
        //
        Rx.Observable.subscribeLatest(
          element.closest('.card-visualization').observeDimensions(),
          scope.observe('chartData'),
          scope.observe('precision'),
          scope.observe('rowDisplayUnit'),
          function(chartDimensions, chartData, precision, rowDisplayUnit) {

            if (!_.isDefined(chartData) || !_.isDefined(precision)) {
              return;
            }

            // Analytics start.
            scope.$emit('render:start', { source: 'timelineChart_{0}'.format(scope.$id), timestamp: _.now() });

            // Only update the chartOffset sequence if we have done a full
            // re-render. This is used by renderHighlightedChartSegment but
            // that function will potentially fire many times per second so we
            // want to cache this value instead of listening to it directly.
            // NOTE THAT THIS IS ABSOLUTE OFFSET, NOT SCROLL OFFSET.
            cachedChartOffsets = element.offset();

            // Because we are about to divide by the number of values in the
            // provided chart data, we need to first check to make sure we
            // won't try to divide by zero and throw an exception instead of
            // rendering if that's the case.
            if (chartData.values.length === 0) {
              throw new Error('Cannot render timeline chart with zero values.');
            }

            // Cache the datum width and half the datum width for use elsewhere
            // instead of repeated recomputation.
            visualizedDatumWidth = Math.floor(chartDimensions.width / chartData.values.length);
            halfVisualizedDatumWidth = Math.floor(visualizedDatumWidth / 2);

            // Update the cached value for dataset precision.
            // This is global to the directive, but only updated here.
            datasetPrecision = precision;

            // Cache the row display unit for use in the flyout (which
            // necessarily is handled outside the scope of this subscribeLatest
            // and which probably shouldn't be wrapped in its own
            // subscribeLatest or other combinator).
            cachedRowDisplayUnit = rowDisplayUnit;

            cachedChartDimensions = chartDimensions;
            cachedChartData = chartData;

            renderChart();

            // Make sure we also re-render the chart selection if it is visible
            // (such as in the case of a visualization re-render triggered by
            // the window being resized).
            if (selectionIsCurrentlyRendered) {
              renderedSelectionStartDate = null;
              renderedSelectionEndDate = null;
              renderChartSelection();
            }

            // Yield execution to the browser to render, then notify that
            // render is complete
            $timeout(function() {
              scope.$emit('render:complete', { source: 'timelineChart_{0}'.format(scope.$id), timestamp: _.now() });
            });

          });

        // React to the activeFilters being cleared when a selection is active
        Rx.Observable.subscribeLatest(
          scope.observe('activeFilters'),
          function(activeFilters) {
            if (selectionIsCurrentlyRendered && _.isEmpty(activeFilters)) {
              enterDefaultState();
            }
          }
        );

      }
    };
  }

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();
