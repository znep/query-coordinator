(function($)
 {
    if (blist.sidebarHidden.manage &&
        blist.sidebarHidden.manage.permissions) { return; }

    var commonError = function()
    {
        $('#gridSidebar_datasetPermissions .sharingFlash').addClass('error')
            .text('There was an error modifying your permissions. Please try again later');
    };

    var togglePermissions = function($radio, $title)
    {
        blist.dataset[$radio.val()](
            function()
            {
                $title.text(blist.dataset.isPublic() ? 'Public' : 'Private');
                sidebar
                    .updateEnabledSubPanes();
                sidebar.refresh('manage.shareDataset');
                $radio
                    .socrataAlert({
                        message: 'Your permissions have been saved', overlay: true
                    });
            },
            function(request, textStatus, errorThrown)
            {
                $('#gridSidebar_datasetPermissions .sharingFlash').addClass('error')
                    .text('There was an error modifying your dataset ' +
                        'permissions. Please try again later');
            }
        );
    };

    var displayName     = blist.dataset.displayName,
        $permissionForm = $('#gridSidebar_datasetPermissions .disabledFeatureFlags');

    var sidebar;
    var config =
    {
        name: 'manage.datasetPermissions',
        priority: 7,
        title: 'Permissions',
        subtitle: 'Manage the permissions of this ' + displayName,
        noReset: true,
        onlyIf: function()
        {
            return blist.dataset.valid &&
                (!blist.dataset.temporary || blist.dataset.minorChange);
        },
        disabledSubtitle: function()
        {
            return 'This view must be valid and saved';
        },
        sections: [
            {
                customContent: {
                    template: 'datasetPermissions',
                    data: {},
                    directive: {},
                    callback: function($formElem)
                    {
                        // If the publicness is inherited from the parent dataset,
                        // they can't make it private
                        var publicGrant = _.detect(blist.dataset.grants || [], function(grant)
                            {
                                return _.include(grant.flags || [], 'public');
                            }),
                            $publicText   = $formElem.find('.datasetPublicText'),
                            $toggleForm   = $formElem.find('.togglePermissionsForm'),
                            $toggleRadios = $toggleForm.find('.toggleDatasetPermissions');

                        $publicText.text( blist.dataset.isPublic() ? 'Public' : 'Private' );

                        // Only owned, parent-public datasets can be toggled
                        if (blist.dataset.hasRight('update_view') &&
                            ($.isBlank(publicGrant) || (publicGrant.inherited || false) == false))
                        {
                            $toggleRadios
                                .change(function(event) {
                                    togglePermissions($(event.target), $publicText);
                                });

                            _.defer(function() {
                                $toggleRadios.uniform();
                            });
                        }
                        else
                        { $toggleForm.hide(); }

                        $formElem.find('.datasetTypeName').text(displayName);
                        $formElem.find('.datasetTypeNameUpcase')
                            .text(displayName.capitalize());
                    }
                }
            }
        ],
        showCallback: function(sidebarObj, $currentPane)
        {
            sidebar = sidebarObj;
            $currentPane
                .find('.flash')
                    .removeClass('error')
                    .text('')
                .end();
        },
        finishBlock: {
            buttons: [$.gridSidebar.buttons.update,
                      $.gridSidebar.buttons.cancel]
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var formValues = sidebarObj.getFormValues($pane);
        blist.dataset.disabledFeatureFlags = _.reject(_.keys(formValues),
            function(key) { return formValues[key]; });

        blist.dataset.save(function()
        {
            sidebarObj.finishProcessing();
            sidebarObj.$dom().socrataAlert(
                {message: 'Your permissions have been saved', overlay: true});
            sidebarObj.hide();
        }, commonError);
    };

    $.gridSidebar.registerConfig(config);

 })(jQuery);

