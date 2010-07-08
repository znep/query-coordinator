(function($)
{
    if (blist.sidebarHidden.embed &&
        blist.sidebarHidden.embed.formCreate) { return; }

    var isEdit = blist.dataset.getDisplayType(blist.display.view) == 'Form';

    var configName = 'embed.formCreate';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Form',
        subtitle: 'Forms allow you to gather data directly from your ' +
            'website into a dataset',
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
                        wizard: {prompt: 'Enter a URL for a page that should ' +
                            'be displayed after the data is submitted'}
                    },
                    {type: 'checkbox', text: 'Public?', name: 'flags.dataPublicAdd',
                        defaultValue: true,
                        wizard: {prompt: 'Choose whether anyone can submit ' +
                            'data via your form.  If not, only those given ' +
                            'permission individually will be able to use it.'}
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [isEdit ? $.gridSidebar.buttons.update :
                $.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: {prompt: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' form'}
        }
    };

    var isPublicForm = function(view)
    {
        return _.any(view.grants || [], function(g)
            { return g.type == 'contributor' &&
                _.include(g.flags || [], 'public'); }) ||
                _.include(view.flags || [], 'dataPublicAdd');
    };

    config.dataSource = function()
    {
        if (!isEdit) { return null; }

        var view = $.extend(true, {}, blist.display.view);
        view.flags = view.flags || [];
        if (isPublicForm(view))
        { view.flags.push('dataPublicAdd'); }
        return view;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }


        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'form';

        $.extend(view, sidebarObj.getFormValues($pane));

        var wasPublic = isPublicForm(blist.display.view);
        var isPublic = isPublicForm(view);

        var updateView = function()
        {
            var url = '/views' + (isEdit ? '/' + blist.display.view.id : '') +
                '.json';
            $.ajax({url: url, type: isEdit ? 'PUT' : 'POST', dataType: 'json',
                contentType: 'application/json', data: JSON.stringify(view),
                error: function(xhr)
                { sidebarObj.genericErrorHandler($pane, xhr); },
                success: function(resp)
                {
                    sidebarObj.finishProcessing();
                    if (!isEdit)
                    { blist.util.navigation.redirectToView(resp.id); }
                    else
                    {
                        $.syncObjects(blist.display.view, resp);

                        var $form = sidebarObj.$grid().find('form.formView');
                        var newRedirect = (blist.display.view.displayFormat || {})
                            .successRedirect;
                        if ($.isBlank(newRedirect))
                        { newRedirect = $form.attr('data-defaultSuccessRedirect'); }
                        var act = $form.attr('action');
                        act = $.urlParam(act, 'successRedirect',
                            escape(newRedirect));
                        $form.attr('action', act);

                        $('.currentViewName').text(blist.display.view.name);

                        sidebarObj.$dom().socrataAlert(
                            {message: 'Your form has been updated', overlay: true});
                        sidebarObj.hide();

                        sidebarObj.addPane(configName);
                    }
                }});
        };

        if (isEdit && wasPublic !== isPublic)
        {
            $.ajax({url: '/views/' + blist.display.view.id + '.json',
                data: {method: 'setPermission',
                    value: isPublic ? 'public.add' : 'private'},
                success: function() { updateView(); }});
        }
        else
        { updateView(); }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
