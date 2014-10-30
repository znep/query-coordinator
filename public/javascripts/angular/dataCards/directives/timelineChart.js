(function() {
  'use strict';

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
        showFiltered: '=',
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
        var d3ChartElement = d3.select(jqueryChartElement[0]);

        // The X and Y scales that d3 uses are global to the directive so
        // that we can use the same ones between the renderTimelineChart and
        // renderChartHighlight functions.
        // They are initialized to null so that we don't accidentally try
        // to render a highlight before a chart is rendered.
        var d3XScale = null;
        var d3YScale = null;

        // These two sequences track the page offset and dimensions of the visualization.
        // These properties are required by the rendering functions but are unnecessary
        // to recalcualte on every pass of renderChartHighlighted and regardless
        // can be expensive in terms of performance. Therefore, we only update the sequences
        // when necessary.
        var chartOffsetSubject = new Rx.Subject(); // This one is updated in renderTimelineChart.
        var chartDimensionsSubject = element.closest('.card-visualization').observeDimensions();

        // currentDatum is used to persist information about the highlighted region between
        // the filterChartData and flyout rendering functions.
        var currentDatum = null;

        // datasetPrecision is used only to correctly format dates for the flyout rendering
        // function, but we only really have a notion of it within the context of Rx reactions;
        // for this reason it's cached globally.
        var datasetPrecision = null;

        // Keep track of the row display unit so that the flyout can correctly format quantities.
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

        var visualizedDatumWidth = 0;
        var halfVisualizedDatumWidth = 0;

        var valueAndPositionOnClickObservable;
        var selectionStartDate = null;
        var selectionEndDate = null;
        var selectionActive = false;

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
              append('g').
                attr('transform', 'translate(0,-' + (dimensions.height + 2) + ')');

          selection.
            append('path').
              datum(highlightData.data).
              attr('class', 'timeline-chart-highlight').
              attr('d', area);

        }


        /**********************************************************************
         *
         * renderChartSelection
         *
         */

        function renderChartSelection(chartData, dimensions) {

          var minDate;
          var maxDate;
          var selectionData;
          var stack;
          var area;
          var seriesStack;
          var svgChart;
          var selection;

          switch (datasetPrecision) {
            case 'YEAR':
              var adjustmentQuantity = 6;
              var adjustmentPrecision = 'months';
              break;
            case 'MONTH':
              var adjustmentQuantity = 15;
              var adjustmentPrecision = 'days';
              break;
            case 'DAY':
              var adjustmentQuantity = 12;
              var adjustmentPrecision = 'hours';
              break;
            default:
              throw new Error('Cannot adjust date by unknown precision "' + datasetPrecision + '".');
          }

          if (selectionStartDate < selectionEndDate) {
            minDate = moment(selectionStartDate).subtract(1, datasetPrecision).toDate();;
            maxDate = selectionEndDate;
          } else {
            minDate = moment(selectionEndDate).subtract(1, datasetPrecision).toDate();
            maxDate = selectionStartDate;
          }

          if (d3XScale === null || d3YScale === null) {
            return;
          }

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

          //
          // Render the chart itself.
          //

          seriesStack = transformChartDataForStackedRendering(chartData, false);

          seriesStack.forEach(function(series) {
            series.values = series.values.filter(function(datum) {
              return datum.label >= minDate && datum.label <= maxDate;
            });
          });

          stack(seriesStack);

          svgChart = d3ChartElement.
            select('svg.timeline-chart-selection').
              attr('width', dimensions.width + Constants['TIMELINE_CHART_MARGIN_LEFT'] + Constants['TIMELINE_CHART_MARGIN_RIGHT']).
              attr('height', dimensions.height + Constants['TIMELINE_CHART_MARGIN_TOP'] + Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
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



          var labelWidth = Math.floor(d3XScale(maxDate) - d3XScale(minDate) - visualizedDatumWidth);
          var minLabelWidth = 100;
          var labelXOffset = 0;

          if (labelWidth < minLabelWidth) {
            labelXOffset = (minLabelWidth - labelWidth) / 2;
            labelWidth = minLabelWidth;
          }

          var dateRangeLabel = moment(moment(minDate).add(1, datasetPrecision)).toDate().getFullYear() + '-' + maxDate.getFullYear();

          element.
            find('.clear-chart-selection-label').
              text(dateRangeLabel);

          element.
            find('.clear-chart-selection-button').
            css({
              left: Math.floor(d3XScale(minDate) + visualizedDatumWidth - labelXOffset),
              width: labelWidth,
              height: Constants['TIMELINE_CHART_MARGIN_BOTTOM'],
              top: dimensions.height - Constants['TIMELINE_CHART_MARGIN_TOP'] - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
            }).
            show();

        }

        function clearChartSelection() {
          element.find('.timeline-chart-selection').hide();
          //$('.timeline-chart-selection').hide();//d3ChartElement.select('svg.timeline-chart-selection').select('g').remove();
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

          function deriveXAxisLabelUnit() {

            var domain;
            var labelUnit;

            domain = _.map(d3XScale.domain(), function(date) {
              return moment(date);
            });

            labelUnit = 'decade';

            // ...then use the domain to derive a timeline granularity.
            if (moment(domain[0]).add(2, 'months').isAfter(domain[1])) {
              labelUnit = 'day';
            } else if (moment(domain[0]).add(2, 'years').isAfter(domain[1])) {
              labelUnit = 'month';
            } else if (moment(domain[0]).add(20, 'years').isAfter(domain[1])) {
              labelUnit = 'year';
            }

            return labelUnit;

          }


          function deriveXAxisLabelDatumStep(labelData) {

            // Determine the granularity of our labeling by looking at the total
            // number of possible labels. The higher the number, the more we step
            // over per actual rendered label.
            if (labelData.length > 20) {
              return 7;
            } else if (labelData.length > 10) {
              return 5;
            } else {
              return 1;
            }

          }


          var labelUnit;
          var tickDates;
          var tickInterval;
          var tickWidth = (chartData.offsets[1] - chartData.offsets[0]) * chartWidth;
          var halfTickWidth = tickWidth / 2;
          var labelData = [];
          var i;
          var j;
          var jqueryAxisContainer;
          var labelDatumStep;
          var cumulativeLabelOffsets;
          var shouldDrawLabel;
          var jqueryAxisTick;
          var labelStartDate;
          var labelEndDate;
          var labelWidth;
          var labelOffset;
          var jqueryAxisTickLabel;
          var dataAggregate;
          var unfilteredAggregate;
          var filteredAggregate;


          labelUnit = deriveXAxisLabelUnit();

          // THIS MAY NEED UPDATES BECAUSE OF THINGS LIKE LEAP-YEARS

          // Since moment doesn't natively support decades as a unit, we
          // pass it a unit of 'year' and a value of 10 instead.
          if (labelUnit === 'decade') {

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
            tickDates = d3XScale.ticks(d3.time[labelUnit], 1).
                          concat([chartData.values[chartData.values.length - 1].date]);
            tickInterval = moment.duration(1, labelUnit).asMilliseconds();

          }

          // For each tickDate, find the first datum in chartData that's that date.
          // Since tickDate and chartData are both ordered, keep a pointer into chartData, and
          // pick up where we left off, when searching for the next tickDate.
          i = 0;
          for (j = 0; j < tickDates.length; j++) {
            for (i; i < chartData.values.length; i++) {
              if (moment(chartData.values[i].date).isSame(tickDates[j], labelUnit)) {
                labelData.push({ datum: chartData.values[i], offset: d3XScale(chartData.values[i].date) });
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

          for (i = 1; i < labelData.length; i++) {

            // Do not append a tick for the last item,
            // but keep it in the iteration so that we
            // can label the gap between the last tick
            // and the edge of the chart as necessary.
            if (i < labelData.length - 1) {

              jqueryAxisTick = $('<rect>').
                addClass('x-tick').
                css({
                  left: Math.floor(labelData[i].offset - 2)
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

              // HOWEVER, we need to modify the label's width for the following
              // two special cases:
              if (i === 1) {
                // In the case of the first label, subtract half a tick's
                // width since the first datum is always half-width... this
                // is because highlights need to span individual points on the
                // line with half before and half after, but the ticks themselves
                // need to preceed the full highlight (i.e. a translation
                // in the -x direction of half the highlight's width).

                //labelWidth -= halfTickWidth;
              } else if (i === labelData.length - 1) {
                // In the case of the final label, just consume all remaining
                // space instead. This is so the last label fits snugly in the
                // variable amount of space available to it.
                labelWidth = chartWidth - cumulativeLabelOffsets;
              }

              // Only draw the label if its width is greater than 10% of the total.
              // This is pretty arbitrary, but the AC specifies that we should
              // "render as many labels for the ticks as possible without the labels
              // running into each other."
              // As far as I know this is humorously non-trivial in JavaScript, so
              // we'll 'eyeball' it like so and see if anyone notices.
              if (labelWidth > chartWidth / 10) {

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
                  attr('data-start', labelStartDate).
                  attr('data-end', labelEndDate).
                  attr('data-aggregate-unfiltered', unfilteredAggregate).
                  attr('data-aggregate-filtered', filteredAggregate).
                  attr('data-flyout-label', formatDateLabel(labelStartDate, labelUnit, true)).
                  text(formatDateLabel(labelStartDate, labelUnit, false)).
                  css({
                    width: Math.floor(labelWidth),
                    left: Math.floor(labelOffset)
                  });

                if (selectionActive) {
                  jqueryAxisTickLabel.addClass('dimmed');
                }

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

        function renderChart(chartData, dimensions, precision, activeFilters, pageIsFiltered) {

          var margin;
          var chartWidth;
          var chartHeight;
          var stack;
          var area;
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
          // Render the chart itself.
          //

          seriesStack = transformChartDataForStackedRendering(chartData, pageIsFiltered);

          stack(seriesStack);

          svgChart = d3ChartElement.
            select('svg.timeline-chart').
              attr('width',  chartWidth  + margin.left + margin.right).
              attr('height', chartHeight + margin.top  + margin.bottom).
              select('g').
                attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
              attr('class', function (d) {
                if (pageIsFiltered) {
                  return (d.name === 'unfiltered') ? 'context' : 'shaded';
                } else {
                  return 'shaded';
                }
              }).
              attr('d', function (d) { return area(d.values); });

        }


        /**********************************************************************
         *
         * formatDateLabel
         *
         * Converts a date and a unit into a string representation
         * appropriate for display in a flyout.
         *
         */

        function formatDateLabel(labelDate, unit, forFlyout) {

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

          switch (unit) {

            case 'decade':
              return String(labelDate.getFullYear()).substring(0, 3) + '0s';

            case 'year':
              return labelDate.getFullYear();

            case 'month':
              if (forFlyout) {
                return FULL_MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getFullYear();
              } else {
                return SHORT_MONTH_NAMES[labelDate.getMonth()] + ' ’' + labelDate.getYear();
              }

            case 'day':
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
         * emphasizeSingleXAxisLabel
         *
         * Selectively applies the 'dim' effect to x-axis labels to emphasize
         * a single one.
         *
         */

        function emphasizeSingleXAxisLabel(element) {
          $(element).removeClass('dimmed');
          jqueryChartElement.find('.x-tick-label').not($(element)).addClass('dimmed');
        }


        /**********************************************************************
         *
         * emphasizeXAxisLabels
         *
         * Removes the 'dim' effect from all x-axis labels.
         *
         */

        function emphasizeXAxisLabels() {
          jqueryChartElement.find('.x-tick-label').removeClass('dimmed');
        }


        /**********************************************************************
         *
         * unemphasizeXAxisLabels
         *
         * Removes the 'dim' effect from all x-axis labels.
         *
         */

        function unemphasizeXAxisLabels() {
          console.log('DIMMING');
          jqueryChartElement.find('.x-tick-label').addClass('dimmed');
        }


        //
        // Handle selection
        //

        function getDateFromMousePosition(offsetX, getEndDate) {

          var date = d3XScale.invert(offsetX + halfVisualizedDatumWidth);

          // Clear out unneeded precision from the date objects.
          // This intentionally falls through! Watch out!
          switch (datasetPrecision) {
            case 'YEAR':
              date.setMonth(0);
            case 'MONTH':
              date.setDate(1);
            default:
              date.setSeconds(0);
              date.setMinutes(0);
              date.setHours(0);
          }

          if (getEndDate && (moment(selectionStartDate).isSame(moment(date)))) {

            date = moment(date).add(1, datasetPrecision).toDate();

          }

          return date;

        }

        valueAndPositionOnClickObservable = WindowState.mouseLeftButtonPressedSubject.flatMap(
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
        );

        Rx.Observable.subscribeLatest(
          valueAndPositionOnClickObservable,
          chartOffsetSubject,
          function(mouseStatus, chartOffsets) {

            var visualizationXOffset;

            // Mouse down
            if (mousePositionWithinChartDisplay &&
                mouseStatus.leftButtonPressed &&
                !currentlyDragging) {

              visualizationXOffset = mouseStatus.position.clientX - chartOffsets.left;
              selectionStartDate = getDateFromMousePosition(visualizationXOffset, false);

              currentlyDragging = true;
              selectionActive = true;
              unemphasizeXAxisLabels();

              jqueryBodyElement.addClass('prevent-user-select');

            }

            // Mouse up
            if (currentlyDragging && !mouseStatus.leftButtonPressed) {

              currentlyDragging = false;

              jqueryBodyElement.removeClass('prevent-user-select');

              filterChartByCurrentSelection();

            }

          });




        //
        // Handle interactions
        //

        jqueryChartElement.on('mouseleave', function() {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
          if (!selectionActive) {
            emphasizeXAxisLabels();
          }
        });

        FlyoutService.register('timeline-chart-highlight-target', function(e) {

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
        });


        function filterChartByCurrentSelection() {
          scope.$emit('filter-timeline-chart', { start: selectionStartDate, end: selectionEndDate });
        }


        //
        // Render a chart highlight if the mouse is in an appropriate position:
        // a) over the chart iteself; or
        // b) over an x-axis label
        //

        Rx.Observable.subscribeLatest(
          scope.observe('chartData'),
          WindowState.mousePositionSubject,
          WindowState.scrollPositionSubject,
          WindowState.mouseLeftButtonPressedSubject,
          chartOffsetSubject,
          chartDimensionsSubject,
          function(chartData, mousePosition, scrollPosition, mouseLeftButtonNowPressed, chartOffset, chartDimensions) {

            function isMouseWithinChartDisplay(offsetX, offsetY, chartDimensions) {

              return offsetX > 0 &&
                     offsetX <= chartDimensions.width &&
                     offsetY > 0 &&
                     offsetY <= chartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM'];

            }

            function isMouseWithinChartLabels(offsetX, offsetY, chartDimensions) {

              return offsetX > 0 &&
                     offsetX <= chartDimensions.width &&
                     offsetY > chartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM'] &&
                     offsetY <= chartDimensions.height;

            }

            var offsetX = mousePosition.clientX - chartOffset.left;
            var offsetY = mousePosition.clientY + scrollPosition - chartOffset.top;
            var highlightData;
            var startDate;
            var endDate;


            if (currentlyDragging) {

              selectionEndDate = getDateFromMousePosition(offsetX, true);

              renderChartSelection(
                chartData,
                chartDimensions
              );

            }

            if (isMouseWithinChartDisplay(offsetX, offsetY, chartDimensions)) {

              mousePositionWithinChartDisplay = true;

              // Draw the yellow selection highlight
              if (!currentlyDragging) {

                highlightData = filterChartDataByOffset(chartData, offsetX, chartDimensions);

                renderChartHighlight(
                  highlightData,
                  chartDimensions
                );

              }

              if (!selectionActive) {
                emphasizeXAxisLabels();
              }

            } else if (isMouseWithinChartLabels(offsetX, offsetY, chartDimensions) && !mouseLeftButtonNowPressed) {

              mousePositionWithinChartDisplay = false;

              startDate = new Date(mousePosition.target.getAttribute('data-start'));
              endDate = new Date(mousePosition.target.getAttribute('data-end'));

              if (endDate > startDate) {

                highlightData = filterChartDataByInterval(
                  chartData,
                  offsetX,
                  chartDimensions,
                  startDate,
                  endDate
                );

                renderChartHighlight(
                  highlightData,
                  chartDimensions
                );

                currentDatum = {
                  unfiltered: mousePosition.target.getAttribute('data-aggregate-unfiltered'),
                  filtered: mousePosition.target.getAttribute('data-aggregate-filtered'),
                  label: mousePosition.target.getAttribute('data-flyout-label')
                };

                // Trigger mouseover event on the thing that will draw the flyout
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('mousemove', true, true);
                evt.clientX = mousePosition.clientX;
                evt.clientY = mousePosition.clientY;
                jqueryChartElement.find('.timeline-chart-highlight-target')[0].dispatchEvent(evt);

                emphasizeSingleXAxisLabel(mousePosition.target);

              }

            } else {

              mousePositionWithinChartDisplay = false;

              if (!selectionActive) {
                emphasizeXAxisLabels();
              }

            }

          });


        //
        // Render the chart
        //

        Rx.Observable.subscribeLatest(
          chartDimensionsSubject,
          scope.observe('chartData'),
          scope.observe('precision'),
          scope.observe('rowDisplayUnit'),
          scope.observe('activeFilters'),
          scope.observe('pageIsFiltered'),
          function(cardVisualizationDimensions, chartData, precision, rowDisplayUnit, activeFilters, pageIsFiltered) {

            if (!_.isDefined(chartData) || !_.isDefined(precision)) {
              return;
            }

            // Analytics start.
            var timestamp = _.now();
            scope.$emit('render:start', 'timelineChart_{0}'.format(scope.$id), timestamp);

            // Only update the chartOffset sequence if we have done a full re-render.
            // This is used by renderHighlightedChartSegment but that function will
            // potentially fire many times per second so we want to cache this value
            // instead of listening to it directly.
            // NOTE THAT THIS IS ABSOLUTE OFFSET, NOT SCROLL OFFSET.
            chartOffsetSubject.onNext(element.offset());

            // Cache the datum width and half the datum width for use elsewhere instead of
            // repeated recomputation.
            visualizedDatumWidth = Math.floor(cardVisualizationDimensions.width / (chartData.values.length - 1));
            halfVisualizedDatumWidth = Math.floor(visualizedDatumWidth / 2);

            // Update the cached value for dataset precision.
            // This is global to the directive, but only updated here.
            datasetPrecision = precision;

            // Cache the row display unit for use in the flyout (which necessarily 
            // is handled outside the scope of this subscribeLatest and which probably
            // shouldn't be wrapped in its own subscribeLatest or other combinator).
            cachedRowDisplayUnit = rowDisplayUnit;

            renderChart(chartData, cardVisualizationDimensions, precision, activeFilters, pageIsFiltered);

            // Analytics end.
            $timeout(function() {
              scope.$emit(
                'render:complete', 'timelineChart_{0}'.format(scope.$id),
                timestamp);
            }, 0, false);

          });

      }
    };
  };

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();
