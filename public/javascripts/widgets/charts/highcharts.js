(function($)
{
    $.socrataChart.highcharts = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataChart.highcharts.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataChart.highcharts, $.socrataChart.extend(
    {
        defaults:
        {
        },

        prototype:
        {
            initializeChart: function()
            {
                var chartObj = this;
                if (chartObj._invalid) { return; }
                createChart(chartObj);
            },

            columnsLoaded: function()
            {
                var chartObj = this;

                // Set up x-axis
                chartObj._xCategories = [];
                var usesXCol = chartObj.settings.chartType != 'imagesparkline';
                if (usesXCol) { chartObj._xColumn = chartObj._dataColumns[0]; }

                // Cache data
                chartObj._seriesCache = [];

                // Set up y-axis
                chartObj._yColumns = chartObj._dataColumns.slice(usesXCol ? 1 : 0);
                if (chartObj._reverseOrder) { chartObj._yColumns.reverse(); }
                _.each(chartObj._yColumns, function(c)
                {
                    var series = {name: c.name, data: []};
                    chartObj.chart.addSeries(series, false);
                    chartObj._seriesCache.push(series);
                });

                // Adjust scale to make sure series are synched with axis
                chartObj.chart.xAxis[0].setScale();

                // Register columns as loaded, render data if needed
                chartObj._columnsLoaded = true;
                if (!_.isUndefined(chartObj._pendingRows))
                {
                    _.each(chartObj._pendingRows,
                        function(r) { chartObj.renderRow(r); });
                    delete chartObj._pendingRows;
                    chartObj.rowsRendered();
                }
            },

            renderRow: function(row)
            {
                var chartObj = this;
                if (!chartObj._columnsLoaded)
                {
                    chartObj._pendingRows = chartObj._pendingRows || [];
                    chartObj._pendingRows.push(row);
                    return true;
                }

                // Get useable value for x-axis
                var xVal = null;
                if (!_.isUndefined(chartObj._xColumn))
                { xVal = row[chartObj._xColumn.dataIndex]; }
                if (_.isNull(xVal)) { xVal = ''; }
                xVal = $.htmlEscape(xVal);
                chartObj._xCategories.push(xVal);

                // Render data for each series
                _.each(chartObj._yColumns, function(c, i)
                {
                    var value = parseFloat(row[c.dataIndex]);
                    if (_.isNaN(value)) { value = null; }

                    // First check if this should be subsumed into a remainder
                    if (!_.isNull(value) &&
                        !_.isUndefined(chartObj._displayConfig.pieJoinAngle) &&
                        !_.isUndefined(c.aggregate) && c.aggregate.type == 'sum' &&
                        value / c.aggregate.value * 100 <
                            chartObj._displayConfig.pieJoinAngle)
                    {
                        chartObj._seriesRemainders =
                            chartObj._seriesRemainders || [];
                        chartObj._seriesRemainders[i] =
                            chartObj._seriesRemainders[i] || 0;
                        chartObj._seriesRemainders[i] += value;
                    }
                    else
                    {
                        // Render point and cache it
                        var point = {x: chartObj._xCategories.length - 1,
                            y: value, name: xVal};
                        if (chartObj._chartType == 'pie')
                        {
                            point.color = chartObj._displayConfig
                                .colors[chartObj._seriesCache[i].data.length %
                                    chartObj._displayConfig.colors.length];
                        }
                        chartObj.chart.series[i].addPoint(point, false);
                        chartObj._seriesCache[i].data.push(point);
                    }
                });
                return true;
            },

            rowsRendered: function()
            {
                var chartObj = this;
                if (!chartObj._columnsLoaded) { return; }

                // Check if there are remainders to stick on the end
                if (!_.isUndefined(chartObj._seriesRemainders))
                {
                    var otherName = 'Other';
                    chartObj._xCategories.push(otherName);
                    _.each(chartObj._seriesRemainders, function(sr, i)
                    {
                        if (sr > 0)
                        {
                            var point = {x: chartObj._xCategories.length - 1,
                                y: sr, name: otherName};
                            if (chartObj._chartType == 'pie')
                            {
                                point.color = chartObj._displayConfig
                                    .colors[chartObj._seriesCache[i].data.length %
                                        chartObj._displayConfig.colors.length];
                            }
                            chartObj.chart.series[i].addPoint(point, false);
                            chartObj._seriesCache[i].data.push(point);
                        }
                    });
                }

                chartObj.chart.xAxis[0].setCategories(chartObj._xCategories, false);
                chartObj.chart.redraw();
            },

            resizeHandle: function(event)
            {
                var chartObj = this;

                // Since we have to re-create the whole chart, set up a timer to
                // wait until they've paused/finished dragging
                if (!_.isUndefined(chartObj._resizeTimer))
                { clearTimeout(chartObj._resizeTimer); }

                chartObj._resizeTimer = setTimeout(function()
                {
                    delete chartObj._resizeTimer;
                    chartObj.chart.destroy();
                    createChart(chartObj);
                }, 500);
            },

            resetData: function()
            {
                var chartObj = this;
                delete chartObj._columnsLoaded;
                delete chartObj._pendingRows;
                delete chartObj._seriesRemainders;
                delete chartObj._seriesCache;

                chartObj.chart.destroy();
                createChart(chartObj);
            }
        }
    }));

    var createChart = function(chartObj)
    {
        // Map recorded type to what Highcharts wants
        var typeMapping = {
            'areachart': 'area',
            'barchart': 'bar',
            'columnchart': 'column',
            'imagesparkline': 'line',
            'linechart': 'line',
            'piechart': 'pie'
        };
        chartObj._chartType = typeMapping[chartObj.settings.chartType];
        if (chartObj._chartType == 'line' && chartObj._displayConfig.smoothLine)
        { chartObj._chartType = 'spline'; }

        var xTitle = chartObj._displayConfig.titleX;
        var yTitle = chartObj._displayConfig.titleY;

        // Configure legend position -- it is absolutely positioned, and
        // chart margins need to be adjusted to accommodate it
        var legendPos = chartObj._displayConfig.legend;
        var legendStyle = {};
        var chartMargin = [10, 50, 60, 80];
        switch (legendPos)
        {
            case 'top':
                chartMargin[0] = 40;
                legendStyle.top = '5px';
                break;
            case 'left':
                legendStyle.left = '10px';
                legendStyle.top = '30%';
                chartMargin[3] = 200;
                break;
            case 'right':
                legendStyle.left = '';
                legendStyle.right = '10px';
                legendStyle.top = '30%';
                chartMargin[1] = 180;
                break;
        }

        // For some reason, bar charts are rendered with the data in the reverse
        // order; while the legend is correct (perhaps due to the inverted axis?).
        // By manually flipping the order of data, colors, and legend, we can
        // make it look correct
        chartObj._reverseOrder = chartObj._chartType == 'bar';

        // Make a copy of colors so we don't reverse the original
        var colors = chartObj._displayConfig.colors.slice();
        if (chartObj._reverseOrder) { colors.reverse(); }

        // Main config
        var chartConfig =
        {
            chart: {
                renderTo: chartObj.$dom()[0],
                defaultSeriesType: chartObj._chartType,
                inverted: chartObj._chartType == 'bar',
                margin: chartMargin
            },
            colors: colors,
            credits: { enabled: false },
            legend: { enabled: legendPos != 'none',
                layout: _.include(['left', 'right'], legendPos) ?
                    'vertical' : 'horizontal',
                reversed: chartObj._reverseOrder,
                style: legendStyle },
            plotOptions: {},
            title: { style: { display: 'none' } },
            xAxis: { title:
                { enabled: xTitle !== '', text: xTitle } },
            yAxis: { title:
                { enabled: yTitle !== '', text: yTitle } }
        };

        // If we already have data loaded, use it
        if (!_.isUndefined(chartObj._seriesCache))
        { chartConfig.series = chartObj._seriesCache; }

        // If we already have categories loaded, use it
        if (!_.isUndefined(chartObj._xCategories))
        { chartConfig.xAxis.categories = chartObj._xCategories; }


        // Set up config for this particular chart type
        var typeConfig = {allowPointSelect: true,
            marker: {enabled: chartObj._displayConfig.pointSize != '0'} };

        // If we have data that is being re-rendered, don't animate it
        if (!_.isUndefined(chartObj._seriesCache))
        { typeConfig.animation = false; }

        // Make sure lineSize is defined, so we don't hide the line by default
        if (!_.isUndefined(chartObj._displayConfig.lineSize))
        { typeConfig.lineWidth = parseInt(chartObj._displayConfig.lineSize); }

        // Type config goes under the type name
        chartConfig.plotOptions[chartObj._chartType] = typeConfig;

        // Create the chart
        chartObj.chart = new Highcharts.Chart(chartConfig);

        // Set colors after chart is created so they don't get merged with the
        // default colors; we want to override them, instead
        chartObj.chart.options.colors = colors;
    };

})(jQuery);
