(function($)
{
    // Set up namespace for particular plugins to class themselves under
    $.socrataChart =
    {
        extend: function(extHash, extObj)
        {
            if (!extObj) { extObj = socrataChartObj; }
            return $.extend({}, extObj, extHash,
            {
                defaults: $.extend({}, extObj.defaults, extHash.defaults || {}),
                prototype: $.extend({}, extObj.prototype, extHash.prototype || {})
            });
        },

        chartMapping: {
            'area': 'highcharts',
            'bar': 'highcharts',
            'bubble': 'highcharts',
            'column': 'highcharts',
            'donut': 'highcharts',
            'line': 'highcharts',
            'pie': 'highcharts',
            'timeline': 'highcharts',
            'treemap': 'jit'
        }
    };

    $.fn.socrataChart = function(options)
    {
        // Check if object was already created
        var socrataChart = $(this[0]).data("socrataVisualization");
        if (!socrataChart)
        {
            var className = $.socrataChart.chartMapping[
                options.view.displayFormat.chartType];
            var chartClass = $.socrataChart[className];
            if (!$.isBlank(chartClass))
            {
                socrataChart = new chartClass(options, this[0]);
            }
        }
        return socrataChart;
    };

    var socrataChartObj = function(options, dom)
    {
        this.settings = $.extend({}, socrataChartObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(socrataChartObj, $.socrataVisualization.extend(
    {
        defaults:
        {
        },

        prototype:
        {
            initializeVisualization: function ()
            {
                var chartObj = this;
                chartObj._numSegments = 10;
                chartObj.initializeChart();
            },

            initializeChart: function()
            {
                // Override me with chart-specific initialization
            },

            getColumns: function()
            {
                var chartObj = this;
                var view = chartObj.settings.view;

                chartObj._valueColumns = _.map(view.displayFormat.valueColumns,
                    function(vc)
                    {
                        var col = view.columnForTCID(vc.tableColumnId);
                        if ($.isBlank(col)) { return null; }
                        vc = $.extend({}, vc);
                        vc.column = col;
                        vc.supplementalColumns = _.map(vc.supplementalColumns || [],
                            function(sc) { return view.columnForTCID(sc); });
                        return vc;
                    });
                chartObj._valueColumns = _.compact(chartObj._valueColumns);
                var customAggs = {};
                _.each(chartObj._valueColumns, function(col)
                {
                    if (_.any(col.column.renderType.aggregates,
                        function(a) { return a.value == 'sum'; }))
                    { customAggs[col.column.id] = ['sum'] }
                });

                chartObj._fixedColumns =
                    _.map(view.displayFormat.fixedColumns || [],
                        function(tcId) { return view.columnForTCID(tcId); });
                chartObj._fixedColumns = _.compact(chartObj._fixedColumns);

                _.each(['pointColor', 'pointSize'], function(colName)
                {
                    var c = view.columnForTCID(view.displayFormat[colName]);
                    if (!$.isBlank(c))
                    {
                        chartObj['_' + colName] = c;
                        customAggs[c.id] = $.makeArray(customAggs[c.id])
                            .concat(['maximum', 'minimum']);
                    }
                });

                chartObj.settings.view.getAggregates(function()
                {
                    calculateSegmentSizes(chartObj, customAggs);
                    chartObj.columnsLoaded();
                    chartObj.ready();
                }, customAggs);

                return false;
            },

            reloadVisualization: function()
            {
                var chartObj = this;

                chartObj.resetData();

                delete chartObj._fixedColumns;
                delete chartObj._valueColumns;
                delete chartObj._pointSize;
                delete chartObj._pointColor;
                delete chartObj._gradient;

                chartObj.initializeChart();
            },

            resetData: function()
            {
                // Implement me to reset data on a reload
            }
        }
    }));

    var calculateSegmentSizes = function(chartObj, aggs)
    {
        chartObj._segments = {};
        _.each(aggs, function(a, cId)
        {
            if (_.intersect(['maximum', 'minimum'], a).length != 2)
            { return; }

            var column = chartObj.settings.view.columnForID(cId);
            var difference = column.aggregates.maximum - column.aggregates.minimum;
            var granularity = difference / chartObj._numSegments;

            chartObj._segments[column.id] = [];
            for (i = 0; i < chartObj._numSegments; i++)
            {
                chartObj._segments[column.id][i] =
                    ((i+1)*granularity) + column.aggregates.minimum;
            }
        });
    };

})(jQuery);
