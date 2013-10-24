(function($)
{
    var chartMapping = {
        'area': 'highcharts',
        'bar': 'highcharts',
        'stackedbar': 'highcharts',
        'bubble': 'highcharts',
        'column': 'highcharts',
        'stackedcolumn': 'highcharts',
        'donut': 'highcharts',
        'line': 'highcharts',
        'pie': 'highcharts',
        'timeline': 'highcharts',
        'treemap': 'jit'
    };

    /*
        Correct behavior as of 2013-08-05, michael.chui@socrata.com:

        If new_charts, new(X)Chart modules are active, switch these on.
        If old_charts, ?charts=old are on, override above with old charts.
        If ?charts=nextgen, df.nextgen is on, override above with new charts.
    */
    var nextgenMapper = {
        'newBarChart': function() { $.extend(chartMapping, {
            'column': 'd3_impl_bar',
            'bar': 'd3_impl_bar'
            }); },
        'newLineChart': function() { $.extend(chartMapping, {
            'line': 'd3_impl_line',
            'area': 'd3_impl_line'
            }); }
    };

    if (blist.feature_flags.charts === 'nextgen'
        || $.deepGet(blist, 'dataset', 'displayFormat', 'nextgen') === true)
    {
        $.extend(chartMapping, {
            'column': 'd3_impl_bar',
            'bar': 'd3_impl_bar',
            'line': 'd3_impl_line',
            'area': 'd3_impl_line',
            'stackedbar': 'd3_impl_bar',
            'stackedcolumn': 'd3_impl_bar',
            'pie': 'd3_impl_pie',
            'donut': 'd3_impl_pie'
        });
    }

    if (blist.feature_flags.charts !== 'old')
    {
        _.each(blist.feature_flags.newCharts, function(enabled, chartType)
        { enabled && nextgenMapper[chartType] && nextgenMapper[chartType](); });
    }

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

        isValid: function()
        {
            return Dataset.chart.isValid(this._primaryView, this._displayFormat, this._chartType);
        },

        initializeVisualization: function ()
        {
            var chartObj = this;
            chartObj.initializeFlyouts(chartObj._displayFormat.descriptionColumns);
        },

        getColumns: function()
        {
            var chartObj = this;
            var view = chartObj._primaryView;

            chartObj._valueColumns = _.map(chartObj._displayFormat.valueColumns,
                function(vc)
                {
                    var col = view.columnForIdentifier(vc.fieldName || vc.tableColumnId);
                    if ($.isBlank(col)) { return null; }
                    vc = $.extend({}, vc);
                    vc.column = col;
                    vc.supplementalColumns = _.compact(
                        _.map(vc.supplementalColumns || [],
                            function(sc) { return view.columnForIdentifier(sc); }));
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
                    function(tcId) { return view.columnForIdentifier(tcId); });
            chartObj._fixedColumns = _.compact(chartObj._fixedColumns);

            chartObj._seriesColumns = _.compact(_.map(chartObj._displayFormat.seriesColumns || [],
                    function(sc)
                    {
                        var r = {};
                        r.column = view.columnForIdentifier(sc.fieldName || sc.tableColumnId);
                        if ($.isBlank(r.column)) { return null; }
                        return r;
                    }));

            if (chartObj._chartType == 'bubble')
            { _.each(['pointColor', 'pointSize'], function(colName)
            {
                var c = view.columnForIdentifier(chartObj._displayFormat[colName]);
                if (!$.isBlank(c) && !c.isMeta)
                {
                    chartObj['_' + colName] = c;
                    customAggs[c.id] = $.makeArray(customAggs[c.id])
                        .concat(['maximum', 'minimum']);
                }
            }); }

            if ($.subKeyDefined(chartObj, '_displayFormat.plot'))
            {
                chartObj._errorBarConfig = {
                    low: view.columnForIdentifier(chartObj._displayFormat.plot.errorBarLow),
                    high: view.columnForIdentifier(chartObj._displayFormat.plot.errorBarHigh)
                };
                if (!(chartObj._errorBarConfig.low && chartObj._errorBarConfig.high))
                { delete chartObj._errorBarConfig; }
            }

            // Was getting two reloads in a row that triggered this call twice on a Revert,
            // which made the chart load blank. So de-dupe request
            if (!chartObj._gettingAggs)
            {
                chartObj._gettingAggs = true;
                chartObj._primaryView.getAggregates(function()
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
            delete chartObj._seriesColumns;
            delete chartObj._pointSize;
            delete chartObj._pointColor;
            delete chartObj._gradient;
            delete chartObj._flyoutConfig;
        },

        reloadVisualization: function()
        {
            this._chartType = this.settings.chartType || this._displayFormat.chartType;
            if (!this.isValid()) { return; }

            this.initializeVisualization();
            this._super();
        },

        reset: function()
        {
            var chartObj = this;
            $(chartObj.currentDom).removeData('socrataChart');
            chartObj.$dom().empty();
            return $(chartObj.currentDom).socrataChart($.extend({}, chartObj.settings,
                        { view: chartObj._primaryView }));
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
                    var col = chartObj._primaryView.columnForIdentifier(vc.fieldName ||vc.tableColumnId);
                    if ($.isBlank(col)) { return; }
                    var id = col.tableColumnId;
                    var config = chartObj._flyoutConfig[id] = {};

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
                config.$template = chartObj.$dom().siblings('.flyout' + id);
                if (config.$template.length == 0)
                {
                    chartObj.$dom().after($.tag({tagName: 'div',
                        'class': ['template', 'row', 'flyout' + id,
                            'richRendererContainer', 'flyoutRenderer']}));
                    config.$template = chartObj.$dom()
                        .siblings('.flyoutRenderer.template.flyout' + id);
                }
                config.richRenderer = config.$template.richRenderer({
                    columnCount: 1, view: chartObj._primaryView});
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
            var fCols = _.isUndefined(this._displayFormat.titleFlyout) ? 
                this._displayFormat.fixedColumns : [this._displayFormat.titleFlyout];

            var titleId = fCols ? fCols[0] : null;
            columns =_.compact((this._displayFormat.seriesColumns || [])
                    .concat([valueColumn]).concat(columns));

            // Override if you want a different layout
            if (_.isEmpty(columns)) { return null; }

            var layout = this._super(columns);
            var col = layout.columns[0];
            // Title row
            if (!$.isBlank(titleId))
            {
                col.rows.unshift({fields: [{type: 'columnData',
                    tableColumnId: titleId, fieldName: titleId}
                ], styles: {'border-bottom': '1px solid #666666',
                    'font-size': '1.2em', 'font-weight': 'bold',
                    'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
            }

            return layout;
        },

        renderFlyout: function(row, tcolId, view)
        {
            var chartObj = this;

            //var isPrimaryView = chartObj._primaryView == view;
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

            var column = chartObj._primaryView.columnForID(cId);
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
