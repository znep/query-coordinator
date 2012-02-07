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
            var types = this._view.isGeoDataset() ?
                        $.templates.downloadsTable.geoDownloadTypes :
                        $.templates.downloadsTable.downloadTypes;
            var catchForm = !this._view.isGeoDataset();
            return [
                {
                    customContent: {
                        template: 'downloadsTable',
                        directive: $.templates.downloadsTable.directive,
                        data: { downloadTypes: types,
                                view: this._view },
                        callback: function($sect)
                        {
                            if (catchForm)
                            { $sect.find('.downloadsList .item a').downloadToFormCatcher(); }
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
