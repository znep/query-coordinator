(function($)
{
    var config =
    {
        name: 'export.printDataset',
        title: 'Print',
        subtitle: 'Export this dataset to a printable PDF format',
        disabledSubtitle: 'Only tabular data may be printed',
        onlyIf: blist.display.isGrid,
        sections: [
            {
                customContent: {
                    template: 'printForm',
                    directive: {},
                    data: {}
                }
            }
        ],
        finishBlock: {
            buttons: [{text: 'Print', value: true, isDefault: true}, $.gridSidebar.buttons.cancel]
        },
        finishCallback: function(sidebarObj, data, $pane)
        {
            $pane.find('.printForm form').submit();
            sidebarObj.finishProcessing();
            sidebarObj.hide();
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
