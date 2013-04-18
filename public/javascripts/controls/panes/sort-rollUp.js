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
        { return $.t('screens.ds.grid_sidebar.sort_rollup.title'); },

        getSubtitle: function()
        {
            return $.t('screens.ds.grid_sidebar.sort_rollup.subtitle');
        },

        isAvailable: function()
        {
            return isEdit(this) ? this._view.realColumns.length > 0 :
                this._view.visibleColumns.length > 0 && this._view.valid;
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ? $.t('screens.ds.grid_sidebar.sort_rollup.validation.invalid_view') : $.t('screens.ds.grid_sidebar.sort_rollup.validation.no_eligible_columns');
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
                    title: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.title'), name: 'filterGroup', type: 'selectable',
                    fields: [
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.add_group_button'),
                            name: 'query.groupBys', minimum: 0,
                            field: {type: 'columnSelect', text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.group_by'),
                                name: 'columnId', notequalto: 'groupColumn',
                                columns: {type: groupableTypes,
                                    hidden: isEdit(this) || this._view.isGrouped()}}
                        },
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.add_rollup_button'), minimum: 0, name: 'columns',
                            field: {type: 'group', options: [
                                {type: 'columnSelect', text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.roll_up'), name: 'id', required: true,
                                    notequalto: 'rollUpColumn', columns: {type: groupableTypes,
                                        hidden: isEdit(this) || this._view.isGrouped()}},
                                {type: 'select', text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.function'), required: true,
                                    name: 'format.grouping_aggregate', prompt: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.roll_up_function'),
                                    linkedField: 'id', options: rollUpFunctions}
                            ]}
                        }
                    ]
                });
            }

            // Sort section
            sects.push({
                title: $.t('screens.ds.grid_sidebar.sort_rollup.sort.title'), name: 'filterSort', type: 'selectable',
                fields: [
                    {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.sort_rollup.sort.add_column_button'), name: 'query.orderBys', minimum: 0,
                        field: {type: 'group', options: [
                            {type: 'columnSelect', text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.column'),
                                name: 'expression.columnId', required: true, notequalto: 'sortColumn',
                                columns: {type: sortableTypes}},
                            {type: 'select', text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.direction'),
                                name: 'ascending', prompt: null, options: [
                                    {text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.directions.ascending'), value: 'true'},
                                    {text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.directions.descending'), value: 'false'}
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
                    .text($.t('screens.ds.grid_sidebar.sort_rollup.validation.no_group_bys'));
                cpObj._finishProcessing();
                return;
            }

            if (_.any(filterView.columns, function(c)
                { return $.isBlank(c.format) || $.isBlank(c.format.grouping_aggregate); }))
            {
                cpObj.$dom().find('.mainError').text($.t('screens.ds.grid_sidebar.sort_rollup.validation.no_function'));
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
