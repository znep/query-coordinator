(function($)
{
    if (blist.sidebarHidden.embed &&
        blist.sidebarHidden.embed.formCreate) { return; }

    var isEdit = blist.dataset.type == 'form';

    var configName = 'embed.formCreate';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Form',
        subtitle: 'Forms allow you to gather data directly from your ' +
            'website into a dataset',
        onlyIf: function()
        {
            return _.any(blist.dataset.visibleColumns, function(c)
                { return 'nested_table' != c.dataTypeName }) &&
                (blist.dataset.valid || isEdit);
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ? 'This view must be valid' :
                'This view must have visible columns to create a form';
        },
        sections: [
            {
                title: 'Form Information',
                fields: [
                    {type: 'text', text: 'Name', name: 'name', required: true,
                        prompt: 'Enter a name',
                        wizard: 'Enter a name for your form'
                    },
                    {type: 'text', text: 'Success URL',
                        name: 'displayFormat.successRedirect',
                        extraClass: 'url', prompt: 'Enter a webpage URL',
                        wizard: 'Enter a URL for a page that should ' +
                            'be displayed after the data is submitted'
                    },
                    {type: 'checkbox', text: 'Public?', name: 'flags.dataPublicAdd',
                        defaultValue: true,
                        wizard: 'Choose whether anyone can submit ' +
                            'data via your form.  If not, only those given ' +
                            'permission individually will be able to use it.'
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [isEdit ? $.gridSidebar.buttons.update :
                $.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' form'
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

        var view = blist.dataset.cleanCopy();
        view.flags = view.flags || [];
        if (blist.dataset.isPublic())
        { view.flags.push('dataPublicAdd'); }
        return view;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend({displayFormat: null, displayType: 'form'},
            sidebarObj.getFormValues($pane), {metadata: blist.dataset.metadata});
        view.metadata.renderTypeConfig.visible = {form: true};

        var wasPublic = blist.dataset.isPublic();
        var isPublic = isPublicForm(view);

        view.metadata = $.extend(true, {}, blist.dataset.metadata);
        view.metadata.availableDisplayTypes = ['form'];
        blist.dataset.update(view);

        if (!isEdit)
        {
            blist.dataset.saveNew(function(newView)
            {
                sidebarObj.finishProcessing();
                newView.redirectTo();
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
        else
        {
            var updateView = function()
            {
                blist.dataset.save(function(newView)
                {
                    sidebarObj.finishProcessing();

                    var $form = blist.$container.renderTypeManager().$domForType('form')
                        .find('form.formView');
                    var newRedirect = newView.displayFormat.successRedirect;
                    if ($.isBlank(newRedirect))
                    { newRedirect = $form.attr('data-defaultSuccessRedirect'); }
                    var act = $form.attr('action');
                    act = $.urlParam(act, 'successRedirect', escape(newRedirect));
                    $form.attr('action', act);

                    $('.currentViewName').text(newView.name);

                    sidebarObj.$dom().socrataAlert(
                        {message: 'Your form has been updated', overlay: true});
                    sidebarObj.hide();

                    sidebarObj.addPane(configName);
                });
            }

            if (wasPublic !== isPublic)
            {
                blist.dataset['make' + (isPublic ? 'Public' : 'Private')](
                    updateView);
            }
            else
            { updateView(); }
        }
    };

    $.gridSidebar.registerConfig(config, 'form');

})(jQuery);
