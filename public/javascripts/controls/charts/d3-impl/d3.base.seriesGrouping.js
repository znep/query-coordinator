(function($)
{
    
var d3base = blist.namespace.fetch('blist.d3.base');

// honestly i really think this is a soql thing, not a presentation thing.
// but we're using it in enough places that i'll implement a stopgap for now.

// remix the data we're getting back in a way that's transparent to the
// impl layers to account for series grouping. meant to be mixed in
// *after* the impl itself, since we need to intercept stuff
d3base.seriesGrouping = {
    _seriesGroupingSentinel: true,

    initializeVisualization: function()
    {
        var vizObj = this;
        vizObj.getColumns();

        var sg = vizObj._seriesGrouping = {
            categoryIndexLookup: {},
            groupedView: null,
            physicalRowsRetreived: 0,
            ready: false,
            sortedView: null,
            totalVirtualRows: null,
            valueColumnColors: {},
            virtualColumns: {},
            virtualRows: {}
        };

        // make a copy of the view that we'll use for querying so that we're
        // fetching everything in the appropriate sort
        var sortedView = sg.sortedView = vizObj._primaryView.clone();
        var sortColumns = [];

        // first sort by the category
        sortColumns.push(vizObj._fixedColumns[0]);

        // then sort by the series groups in order
        sortColumns = sortColumns.concat(_.pluck(vizObj._seriesColumns, 'column'));

        // set up the sort
        sortedView.update({ query: $.extend({}, sortedView.query, {
            orderBys: _.map(sortColumns, function(col)
            {
                return {
                    ascending: true,
                    expression: {
                        columnId: col.id,
                        type: 'column'
                    }
                };
            })
        }) });

        // make another copy of the view that we'll use to get the category-relevant rows
        // piggyback off sortedView so that the categories come back sorted
        var groupedView = sg.groupedView = sortedView.clone();
        var fixedColumn = vizObj._fixedColumns[0];
        groupedView.update({ query: $.extend({}, sortedView.query, {
            groupBys: [{
                columnId: fixedColumn.id,
                type: 'column'
            }]
        }) });

        vizObj._super();
    },

    cleanVisualization: function()
    {
        delete this._seriesGrouping;
    },

    getDataForView: function(view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            _super = vizObj._super; // need to save this off since it gets called async

        // also need to fetch category rows
        sg.groupedView.getRows(0, 50, function(rows)
        {
            if (!_.isNumber(sg.totalVirtualRows))
            {
                // once we know the rowcount, send off a request to get them all
                sg.totalVirtualRows = sg.groupedView.totalRows();
                if (sg.totalVirtualRows > 50)
                {
                    sg.groupedView.getRows(50, sg.totalVirtualRows);
                }
            }

            // shuffle the rows into the array
            var fixedColumn = vizObj._fixedColumns[0];
            _.each(rows, function(row)
            {
                sg.categoryIndexLookup[row[fixedColumn.id]] = row.index;
            });

            // once we're ready trigger super
            // TODO: could be parallelized but i can't even begin to think through that
            if (sg.totalVirtualRows === _.keys(sg.categoryIndexLookup).length)
            {
                // need to plug in the sortedview to look through instead.
                _super.call(vizObj, sg.sortedView);
            }
        });
    },

    getRenderRange: function(view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        if (!sg.ready)
        {
            // just fetch more rows until we get a repeat. we don't really have any
            // way of predicting when that'll happen.
            return { start: sg.physicalRowsRetreived, length: 50 };
        }
        else
        {
            var virtualRenderRange = vizObj._super(view);
            // TODO: translate to physical range before returning
            return virtualRenderRange;
        }
    },

    renderData: function(data)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            justReadied = false,
            createdVirtualColumns = false;

        // collate what we just got into virtual columns.
        _.each(data, function(row)
        {
            var groupName = vizObj._groupName(row);

            // need to create a virtual column for each value column/seriesgroup
            // product
            _.each(vizObj._valueColumns, function(valueCol)
            {
                var virtualColumnName = (vizObj._valueColumns.length === 1) ?
                        groupName : valueCol.column.name + ', ' + groupName;

                if (!$.isBlank(sg.virtualColumns[virtualColumnName]))
                {
                    // we miiiight have everything...? WHATEVER THUNDERCATS HO
                    justReadied = sg.ready = true;
                    return false;
                }

                createdVirtualColumns = true;

                // save as obj for quick reference below
                sg.virtualColumns[virtualColumnName] = {
                    color: vizObj._getNextColor(valueCol),
                    groupName: groupName,
                    column: {
                        id: -100 - _.keys(sg.virtualColumns).length, // use negative id space to avoid confusion
                        name: virtualColumnName,
                        realValueColumn: valueCol,
                        dataType: valueCol.column.dataType
                    }
                };
            });
        });

        // drop values where they belong
        var fixedColumn = vizObj._fixedColumns[0];
        _.each(data, function(row)
        {
            // first get our virtual row, which will simply be the row for whatever
            // category we happen to have. create if it doesn't exist.
            var category = row[fixedColumn.id];
            var virtualRow;
            if ($.isBlank(sg.virtualRows[category]))
            {
                virtualRow = {
                    id: sg.categoryIndexLookup[category],
                    index: sg.categoryIndexLookup[category],
                    realRows: {}
                };
                virtualRow[vizObj._fixedColumns[0].id] = category;

                sg.virtualRows[category] = virtualRow;
            }
            else
            {
                virtualRow = sg.virtualRows[category];
            }

            // now we need to plop in our virtual column value(s) to the virtual row
            var groupName = vizObj._groupName(row);
            _.each(vizObj._valueColumns, function(valueCol)
            {
                var virtualColumnName = (vizObj._valueColumns.length > 1) ?
                    valueCol.column.name + ', ' + groupName : groupName;
                var virtualColumn = sg.virtualColumns[virtualColumnName];

                virtualRow[virtualColumn.column.id] = row[valueCol.column.id];
                virtualRow.realRows[virtualColumn.column.id] = row;

                if (virtualRow.sessionMeta &&
                    (virtualRow.sessionMeta.highlight === true) &&
                    (virtualRow.sessionMeta.highlightColumn == virtualColumn.groupName))
                {
                    // this virtual row is currently marked as highlighted for this virtual column
                    // of data. should it be unmarked?
                    if (!row.sessionMeta || !row.sessionMeta.highlight)
                    {
                        delete virtualRow.sessionMeta.highlight;
                        delete virtualRow.sessionMeta.highlightColumn;
                    }
                }
                if (row.sessionMeta && row.sessionMeta.highlight)
                {
                    virtualRow.sessionMeta = virtualRow.sessionMeta || {};
                    virtualRow.sessionMeta.highlight = true;
                    virtualRow.sessionMeta.highlightColumn = virtualColumn.groupName;
                }
            });
        });

        // are we not ready yet? if not, go fetch some more rows
        // TODO: since this callback happens in chunks, this can overfetch.
        if (!sg.ready)
        {
            _.defer(function()
            {
                // just call getData again; render range calculator will
                // figure out what's going on
                vizObj.getDataForView();
            });
        }
        else
        {
            // did we not get enough rows to flesh out our viewport? if so
            // go get more
            if (false)
            {
                // TODO: how do we even what
            }

            // resize if we just readied
            if (justReadied) vizObj.handleRowCountChange();

            // render what we've got
            vizObj._super(_.values(sg.virtualRows));
        }
    },

    _groupName: function(row)
    {
        var vizObj = this;

        return _.map(vizObj._seriesColumns, function(col)
        {
            return row[col.column.id];
        }).join(', ');
    },

    _getNextColor: function(valueColumn)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            lookup = valueColumn.column.id;

        var currentColor = sg.valueColumnColors[lookup];
        if (!currentColor)
        {
            sg.valueColumnColors[lookup] = { seed: valueColumn.color, current: valueColumn.color };
        }
        else
        {
            var newColor = '#' + $.rgbToHex($.brighten(currentColor.current, 20));
            if (newColor == currentColor.current)
            {
                // rotate seed around hsv wheel by a bit and start over
                var newSeedHsb = $.rgbToHsv($.hexToRgb(currentColor.seed));
                newSeedHsb.h = (newSeedHsb.h + 10) % 360;
                var newSeed = $.rgbToHex($.hsvToRgb(newSeedHsb));
                sg.valueColumnColors[lookup] = { seed: newSeed, current: newSeed };
            }
            else
            {
                sg.valueColumnColors[lookup].current = newColor;
            }
        }
        return sg.valueColumnColors[lookup].current;
    },

    getValueColumns: function()
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        // could return null; callers need to handle.
        if (!sg || !sg.ready)
        {
            return null;
        }

        return _.values(sg.virtualColumns);
    },

    getTotalRows: function()
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        // could return null; callers need to handle.
        if (!sg || !sg.ready)
        {
            return null
        }
        return sg.totalVirtualRows;
    },

    handleMouseOver: function(rObj, colDef, row, yScale)
    {
        // swap out virtual col/row references for hard references
        var vizObj = this;
        vizObj._super(rObj, colDef.column.realValueColumn, row.realRows[colDef.column.id], yScale);
    },

    handleMouseOut: function(rObj, colDef, row, yScale)
    {
        // swap out virtual col/row references for hard references
        var vizObj = this;
        vizObj._super(rObj, colDef.column.realValueColumn, row.realRows[colDef.column.id], yScale);
    },

    _d3_colorizeRow: function(colDef)
    {
        return this._super(colDef, function(colDef) { return colDef.groupName; });
    }
};

})(jQuery);
