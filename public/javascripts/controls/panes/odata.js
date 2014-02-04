(function($)
{
    $.Control.extend('pane_odata', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.odata.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.odata.subtitle', { view_type: this._view.displayName }); },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'odataContentWrapper',
                        directive: {
                            '.odataIntroWrapper@class+': 'pClass'
                        },
                        data: { pClass: 'sectionContent' }
                    }
                }
            ];
        }
    }, {name: 'odata'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.odata)
    { $.gridSidebar.registerConfig('export.odata', 'pane_odata', 10); }

})(jQuery);

