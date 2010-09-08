(function($)
 {
    if (blist.sidebarHidden.sharing)
   { return; }

    // Construct what the core server considers a Grant
    var createGrantObject = function($line)
    {
        return {userId: $line.attr('data-uid'),
                userEmail: $line.attr('data-email'),
                type: $line.find('.type').val().toLowerCase()}
    };

    var commonError = function()
    {
        $('#gridSidebar_shareDataset .sharingFlash').addClass('error')
            .text('There was an error modifying your shares. Please try again later');
    };

    // Send an update request to the C.S. to delete the grant
    var removeShare = function(event)
    {
        event.preventDefault();
        var $line = $(event.target).closest('.line');

        blist.dataset.removeGrant(createGrantObject($line),
            function()
            {
                $line.slideToggle();
                updateShareText($line.closest('form'));
            }, commonError);
    };

    var changeShare = function(event)
    {
        var $line = $(event.target).closest('.line');

        var existingGrant = createGrantObject($line);

        blist.dataset.replaceGrant(
            $.extend({}, existingGrant, {type: $line.attr('data-currtype')}),
            existingGrant,
            function()
            {
                $('#gridSidebar_shareDataset .sharingFlash').removeClass('error')
                    .addClass('notice')
                    .text('Your permissions have been updated');
                // Update the hidden type in case they update again
                $line.attr('data-currtype', existingGrant.type);
            }, commonError);
    };

    var grabShares = function(context, grants)
    {
        var shares = [];
        // Grab user object for each grant
        _.each(grants, function(grant)
        {
            if (!$.isBlank(grant.userId))
            {
                $.socrataServer.addRequest({
                    url: '/users/' + grant.userId + '.json',
                    type: 'GET',
                    data: {},
                    success: function(response)
                    {
                        shares.push($.extend({},response,
                            {shareType: grant.type,
                             shareInherited: grant.inherited}));
                    }
                });
            }
            else if (!$.isBlank(grant.userEmail))
            {
                shares.push({userEmail: grant.userEmail,
                    displayName: grant.userEmail,
                    shareType: grant.type,
                    shareInherited: grant.inherited});
            }
        });
        // Then match up with the grants
        if (!$.socrataServer.runRequests({
                success: function(response)
                { sharesRenderCallback(context, shares); }
            }))
        { sharesRenderCallback(context, shares); }
    };

    var sharesRenderCallback = function(context, data)
    {
        var $ul = context.find('ul.itemsList');
        $ul.empty();

        // Pure render each of the shares out
        _.each(data, function(share)
        {
            var $li = $.renderTemplate('sharesList', share, {
                    '.name': 'displayName',
                    'li@data-uid': 'id',
                    'li@data-currtype': 'shareType',
                    'li@data-email': 'userEmail',
                    'li@class+': function(a) { return (a.context.shareInherited === true ? 'inherited' : '');  }
                });
            $li.find('.type').val($.capitalize(share.shareType));

            if (!$.isBlank(share.profileImageUrlSmall))
            { $li.find('.profileImage').css('background-image', 'url(' + share.profileImageUrlSmall + ')'); }

            $ul.append($li);
        });

        _.defer(function(){
            $ul.find('li > select').uniform();
        });

        context.find('.type').change(changeShare);
        context.find('.removeShareLink').click(removeShare);
    };

    var togglePermissions = function(event)
    {
        event.preventDefault();

        var $link = $(event.target);

        var serverValue = blist.dataset.isPublic() ?
            'private' : $link.attr('data-public-perm');

        blist.dataset['make' + (blist.dataset.isPublic() ? 'Private' : 'Public')](
            function()
            {
                $link.text(blist.dataset.isPublic() ? 'Public' : 'Private');
                $('#gridSidebar').gridSidebar().updateEnabledSubPanes();
            },
            function(request, textStatus, errorThrown)
            {
                $('#gridSidebar_shareDataset .sharingFlash').addClass('error')
                    .text('There was an error modifying your dataset ' +
                        'permissions. Please try again later');
            }
        );
    };

    var updateShareText = function(context)
    {
        var $span = context.find('.andSharedHint');
        var $friends = context.find('.friendsHint');

        var friends = blist.dataset.userGrants();
        if (friends.length == 0)
        {
            $span.addClass('hide');
            context
                .find('.noShares')
                    .show().end()
                .find('.shareNotifyLink')
                    .hide();
        }
        else
        {
            $span.removeClass('hide');
            $friends
                .text((friends.length > 1) ? 'friends' : 'friend');
        }
    };

    var displayName = blist.dataset.displayName;

    var config =
    {
        name: 'edit.shareDataset',
        priority: 8,
        title: 'Sharing',
        subtitle: 'Manage sharing and permissions of this ' + displayName,
        noReset: true,
        onlyIf: function()
        {
            return blist.dataset.valid && !blist.dataset.temporary;
        },
        disabledSubtitle: function()
        {
            return 'This view must be valid and saved';
        },
        sections: [
            {
                customContent: {
                    template: 'sharingForm',
                    data: {},
                    directive: {},
                    callback: function($formElem)
                    {

                        $formElem.find('.shareDatasetButton').click(function(event)
                        {
                            event.preventDefault();
                            if(_.isFunction(blist.dialog.sharing))
                            { blist.dialog.sharing(event); }
                        });

                        $formElem.find('.shareNotifyLink').click(function(event)
                        {
                            event.preventDefault();
                            blist.dataset.notifyUsers(function(responseData)
                                { $formElem.find('.shareNoticeSent').fadeIn(); });
                        });

                        // If the publicness is inherited from the parent dataset, they can't make it private
                        var publicGrant = _.detect(blist.dataset.grants || [], function(grant)
                            {
                                return _.include(grant.flags || [], 'public');
                            }),
                            $toggleLink = $formElem.find('.toggleDatasetPermissions');

                        if ($.isBlank(publicGrant) || publicGrant.inherited == false)
                        {
                            $toggleLink.click(togglePermissions)
                                .text(blist.dataset.isPublic() ? 'Public' : 'Private');
                        }
                        else
                        { $toggleLink.replaceWith($('<span>Public</span>')); }

                        $formElem.find('.datasetTypeName').text(displayName);
                        $formElem.find('.datasetTypeNameUpcase')
                            .text(displayName.capitalize());

                        // When this pane gets refreshed, update to reflect who it's shared with
                        updateShareText($formElem);

                        var grants = blist.dataset.userGrants();

                        // If they have no shares
                        if ($.isBlank(grants) || grants.length == 0)
                        {
                            _.defer(function(){
                                $formElem.find('.loadingShares, .itemsList').hide();
                                $formElem.find('.noShares').fadeIn();
                            });
                            return;
                        }

                        _.defer(function(){
                            $formElem.find('.shareNotifyArea').fadeIn();
                        });

                        // Start ajax for getting user names from UIDs
                        grabShares($formElem, grants);
                    }
                }
            }
        ],
        showCallback: function(sidebarObj, $currentPane)
        {
            $currentPane
                .find('.flash:not(.shareNoticeSent)')
                    .removeClass('error notice')
                    .text('')
                .end()
                .find('.shareNoticeSent')
                    .hide();
        },
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done]
        }
    };

    $.gridSidebar.registerConfig(config);

 })(jQuery);
