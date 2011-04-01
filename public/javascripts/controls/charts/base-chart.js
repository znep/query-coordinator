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

                chartObj.initializeFlyouts(chartObj.settings.view.displayFormat
                    .descriptionColumns);
                chartObj.initializeChart();

                chartObj._origData = {
                    chartService: $.socrataChart.chartMapping[chartObj._chartType]};
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
                        vc.supplementalColumns = _.compact(
                            _.map(vc.supplementalColumns || [],
                                function(sc) { return view.columnForTCID(sc); }));
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
                    if (!$.isBlank(c) && !c.isMeta)
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
                delete chartObj._flyoutConfig;

                chartObj.initializeFlyouts(chartObj.settings.view.displayFormat
                    .descriptionColumns);

                chartObj.initializeChart();
            },

            reset: function()
            {
                var chartObj = this;
                $(chartObj.currentDom).removeData('socrataVisualization');
                chartObj.$dom().empty();
                $(chartObj.currentDom).socrataChart(chartObj.settings);
            },

            needsFullReset: function()
            {
                var chartObj = this;
                var view = chartObj.settings.view;
                return !$.isBlank(chartObj._origData) &&
                    chartObj._origData.chartService !=
                        $.socrataChart.chartMapping[view.displayFormat.chartType];
            },

            resetData: function()
            {
                // Implement me to reset data on a reload
            },

            initializeFlyouts: function(columns)
            {
                var chartObj = this;
                chartObj._flyoutConfig = {};
                _.each(chartObj.settings.view.displayFormat.valueColumns,
                    function(vc, index)
                    {
                        var id = vc.tableColumnId;
                        var config = chartObj._flyoutConfig[id] = {};

                        config.column = vc;
                        config.layout = chartObj.generateFlyoutLayout(columns, vc);

                        if ($.isBlank(config.richRenderer))
                        { chartObj.$flyoutTemplate(id); }
                        config.richRenderer.setConfig(config.layout);

                        if (chartObj.hasFlyout(id))
                        { config.richRenderer.renderLayout(); }
                        else
                        { var $item = chartObj.$flyoutTemplate(id).empty(); }
                    });
            },

            $flyoutTemplate: function(id)
            {
                var chartObj = this;
                if (!chartObj._flyoutConfig[id].$template)
                {
                    var config = chartObj._flyoutConfig[id];
                    config.$template = chartObj.$dom().siblings('.flyout'+id);
                    if (config.$template.length == 0)
                    {
                        chartObj.$dom().after($.tag({tagName: 'div',
                            'class': ['template', 'row', 'flyout'+id,
                                'richRendererContainer', 'flyoutRenderer']}));
                        config.$template = chartObj.$dom()
                            .siblings('.flyoutRenderer.template.flyout'+id);
                    }
                    config.richRenderer = config.$template.richRenderer({
                        columnCount: 1, view: chartObj.settings.view});
                }
                return chartObj._flyoutConfig[id].$template;
            },

            hasFlyout: function(id)
            {
                return this._flyoutConfig[id]
                    && $.subKeyDefined(this._flyoutConfig[id], 'layout');
            },

            generateFlyoutLayout: function(columns, valueColumn)
            {
                var fCols = this.settings.view.displayFormat.fixedColumns;
                var titleId = fCols ? fCols[0] : 'fake';
                return this.generateFlyoutLayoutDefault(
                    _.compact([valueColumn].concat(columns)), titleId);
            },

            generateFlyoutLayoutDefault: function(columns, titleId)
            {
                // Override if you want a different layout
                if (_.isEmpty(columns)) { return null; }

                var col = {rows: []};

                // Title row
                if (!$.isBlank(titleId))
                {
                    col.rows.push({fields: [{type: 'columnData',
                        tableColumnId: titleId}
                    ], styles: {'border-bottom': '1px solid #666666',
                        'font-size': '1.2em', 'font-weight': 'bold',
                        'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
                }

                _.each(columns, function(dc)
                {
                    var row = {fields: [
                        {type: 'columnLabel', tableColumnId: dc.tableColumnId},
                        {type: 'columnData', tableColumnId: dc.tableColumnId}
                    ]};
                    col.rows.push(row);
                });
                return {columns: [col]};
            },

            renderFlyout: function(row, tcolId, view)
            {
                var chartObj = this;

                //var isPrimaryView = chartObj.settings.view == view;
                var $item = chartObj.$flyoutTemplate(tcolId).clone()
                        .removeClass('template');

                // In composite views, we don't have a displayFormat, so there are no
                // bits to show. Just point them at the row data in full.
                //if (!isPrimaryView)
                //{ $item.empty(); }
                if (chartObj.hasFlyout(tcolId))
                { chartObj._flyoutConfig[tcolId].richRenderer.renderRow($item, row); }

                return $item;
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

            if (granularity > 0)
            {
                chartObj._segments[column.id] = [];
                for (i = 0; i < chartObj._numSegments; i++)
                {
                    chartObj._segments[column.id][i] =
                        ((i+1)*granularity) + column.aggregates.minimum;
                }
            }
            else
            { chartObj._segments[column.id] = null; }
        });
    };

})(jQuery);
