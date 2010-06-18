(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var sortableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return t.sortable ? n : null; }));

    var configName = 'filter.filterDataset';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter, Sort, Roll-Up',
        subtitle: 'You can filter a view down to certain rows; sort by one or more columns; and group rows together with a roll-up',
        dataSource: blist.display.view,
        sections: [
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
            }
        ],
        finishBlock: {
            buttons: [
                {text: 'Apply', isDefault: true, value: true},
                $.gridSidebar.buttons.cancel
            ],
            wizard: 'Choose whether to Apply these options to the current view of the data, or Save a new filter with these options'
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var filterView = sidebarObj.getFormValues($pane);
        _.each(filterView.query.orderBys, function(ob)
        { ob.expression.type = 'column'; });

        sidebarObj.$grid().blistModel().multiSort(filterView.query.orderBys);
        sidebarObj.finishProcessing();
        sidebarObj.addPane(configName);
        sidebarObj.show(configName);
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
