(function($)
{
    if (blist.sidebarHidden.embed.formCreate) { return; }

    var config =
    {
        name: 'embed.formCreate',
        title: 'Form',
        subtitle: 'Forms allow you to gather data directly from your website into a dataset',
        onlyIf: function(view)
        {
            var hasVis = false;
            _.each(view.columns, function(c)
            {
                if (c.dataTypeName != 'meta_data' &&
                    ($.isBlank(c.flags) || !_.include(c.flags, 'hidden')))
                {
                    hasVis = true;
                    _.breakLoop();
                }
            });
            return hasVis;
        },
        disabledSubtitle: 'This view must have visible columns to create a form',
        sections: [
            {
                title: 'Form Information',
                fields: [
                    {type: 'text', text: 'Name', name: 'formName', required: true,
                        wizard: {prompt: 'Enter a name for your form',
                            actions: [$.gridSidebar.wizard.buttons.done]}
                    },
                    {type: 'text', text: 'Success URL', name: 'successRedirect',
                        extraClass: 'url',
                        wizard: {prompt: 'Enter a URL for a page that should be displayed after the data is submitted',
                            actions: [
                                $.gridSidebar.wizard.buttons.skip,
                                $.gridSidebar.wizard.buttons.done
                            ]}
                    },
                    {type: 'checkbox', text: 'Public?', name: 'publicAdd',
                        checked: true,
                        wizard: {prompt: 'Choose whether anyone can submit data via your form.  If not, only those given permission individually will be able to use it.',
                            actions: [$.gridSidebar.wizard.buttons.skip]}
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
        if (!value)
        {
            sidebarObj.hide();
            return;
        }

        // Clear out required fields that are prompts so the validate
        $pane.find(':input.prompt.required').val('');
        if (!$pane.find('form').valid()) { return; }

        $pane.find('.mainError').text('');

        var data = {originalViewId: blist.display.viewId, displayType: 'form'};
        var $form = $pane.find('form');

        data.name = $form.find('#formName').val();
        data.displayFormat =
            {successRedirect: $form.find('#successRedirect').val()};
        if ($form.find('#publicAdd').value())
        { data.flags = ['dataPublicAdd']; }

        $.ajax({url: '/views.json', type: 'POST', dataType: 'json',
            contentType: 'application/json', data: JSON.stringify(data),
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            { blist.util.navigation.redirectToView(resp.id); }
            });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
