(function(){

var legacyTypes =
{
    imagesparkline: 'line',
    annotatedtimeline: 'timeline',
    areachart: 'area',
    barchart: 'bar',
    columnchart: 'column',
    linechart: 'line',
    piechart: 'pie'
};

Dataset.chart = {};
Dataset.chart.textualTypes = ['text', 'html', 'email', 'url',
    'drop_down_list', 'number', 'percent', 'money'];
Dataset.chart.numericTypes = ['number', 'percent', 'money'];
Dataset.chart.dateTypes = ['calendar_date', 'date'];
Dataset.chart.textAndDateTypes = Dataset.chart.textualTypes.concat(Dataset.chart.dateTypes);

var lineTranslate = function(view, displayFormat)
{
    var newDF = $.extend(true, {}, displayFormat);
    newDF.fixedColumns = _.reject(displayFormat.fixedColumns, function(fc)
        {
            var c = view.columnForIdentifier(fc);
            if ($.isBlank(c)) { return true; }
            return !_.include(Dataset.chart.textualTypes, c.renderTypeName);
        });
    newDF.valueColumns = _.reject(displayFormat.valueColumns, function(dc)
        {
            var c = view.columnForIdentifier(dc.fieldName || dc.tableColumnId);
            if ($.isBlank(c)) { return true; }
            return !_.include(Dataset.chart.numericTypes, c.renderTypeName);
        });
    return newDF;
};

Dataset.chart.types = {
    area: {value: 'area', text: $.t('core.chart_types.area'),
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    bar: {value: 'bar', text: $.t('core.chart_types.bar'),
        requiredColumns: [Dataset.chart.textAndDateTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 40 }},
    bubble: {value: 'bubble', text: $.t('core.chart_types.bubble'),
        requiredColumns: [Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }, translateFormat: lineTranslate },
    column: {value: 'column', text: $.t('core.chart_types.column'),
        requiredColumns: [Dataset.chart.textAndDateTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 100 }},
    donut: {value: 'donut', text: $.t('core.chart_types.donut'),
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 30 }, renderOther: true},
    line: {value: 'line', text: $.t('core.chart_types.line'),
        requiredColumns: [Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }, translateFormat: lineTranslate },
    pie: {value: 'pie', text: $.t('core.chart_types.pie'),
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 30 }, renderOther: true},
    timeline: {value: 'timeline', text: $.t('core.chart_types.timeline'),
        requiredColumns: [Dataset.chart.dateTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    treemap: {value: 'treemap', text: $.t('core.chart_types.treemap'),
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 100 }, renderOther: true}
};

Dataset.chart.types.stackedcolumn = $.extend({}, Dataset.chart.types.column,
        { value: 'stackedcolumn', text: $.t('core.chart_types.stackedcolumn') });
Dataset.chart.types.stackedbar = $.extend({}, Dataset.chart.types.column,
        { value: 'stackedbar', text: $.t('core.chart_types.stackedbar') });


Dataset.chart.hasRequiredColumns = function(cols, reqCols, includeHidden)
{
    cols = cols.slice();
    // We may have overlapping types in reqCols, so start with the most restrictive
    // (smallest) grouping
    reqCols = _.sortBy(reqCols, function(rc) { return rc.length; });
    return _.all(reqCols, function(rc)
    {
        var col = _.detect(cols, function(c)
        {
            return _.include(rc, c.renderTypeName) && (includeHidden || !c.hidden);
        });

        if ($.isBlank(col)) { return false; }
        cols = _.without(cols, col);
        return true;
    });
};

Dataset.chart.isValid = function(view, displayFormat, chartType)
{
    if ($.isBlank(view)) { return false; }

    var foundCols = [];
    _.each(displayFormat.fixedColumns || [], function(fc)
    { foundCols.push(view.columnForIdentifier(fc)); });

    _.each(displayFormat.valueColumns || [], function(vc)
    { foundCols.push(view.columnForIdentifier(vc.fieldName || vc.tableColumnId)); });

    var ct = Dataset.chart.types[chartType];
    if ($.isBlank(ct)) { return false; }
    return Dataset.chart.hasRequiredColumns(_.compact(foundCols), ct.requiredColumns);
};

Dataset.modules['chart'] =
{
    supportsSnapshotting: function()
    {
        // Highcharts compatibility
        // TODO: Tree, donut?
        return _.include(['area','bar','column', 'donut', 'line', 'pie', 'timeline', 'treemap'],
            this.displayFormat.chartType);
    },

    _setupSnapshotting: function()
    {
        if(_.include(['treemap'], this.displayFormat.chartType))
        { this._setupDefaultSnapshotting(2000); }

        // Let highcharts types deal with it themselves
    },


    _checkValidity: function()
    {
        if (!this._super()) { return false; }
        return Dataset.chart.isValid(this, this.displayFormat, this.displayFormat.chartType);
    },

    _convertLegacy: function()
    {
        var view = this;

        if (!$.isBlank(legacyTypes[view.displayType]))
        {
            var dt = view.displayType;
            view.displayType = 'chart';
            view.displayFormat.chartType = legacyTypes[dt];
        }
        else if (!$.isBlank(legacyTypes[view.displayFormat.chartType]))
        {
            // Is this case needed?
            view.displayFormat.chartType =
                legacyTypes[view.displayFormat.chartType];
        }

        if ($.isBlank(view.displayFormat.dataColumns) &&
            $.isBlank(view.displayFormat.fixedColumns) &&
            $.isBlank(view.displayFormat.valueColumns) &&
            !$.isBlank(view.visibleColumns))
        {
            view.displayFormat.dataColumns = _.map(view.visibleColumns,
                function(c) { return c.tableColumnId; });
        }

        if (!$.isBlank(view.displayFormat.dataColumns))
        {
            if (!$.isBlank(view.displayFormat.fixedCount))
            {
                if (view.displayFormat.chartType == 'pie' &&
                    view.displayFormat.fixedCount > 1)
                { view.displayFormat.fixedCount--; }
                view.displayFormat.fixedColumns =
                    view.displayFormat.dataColumns.splice(0,
                            view.displayFormat.fixedCount);
            }
            else if ($.isBlank(view.displayFormat.valueColumns) &&
                _.isArray(view.displayFormat.dataColumns) &&
                view.displayFormat.dataColumns.length > 0)
            {
                var firstCol = view.columnForTCID(view.displayFormat.dataColumns[0]);
                if (!$.isBlank(firstCol) && !_.include(Dataset.chart.numericTypes,
                    firstCol.renderTypeName))
                {
                    view.displayFormat.fixedColumns =
                        view.displayFormat.dataColumns.splice(0, 1);
                }
            }

            var valueCols = [];
            var vcVal;
            var i = 0;
            var cols = view.displayFormat.dataColumns.slice();
            while (cols.length > 0)
            {
                var tcid = cols.shift();
                var c = view.columnForTCID(tcid);
                if ($.isBlank(c)) { continue; }

                if (_.include(Dataset.chart.numericTypes, c.renderTypeName))
                {
                    valueCols.push(vcVal);
                    vcVal = {tableColumnId: tcid};
                    if (!$.isBlank((view.displayFormat.colors || [])[i]))
                    { vcVal.color = view.displayFormat.colors[i]; }
                    i++;
                    continue;
                }
                if (!$.isBlank(vcVal))
                {
                    vcVal.supplementalColumns = vcVal.supplementalColumns || [];
                    vcVal.supplementalColumns.push(tcid);
                }
            }

            if (!$.isBlank(vcVal)) { valueCols.push(vcVal); }
            view.displayFormat.valueColumns = _.compact(valueCols);
        }

        delete view.displayFormat.dataColumns;

        if ($.subKeyDefined(view.displayFormat, 'yAxis.marker'))
        {
            view.displayFormat.valueMarker = [ { atValue: view.displayFormat.yAxis.marker,
                                                 color: view.displayFormat.yAxis.markerColor }];
        }

        if (view.displayFormat.chartType == 'treemap' && view.displayFormat.baseColor)
        {
            view.displayFormat.colors =
                [view.displayFormat.baseColor, '#042656', '#19538b', '#6a9feb', '#bed6f7'];
        }

        if (((view.displayFormat.chartType == 'bar') || (view.displayFormat.chartType == 'column')) &&
            (view.displayFormat.stacking === true))
        {
            view.displayFormat.chartType = 'stacked' + view.displayFormat.chartType;
        }
    }
};

})();
