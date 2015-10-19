;$(function()
{
    blist.namespace.fetch('blist.dialog');
    var $form;
    var $flash;
    var friends = false;
    var didSetup = false;

    // Awesomecomplete's way of rendering result
    var awesomeRenderFunction = function(dataItem, topMatch)
    {
        return '<p class="title">' + dataItem['displayName'] + '</p>' +
               '<p class="matchRow"><span class="matchedField">Email:</span> ' +
               dataItem['email'] + '</p>';
    };

    var awesomeAchieved = function(dataItem, context)
    {
        context.closest('div').siblings('.recipientUid')
            .val(dataItem['id']).end();
    };

    var awesomeShow = function($list)
    { $list.parent().css('z-index', 3001); };

    var awesomeBlur = function($list)
    { $list.parent().css('z-index', ''); };

    var autoCompleteForFriends = function(item)
    {
        item.awesomecomplete({
            blurFunction: awesomeBlur,
            dontMatch: ['id'],
            onComplete: awesomeAchieved,
            showFunction: awesomeShow,
            staticData: friends,
            renderFunction: awesomeRenderFunction,
            valueFunction: function(dataItem)
            {
                return dataItem['email'];
            }
        });
    };

    blist.dialog.sharing = function(e, owner, dataset)
    {
        if (!$.isBlank(e)) { e.preventDefault(); }

        if (!didSetup)
        { doSetup(); }

        var $emailDialog = $('.emailDatasetDialog');

        dataset = dataset || blist.dataset;
        $form.data('dataset', dataset);

        $emailDialog.toggleClass('ownerDialog', dataset.hasRight('grant'));

        $form.attr('action', '/api/views/' + dataset.id + '.json?method=sendAsEmail');
        $form.validate().resetForm();

        var displayName = dataset.displayName;
        $emailDialog.find('.datasetTypeName').text(displayName);
        $emailDialog.find('.datasetTypeNameUpcase').text(displayName.capitalize());
        $emailDialog.find('.datasetName').text(dataset.name);

        $emailDialog.find('.emailLine').slice(1).remove();
        $emailDialog.find('.emailRecipient').val('');
        $emailDialog.find('.recipientUid').val('');
        $emailDialog.find('#emailMessage').val('');

        var $eLine = $emailDialog.find('.emailLine');
        $eLine.find('.recipientRole').closest('.uniform').andSelf().remove();
        if ($emailDialog.hasClass('ownerDialog'))
        {
            $eLine.append($.tag({ tagName: 'select', 'class': 'recipientRole', name: 'role',
                contents: _.map(dataset.getShareTypes(), function(t)
                    { return { tagName: 'option', value: t, contents: $.t('core.share_types.' + t.toLowerCase()) }; })
            }));
            $eLine.find('select').uniform();
        }

        $('.emailDatasetContent').show();
        $('.emailSuccess').hide();
        $emailDialog.data('owner', owner);
        $emailDialog.jqmShow();

        $flash.removeClass('notice').removeClass('error').text('');

        // Set up warning message if this is a private view
        if (!dataset.isPublic())
        {
            $flash.addClass('notice')
                .text($.t('screens.ds.email.private_notice', {displayName: displayName}));
        }

        // Fetch friends for auto-complete if logged in
        if (!friends && !$.isBlank(blist.currentUserId))
        {
            $.ajax({
                url: '/api/users/' + blist.currentUserId + '/contacts.json',
                dataType: 'json',
                success: function(data)
                {
                    // Strip off stuff we don't want people searching by
                    friends = _.map(_.select(data, function(u)
                        { return !$.isBlank(u.email); }), function(friend)
                    {
                        return {displayName: $.htmlEscape(friend.displayName),
                            email: friend.email, id: friend.id};
                    });
                    autoCompleteForFriends($('.emailRecipient'));
                }
            });
        }
    };

    // Modal show link
    $.live('#shareMenu .menuEntries .email a', 'click', blist.dialog.sharing);

    $.live('.emailDatasetDialog .removeLink', 'click', function(e)
    {
        e.preventDefault();
        $(this).closest('.emailLine').remove();
        emailCount --;
        if (emailCount < 10)
        {
            $('.emailDatasetDialog .addMoreRecipientsButton')
                .removeClass('disabled');
        }
    });

    var emailCount = 1;
    var doSetup = function()
    {
        $form = $('#emailDatasetForm');
        $flash = $('#emailDatasetMessage');

        // Add more recipients link
        $('.emailDatasetDialog .addMoreRecipientsButton').click(function(e)
        {
            e.preventDefault();

            if ($(this).hasClass('disabled')) { return; }

            emailCount++;

            // Make a clean copy of the line
            var $copy = $form.find('.emailLine').first()
                .clone()
                .find('.autocomplete').remove().end()
                .find('label.error').remove().end()
                .find('input').val('').end()
                .find('.removeLink').removeClass('hiddenLink').end();

            var $select = $copy.find('.recipientRole');
            // Non-admins won't have sharing dropdown
            if ( $select.length > 0 )
            {
                $select.get(0).selectedIndex = 0;
                $copy.find('.selector.uniform').replaceWith($select);
                $select.uniform();
            }

            $copy.insertAfter($form.find('.emailLine:last'));

            var $emailField = $copy.find('.emailRecipient')
                .attr('name', 'emailRecipient' + emailCount);

            $emailField.rules('add', {
                email: true
            });

            if (friends && friends.length > 0)
            { autoCompleteForFriends($emailField); }

            if (emailCount > 9)
            { $(this).addClass('disabled'); }
        });

        // Use lazy validation, otherwise it interferes with the autocomplete
        $form.validate({
            rules: {
              emailRecipient0: {
                email: true,
                required: true
              }
            },
            errorPlacement: function($error, $element)
            { $element.closest('.emailLine').append($error); },
            onkeyup: false,
            onfocusout: false,
            focusInvalid: false
        });

        $form.submit(function(e)
        {
            e.preventDefault();
            if ($form.valid())
            {
                var dataset = $form.data('dataset');
                var isPublic = dataset.isPublic();

                var message = $form.find('#emailMessage').val();

                $form.find('.emailLine').each(function()
                {
                    // Send notification email
                    var address = $(this).find('.emailRecipient').val();
                    var uid = $(this).find('.recipientUid').val();
                    var grantType = $(this).find('.recipientRole').val();

                    if (!$.isBlank(address))
                    {
                        // Grant access as necessary
                        if (!isPublic || !$.isBlank(grantType))
                        {
                            var grant = {userEmail: address,
                                    type: grantType, message: message};
                            if (!$.isBlank(uid))
                            { grant['userId'] = uid; }

                            // Create a grant for the user
                            dataset.createGrant(grant, null, null, true);
                        }
                        else
                        {
                            $.socrataServer.makeRequest({
                                url: $form.attr('action'),
                                type: 'POST', batch: true,
                                data: JSON.stringify({recipient: address, message: message})
                            });
                        }
                    }
                });

                var refreshCallback = function()
                {
                    $form.closest('.emailDatasetContent').slideToggle();
                    $('.emailSuccess').slideToggle();

                    // Update the sharing pane to reflect
                    var owner = $form.closest('.emailDatasetDialog').data('owner') || {};
                    if (_.isFunction(owner.reset))
                    { owner.reset(); }
                    else if ($.subKeyDefined(blist, 'datasetPage.sidebar'))
                    { blist.datasetPage.sidebar.refresh('manage.shareDataset'); }
                };

                ServerModel.sendBatch(refreshCallback,
                        function(errorMessage)
                        {
                          var message = errorMessage || 'There was an error sending your email. Please try again later.';
                          $flash.addClass('error').text(message);
                        });
            }
        });

        $('#emailSubmitButton').click(function(e)
        {
            e.preventDefault();
            $form.submit();
        });

        $('.emailDatasetContent .cancel').click(function(e) {
          $('form').find('label.error').remove();
        });

        didSetup = true;
    };
});
