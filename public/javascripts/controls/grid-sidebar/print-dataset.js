(function($)
{
    if (blist.sidebarHidden.exportSection &&
        blist.sidebarHidden.exportSection.print) { return; }

    var config =
    {
        name: 'export.printDataset',
        priority: 5,
        title: 'Print',
        subtitle: 'Export this dataset to a printable PDF format',
        noReset: true,
        sections: [
            {
                customContent: {
                    template: 'printForm',
                    directive: {},
                    data: {},
                    callback: function($sect)
                    {
                        $sect.closest('form').attr('target', '_blank')
                            .attr('method', 'GET')
                            .attr('action', '/views/' + blist.display.view.id +
                                '/rows.pdf');
                    }
                }
            }
        ],
        finishBlock: {
            buttons: [{text: 'Print', value: 'print', isDefault: true}, $.gridSidebar.buttons.cancel]
        },
        finishCallback: function(sidebarObj, data, $pane, value)
        {
            if (value === 'print')
            {
                $pane.find('.printForm').closest('form').submit();
            }

            sidebarObj.finishProcessing();
            sidebarObj.hide();
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
