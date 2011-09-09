(function($)
{
    var chartMapping = {
        'area': 'highcharts',
        'bar': 'highcharts',
        'bubble': 'highcharts',
        'column': 'highcharts',
        'donut': 'highcharts',
        'line': 'highcharts',
        'pie': 'highcharts',
        'timeline': 'highcharts',
        'treemap': 'jit'
    };

    $.Control.extend('socrataChart', {
        _init: function()
        {
            this._super.apply(this, arguments);
            this._chartType = this.settings.chartType || this._displayFormat.chartType;
            this._numSegments = 10;
            this._origData = { chartService: chartMapping[this._chartType] };
        },

        _getMixins: function(options)
        {
            return [chartMapping[options.chartType ||
                (options.displayFormat || options.view.displayFormat).chartType]];
        },

        initializeVisualization: function ()
        {
            var chartObj = this;
            chartObj.initializeFlyouts(chartObj._displayFormat.descriptionColumns);
        },

        getColumns: function()
        {
            var chartObj = this;
            var view = chartObj.settings.view;

            chartObj._valueColumns = _.map(chartObj._displayFormat.valueColumns,
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
                _.map(chartObj._displayFormat.fixedColumns || [],
                    function(tcId) { return view.columnForTCID(tcId); });
            chartObj._fixedColumns = _.compact(chartObj._fixedColumns);

            if (chartObj._chartType == 'bubble')
            { _.each(['pointColor', 'pointSize'], function(colName)
            {
                var c = view.columnForTCID(chartObj._displayFormat[colName]);
                if (!$.isBlank(c) && !c.isMeta)
                {
                    chartObj['_' + colName] = c;
                    customAggs[c.id] = $.makeArray(customAggs[c.id])
                        .concat(['maximum', 'minimum']);
                }
            }); }

            // Was getting two reloads in a row that triggered this call twice on a Revert,
            // which made the chart load blank. So de-dupe request
            if (!chartObj._gettingAggs)
            {
                chartObj._gettingAggs = true;
                chartObj.settings.view.getAggregates(function()
                {
                    calculateSegmentSizes(chartObj, customAggs);
                    chartObj.columnsLoaded();
                    chartObj.ready();
                    delete chartObj._gettingAggs;
                }, customAggs);
            }

            return false;
        },

        cleanVisualization: function()
        {
            var chartObj = this;
            chartObj._super();

            delete chartObj._fixedColumns;
            delete chartObj._valueColumns;
            delete chartObj._pointSize;
            delete chartObj._pointColor;
            delete chartObj._gradient;
            delete chartObj._flyoutConfig;
        },

        reloadVisualization: function()
        {
            this._chartType = this.settings.chartType || this._displayFormat.chartType;
            this.initializeVisualization();
            this._super();
        },

        reset: function()
        {
            var chartObj = this;
            $(chartObj.currentDom).removeData('socrataChart');
            chartObj.$dom().empty();
            chartObj._obsolete = true;
            $(chartObj.currentDom).socrataChart(chartObj.settings);
        },

        needsFullReset: function()
        {
            var chartObj = this;
            return !$.isBlank(chartObj._origData) &&
                chartObj._origData.chartService != chartMapping[chartObj.settings.chartType ||
                chartObj._displayFormat.chartType];
        },

        initializeFlyouts: function(columns)
        {
            var chartObj = this;
            chartObj._flyoutConfig = {};
            _.each(chartObj._displayFormat.valueColumns,
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
            var fCols = this._displayFormat.fixedColumns;
            var titleId = fCols ? fCols[0] : null;
            columns = _.compact([valueColumn].concat(columns));

            // Override if you want a different layout
            if (_.isEmpty(columns)) { return null; }

            var layout = this._super(columns);
            var col = layout.columns[0];

            // Title row
            if (!$.isBlank(titleId))
            {
                col.rows.unshift({fields: [{type: 'columnData',
                    tableColumnId: titleId}
                ], styles: {'border-bottom': '1px solid #666666',
                    'font-size': '1.2em', 'font-weight': 'bold',
                    'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
            }

            return layout;
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
            { chartObj._flyoutConfig[tcolId].richRenderer.renderRow($item, row, true); }

            return $item;
        }
    }, null, 'socrataVisualization');

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
