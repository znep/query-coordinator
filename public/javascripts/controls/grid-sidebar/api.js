(function($)
{
    if (blist.sidebarHidden.exportSection &&
        blist.sidebarHidden.exportSection.api) { return; }

    var config = {
        name: 'export.api',
        priority: 10,
        title: 'API',
        subtitle: 'Access this ' + blist.dataset.displayName + ' via SODA',
        resizable: true,
        sections: [
            {
                customContent: {
                    template: 'apiContentWrapper',
                    directive: {
                        'p@class+': 'pClass'
                    },
                    data: { pClass: 'sectionContent' }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
