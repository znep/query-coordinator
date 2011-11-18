(function($)
{
    var sortableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return t.sortable ? n : null; }));

    var groupableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return !$.isBlank(t.rollUpAggregates) ? n : null; }));

    var rollUpFunctions = function(colId)
    {
        if ($.isBlank(colId)) { return null; }
        return this._view.columnForID(colId).dataType.rollUpAggregates;
    };

    $.Control.extend('pane_sortRollUp', {
        getTitle: function()
        { return 'Sort &amp; Roll-Up'; },

        getSubtitle: function()
        {
            return 'You can group rows together and summarize data with a roll-up; ' +
                'and sort one or more columns';
        },

        isAvailable: function()
        {
            return isEdit(this) ? this._view.realColumns.length > 0 :
                this._view.visibleColumns.length > 0 && this._view.valid;
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ? 'This view must be valid' :
                'This view has no columns to roll-up or sort';
        },

        _getCurrentData: function()
        { return this._super() || this._view.cleanCopy(); },

        _getSections: function()
        {
            var sects = [];
            if (!this._view.isUnpublished())
            {
                // Group section
                sects.push({
                    title: 'Roll-Ups & Drill-Downs', name: 'filterGroup', type: 'selectable',
                    fields: [
                        {type: 'repeater', addText: 'Add Grouping Column',
                            name: 'query.groupBys', minimum: 0,
                            field: {type: 'columnSelect', text: 'Group By',
                                name: 'columnId', notequalto: 'groupColumn',
                                columns: {type: groupableTypes,
                                    hidden: isEdit(this) || this._view.isGrouped()}}
                        },
                        {type: 'repeater', addText: 'Add Roll-Up Column', minimum: 0, name: 'columns',
                            field: {type: 'group', options: [
                                {type: 'columnSelect', text: 'Roll-Up', name: 'id', required: true,
                                    notequalto: 'rollUpColumn', columns: {type: groupableTypes,
                                        hidden: isEdit(this) || this._view.isGrouped()}},
                                {type: 'select', text: 'Function', required: true,
                                    name: 'format.grouping_aggregate', prompt: 'Select a function',
                                    linkedField: 'id', options: rollUpFunctions}
                            ]}
                        }
                    ]
                });
            }

            // Sort section
            sects.push({
                title: 'Sort', name: 'filterSort', type: 'selectable',
                fields: [
                    {type: 'repeater', addText: 'Add Column', name: 'query.orderBys', minimum: 0,
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: 'Column',
                                name: 'expression.columnId', required: true, notequalto: 'sortColumn',
                                columns: {type: sortableTypes, hidden: isEdit(this)}},
                            {type: 'select', text: 'Direction',
                                name: 'ascending', prompt: null, options: [
                                    {text: 'Ascending', value: 'true'},
                                    {text: 'Descending', value: 'false'}
                                ]}
                        ]}
                    }
                ]
            });
            return sects;
        },

        shown: function()
        {
            var cpObj = this;
            cpObj._super();
            if (!cpObj._registeredChange)
            {
                cpObj._view.bind('query_change', function() { cpObj.reset(); }, cpObj);
                cpObj._registeredChange = true;
            }
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var filterView = cpObj._getFormValues();
            var query = $.extend({}, cpObj._view.query);
            if (!$.isBlank(filterView.query))
            {
                _.each(['orderBys', 'groupBys'], function(by)
                {
                    if (!$.isBlank(filterView.query[by]))
                    { query[by] = filterView.query[by]; }
                });
            }
            filterView.query = query;
            _.each(filterView.query.orderBys || [], function(ob)
            {
                ob.ascending = (ob.ascending == 'true' || ob.ascending === true);
                ob.expression.type = 'column';
            });
            if (!_.isEmpty(filterView.query.groupBys))
            {
                filterView.query.groupBys = _.select(filterView.query.groupBys,
                        function(gb)
                        {
                            gb.type = 'column';
                            return !$.isBlank(gb.columnId);
                        });
            }

            filterView.columns = filterView.columns || [];

            if (filterView.columns.length > 0 && (filterView.query.groupBys || []).length < 1)
            {
                cpObj.$dom().find('.mainError')
                    .text('You must group by at least one column to roll-up a column');
                cpObj._finishProcessing();
                return;
            }

            if (_.any(filterView.columns, function(c)
                { return $.isBlank(c.format) || $.isBlank(c.format.grouping_aggregate); }))
            {
                cpObj.$dom().find('.mainError').text('Each roll-up column must have a function');
                cpObj._finishProcessing();
                return;
            }

            // Make new columns have the correct format
            _.each(filterView.columns, function(c)
            {
                var col = cpObj._view.columnForID(c.id);
                c.format = $.extend({}, col.format, c.format);
            });

            _.each(cpObj._view.realColumns, function(c)
            {
                if (!$.isBlank(c.format.grouping_aggregate) &&
                    !_.any(filterView.columns, function(fvc) { return fvc.id == c.id; }))
                {
                    var fmt = $.extend({}, c.format);
                    delete fmt.grouping_aggregate;
                    filterView.columns.push({id: c.id, format: fmt});
                }
            });

            var wasInvalid = !cpObj._view.valid;

            if (_.isEmpty(filterView.columns))
            { delete filterView.columns; }
            cpObj._view.update(filterView, false, _.isEmpty(filterView.query.groupBys));

            var finishCallback = function()
            {
                cpObj._finishProcessing();

                _.defer(function() { cpObj.reset(); });
                if (_.isFunction(finalCallback)) { finalCallback(); }
            };

            if (wasInvalid && cpObj._view.type != 'blist')
            {
                if (!cpObj._view.save(finishCallback))
                { finishCallback(); }
            }
            else
            { finishCallback(); }
        }

    }, {name: 'sortRollUp'}, 'controlPane');

    var isEdit = function(cpObj)
    { return 'grouped' == cpObj._view.type && cpObj._view.hasRight('update_view'); };

    if ($.isBlank(blist.sidebarHidden.filter) || !blist.sidebarHidden.filter.filterDataset)
    { $.gridSidebar.registerConfig('filter.sortRollUp', 'pane_sortRollUp', 3, 'grouped'); }

})(jQuery);
