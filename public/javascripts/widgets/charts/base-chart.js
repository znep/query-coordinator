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
            'areachart': 'highcharts',
            'barchart': 'highcharts',
            'columnchart': 'highcharts',
            'linechart': 'highcharts',
            'piechart': 'highcharts'
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
            if (chartClass !== null && chartClass !== undefined)
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
            chartType: 'linechart'
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
                $.ajax({url: '/views/' + view.id + '/rows.json',
                    data: {method: 'getAggregates'},
                    dataType: 'json',
                    success: function(aggData)
                    {
                        var aggMap = {};
                        _.each(aggData, function(a)
                            { aggMap[a.columnId] = {type: a.name, value: a.value}; }
                        );
                        _.each(chartObj._dataColumns, function(c)
                        {
                            if (aggMap[c.id] !== undefined)
                            { c.aggregate = aggMap[c.id]; }
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

                delete chartObj._idIndex;
                delete chartObj._dataColumns;
            },

            resetData: function()
            {
                // Implement me to reset data on a reload
            }
        }
    }));

    var getColumns = function(chartObj, view)
    {
        // No new format yet...
        return false;
    };

    var getLegacyColumns = function(chartObj, view)
    {
        _.each(view.columns, function(c, i) { c.dataIndex = i; });
        var cols = _.select(view.columns, function(c)
            { return c.dataTypeName != 'meta_data' &&
                (c.flags === undefined || !_.include(c.flags, 'hidden')); });
        cols = _.sortBy(cols, function(c) { return c.position; });

        if (cols.length < 2) { return false; }

        chartObj._idIndex = _.detect(view.columns, function(c)
            { return c.dataTypeName == 'meta_data' && c.name == 'sid'; }).dataIndex;
        chartObj._dataColumns = cols;
        return true;
    };
})(jQuery);
