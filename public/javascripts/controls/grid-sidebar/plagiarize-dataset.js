(function($)
 {
    if (blist.sidebarHidden.plagiarize)
    { return; }

    var radioOptions = [
        {name: 'user', type: 'text', extraClass: 'friendSelect'}
    ];
    if (blist.dataset.owner.id != blist.currentUserId)
    {
        radioOptions.unshift({name: 'user', value: 'Me', type: 'static', isInput: true});
    }

    var thief, _eventsBound;

    var config =
    {
        name: 'edit.plagiarism',
        priority: 10,
        title: 'Ownership',
        subtitle: 'To transfer to another user, enter the email address or account name ' +
                  'of the Socrata ID, then select the desired account from the dropdown ' +
                  'list. You may also enter the user\'s profile URL if you know it. ' +
                  'Only users with existing accounts may take ownership of datasets.',
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
        sections: [ {
            title: 'Transfer ownership to',
            fields: [ {type: 'group', options: [
                {type: 'radioGroup', name: 'datasetThief',
                    defaultValue: 'currentUser', options: radioOptions}
            ]}]
        } ],
        showCallback: function(sidebarObj, $currentPane)
        {
            if (_eventsBound) { return; }
            _eventsBound = true;

            var $friendSelect = $currentPane.find('.friendSelect');
            $friendSelect
                .userPicker({
                    attachTo: $friendSelect,
                    chooseCallback: function(user) {
                        thief = user;
                    },
                    filterCallback: function(user) {
                        return user.id !== blist.dataset.owner.id;
                    },
                    valueFunction: function(user) { return user.email; },
                    limit: 25
                });
        },
        finishBlock: {
            buttons: [$.gridSidebar.buttons.apply,
                      $.gridSidebar.buttons.cancel]
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        sidebarObj.finishProcessing();
        var formValue = sidebarObj.getFormValues($pane);
        var userText = formValue.user;
        var $error = $pane.find('.mainError');
        $error.text('');

        if (!userText)
        {
            $error.text('Please select a user.')
            return;
        }

        var userId, successText;
        if (userText == 'Me')
        {
            successText = 'You are now the owner of this dataset';
            userId = blist.currentUserId;
        }
        else
        {
            if (userText != '' && thief && thief.id)
            {
                successText = 'Ownership successfully transferred to ' +
                    thief.nameAndOrEmail();
                userId = thief.id;
            }
            else
            {
                var matches = userText.match(/(\w{4}-\w{4})$/);
                if (matches)
                {
                    userId = matches[1];
                    successText = 'Ownership successfully transferred.'
                }
                else
                {
                    $error.text('Please search for a user by name, email, or profile URL.');
                    return;
                }
            }
        }

        blist.dataset.changeOwner(userId,
            function success() {
                // Reload the page to re-render all the html fragments
                blist.util.railsFlash(successText);
                blist.dataset.redirectTo();
            },
            function error(xhr, text, error) {
                var msg = (xhr.status == 404) ?
                    'No such user found.' :
                    ('There was a problem changing ownership of this dataset. ' +
                        'Please try again later.')
                $error.text(msg);
            }
        );
    };

    $.gridSidebar.registerConfig(config);
})(jQuery);
