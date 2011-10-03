(function($)
{
    $.Control.extend('pane_formCreate', {
        isAvailable: function()
        {
            var cpObj = this;
            return _.any(cpObj._view.visibleColumns, function(c)
                { return 'nested_table' != c.dataTypeName }) &&
                (cpObj._view.valid || isEdit(cpObj));
        },

        _getCurrentData: function()
        {
            var d = this._super();
            if (!$.isBlank(d)) { return d; }

            if (!isEdit(this)) { return null; }

            var view = this._view.cleanCopy();
            view.flags = view.flags || [];
            if (this._view.isPublic())
            { view.flags.push('dataPublicAdd'); }
            return view;
        },

        getTitle: function()
        { return 'Form' },

        getSubtitle: function()
        { return 'Forms allow you to gather data directly from your website into a dataset' },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? 'This view must be valid' :
                'This view must have visible columns to create a form';
        },

        _getSections: function()
        {
            return [
                {
                    title: 'Form Information',
                    fields: [
                        {type: 'text', text: 'Name', name: 'name', required: true, prompt: 'Enter a name'},
                        {type: 'text', text: 'Success URL', name: 'displayFormat.successRedirect',
                            extraClass: 'url', prompt: 'Enter a webpage URL'
                        },
                        {type: 'checkbox', text: 'Public?', name: 'flags.dataPublicAdd', defaultValue: true}
                    ]
                }
            ];
        },

        _getFinishButtons: function()
        {
            return [isEdit(this) ? $.controlPane.buttons.update :
                $.controlPane.buttons.create, $.controlPane.buttons.cancel];
        },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var view = $.extend(true, {displayFormat: null, displayType: 'form', metadata: {}},
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});
            view.metadata.renderTypeConfig.visible = {form: true};

            var wasPublic = cpObj._view.isPublic();
            var isPublic = isPublicForm(view);
            var doEdit = isEdit(cpObj);

            view.metadata.availableDisplayTypes = ['form'];
            cpObj._view.update(view);

            if (!doEdit)
            {
                var newView;
                var finish = _.after(2, function()
                {
                    cpObj._finishProcessing();
                    if (_.isFunction(finalCallback)) { finalCallback(); }
                    newView.redirectTo();
                });

                cpObj._view.getParentDataset(function(parDS)
                {
                    if (!parDS.publicationAppendEnabled)
                    {
                        parDS.update({publicationAppendEnabled: true});
                        parDS.save(finish,
                            function(xhr) { cpObj._genericErrorHandler(xhr); },
                            {publicationAppendEnabled: true});
                    }
                    else { finish(); }
                });

                cpObj._view.saveNew(function(nv)
                {
                    newView = nv;
                    finish();
                },
                function(xhr) { cpObj._genericErrorHandler(xhr); });
            }
            else
            {
                var updateView = function()
                {
                    cpObj._view.save(function(newView)
                    {
                        cpObj._finishProcessing();

                        if (!$.isBlank(cpObj.settings.renderTypeManager))
                        {
                            var $form = cpObj.settings.renderTypeManager.$domForType('form')
                                .find('form.formView');
                            var newRedirect = newView.displayFormat.successRedirect;
                            if ($.isBlank(newRedirect))
                            { newRedirect = $form.attr('data-defaultSuccessRedirect'); }
                            var act = $form.attr('action');
                            act = $.urlParam(act, 'successRedirect', escape(newRedirect));
                            $form.attr('action', act);
                        }

                        // Global replace
                        $('.currentViewName').text(newView.name);

                        cpObj._showMessage('Your form has been updated');
                        cpObj._hide();
                        if (_.isFunction(finalCallback)) { finalCallback(); }
                    });
                }

                if (wasPublic !== isPublic)
                {
                    cpObj._view['make' + (isPublic ? 'Public' : 'Private')](updateView);
                }
                else
                { updateView(); }
            }
        }
    }, {name: 'formCreate'}, 'controlPane');


    var isEdit = function(cpObj)
    { return cpObj._view.type == 'form'; };

    var isPublicForm = function(view)
    {
        return _.include(view.flags || [], 'dataPublicAdd') ||
            _.any(view.grants || [], function(g)
                    { return g.type == 'contributor' && _.include(g.flags || [], 'public'); });
    };

    if ($.isBlank(blist.sidebarHidden.embed) || !blist.sidebarHidden.embed.formCreate)
    { $.gridSidebar.registerConfig('embed.formCreate', 'pane_formCreate', 5, 'form'); }

})(jQuery);
