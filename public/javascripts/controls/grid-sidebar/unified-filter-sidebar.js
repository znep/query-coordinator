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
        { return this.settings.view.visibleColumns.length > 0 && this.settings.view.valid; },

        getDisabledSubtitle: function()
        {
            return !this.settings.view.valid ? 'This view must be valid' :
                'This view has no columns to filter';
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
                            datasets: [ cpObj.settings.view ],
                            filterableColumns: cpObj.settings.view.columnsForType(filterableTypes)});

                        cpObj.settings.view.bind('columns_changed', function()
                        {
                            $elem.trigger('columns_changed',
                                { columns: cpObj.settings.view.columnsForType(filterableTypes) });
                        });

                        cpObj.settings.view.bind('clear_temporary', function()
                        { $elem.trigger('revert'); });
                    }
                }
            }];
        }
    }, {name: 'unifiedFilter', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.filter) || !blist.sidebarHidden.filter.filterDataset)
    { $.gridSidebar.registerConfig('filter.unifiedFilter', 'pane_unifiedFilter', 1, 'filter'); }

})(jQuery);
