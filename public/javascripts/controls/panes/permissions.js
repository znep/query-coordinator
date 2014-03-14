(function($)
 {
    $.Control.extend('pane_datasetPermissions', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.permissions.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.permissions.subtitle', { view_type: this._view.displayName }); },

        isAvailable: function()
        {
            return this._view.valid &&
                (!this._view.temporary || this._view.minorChange);
        },

        getDisabledSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.permissions.validation.valid_saved'); },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    customContent: {
                        template: 'datasetPermissions',
                        data: {},
                        directive: {},
                        callback: function($formElem)
                        {
                            // If the publicness is inherited from the parent dataset,
                            // they can't make it private
                            var publicGrant = _.detect(cpObj._view.grants || [], function(grant)
                                { return _.include(grant.flags || [], 'public'); }),
                                $publicText   = $formElem.find('.datasetPublicText'),
                                $toggleForm   = $formElem.find('.togglePermissionsForm'),
                                $toggleRadios = $toggleForm.find('.toggleDatasetPermissions');

                            $publicText.text( cpObj._view.isPublic() ? $.t('core.visibility.public').capitalize() : $.t('core.visibility.private').capitalize() );

                            // Only owned, parent-public datasets can be toggled
                            if (cpObj._view.hasRight('update_view') &&
                                ($.isBlank(publicGrant) || (publicGrant.inherited || false) == false))
                            {
                                $toggleRadios.change(function(event)
                                {
                                    var $radio = $(event.target);
                                    cpObj._view[$radio.val()](function()
                                    {
                                        $publicText.text(cpObj._view.isPublic() ?
                                            $.t('core.visibility.public').capitalize() : $.t('core.visibility.private').capitalize());
                                        $radio.socrataAlert({
                                            message: $.t('screens.ds.grid_sidebar.permissions.success'), overlay: true
                                        });
                                    },
                                    function(request, textStatus, errorThrown)
                                    {
                                        cpObj.$dom().find('.sharingFlash').addClass('error')
                                        .text($.t('screens.ds.grid_sidebar.permissions.error'));
                                    });
                                });

                                _.defer(function() { $toggleRadios.uniform(); });
                            }
                            else
                            { $toggleForm.hide(); }

                            $formElem.find('.datasetTypeName').text(this._view.displayName);
                            $formElem.find('.datasetTypeNameUpcase')
                                .text(this._view.displayName.capitalize());
                        }
                    }
                }
            ];
        },

        shown: function()
        {
            this._super();
            this.$dom().find('.flash').removeClass('error').text('');
        },

        _getFinishButtons: function()
        {
          return [$.controlPane.buttons.update, $.controlPane.buttons.cancel];
        },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var formValues = cpObj._getFormValues();
            cpObj._view.disabledFeatureFlags = _.reject(_.keys(formValues),
                function(key) { return formValues[key]; });

            cpObj._view.save(function()
            {
                cpObj._finishProcessing();
                cpObj._showMessage($.t('screens.ds.grid_sidebar.permissions.success'));
                cpObj._hide();
                if (_.isFunction(finalCallback)) { finalCallback(); }
            },
            function()
            {
                cpObj.find$('.sharingFlash').addClass('error')
                    .text($.t('screens.ds.grid_sidebar.permissions.error'));
            });
        }
    }, {name: 'datasetPermissions', noReset: true, showFinishButtons: true}, 'controlPane');

    if (blist.sidebarHidden && ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.permissions))
    { $.gridSidebar.registerConfig('manage.datasetPermissions', 'pane_datasetPermissions', 7); }

 })(jQuery);

