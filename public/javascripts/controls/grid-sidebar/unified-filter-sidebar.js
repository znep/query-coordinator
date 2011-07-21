;(function($)
{

    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

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
                    $elem.unifiedFilter();
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(config, 'filter');

})(jQuery);