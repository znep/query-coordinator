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
                chartObj.initializeChart();
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

                chartObj._fixedColumns =
                    _.map(view.displayFormat.fixedColumns || [],
                        function(tcId) { return view.columnForTCID(tcId); });
                chartObj._fixedColumns = _.compact(chartObj._fixedColumns);

                chartObj.settings.view.getAggregates(function()
                { chartObj.columnsLoaded(); });

                return false;
            },

            reloadVisualization: function()
            {
                var chartObj = this;

                chartObj.resetData();

                delete chartObj._fixedColumns;
                delete chartObj._valueColumns;

                chartObj.initializeChart();
            },

            resetData: function()
            {
                // Implement me to reset data on a reload
            }
        }
    }));

})(jQuery);
