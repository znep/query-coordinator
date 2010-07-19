;$(function()
{
    blist.namespace.fetch('blist.dialog');
    var $form = $('#emailDatasetForm');
    var $flash = $('#emailDatasetMessage');
    var friends = false;

    // Awesomecomplete's way of rendering result
    var awesomeRenderFunction = function(dataItem, topMatch)
    {
        return '<p class="title">' + dataItem['displayName'] + '</p>' +
               '<p class="matchRow"><span class="matchedField">Email:</span> ' +
               dataItem['email'] + '</p>';
    };

    var awesomeAchieved = function(dataItem, context)
    {
        context.siblings('.recipientUid')
            .val(dataItem['id']).end();
    };

    var autoCompleteForFriends = function(item)
    {
        item.awesomecomplete({
            dontMatch: ['id'],
            onComplete: awesomeAchieved,
            staticData: friends,
            renderFunction: awesomeRenderFunction,
            valueFunction: function(dataItem)
            {
                return dataItem['email'];
            }
        });
    };

    blist.dialog.sharing = function(e)
    {
        e.preventDefault();

        $('.emailDatasetDialog.ownerDialog .emailDatasetHint').text('Share');

        $('.emailDatasetContent').show();
        $('.emailSuccess').hide();
        $('.emailDatasetDialog').jqmShow();

        // Set up warning message if this is a private view
        if (!blist.dataset.isPublic(blist.display.view))
        {
            $flash.addClass('notice')
                .text('Notice: This dataset is currently private. ' +
                    'Emailing will grant access to all recipients.');
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
                    friends = _.map(data, function(friend)
                    {
                        return {displayName: friend.displayName,
                            email: friend.email, id: friend.id};
                    });
                    autoCompleteForFriends($('.emailRecipient'));
                }
            });
        }

        $form.find('.emailLine > select').uniform();
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
        $copy.find('.selector.uniform').replaceWith($select);

        $copy.appendTo($form);

        $select.uniform();

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
          emailRecipient0: 'email'
        },
        errorPlacement: function($error, $element)
        { $error.appendTo($element.closest('.emailLine')); },
        onkeyup: false,
        onfocusout: false,
        focusInvalid: false
    });

    $form.submit(function(e)
    {
        e.preventDefault();
        if ($form.valid())
        {
            var isPublic = blist.dataset.isPublic(blist.display.view);

            _.each($form.find('.emailLine'), function(e, i, list)
            {
                // Send notification email
                var address = $(e).find('.emailRecipient').val();
                var uid = $(e).find('recipientUid').val();
                var grantType = $(e).find('.recipientRole').val();

                if (!$.isBlank(address))
                {
                    // Grant access as necessary
                    if (!isPublic || !$.isBlank(grantType))
                    {
                        // Create a grant for the user
                        $.socrataServer.addRequest({
                            url: '/views/' + blist.display.view.id + '/grants',
                            type: 'POST',
                            data: JSON.stringify({userEmail: address,
                                type: grantType, userId: uid, message: ''})
                        });
                    }
                    else
                    {
                        $.socrataServer.addRequest({
                            url: $form.attr('action'),
                            type: 'POST',
                            data: JSON.stringify({recipient: address})
                        });
                    }
                }
            });

            $.socrataServer.runRequests({success: function()
                {
                    $form.closest('.emailDatasetContent').slideToggle();
                    $('.emailSuccess').slideToggle();

                    // HACK: we don't get grant data back from the server,
                    // so manually pull the view JSON for the sharing pane to
                    // update itself with
                    $.ajax({
                        url: '/views/' + blist.display.view.id + '.json',
                        dataType: 'json',
                        success: function(responseData)
                        {
                            blist.display.view.grants = responseData.grants;

                            // Update the sharing pane to reflect
                            if ($form.closest('.emailDatasetDialog').hasClass('ownerDialog'))
                            { $('#gridSidebar').gridSidebar().refresh('edit.shareDataset'); }
                        }
                    });


                },
                error: function()
                {
                    $flash.addClass('error').text('There was an error sending your email. Please try again later.');
                }
            });
        }
    });

    $('#emailSubmitButton').click(function(e)
    {
        e.preventDefault();
        $form.submit();
    });

});
