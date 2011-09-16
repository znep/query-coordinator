(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var sortableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return t.sortable ? n : null; }));

    var groupableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return !$.isBlank(t.rollUpAggregates) ? n : null; }));

    var rollUpFunctions = function(colId)
    {
        if ($.isBlank(colId)) { return null; }
        return blist.dataset.columnForID(colId).dataType.rollUpAggregates;
    };

    var isEdit = 'grouped' == blist.dataset.type &&
        blist.dataset.hasRight('update_view');

    var configName = 'filter.filterDataset';
    var config = {
        name: configName,
        priority: 3,
        title: 'Sort &amp; Roll-Up',
        subtitle: 'You can group rows together and summarize data with a roll-up; ' +
            'and sort one or more columns',
        onlyIf: function()
        {
            return isEdit ? blist.dataset.realColumns.length > 0 :
                blist.dataset.visibleColumns.length > 0 && blist.dataset.valid;
        },
        disabledSubtitle: function()
        { return !blist.dataset.valid && !isEdit ? 'This view must be valid' :
            'This view has no columns to roll-up or sort'; },
        sections: [
            // Group section
            {
                title: 'Roll-Ups & Drill-Downs', name: 'filterGroup',
                type: 'selectable',
                fields: [
                    {type: 'repeater', addText: 'Add Grouping Column',
                        name: 'query.groupBys', minimum: 0,
                        field: {type: 'columnSelect', text: 'Group By',
                            name: 'columnId', notequalto: 'groupColumn',
                            columns: {type: groupableTypes,
                                hidden: isEdit || blist.dataset.isGrouped()}},
                        wizard: 'Choose one or more columns with repeated values ' +
                            'to group them into a single row'
                    },
                    {type: 'repeater', addText: 'Add Roll-Up Column', minimum: 0,
                        name: 'columns',
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Roll-Up',
                                name: 'id', required: true,
                                notequalto: 'rollUpColumn',
                                columns: {type: groupableTypes,
                                    hidden: isEdit || blist.dataset.isGrouped()}},
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
                                columns: {type: sortableTypes, hidden: isEdit}},
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

    config.dataSource = function()
    {
        var view = blist.dataset.cleanCopy();

        view.query = view.query || {};

        return view;
    };

    var registeredChange = false;
    config.showCallback = function(sidebarObj, $pane)
    {
        if (!registeredChange)
        {
            blist.dataset.bind('query_change', function()
            { sidebarObj.refresh(configName); });
            registeredChange = true;
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var filterView = sidebarObj.getFormValues($pane);
        var query = $.extend({}, blist.dataset.query);
        query.orderBys = (filterView.query || {}).orderBys;
        query.groupBys = (filterView.query || {}).groupBys;
        filterView.query = query;
        _.each(filterView.query.orderBys || [], function(ob)
        {
            ob.ascending = (ob.ascending == 'true' || ob.ascending === true);
            ob.expression.type = 'column';
        });
        _.each(filterView.query.groupBys || [], function(gb)
        { gb.type = 'column'; });

        filterView.columns = filterView.columns || [];

        if (filterView.columns.length > 0 &&
            (filterView.query.groupBys || []).length < 1)
        {
            $pane.find('.mainError')
                .text('You must group by at least one column to roll-up a column');
            sidebarObj.finishProcessing();
            return;
        }

        if (_.any(filterView.columns, function(c)
            { return $.isBlank(c.format) ||
                $.isBlank(c.format.grouping_aggregate); }))
        {
            $pane.find('.mainError')
                .text('Each roll-up column must have a function');
            sidebarObj.finishProcessing();
            return;
        }

        // Make new columns have the correct format
        _.each(filterView.columns, function(c)
        {
            var col = blist.dataset.columnForID(c.id);
            c.format = $.extend({}, col.format, c.format);
        });

        _.each(blist.dataset.realColumns, function(c)
        {
            if (!$.isBlank(c.format.grouping_aggregate) &&
                !_.any(filterView.columns, function(fvc)
                    { return fvc.id == c.id; }))
            {
                var fmt = $.extend({}, c.format);
                delete fmt.grouping_aggregate;
                filterView.columns.push({id: c.id, format: fmt});
            }
        });

        var wasInvalid = !blist.dataset.valid;

        blist.dataset.update(filterView, false, _.isEmpty(filterView.query.groupBys));

        // Show hidden columns if we are grouped
        _.each(config.sections, function(s)
        {
            if (s.name == 'filterGroup')
            {
                _.each(s.fields, function(f)
                {
                    if (f.type == 'repeater')
                    {
                        f = f.field;
                        if (f.type == 'group')
                        {
                            f = _.detect(f.options, function(o)
                                { return o.type == 'columnSelect'; });
                        }
                        if (f.type == 'columnSelect')
                        { f.columns.hidden = isEdit || blist.dataset.isGrouped(); }
                    }
                });
            }
        });

        var finishCallback = function()
        {
            sidebarObj.finishProcessing();

            _.defer(function()
            {
                sidebarObj.addPane(configName);
                sidebarObj.show(configName);
            });
        };

        if (wasInvalid && blist.dataset.type != 'blist')
        {
            if (!blist.dataset.save(finishCallback))
            { finishCallback(); }
        }
        else
        { finishCallback(); }
    };

    $.gridSidebar.registerConfig(config, 'grouped');

})(jQuery);
