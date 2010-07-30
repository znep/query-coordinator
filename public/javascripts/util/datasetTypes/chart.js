blist.namespace.fetch('blist.datasetUtil.chart');

blist.datasetUtil.chart.legacyTypes =
{
    imagesparkline: 'line',
    annotatedtimeline: 'timeline',
    areachart: 'area',
    barchart: 'bar',
    columnchart: 'column',
    linechart: 'line',
    piechart: 'pie'
};

blist.datasetUtil.chart.textualTypes = ['text', 'drop_down_list'];
blist.datasetUtil.chart.numericTypes = ['number', 'percent', 'money'];
blist.datasetUtil.chart.dateTypes = ['calendar_date', 'date'];

blist.datasetUtil.chart.types = {
    area: {value: 'area', text: 'Area Chart',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]},
    bar: {value: 'bar', text: 'Bar Chart',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]},
    column: {value: 'column', text: 'Column Chart',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]},
    donut: {value: 'donut', text: 'Donut Chart',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]},
    line: {value: 'line', text: 'Line Chart',
        requiredColumns: [blist.datasetUtil.chart.numericTypes]},
    pie: {value: 'pie', text: 'Pie Chart',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]},
    timeline: {value: 'timeline', text: 'Time Line',
        requiredColumns: [blist.datasetUtil.chart.dateTypes,
            blist.datasetUtil.chart.numericTypes]},
    treemap: {value: 'treemap', text: 'Tree Map',
        requiredColumns: [blist.datasetUtil.chart.textualTypes,
            blist.datasetUtil.chart.numericTypes]}
};

blist.datasetUtil.chart.getType = function(view)
{
    var ct = view.displayFormat.chartType || view.displayType;
    return blist.datasetUtil.chart.legacyTypes[ct] || ct;
};

blist.datasetUtil.chart.hasRequiredColumns = function(cols, reqCols, includeHidden)
{
    cols = cols.slice();
    return _.all(reqCols, function(rc)
    {
        var col = _.detect(cols, function(c)
        {
            return _.include(rc, c.renderTypeName) && (includeHidden ||
                ($.isBlank(c.flags) || !_.include(c.flags, 'hidden')));
        });

        if ($.isBlank(col)) { return false; }
        cols = _.without(cols, col);
        return true;
    });
};

blist.datasetUtil.chart.isValid = function(view)
{
    view = blist.datasetUtil.chart.convertLegacy($.extend(true, {}, view));

    var foundCols = [];
    _.each(view.displayFormat.fixedColumns || [], function(fc)
    { foundCols.push(blist.datasetUtil.columnForTCID(view, fc)); });

    _.each(view.displayFormat.valueColumns || [], function(vc)
    { foundCols.push(blist.datasetUtil.columnForTCID(view, vc.tableColumnId)); });

    return blist.datasetUtil.chart.hasRequiredColumns(_.compact(foundCols),
        blist.datasetUtil.chart.types[blist.datasetUtil.chart.getType(view)]
            .requiredColumns);
};

blist.datasetUtil.chart.convertLegacy = function(view)
{
    view.displayFormat = view.displayFormat || {};

    view.displayFormat.chartType = blist.datasetUtil.chart.getType(view);

    if ($.isBlank(view.displayFormat.dataColumns) &&
        $.isBlank(view.displayFormat.fixedColumns) &&
        $.isBlank(view.displayFormat.valueColumns))
    {
        view.displayFormat.dataColumns = _(view.columns).chain()
            .reject(function(c) { return c.dataTypeName == 'meta_data' ||
                _.include(c.flags || [], 'hidden'); })
            .sortBy(function(c) { return c.position; })
            .map(function(c) { return c.tableColumnId; })
            .value();
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
            var firstCol = _.detect(view.columns, function(c)
            { return c.tableColumnId == view.displayFormat.dataColumns[0]; });
            if (!_.include(blist.datasetUtil.chart.numericTypes,
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
            var c = blist.datasetUtil.columnForTCID(view, tcid);
            if ($.isBlank(c)) { continue; }

            if (_.include(blist.datasetUtil.chart.numericTypes, c.renderTypeName))
            {
                valueCols.push(vcVal);
                vcVal = {tableColumnId: tcid};
                if (!$.isBlank((view.displayFormat.colors || [])[i]))
                { vcVal.color = view.displayFormat.colors[i]; }
                i++;
                continue;
            }
            vcVal.supplementalColumns = vcVal.supplementalColumns || [];
            vcVal.supplementalColumns.push(tcid);
        }

        valueCols.push(vcVal);
        view.displayFormat.valueColumns = _.compact(valueCols);
    }

    delete view.displayFormat.dataColumns;

    return view;
};
