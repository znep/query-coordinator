(function($)
{
    if (blist.sidebarHidden.embed &&
        blist.sidebarHidden.embed.sdp) { return; }

    var $embedForm;

    var config =
    {
        name: 'embed.embedSdp',
        priority: 1,
        title: 'Social Data Player',
        subtitle: 'The Social Data Player enables you to publish this dataset on the Internet at large',
        onlyIf: function()
        {
            return blist.dataset.isPublic() && blist.dataset.valid &&
                (!blist.dataset.temporary || blist.dataset.minorChange);
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ||
                (blist.dataset.temporary && !blist.dataset.minorChange) ?
                'This view must be valid and saved' :
                'This view must be public before it can be published';
        },
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
                        $formElem.embedForm({
                            invalidCallback: function()
                            {
                                $formElem.closest('.paneContent').find('.button[data-value=preview]').addClass('disabled');
                            },
                            validCallback: function()
                            {
                                $formElem.closest('.paneContent').find('.button[data-value=preview]').removeClass('disabled');
                            }
                        });
                    }
                }
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done,
                      { text: 'Preview', value: 'preview', isDefault: false }]
        },
        finishCallback: function(sidebarObj, data, $pane, value)
        {
            sidebarObj.finishProcessing();

            if ((value == 'preview') && (!$pane.find('.button[data-value=preview]').hasClass('disabled')))
            {
                var width = $embedForm.find('#embed_width').val();
                var height = $embedForm.find('#embed_height').val();
                var customizationId = $embedForm.find('#embed_template').val() || '';

                window.open(blist.dataset.url +
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
