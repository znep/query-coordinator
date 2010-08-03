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

    var modifyShare = function($line, method, type, data, successFunction)
    {
        $.ajax({
            url: '/api/views/' + blist.display.view.id + '/grants/' + method,
            contentType: 'application/json',
            dataType: 'json',
            type: type,
            data: JSON.stringify(data),
            error: function(request, textStatus, errorThrown)
            {
                $('#gridSidebar_shareDataset .sharingFlash').addClass('error')
                    .text('There was an error modifying your shares. Please try again later');
            },
            success: successFunction
        });
    }

    // Send an update request to the C.S. to delete the grant
    var removeShare = function(event)
    {
        event.preventDefault();
        var $line = $(event.target).closest('.line');

        modifyShare($line, 'i?method=delete', 'PUT',
            createGrantObject($line),
            function(responseData)
            {
                $line.slideToggle();
                var newGrants = _.reject(blist.display.view.grants || [],
                    function(grant)
                    {
                        return ((!$.isBlank(grant.userId) &&
                                    grant.userId == $line.attr('data-uid')) ||
                                (!$.isBlank(grant.userEmail) &&
                                    grant.userEmail == $line.attr('data-email')));
                    });
                blist.display.view.grants = newGrants;
                updateShareText($line.closest('form'));
            });
    };

    // The most beautiful code you have ever seen
    var changeShare = function(event)
    {
        var $line = $(event.target).closest('.line');

        var existingGrant = createGrantObject($line);

        // Core server only accepts creation or deletion for grants, so...
        modifyShare($line, 'i?method=delete', 'PUT',
            $.extend({}, existingGrant, {type: $line.attr('data-currtype')}),
            function(responseData)
            {
                // Now make a POST (create) request
                modifyShare($line, '', 'POST',
                    existingGrant,
                    function(responseData)
                    {
                        $('#gridSidebar_shareDataset .sharingFlash').removeClass('error')
                            .addClass('notice')
                            .text('Your permissions have been updated');
                        // Update the hidden type in case they update again
                        $line.attr('data-currtype', existingGrant.type);
                    }
                );
            }
        );
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
                success: function(response) { sharesRenderCallback(context, shares); }
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

        var view = blist.display.view;
        var isPublic = blist.datasetUtil.isPublic(view);
        var $link = $(event.target);

        var serverValue = isPublic ? 'private' : $link.attr('data-public-perm');

        $.ajax({
            url: '/api/views/' + view.id,
            data: {'method': 'setPermission', 'value': serverValue},
            success: function(responseData)
            {
                $link.text(isPublic ? 'Private' : 'Public');
                if (!isPublic)
                {
                    if ($.isBlank(blist.display.view.grants))
                    { blist.display.view.grants = []; }

                    blist.display.view.grants.push({
                        flags: ['public']
                    });
                }
                else
                {
                    // Manually pull out the public grants
                    blist.display.view.grants = getNonPublicGrants(blist.display.view.grants);
                }
                $('#gridSidebar').gridSidebar().updateEnabledSubPanes();
            },
            error: function(request, textStatus, errorThrown)
            {
                $('#gridSidebar_shareDataset .sharingFlash').addClass('error')
                    .text('There was an error modifying your dataset permissions. Please try again later');
            }
        });
    };

    var updateShareText = function(context)
    {
        var $span = context.find('.andSharedHint');
        var $friends = context.find('.friendsHint');

        var friends = getNonPublicGrants(blist.display.view.grants);
        if (friends.length == 0)
        {
            $span.addClass('hide');
            context.find('.noShares').show();
        }
        else
        {
            $span.removeClass('hide');
            $friends
                .text((friends.length > 1) ? 'friends' : 'friend');
        }
    };

    var getNonPublicGrants = function(grants)
    {
        return _.reject(grants || [],
            function(g)
            {
                return _.include(g.flags || [], 'public');
            });
    };

    var displayName = blist.datasetUtil.getTypeName(blist.display.view);

    var config =
    {
        name: 'edit.shareDataset',
        priority: 8,
        title: 'Sharing',
        subtitle: 'Manage sharing and permissions of this ' + displayName,
        noReset: true,
        onlyIf: function(view)
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
                            $.ajax({
                                url: '/api/views/' + blist.display.view.id + '.json?method=notifyUsers',
                                method: 'POST',
                                success: function(responseData) {
                                    $formElem.find('.shareNoticeSent').fadeIn();
                                }
                            });
                        });

                        // If the publicness is inherited from the parent dataset, they can't make it private
                        var publicGrant = _.detect(blist.display.view.grants || [], function(grant)
                            {
                                return _.include(grant.flags || [], 'public');
                            }),
                            $toggleLink = $formElem.find('.toggleDatasetPermissions');

                        if ($.isBlank(publicGrant) || publicGrant.inherited == false)
                        {
                            $toggleLink.click(togglePermissions)
                                .text(blist.datasetUtil.isPublic(blist.display.view) ? 'Public' : 'Private');
                        }
                        else
                        { $toggleLink.replaceWith($('<span>Public</span>')); }

                        $formElem.find('.datasetTypeName').text(displayName);
                        $formElem.find('.datasetTypeNameUpcase').text(displayName.capitalize());

                        // Clear out the message area
                        $('#gridSidebar_shareDataset .sharingFlash').text('')
                            .removeClass('error').removeClass('notice');

                        // When this pane gets refreshed, update to reflect who it's shared with
                        updateShareText($formElem);

                        var grants = getNonPublicGrants(blist.display.view.grants);

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
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done]
        }
    };

    $.gridSidebar.registerConfig(config);

 })(jQuery);
