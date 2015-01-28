(function() {
  'use strict';

  /*

  KNOWN BUGS

  1. The heuristic by which we decide when to display only some labels is pretty neat.

  */

  var FLYOUT_DATE_FORMAT = {
    DAY: 'D MMMM YYYY',
    MONTH: 'MMMM YYYY',
    YEAR: 'YYYY',
    DECADE: 'YYYYs'
  };


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

        //
        // The following three cached jQuery/d3 selectors are used throughout the directive.
        //

        var jqueryBodyElement = $('body');
        var jqueryChartElement = element.find('.timeline-chart-wrapper');

        var jqueryHighlightTargetElement = element.find('.timeline-chart-highlight-target');
        var jqueryHighlightContainerElement = element.find('.timeline-chart-highlight-container');

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

        // currentDatum is used to persist information about the highlighted region between
        // the filterChartData and flyout rendering functions.
        var currentDatum = null;

        // datasetPrecision is used only to correctly format dates for the flyout rendering
        // function, but we only really have a notion of it within the context of Rx reactions;
        // for this reason it's cached globally.
        var datasetPrecision = null;
        var labelPrecision = null;

        // Cache a bunch of stuff that is useful in a lot of places that don't need to be
        // wrapped in Rx mojo.
        var cachedChartDimensions = null;
        var cachedChartOffsets = null;
        var cachedChartData = null;
        var cachedAggregation = { aggregation: null, field: null }
        var cachedRowDisplayUnit = null;

        // Keep track of whether or not the mouse button is pressed, which we compare with
        // values coming off of the mouseLeftButtonPressed sequence to figure out if the
        // mouse has just gone from up to down or vice-versa.
        var mouseLeftButtonWasPressed = false;

        // Keep track of whether or not this instance of a timeline chart is in the 'dragging'
        // state so that we can selectively listen for mouseup and apply the 'goalpost' selection
        // area.
        var currentlyDragging = false;

        // Keep track of whether or not the mouse position is within this instance of a timeline
        // chart's visualization area (the chart itself and the x-axis labels beneath it).
        var mousePositionWithinChartElement = false;
        var mousePositionWithinChartDisplay = false;
        var mousePositionWithinChartLabels = true;

        var visualizedDatumWidth = 0;
        var halfVisualizedDatumWidth = 0;

        var valueAndPositionOnClickObservable;

        var selectionActive = false;
        var selectionStartedBeyondMaxDate = false;
        var setDateOnMouseUp = false;


        // Keep track of the start and end of the selection.
        var selectionStartDate = null;
        var selectionEndDate = null;

        var renderedSelectionStartDate = null;
        var renderedSelectionEndDate = null;

        var displayedLabelDates = [];
        var allChartLabelsShown = true;


        var mouseLeftButtonChangesSubscription;
        var mouseMoveOrLeftButtonChangesSubscription;


        /**********************************************************************
         *
         * transformValuesForRendering
         *
         * Because we want the beginning and end of the highlights and
         * selection ranges to correspond with the ticks, and d3's ordinary
         * way of rendering area charts with data like ours would place the
         * ticks at the center of the highlights and selection ranges, we
         * need to decrement the dates of all the areas we render by one unit
         * of dataset precision.
         *
         */

        function transformValuesForRendering(values) {

          return [
            values.map(function(value) {
              return {
                date: DateHelpers.decrementDateByInterval(value.date, datasetPrecision),
                filtered: value.filtered,
                unfiltered: value.unfiltered
              }
            })
          ];

        }


        /**********************************************************************
         *
         * filterChartDataByOffset
         *
         * Data can be filtered by the x-offset of the cursor from the left
         * edge of the chart or by arbitrary intervals specified with start-
         * and end Date objects.
         *
         * The two filter functions each have a SIDE-EFFECT: they both set
         * the global 'currentDatum' variable to a synthetic value which is
         * used by the flyout code to keep the highlighted areas and their
         * corresponding flyout labels in sync.
         *
         */

        function filterChartDataByOffset(offsetX) {

          var indexIntoChartData;
          var selectedDatum;
          var transformedStartDate;
          var transformedEndDate;
          var highlightData;
          var leftOffset;
          var width = visualizedDatumWidth;
          var maxValue = cachedChartData.maxValue;


          indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) * cachedChartData.values.length);

          // Note that currentDatum is a global variable that is set when the user hovers over the visualization.
          // The value of currentDatum is read by the flyout code.
          currentDatum = cachedChartData.values[indexIntoChartData];

          transformedStartDate = DateHelpers.decrementDateByInterval(currentDatum.date, datasetPrecision);
          transformedEndDate = DateHelpers.decrementDateByInterval(moment(currentDatum.date).add(1, datasetPrecision).toDate(), datasetPrecision);

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


        /**********************************************************************
         *
         * filterChartDataByInterval
         *
         * Does what it says on the tin. See the comment for
         * filterChartDataByOffset for a brief overview of what
         * these two functions do.
         *
         */

        function filterChartDataByInterval(startDate, endDate) {

          var transformedStartDate = DateHelpers.decrementDateByInterval(startDate, datasetPrecision);
          var transformedEndDate = DateHelpers.decrementDateByInterval(endDate, datasetPrecision);
          var highlightData;
          var leftOffset = d3XScale(transformedStartDate);
          var width = d3XScale(transformedEndDate) - leftOffset;
          var maxValue = cachedChartData.maxValue;


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
            maxValue: cachedChartData.maxValue
          };

        }


        /**********************************************************************
         *
         * renderChartHighlight
         *
         * Is agnostic to how the underlying data has been
         * filtered and simply takes a subset of the full chart data and renders
         * it in a similar fashion to how the filtered and unfiltered chart data
         * is rendered.
         *
         */

        function renderChartHighlight(highlightData) {

          var area;
          var svgChart;
          var selection;


          if (d3XScale === null || d3YScale === null) {
            return;
          }

          jqueryHighlightTargetElement.css({
            left: highlightData.left - Constants['TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN'],
            width: highlightData.width + (Constants['TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN'] * 2),
            height: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
          });

          area = d3.
            svg.
              area().
                x(function(d) { return d3XScale(d.date); }).
                y0(cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
                y1(function(d) { return d3YScale(d.unfiltered); });

          d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              select('g').
                remove();

          selection = d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              attr('width', highlightData.width).
              attr('height', cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
              append('g');

          selection.
            append('path').
              datum(highlightData.data).
              attr('class', 'timeline-chart-highlight').
              attr('d', area);

        }


        /**********************************************************************
         *
         * clearChartHighlight
         *
         */

        function clearChartHighlight() {
          $('.timeline-chart-highlight-container > g > path').remove()
        }


        /**********************************************************************
         *
         * renderChartSelection
         *
         */

        function renderChartSelection() {

          var minDate;
          var maxDate;
          var selectionData;
          var stack;
          var area;
          var seriesStack;
          var svgChart;
          var selection;
          var selectionStartPosition;
          var selectionEndPosition;
          var labelWidth;
          var minLabelWidth;
          var labelNegativeXOffset;
          var dateRangeLabel;
          var selectionButtonLeftOffset;
          var selectionButtonRightPosition;
          var selectionDelta;
          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var transformedMinDate;
          var transformedMaxDate;
          var area;
          var svgChart;
          var selection;


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

            // If the effective selection will not change because the selection start and end
            // dates have not changed, quit early.
            if (renderedSelectionStartDate !== null &&
                renderedSelectionEndDate !== null &&
                selectionStartDate.getTime() == renderedSelectionStartDate.getTime() &&
                selectionEndDate.getTime() == renderedSelectionEndDate.getTime()) {
              // Note that even if we are quitting early we still may need to show
              // the selection (since it may be possible that the same interval
              // was previously rendered but is now just hidden).
              jqueryChartSelectionElement.show();
              return;
            }

            margin = { top: 0, right: 0, bottom: Constants['TIMELINE_CHART_MARGIN_BOTTOM'], left: 0 };

            // chartWidth and chartHeight do not include margins so that
            // we can use the margins to render axis ticks.
            chartWidth = cachedChartDimensions.width - margin.left - margin.right;
            chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

            values = transformValuesForRendering(
              cachedChartData.values.filter(function(datum) {
                return datum.date >= minDate && datum.date <= maxDate;
              })
            );

            // Reset minDate and maxDate to accurately reflect the 'half-way' interpolated
            // values created by transformValuesForRendering.
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
            selectionEndPosition = Math.floor(d3XScale(transformedMaxDate)) - 1;

            jqueryLeftSelectionMarker.css(
              {
                left: selectionStartPosition - Constants['TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET'] - 12,
                height: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              }
            );

            jqueryRightSelectionMarker.css(
              {
                left: selectionEndPosition - Constants['TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET'] + 12,
                height: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              }
            );

            labelWidth = Math.floor(d3XScale(transformedMaxDate) - d3XScale(transformedMinDate));
            minLabelWidth = 150;
            labelNegativeXOffset = 0;

            if (labelWidth < minLabelWidth) {
              labelNegativeXOffset = (minLabelWidth - labelWidth) / 2;
              labelWidth = minLabelWidth;
            }

            dateRangeLabel = formatSelectionRangeLabel(minDate, maxDate);

            // Bounds-check the position of the label and keep it from
            // overflowing the card bounds
            selectionButtonLeftOffset = selectionStartPosition - labelNegativeXOffset;
            if (selectionButtonLeftOffset < -(Constants['TIMELINE_CHART_GUTTER'])) {
              selectionButtonLeftOffset = -(Constants['TIMELINE_CHART_GUTTER']);
            }

            selectionButtonRightPosition = selectionButtonLeftOffset + labelWidth;
            if (selectionButtonRightPosition > cachedChartDimensions.width) {
              selectionDelta = selectionButtonRightPosition - cachedChartDimensions.width;
              selectionButtonLeftOffset = selectionButtonLeftOffset -
                selectionDelta + Constants['TIMELINE_CHART_GUTTER'];
            }

            jqueryClearSelectionLabel.
              html(dateRangeLabel).
              css({
                left: selectionButtonLeftOffset,
                width: labelWidth,
                height: Constants['TIMELINE_CHART_MARGIN_BOTTOM'],
                top: cachedChartDimensions.height -
                  Constants['TIMELINE_CHART_MARGIN_TOP'] -
                  Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              });

            jqueryChartSelectionElement.show();

            renderedSelectionStartDate = selectionStartDate;
            renderedSelectionEndDate = selectionEndDate;

          }

        }


        /**********************************************************************
         *
         * clearChartSelection
         *
         */

        function clearChartSelection() {
          selectionActive = false;
          selectionStartDate = null;
          selectionEndDate = null;
          renderedSelectionStartDate = null;
          renderedSelectionEndDate = null;
          jqueryChartSelectionElement.hide();
          jqueryChartElement.removeClass('selected');
        }


        /**********************************************************************
         *
         * renderChartXAxis
         *
         * Is probably the most complicated function in the directive
         * simply because of all the special casing that needs to happen for
         * sensible display of axis labels across multiple time intervals.
         *
         */

        function renderChartXAxis(jqueryChartElement, chartWidth, chartHeight, d3XScale, chartData) {

          function deriveXAxislabelPrecision() {

            var domain;
            var labelPrecision;

            domain = _.map(d3XScale.domain(), function(date) {
              return moment(date);
            });

            labelPrecision = 'DECADE';

            // ...then use the domain to derive a timeline granularity.
            if (moment(domain[0]).add(2, 'months').isAfter(domain[1])) {
              labelPrecision = 'DAY';
            } else if (moment(domain[0]).add(2, 'years').isAfter(domain[1])) {
              labelPrecision = 'MONTH';
            } else if (moment(domain[0]).add(20, 'years').isAfter(domain[1])) {
              labelPrecision = 'YEAR';
            }

            return labelPrecision;

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

          var tickInterval;
          var pixelsPerDay;
          var jqueryAxisContainer;
          var tickLocations = [];
          var labels = [];
          var i;
          var thisDate;
          var shouldLabel;
          var intervalStartDate = cachedChartData.values[0].date;
          var intervalEndDate = null;
          var shouldLabelEveryN;
          var halfTickWidth = 2; // This is half the width of each tick as defined in the accompanying CSS
          var jqueryAxisTick;
          var dataAggregate;
          var unfilteredAggregate;
          var filteredAggregate;
          var labelText;
          var jqueryAxisTickLabel;


          // Note that labelPrecision is actually global to the directive, but it is set within the context
          // of rendering the x-axis since it seems as reasonable to do so here as anywhere else.
          labelPrecision = deriveXAxislabelPrecision();


          if (labelPrecision === 'DECADE') {
            tickInterval = moment.duration(10, 'year').asDays();
          } else {
            tickInterval = moment.duration(1, labelPrecision).asDays();
          }

          pixelsPerDay = cachedChartDimensions.width /
            moment.duration(moment(cachedChartData.maxDate) -
            moment(cachedChartData.minDate)).asDays();

          // Set up the container for the x-axis ticks.
          jqueryAxisContainer = $('<div>').
            addClass('x-ticks').
            css({
              width: chartWidth,
              height: Constants['TIMELINE_CHART_MARGIN_BOTTOM']
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
          if (labels[labels.length - 1].endDate !== intervalEndDate) {

            labels.push({
              startDate: intervalStartDate,
              endDate: intervalEndDate,
              width: cachedChartDimensions.width - d3XScale(intervalStartDate) + (2 * halfTickWidth) + halfVisualizedDatumWidth,
              left: d3XScale(intervalStartDate) - halfVisualizedDatumWidth,
              shouldLabel: false
            });

          }

          // Now that we know how many *labels* we can potentailly draw, we decide whether or not
          // we can draw all of them or just some.
          shouldLabelEveryN = deriveXAxisLabelDatumStep(labels);


          // Not ethat allChartLabelsShown is also actually global to the directive and is also set within
          // the context of rendering the x-axis since it seems as reasonable to do so as anywhere else.
          allChartLabelsShown = shouldLabelEveryN === 1;


          // Finally, we filter the the group of all labels so that we only label every Nth one.
          labels = labels.filter(function(label, i) {
            return (i % shouldLabelEveryN) === 0;
          });

          if (!allChartLabelsShown) {

            var halfExtendedLabelWidth = (visualizedDatumWidth * Math.floor(shouldLabelEveryN / 2));

            // Revisit each label and increase its width to accommodate the space that would have
            // been consumed by the missing labels.
            // The first one is a special case since it will only be enlarged by half the amount
            // that the others are, since it already sits at the left edge of the labels.
            // The last will be a special case also, but it's easier to just adjust it after the
            // map operation.
            labels.map(function(label, i) {
              //if (i === 0) {
              //  label.width += halfExtendedLabelWidth;
              //} else {
                label.left -= halfExtendedLabelWidth;
                label.width += (2 * halfExtendedLabelWidth);
              //}
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


        /**********************************************************************
         *
         * renderChartYAxis
         *
         * Is comparatively straightforward, but functions
         * in the same way as renderChartXAxis.
         *
         */

        function renderChartYAxis(jqueryChartElement, chartWidth, chartHeight, chartData) {

          var jqueryAxisContainer;
          var labels;
          var ticks;
          var tick;


          jqueryAxisContainer = $('<div>').
            addClass('y-ticks').
            css({
              width: chartWidth,
              height: chartHeight
            });

          labels = [
            Math.round(chartData.minValue),
            Math.round(chartData.meanValue),
            Math.round(chartData.maxValue)
          ].sort(function(a, b) {
            if (a > b) {
              return 1;
            } else if (a < b) {
              return -1;
            } else {
              return 0;
            }
          });

          ticks = [0, 0.5, 1];

          // If our values straddle 0, then we need to force the middle tick to
          // be 0, not the average of the min and the max values.
          if (labels[0] * labels[2] < 0) {
            labels[1] = 0;
            ticks[1] = Math.abs(chartData.minValue) /
                       (Math.abs(chartData.minValue) + Math.abs(chartData.maxValue));
          }

          _.each(ticks, function(tick, index) {

            tick = $('<div>').
                addClass('y-tick').
                css('bottom', Math.floor(chartHeight * tick)).
                text($.toHumaneNumber(labels[index]));

            if (labels[index] === 0) {
              tick.addClass('zero');
            }

            jqueryAxisContainer.append(tick);

          });

          // Remove old y-axis ticks and replace them
          jqueryChartElement.children('.y-ticks').replaceWith(jqueryAxisContainer);

        }


        /**********************************************************************
         *
         * renderChart
         *
         * Basically just prepares the underlying chart data and
         * tweaks the settings on d3 before letting it do its thing
         * with its native stacked area chart functionality.
         *
         */

        function renderChart(chartData, dimensions, precision) {

          var margin;
          var chartWidth;
          var chartHeight;
          var stack;
          var unfilteredArea;
          var filteredArea;
          var svgChart;
          var labelVar;
          var varNames;
          var seriesStack;
          var series;
          var selection;


          if (dimensions.width <= 0 || dimensions.height <= 0) {
            return;
          }

          //
          // Prepare dimensions used in chart rendering.
          //

          margin = { top: 0, right: 0, bottom: Constants['TIMELINE_CHART_MARGIN_BOTTOM'], left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = dimensions.width - margin.left - margin.right;
          chartHeight = dimensions.height - margin.top - margin.bottom;


          //
          // Set up the scales and the chart-specific stack and area
          // functions. Also create the root svg element to which
          // the other d3 functions will append elements.
          //

          // d3XScale is global to the directive so that we can
          // access it without having to re-render.
          d3XScale = d3.
            time.
              scale().
                domain([
                  DateHelpers.decrementDateByInterval(chartData.minDate, datasetPrecision),
                  DateHelpers.incrementDateByInterval(chartData.maxDate, datasetPrecision)
                ]).
                range([0, chartWidth]);

          // d3YScale is global to the directive so that we can
          // access it without having to re-render.
          d3YScale = d3.
            scale.
              linear().
                domain([chartData.minValue, chartData.maxValue]).
                range([chartHeight, 0]).
                clamp(true);

          //
          // Render the x-axis.
          //

          renderChartXAxis(
            jqueryChartElement,
            chartWidth,
            chartHeight,
            d3XScale,
            chartData
          );


          //
          // Render the y-axis. Since we eschew d3's built-in y-axis for a custom
          // implementation this calls out to a separate function.
          //

          renderChartYAxis(
            jqueryChartElement,
            chartWidth,
            chartHeight,
            chartData
          );


          //
          // Render the unfiltered and filtered values of the chart.
          //

          renderChartUnfilteredValues();
          renderChartFilteredValues();

        }


        /**********************************************************************
         *
         * renderChartUnfilteredValues
         *
         * Rendering the chart's unfiltered and filtered values are decoupled
         * so that we can independently update and manipulate the filtered
         * values as selections are made.
         *
         */

        function renderChartUnfilteredValues() {

          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var area;
          var svgChart;
          var selection;


          margin = { top: 0, right: 0, bottom: Constants['TIMELINE_CHART_MARGIN_BOTTOM'], left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.left - margin.right;
          chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

          values = transformValuesForRendering(cachedChartData.values);

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


        /**********************************************************************
         *
         * renderChartFilteredValues
         *
         * Rendering the chart's unfiltered and filtered values are decoupled
         * so that we can independently update and manipulate the filtered
         * values as selections are made.
         *
         */

        function renderChartFilteredValues() {

          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var area;
          var svgChart;
          var selection;


          margin = { top: 0, right: 0, bottom: Constants['TIMELINE_CHART_MARGIN_BOTTOM'], left: 0 };

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.left - margin.right;
          chartHeight = cachedChartDimensions.height - margin.top - margin.bottom;

          if (selectionActive) {
            values = [];
          } else {
            values = transformValuesForRendering(cachedChartData.values);
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


        /**********************************************************************
         *
         * renderFlyout
         *
         */

        function renderFlyout(target) {

          var shouldDisplayFlyout = mousePositionWithinChartDisplay &&
                                    _.isDefined(currentDatum) &&
                                    currentDatum !== null &&
                                    datasetPrecision !== null &&
                                    !currentlyDragging;
          var dateString;
          var unfilteredUnit;
          var filteredUnit;

          if (shouldDisplayFlyout) {

            dateString = currentDatum.hasOwnProperty('label') ?
                           currentDatum.label :
                           moment(currentDatum.date).format(FLYOUT_DATE_FORMAT[datasetPrecision]);

            unfilteredUnit = (currentDatum.unfiltered === 1) ?
                             cachedRowDisplayUnit :
                             cachedRowDisplayUnit.pluralize();

            filteredUnit = (currentDatum.filtered === 1) ?
                           cachedRowDisplayUnit :
                           cachedRowDisplayUnit.pluralize();

            if (currentDatum.filtered !== currentDatum.unfiltered) {

              return [
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

              return [
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
        }

        /**********************************************************************
         *
         * renderIntervalFlyout
         *
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
          var dateString;
          var unfilteredUnit;
          var filteredUnit;

          if (shouldDisplayFlyout) {

            unfilteredUnit = (unfilteredTotal === 1) ?
                             cachedRowDisplayUnit :
                             cachedRowDisplayUnit.pluralize();

            filteredUnit = (filteredTotal === 1) ?
                           cachedRowDisplayUnit :
                           cachedRowDisplayUnit.pluralize();

            if (filteredTotal !== unfilteredTotal) {

              return [
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
              
              return [
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
        }


        /**********************************************************************
         *
         * renderSelectionMarkerFlyout
         *
         */

        function renderSelectionMarkerFlyout(target) {
          if (mousePositionWithinChartDisplay && !currentlyDragging) {
            return '<div class="flyout-title">Drag to change filter range</div>';
          }
        }


        /**********************************************************************
         *
         * renderClearSelectionMarkerFlyout
         *
         */

        function renderClearSelectionMarkerFlyout(target) {
          if (mousePositionWithinChartLabels) {
            return '<div class="flyout-title">Clear filter range</div>';
          }
        }


        /**********************************************************************
         *
         * formatSelectionRangeLabel
         *
         */

        function formatSelectionRangeLabel(startDate, endDate) {

          function numberOfMonthsDifferent(date1, date2) {
            var months;
            months = (date2.getFullYear() - date1.getFullYear()) * 12;
            months -= date1.getMonth() + 1;
            months += date2.getMonth();
            return months <= 0 ? 0 : months;
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

          var adjustedEndDate = DateHelpers.decrementDateByInterval(endDate, datasetPrecision);
          var difference;
          var dateFormatPrecision;
          var showRange = true;
          var formattedStartDate;
          var formattedEndDate;
          var label;


          switch (labelPrecision) {

            case 'DECADE':
              difference = endDate.getFullYear() - startDate.getFullYear();
              if (difference < 10) {
                dateFormatPrecision = 'YEAR';
              } else if (difference === 10) {
                showRange = false;
              }
              break;

            case 'YEAR':
              difference = numberOfMonthsDifferent(startDate, endDate);
              if (difference < 11) {
                dateFormatPrecision = 'MONTH';
              } else if (difference === 11) {
                showRange = false;
              }
              break;

            case 'MONTH':
              if (datesAreExactlyOneMonthDifferent(startDate, endDate)) {
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


        /**********************************************************************
         *
         * formatDateLabel
         *
         * Converts a date and a unit into a string representation
         * appropriate for display in a flyout.
         *
         */

        function formatDateLabel(labelDate, forFlyout, overriddenLabelPrecision) {

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

          switch (labelPrecisionToUse) {

            case 'DECADE':
              return String(labelDate.getFullYear()).substring(0, 3) + '0s';

            case 'YEAR':
              return labelDate.getFullYear();

            case 'MONTH':
              if (forFlyout) {
                return FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {
                return SHORT_MONTH_NAMES[labelDate.getMonth()] +
                  ' ’' + (labelDate.getFullYear() % 100);
              }

            case 'DAY':
              if (forFlyout) {
                return labelDate.getDate() + ' ' + FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {

                return labelDate.getDate() + ' ' + SHORT_MONTH_NAMES[labelDate.getMonth()];
              }

            default:
              throw new Error('Cannot format date label for unrecognized unit "' + unit + '".');

          }

        }


        /**********************************************************************
         *
         * enterDraggingState
         *
         */

        function enterDraggingState() {
          currentlyDragging = true;
          selectionActive = false;
          hideDatumLabel();
          jqueryChartElement.find('.timeline-chart-filtered-mask').hide();
          jqueryBodyElement.addClass('prevent-user-select');
          jqueryChartElement.removeClass('selected').addClass('selecting');
        }


        /**********************************************************************
         *
         * enterSelectedState
         *
         */

        function enterSelectedState() {
          currentlyDragging = false;
          selectionActive = true;
          hideDatumLabel();
          renderChartFilteredValues();
          jqueryChartElement.find('.timeline-chart-filtered-mask').show();
          jqueryBodyElement.removeClass('prevent-user-select');
          jqueryChartElement.removeClass('selecting').addClass('selected');
        }


        /**********************************************************************
         *
         * enterDefaultState
         *
         */

        function enterDefaultState() {
          currentlyDragging = false;
          selectionActive = false;
          clearChartSelection();
          hideDatumLabel();
          renderChartFilteredValues();
          jqueryBodyElement.removeClass('prevent-user-select');
          jqueryChartElement.removeClass('selecting').removeClass('selected');
        }


        /**********************************************************************
         *
         * filterChartByCurrentSelection
         *
         */

        function filterChartByCurrentSelection() {
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


        /**********************************************************************
         *
         * clearChartFilter
         *
         */

        function clearChartFilter() {
          scope.$emit('filter-timeline-chart', null);
        }


        /**********************************************************************
         *
         * getDatumByDate
         *
         * This is used to get a datum by date.
         *
         */

        function getDatumByDate(date) {

          var i;
          var chartData = cachedChartData;

          for (i = 0; i < chartData.values.length; i++) {
            if (chartData.values[i].date >= date) {
              break;
            }
          }

          return chartData.values[i];

        }


        /**********************************************************************
         *
         * setCurrentDatumByDate
         *
         * This is used to keep the flyout updated as you drag a selection marker.
         *
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


        /**********************************************************************
         *
         * getDateFromMousePosition
         *
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
          }

          return date;

        }


        /**********************************************************************
         *
         * calculateChartSelectionArea
         *
         */

        function calculateChartSelectionArea(offsetX, target) {

          var candidateSelectionStartDate = null;
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

            if (selectionStartedBeyondMaxDate) {

              selectionStartDate = getDateFromMousePosition(offsetX);
              candidateSelectionEndDate = selectionEndDate;

            } else {

              candidateSelectionEndDate = getDateFromMousePosition(offsetX + halfVisualizedDatumWidth);

            }

          } else {

            candidateSelectionEndDate = selectionEndDate;

          }

          if (candidateSelectionEndDate !== null && selectionStartDate !== null) {

            // Prevent null selections by auto-incrementing by a 'datasetPrecision' unit if
            // the calculated start and end dates are the same.
            if (candidateSelectionEndDate.getTime() === selectionStartDate.getTime()) {
              candidateSelectionEndDate = getDateFromMousePosition(offsetX + halfVisualizedDatumWidth + visualizedDatumWidth);
            }

            if (candidateSelectionEndDate < cachedChartData.minDate) {
              candidateSelectionEndDate = cachedChartData.minDate;
            }

            if (candidateSelectionEndDate > cachedChartData.maxDate) {
              candidateSelectionEndDate = cachedChartData.maxDate;
            }

            setCurrentDatumByDate(candidateSelectionEndDate);

            selectionEndDate = candidateSelectionEndDate;

          }

        }


        /**********************************************************************
         *
         * handleChartSelectionEvents
         *
         * Interprets clicking and dragging and applies the expected state
         * transitions before conditionally rendering the chart selection.
         *
         */

        function handleChartSelectionEvents(mouseStatus) {

          var offsetX;
          var candidateStartDate;

          // Fail early if the chart hasn't rendered itself at all yet.
          if (cachedChartDimensions === null || cachedChartOffsets === null) {
            return;
          }

          // Do not attempt to select the chart if we are clicking the 'clear selection' button.
          if (mouseStatus.position.target.className === 'timeline-chart-clear-selection-button') {
            return;
          }

          offsetX = mouseStatus.position.clientX - cachedChartOffsets.left + halfVisualizedDatumWidth;

          // Mouse down while not dragging (start selecting):
          if (mouseStatus.leftButtonPressed && !currentlyDragging) {

            selectionStartedBeyondMaxDate = false;

            if (mousePositionWithinChartLabels) {

              candidateStartDate = mouseStatus.position.target.getAttribute('data-start');
              if (candidateStartDate !== null) {
                selectionStartDate = new Date(candidateStartDate);
                selectionEndDate = new Date(mouseStatus.position.target.getAttribute('data-end'));
                enterDraggingState();
              }

            } else if (mousePositionWithinChartElement) {

              // The target markers on the left and right of the selection have a
              // 'data-selection-target' attribute value of 'left' and 'right',
              // respectively. Attempting to get that attribute on any other element
              // (e.g. the chart itself or, more specifically, the highlight target
              // that sits on top of it) will return null, which will be caught by
              // the default case and treated as a normal selection-start event.
              switch (mouseStatus.position.target.getAttribute('data-selection-target')) {
                case 'left':
                  selectionStartDate = selectionEndDate;
                  selectionEndDate = getDateFromMousePosition(offsetX);
                  break;
                case 'right':
                  break;
                default:

                  // If the mouse is inside the chart element and inside the chart display,
                  // then we can just do the drag selection as normal.
                  if (mousePositionWithinChartDisplay) {

                    selectionStartDate = getDateFromMousePosition(offsetX);
                    selectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

                  } else {

                    // If the mouse is inside the chart element but outside the chart display,
                    // then it must be in the left or right margin, in which case we want to
                    // anchor the min or max date to the chart's min or max date and make the
                    // selection 1 display unit wide.
                    if (offsetX < cachedChartDimensions.width / 2) {
                      selectionStartDate = cachedChartData.minDate;
                      selectionEndDate = moment(cachedChartData.minDate).add(1, datasetPrecision).toDate();
                    } else {
                      selectionStartedBeyondMaxDate = true;
                      selectionStartDate = moment(cachedChartData.maxDate).subtract(1, datasetPrecision).toDate();
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

            enterSelectedState();

            filterChartByCurrentSelection();

          }

        }

        function handleChartMouseleaveEvent(e) {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
        }


        function handleClearSelectionLabelMousedownEvent(e) {
          clearChartFilter();
          enterDefaultState();
        }


        function hideDatumLabel() {
          jqueryDatumLabel.hide();
          jqueryChartElement.removeClass('dimmed');
        }


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


        //
        // Highlight the chart in different contexts
        //


        function highlightChartByMouseOffset(offsetX, target) {

          var highlightData;

          if (mousePositionWithinChartDisplay || mousePositionWithinChartLabels) {

            highlightData = filterChartDataByOffset(offsetX);

            renderChartHighlight(
              highlightData
            );

            hideDatumLabel();

          }

        }


        function highlightChartWithHiddenLabelsByMouseOffset(offsetX, target) {

          var indexIntoChartData;
          var halfLabelWidth = 50;
          var startDate;
          var endDate;


          indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) * cachedChartData.values.length)

          // Note that currentDatum is a global variable that is set when the user hovers over the visualization.
          // The value of currentDatum is read by the flyout code.
          currentDatum = cachedChartData.values[indexIntoChartData];

          startDate = currentDatum.date;
          endDate = moment(currentDatum.date).add(1, datasetPrecision).toDate();

          if (!allChartLabelsShown) {

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
                left: Math.floor(d3XScale(startDate)) - halfLabelWidth
              }).show();

          } else {

            hideDatumLabel();

          }

          highlightChart(startDate, endDate);

          // This is left here as a reminder that we need to come up with some way to
          // trigger flyouts on something other than the explicit mousemove event target.
          //fireMouseMoveEventOnHighlightTarget(mousePosition.clientX, mousePosition.clientY);

        }


        function highlightChartByInterval(target) {

          var startDate;
          var endDate;

          startDate = new Date(target.getAttribute('data-start'));
          endDate = new Date(target.getAttribute('data-end'));

          hideDatumLabel();

          // FACTOR THIS OUT, SEE ALSO filterChartDataByOffset()'S USE
          currentDatum = {
            unfiltered: target.getAttribute('data-aggregate-unfiltered'),
            filtered: target.getAttribute('data-aggregate-filtered'),
            label: target.getAttribute('data-flyout-label')
          };

          highlightChart(startDate, endDate);

          // This is left here as a reminder that we need to come up with some way to
          // trigger flyouts on something other than the explicit mousemove event target.
          //fireMouseMoveEventOnHighlightTarget(mousePosition.clientX, mousePosition.clientY);

        }


        function isMouseWithinChartDisplay(offsetX, offsetY) {

          return offsetX > 0 &&
                 offsetX <= cachedChartDimensions.width &&
                 offsetY > 0 &&
                 offsetY <= cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM'];

        }


        function isMouseWithinChartLabels(offsetX, offsetY) {

          return offsetX > 0 &&
                 offsetX <= cachedChartDimensions.width &&
                 offsetY > cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM'] &&
                 offsetY <= cachedChartDimensions.height;

        }


        function isMouseOverChartElement(target) {

          var closestChart = $(target).closest('.timeline-chart');

          return closestChart.length > 0 && closestChart[0] == element[0];

        }


        function fireMouseMoveEventOnHighlightTarget(clientX, clientY) {

          // Trigger mouseover event on the thing that will draw the flyout
          // rather than the thing that's actually catching the mousemove.
          var evt = document.createEvent('HTMLEvents');
          evt.initEvent('mousemove', true, true);
          evt.clientX = clientX;
          evt.clientY = clientY;
          jqueryChartElement.find('.timeline-chart-highlight-target')[0].dispatchEvent(evt);

        }


        //
        // Update the chart's selection when clicking and dragging.
        //


        // BUG: This does not update the mouse target if you click but don't move the mouse, and that click
        // causes a different element to fall under the pointer for the second click (clicking to dismiss, for example)
        mouseLeftButtonChangesSubscription = WindowState.mouseLeftButtonPressedSubject.flatMap(
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


        mouseMoveOrLeftButtonChangesSubscription = Rx.Observable.subscribeLatest(
          WindowState.mousePositionSubject,
          WindowState.scrollPositionSubject,
          WindowState.mouseLeftButtonPressedSubject,
          function(mousePosition, scrollPosition, mouseLeftButtonNowPressed) {

            var offsetX;
            var offsetY;
            var mouseIsOverChartElement;
            var startDate;
            var endDate;
            var sortedStartAndEndDates;


            // Fail early if the chart hasn't rendered itself at all yet.
            if (cachedChartDimensions === null || cachedChartOffsets === null) {
              return;
            }

            offsetX = mousePosition.clientX - cachedChartOffsets.left;
            offsetY = mousePosition.clientY + scrollPosition - cachedChartOffsets.top;
            mouseIsOverChartElement = isMouseOverChartElement(mousePosition.target);
            mousePositionWithinChartElement = mouseIsOverChartElement;

            // First figure out which region (display, labels, outside) of the
            // visualization the mouse is currently over and cache the result
            // for this and other functions to use.
            if (isMouseWithinChartDisplay(offsetX, offsetY) && mouseIsOverChartElement) {

              mousePositionWithinChartDisplay = true;
              mousePositionWithinChartLabels = false;

            } else if (isMouseWithinChartLabels(offsetX, offsetY) && mouseIsOverChartElement) {

              mousePositionWithinChartDisplay = false;
              mousePositionWithinChartLabels = true;

            } else {

              mousePositionWithinChartDisplay = false;
              mousePositionWithinChartLabels = false;

            }

            // If we are currently dragging, then we need to update and
            // re-render the selected area.
            if (currentlyDragging) {

              calculateChartSelectionArea(offsetX, mousePosition.target);

              renderChartSelection();

            // Otherwise we need to update and render an appropriate highlight
            // (by mouse position if the mouse is within the display or by interval
            // if the mouse is over the chart labels).
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
                if ($(mousePosition.target).attr('class').match('clear-selection') !== null) {

                  clearChartHighlight();
                  hideDatumLabel();

                // Otherwise, render a highlight over the interval indicated by the label
                // that is currently under the mouse.
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
        // Dispose of WindowState windowStateSubscriptions, flyout registrations and event handlers
        // when the directive is destroyed.
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
            var timestamp = _.now();
            scope.$emit('render:start', { source: 'timelineChart_{0}'.format(scope.$id), timestamp: _.now() });

            if (chartData.aggregation.aggregation !== cachedAggregation.aggregation || chartData.aggregation.field !== cachedAggregation.field) {
              clearChartSelection();
            }
            cachedAggregation = chartData.aggregation;

            // Only update the chartOffset sequence if we have done a full re-render.
            // This is used by renderHighlightedChartSegment but that function will
            // potentially fire many times per second so we want to cache this value
            // instead of listening to it directly.
            // NOTE THAT THIS IS ABSOLUTE OFFSET, NOT SCROLL OFFSET.
            cachedChartOffsets = element.offset();

            // Cache the datum width and half the datum width for use elsewhere instead of
            // repeated recomputation.
            visualizedDatumWidth = Math.floor(chartDimensions.width / (chartData.values.length - 1));
            halfVisualizedDatumWidth = Math.floor(visualizedDatumWidth / 2);

            // Update the cached value for dataset precision.
            // This is global to the directive, but only updated here.
            datasetPrecision = precision;

            // Cache the row display unit for use in the flyout (which necessarily
            // is handled outside the scope of this subscribeLatest and which probably
            // shouldn't be wrapped in its own subscribeLatest or other combinator).
            cachedRowDisplayUnit = rowDisplayUnit;

            cachedChartDimensions = chartDimensions;
            cachedChartData = chartData;

            renderChart(chartData, chartDimensions, precision);

            // Make sure we also re-render the chart selection if it is visible
            // (such as in the case of a visualization re-render triggered by
            // the window being resized).
            if (selectionActive) {
              renderedSelectionStartDate = null;
              renderedSelectionEndDate = null;
              renderChartSelection();
            }

            // Yield execution to the browser to render, then notify that render is complete
            $timeout(function() {
              scope.$emit('render:complete', { source: 'timelineChart_{0}'.format(scope.$id), timestamp: _.now() });
            });

          });

        // React to the activeFilters being cleared when a selection is active
        Rx.Observable.subscribeLatest(
          scope.observe('activeFilters'),
          function(activeFilters) {
            if (selectionActive && _.isEmpty(activeFilters)) {
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
