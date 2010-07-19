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
            { $line.slideToggle(); });
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
                            {shareType: grant.type}));
                    }
                });
            }
            else if (!$.isBlank(grant.userEmail))
            {
                shares.push({userEmail: grant.userEmail,
                    displayName: grant.userEmail,
                    shareType: grant.type});
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
                    'li@data-email': 'userEmail'
                });
            $li.find('.type').val($.capitalize(share.shareType));

            if (!$.isBlank(share.profileImageUrlSmall))
            { $li.find('.profileImage').css('background-image', 'url(' + share.profileImageUrlSmall + ')'); }

            $ul.append($li);
        });

        _.defer(function(){
            $ul.find('li > select').uniform();
        });

        $('#gridSidebar_shareDataset .type').change(changeShare);
        $('#gridSidebar_shareDataset .removeShareLink').click(removeShare);
    };

    var config =
    {
        name: 'edit.shareDataset',
        priority: 8,
        title: 'Sharing',
        subtitle: 'Manage sharing and permissions of this dataset',
        noReset: true,
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

                         // Grab non-public grants (shares)
                        var grants = _.reject(blist.display.view.grants, function(g)
                        {
                            return _.include(g.flags || [], 'public');
                        });

                        // Clear out the message area
                        $('#gridSidebar_shareDataset .sharingFlash').text('')
                            .removeClass('error').removeClass('notice');

                        // If they have no shares
                        if ($.isBlank(grants) || grants.length == 0)
                        {
                            _.defer(function(){
                                $formElem.find('.loadingShares, .itemsList').hide();
                                $formElem.find('.noShares').fadeIn();
                            });
                            return;
                        }

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
