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
                createChart(chartObj);
            },

            columnsLoaded: function()
            {
                var chartObj = this;

                chartObj._xCategories = [];
                var usesXCol = chartObj.settings.chartType != 'imagesparkline';
                if (usesXCol) { chartObj._xColumn = chartObj._dataColumns[0]; }
                chartObj._yColumns = [];
                var yCols = chartObj._dataColumns.slice(usesXCol ? 1 : 0);
                if (chartObj._reverseOrder) { yCols.reverse(); }

                for (var i = 0; i < yCols.length; i++)
                {
                    var c = yCols[i];
                    chartObj._yColumns.push(c);
                    chartObj.chart.addSeries({name: c.name, data: []}, false);
                }
                // Adjust scale to make sure series are synched with axis
                chartObj.chart.xAxis[0].setScale();
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

                var xVal = null;
                if (!_.isUndefined(chartObj._xColumn))
                { xVal = row[chartObj._xColumn.dataIndex]; }
                if (_.isNull(xVal)) { xVal = ''; }
                xVal = $.htmlEscape(xVal);
                chartObj._xCategories.push(xVal);
                _.each(chartObj._yColumns, function(c, i)
                {
                    var value = parseInt(row[c.dataIndex]);
                    if (_.isNaN(value)) { value = null; }

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
                        chartObj.chart.series[i].addPoint(
                            [xVal, value], false);
                    }
                });
                return true;
            },

            rowsRendered: function()
            {
                var chartObj = this;
                if (!chartObj._columnsLoaded) { return; }

                if (!_.isUndefined(chartObj._seriesRemainders))
                {
                    _.each(chartObj._seriesRemainders, function(sr, i)
                    {
                        if (sr > 0)
                        { chartObj.chart.series[i].addPoint(['Other', sr], false); }
                    });
                }
                chartObj.chart.xAxis[0].setCategories(chartObj._xCategories, false);
                chartObj.chart.redraw();
            },

            resetData: function()
            {
                var chartObj = this;
                delete chartObj._columnsLoaded;
                delete chartObj._pendingRows;
                delete chartObj._seriesRemainders;

                chartObj.chart.destroy();
                createChart(chartObj);
            }
        }
    }));

    var createChart = function(chartObj)
    {
        var typeMapping = {
            'areachart': 'area',
            'barchart': 'bar',
            'columnchart': 'column',
            'imagesparkline': 'line',
            'linechart': 'line',
            'piechart': 'pie'
        };
        var type = typeMapping[chartObj.settings.chartType];
        if (type == 'line' && chartObj._displayConfig.smoothLine)
        { type = 'spline'; }

        var xTitle = chartObj._displayConfig.titleX;
        var yTitle = chartObj._displayConfig.titleY;
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
        chartObj._reverseOrder = type == 'bar';

        var chartConfig =
        {
            chart: {
                renderTo: chartObj.$dom()[0],
                defaultSeriesType: type,
                inverted: type == 'bar',
                margin: chartMargin
            },
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

        var typeConfig = {allowPointSelect: true,
            marker: {enabled: chartObj._displayConfig.pointSize != '0'} };
        if (!_.isUndefined(chartObj._displayConfig.lineSize))
        { typeConfig['lineWidth'] = parseInt(chartObj._displayConfig.lineSize); }
        chartConfig.plotOptions[type] = typeConfig;

        chartObj.chart = new Highcharts.Chart(chartConfig);
        // Set colors after chart is created so they don't get merged with the
        // default colors; we want to override them, instead
        chartObj.chart.options.colors = chartObj._displayConfig.colors;
        if (chartObj._reverseOrder) { chartObj.chart.options.colors.reverse(); }
    };

})(jQuery);
