;(function($)
{
    var filterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !$.isBlank(t.filterConditions) || _.any(t.subColumns, function(st)
            { return !$.isBlank(st.filterConditions); }) ? n : null;
    }));
    var nbeFilterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !t.disableNBEFilter && (!$.isBlank(t.filterConditions) || _.any(t.subColumns, function(st)
            { return !$.isBlank(st.filterConditions); })) ? n : null;
    }));

    $.Control.extend('pane_unifiedFilter', {
        getTitle: function()
        { return $.t('controls.filter.main.filter'); },

        getSubtitle: function()
        { return $.t('controls.filter.main.filter_based_on_contents'); },

        isAvailable: function()
        { return !$.isBlank(this._view) && this._view.visibleColumns.length > 0 && this._view.valid; },

        getDisabledSubtitle: function()
        {
            return $.isBlank(this._view) ? 'No dataset is defined' : !this._view.valid ?
                $.t('controls.filter.main.view_must_be_valid') :
                $.t('controls.filter.main.view_has_no_columns');
        },

        setView: function(newView)
        {
            var cpObj = this, _super = cpObj._super;
            var handle = function(ds)
            {
                _super.apply(cpObj, [ds]);
                cpObj.reset();
                if (cpObj._pendingView)
                {
                    if (blist.datasetPage && blist.datasetPage.sidebar)
                    { blist.datasetPage.sidebar.updateEnabledSubPanes(); }
                    delete cpObj._pendingView;
                }
            };

            if ($.subKeyDefined(newView, 'displayFormat.viewDefinitions'))
            {
                cpObj._pendingView = true;
                if (newView.displayFormat.viewDefinitions[0].uid == 'self')
                { handle(newView); }
                else
                { Dataset.lookupFromViewId(newView.displayFormat.viewDefinitions[0].uid, handle); }
            }
            else
            { handle(newView); }
        },

        _getSections: function()
        {
            return [{
                customContent: {
                    template: 'filterPane',
                    directive: {},
                    data: {},
                    callback: function($elem)
                    {
                        var cpObj = this;
                        $elem.unifiedFilter({
                            datasets: cpObj.settings.datasets || [ cpObj._view ],
                            rootCondition: cpObj.settings.rootCondition,
                            filterableColumns: cpObj._view.columnsForType(
                                cpObj._view.newBackend ? nbeFilterableTypes : filterableTypes)});

                        cpObj._view.unbind(null, null, cpObj);
                        cpObj._view.bind('columns_changed', function()
                        {
                            $elem.trigger('columns_changed',
                                { columns: cpObj._view.columnsForType(
                                    cpObj._view.newBackend ? nbeFilterableTypes : filterableTypes) });
                        }, cpObj);

                        cpObj._view.bind('clear_temporary', function()
                        { $elem.trigger('revert'); }, cpObj);
                    },
                    cleanupCallback: function($elem)
                    {
                        $elem.trigger('destroy');
                    }
                }
            }];
        }
    }, {name: 'unifiedFilter', noReset: true}, 'controlPane');

    if (!$.isBlank($.gridSidebar) && (!$.subKeyDefined(blist, 'sidebarHidden.filter.filterDataset') ||
        !blist.sidebarHidden.filter.filterDataset))
    { $.gridSidebar.registerConfig('filter.unifiedFilter', 'pane_unifiedFilter', 1, 'filter'); }

})(jQuery);
