(function($)
{
    var config =
    {
        name: 'export.downloadDataset',
        title: 'Download',
        subtitle: 'Download a copy of this dataset in a static format',
        disabledSubtitle: 'Only tabular data may be downloaded',
        onlyIf: blist.display.isGrid,
        sections: [
            {
                customContent: {
                    template: 'downloadsTable',
                    directive: $.templates.downloadsTable.directive,
                    data: { downloadTypes: $.templates.downloadsTable.downloadTypes,
                            viewId: blist.display.view.id },
                    callback: $.templates.downloadsTable.postRender
                }
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done]
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
