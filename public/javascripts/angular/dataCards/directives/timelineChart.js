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
        // Prepare selectors.
        //

        var jqueryChartElement = element.find('.timeline-chart-wrapper');
        var jqueryHighlightTargetElement = element.find('.timeline-chart-highlight-target');
        var d3ChartElement = d3.select(jqueryChartElement[0]);

        // The X and Y scales that d3 uses are global to the directive so
        // that we can use the same ones between the renderTimelineChart and
        // renderHighlightedChartSegment functions.
        // They are initialized to null so that we don't accidentally try
        // to render a highlight before a chart is rendered.
        var d3XScale = null;
        var d3YScale = null;

        // These two sequences track the page offset and dimensions of the visualization.
        // These properties are required by the rendering functions but are unnecessary
        // to recalcualte on every pass of renderHighlightedChartSegment and regardless
        // can be expensive in terms of performance. Therefore, we only update the sequences
        // when necessary.
        var chartOffsetSubject = new Rx.Subject(); // This one is updated in renderTimelineChart.
        var chartDimensionsSubject = element.closest('.card-visualization').observeDimensions();

        var currentDatum = null;

        var datasetPrecision = null;

        
        function filterChartDataByOffset(chartData, offsetX, dimensions) {

          var offset = (offsetX / dimensions.width);
          var i;
          var halfIntervalDurationInMilliseconds = Math.floor((chartData.values[1].date - chartData.values[0].date) / 2);
          var highlightToLeftSide;
          var highlightData;
          var halfIntervalDurationInMilliseconds;
          var maxValue = chartData.maxValue;
          var width;

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

          highlightToLeftSide = (Math.abs(offset - chartData.offsets[i - 1]) < Math.abs(offset - chartData.offsets[i]));

          if (highlightToLeftSide) {

            highlightData = [chartData.values[i - 1],
                             chartData.values[i]];

            currentDatum = chartData.values[i - 1];

          } else {

            if (i === chartData.values.length - 1) {

              highlightData = [
                chartData.values[i],
                {
                  date: new Date(chartData.values[i].date.valueOf() +
                                 halfIntervalDurationInMilliseconds),
                  unfiltered: chartData.values[i].unfiltered,
                  filtered: chartData.values[i].filtered
                }];

            } else {

              highlightData = [
                chartData.values[i],
                chartData.values[i + 1]
              ];

            }

            currentDatum = chartData.values[i];

          }

          highlightData = highlightData.map(function(datum) {
            // Ignore the slope and just render a full-height rectangle for the highlight
            // since it is semi-transparent anyway and will not show over the chart's white
            // background.
            return {
              date: new Date(datum.date.valueOf() - halfIntervalDurationInMilliseconds),
              unfiltered: maxValue,
              filtered: maxValue
            };
          });

          if (i === 1 || i === chartData.values.length - 1) {

            width = Math.floor(chartData.offsets[1] * dimensions.width);

          } else {

            width = Math.floor((chartData.offsets[i] - chartData.offsets[i - 1]) * dimensions.width);

          }

          return {
            data: highlightData,
            left: offsetX,
            width: width,
            maxValue: chartData.maxValue
          };

        }


        function filterChartDataByInterval(chartData, offsetX, dimensions, startDate, endDate) {

          var highlightData
          var i;
          var startOffsetIndex = 0;
          var endOffsetIndex = 1;
          var dataInterval;
          var halfTimeIntervalInMilliseconds = Math.floor((chartData.values[1].date.valueOf() - chartData.values[0].date.valueOf()) / 2);
          var maxValue = chartData.maxValue;
          var width;


          for (i = 0; i < chartData.values.length; i++) {
            // VERY IMPORTANT NOTE:
            // The '===' comparisons below use a '+' prefix
            // to coerce the values into milliseconds.
            // Using a '===' on two date objects set to identical
            // times will return FALSE.
            if (+chartData.values[i].date === +startDate) {
              startOffsetIndex = i;
            }
            if (+chartData.values[i].date === +endDate) {
              endOffsetIndex = i;
            }
          }

          highlightData = [
            {
              date: new Date(chartData.values[startOffsetIndex].date.valueOf() - halfTimeIntervalInMilliseconds),
              unfiltered: maxValue,
              filtered: maxValue
            }
          ];

          if (startOffsetIndex === chartData.values.length - 1) {
            dataInterval = chartData.values[1].date.valueOf() - chartData.values[0].date.valueOf();
            highlightData.push({
              date: new Date((chartData.values[startOffsetIndex].date.valueOf() + dataInterval) - halfTimeIntervalInMilliseconds),
              unfiltered: maxValue,
              filtered: maxValue
            });
          } else {
            highlightData.push({
              date: new Date(chartData.values[endOffsetIndex].date.valueOf() - halfTimeIntervalInMilliseconds),
              unfiltered: maxValue,
              filtered: maxValue
            });
          }

          if (startOffsetIndex === 0 || startOffsetIndex === chartData.values.length - 1) {
            width = Math.floor(((chartData.offsets[1] - chartData.offsets[0]) * dimensions.width) / 2);
          } else {
            width = Math.floor((chartData.offsets[1] - chartData.offsets[0]) * dimensions.width);
          }

          // TODO: set currentDatum here with a proper aggregate of the range.

          return {
            data: highlightData,
            left: offsetX,
            width: width,
            maxValue: chartData.maxValue
          };

        }


        function renderChartHighlight(highlightData, dimensions, renderFullInterval) {

          var svg;
          var area;

          if (d3XScale === null || d3YScale === null) {
            return;
          }

          jqueryHighlightTargetElement.css({
            left: (highlightData.left - ((highlightData.width + 100) / 2)),
            width: highlightData.width + 100,
            height: dimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']
          });

          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();

          svg = d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              attr('width', highlightData.width).
              attr('height', dimensions.height).
              append('g').
                attr('transform', 'translate(0,-' + (dimensions.height + 2) + ')');

          area = d3.
            svg.
              area().
                x(function(d) { return d3XScale(d.date); }).
                y0(dimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM']).
                y1(function(d) { return d3YScale(d.unfiltered); });


          svg.append('path')
              .datum(highlightData.data)
              .attr('class', 'timeline-chart-highlight')
              .attr('d', area);

        }


        function formatDateLabel(labelDate, unit) {

          var MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

          switch (unit) {

            case 'decade':
              return String(labelDate.getFullYear()).substring(0, 3) + '0s';
              break;

            case 'year':
              return labelDate.getFullYear();
              break;

            case 'month':
              return MONTH_NAMES[labelDate.getMonth()] + ' ' + labelDate.getYear();
              break;

            case 'day':
              return labelDate.getDate() + ' ' + MONTH_NAMES[labelDate.getMonth()];
              break;

            default:
              throw new Error('Cannot format date label for unrecognized unit "' + unit + '".');
              break;

          }

        }

        function createSyntheticDatumForInterval(intervalData, label) {

          // Since the intervalData is range-inclusive (i.e. '[start .. end]')
          // but it does not make sense to reduce across the entire range, we
          // perform a .slice(0, -1) before the reduce operations to make them
          // end-exclusive.
          return {
            label: label,
            unfiltered: intervalData.
                          data.
                          slice(0, -1).
                          reduce(function(acc, item) { return acc + item.unfiltered; }, 0),
            filtered: intervalData.
                        data.
                        slice(0, -1).
                        reduce(function(acc, item) { return acc + item.filtered; }, 0)
          };

        }

        function emphasizeXAxisLabel(element) {
          jqueryChartElement.find('.x-tick-label').not($(element)).addClass('dimmed');
        }

        function unemphaziseXAxisLabels() {
          jqueryChartElement.find('.x-tick-label').removeClass('dimmed');
        }

        function renderChartXAxis(jqueryChartElement, chartWidth, chartHeight, d3XScale, chartData) {

          var domain;
          var labelUnit = 'decade';
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
          var jqueryAxisTick;
          var labelStartDate;
          var labelEndDate;
          var labelWidth;
          var labelOffset;
          var labelText;
          var jqueryAxisTickLabel;


          // First set up the domain as an array of moments...
          domain = _.map(d3XScale.domain(), function(date) {
            return moment(date);
          });

          // ...then use the domain to derive a timeline granularity.
          if (moment(domain[0]).add('months', 2).isAfter(domain[1])) {
            labelUnit = 'day';
          } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
            labelUnit = 'month';
          } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
            labelUnit = 'year';
          }

          // Since moment doesn't natively support decades as a unit, we
          // pass it a unit of 'year' and a value of 10 instead.
          if (labelUnit === 'decade') {

            // Ticks at the decade scale seem to get a little messed up by d3, so we
            // need to book-end them with the min and max dates from the underlying
            // chart data in order for labels to work consistently across all intervals.
            tickDates = [chartData.values[0].date].
                          concat(d3XScale.ticks(d3.time.year, 10)).
                          concat([chartData.values[chartData.values.length - 1].date]);
            tickInterval = moment.duration(10, 'year').asMilliseconds();

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


          // Determine the granularity of our labeling by looking at the total
          // number of possible labels. The higher the number, the more we step
          // over per actual rendered label.
          if (labelData.length > 20) {
            labelDatumStep = 7;
          } else if (labelData.length > 10) {
            labelDatumStep = 5;
          } else {
            labelDatumStep = 1;
          }

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
                  left: Math.round(labelData[i].offset - halfTickWidth - 2)
                });

              jqueryAxisContainer.append(jqueryAxisTick);

            }

            if (labelDatumStep === 1 || i % labelDatumStep === 0) {

              labelStartDate = labelData[i - 1].datum.date;
              labelEndDate = labelData[i].datum.date;

              if (labelStartDate.valueOf() === labelEndDate.valueOf()) {
                labelEndDate = new Date(labelEndDate.valueOf() + tickInterval);
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
                labelWidth -= halfTickWidth;
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
                labelText = formatDateLabel(labelStartDate, labelUnit);

                jqueryAxisTickLabel = $('<span>').
                  addClass('x-tick-label').
                  attr('data-start', labelStartDate).
                  attr('data-end', labelEndDate).
                  text(labelText).
                  css({
                    width: Math.round(labelWidth),
                    left: Math.round(labelOffset)
                  });

                jqueryAxisContainer.append(jqueryAxisTickLabel);

              }

              cumulativeLabelOffsets += labelWidth;

            }

          }

          // Remove old x-axis ticks and replace them
          jqueryChartElement.children('.x-ticks').remove();
          jqueryChartElement.prepend(jqueryAxisContainer);

        }

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
          // Because we need to know the max tick value, this needs to happen on
          // two lines rather than by composing the two lines below.
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
                css('top', Math.floor(chartHeight - (chartHeight * tick))).
                text($.toHumaneNumber(labels[index])));
          });

          // Remove old y-axis ticks and replace them
          jqueryChartElement.children('.y-ticks').remove();
          jqueryChartElement.prepend(jqueryAxisContainer);

        }


        function renderChart(chartData, dimensions, precision, activeFilters, pageIsFiltered) {

          var data;

          var margin;
          var chartWidth;
          var chartHeight;

          var scales;
          var jqueryChartBody;
          var domain;
          var labelUnit;
          var segmentDuration;
          var segmentWidth;

          var xAxis;
          var yAxis;
          var stack;
          var area;
          var color;
          var svgChart;
          var svgXAxis;
          var svgYAxis;
          var seriesStack;
          var series;
          var labelVar;
          var varNames;
          var selection;
          var yAxisTickLabels;

          if (dimensions.width <= 0 || dimensions.height <= 0) {
            return;
          }


          //
          // Prepare dimensions used in chart rendering.
          //

          margin = { top: 0, right: 0, bottom: Constants['TIMELINE_CHART_MARGIN_BOTTOM'], left: 0 };

          // Resize the element to take up the entire available space.
          jqueryChartElement.width(dimensions.width);
          jqueryChartElement.height(dimensions.height);

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
                domain([0, d3.max(chartData.values.map(function(value) {
                  return value.unfiltered;
                }))]).
                range([chartHeight, 0]).
                clamp(true);

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
          // Remove any existing charts so that we don't double-up.
          //

          d3ChartElement.
            select('svg.timeline-chart').
              select('g').
                remove();


          //
          // Create the new chart.
          //

          svgChart = d3ChartElement.
            select('svg.timeline-chart').
              attr('width',  chartWidth  + margin.left + margin.right).
              attr('height', chartHeight + margin.top  + margin.bottom).
              append('g').
                attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          //
          // Determine which layers will appear in the stacked area
          // chart based on the properties of each datum, keyed off
          // of the labelVar. Each layer is a 'series' in the stack.
          //

          labelVar = 'date';
          varNames = d3.
            keys(chartData.values[0]).
              filter(function (key) { return key !== labelVar; }).
              filter(function (key) { return pageIsFiltered || (!pageIsFiltered && key !== 'filtered'); });

          seriesStack = [];
          series = {};

          varNames.forEach(function (name) {
            series[name] = {name: name, values:[]};
            seriesStack.push(series[name]);
          });

          chartData.values.forEach(function (d) {
            varNames.forEach(function (name) {
              if (pageIsFiltered) {
                series[name].values.push({
                  label: d[labelVar],
                  value: (name === 'unfiltered') ? (d['unfiltered'] - d['filtered']) : d['filtered']
                });
              } else {
                series[name].values.push({
                  label: d[labelVar],
                  value: d['unfiltered']
                });
              }
            });
          });

          stack(seriesStack);


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

          selection = svgChart.
            selectAll('.series').
              data(seriesStack).
                enter().
                  append('g').
                    attr('class', 'series');

          selection.
            append('path').
              attr('class', function (d) {
                if (pageIsFiltered) {
                  return (d.name === 'unfiltered') ? 'context' : 'shaded';
                } else {
                  return 'shaded';
                }
              }).
              attr('d', function (d) { return area(d.values); });

        }


        //
        // Handle interactions
        //

        // Clear highlight state if the mouse moves out of the visualization.
        jqueryChartElement.on('mouseout', function() {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
          unemphaziseXAxisLabels();
        });

        FlyoutService.register('timeline-chart-highlight-target', function(e) {

          if (_.isDefined(currentDatum) && currentDatum !== null && datasetPrecision !== null) {

            var dateString = currentDatum.hasOwnProperty('label') ?
                               currentDatum.label :
                               moment(currentDatum.date).format(FLYOUT_DATE_FORMAT[datasetPrecision]);

            if (currentDatum.filtered !== currentDatum.unfiltered) {
              return ['<div class="flyout-title">{0}</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell">Total</span>',
                        '<span class="flyout-cell">{1}</span>',
                      '</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell emphasis">Filtered amount</span>',
                        '<span class="flyout-cell emphasis">{2}</span>',
                      '</div>'].join('').format(dateString, currentDatum.unfiltered, currentDatum.filtered);
            } else {
              return ['<div class="flyout-title">{0}</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell">Total</span>',
                        '<span class="flyout-cell">{1}</span>',
                      '</div>'].join('').format(dateString, currentDatum.unfiltered);
            }
          }
        });

        FlyoutService.register('timeline-clear-selection',
                               _.constant('Clear filter range'));


        //
        // Render the chart highlight if the mouse is over the chart.
        //

        Rx.Observable.subscribeLatest(
          scope.observe('chartData'),
          WindowState.mousePositionSubject,
          WindowState.scrollPositionSubject,
          chartOffsetSubject,
          chartDimensionsSubject,
          function(chartData, mousePosition, scrollPosition, chartOffset, chartDimensions) {

            function mouseIsWithinChartDisplay(offsetX, offsetY, chartDimensions) {

              return offsetX > 0 &&
                     offsetX <= chartDimensions.width &&
                     offsetY > 0 &&
                     offsetY <= chartDimensions.height - Constants['TIMELINE_CHART_MARGIN_BOTTOM'];

            }

            function mouseIsWithinChartLabels(offsetX, offsetY, chartDimensions) {

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

            if (mouseIsWithinChartDisplay(offsetX, offsetY, chartDimensions)) {

              highlightData = filterChartDataByOffset(chartData, offsetX, chartDimensions);

              renderChartHighlight(
                highlightData,
                chartDimensions,
                false);

              unemphaziseXAxisLabels();

            } else if (mouseIsWithinChartLabels(offsetX, offsetY, chartDimensions)) {

              startDate = new Date(mousePosition.target.getAttribute('data-start'));
              endDate = new Date(mousePosition.target.getAttribute('data-end'));

              if (endDate > startDate) {

                highlightData = filterChartDataByInterval(chartData, offsetX, chartDimensions, startDate, endDate);

                renderChartHighlight(
                  highlightData,
                  chartDimensions,
                  true);

                currentDatum = createSyntheticDatumForInterval(highlightData, $(mousePosition.target).text());

                // Trigger mouseover event on the thing that will draw the flyout
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('mousemove', true, true);
                evt.clientX = mousePosition.clientX;
                evt.clientY = mousePosition.clientY;
                jqueryChartElement.find('.timeline-chart-highlight-target')[0].dispatchEvent(evt);

                emphasizeXAxisLabel(mousePosition.target);

              }

            }

          });


        //
        // Render the chart.
        //

        Rx.Observable.subscribeLatest(
          scope.observe('chartData'),
          chartDimensionsSubject,
          scope.observe('precision'),

          /*scope.observe('showFiltered'),
          scope.observe('expanded'),
          scope.observe('rowDisplayUnit'),*/
          scope.observe('activeFilters'),
          scope.observe('pageIsFiltered'),
          function(chartData, cardVisualizationDimensions, precision, activeFilters, pageIsFiltered) {

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

            // Update the cached value for dataset precision.
            // This is global to the directive, but only updated here.
            datasetPrecision = precision;

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
