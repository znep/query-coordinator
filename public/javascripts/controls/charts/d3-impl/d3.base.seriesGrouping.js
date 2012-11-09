// future improvements:
// * make obsolete w/ core server cubing
// * currently assumes well-formed data: fully-specified combinatorics (filled cube).
//   can make robust to not well-formed many-rowed data by intercepting and overriding
//   getDataForView() and using an inline filter to filter down to the rows specified in
//   the actual render ipml's getRenderRange(), then doing a straight getAllRows().

(function($)
{

var d3base = blist.namespace.fetch('blist.d3.base');

var globalColorIndex = {};
var globalColorBasis = [];

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

        var maybeDone = _.after(2, function()
        {
            // this is saved down below. Now that we have everything we need
            // to get ready, process some things and allow everything to init.
            vizObj._preprocessSeriesColumns();
            // Manually trigger this event on the primary view for things like the sidebar
            vizObj._primaryView.trigger('row_count_change');
            sg.superInit.call(vizObj);
        });

        // make another copy of the view that we'll use to get the category-relevant rows
        // piggyback off sortedView so that the categories come back sorted
        var categoryGroupedView = sortedView.clone();
        var fixedColumn = vizObj._fixedColumns[0];
        categoryGroupedView.update({ query: $.extend({}, sortedView.query, {
            groupBys: [{
                columnId: fixedColumn.id,
                type: 'column'
            }]
        }) });
        categoryGroupedView.getAllRows(function(rows)
        {
            sg.categoryGroupedRows = rows;
            maybeDone();
        });

        // make yet another copy of the view grouped by the series columns, so we can
        // just evaluate all the possible combinations of creating series columns up
        // front, rather than trying to piece things together as we go.
        var seriesGroupedView = sg.seriesGroupedView = sortedView.clone();
        var seriesGroupedColumns = _.without(sortColumns, vizObj._fixedColumns[0]);
        seriesGroupedView.update({ query: $.extend({}, sortedView.query, {
            groupBys: _.map(seriesGroupedColumns, function(col)
            {
                return {
                    columnId: col.id,
                    type: 'column'
                };
            })
        }) });
        seriesGroupedView.getAllRows(function(rows)
        {
            sg.seriesGroupedRows = rows;
            maybeDone();
        });

        // clear the global color cache if the user changes the color settings
        var colorBasis = _.map(vizObj._valueColumns, function(col) { return col.color; });
        if (!_.isEqual(globalColorBasis, colorBasis))
        {
            globalColorIndex = {};
            globalColorBasis = colorBasis;
        }

        // we're explicitly not calling _super here. we'll save it off, and
        // initialize the rest of the chain once we're ready here. saves a
        // lot of bad hackery.
        sg.superInit = vizObj._super;
    },

    cleanVisualization: function()
    {
        delete this._seriesGrouping;
        this._super();
    },

    _preprocessSeriesColumns: function()
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            fixedColumn = vizObj._fixedColumns[0];

        // figure out our categories and make virtual row index lookups for them.
        _.each(sg.categoryGroupedRows, function(row)
        {
            sg.categoryIndexLookup[row[fixedColumn.lookup]] = row.index;
        });
        sg.totalVirtualRows = sg.categoryGroupedRows.length;

        // figure out our series columns.
        _.each(sg.seriesGroupedRows, function(row)
        {
            var groupName = vizObj._groupName(row);

            // need to create a virtual column for each value column/seriesgroup
            // product
            _.each(vizObj._valueColumns, function(valueCol)
            {
                var virtualColumnName = (vizObj._valueColumns.length === 1) ?
                        groupName : valueCol.column.name + ', ' + groupName;

                if (!_.isUndefined(sg.virtualColumns[virtualColumnName]))
                {
                    // something has gone wrong
                    console.log('Error: got a dupe virt col somehow?');
                    return;
                }

                // save as obj for quick reference below
                var virtualId = -100 - _.keys(sg.virtualColumns).length; // use negative id space to avoid confusion
                sg.virtualColumns[virtualColumnName] = {
                    color: vizObj._getColorForColumn(valueCol, virtualColumnName),
                    groupName: groupName,
                    column: {
                        id: virtualId,
                        lookup: virtualId,
                        name: virtualColumnName,
                        realValueColumn: valueCol,
                        dataType: valueCol.column.dataType
                    }
                };
            });
        });

        // mark that we're ready for business, and if we've already had a customer
        // fire it off for them now that we're thundercats ho
        sg.ready = true;
        if (sg.wantsData === true)
        {
            vizObj.getDataForView(vizObj._primaryView);
//            vizObj.handleRowCountChange(); <-- probably not needed
        }
    },

    getDataForView: function(view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        if (sg.ready !== true)
        {
            sg.wantsData = true;
            return;
        }

        vizObj._super(sg.sortedView);
    },

    getRenderRange: function(view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        var virtualRenderRange = vizObj._super(view);
        return { start: virtualRenderRange.start * sg.virtualColumns.length,
                 length: virtualRenderRange.length * sg.virtualColumns.length };
    },

    renderData: function(data)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            fixedColumn = vizObj._fixedColumns[0],
            view = vizObj._primaryView;

        // drop values where they belong
        _.each(data, function(row)
        {
            // first get our virtual row, which will simply be the row for whatever
            // category we happen to have. create if it doesn't exist.
            var category = row[fixedColumn.id];
            var virtualRow;
            if ($.isBlank(sg.virtualRows[category]))
            {
                virtualRow = {
                    id: -100 - sg.categoryIndexLookup[category],
                    index: sg.categoryIndexLookup[category],
                    invalid: {},
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

                if (view.highlights && view.highlights[virtualRow.id] &&
                    view.highlightsColumn[virtualRow.id] == virtualColumn.column.id)
                {
                    // this virtual row is currently marked as highlighted for this virtual column
                    // of data. should it be unmarked?
                    if (!view.highlights || !view.highlights[row.id])
                    {
                        view.unhighlightRows(virtualRow);
                    }
                }
                if (view.highlights && view.highlights[row.id])
                {
                    view.highlightRows(virtualRow, null, virtualColumn.column, true);
                }
            });
        });

        // did we not get enough rows to flesh out our viewport? if so
        // go get more
        if (false)
        {
            // TODO: how do we even what
        }

        // render what we've got
        vizObj._super(_.values(sg.virtualRows));
    },

    removeRow: function(row, view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            fixedColumn = vizObj._fixedColumns[0],
            category = row[fixedColumn.id],
            vRow = sg.virtualRows[category];

        // A removed row might in reality be present in the sortedView, and should exist
        if (sg.sortedView && sg.sortedView.rowForID(row.id))
        { return; }

        vizObj._super.apply(vizObj, arguments);

        if (!$.isBlank(vRow))
        {
            var rejectedKeys = [];
            _.each(vRow.realRows, function(rr, k)
                    { if (rr.id == row.id) { rejectedKeys.push(k); } });
            _.each(rejectedKeys, function(rk)
                    {
                        delete vRow[rk];
                        delete vRow.realRows[rk];
                    });
        }
    },

    _groupName: function(row)
    {
        var vizObj = this;

        return _.compact(_.map(vizObj._seriesColumns, function(col)
        {
            var t = vizObj._renderCellText(row, col.column);
            if ($.subKeyDefined(vizObj._displayFormat, 'seriesNames.' + t))
            { t = vizObj._displayFormat.seriesNames[t]; }
            return t;
        })).join(', ');
    },

    _getColorForColumn: function(valueColumn, virtualColumnName)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            lookup = valueColumn.column.id;

        // if we've already seen this lookup return the color for it (for hstp)
        if (globalColorIndex[virtualColumnName]) return globalColorIndex[virtualColumnName];

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
                newSeedHsb.h = (newSeedHsb.h + 20) % 360;
                var newSeed = $.rgbToHex($.hsvToRgb(newSeedHsb));
                sg.valueColumnColors[lookup] = { seed: '#' + newSeed, current: '#' + newSeed };
            }
            else
            {
                sg.valueColumnColors[lookup].current = newColor;
            }
        }

        // save off this lookup globally
        globalColorIndex[virtualColumnName] = sg.valueColumnColors[lookup].current;

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
    }
};

})(jQuery);
