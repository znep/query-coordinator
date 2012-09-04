(function($)
{
    $.Control.extend('pane_api_foundry', {
        getTitle: function()
        { return 'APIs'; },

        getSubtitle: function()
        { return 'Create and Customize an API'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'apiFoundryPaneWrapper',
                        directive: {
                            'p@class+': 'pClass'
                        },
                        data: { pClass: 'sectionContent' }
                    }
                }
            ];
        }
    }, {name: 'apiFoundry'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.api_foundry)
    { $.gridSidebar.registerConfig('manage.api_foundry', 'pane_api_foundry', 8); }

})(jQuery);
