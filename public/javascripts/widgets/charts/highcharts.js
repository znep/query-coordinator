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
                chartObj.chart = new Highcharts.Chart({
                    chart: {
                        renderTo: chartObj.$dom().attr('id'),
                        // TODO: real type
                        defaultSeriesType: 'line'
                    }
                    // TODO: real config
                });
            },

            columnsLoaded: function()
            {
                var chartObj = this;
                chartObj._xCategories = [];
                chartObj._xColumn = chartObj._dataColumns[0];
                chartObj._yColumns = [];
                for (var i = 1; i < chartObj._dataColumns.length; i++)
                {
                    var c = chartObj._dataColumns[i];
                    chartObj._yColumns.push(c);
                    chartObj.chart.addSeries({name: c.name, data: []});
                }
            },

            renderRow: function(row)
            {
                var chartObj = this;
                chartObj._xCategories.push(row[chartObj._xColumn.dataIndex]);
                _.each(chartObj._yColumns, function(c, i)
                {
                    chartObj.chart.series[i].addPoint(
                        parseInt(row[c.dataIndex]), false);
                });
                return true;
            },

            rowsRendered: function()
            {
                var chartObj = this;
                chartObj.chart.xAxis[0].setCategories(chartObj._xCategories, false);
                chartObj.chart.redraw();
            }
        }
    }));

})(jQuery);
