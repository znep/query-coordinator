(function($)
{
    if (blist.sidebarHidden.exportSection &&
        blist.sidebarHidden.exportSection.download) { return; }

    var config =
    {
        name: 'export.downloadDataset',
        priority: 1,
        title: 'Download',
        subtitle: 'Download a copy of this dataset in a static format',
        onlyIf: function()
        {
            return blist.dataset.valid;
        },
        disabledSubtitle: function()
        {
            return 'This view must be valid';
        },
        sections: [
            {
                customContent: {
                    template: 'downloadsTable',
                    directive: $.templates.downloadsTable.directive,
                    data: { downloadTypes: $.templates.downloadsTable.downloadTypes,
                            viewId: blist.dataset.id },
                    callback: function($sect)
                    {
                        $sect.find('.downloadsList .item a').downloadToFormCatcher();
                        $.templates.downloadsTable.postRender($sect);
                    }
                }
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done]
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
