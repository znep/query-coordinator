;(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var filterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !$.isBlank(t.filterConditions) ? n : null;
    }));

    var configName = 'filter.unifiedFilter';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter',
        subtitle: 'Filter this dataset based on contents.',
        noReset: true,
        onlyIf: function()
        {
            return blist.dataset.visibleColumns.length > 0 && blist.dataset.valid;
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ? 'This view must be valid' :
                'This view has no columns to filter';
        },
        sections: [{
            customContent: {
                template: 'filterPane',
                directive: {},
                data: {},
                callback: function($elem)
                {
                    $elem.unifiedFilter({
                        datasets: [ blist.dataset ],
                        filterableColumns: blist.dataset.columnsForType(filterableTypes)
                    });

                    blist.dataset.bind('columns_changed', function()
                    {
                        $elem.trigger('columns_changed',
                            { columns: blist.dataset.columnsForType(filterableTypes) });
                    });

                    blist.dataset.bind('clear_temporary', function()
                    {
                        $elem.trigger('revert');
                    });
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(config, 'filter');

})(jQuery);
