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
                chartObj._chartType = chartObj.settings.chartType;
            },

            columnsLoaded: function()
            {
                var chartObj = this;

                // Set up x-axis
                var usesXCol = chartObj._view.displayType != 'imagesparkline' &&
                    (_.isUndefined(chartObj._displayConfig.fixedCount) ||
                    chartObj._displayConfig.fixedCount > 0);
                if (usesXCol) { chartObj._xColumn = chartObj._dataColumns[0]; }
                if (!isDateTime(chartObj) && usesXCol)
                { chartObj._xCategories = []; }

                // Cache data
                chartObj._seriesCache = [];

                // Grab all remaining cols; pick out numeric columns for data,
                // and associate all following non-nuneric columns with that line
                var cols = chartObj._dataColumns.slice(usesXCol ? 1 : 0);
                chartObj._yColumns = [];
                _.each(cols, function(c)
                {
                    if (_.include(['number', 'money', 'percent'], c.renderTypeName))
                    { chartObj._yColumns.push({data: c}); }
                    else
                    {
                        var obj = chartObj._yColumns[chartObj._yColumns.length - 1];
                        if (c.renderTypeName == 'text' && _.isUndefined(obj.title))
                        { obj.title = c; }
                        else
                        {
                            obj.metadata = obj.metadata || [];
                            obj.metadata.push(c);
                        }
                    }
                });

                // Set up y-axes
                if (chartObj._reverseOrder) { chartObj._yColumns.reverse(); }
                _.each(chartObj._yColumns, function(cs)
                {
                    var series = {name: $.htmlEscape(cs.data.name),
                        data: [], column: cs.data};
                    if (!_.isUndefined(chartObj.chart))
                    { chartObj.chart.addSeries(series, false); }
                    if (!_.isUndefined(chartObj.secondChart))
                    { chartObj.secondChart.addSeries(series, false); }
                    chartObj._seriesCache.push(series);
                });

                // Adjust scale to make sure series are synched with axis
                if (!_.isUndefined(chartObj.chart))
                { chartObj.chart.xAxis[0].setScale(); }
                if (!_.isUndefined(chartObj.secondChart))
                { chartObj.secondChart.xAxis[0].setScale(); }

                // Register columns as loaded, render data if needed
                chartObj._columnsLoaded = true;
                if (!_.isUndefined(chartObj._pendingRows))
                {
                    _.each(chartObj._pendingRows,
                        function(r) { chartObj.renderRow(r); });
                    delete chartObj._pendingRows;
                    chartObj.rowsRendered();
                }

                // Once we've gotten the columns, create the chart
                createChart(chartObj);
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
                var basePt = xPoint(chartObj, row);

                if (!_.isUndefined(chartObj._xCategories))
                {
                    var xCat = row[chartObj._xColumn.dataIndex];
                    if (_.isNull(xCat) || _.isUndefined(xCat)) { xCat = ''; }
                    xCat = $.htmlEscape(xCat);
                    chartObj._xCategories.push(xCat);
                }

                // Render data for each series
                _.each(chartObj._yColumns, function(cs, i)
                {
                    var value = parseFloat(row[cs.data.dataIndex]);
                    if (_.isNaN(value)) { value = null; }

                    // First check if this should be subsumed into a remainder
                    if (!_.isNull(value) &&
                        !_.isUndefined(chartObj._displayConfig.pieJoinAngle) &&
                        !_.isUndefined(cs.data.aggregate) &&
                        cs.data.aggregate.type == 'sum' &&
                        value / cs.data.aggregate.value * 100 <
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
                        var point = yPoint(chartObj, row, value, i, basePt);
                        if (!_.isUndefined(chartObj.chart))
                        { chartObj.chart.series[i].addPoint(point, false); }
                        if (!_.isUndefined(chartObj.secondChart))
                        { chartObj.secondChart.series[i].addPoint(point, false); }
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
                    var otherPt = xPoint(chartObj, null, 'Other');
                    if (!_.isUndefined(chartObj._xCategories))
                    { chartObj._xCategories.push('Other'); }
                    _.each(chartObj._seriesRemainders, function(sr, i)
                    {
                        if (sr > 0)
                        {
                            var point = yPoint(chartObj, null, sr, i, otherPt);
                            if (!_.isUndefined(chartObj.chart))
                            { chartObj.chart.series[i].addPoint(point, false); }
                            if (!_.isUndefined(chartObj.secondChart))
                            { chartObj.secondChart.series[i].addPoint(
                                point, false); }
                            chartObj._seriesCache[i].data.push(point);
                        }
                    });
                }

                if (!_.isUndefined(chartObj.chart))
                {
                    chartObj.chart.xAxis[0].setCategories(
                        chartObj._xCategories, false);
                    chartObj.chart.redraw();
                }
                if (!_.isUndefined(chartObj.secondChart))
                {
                    chartObj.secondChart.xAxis[0].setCategories(
                        chartObj._xCategories, false);
                    chartObj.secondChart.redraw();
                }
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
                    if (!_.isUndefined(chartObj.chart))
                    {
                        chartObj.chart.destroy();
                        delete chartObj.chart;
                        if (!_.isUndefined(chartObj.secondChart))
                        {
                            chartObj.secondChart.destroy();
                            delete chartObj.secondChart;
                        }
                        createChart(chartObj);
                    }
                }, 500);
            },

            resetData: function()
            {
                var chartObj = this;
                delete chartObj._xCategories;
                delete chartObj._xColumn;
                delete chartObj._yColumns;
                delete chartObj._columnsLoaded;
                delete chartObj._pendingRows;
                delete chartObj._seriesRemainders;
                delete chartObj._seriesCache;
                delete chartObj._curMin;
                delete chartObj._curMax;
                delete chartObj._loadedOnce;

                if (!_.isUndefined(chartObj.chart))
                {
                    chartObj.chart.destroy();
                    delete chartObj.chart;
                }
                if (!_.isUndefined(chartObj.secondChart))
                {
                    chartObj.secondChart.destroy();
                    delete chartObj.secondChart;
                }
            }
        }
    }));

    var createChart = function(chartObj)
    {
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

        if (isDateTime(chartObj)) { chartMargin[2] = 120; }

        // For some reason, bar charts are rendered with the data in the reverse
        // order; while the legend is correct (perhaps due to the inverted axis?).
        // By manually flipping the order of data, colors, and legend, we can
        // make it look correct
        chartObj._reverseOrder = chartObj._chartType == 'bar';

        // Make a copy of colors so we don't reverse the original
        var colors = chartObj._displayConfig.colors.slice();
        if (chartObj._reverseOrder) { colors.reverse(); }

        // Map recorded type to what Highcharts wants
        var seriesType = chartObj._chartType;
        if (seriesType == 'line' && chartObj._displayConfig.smoothLine)
        { seriesType = 'spline'; }
        if (seriesType == 'timeline') { seriesType = 'line'; }

        // Main config
        var chartConfig =
        {
            chart: {
                renderTo: chartObj.$dom()[0],
                defaultSeriesType: seriesType,
                events: { load: function() { chartObj.finishLoading(); } },
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
            title: { text: null },
            xAxis: { title:
                { enabled: xTitle !== '' && !_.isUndefined(xTitle), text: xTitle },
                dateTimeLabelFormats: {
                    day: '%e %b',
                    week: '%e %b',
                    month: '%b %Y'
                } },
            yAxis: { title:
                { enabled: yTitle !== '' && !_.isUndefined(yTitle), text: yTitle } }
        };

        // If we already have data loaded, use it
        if (!_.isUndefined(chartObj._seriesCache))
        { chartConfig.series = chartObj._seriesCache; }

        // If we already have categories loaded, use it
        if (!_.isUndefined(chartObj._xCategories))
        { chartConfig.xAxis.categories = chartObj._xCategories; }

        if (isDateTime(chartObj))
        {
            chartConfig.xAxis.type = 'datetime';
            chartConfig.tooltip = { formatter: function()
            {
                return '<p><strong>' + this.series.name +
                    (this.point.name && this.series.name != this.point.name ?
                        ': ' + this.point.name : '') + '</strong></p>' +
                    (this.point.subtitle ?
                        '<p>' + this.point.subtitle + '</p>' : '') +
                    '<p>' + this.y + ' at ' +
                    blist.data.types.date.filterRender(this.x,
                        this.series.options.column) + '</p>';
            } };
        }


        // Set up config for this particular chart type
        var typeConfig = {allowPointSelect: true,
            marker: {enabled: chartObj._displayConfig.pointSize != '0'} };

        // If we already loaded and are just re-rendering, don't animate
        if (chartObj._loadedOnce) { typeConfig.animation = false; }

        // Make sure lineSize is defined, so we don't hide the line by default
        if (!_.isUndefined(chartObj._displayConfig.lineSize))
        { typeConfig.lineWidth = parseInt(chartObj._displayConfig.lineSize); }

        // Type config goes under the type name
        chartConfig.plotOptions[seriesType] = typeConfig;

        // Create the chart
        chartObj.startLoading();
        chartObj.chart = new Highcharts.Chart(chartConfig);

        // Set colors after chart is created so they don't get merged with the
        // default colors; we want to override them, instead
        chartObj.chart.options.colors = colors;

        if (isDateTime(chartObj)) { createDateTimeOverview(chartObj); }

        chartObj._loadedOnce = true;
    };

    var xPoint = function(chartObj, row, value)
    {
        var pt = {x: value};

        if (isDateTime(chartObj))
        {
            if (!_.isNull(row) && !_.isUndefined(row))
            { pt.x = row[chartObj._xColumn.dataIndex] * 1000; }
            else { pt.x = ''; }
        }
        else if (!_.isUndefined(chartObj._xCategories))
        { pt.x = chartObj._xCategories.length; }

        return pt;
    };

    var yPoint = function(chartObj, row, value, seriesIndex, basePt)
    {
        var point = {y: value};
        if (!_.isNull(basePt) && !_.isUndefined(basePt))
        { _.extend(point, basePt); }

        var colSet = chartObj._yColumns[seriesIndex];
        if (!_.isUndefined(colSet.title) && !_.isNull(row))
        { point.name = $.htmlEscape(row[colSet.title.dataIndex]); }

        else if (chartObj._chartType == 'pie')
        { point.name = chartObj._xCategories[point.x]; }

        else { point.name = chartObj._seriesCache[seriesIndex].name; }

        if (!_.isUndefined(colSet.metadata) && !_.isNull(row))
        {
            point.subtitle = '';
            _.each(colSet.metadata, function(c)
            { point.subtitle += $.htmlEscape(row[c.dataIndex]); });
        }

        if (chartObj._chartType == 'pie')
        {
            point.color = chartObj._displayConfig
                .colors[chartObj._seriesCache[seriesIndex].data.length %
                chartObj._displayConfig.colors.length];
        }
        return point;
    };

    var isDateTime = function(chartObj)
    {
        return !_.isUndefined(chartObj._xColumn) &&
            chartObj._xColumn.renderTypeName == 'date';
    };


    var createDateTimeOverview = function(chartObj)
    {
        var $secondChart = chartObj.$dom().find('.secondaryChart');
        if ($secondChart.length < 1)
        {
            chartObj.$dom().append('<div class="secondaryChart"></div>');
            $secondChart = chartObj.$dom().find('.secondaryChart');
        }

        var margins = chartObj.chart.options.chart.margin;
        margins[0] = 10;
        margins[2] = 60;

        var config = {
            chart: {
                renderTo: $secondChart[0],
                defaultSeriesType: 'line',
                margin: margins,
                zoomType: 'x',
                events: {
                    selection: function(event)
                    { return secondChartSelect(chartObj, event); }
                }
            },
            colors: chartObj.chart.options.colors,
            credits: { enabled: false },
            legend: { enabled: false },
            plotOptions: { line: {
                animation: !chartObj._loadedOnce,
                lineWidth: 1,
                marker: { enabled: false },
                shadow: false
            } },
            title: { text: null },
            tooltip: { formatter: function() { return false; } },
            xAxis: { type: 'datetime', title: { enabled: false },
                minPadding: 0.03, maxPadding: 0.03,
                dateTimeLabelFormats:
                    chartObj.chart.options.xAxis.dateTimeLabelFormats },
            yAxis: { labels: { enabled: false }, title: { enabled: false } }
        };

        // If we already have data loaded, use it
        if (!_.isUndefined(chartObj._seriesCache))
        { config.series = chartObj._seriesCache; }

        // If we already have categories loaded, use it
        if (!_.isUndefined(chartObj._xCategories))
        { config.xAxis.categories = chartObj._xCategories; }

        chartObj.secondChart = new Highcharts.Chart(config);

        if (_.isUndefined(chartObj._curMin))
        {
            var extremes = chartObj.secondChart.xAxis[0].getExtremes();
            chartObj._curMax = extremes.max;
            chartObj._curMin = (extremes.max - extremes.min) * 0.7 + extremes.min;
        }
        adjustDetailBounds(chartObj, chartObj._curMin, chartObj._curMax);
    };

    var secondChartSelect = function(chartObj, event)
    {
        var eAxis = event.xAxis[0];
        adjustDetailBounds(chartObj, eAxis.min, eAxis.max);
        return false;
    };

    var adjustDetailBounds = function(chartObj, min, max)
    {
        chartObj._curMin = min;
        chartObj._curMax = max;

        var detailAxis = chartObj.chart.xAxis[0];
        detailAxis.setExtremes(min, max);

        var overviewAxis = chartObj.secondChart.xAxis[0];
        var overviewExtremes = overviewAxis.getExtremes();

        overviewAxis.removePlotLine('min-value');
        overviewAxis.addPlotLine({
            id: 'min-value',
            value: min,
            width: 1,
            color: 'rgba(0, 0, 0, 0.5)'
        });

        overviewAxis.removePlotBand('mask-before');
        overviewAxis.addPlotBand({
            id: 'mask-before',
            from: overviewExtremes.min,
            to: min,
            color: 'rgba(0, 0, 0, 0.2)'
        });

        overviewAxis.removePlotLine('max-value');
        overviewAxis.addPlotLine({
            id: 'max-value',
            value: max,
            width: 1,
            color: 'rgba(0, 0, 0, 0.5)'
        });

        overviewAxis.removePlotBand('mask-after');
        overviewAxis.addPlotBand({
            id: 'mask-after',
            from: max,
            to: overviewExtremes.max,
            color: 'rgba(0, 0, 0, 0.2)'
        });
    };

})(jQuery);
