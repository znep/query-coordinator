(function($)
{
    var config = {
        name: 'export.api',
        priority: 10,
        title: 'API',
        subtitle: 'Access this ' + blist.dataset.displayName + ' via SODA',
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
