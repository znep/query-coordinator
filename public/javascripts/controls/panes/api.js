(function($)
{
    $.Control.extend('pane_api', {
        getTitle: function()
        { return 'API'; },

        getSubtitle: function()
        { return 'Access this ' + this._view.displayName + ' via SODA'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'apiContentWrapper',
                        directive: {
                            'p@class+': 'pClass'
                        },
                        data: { pClass: 'sectionContent' }
                    }
                }
            ];
        }
    }, {name: 'api'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.api)
    { $.gridSidebar.registerConfig('export.api', 'pane_api', 10); }

})(jQuery);
