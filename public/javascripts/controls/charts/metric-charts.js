;var metricsNS = blist.namespace.fetch('blist.metrics');

/*
 * This takes series data returned from the metrics service
 * and turns it into a properly styled time series area chart
 * @param series: a comma-separated list of series to plot
 */

metricsNS.renderMetricsChart = function(data, $chart, startDate, endDate,
    sliceType, series, options)
{
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

        var plot = $.extend({}, seriesDefaults, {
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
metricsNS.tooltipFormats = {
    'HOURLY': '%A %B %e %Y %H:%M',
    'DAILY': '%A %B %e %Y',
    'WEEKLY': '%B %e %Y',
    'MONTHLY': '%B %Y',
    'YEARLY': '%Y'
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
                return this.value;
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
