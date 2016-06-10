;$(function() {
    blist.namespace.fetch('blist.dialog');
    var $form;
    var $flash;
    var friends = [];
    var groups = [];
    var didSetup = false;

    // Awesomecomplete's way of rendering result
    var awesomeRenderFunction = function(dataItem, topMatch) {
        if (dataItem.type === 'user') {
            return '<p class="title">' + dataItem.displayName + '</p>' +
                   '<p class="matchRow"><span class="matchedField">Email:</span> ' +
                    dataItem.email + '</p>';
       } else if (dataItem.type === 'group') {
            return '<p class="title">' + dataItem.name + '</p>';
       }
    };

    var awesomeValueFunction = function(dataItem) {
        if (dataItem.type === 'user') {
            return dataItem.email;
        } else if (dataItem.type === 'group') {
            return dataItem.name;
        }
    };

    var awesomeAchieved = function(dataItem, context) {
        if (dataItem.type === 'user') {
            context.closest('div').siblings('.recipientUid').
                val(dataItem.id).end();
        } else if (dataItem.type === 'group') {
            context.closest('div').siblings('.groupUid').
                val(dataItem.id).end();
        }
    };

    var awesomeShow = function($list) {
        $list.parent().css('z-index', 3001);
    };

    var awesomeBlur = function($list) {
        $list.parent().css('z-index', '');
    };

    var autoCompleteForFriendsOrGroups = function(item) {
        item.awesomecomplete({
            blurFunction: awesomeBlur,
            dontMatch: ['id', 'type'],
            onComplete: awesomeAchieved,
            showFunction: awesomeShow,
            staticData: friends.concat(groups),
            renderFunction: awesomeRenderFunction,
            valueFunction: awesomeValueFunction
        });
    };

    blist.dialog.sharing = function(e, owner, dataset) {
        if (!$.isBlank(e)) {
            e.preventDefault();
        }

        if (!didSetup) {
            doSetup();
        }

        var $emailDialog = $('.emailDatasetDialog');

        dataset = dataset || blist.dataset;
        $form.data('dataset', dataset);

        $emailDialog.toggleClass('ownerDialog', dataset.hasRight(blist.rights.view.GRANT));

        $form.attr('action', '/api/views/' + dataset.id + '.json?method=sendAsEmail');
        $form.validate().resetForm();

        var displayName = dataset.displayName;
        $emailDialog.find('.datasetTypeName').text(displayName);
        $emailDialog.find('.datasetTypeNameUpcase').text(displayName.capitalize());
        $emailDialog.find('.datasetName').text(dataset.name);

        $emailDialog.find('.emailLine').slice(1).remove();
        $emailDialog.find('.emailRecipient').val('');
        $emailDialog.find('.recipientUid').val('');
        $emailDialog.find('.groupUid').val('');
        $emailDialog.find('#emailMessage').val('');

        var $eLine = $emailDialog.find('.emailLine');
        $eLine.find('.recipientRole').closest('.uniform').andSelf().remove();
        if ($emailDialog.hasClass('ownerDialog')) {
            $eLine.append($.tag({ tagName: 'select', 'class': 'recipientRole', name: 'role',
                contents: _.map(dataset.getShareTypes(), function(t) {
                    return { tagName: 'option', value: t, contents: $.t('core.share_types.' + t.toLowerCase())
                };
            })
            }));
            $eLine.find('select').uniform();
        }

        $('.emailDatasetContent').show();
        $('.emailSuccess').hide();
        $emailDialog.data('owner', owner);
        $emailDialog.jqmShow();

        $flash.removeClass('notice').removeClass('error').text('');

        // Set up warning message if this is a private view
        if (!dataset.isPublic()) {
            $flash.addClass('notice').
                text($.t('screens.ds.email.private_notice', {displayName: displayName}));
        }

        if (!$.isBlank(blist.currentUserId)) {
            if (friends.length === 0) { // Fetch friends for auto-complete
                $.ajax({
                    url: '/api/users/' + blist.currentUserId + '/contacts.json',
                    dataType: 'json',
                    success: function(data) {
                        // Strip off stuff we don't want people searching by
                        friends = _.map(_.select(data, function(u) {
                            return !$.isBlank(u.email);
                        }), function(friend) {
                            return {displayName: $.htmlEscape(friend.displayName),
                                email: friend.email, id: friend.id, type: 'user'};
                        });
                        autoCompleteForFriendsOrGroups($('.emailRecipient'));
                    }
                });
            }

            if (groups.length === 0) { // Fetch groups for auto-complete
                $.ajax({
                    url: '/api/groups/?method=all',
                    dataType: 'json',
                    success: function(data) {
                        groups = _.map(data, function(group) {
                            return {name: group.name, id: group.id, type: 'group'};
                        });
                        autoCompleteForFriendsOrGroups($('.emailRecipient'));
                    }
                });
            }
        }
    };

    // Modal show link
    $.live('#shareMenu .menuEntries .email a', 'click', blist.dialog.sharing);

    $.live('.emailDatasetDialog .removeLink', 'click', function(e) {
        e.preventDefault();
        $(this).closest('.emailLine').remove();
        emailCount --;
        if (emailCount < 10) {
            $('.emailDatasetDialog .addMoreRecipientsButton').removeClass('disabled');
        }
    });

    var emailCount = 1;
    var doSetup = function() {
        $form = $('#emailDatasetForm');
        $flash = $('#emailDatasetMessage');

        /**
         * This is a custom jQuery Validation validator.
         * It checks following 3 scenarios:
         *   1. It is a group name, selected from auto complete
         *   2. It is a user email, selected from auto complete
         *   3. It is email address, not selected from auto complete
         *      A future account will be created this case.
         */
        $.validator.addMethod('emailRecipient', function(value, element) {
            var uid = $(element).closest('div').siblings('.recipientUid').val();
            var gid = $(element).closest('div').siblings('.groupUid').val();
            return _.some(groups, {id:  gid, name: value}) ||
                   _.some(friends, {id:  uid, email: value}) ||
                   $.validator.methods.email.call(this, value, element);
        }, $.tNull('core.validation.email_recipient') || 'Please enter a valid email address or choose a group.');

        // Add more recipients link
        $('.emailDatasetDialog .addMoreRecipientsButton').click(function(e) {
            e.preventDefault();

            if ($(this).hasClass('disabled')) {
                return;
            }

            emailCount++;

            // Make a clean copy of the line
            var $copy = $form.find('.emailLine').first().
                clone().
                find('.emailRecipient').attr('name', 'emailRecipient' + emailCount).end().
                find('.autocomplete').remove().end().
                find('label.error').remove().end().
                find('input').val('').end().
                find('.recipientUid').val('').end().
                find('.groupUid').val('').end().
                find('.removeLink').removeClass('hiddenLink').end();

            var $select = $copy.find('.recipientRole');
            // Non-admins won't have sharing dropdown
            if ( $select.length > 0 ) {
                $select.get(0).selectedIndex = 0;
                $copy.find('.selector.uniform').replaceWith($select);
                $select.uniform();
            }

            $copy.insertAfter($form.find('.emailLine:last'));
            var $emailField = $copy.find('.emailRecipient');

            $emailField.rules('add', {
                emailRecipient: true,
                required: true
            });

            if (friends.length > 0 || groups.length > 0) {
                autoCompleteForFriendsOrGroups($emailField);
            }

            if (emailCount > 9) {
                $(this).addClass('disabled');
            }
        });

        // Use lazy validation, otherwise it interferes with the autocomplete
        $form.validate({
            rules: {
              emailRecipient0: {
                emailRecipient: true,
                required: true
              }
            },
            errorPlacement: function($error, $element) {
                $element.closest('.emailLine').after($error);
            },
            onkeyup: false,
            onfocusout: false,
            focusInvalid: false
        });

        $form.submit(function(e) {
            e.preventDefault();
            if ($form.valid()) {
                var dataset = $form.data('dataset');
                var isPublic = dataset.isPublic();

                var message = $form.find('#emailMessage').val();

                $form.find('.emailLine').each(function() {
                    // Send notification email
                    var address = $(this).find('.emailRecipient').val();
                    var uid = $(this).find('.recipientUid').val();
                    var gid = $(this).find('.groupUid').val();
                    var grantType = $(this).find('.recipientRole').val();

                    if (!$.isBlank(address)) {
                        // Grant access as necessary
                        if (!isPublic || !$.isBlank(grantType)) {
                            var grant = {type: grantType, message: message};
                            if (!$.isBlank(uid)) {
                                grant.userId = uid;
                            } else if (!$.isBlank(gid)) {
                                grant.groupUid = gid;
                            } else {
                                grant.userEmail = address;
                            }

                            // Create a grant for the user
                            dataset.createGrant(grant, null, null, true);
                        } else {
                            $.socrataServer.makeRequest({
                                url: $form.attr('action'),
                                type: 'POST', batch: true,
                                data: JSON.stringify({recipient: address, message: message})
                            });
                        }
                    }
                });

                var refreshCallback = function() {
                    $form.closest('.emailDatasetContent').slideToggle();
                    $('.emailSuccess').slideToggle();

                    // Update the sharing pane to reflect
                    var owner = $form.closest('.emailDatasetDialog').data('owner') || {};
                    if (_.isFunction(owner.reset)) {
                        owner.reset();
                    } else if ($.subKeyDefined(blist, 'datasetPage.sidebar')) {
                        blist.datasetPage.sidebar.refresh('manage.shareDataset');
                    }
                };

                /* global ServerModel ServerModel:true */
                ServerModel.sendBatch(refreshCallback, function(errorMessage) {
                    $flash.addClass('error').
                        text(errorMessage || 'There was an error sending your email. Please try again later.');
                });
            }
        });

        $('#emailSubmitButton').click(function(e) {
            e.preventDefault();
            $form.submit();
        });

        $('.emailDatasetContent .cancel').click(function(e) {
          $form.find('label.error').remove();
        });

        didSetup = true;
    };
});
