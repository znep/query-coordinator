(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var sortableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return t.sortable ? n : null; }));

    var groupableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return !$.isBlank(t.rollUpAggregates) ? n : null; }));

    var filterableTypes = _.compact(_.map(blist.data.types, function(t, n)
    { return !$.isBlank(t.filterConditions) ? n : null; }));

    var rollUpFunctions = function(colId)
    {
        if ($.isBlank(colId)) { return null; }
        var col = _.detect(blist.display.view.columns, function(c)
        { return c.id == parseInt(colId); });
        return blist.data.types[col.dataTypeName].rollUpAggregates;
    };

    var filterOperators = function(colId)
    {
        if ($.isBlank(colId)) { return null; }
        var col = _.detect(blist.display.view.columns, function(c)
        { return c.id == parseInt(colId); });
        return blist.data.types[col.renderTypeName].filterConditions;
    };

    var filterEditor = function(sidebarObj, $field, vals, curValue)
    {
        var colId = vals['children.0.columnId'];
        var op = vals.value;
        if ($.isBlank(colId) || $.isBlank(op)) { return false; }

        if (_.include(['IS_BLANK', 'IS_NOT_BLANK'], op)) { return false; }

        var col = $.extend(true, {},
            _.detect(blist.display.view.columns, function(c)
                { return c.id == parseInt(colId); }));

        // Some types want different editors for filtering
        if (_.include(['tag', 'email', 'html'], col.renderTypeName))
        { col.renderTypeName = 'text'; }

        var $editor = $.tag({tagName: 'div', 'class': 'editorWrapper'});
        $editor.blistEditor({row: null, column: col, value: curValue});
        $field.append($editor);

        if (!$.isBlank($.uniform))
        { $field.find('select, :checkbox, :radio, :file').uniform(); }

        return true;
    };

    var filterEditorValue = function(sidebarObj, $field)
    {
        return $field.find('.editorWrapper').blistEditor().currentValue();
    };

    var filterEditorCleanup = function(sidebarObj, $field)
    {
        var $editor = $field.find('.editorWrapper');
        if ($editor.length > 0) { $editor.blistEditor().finishEdit(); }
    };

    var configName = 'filter.filterDataset';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter, Sort, Roll-Up',
        subtitle: 'You can filter a view down to certain rows; ' +
            'group rows together and summarize data with a roll-up; ' +
            'and sort one or more columns',
        dataSource: blist.display.view,
        sections: [
            // Filter section
            {
                title: 'Filter', name: 'filterFilter', type: 'selectable',
                fields: [
                    {type: 'select', text: 'Match', prompt: null,
                        name: 'query.filterCondition.type',
                        options: [
                            {text: 'all conditions', value: 'AND'},
                            {text: 'any conditions', value: 'OR'}
                        ],
                        wizard: 'Choose whether you want rows that match all ' +
                            'the conditions you choose, or any one of them'
                    },
                    {type: 'repeater', addText: 'Add Condition', minimum: 0,
                        name: 'query.filterCondition.children',
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Column',
                                name: 'children.0.columnId', required: true,
                                columns: {type: filterableTypes, hidden: false}},
                            {type: 'select', text: 'Operator', name: 'value',
                                required: true, prompt: 'Select an operator',
                                linkedField: 'children.0.columnId',
                                options: filterOperators},
                            {type: 'custom', text: 'Value', required: true,
                                name: 'children.1.value',
                                linkedField: ['children.0.columnId', 'value'],
                                editorCallbacks: {create: filterEditor,
                                    value: filterEditorValue,
                                    cleanup: filterEditorCleanup}}
                        ]},
                        wizard: 'Choose a column to filter on, what type of ' +
                            'comparison to do, and enter a value to compare ' +
                            'against.  You may enter as many conditions as you ' +
                            'want'
                    }
                ],
                wizard: 'Do you wish to filter this data down to certain values?'
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
                        wizard: 'Choose one or more columns with repeated values ' +
                            'to group all the repeated values into a single row'
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
                        wizard: 'Choose one or more columns to summarize ' +
                            'the data that has been grouped into a single row. ' +
                            'Also choose a function such as sum or count to ' +
                            'control how the data is summarized.'
                    }
                ],
                wizard: 'Do you wish to group and roll-up your data? ' +
                    'This will group repeated values into a single line, ' +
                    'and summarize the grouped data.'
            },


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
                        wizard: 'Choose one or more columns to sort by, ' +
                            'and which direction to sort each column'
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
