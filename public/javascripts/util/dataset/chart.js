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

Dataset.textualTypes = ['text', 'drop_down_list'];
Dataset.numericTypes = ['number', 'percent', 'money'];
Dataset.dateTypes = ['calendar_date', 'date'];

Dataset.chartTypes = {
    area: {value: 'area', text: 'Area Chart',
        requiredColumns: [Dataset.textualTypes, Dataset.numericTypes]},
    bar: {value: 'bar', text: 'Bar Chart',
        requiredColumns: [Dataset.textualTypes, Dataset.numericTypes]},
    column: {value: 'column', text: 'Column Chart',
        requiredColumns: [Dataset.textualTypes, Dataset.numericTypes]},
    donut: {value: 'donut', text: 'Donut Chart',
        requiredColumns: [Dataset.textualTypes, Dataset.numericTypes]},
    line: {value: 'line', text: 'Line Chart',
        requiredColumns: [Dataset.numericTypes]},
    pie: {value: 'pie', text: 'Pie Chart',
        requiredColumns: [Dataset.textualTypes, Dataset.numericTypes]},
    timeline: {value: 'timeline', text: 'Time Line',
        requiredColumns: [Dataset.dateTypes, Dataset.numericTypes]}
};

Dataset.modules['visualization'] =
{
    hasRequiredColumns: function(cols, reqCols, includeHidden)
    {
        cols = cols.slice();
        return _.all(reqCols, function(rc)
        {
            var col = _.detect(cols, function(c)
            {
                return _.include(rc, c.renderTypeName) && (includeHidden ||
                    c.hidden);
            });

            if ($.isBlank(col)) { return false; }
            cols = _.without(cols, col);
            return true;
        });
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

        return this.hasRequiredColumns(_.compact(foundCols),
            Dataset.chartTypes[this.displayFormat.chartType].requiredColumns);
    },

    _convertLegacy: function()
    {
        var view = this;

        var ct = view.displayFormat.chartType || view.origDisplayType;
        view.displayFormat.chartType = legacyTypes[ct] || ct;

        if ($.isBlank(view.displayFormat.dataColumns) &&
            $.isBlank(view.displayFormat.fixedColumns) &&
            $.isBlank(view.displayFormat.valueColumns))
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
                var c = view.columnForTCID(tcid);
                if ($.isBlank(c)) { continue; }

                if (_.include(Dataset.numericTypes, c.renderTypeName))
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
    }
};

})();
