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
            'line': 'highcharts',
            'pie': 'highcharts',
            'timeline': 'highcharts'
        }
    };

    $.fn.socrataChart = function(options)
    {
        // Check if object was already created
        var socrataChart = $(this[0]).data("socrataVisualization");
        if (!socrataChart)
        {
            var className = $.socrataChart.chartMapping[options.chartType];
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
            chartType: 'line'
        },

        prototype:
        {
            initializeVisualization: function ()
            {
                var chartObj = this;
                chartObj.initializeChart();
            },

            getColumns: function(view)
            {
                var chartObj = this;
                if (!getColumns(chartObj, view))
                { getLegacyColumns(chartObj, view); }

                chartObj._view = view;
                chartObj.startLoading();
                $.ajax({url: '/views/' + view.id + '/rows.json',
                    data: {method: 'getAggregates'}, cache: false,
                    dataType: 'json',
                    error: function() { chartObj.finishLoading(); },
                    success: function(aggData)
                    {
                        chartObj.finishLoading();
                        var aggMap = {};
                        _.each(aggData, function(a)
                            { aggMap[a.columnId] = {type: a.name, value: a.value}; }
                        );
                        _.each(chartObj._valueColumns, function(vc)
                        {
                            if (!$.isBlank(aggMap[vc.column.id]))
                            { vc.column.aggregate = aggMap[vc.column.id]; }
                        });
                        chartObj.columnsLoaded();
                    }});
            },

            columnsLoaded: function()
            {
                // Implement me if you want to deal with the columns in more
                // detail -- either munge them into a more useable format, or
                // initialize parts of the chart
            },

            reloadVisualization: function()
            {
                var chartObj = this;

                chartObj.resetData();

                delete chartObj._fixedColumns;
                delete chartObj._valueColumns;

                chartObj.settings.chartType = chartObj._displayConfig.chartType;
                chartObj.initializeChart();
            },

            resetData: function()
            {
                // Implement me to reset data on a reload
            }
        }
    }));


    var getColumns = function(chartObj, view)
    {
        view = blist.dataset.chart.convertLegacy(view);

        _.each(view.columns, function(c, i) { c.dataIndex = i; });

        chartObj._valueColumns = _.map(view.displayFormat.valueColumns,
            function(vc)
            {
                var col = _.detect(view.columns, function(c)
                    { return c.tableColumnId == vc.tableColumnId; });
                if ($.isBlank(col)) { return null; }
                vc = $.extend({}, vc);
                vc.column = col;
                vc.supplementalColumns = _.map(vc.supplementalColumns || [],
                    function(sc)
                    {
                        return _.detect(view.columns, function(c)
                            { return c.tableColumnId == sc; });
                    });
                return vc;
            });
        chartObj._valueColumns = _.compact(chartObj._valueColumns);

        chartObj._fixedColumns = _.map(view.displayFormat.fixedColumns || [],
            function(tcId)
            {
                return _.detect(view.columns, function(c)
                    { return c.tableColumnId == tcId; });
            });
        chartObj._fixedColumns = _.compact(chartObj._fixedColumns);

        return true;
    };
})(jQuery);
