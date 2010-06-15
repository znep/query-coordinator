(function($)
{
    if (blist.sidebarHidden.embed &&
        blist.sidebarHidden.embed.embedSdp) { return; }

    var config =
    {
        name: 'embed.embedSdp',
        title: 'Social Data Player',
        subtitle: 'The Social Data Player enables you to publish this dataset on the Internet at large',
        sections: [
            {
                customContent: {
                    template: 'embedForm',
                    directive: {},
                    data: {},
                    callback: function($formElem)
                    {
                        $formElem.embedForm();
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
