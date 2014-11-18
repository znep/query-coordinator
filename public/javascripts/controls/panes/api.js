(function($)
{
    $.Control.extend('pane_api', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.api.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.api.subtitle', { view_type: this._view.displayName }); },

        render: function()
        {
            var cpObj = this;
            cpObj._super(null, null, function(completeRerender)
            {
                if (completeRerender)
                {
                    cpObj.$dom().find('input').click(function()
                    {
                        var $this = $(this);
                        $this.focus();
                        $this.select();
                    });
                    ZeroClipboard.config({ swfPath: '/ZeroClipboard.swf' });
                    new ZeroClipboard( cpObj.$dom().find('button')[0] );
                }
            });
        },

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
