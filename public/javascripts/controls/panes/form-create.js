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
        { return $.t('screens.ds.grid_sidebar.form.title') },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.form.subtitle') },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
                $.t('screens.ds.grid_sidebar.form.validation.no_columns');
        },

        _getSections: function()
        {
            return [
                {
                    title: $.t('screens.ds.grid_sidebar.form.information.title'),
                    fields: [
                        {type: 'text', text: $.t('screens.ds.grid_sidebar.form.information.name'), name: 'name', required: true, prompt: $.t('screens.ds.grid_sidebar.form.information.name_prompt')},
                        {type: 'text', text: $.t('screens.ds.grid_sidebar.form.information.success'), name: 'displayFormat.successRedirect',
                            extraClass: 'url', prompt: $.t('screens.ds.grid_sidebar.form.information.success_prompt')
                        },
                        {type: 'checkbox', text: $.t('screens.ds.grid_sidebar.form.information.public'), name: 'flags.dataPublicAdd', defaultValue: true}
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

                // In the future, we will need to always useNBE.
                // For now, all we can do is use OBE.
                var useNBE = false;

                cpObj._view.saveNew(useNBE, function(nv) {
                  newView = nv;
                  finish();
                }, function(xhr) {
                  cpObj._genericErrorHandler(xhr);
                });
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
