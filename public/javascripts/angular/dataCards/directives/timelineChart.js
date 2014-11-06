(function() {
  'use strict';

  /*

  KNOWN BUGS

  1. Dragging the mouse over the chart display when the '.timeline-chart-highlight-target' has not
     caught up with it (thus making the mouse move evnet's target something other than the highlight
     target) will cause no highlight to occur. That is because we're explicitly whitelisting against
     the target in the mouse move and mouse down handling code.

  2. The heuristic by which we decide when to display only some labels is pretty fucked up.

  3. We limit displaying non-visible labels to the 'DAY' && 'DAY' case when really we need to
     just do it whenever we're not displaying some labels.

  */

  var FLYOUT_DATE_FORMAT = {
    DAY: 'D MMMM YYYY',
    MONTH: 'MMMM YYYY',
    YEAR: 'YYYY',
    DECADE: 'YYYYs'
  };

  var TICK_DATE_FORMAT = {
    DAY: 'D MMM',
    MONTH: 'MMM \'YY',
    YEAR: 'YYYY',
    DECADE: 'YYYY[s]'
  };


  // This is needed because offset percentages, it turns out, are not entirely accurate
  // with regard to positioning elements as to where d3 believes them to be. This value,
  // subtracted from a calcualted offset (cursor pixel location / width of chart in pixels)
  // will result in the correct region being highlighted and the correct date range being
  // chosen when a pixel location is run back through the inverse of d3XScale.
  var EPSILON = 0.0005;

  function timelineChartDirective($timeout, AngularRxExtensions, WindowState, FlyoutService, Constants) {

    return {
      templateUrl: '/angular_templates/dataCards/timelineChart.html',
      restrict: 'A',
      scope: {
        chartData: '=',
        expanded: '=',
        precision: '=',
        rowDisplayUnit: '=',
        activeFilters: '=',
        pageIsFiltered: '='
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
        var jqueryClearSelectionButton = element.find('.timeline-chart-clear-selection-button');

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
        var mousePositionWithinChartDisplay = false;
        var mousePositionWithinChartLabels = true;

        var visualizedDatumWidth = 0;
        var halfVisualizedDatumWidth = 0;

        var valueAndPositionOnClickObservable;

        var selectionActive = false;
        var setDateOnMouseUp = false;


        // Keep track of the start and end of the selection.
        var selectionStartDate = null;
        var selectionEndDate = null;


        var displayedLabelDates = [];
        var allChartLabelsShown = true;


        var windowStateSubscription;
        var windowStateSubscriptions = [];

        // Dispose of WindowState windowStateSubscriptions when the directive is destroyed.
        scope.$on('$destroy', function() {
          _.forEach(windowStateSubscriptions, function(windowStateSubscription) {
            windowStateSubscription.dispose();
          });
        });

        /**********************************************************************
         *
         * transformChartDataForStackedRendering
         *
         */

        function transformChartDataForStackedRendering(chartData, pageIsFiltered) {

          var varNames;
          var seriesStack = [];
          var series = {};

          //
          // Determine which layers will appear in the stacked area
          // chart based on the properties of each datum, keyed off
          // of 'date'. Each layer is a 'series' in the stack.
          //
          varNames = d3.
            keys(chartData.values[0]).
              filter(function (key) { return key !== 'date'; }).
              filter(function (key) { return pageIsFiltered || (!pageIsFiltered && key !== 'filtered'); });

          varNames.forEach(function (name) {
            series[name] = { name: name, values:[] };
            seriesStack.push(series[name]);
          });

          chartData.values.forEach(function (d) {
            varNames.forEach(function (name) {
              if (pageIsFiltered) {
                series[name].values.push({
                  label: d['date'],
                  value: (name === 'unfiltered') ? (d['unfiltered'] - d['filtered']) : d['filtered']
                });
              } else {
                series[name].values.push({
                  label: d['date'],
                  value: d['unfiltered']
                });
              }
            });
          });

          return seriesStack;

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

        function filterChartDataByOffset(chartData, offsetX, dimensions) {

          // This helper function creates the correct array of highlightData values
          // to be passed on to the renderChartHighlight function based on the position
          // of the mouse cursor, the index into the chart data, the half-width of a
          // single datum as drawn to the chart and the maximum value in the dataset.
          function generateHighlightData(chartData, index, cursorInRightHalfOfHighlight, halfIntervalDuration, maxValue) {

            var startDate;
            var endDate;
            var timeAtIndex;

            if (cursorInRightHalfOfHighlight) {

              startDate = new Date(chartData.values[index - 1].date.getTime() - halfIntervalDuration);
              endDate = new Date(chartData.values[index].date.getTime() - halfIntervalDuration);

            } else {

              timeAtIndex = chartData.values[index].date.getTime();

              if (index === chartData.values.length - 1) {

                startDate = new Date(timeAtIndex - halfIntervalDuration);
                endDate = new Date(timeAtIndex + halfIntervalDuration);

              } else {

                startDate = new Date(timeAtIndex - halfIntervalDuration);
                endDate = new Date(chartData.values[index + 1].date.getTime() - halfIntervalDuration);

              }

            }

            return [
              { date: startDate, unfiltered: maxValue, filtered: maxValue },
              { date: endDate, unfiltered: maxValue, filtered: maxValue }
            ];

          }

          var offset = (offsetX / dimensions.width) - EPSILON;
          var i;
          var halfIntervalDuration = Math.floor((chartData.values[1].date.getTime() - chartData.values[0].date.getTime()) / 2);
          var cursorInRightHalfOfHighlight;
          var highlightData;
          var leftOffset;
          var highlightWidth;
          var maxValue = chartData.maxValue;


          if (d3XScale === null || d3YScale === null) {
            return;
          }

          // Find the datum that we are currently pointing at
          // by checking the mouse x-offset as a percentage of
          // chart width against each datum's start offset as a
          // percentage in the range [minValue .. maxValue].
          // When we encounter the first datum with a higher
          // position in that range we break, preserving its
          // index into the dataset as the last value of i.
          for (i = 0; i < chartData.offsets.length; i++) {
            if (chartData.offsets[i] >= offset) {
              break;
            }
          }

          cursorInRightHalfOfHighlight = (
            Math.abs(offset - chartData.offsets[i - 1]) <
            Math.abs(offset - chartData.offsets[i])
          );

          highlightData = generateHighlightData(
            chartData,
            i,
            cursorInRightHalfOfHighlight,
            halfIntervalDuration,
            maxValue
          );

          // The cursor is in the right half of the area that should be highlighted, so decrement
          // it to correctly highlight the left-hand slice, not the right-hand one.
          if (cursorInRightHalfOfHighlight) {
            i--;
          }

          currentDatum = chartData.values[i];
          leftOffset = Math.floor((chartData.offsets[i] * dimensions.width) - halfVisualizedDatumWidth);

          return {
            data: highlightData,
            left: leftOffset,
            width: visualizedDatumWidth,
            maxValue: chartData.maxValue
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

        function filterChartDataByInterval(chartData, offsetX, dimensions, startDate, endDate) {

          var highlightData
          var i;
          var startOffsetIndex = 0;
          var endOffsetIndex = 1;
          var dateInterval = chartData.values[1].date.getTime() - chartData.values[0].date.getTime();
          var halfDateInterval = Math.floor(dateInterval / 2);
          var unadjustedStartDate;
          var unadjustedEndDate;
          var dataAggregate;
          var unfilteredAggregate;
          var filteredAggregate;
          var maxValue = chartData.maxValue;
          var width;
          var leftOffset;


          for (i = 0; i < chartData.values.length; i++) {
            if (chartData.values[i].date.getTime() === startDate.getTime()) {
              startOffsetIndex = i;
            }
            if (chartData.values[i].date.getTime() === endDate.getTime()) {
              endOffsetIndex = i;
            }
          }

          unadjustedStartDate = chartData.values[startOffsetIndex].date;

          if (startOffsetIndex === chartData.values.length - 1) {

            unadjustedEndDate = new Date(
              chartData.values[startOffsetIndex].date.getTime() +
              dateInterval
            );

          } else {

            unadjustedEndDate = chartData.values[endOffsetIndex].date;

          }

          highlightData = [
            {
              date: unadjustedStartDate,
              unfiltered: maxValue,
              filtered: maxValue
            },
            {
              date: unadjustedEndDate,
              unfiltered: maxValue,
              filtered: maxValue
            }
          ];

          // This is wrapped in a Math.abs() because sometimes the endOffsetIndex is 1
          // and the startOffsetIndex is 2 (I don't even...).
          width = Math.abs(endOffsetIndex - startOffsetIndex) * visualizedDatumWidth;

          leftOffset = Math.floor(chartData.offsets[startOffsetIndex] * dimensions.width);

          /*if (startOffsetIndex === chartData.values.length - 1) {
            leftOffset = Math.floor(dimensions.width - (width / 2));
          }*/

          return {
            data: highlightData,
            left: leftOffset,
            width: width,
            maxValue: chartData.maxValue
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

        function renderChartHighlight(highlightData, dimensions) {

          var area;
          var svgChart;
          var selection;


          if (d3XScale === null || d3YScale === null) {
            return;
          }

          jqueryHighlightTargetElement.css({
            left: highlightData.left - Constants['TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN'],
            width: highlightData.width + (Constants['TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN'] * 2),
            height: dimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
          });

          area = d3.
            svg.
              area().
                x(function(d) { return d3XScale(d.date); }).
                y0(dimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
                y1(function(d) { return d3YScale(d.unfiltered); });

          d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              select('g').
                remove();

          selection = d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              attr('width', highlightData.width).
              attr('height', dimensions.height).
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
          var selectionWidth;
          var selectionStartPosition;
          var selectionEndPosition;
          var labelWidth;
          var minLabelWidth;
          var labelNegativeXOffset;
          var dateRangeLabel;

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

            stack = d3.
              layout.
                stack().
                  offset('zero').
                  values(function (d) { return d.values; }).
                    x(function (d) { return d3XScale(d.label); }).
                    y(function (d) { return d.value; });

            area = d3.
              svg.
                area().
                  x(function (d) { return d3XScale(d.label); }).
                  y0(function (d) { return d3YScale(d.y0); }).
                  y1(function (d) { return d3YScale(d.y0 + d.y); });

            seriesStack = transformChartDataForStackedRendering(cachedChartData, false);

            seriesStack = seriesStack.map(function(series) {
              series.values = series.values.filter(function(datum) {
                return datum.label >= minDate && datum.label <= maxDate;
              });
              return series;
            });

            stack(seriesStack);

            svgChart = d3ChartElement.
              select('svg.timeline-chart-selection').
                attr('width', cachedChartDimensions.width + Constants['TIMELINE_CHART_MARGIN_LEFT'] + Constants['TIMELINE_CHART_MARGIN_RIGHT']).
                attr('height', cachedChartDimensions.height + Constants['TIMELINE_CHART_MARGIN_TOP'] + Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
                select('g').
                  attr('transform', 'translate(' + Constants['TIMELINE_CHART_MARGIN_LEFT'] + ',' + Constants['TIMELINE_CHART_MARGIN_TOP'] + ')');

            selection = svgChart.
              selectAll('.series').
                data(seriesStack); 
            
            selection.
              enter().
                append('g').
                  attr('class', 'series').
                  append('path');

            selection.
              exit().
                remove();

            selection.
              select('path').
                attr('class', 'selection').
                attr('d', function (d) { return area(d.values); });

            selectionWidth = Math.floor(d3XScale(maxDate) - d3XScale(minDate));

            selectionStartPosition = Math.floor(d3XScale(minDate));
            selectionEndPosition = selectionStartPosition + selectionWidth;

            jqueryLeftSelectionMarker.
              css({
                left: selectionStartPosition - Constants['TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET'],
                height: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              });

            jqueryRightSelectionMarker.
              css({
                left: selectionEndPosition - Constants['TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET'],
                height: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              });

            labelWidth = selectionWidth;
            minLabelWidth = 150;
            labelNegativeXOffset = 0;

            if (labelWidth < minLabelWidth) {
              labelNegativeXOffset = (minLabelWidth - labelWidth) / 2;
              labelWidth = minLabelWidth;
            }

            dateRangeLabel = formatSelectionRangeLabel(minDate, maxDate);

            jqueryClearSelectionButton.
              text(dateRangeLabel).
              css({
                left: selectionStartPosition - labelNegativeXOffset,
                width: labelWidth,
                height: Constants['TIMELINE_CHART_MARGIN_BOTTOM'],
                top: cachedChartDimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
              });

          }

        }


        /**********************************************************************
         *
         * clearChartSelection
         *
         */

        function clearChartSelection() {
          selectionStartDate = null;
          selectionEndDate = null;
          jqueryChartSelectionElement.find('g > g').remove();
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


          function deriveXAxisLabelDatumStep(labelData) {

            var widthOfEachLabel = cachedChartDimensions.width / labelData.length;

            if (widthOfEachLabel >= 50) {
              allChartLabelsShown = true;
              return 1;
            } else if ((widthOfEachLabel * 2) >= 50) {
              allChartLabelsShown = false;
              return 2;
            } else if ((widthOfEachLabel * 3) >= 50) {
              allChartLabelsShown = false;
              return 3;
            } else if ((widthOfEachLabel * 5) >= 50) {
              allChartLabelsShown = false;
              return 5;
            } else {
              allChartLabelsShown = false;
              return 7;
            }

          }


          var tickDates;
          var tickInterval;
          var labelData = [];
          var i;
          var j;
          var jqueryAxisContainer;
          var labelDatumStep;
          var cumulativeLabelOffsets;
          var halfTickWidth = 2; // Half the width of the visualized x-axis tick (in pixels)
          var shouldDrawLabel;
          var jqueryAxisTick;
          var labelStartDate;
          var labelEndDate;
          var labelIntervalStartDate;
          var labelIntervalEndDate;
          var labelWidth;
          var labelOffset;
          var jqueryAxisTickLabel;
          var dataAggregate;
          var unfilteredAggregate;
          var filteredAggregate;


          labelPrecision = deriveXAxislabelPrecision();

          // THIS MAY NEED UPDATES BECAUSE OF THINGS LIKE LEAP-YEARS

          // Since moment doesn't natively support decades as a unit, we
          // pass it a unit of 'year' and a value of 10 instead.
          if (labelPrecision === 'DECADE') {

            // Ticks at the decade scale seem to get a little messed up by d3, so we
            // need to book-end them with the min and max dates from the underlying
            // chart data in order for labels to work consistently across all intervals.
            tickDates = [chartData.values[0].date].
                          concat(d3XScale.ticks(d3.time.year, 10)).
                          concat([chartData.values[chartData.values.length - 1].date]);
            tickInterval = moment.duration(10, 'year').asMilliseconds(); // MAYBE DONT DECOMPOSE TO MS HERE

          // ...otherwise just use a unit that moment recognizes.
          } else {

            // Ticks at other scales, meanwhile, work 'correctly' if we only book-end them
            // with the max date from the underlying dataset. This is, at the moment, pretty
            // cargo-cultish but my priorities lie elsewhere.
            tickDates = d3XScale.ticks(d3.time[labelPrecision.toLowerCase()], 1).
                          concat([chartData.values[chartData.values.length - 1].date]);
            tickInterval = moment.duration(1, labelPrecision).asMilliseconds();

          }

          // For each tickDate, find the first datum in chartData that's that date.
          // Since tickDate and chartData are both ordered, keep a pointer into chartData, and
          // pick up where we left off, when searching for the next tickDate.
          i = 0;
          for (j = 0; j < tickDates.length; j++) {
            for (i; i < chartData.values.length; i++) {
              if (moment(chartData.values[i].date).isSame(tickDates[j], labelPrecision)) {
                labelData.push({ datum: chartData.values[i], offset: Math.floor(d3XScale(chartData.values[i].date)) });
                break;
              }
            }
          }

          // Set up the container for the x-axis ticks.
          jqueryAxisContainer = $('<div>').
            addClass('x-ticks').
            css({
              width: chartWidth,
              height: Constants['TIMELINE_CHART_MARGIN_BOTTOM']
            });

          labelDatumStep = deriveXAxisLabelDatumStep(labelData);

          cumulativeLabelOffsets = 0;
          displayedLabelDates = [];

          for (i = 1; i < labelData.length; i++) {

            // Do not append a tick for the last item,
            // but keep it in the iteration so that we
            // can label the gap between the last tick
            // and the edge of the chart as necessary.
            if (i > 0 && i < labelData.length - 1) {

              jqueryAxisTick = $('<rect>').
                addClass('x-tick').
                css({
                  left: Math.floor(labelData[i].offset - halfTickWidth)
                });

              jqueryAxisContainer.append(jqueryAxisTick);

            }

            shouldDrawLabel = labelDatumStep === 1 || i % labelDatumStep === 0;

            if (shouldDrawLabel) {

              labelStartDate = labelData[i - 1].datum.date;
              labelEndDate = labelData[i].datum.date;

              if (labelStartDate.getTime() === labelEndDate.getTime()) {
                labelEndDate = new Date(labelEndDate.getTime() + tickInterval);
              }

              // The label's width should be the span between the previous
              // and the current 'offset' into the width of the chart.
              labelWidth = (labelData[i].offset - labelData[i - 1].offset);

              // Handle special case for x-axes where some labels are hidden
              if (labelDatumStep > 1) {

                labelWidth *= labelDatumStep;
                labelStartDate = moment(labelStartDate).subtract(Math.floor(labelDatumStep / 2), datasetPrecision).toDate();

                displayedLabelDates.push(labelStartDate.toISOString());

                labelIntervalStartDate = labelStartDate;
                labelIntervalEndDate = moment(labelStartDate).add(1, labelPrecision).toDate();

              } else {

                labelIntervalStartDate = labelStartDate;
                labelIntervalEndDate = labelEndDate;

              }

              if (i === labelData.length - 1) {
                // In the case of the final label, just consume all remaining
                // space instead. This is so the last label fits snugly in the
                // variable amount of space available to it.
                labelWidth = chartWidth - cumulativeLabelOffsets;
              }

              if ((cachedChartDimensions.width - cumulativeLabelOffsets) >= 50) {

                labelOffset = cumulativeLabelOffsets;

                // Calculate the data aggregates for this interval so we can
                // stash them as data-attributes and not need to recalculate
                // them whenever the mouse moves over this label.
                dataAggregate = chartData.values.
                  filter(function(datum) {
                    return datum.date.getTime() >= labelStartDate.getTime() &&
                           datum.date.getTime() < labelEndDate.getTime();
                  });

                unfilteredAggregate = dataAggregate.
                  reduce(function(acc, datum) {
                    return acc + datum.unfiltered;
                  }, 0);

                filteredAggregate = dataAggregate.
                  reduce(function(acc, datum) {
                    return acc + datum.filtered;
                  }, 0);

                // Finally, add the label to the x-axis container.
                jqueryAxisTickLabel = $('<span>').
                  addClass('x-tick-label').
                  attr('data-start', labelIntervalStartDate).
                  attr('data-median', labelStartDate).
                  attr('data-end', labelIntervalEndDate).
                  attr('data-aggregate-unfiltered', unfilteredAggregate).
                  attr('data-aggregate-filtered', filteredAggregate).
                  attr('data-flyout-label', formatDateLabel(labelStartDate, true)).
                  text(formatDateLabel(labelStartDate, false)).
                  css({
                    width: Math.floor(labelWidth),
                    left: Math.floor(labelOffset)
                  });

                jqueryAxisContainer.append(jqueryAxisTickLabel);

              }

              cumulativeLabelOffsets += labelWidth;

            }

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

        function renderChartYAxis(jqueryChartElement, chartWidth, chartHeight, d3YScale, labels) {

          var jqueryAxisContainer;
          var ticks;


          jqueryAxisContainer = $('<div>').
            addClass('y-ticks').
            css({
              width: chartWidth,
              height: chartHeight
            });

          // Because we have already set the domain for the d3YScale, it will return
          // funny values which we need to then map back into the [0 .. 1] range.
          // Because we need to know the max tick value, THIS NEEDS TO HAPPEN ON
          // TWO SEPARATE LINES rather than by composing the .ticks() and .map()
          // functions below.
          ticks = d3YScale.ticks(labels.length);

          ticks = ticks.map(function(tick) {
            return tick / ticks[ticks.length - 1];
          });

          if (ticks.length !== 3) {
            ticks = [ticks[0], ticks[Math.floor((ticks.length - 1) / 2)], ticks[ticks.length - 1]]
          }

          _.each(ticks, function(tick, index) {

            jqueryAxisContainer.append(
              $('<div>').
                addClass('y-tick').
                css('bottom', Math.floor(chartHeight * tick)).
                text($.toHumaneNumber(labels[index])));
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

        function renderChart(chartData, dimensions, precision, pageIsFiltered) {

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
                domain([chartData.minDate, chartData.maxDate]).
                range([0, chartWidth]);

          // d3YScale is global to the directive so that we can
          // access it without having to re-render.
          d3YScale = d3.
            scale.
              linear().
                domain([0, chartData.maxValue]).
                range([chartHeight, 0]).
                clamp(true); // Is this necessary?!


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
            d3YScale,
            // Because of a peculiarity with the way stacked area charts work in d3
            // (I think), the y scale extends to 2x the maximum value found in the
            // data set. However, we really only want to represent values from the minimum
            // to the maximum found in the data set, so we use those values for the tick
            // labels as the last argument to renderChartYAxisTicks instead of what d3 chooses
            // to provide for us.        
            [
              Math.round(chartData.minValue),
              Math.round(chartData.meanValue),
              Math.round(chartData.maxValue)
            ]);


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

          values = [cachedChartData.values];

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
            values = [cachedChartData.values.filter(function(datum) {
              return datum.date >= selectionStartDate && datum.date <= selectionEndDate;
            })];
          } else {
            values = [cachedChartData.values];
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

          var shouldDisplayFlyout = _.isDefined(currentDatum) &&
                                    currentDatum !== null &&
                                    datasetPrecision !== null;
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
                       currentDatum.unfiltered,
                       unfilteredUnit,
                       currentDatum.filtered,
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
                     format(dateString, currentDatum.unfiltered, unfilteredUnit);
            }
          }
        }


        function formatSelectionRangeLabel(startDate, endDate) {
          switch (labelPrecision) {
            case 'DECADE':
            case 'YEAR':
            case 'MONTH':
              return formatDateLabel(startDate, false) + ' - ' + formatDateLabel(endDate, false) + ' ×';
            case 'DAY':
              if (startDate.getTime() !== endDate.getTime()) {
                return formatDateLabel(startDate, false) + ' - ' + formatDateLabel(endDate, false) + ' ×';
              } else {
                return formatDateLabel(startDate, false) + ' ×';
              }
          }
        }

        /**********************************************************************
         *
         * formatDateLabel
         *
         * Converts a date and a unit into a string representation
         * appropriate for display in a flyout.
         *
         */

        function formatDateLabel(labelDate, forFlyout) {

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

          switch (labelPrecision) {

            case 'DECADE':
              return String(labelDate.getFullYear()).substring(0, 3) + '0s';

            case 'YEAR':
              return labelDate.getFullYear();

            case 'MONTH':
              if (forFlyout) {
                return FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {
                return SHORT_MONTH_NAMES[labelDate.getMonth()] + ' ’' + labelDate.getYear();
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
          if (selectionStartDate instanceof Date && selectionEndDate instanceof Date) {
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

          offsetX = offsetX + halfVisualizedDatumWidth;

          if (mousePositionWithinChartLabels) {
            candidateSelectionEndDate = target.getAttribute('data-end');
            if (candidateSelectionEndDate === null) {
              return;
            }
            candidateSelectionEndDate = new Date(candidateSelectionEndDate);
            if (candidateSelectionEndDate <= selectionStartDate) {
              candidateSelectionEndDate = new Date(target.getAttribute('data-start'));
            }
          } else {
            candidateSelectionEndDate = getDateFromMousePosition(offsetX);
          }

          if (candidateSelectionEndDate !== null && selectionStartDate !== null) {

            // Prevent null selections by auto-incrementing by a 'datasetPrecision' unit if
            // the calculated start and end dates are the same.
            if (candidateSelectionEndDate.getTime() === selectionStartDate.getTime()) {
              candidateSelectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);
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
         * IMPORTANT NOTE:
         * In two places the mouse's x-offset needs to be increased by half the width
         * of an x-axis interval so that the selection boundaries visually match the
         * actual values.
         *
         * This is necessary because the highlight of a given data point falls half
         * on either side of where the point lies on the x-axis; as such it is possible
         * for it to appear that you are highlighting e.g. 1930 whereas the cursor's
         * position is actually half-way through 1929.
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

            if (mousePositionWithinChartLabels) {

              candidateStartDate = mouseStatus.position.target.getAttribute('data-start');
              if (candidateStartDate !== null) {
                selectionStartDate = new Date(candidateStartDate);
                selectionEndDate = new Date(mouseStatus.position.target.getAttribute('data-end'));
              }
              enterDraggingState();
            }

            if (mousePositionWithinChartDisplay) {

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
                  selectionStartDate = getDateFromMousePosition(offsetX);
                  selectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);
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


        function hideDatumLabel() {
          jqueryChartElement.find('.datum-label').hide();
          jqueryChartElement.removeClass('dimmed');
        }

        function isStartDateInDisplayedLabelDates(startDate) {
          return displayedLabelDates.indexOf(startDate.toISOString()) >= 0;
        }

        function shouldDimChartLabels(startDate) {
          return !(allChartLabelsShown || isStartDateInDisplayedLabelDates(startDate));
        }

        function shouldBoldChartLabel(startDate) {
          return isStartDateInDisplayedLabelDates(startDate);
        }



        function highlightChart(offsetX, startDate, endDate) {

          var highlightData;

          highlightData = filterChartDataByInterval(
            cachedChartData,
            offsetX,
            cachedChartDimensions,
            startDate,
            endDate
          );

          setCurrentDatumByDate(startDate);

          renderChartHighlight(
            highlightData,
            cachedChartDimensions
          );

        }


        // Highlight the chart in different contexts

        function highlightChartByMouseOffset(offsetX, target) {

          var highlightData;

          if (mousePositionWithinChartDisplay || mousePositionWithinChartLabels) {

            highlightData = filterChartDataByOffset(cachedChartData, offsetX, cachedChartDimensions);

            renderChartHighlight(
              highlightData,
              cachedChartDimensions
            );

            hideDatumLabel();

          }

        }

        function highlightChartWithHiddenLabelsByMouseOffset(offsetX, target) {

          var startDate;
          var endDate;
          var value;
          var halfLabelWidth = 50;
          var labels;

          startDate = getDateFromMousePosition(offsetX);
          endDate = moment(startDate).add(1, datasetPrecision).toDate();

          if (shouldDimChartLabels(startDate)) {

            value = getDatumByDate(startDate);

              if (_.isDefined(value)) {
              // dim all the existing labels
              // set the value of the datum label to the startDate
              // show the datum label
              jqueryChartElement.find('.datum-label').
                text(formatDateLabel(startDate, false)).
                attr('data-start', startDate).
                attr('data-end', endDate).
                attr('data-aggregate-unfiltered', value.unfiltered).
                attr('data-aggregate-filtered', value.filtered).
                attr('data-flyout-label', formatDateLabel(startDate, true)).
                css({
                  left: Math.floor(d3XScale(startDate)) - halfLabelWidth + halfVisualizedDatumWidth,
                }).show();
              jqueryChartElement.addClass('dimmed');

            }

            $('.x-tick-label').removeClass('emphasis');

          } else if (shouldBoldChartLabel(startDate)) {

            var i;

            labels = jqueryChartElement.find('.x-tick-label');

            for (i = 0; i < labels.length; i++) {
              if (startDate.toString() === labels[i].getAttribute('data-median')) {
                $(labels[i]).addClass('emphasis');
              }

            }

            hideDatumLabel();

          } else {

            hideDatumLabel();

            $('.x-tick-label').removeClass('emphasis');

          }

          highlightChart(offsetX, startDate, endDate);

          // This is left here as a reminder that we need to come up with some way to
          // trigger flyouts on something other than the explicit mousemove event target.
          //fireMouseMoveEventOnHighlightTarget(mousePosition.clientX, mousePosition.clientY);

        }

        function highlightChartByInterval(offsetX, target) {

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

          highlightChart(offsetX, startDate, endDate);

          // This is left here as a reminder that we need to come up with some way to
          // trigger flyouts on something other than the explicit mousemove event target.
          //fireMouseMoveEventOnHighlightTarget(mousePosition.clientX, mousePosition.clientY);

        }


        jqueryChartElement.on('mouseleave', function() {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
        });

        FlyoutService.register('timeline-chart-highlight-target', renderFlyout);
        FlyoutService.register('selection-marker', renderFlyout);

        FlyoutService.register('timeline-chart-clear-selection-button', function(target) {
          return '<div class="flyout-title">Clear filter range</div>';
        });

        jqueryClearSelectionButton.on('mousedown', function(e) {
          clearChartFilter();
          enterDefaultState();
        });



        //
        // Update the chart's selection when clicking and dragging.
        //

// BUG: This does not update the mouse target if you click but don't move the mouse, and that click
// causes a different element to fall under the pointer for the second click (clicking to dismiss, for example)

        windowStateSubscription = WindowState.mouseLeftButtonPressedSubject.flatMap(
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

        windowStateSubscriptions.push(windowStateSubscription);


        //
        // Render a chart highlight if the mouse is in an appropriate position:
        // a) over the chart iteself; or
        // b) over an x-axis label
        //

        windowStateSubscription = Rx.Observable.subscribeLatest(
          WindowState.mousePositionSubject,
          WindowState.scrollPositionSubject,
          WindowState.mouseLeftButtonPressedSubject,
          function(mousePosition, scrollPosition, mouseLeftButtonNowPressed) {

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
              return $(target).closest('.timeline-chart-wrapper').length > 0;
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

                    highlightChartByInterval(offsetX, mousePosition.target);

                  }

                }

              } else {

                jqueryChartElement.find('.x-tick-label').removeClass('emphasis');
                hideDatumLabel();

              }

            }

          }
        );

        windowStateSubscriptions.push(windowStateSubscription);

        //
        // Render the chart
        //

        Rx.Observable.subscribeLatest(
          element.closest('.card-visualization').observeDimensions(),
          scope.observe('chartData'),
          scope.observe('precision'),
          scope.observe('rowDisplayUnit'),
          scope.observe('pageIsFiltered'),
          function(chartDimensions, chartData, precision, rowDisplayUnit, pageIsFiltered) {

            if (!_.isDefined(chartData) || !_.isDefined(precision)) {
              return;
            }

            // Analytics start.
            var timestamp = _.now();
            scope.$emit('render:start', { source: 'timelineChart_{0}'.format(scope.$id), timestamp: _.now() });

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

            renderChart(chartData, chartDimensions, precision, pageIsFiltered);

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
  };

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();
