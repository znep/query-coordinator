(function($)
 {
    // Construct what the core server considers a Grant
    var createGrantObject = function($line)
    {
        return {userId: $line.attr('data-uid'),
                userEmail: $line.attr('data-email'),
                type: $line.find('.type').val().toLowerCase()};
    };

    var commonError = function(cpObj)
    {
        cpObj.$dom().find('.sharingFlash').addClass('error')
            .text('There was an error modifying your shares. Please try again later');
    };

    var grabShares = function(cpObj, $context, grants)
    {
        var shares = [];
        // Grab user object for each grant
        _.each(grants, function(grant)
        {
            if (!$.isBlank(grant.userId))
            {
                $.socrataServer.makeRequest({
                    url: '/users/' + grant.userId + '.json', type: 'GET', data: {}, batch: true,
                    success: function(response)
                    {
                        shares.push($.extend({},response, {shareType: grant.type,
                             shareInherited: grant.inherited}));
                    }
                });
            }
            else if (!$.isBlank(grant.userEmail))
            {
                shares.push({userEmail: grant.userEmail, displayName: grant.userEmail,
                    shareType: grant.type, shareInherited: grant.inherited});
            }
        });

        // Then match up with the grants
        $.socrataServer.sendBatch(function(response)
        {
            var $ul = $context.find('ul.itemsList');
            $ul.empty();

            // Pure render each of the shares out
            _.each(shares, function(share)
            {
                var $li = $.renderTemplate('sharesList', share, {
                        '.name': 'displayName!',
                        '.name@title': 'displayName!',
                        'li@data-uid': 'id',
                        'li@data-currtype': 'shareType',
                        'li@data-email': 'userEmail',
                        'li@class+': function(a)
                            { return (a.context.shareInherited === true ? 'inherited' : '');  }
                    }),
                    shareType = $.capitalize(share.shareType);

                $li.find('select.type').val(shareType).end()
                    .find('span.type').text(shareType);

                if (!$.isBlank(share.profileImageUrlSmall))
                {
                    $li.find('.profileImage').css('background-image',
                        'url(' + share.profileImageUrlSmall + ')');
                }

                $ul.append($li);
            });

            _.defer(function(){ $ul.find('li > select').uniform(); });

            $context.find('.type').change(function(event)
            {
                var $line = $(event.target).closest('.line');

                var existingGrant = createGrantObject($line);

                cpObj.settings.replaceGrant(
                    $.extend({}, existingGrant, {type: $line.attr('data-currtype')}), existingGrant,
                    function()
                    {
                        cpObj.$dom().find('.sharingFlash').removeClass('error').addClass('notice')
                            .text('Your permissions have been updated');
                        // Update the hidden type in case they update again
                        $line.attr('data-currtype', existingGrant.type);
                    }, function() { commonError(cpObj); });
            });

            $context.find('.removeShareLink').click(function(event)
            {
                // Send an update request to the C.S. to delete the grant
                event.preventDefault();
                var $line = $(event.target).closest('.line');

                cpObj.settings.view.removeGrant(createGrantObject($line),
                    function()
                    {
                        $line.slideToggle();
                        updateShareText(cpObj, $line.closest('form'));
                    }, function() { commonError(cpObj); });
            });
        });
    };

    var updateShareText = function(cpObj, $context)
    {
        var $span = $context.find('.andSharedHint');
        var $friends = $context.find('.friendsHint');

        var friends = cpObj.settings.view.userGrants();
        if (friends.length == 0)
        {
            $span.addClass('hide');
            $context.find('.noShares').show().end()
                .find('.shareNotifyLink').hide();
        }
        else
        {
            $span.removeClass('hide');
            $friends.text((friends.length > 1) ? 'friends' : 'friend');
        }
    };

    $.Control.extend('pane_shareDataset', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj.settings.view.bind('permissions_changed', function() { cpObj.reset(); });
        },

        getTitle: function()
        { return 'Sharing'; },

        getSubtitle: function()
        { return 'Share this ' + this.settings.view.displayName; },

        isAvailable: function()
        {
            return this.settings.view.valid &&
                (!this.settings.view.temporary || this.settings.view.minorChange);
        },

        getDisabledSubtitle: function()
        { return 'This view must be valid and saved'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'sharingForm',
                        data: {},
                        directive: {},
                        callback: function($formElem)
                        {
                            var cpObj = this;

                            $formElem.find('.shareDatasetButton').click(function(event)
                            {
                                event.preventDefault();
                                if ($.subKeyDefined(blist, 'dialog.sharing') &&
                                    _.isFunction(blist.dialog.sharing))
                                { blist.dialog.sharing(event); }
                            });

                            $formElem.find('.shareNotifyLink').click(function(event)
                            {
                                event.preventDefault();
                                cpObj.settings.view.notifyUsers(function(responseData)
                                    { $formElem.find('.shareNoticeSent').fadeIn(); });
                            });

                            $formElem.find('.publicOrPrivate')
                                  .text(cpObj.settings.view.isPublic() ? 'Public' : 'Private').end()
                                  .find('.datasetTypeName').text(cpObj.settings.view.displayName).end()
                                  .find('.datasetTypeNameUpcase')
                                    .text(cpObj.settings.view.displayName.capitalize());

                            // When this pane gets refreshed, update to reflect who it's shared with
                            updateShareText(cpObj, $formElem);

                            var grants = cpObj.settings.view.userGrants();

                            // If they have no shares
                            if ($.isBlank(grants) || grants.length == 0)
                            {
                                _.defer(function(){
                                    $formElem.find('.loadingShares, .itemsList').hide();
                                    $formElem.find('.noShares').fadeIn();
                                });
                                return;
                            }

                            _.defer(function(){ $formElem.find('.shareNotifyArea').fadeIn(); });

                            // Start ajax for getting user names from UIDs
                            grabShares(cpObj, $formElem, grants);
                        }
                    }
                }
            ];
        },

        shown: function()
        {
            this._super();
            this.$dom().find('.flash:not(.shareNoticeSent)').removeClass('error notice').text('').end()
                .find('.shareNoticeSent').hide();
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.done]; }
    }, {name: 'shareDataset', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.sharing)
    { $.gridSidebar.registerConfig('manage.shareDataset', 'pane_shareDataset', 8); }

 })(jQuery);
