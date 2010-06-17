(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var sortableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return t.sortable ? n : null; }));

    var config = {
        name: 'filter.filterDataset',
        priority: 1,
        title: 'Filter, Sort, Roll-Up',
        subtitle: 'You can filter a view down to certain rows; sort by one or more columns; and group rows together with a roll-up',
        noReset: true,
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
                                columns: {type: sortableTypes, hidden: true}},
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
        ]
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        $.debug('view', sidebarObj.getFormValues($pane));
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
