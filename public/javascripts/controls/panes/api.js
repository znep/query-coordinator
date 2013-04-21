(function($)
{
    $.Control.extend('pane_api', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.api.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.api.subtitle', { view_type: this._view.displayName }); },

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
