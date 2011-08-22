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

Dataset.chart.types = {
    area: {value: 'area', text: 'Area Chart',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    bar: {value: 'bar', text: 'Bar Chart',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 40 }},
    bubble: {value: 'bubble', text: 'Bubble Chart',
        requiredColumns: [Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    column: {value: 'column', text: 'Column Chart',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 100 }},
    donut: {value: 'donut', text: 'Donut Chart',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 30 }, renderOther: true},
    line: {value: 'line', text: 'Line Chart',
        requiredColumns: [Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    pie: {value: 'pie', text: 'Pie Chart',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 30 }, renderOther: true},
    timeline: {value: 'timeline', text: 'Time Line',
        requiredColumns: [Dataset.chart.dateTypes, Dataset.chart.numericTypes],
        displayLimit: { labels: 50, points: 300 }},
    treemap: {value: 'treemap', text: 'Tree Map',
        requiredColumns: [Dataset.chart.textualTypes, Dataset.chart.numericTypes],
        displayLimit: { points: 100 }, renderOther: true}
};

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

        var view = this;
        var foundCols = [];
        _.each(this.displayFormat.fixedColumns || [], function(fc)
        { foundCols.push(view.columnForTCID(fc)); });

        _.each(this.displayFormat.valueColumns || [], function(vc)
        { foundCols.push(view.columnForTCID(vc.tableColumnId)); });

        var ct = Dataset.chart.types[this.displayFormat.chartType];
        if ($.isBlank(ct)) { return false; }
        return Dataset.chart.hasRequiredColumns(_.compact(foundCols),
            ct.requiredColumns);
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
                var firstCol = view.columnForTCID(
                    view.displayFormat.dataColumns[0]);
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

        if (view.displayFormat.chartType == 'treemap' && view.displayFormat.baseColor)
        {
            view.displayFormat.colors =
                [view.displayFormat.baseColor, '#042656', '#19538b', '#6a9feb', '#bed6f7'];
        }
    }
};

})();
