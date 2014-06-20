;var metricsNS = blist.namespace.fetch('blist.metrics');

/*
 * This takes series data returned from the metrics service
 * and turns it into a properly styled time series area chart
 * @param series: a comma-separated list of series to plot
 */

metricsNS.renderMetricsChartNew = function(data, $chart, startDate, endDate,
    sliceType, series, options)
{
    $chart.show();
    if ((typeof moment) !== 'undefined')
    { moment.lang(blist.locale); }

    var chartD3 = $chart.data('metrics-chart');
    if (!chartD3)
    {
        raphael = new Raphael($chart.get(0), $chart.width(), $chart.height());
        chartD3 = d3.raphael(raphael);
        chartD3.setSize = function(width, height) { raphael.setSize(width, height); };
        $chart.data('metrics-chart', chartD3);

        $chart.prepend($.tag2({ _: 'div', 'class': 'tickContainer' }));
        $chart.append($.tag2({ _: 'div', 'class': 'legendContainer' }));
    }

    // Basic configs
    var chartDims = {
        marginTop: 20,
        marginBottom: 30,
        height: $chart.height()
    };

    var color = d3.scale.ordinal().range([
            '#0071bc',
            '#990503',
            '#0A8C24',
            '#E05D0B',
            '#920BE0'
        ]);

    // Translate data into usable structure.
    var dataRange = [moment(startDate).utc()],
        intervalType = metricsNS.intervalTypes[sliceType],
        expectedDataAmt = moment(endDate).utc().diff(dataRange[0], intervalType);
    // expectedDataAmt should be data.length - 1
    _(expectedDataAmt).times(function()
    { dataRange.push(_.last(dataRange).clone().add(1, intervalType)); });

    var processedData = _.map(dataRange, function(timestamp)
    {
        return {
            timestamp: timestamp,
            metrics: (_.detect(data,
                function(d) { return d['__start__'] == timestamp; }) || {}).metrics
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
        function(memo, serie) { return memo.concat(byMetric(serie.method)); }, []), 'value');

    // yScale stuff, like ticks, are static.

    // Putting in some extra scoping in order to make the code flow a little more logically.
    var yScale, ticks;
    (function() {
        var extent = d3.extent(combinedData),
            min = extent[0],
            max = extent[1];
        yScale = d3.scale.linear()
            .domain([ min, max ])
            .range([ chartDims.height - chartDims.marginBottom, chartDims.marginTop ]);

        ticks = yScale.ticks(chartDims.height / 80)

        var tickSize = ticks.length > 1 ? Math.abs(ticks[0] - ticks[1]) : 0,
            domain = yScale.domain();

        yScale.domain([_.first(ticks) > min ? _.first(ticks) - tickSize : domain[0],
                       _.last(ticks)  < max ? _.last(ticks)  + tickSize : domain[1]]);

        ticks.unshift(yScale.domain()[0]);
        ticks.push(   yScale.domain()[1]);
    })();

    // Render ticks.
    d3.select($chart.find('.tickContainer')[0]).selectAll('.tick')
        .remove();
    var tickLines = d3.select($chart.find('.tickContainer')[0]).selectAll('.tick')
        .data(ticks);
    var tickRootEnter = tickLines
        .enter().append('div')
            .classed('tick', true)
            .classed('origin', function(d) { return d === 0; })
            .style('top', function(d) { return yScale(d)+'px'; });
        tickRootEnter.append('div')
            .classed('tickLine', true);
        tickRootEnter.append('div')
            .classed('tickLabel', true)
            .each(function(d) { $(this).text($.commaify(d)); });

    // xScale stuff is resizable!

    var renderXDependentStuff = function()
    {
        var xScale = d3.scale.linear()
            .domain([_.first(processedData).timestamp,
                     _.last(processedData).timestamp])
            .range([ 50, $chart.parent().width() - 30 ]);

        // Render lines.
        var pathData = {
            area: d3.svg.area().x(function(d) { return xScale(d.timestamp); })
                               .y(function(d) { return yScale(d.value); })
                               .y0(chartDims.height - chartDims.marginBottom)
                               .defined(function(d) { return !_.isUndefined(d.value); }),
            line: d3.svg.line().x(function(d) { return xScale(d.timestamp); })
                               .y(function(d) { return yScale(d.value); })
                               .defined(function(d) { return !_.isUndefined(d.value); })
        };

        // Because this function still assumes highcharts. -_-
        var lineType = _.first(_.uniq($.deepPluck(series, 'options.type'))) || 'area';
        var average = function(ary)
            { return _.inject(ary, function(m, a) { return m + a; }, 0) / ary.length; };

        chartD3.selectAll('.dataLine')
            .remove();
        chartD3.selectAll('.dataLine')
            // Sort by averages as an easy way to rank backgrounds.
            // Using _.sortBy because d3#sort isn't implemented in d34raphael.
            .data(_.sortBy(_.map(_.pluck(series, 'method'), byMetric)),
                function(a, b) { return average(a) < average(b); })
            .enter().append('path')
                .classed('dataLine', true)
                .attr('stroke-width', 4)
                .attr('stroke', function(d) { return d[0].color; })
                .attr('d', pathData.line);

        // Use a second svg#path to avoid the thick bottom border.
        if (lineType == 'area')
        {
            chartD3.selectAll('.dataLine')
                .append('path')
                    // Use the same class in order to remove properly.
                    .classed('dataLine', true)
                    .attr('stroke-width', 0)
                    .attr('fill',   function(d) { return d[0].color; })
                    .attr('fill-opacity', 0.75)
                    .attr('d', pathData.area);
        }

        // Flyouts: ridiculously easy when you don't have to support a dozen features with them.
        var tip;

        // Render points.
        var notDefined = function(d) { return _.isUndefined(d.value); };
        chartD3.selectAll('.dataPoint')
            .remove();
        chartD3.selectAll('.dataPoint')
            .data(_.reject(_.flatten(_.map(_.pluck(series, 'method'), byMetric)), notDefined))
            .enter().append('circle')
                .classed('dataPoint', true)
                .attr('stroke', '#fff')
                .attr('fill', function(d) { return d.color; })
                .attr('cx',   function(d) { return xScale(d.timestamp); })
                .attr('cy',   function(d) { return yScale(d.value); })
                .attr('r', 4)

                .on('mouseover', function(d)
                {
                    if (tip) { tip.destroy(); }
                    tip = $(this.node).socrataTip({ trigger: 'now',
                        positions: ['top', 'bottom'],
                        content: [d.timestamp.format(metricsNS.tooltipFormats[sliceType]) + ' UTC',
                            $.commaify(Math.floor(d.value))].join(': ')
                    });
                })
                .on('mouseout', function(d)
                {
                    if (tip) { tip.destroy(); }
                });

        var timespan = moment.duration(endDate - startDate + 1),
            hideOverlaps = $chart.width() / 35 < processedData.length;
        d3.select($chart.find('.tickContainer')[0]).selectAll('.xLabel')
            .remove();
        d3.select($chart.find('.tickContainer')[0]).selectAll('.xLabel')
            .data(_.pluck(processedData, 'timestamp'))
            .enter().append('div')
                .classed('xLabel', true)
                .classed('hide', function(d, i) { return hideOverlaps && i % 2 == 1; })
                .each(function(d)
                {
                    var format;
                    if (sliceType == 'HOURLY' && d.hour() > 0)
                    { format = 'HH:MM'; }
                    else if (timespan.asDays() < 30)
                    { format = 'MMM D'; }
                    else
                    { format = 'MMM \'YY'; }

                    $(this).text(d.format(format));
                })
                .style('left', function(d) { return xScale(d) - ($(this).width() / 2) + 'px'; })
                .style('top',  function()  { return yScale(yScale.domain()[0]) + 10 + 'px'; });
    };
    $(window).resize(function() {
        chartD3.setSize($chart.width(), $chart.height());
        renderXDependentStuff();
    });
    renderXDependentStuff();

    // I AM LEGEND
    d3.select($chart.find('.legendContainer')[0]).selectAll('.legendLine')
        .remove();
    if (_.any(series, function(serie) { return serie.label; }))
    {
        d3.select($chart.find('.legendContainer')[0]).selectAll('.legendLine')
            .data(series)
            .enter().append('div')
                .classed('legendLine', true)
                .each(function(d)
                {
                    $(this).append($.tag2([
                        { _: 'span', className: 'legendIcon',
                            style: { 'backgroundColor': color(d.method) } },
                        { _: 'span', className: 'legendLabel', contents: d.label }
                    ]));
                });
    }
};

metricsNS.renderMetricsChart = function(data, $chart, startDate, endDate,
    sliceType, series, options)
{
    if (blist.feature_flags.d3_metrics === true || $.urlParam(window.location.href, 'charts') === 'nextgen')
    { return metricsNS.renderMetricsChartNew.apply(this, arguments); }

    if (data.length < 1)
    { return; }

    var pointInterval = data[0]['__end__'] - data[0]['__start__'] + 1,
        seriesDefaults = {
            lineWidth: 4,
            pointInterval: pointInterval,
            pointStart: startDate,
            stacking: options.stacking
        },
        seriesToPlot = [],
        showLabels = false,
        i = 0,
        lineColors = [
            '#0071bc',
            '#990503',
            '#0A8C24',
            '#E05D0B',
            '#920BE0'
        ];

    // Make highchart series object for each item
    _.each(series, function(s)
    {
        // Fill in any holes not returned by balboa
        var ungappedData = [];
        var intervalEnd = 0;

        for(var k = startDate; k < data[0]['__start__']; k += pointInterval)
        {
            ungappedData.push(0);
        }

         _.each(data, function(row)
        {
            if (intervalEnd > 0 &&
                (row['__start__'] - intervalEnd) > 1)
            {
                for (var j = 0; j < ((row['__start__'] - intervalEnd) / pointInterval) - 1; j++)
                { ungappedData.push(0); }
            }
            intervalEnd = row['__end__'];
            var pointData = (row.metrics || {});
            if (s.numerator)
            {
                ungappedData.push((pointData[s.numerator] /
                    (pointData[s.denominator] || 1) || 0));
            }
            else
            {
                ungappedData.push(pointData[s.method] || 0);
            }
        });

        for(var k = intervalEnd; k < endDate; k += pointInterval)
        {
            ungappedData.push(0);
        }

        if ($chart.data(metricsNS.TRANSFORM))
        {
            ungappedData = metricsNS.transforms[$chart.data(metricsNS.TRANSFORM)](ungappedData);
        }

        var plot = $.extend({}, seriesDefaults, s.options, {
            data: ungappedData,
            lineColor: lineColors[i % lineColors.length],
            marker: {
                lineColor: lineColors[i % lineColors.length]
            }
        });

        if (!$.isBlank(s.label))
        {
            plot.name = s.label;
            showLabels = true;
        }

        seriesToPlot.push(plot);
        i++;
    });

    // Kill off an existing chart if re-drawing to avoid leaks
    if (!$.isBlank($chart.data('highchart')) &&
        _.isFunction($chart.data('highchart').destroy))
    {
        $chart.data('highchart').destroy();
    }

    $chart.show();

    // Attributes specific to this chart
    var chartAttributes = $.extend(true, {}, metricsNS.chartDefaults, {
        chart: {
            renderTo: $chart.attr('id'),
            type: options.chartType
        },
        xAxis: {
            maxZoom: pointInterval
        },
        series: seriesToPlot,
        tooltip: {
            formatter: function() {
                return '' + Highcharts.dateFormat(metricsNS.tooltipFormats[sliceType],
                    this.x) + ': ' + Highcharts.numberFormat(this.y, 0);
            }
        }
    });

    // If the series specified labels
    if (showLabels)
    { chartAttributes.legend.enabled = true; }

    // Keep track of the chart object to properly destroy it on refresh
    $chart
        .data('highchart',
            new Highcharts.Chart($.extend(true, chartAttributes, options || {})));
};

// How to format the tooltips, based on how deep they slice
if (blist.feature_flags.d3_metrics === true || $.urlParam(window.location.href, 'charts') === 'nextgen')
{ metricsNS.tooltipFormats = {
    'HOURLY': 'dddd MMMM D YYYY HH:mm', //'%A %B %e %Y %H:%M',
    'DAILY': 'dddd MMMM D YYYY', //%A %B %e %Y',
    'WEEKLY': 'MMMM D YYYY', //'%B %e %Y',
    'MONTHLY': 'MMMM YYYY', //'%B %Y',
    'YEARLY': 'YYYY', //'%Y'
}; }
else
{ metricsNS.tooltipFormats = {
    'HOURLY': '%A %B %e %Y %H:%M',
    'DAILY': '%A %B %e %Y',
    'WEEKLY': '%B %e %Y',
    'MONTHLY': '%B %Y',
    'YEARLY': '%Y'
}; }
metricsNS.intervalTypes = {
    'HOURLY': 'hour',
    'DAILY': 'day',
    'WEEKLY': 'week',
    'MONTHLY': 'month',
    'YEARLY': 'year'
};


metricsNS.chartDefaults = {
    chart: {
        height: 350,
        margin: [20, 0, 30, 0],
        type: 'area',
        zoomType: 'x'
    },
    credits: {
        enabled: false
    },
    title: {
        text: null
    },
    navigation: {
        menuStyle: {
            'float': 'right'
        }
    },
    xAxis: {
        type: 'datetime',
        title: {
            text: null
        },
        tickPosition:  'inside',
        showLastLabel:  false,
        minPadding: 0.01,
        maxPadding: 0.01,
        dateTimeLabelFormats: {
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%b %e %H:%M',
            week: '%b %e',
            month: '%b \'%y',
            day: '%b %e'
        },
        labels: {
            align: 'left',
            x: 2,
            y: 12
        }
    },
    yAxis: {
        title: {
            text: null
        },
        tickPosition: 'inside',
        showFirstLabel: false,
        labels: {
            align: 'left',
            formatter: function() {
                if (this.value >= 1000) {
                    return Highcharts.numberFormat(this.value, 0);
                } else {
                    return this.value;
                }
            },
            y: -2,
            x: 2
        }
    },
    colors: [
        '#bee6f6',
        '#ee3c39',
        '#0A8C24',
        '#E05D0B',
        '#920BE0'
    ],
    legend: {
        backgroundColor: '#fff',
        enabled: false,
        align: 'right',
        verticalAlign: 'top',
        y: 5,
        x: 0
    },
    plotOptions: {
        area: {
            marker: {
                fillColor: '#fff',
                lineWidth: 2,
                symbol: 'circle'
            }
        }
    }
};
