(function($)
{
    var sortableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return t.sortable ? n : null; }));

    var groupableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    { return !$.isBlank(t.rollUpAggregates) ? n : null; }));

    var rollUpFunctions = function(colFN)
    {
        if ($.isBlank(colFN)) { return null; }
        return this._view.columnForIdentifier(colFN).dataType.rollUpAggregates;
    };

    var groupFunctions = function(colFN)
    {
        if ($.isBlank(colFN)) { return 'hidden'; }
        return this._view.columnForIdentifier(colFN).dataType.groupFunctions || 'hidden';
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
            return !this._view.valid && !isEdit(this) ? $.t('screens.ds.grid_sidebar.base.validation.invalid_view') : $.t('screens.ds.grid_sidebar.sort_rollup.validation.no_eligible_columns');
        },

        _getCurrentData: function()
        { return this._super() || this._view.cleanCopy(); },

        // SODA 2 does not currently allow grouping by DateTime w/ TimeZone
        _filteredGroupableTypesForSoda2: function(view) {
            return _.select(groupableTypes, function(type) {
               return view.newBackend ? type != 'date' : true;
            });
        },

        _getSections: function()
        {
            var sects = [];

            if (!this._view.isUnpublished())
            {
                // Group section
                sects.push({
                    name: 'filterGroup', type: 'selectable',
                    title: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.title'),
                    fields: [
                        { type: 'repeater', name: 'metadata.jsonQuery.group', minimum: 0,
                            addText: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.add_group_button'),
                            field: { type: 'group', options: [
                                { type: 'columnSelect', name: 'columnFieldName', notequalto: 'groupColumn',
                                    useFieldName: true,
                                    text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.group_by'),
                                columns: { type: this._filteredGroupableTypesForSoda2(this._view), noDefault: true,
                                    hidden: isEdit(this) || this._view.isGrouped() } },
                                { type: 'select', name: 'groupFunction',
                                    text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.group_function_label'),
                                    prompt: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.group_function_prompt'),
                                    options: groupFunctions, linkedField: 'columnFieldName' }
                            ] }
                        },
                        { type: 'repeater', minimum: 0, name: 'metadata.jsonQuery.select',
                            addText: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.add_rollup_button'),
                            field: { type: 'group', options: [
                                { type: 'columnSelect', name: 'columnFieldName', required: true,
                                    useFieldName: true,
                                    text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.roll_up'),
                                    notequalto: 'rollUpColumn', columns: { type: this._filteredGroupableTypesForSoda2(this._view),
                                        noDefault: true,
                                        hidden: isEdit(this) || this._view.isGrouped() }},
                                { type: 'select', required: true, name: 'aggregate',
                                    text: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.function'),
                                    prompt: $.t('screens.ds.grid_sidebar.sort_rollup.rollup.roll_up_function'),
                                    linkedField: 'columnFieldName', options: rollUpFunctions }
                            ] }
                        }
                    ]
                });
            }

            // Sort section
            sects.push({
                name: 'filterSort', type: 'selectable',
                title: $.t('screens.ds.grid_sidebar.sort_rollup.sort.title'),
                fields: [
                    { type: 'repeater', name: 'metadata.jsonQuery.order', minimum: 0,
                        addText: $.t('screens.ds.grid_sidebar.sort_rollup.sort.add_column_button'),
                        field: { type: 'group', options: [
                            { type: 'columnSelect', name: 'columnFieldName', required: true,
                                notequalto: 'sortColumn', useFieldName: true,
                                text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.column'),
                                columns: { type: sortableTypes } },
                            { type: 'select', name: 'ascending', prompt: null,
                                text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.direction'),
                                options: [
                                    { text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.directions.ascending'), value: 'true' },
                                    { text: $.t('screens.ds.grid_sidebar.sort_rollup.sort.directions.descending'), value: 'false' }
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
            var md = $.extend(true, {}, cpObj._view.metadata);
            var query = md.jsonQuery;
            // Copy orders & groups over always, because this is truth
            _.each(['order', 'group', 'select'], function(by)
            { query[by] = ((filterView.metadata || {}).jsonQuery || {})[by]; });
            filterView.metadata = md;

            // Fix up orderBys to be server-compatible
            _.each(filterView.metadata.jsonQuery.order || [], function(ob)
            { ob.ascending = (ob.ascending == 'true' || ob.ascending === true); });

            // Only get real group-bys
            if (!_.isEmpty(filterView.metadata.jsonQuery.group))
            {
                filterView.metadata.jsonQuery.group = _.select(filterView.metadata.jsonQuery.group,
                        function(gb) { return !$.isBlank(gb.columnFieldName); });
            }

            // We can't have aggregates with no groupBys
            if (_.any(filterView.metadata.jsonQuery.select, function(s)
                        { return !$.isBlank(s.aggregate); }) &&
                    _.isEmpty(filterView.metadata.jsonQuery.group))
            {
                cpObj.$dom().find('.mainError')
                    .text($.t('screens.ds.grid_sidebar.sort_rollup.validation.no_group_bys'));
                cpObj._finishProcessing();
                return;
            }

            // We also can't have any aggregates without a function
            if (!_.isEmpty(filterView.metadata.jsonQuery.group) &&
                    _.any(filterView.metadata.jsonQuery.select, function(s)
                        { return $.isBlank(s.aggregate) && !_.any(filterView.metadata.jsonQuery.group,
                            function(g) { return g.columnFieldName == s.columnFieldName; }); }))
            {
                cpObj.$dom().find('.mainError')
                    .text($.t('screens.ds.grid_sidebar.sort_rollup.validation.no_function'));
                cpObj._finishProcessing();
                return;
            }

            var updatedCols = false;
            // Make new columns have the correct format
            _.each(filterView.metadata.jsonQuery.group, function(g)
            {
                var col = cpObj._view.columnForIdentifier(g.columnFieldName);

                var r = Column.closestViewFormat(col,
                    blist.datatypes.groupFunctionFromSoda2(g.groupFunction));
                if (!$.isBlank(r))
                {
                    var fmt = $.extend({}, col.format);
                    fmt.view = r;
                    col.update({ format: fmt });
                    updatedCols = true;
                }
            });

            // Clear out any previously-set values on columns that have now been un-set
            _.each(cpObj._view.realColumns, function(c)
            {
                if ((!$.isBlank(c.format.group_function) || !$.isBlank(c.format.grouping_aggregate)) &&
                    !_.any(filterView.metadata.jsonQuery.select, function(s)
                        { return !$.isBlank(s.aggregate) && s.columnFieldName == c.fieldName; }) &&
                    !_.any(filterView.metadata.jsonQuery.group, function(g)
                        { return g.columnFieldName == c.fieldName; }))
                {
                    var fmt = $.extend({}, c.format);
                    var r = Column.closestViewFormat(c, null);
                    if (!$.isBlank(r))
                    { fmt.view = r; }
                    delete fmt.grouping_aggregate;
                    delete fmt.group_function;
                    c.update({ format: fmt });
                    updatedCols = true;
                }
            });

            var wasInvalid = !cpObj._view.valid;

            // Now do the real update
            cpObj._view.update(filterView, false, _.isEmpty(filterView.metadata.jsonQuery.group));
            if (updatedCols) { cpObj._view.trigger('columns_changed'); }

            var finishCallback = function()
            {
                cpObj._finishProcessing();

                _.defer(function() { cpObj.reset(); });
                if (_.isFunction(finalCallback)) { finalCallback(); }
            };

            // If we were invalid and can save, then do so
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
    { return cpObj._view.isGrouped() && cpObj._view.hasRight('update_view'); };

    if ($.isBlank(blist.sidebarHidden.filter) || !blist.sidebarHidden.filter.filterDataset)
    { $.gridSidebar.registerConfig('filter.sortRollUp', 'pane_sortRollUp', 3, 'grouped'); }

})(jQuery);
