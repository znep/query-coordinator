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

        var firstVal = curValue;
        if (_.isArray(curValue)) { firstVal = curValue[0]; }

        var $editor = $.tag({tagName: 'div',
            'class': ['editorWrapper', col.renderTypeName]});
        $editor.blistEditor({row: null, column: col, value: firstVal});
        $field.append($editor);

        if (op == 'BETWEEN')
        {
            $field.addClass('twoEditors');
            $field.append($.tag({tagName: 'span',
                'class': ['joiner', col.renderTypeName], contents: '&amp;'}));

            var secondVal;
            if (_.isArray(curValue)) { secondVal = curValue[1]; }
            $editor = $.tag({tagName: 'div',
                'class': ['editorWrapper', col.renderTypeName]});
            $editor.blistEditor({row: null, column: col, value: secondVal});
            $field.append($editor);
        }
        else { $field.removeClass('twoEditors'); }

        if (!$.isBlank($.uniform))
        { $field.find('select, :checkbox, :radio, :file').uniform(); }

        return true;
    };

    var filterEditorRequired = function(sidebarObj, vals)
    {
        var colId = vals['children.0.columnId'];
        var op = vals.value;
        if ($.isBlank(colId) || $.isBlank(op)) { return false; }

        if (_.include(['IS_BLANK', 'IS_NOT_BLANK'], op)) { return false; }

        return true;
    };

    var filterEditorValue = function(sidebarObj, $field)
    {
        var $editor = $field.find('.editorWrapper');
        if ($editor.length < 1) { return null; }

        var vals = [];
        $editor.each(function()
        {
            var $t = $(this);
            var v = $t.blistEditor().currentValue();
            if (_.isNull(v) &&
                $t.blistEditor().column.renderTypeName == 'checkbox')
            { v = '0'; }

            if (!$.isBlank(v)) { vals.push(v); }
        });

        if (vals.length < $editor.length) { return null; }
        if (vals.length == 1) { vals = vals[0]; }

        return vals;
    };

    var filterEditorCleanup = function(sidebarObj, $field)
    {
        var $editor = $field.find('.editorWrapper');
        $editor.each(function() { $(this).blistEditor().finishEdit(); });
    };

    var isEdit = _.include(['filter', 'grouped'], blist.dataset.type) &&
        blist.dataset.hasRight('update_view');

    var configName = 'filter.filterDataset';
    var config = {
        name: configName,
        priority: 3,
        title: 'Filter, Sort, Roll-Up',
        subtitle: 'You can filter a view down to certain rows; ' +
            'group rows together and summarize data with a roll-up; ' +
            'and sort one or more columns',
        onlyIf: function()
        {
            return isEdit ? blist.dataset.realColumns.length > 0 :
                blist.dataset.visibleColumns.length > 0 && blist.dataset.valid;
        },
        disabledSubtitle: function()
        { return !blist.dataset.valid && !isEdit ? 'This view must be valid' :
            'This view has no columns to filter, roll-up or sort'; },
        sections: [
            // Filter section
            {
                title: 'Filter', name: 'filterFilter', type: 'selectable',
                fields: [
                    {type: 'select', text: 'Match', prompt: null,
                        name: 'query.filterCondition.value',
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
                                columns: {type: filterableTypes, hidden: isEdit}},
                            {type: 'select', text: 'Operator', name: 'value',
                                required: true, prompt: 'Select an operator',
                                linkedField: 'children.0.columnId',
                                options: filterOperators},
                            {type: 'custom', text: 'Value', required: true,
                                name: 'children.1.value',
                                linkedField: ['children.0.columnId', 'value'],
                                editorCallbacks: {create: filterEditor,
                                    required: filterEditorRequired,
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
                            columns: {type: groupableTypes, hidden: isEdit}},
                        wizard: 'Choose one or more columns with repeated values ' +
                            'to group them into a single row'
                    },
                    {type: 'repeater', addText: 'Add Roll-Up Column', minimum: 0,
                        name: 'columns',
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Roll-Up',
                                name: 'id', required: true,
                                notequalto: 'rollUpColumn',
                                columns: {type: groupableTypes, hidden: isEdit}},
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
        var view = $.extend(true, {}, blist.display.view);

        view.query = view.query || {};
        view.query.filterCondition = view.query.filterCondition || {};
        view.query.filterCondition.children =
            view.query.filterCondition.children || [];

        // We may have multi-part column conditions that are split apart
        // in the filterCondition.  Assume these are adjacent in the children
        // array, and attempt to put them back together
        var i = 0;
        while (i < view.query.filterCondition.children.length - 1)
        {
            var curItem = view.query.filterCondition.children[i];
            var nextItem = view.query.filterCondition.children[i+1];
            if (curItem.type != nextItem.type ||
                    curItem.value != nextItem.value)
            { i++; continue; }

            var curCol = _.detect(curItem.children, function(c)
                    { return c.type == 'column' && !$.isBlank(c.value); });
            var nextCol = _.detect(nextItem.children, function(c)
                    { return c.type == 'column' && !$.isBlank(c.value); });
            if ($.isBlank(curCol) || $.isBlank(nextCol) ||
                    curCol.columnId != nextCol.columnId ||
                    curCol.value == nextCol.value)
            { i++; continue; }

            // We (probably) found a match!
            var curVal = _.detect(curItem.children, function(c)
                    { return c.type == 'literal'; });
            var nextVal = _.detect(nextItem.children, function(c)
                    { return c.type == 'literal'; });
            if ($.isBlank(curVal) || $.isBlank(nextVal))
            { i++; continue; }

            if (!$.isPlainObject(curVal.value))
            {
                var o = {};
                o[curCol.value] = curVal.value;
                curVal.value = o;
            }

            if (_.any(curVal.value, function(v, k)
                        { return k == nextCol.value; }))
            { i++; continue; }

            // Now we found a match for real, and we have the object set up
            curVal.value[nextCol.value] = nextVal.value;
            view.query.filterCondition.children.splice(i+1, 1);
        }

        _.each(view.query.filterCondition.children, function(c)
        {
            if (!_.isArray(c.children)) { return; }

            var colObj = _.detect(c.children, function(cc)
            { return cc.type == 'column'; });
            var valObjs = _.select(c.children, function(cc)
            { return cc.type == 'literal'; });

            _.each(valObjs, function(v)
            {
                if (!$.isBlank(colObj.value) && !$.isBlank(v) &&
                    !$.isPlainObject(v.value))
                {
                    var o = {};
                    o[colObj.value] = v.value;
                    v.value = o;
                }
            });

            if (valObjs.length > 1)
            {
                valObjs = _.map(valObjs, function(v)
                { return v.value; });
                c.children = [colObj, {type: 'literal', value: valObjs}];
            }
        });

        return view;
    };

    var registeredChange = false;
    config.showCallback = function(sidebarObj, $pane)
    {
        if (!registeredChange)
        {
            sidebarObj.$grid().bind('meta_change', function()
            { sidebarObj.refresh(configName); });
            registeredChange = true;
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var filterView = sidebarObj.getFormValues($pane);
        filterView.query = filterView.query || {};
        _.each(filterView.query.orderBys || [], function(ob)
        { ob.expression.type = 'column'; });
        _.each(filterView.query.groupBys || [], function(gb)
        { gb.type = 'column'; });

        if (!$.isBlank(filterView.query.filterCondition))
        {
            filterView.query.filterCondition.type = 'operator';
            var newChildren = [];
            _.each(filterView.query.filterCondition.children || [], function(c)
            {
                c.type = 'operator';
                var splitVal;
                var colObj;
                var extraLiterals = [];
                _.each(c.children || [], function(cc)
                {
                    cc.type = !$.isBlank(cc.columnId) ? 'column' : 'literal';
                    if (cc.type == 'column')
                    { colObj = cc; }
                    else if ($.isPlainObject(cc.value))
                    { splitVal = cc.value; }
                    else if (_.isArray(cc.value))
                    {
                        for (var i = 1; i < cc.value.length; i++)
                        {
                            extraLiterals.push({type: 'literal',
                                value: cc.value[i]});
                        }
                        cc.value = cc.value[0];
                    }
                });
                c.children = c.children.concat(extraLiterals);

                if ($.isBlank(splitVal)) { newChildren.push(c); }
                else
                {
                    _.each(splitVal, function(v, k)
                    {
                        newChildren.push({type: 'operator', value: c.value,
                            children: [$.extend({value: k}, colObj),
                                {type: 'literal', value: v}]});
                    });
                }
            });
            filterView.query.filterCondition.children = newChildren;
        }

        if ((filterView.columns || []).length > 0 &&
            filterView.query.groupBys.length < 1)
        {
            $pane.find('.mainError')
                .text('You must group by at least one column to roll-up a column');
            sidebarObj.finishProcessing();
            return;
        }

        if (_.any(filterView.columns || [], function(c)
            { return $.isBlank(c.format) ||
                $.isBlank(c.format.grouping_aggregate); }))
        {
            $pane.find('.mainError')
                .text('Each roll-up column must have a function');
            sidebarObj.finishProcessing();
            return;
        }

        var dsGrid = sidebarObj.$grid().datasetGrid();

        var doViewCallback = function()
        {
            var resultCallback = function(view)
            {
                sidebarObj.finishProcessing();

                if (!$.isBlank(view))
                { $.syncObjects(blist.display.view, view); }

                if (!blist.dataset.valid)
                { dsGrid.updateValidity(blist.display.view); }

                _.defer(function()
                {
                    sidebarObj.addPane(configName);
                    sidebarObj.show(configName);
                });
            };

            if (!blist.dataset.valid &&
                !_.include(filterView.flags || [], 'default') &&
                _.include(blist.display.view.rights, 'update_view'))
            {
                $.ajax({url: '/views/' + blist.display.view.id + '.json',
                    type: 'PUT', dataType: 'json', contentType: 'application/json',
                    data: JSON.stringify(filterView), success: resultCallback});
            }
            else
            {
                model.getTempView($.extend(true, {}, blist.display.view), true,
                    resultCallback);
                dsGrid.setTempView('filterSidebar');
            }
        };

        var model = sidebarObj.$grid().blistModel();
        model.multiSort(filterView.query.orderBys, true);

        dsGrid.updateFilter(filterView.query.filterCondition, false, true);

        dsGrid.groupAggregate(filterView.query.groupBys,
            filterView.columns, false, null, true, doViewCallback, null, true);
    };

    $.gridSidebar.registerConfig(config, ['Filter', 'Grouped']);

})(jQuery);
