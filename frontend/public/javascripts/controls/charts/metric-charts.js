/*global Raphael */

var moment = require('moment');

(function() {
  'use strict';

  var metricsNS = blist.namespace.fetch('blist.metrics');

  /*
   Base chart visualization colors.
   Reference: http://www.mulinblog.com/a-color-palette-optimized-for-data-visualization/

   Colors are evenly distributed over color space.  Prioritizing neutral colors
   first.
   */
  var _colors = [
    '#5DA5DA', // Blue
    '#FAA43A', // Orange
    '#60BD68', // Green
    '#F17CB0', // Pink
    '#B2912F', // Brown
    '#B276B2', // Purple
    '#DECF3F', // Yellow
    '#F15854', // Red
    '#4D4D4D' // Grey
  ];

  /*
   * This takes series data returned from the metrics service
   * and turns it into a properly styled time series area chart
   * @param series: a comma-separated list of series to plot
   */

  metricsNS.renderMetricsChart = function(
    data, $chart, startDate, endDate, sliceType, series, options
  ) {
    var raphael;

    $chart.show();
    moment.locale(blist.locale);

    var chartD3 = $chart.data('metrics-chart');
    if (!chartD3) {
      raphael = new Raphael($chart.get(0), $chart.width(), $chart.height());
      chartD3 = d3.raphael(raphael);

      chartD3.setWidth = function(width) {
        raphael.setSize(width, false);
      };
      $chart.data('metrics-chart', chartD3);

      $chart.prepend($.tag2({
        _: 'div',
        'class': 'tickContainer'
      }));
      $chart.append($.tag2({
        _: 'div',
        'class': 'legendContainer'
      }));
    }

    // Find the metric options via the user selection, or in the case of first
    // load, use the option in the array
    var selectedMetric = _.find(options.children, {
      text: $chart.data('selection')
    });
    if (_.isUndefined(selectedMetric)) {
      selectedMetric = options.children[0];
    }

    // Basic configs
    var chartDims = {
      marginTop: 20,
      marginBottom: 30,
      height: $chart.height()
    };

    var color = d3.scale.ordinal().range(_colors);

    // Translate data into usable structure.
    var dataRange = [moment(data[0].__start__).utc()],
      intervalType = metricsNS.intervalTypes[sliceType],
      expectedDataAmt = moment(endDate).utc().diff(dataRange[0], intervalType);
    // expectedDataAmt should be data.length - 1
    _.times(expectedDataAmt, function() {
      dataRange.push(_.last(dataRange).clone().add(1, intervalType));
    });

    var processedData = _.map(dataRange, function(timestamp) {
      return {
        timestamp: timestamp,
        metrics: (_.detect(data,
          function(d) {
            return d.__start__ == timestamp;
          }) || {}).metrics
      };
    });
    var byMetric = function(metric) {
      return _.map(processedData, function(datum) {
        return {
          color: color(metric),
          timestamp: datum.timestamp,
          value: $.deepGet(datum, 'metrics', metric)
        };
      });
    };

    // Define scales.
    var combinedData = _.pluck(_.reduce(series,
      function(memo, item) {
        return memo.concat(byMetric(item.method));
      }, []), 'value');

    // yScale stuff, like ticks, are static.

    // Putting in some extra scoping in order to make the code flow a little more logically.
    var yScale;
    var ticks = null;
    (function() {
      var extent = d3.extent(combinedData),
        min = extent[0] || 0,
        max = extent[1] || 0;
      yScale = d3.scale.linear().
      domain([min, max]).
      range([chartDims.height - chartDims.marginBottom, chartDims.marginTop]);

      ticks = yScale.ticks(chartDims.height / 80);

      var tickSize = ticks.length > 1 ? Math.abs(ticks[0] - ticks[1]) : 0,
        domain = yScale.domain();

      yScale.domain([_.first(ticks) > min ? _.first(ticks) - tickSize : domain[0],
        _.last(ticks) < max ? _.last(ticks) + tickSize : domain[1]
      ]);

      ticks.unshift(yScale.domain()[0]);
      ticks.push(yScale.domain()[1]);
    })();

    // Render ticks.
    d3.select($chart.find('.tickContainer')[0]).selectAll('.tick').
    remove();
    var tickLines = d3.select($chart.find('.tickContainer')[0]).selectAll('.tick').
    data(ticks);
    var tickRootEnter = tickLines.
    enter().append('div').
    classed('tick', true).
    classed('origin', function(d) {
      return d === 0;
    }).
    style('top', function(d) {
      return yScale(d) + 'px';
    });
    tickRootEnter.append('div').
    classed('tickLine', true);
    tickRootEnter.append('div').
    classed('tickLabel', true).
    each(function(d) {
      $(this).text($.commaify(d));
    });

    // xScale stuff is resizable!

    var renderXDependentStuff = function() {
      var xScale = d3.scale.linear().
      domain([_.first(processedData).timestamp,
        _.last(processedData).timestamp
      ]).
      range([50, $chart.parent().width() - 30]);

      // Render lines.
      var pathData = {
        area: d3.svg.area().x(function(d) {
          return xScale(d.timestamp);
        }).
        y(function(d) {
          return yScale(d.value);
        }).
        y0(chartDims.height - chartDims.marginBottom).
        defined(function(d) {
          return !_.isUndefined(d.value);
        }),
        line: d3.svg.line().x(function(d) {
          return xScale(d.timestamp);
        }).
        y(function(d) {
          return yScale(d.value);
        }).
        defined(function(d) {
          return !_.isUndefined(d.value);
        })
      };

      // Because this function still assumes highcharts. -_-
      var lineType = _.first(_.uniq($.deepPluck(series, 'options.type'))) || 'area';
      var average = function(ary) {
        return _.inject(ary, function(m, a) {
          return m + a;
        }, 0) / ary.length;
      };

      chartD3.selectAll('.dataLine').
      remove();
      chartD3.selectAll('.dataLine').
        // Sort by averages as an easy way to rank backgrounds.
        // Using _.sortBy because d3#sort isn't implemented in d34raphael.
      data(_.sortBy(_.map(_.pluck(series, 'method'), byMetric)),
        function(a, b) {
          return average(a) < average(b);
        }).
      enter().append('path').
      classed('dataLine', true).
      attr('stroke-width', 4).
      attr('stroke', function(d) {
        return d[0].color;
      }).
      attr('d', pathData.line);

      // Use a second svg#path to avoid the thick bottom border.
      if (lineType == 'area') {
        chartD3.selectAll('.dataLine').
        append('path').
          // Use the same class in order to remove properly.
        classed('dataLine', true).
        attr('stroke-width', 0).
        attr('fill', function(d) {
          return d[0].color;
        }).
        attr('fill-opacity', 0.75).
        attr('d', pathData.area);
      }

      // Flyouts: ridiculously easy when you don't have to support a dozen features with them.
      var tip;

      // Render points.
      var notDefined = function(d) {
        return _.isUndefined(d.value);
      };
      chartD3.selectAll('.dataPoint').
      remove();
      chartD3.selectAll('.dataPoint').
      data(_.reject(_.flatten(_.map(_.pluck(series, 'method'), byMetric)), notDefined)).
      enter().append('circle').
      classed('dataPoint', true).
      attr('stroke', '#fff').
      attr('fill', function(d) {
        return d.color;
      }).
      attr('cx', function(d) {
        return xScale(d.timestamp);
      }).
      attr('cy', function(d) {
        return yScale(d.value);
      }).
      attr('r', 4).
      on('mouseover', function(d) {
        if (tip) {
          tip.destroy();
        }
        tip = $(this.node).socrataTip({
          trigger: 'now',
          positions: ['top', 'bottom'],
          content: [d.timestamp.format(metricsNS.tooltipFormats[sliceType]) + ' UTC',
            $.commaify(Math.floor(d.value))
          ].join(': ')
        });
      }).
      on('mouseout', function() {
        if (tip) {
          tip.destroy();
        }
      });

      var maxWidthOfLabel = 35;
      var yAxisLabelWidth = Math.max.apply(null, Array.map($('.tickLabel'), function(that) { return $(that).outerWidth(); }));
      var xAxisLabelContainerWidth = $chart.width() - yAxisLabelWidth - (maxWidthOfLabel / 2);
      var maxLabels = Math.floor(xAxisLabelContainerWidth  / maxWidthOfLabel);
      var hideOverlaps = maxLabels < processedData.length;
      var overlapInterval = Math.ceil(processedData.length / maxWidthOfLabel);
      var timespan = moment.duration(endDate - startDate + 1);

      if (sliceType == 'HOURLY') {
        overlapInterval = Math.floor(24 / (maxLabels / timespan.days()));

        if (overlapInterval > 12) {
          overlapInterval = 24;
        } else if (overlapInterval > 6) {
          overlapInterval = 12;
        } else if (overlapInterval > 3) {
          overlapInterval = 6;
        }
      }

      d3.select($chart.find('.tickContainer')[0]).selectAll('.xLabel').
      remove();
      d3.select($chart.find('.tickContainer')[0]).selectAll('.xLabel').
      data(_.pluck(processedData, 'timestamp')).
      enter().append('div').
      classed('xLabel', true).
      each(function(d) {
        var format;
        if (sliceType == 'HOURLY' && d.hour() > 0) {
          format = 'HH:mm';
        } else if (sliceType == 'WEEKLY' && timespan.years() > 0) {
          format = 'MMM D \'YY';
        } else if (sliceType == 'HOURLY' || sliceType == 'DAILY' || sliceType == 'WEEKLY') {
          format = 'MMM D';
        } else {
          format = 'MMM \'YY';
        }

        $(this).text(d.format(format));
      }).
      classed('hide', function(d, i) {
        if (sliceType == 'HOURLY') {
          return hideOverlaps && d.hour() % overlapInterval != 0;
        }

        if (sliceType == 'DAILY') {
          return hideOverlaps && d.day() != 0;
        }

        return hideOverlaps && i % overlapInterval != 0;
      }).
      style('left', function(d) {
        return xScale(d) - ($(this).width() / 2) + 'px';
      }).
      style('top', function() {
        return yScale(yScale.domain()[0]) + 10 + 'px';
      });
    };
    $(window).resize(function() {
      chartD3.setWidth($chart.width());
      renderXDependentStuff();
    });
    renderXDependentStuff();

    // I AM LEGEND
    d3.select($chart.find('.legendContainer')[0]).selectAll('.legendLine').
    remove();
    if (_.any(series, function(item) {
        return item.label;
      })) {
      d3.select($chart.find('.legendContainer')[0]).selectAll('.legendLine').
      data(series).
      enter().append('div').
      classed('legendLine', true).
      each(function(d) {
        $(this).append($.tag2([{
          _: 'span',
          className: 'legendIcon',
          style: {
            'backgroundColor': color(d.method)
          }
        }, {
          _: 'span',
          className: 'legendLabel',
          contents: d.label
        }]));
      });
    }

    var dateFormatString = 'dddd, MMMM Do YYYY';
    var startingDate = moment(startDate).format(dateFormatString);
    var endingDate = moment(endDate).format(dateFormatString);
    var minValue = _.min(combinedData);
    var maxValue = _.max(combinedData);
    var chartTitle = _.get(selectedMetric, 'title', 'Title Unavailable');
    var chartDescription = 'Metrics for dates {0} to {1}'.format(startingDate, endingDate);
    if (_.isFinite(minValue) && _.isFinite(maxValue) && minValue !== maxValue) {
      chartDescription = '{0} with minimum value {1} and maximum value {2}'.
      format(chartDescription, minValue, maxValue);
    }
    _.each(chartD3, function(paperArray) {
      _.each(paperArray, function(paper) {
        paper.title.textContent = chartTitle;
        paper.title.setAttribute('xml:lang', 'en');
        paper.desc.textContent = chartDescription;
        paper.desc.setAttribute('xml:lang', 'en');
      });
    });

  };

  // How to format the tooltips, based on how deep they slice
  metricsNS.tooltipFormats = {
    'HOURLY': 'dddd MMMM D YYYY HH:mm', //'%A %B %e %Y %H:%M',
    'DAILY': 'dddd MMMM D YYYY', //%A %B %e %Y',
    'WEEKLY': 'MMMM D YYYY', //'%B %e %Y',
    'MONTHLY': 'MMMM YYYY', //'%B %Y',
    'YEARLY': 'YYYY' //'%Y'
  };
  metricsNS.intervalTypes = {
    'HOURLY': 'hour',
    'DAILY': 'day',
    'WEEKLY': 'week',
    'MONTHLY': 'month',
    'YEARLY': 'year'
  };
})();
