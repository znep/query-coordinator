(function($)
{
    var config =
    {
        name: 'embed.embedSdp',
        title: 'Social Data Player',
        subtitle: 'The Social Data Player enables you to publish this dataset on the Internet at large',
        disabledSubtitle: 'This view must be public before it can be published',
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
        onlyIf: _.isArray(blist.display.view.grants) &&
                _.any(blist.display.view.grants, function(grant)
                {
                    return _.any(grant.flags, function(flag) { return flag == 'public'; });
                }),
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done, $.gridSidebar.buttons.cancel]
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
