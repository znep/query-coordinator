;(function($)
{
    var filterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !$.isBlank(t.filterConditions) || _.any(t.subColumns, function(st)
            { return !$.isBlank(st.filterConditions); }) ? n : null;
    }));

    $.Control.extend('pane_unifiedFilter', {
        getTitle: function()
        { return 'Filter'; },

        getSubtitle: function()
        { return 'Filter this dataset based on contents.'; },

        isAvailable: function()
        { return this._view.visibleColumns.length > 0 && this._view.valid; },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? 'This view must be valid' :
                'This view has no columns to filter';
        },

        setView: function()
        {
            this._super.apply(this, arguments);
            this.reset();
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
                        var cpObj = this
                        $elem.unifiedFilter({
                            datasets: cpObj.settings.datasets || [ cpObj._view ],
                            rootCondition: cpObj.settings.rootCondition,
                            filterableColumns: cpObj._view.columnsForType(filterableTypes)});

                        cpObj._view.bind('columns_changed', function()
                        {
                            $elem.trigger('columns_changed',
                                { columns: cpObj._view.columnsForType(filterableTypes) });
                        }, cpObj);

                        cpObj._view.bind('clear_temporary', function()
                        { $elem.trigger('revert'); }, cpObj);
                    }
                }
            }];
        }
    }, {name: 'unifiedFilter', noReset: true}, 'controlPane');

    if (!$.isBlank($.gridSidebar) && (!$.subKeyDefined(blist, 'sidebarHidden.filter.filterDataset') ||
        !blist.sidebarHidden.filter.filterDataset))
    { $.gridSidebar.registerConfig('filter.unifiedFilter', 'pane_unifiedFilter', 1, 'filter'); }

})(jQuery);
