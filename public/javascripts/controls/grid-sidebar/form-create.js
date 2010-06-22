(function($)
{
    if (blist.sidebarHidden.embed &&
        blist.sidebarHidden.embed.formCreate) { return; }

    var config =
    {
        name: 'embed.formCreate',
        priority: 5,
        title: 'Form',
        subtitle: 'Forms allow you to gather data directly from your website into a dataset',
        onlyIf: function(view)
        {
            return _.select(view.columns, function(c)
                {
                    return c.dataTypeName != 'meta_data' &&
                        ($.isBlank(c.flags) || !_.include(c.flags, 'hidden'));
                }).length > 0;
        },
        disabledSubtitle: 'This view must have visible columns to create a form',
        sections: [
            {
                title: 'Form Information',
                fields: [
                    {type: 'text', text: 'Name', name: 'name', required: true,
                        prompt: 'Enter a name',
                        wizard: {prompt: 'Enter a name for your form'}
                    },
                    {type: 'text', text: 'Success URL',
                        name: 'displayFormat.successRedirect',
                        extraClass: 'url', prompt: 'Enter a webpage URL',
                        wizard: {prompt: 'Enter a URL for a page that should be displayed after the data is submitted'}
                    },
                    {type: 'checkbox', text: 'Public?', name: 'flags.dataPublicAdd',
                        defaultValue: true,
                        wizard: {prompt: 'Choose whether anyone can submit data via your form.  If not, only those given permission individually will be able to use it.'}
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: {prompt: "Now you're ready to create a new form"}
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'form';

        $.extend(view, sidebarObj.getFormValues($pane));

        $.ajax({url: '/views.json', type: 'POST', dataType: 'json',
            contentType: 'application/json', data: JSON.stringify(view),
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.finishProcessing();
                blist.util.navigation.redirectToView(resp.id);
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
