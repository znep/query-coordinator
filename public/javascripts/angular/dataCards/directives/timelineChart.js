(function() {
  'use strict';

  // TODO
  // 1. Make x-ticks work according to AC
  // 2. Do highlighted sections
  // 3. Add selection bars


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

        function renderTimelineChartYAxis(jqueryChartElement, chartWidth, chartHeight, d3YScale, labels) {

          var jqueryAxisContainer;
          var ticks;

          jqueryAxisContainer = $('<div>').
            addClass('ticks').
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

          _.each(ticks, function(tick, index) {
            jqueryAxisContainer.append(
              $('<div>').
                css('top', Math.floor(chartHeight - (chartHeight * tick))).
                text($.toHumaneNumber(labels[index])));
          });

          // Remove old y-axis ticks and replace them
          jqueryChartElement.children('.ticks').remove();
          jqueryChartElement.prepend(jqueryAxisContainer);

        }
        

        function renderHighlightedChartSegment(chartData, dimensions, offsetX, offsetY, pageIsFiltered) {

          var offset = (offsetX / dimensions.width);
          var i;
          var value;
          var offset;
          var highlightData;
          var width;
          var svg;
          var area;

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
            if (chartData.offsets[i] > offset) {
              break;
            }
          }

          value = chartData.values[i];
          offset = chartData.offsets[i];


          if (i === 0) {
            highlightData = [chartData.values[i], chartData.values[i + 1]];
            width = Math.floor((chartData.offsets[i + 1] - chartData.offsets[i]) * dimensions.width);
          } else if (i === chartData.values.length) {
            highlightData = [chartData.values[chartData.values.length - 2], chartData.values[chartData.values.length - 1]];
            width = Math.floor((chartData.offsets[i - 1] - chartData.offsets[i - 2]) * dimensions.width);
          } else {
            highlightData = [chartData.values[i - 1], chartData.values[i]];
            width = Math.floor((chartData.offsets[i] - chartData.offsets[i - 1]) * dimensions.width);
          }
          
          // Global to the directive, used by the flyout callback.
          currentDatum = chartData.values[i];

          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();

          svg = d3ChartElement.
            select('svg.timeline-chart-highlight-container').
              attr('width', width).
              attr('height', dimensions.height).
              append('g').
                attr('transform', 'translate(0,-' + (dimensions.height + 2) + ')');
                

          area = d3.
            svg.
              area().
                x(function(d) { return d3XScale(d.date); }).
                y0(dimensions.height - Constants['TIMEILNE_CHART_MARGIN_BOTTOM']).
                y1(function(d) { return pageIsFiltered ? d3YScale(d.unfiltered + d.filtered) : d3YScale(d.unfiltered); });


          svg.append('path')
              .datum(highlightData)
              .attr('class', 'timeline-chart-highlight')
              .attr('d', area);

          jqueryHighlightTargetElement.css({ left: (offsetX - 100), width: 200, height: dimensions.height - Constants['TIMEILNE_CHART_MARGIN_BOTTOM']});

        }

        function renderTimelineChart(chartData, dimensions, precision, activeFilters, pageIsFiltered) { //dimensions, filterChanged, state, filters) {

          console.log(chartData, dimensions, precision, activeFilters);

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

          margin = { top: 0, right: 0, bottom: Constants['TIMEILNE_CHART_MARGIN_BOTTOM'], left: 0 };

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
                  return value.unfiltered;//pageIsFiltered ? value.unfiltered + value.filtered : value.unfiltered;
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
console.log(chartData.values);
          chartData.values.forEach(function (d) {
            console.log(d);
            varNames.map(function (name) {
              if (name === 'unfiltered') {
                console.log(d['unfiltered'], d['filtered']);
              }
              series[name].values.push({label: d[labelVar], value: name === 'unfiltered' ? d['unfiltered'] - d['filtered'] : d[name]});
            });
          });

          stack(seriesStack);


          //
          // Render the x-axis.
          //

          xAxis = d3.
            svg.
              axis().
                scale(d3XScale).
                orient('bottom');

          svgXAxis = svgChart.
              append('g').
                attr('height', 1).
                attr('transform', 'translate(0,' + chartHeight + ')').
                call(xAxis);


          //
          // Render the y-axis. Since we eschew d3's built-in y-axis for a custom
          // implementation this calls out to a separate function.
          //

          renderTimelineChartYAxis(
            jqueryChartElement,
            chartWidth,
            chartHeight,
            d3YScale,
            // Because of a peculiarity with the way stacked area charts work in d3
            // (I think), the y scale extends to 2x the maximum value found in the
            // data set. However, we really only want to represent values from the minimum
            // to the maximum found in the data set, so we use those values for the tick
            // labels as the last argument to renderTimelineChartYAxisTicks instead of what d3 chooses
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
              attr('class', 'streamPath').
              attr('d', function (d) { return area(d.values); }).
              style('fill', 'rgba(128,128,128,0.5)').
              style('stroke', 'grey');

        }
/*
      // Handle x-axis

      var domain;
      var labelUnit = 'decade';
      var tickDates;
      var tickRange;
      var labelData = [];
      var i;
      var j;

      // ...first set up the domain as an array of moments.
      domain = _.map(d3XScale.domain(), function(date) {
        return moment(date);
      });

      // ...then use the domain to derive a timeline granularity
      if (moment(domain[0]).add('months', 2).isAfter(domain[1])) {
        labelUnit = 'day';
      } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
        labelUnit = 'month';
      } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
        labelUnit = 'year';
      }

      if (labelUnit === 'decade') {
        tickDates = scales.horizontal.ticks(d3.time.year, 10);
        tickRange = moment.duration(10, 'year');
      } else {
        tickDates = scales.horizontal.ticks(d3.time[labelUnit], 1);
        tickRange = moment.duration(1, labelUnit);
      }

      // For each tickDate, find the first datum in chartData that's that date.
      // Since tickDate and chartData are both ordered, keep a pointer into chartData, and
      // pick up where we left off, when searching for the next tickDate.
      i = 0;
      for (j = 0; j < tickDates.length; j++) {
        for (i; i < chartData.length; i++) {
          if (chartData[i].date.isSame(tickDates[j], labelUnit)) {
            // Found it. Save it, and break to look for the next tick
            chartData[i].range = tickRange;
            labelData.push(chartData[i]);
            break;
          }
        }
      }

      var updateTicks = function(tickSelection) {
        tickSelection.classed('tick-dark', scales.min < 0 && scales.max > 0);
        var ticks = tickSelection.selectAll('rect.tick').
          data(labelData);

        // TODO: investigate making these ticks consistent with eg our bar graph ticks
        // (ie lines rather than rectangles)
        var tickEnter = ticks.
          enter().
          append('rect').
          attr('class', 'tick').
          attr('height', Constants['TIMELINE_CHART_TICK_SIZE']).
          attr('width', Constants['TIMELINE_CHART_TICK_SIZE']);

        ticks.
          attr('x', function(datum) {
            return scales.horizontal(datum.date) - Constants['TIMELINE_CHART_TICK_SIZE'] / 2 - segmentWidth / 2;
          }).
          attr('y', chartHeight - Constants['TIMELINE_CHART_TICK_SIZE']);

        ticks.
          exit().
          remove();
      };

      d3ChartElement.select('g.xticks').call(updateTicks);
*/



        // Remove the highlight if the mouse moves out of the visualization.
        $('.timeline-chart').on('mouseout', function() {
          d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
          currentDatum = null;
        });

        FlyoutService.register('timeline-chart-highlight-target', function(e) {
          if (_.isDefined(currentDatum) && currentDatum !== null && datasetPrecision !== null) {
            if (currentDatum.filtered !== currentDatum.unfiltered) {
              return ['<div class="flyout-title">{0}</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell">Total</span>',
                        '<span class="flyout-cell">{1}</span>',
                      '</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell emphasis">Filtered amount</span>',
                        '<span class="flyout-cell emphasis">{2}</span>',
                      '</div>'].join('').format(moment(currentDatum.date).format(FLYOUT_DATE_FORMAT[datasetPrecision]), currentDatum.unfiltered, currentDatum.filtered);
            } else {
              return ['<div class="flyout-title">{0}</div>',
                      '<div class="flyout-row">',
                        '<span class="flyout-cell">Total</span>',
                        '<span class="flyout-cell">{1}</span>',
                      '</div>'].join('').format(moment(currentDatum.date).format(FLYOUT_DATE_FORMAT[datasetPrecision]), currentDatum.unfiltered);
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
          scope.observe('activeFilters'),
          WindowState.mousePositionSubject,
          chartOffsetSubject,
          chartDimensionsSubject,
          function(chartData, activeFilters, mousePosition, chartOffset, chartDimensions) {

            var offsetX = mousePosition.clientX - chartOffset.left;
            var offsetY = mousePosition.clientY - chartOffset.top;

            if ((offsetX > 0 && offsetX <= chartDimensions.width) &&
                (offsetY > 0 && offsetY <= chartDimensions.height - Constants['TIMEILNE_CHART_MARGIN_BOTTOM'])) {
              renderHighlightedChartSegment(chartData, chartDimensions, offsetX, offsetY);
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

            renderTimelineChart(chartData, cardVisualizationDimensions, precision, activeFilters, pageIsFiltered);


            // Analytics end.
            $timeout(function() {
              scope.$emit(
                'render:complete', 'timelineChart_{0}'.format(scope.$id),
                timestamp);
            }, 0, false);

          });
/*



            // If it's the scope filters that have changed, update the state.
            if (!_.isEmpty(scope.filters)) {
              state.filter = scope.filters[0];
            }

            renderTimelineChart(
              cardVisualizationDimensions,
              lastData && ( lastFilter != showFiltered || lastData != chartData ),
              state,
              filters
            );

            lastFilter = showFiltered;
            lastData = chartData;
            $timeout(function() {
              scope.$emit('render:complete', 'timelineChart_{0}'.format(scope.$id),
                          timestamp);
            }, 0, false)
          }
        );*/

        // Clean up jQuery on card destruction to stop memory leaks.
        scope.$on('$destroy', function() {
          //element.find('.chart-scroll').undelegate();
          //$(window).off('mouseup.TimelineChart', scope.mouseUpHandler);
        });
      }
    };
  };

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();
