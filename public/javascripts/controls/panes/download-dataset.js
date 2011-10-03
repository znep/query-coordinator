(function($)
{
    $.Control.extend('pane_downloadDataset', {
        getTitle: function()
        { return 'Download'; },

        getSubtitle: function()
        { return 'Download a copy of this dataset in a static format'; },

        isAvailable: function()
        { return this._view.valid; },

        getDisabledSubtitle: function()
        { return 'This view must be valid'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'downloadsTable',
                        directive: $.templates.downloadsTable.directive,
                        data: { downloadTypes: $.templates.downloadsTable.downloadTypes,
                                viewId: this._view.id },
                        callback: function($sect)
                        {
                            $sect.find('.downloadsList .item a').downloadToFormCatcher();
                            $.templates.downloadsTable.postRender($sect);
                        }
                    }
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.done]; }
    }, {name: 'downloadDataset'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.download)
    { $.gridSidebar.registerConfig('export.downloadDataset', 'pane_downloadDataset', 1); }

})(jQuery);
