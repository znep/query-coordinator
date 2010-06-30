(function($)
{
    var $embedForm;

    var config =
    {
        name: 'embed.embedSdp',
        priority: 1,
        title: 'Social Data Player',
        subtitle: 'The Social Data Player enables you to publish this dataset on the Internet at large',
        disabledSubtitle: 'This view must be public before it can be published',
        noReset: true,
        sections: [
            {
                customContent: {
                    template: 'embedForm',
                    directive: {},
                    data: {},
                    callback: function($formElem)
                    {
                        $embedForm = $formElem;
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
            buttons: [$.gridSidebar.buttons.done,
                      { text: 'Preview', value: 'preview', isDefault: false }]
        },
        finishCallback: function(sidebarObj, data, $pane, value)
        {
            sidebarObj.finishProcessing();

            if (value == 'preview')
            {
                var width = $embedForm.find('#embed_width').val();
                var height = $embedForm.find('#embed_height').val();
                var customizationId = $embedForm.find('#embed_customization').val() || '';

                window.open("/datasets_new/" + blist.display.view.id +
                    "/widget_preview?width=" + width + "&height=" + height +
                    "&customization_id=" + customizationId, "Preview");
            }
            else
            {
                sidebarObj.hide();
            }
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
