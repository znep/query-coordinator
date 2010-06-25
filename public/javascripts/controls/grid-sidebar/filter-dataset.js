(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var sortableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return t.sortable ? n : null; }));

    var groupableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return t.groupable ? n : null; }));

    var rollUpFunctions = function(colId)
    {
        if ($.isBlank(colId)) { return null; }
        var col = _.detect(blist.display.view.columns, function(c)
        { return c.id == parseInt(colId); });
        return blist.data.types[col.dataTypeName].rollUpAggregates;
    };

    var configName = 'filter.filterDataset';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter, Sort, Roll-Up',
        subtitle: 'You can filter a view down to certain rows; sort by one or more columns; and group rows together with a roll-up',
        dataSource: blist.display.view,
        sections: [
            // Sort section
            {
                title: 'Sort', name: 'filterSort', type: 'selectable',
                fields: [
                    {type: 'repeater', addText: 'Add Column',
                        name: 'query.orderBys', minimum: 0,
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Column',
                                name: 'expression.columnId', required: true,
                                notequalto: 'sortColumn',
                                columns: {type: sortableTypes, hidden: false}},
                            {type: 'select', text: 'Direction',
                                name: 'ascending', prompt: null, options: [
                                    {text: 'Ascending', value: 'true'},
                                    {text: 'Descending', value: 'false'}
                                ]}
                        ]},
                        wizard: 'Choose one or more columns to sort by, and which direction to sort each column'
                    }
                ],
                wizard: 'Do you want to sort this data?'
            },

            // Group section
            {
                title: 'Roll-Ups & Drill-Downs', name: 'filterGroup',
                type: 'selectable',
                fields: [
                    {type: 'repeater', addText: 'Add Grouping Column',
                        name: 'query.groupBys', minimum: 0,
                        field: {type: 'columnSelect', text: 'Group By',
                            name: 'columnId', notequalto: 'groupColumn',
                            columns: {type: groupableTypes, hidden: false}},
                        wizard: 'Choose one or more columns with repeated values to group all the repeated values into a single row'
                    },
                    {type: 'repeater', addText: 'Add Roll-Up Column', minimum: 0,
                        name: 'columns',
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Roll-Up',
                                name: 'id', required: true,
                                notequalto: 'rollUpColumn',
                                columns: {type: groupableTypes, hidden: false}},
                            {type: 'select', text: 'Function', required: true,
                                name: 'format.grouping_aggregate',
                                prompt: 'Select a function',
                                linkedField: 'id', options: rollUpFunctions}
                        ]},
                        wizard: 'Choose one or more columns to summarize the data that has been grouped into a single row.  ' +
                        'Also choose a function such as sum or count to control how the data is summarized.'
                    }
                ],
                wizard: 'Do you wish to group and roll-up your data?  This groups repeated values into a single line, and summarizes the grouped data.'
            }
        ],
        finishBlock: {
            buttons: [
                {text: 'Apply', isDefault: true, value: true},
                $.gridSidebar.buttons.cancel
            ],
            wizard: 'Apply these options to the current view of the data'
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        sidebarObj.finishProcessing();

        var filterView = sidebarObj.getFormValues($pane);
        filterView.query = filterView.query || {};
        _.each(filterView.query.orderBys || [], function(ob)
        { ob.expression.type = 'column'; });
        _.each(filterView.query.groupBys || [], function(gb)
        { gb.type = 'column'; });

        if ((filterView.columns || []).length > 0 &&
            filterView.query.groupBys.length < 1)
        {
            $pane.find('.mainError')
                .text('You must group by at least one column to roll-up a column');
            return;
        }

        if (_.any(filterView.columns || [], function(c)
            { return $.isBlank(c.format) ||
                $.isBlank(c.format.grouping_aggregate); }))
        {
            $pane.find('.mainError')
                .text('Each roll-up column must have a function');
            return;
        }

        var model = sidebarObj.$grid().blistModel();
        model.multiSort(filterView.query.orderBys, true);

        var dsGrid = sidebarObj.$grid().datasetGrid();
        dsGrid.groupAggregate(filterView.query.groupBys,
            filterView.columns, false, null, true, null, null, true);

        model.getTempView($.extend(true, {}, blist.display.view));

        dsGrid.setTempView('filterSidebar');

        _.defer(function()
        {
            sidebarObj.addPane(configName);
            sidebarObj.show(configName);
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
