(function($)
 {
    $.Control.extend('pane_datasetPermissions', {
        getTitle: function()
        { return 'Permissions'; },

        getSubtitle: function()
        { return 'Manage the permissions of this ' + this._view.displayName; },

        isAvailable: function()
        {
            return this._view.valid &&
                (!this._view.temporary || this._view.minorChange);
        },

        getDisabledSubtitle: function()
        { return 'This view must be valid and saved'; },

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

                            $publicText.text( cpObj._view.isPublic() ? 'Public' : 'Private' );

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
                                            'Public' : 'Private');
                                        $radio.socrataAlert({
                                            message: 'Your permissions have been saved', overlay: true
                                        });
                                    },
                                    function(request, textStatus, errorThrown)
                                    {
                                        cpObj.$dom().find('.sharingFlash').addClass('error')
                                        .text('There was an error modifying your dataset ' +
                                            'permissions. Please try again later');
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
        { return [$.controlPane.buttons.update, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this
            if (!cpObj._super.apply(this, arguments)) { return; }

            var formValues = cpObj._getFormValues();
            cpObj._view.disabledFeatureFlags = _.reject(_.keys(formValues),
                function(key) { return formValues[key]; });

            cpObj._view.save(function()
            {
                cpObj._finishProcessing();
                cpObj._showMessage('Your permissions have been saved');
                cpObj._hide();
                if (_.isFunction(finalCallback)) { finalCallback(); }
            },
            function()
            {
                cpObj.find$('.sharingFlash').addClass('error')
                    .text('There was an error modifying your permissions. Please try again later');
            });
        }
    }, {name: 'datasetPermissions', noReset: true}, 'controlPane');

    if (blist.sidebarHidden && ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.permissions))
    { $.gridSidebar.registerConfig('manage.datasetPermissions', 'pane_datasetPermissions', 7); }

 })(jQuery);

