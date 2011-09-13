(function($)
 {
    $.Control.extend('pane_plagiarism', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            var $friendSelect = cpObj.$dom().find('.friendSelect');
            $friendSelect.userPicker({
                attachTo: $('#templates'),
                chooseCallback: function(user) { cpObj._thief = user; },
                filterCallback: function(user)
                { return user.id !== cpObj.settings.view.owner.id; },
                valueFunction: function(user) { return user.email; },
                limit: 25
            });
        },

        getTitle: function()
        { return 'Ownership'; },

        getSubtitle: function()
        { return 'To transfer to another user, enter the email address or account name ' +
                  'of the Socrata ID, then select the desired account from the dropdown ' +
                  'list. You may also enter the user\'s profile URL if you know it. ' +
                  'Only users with existing accounts may take ownership of datasets.';
        },

        isAvailable: function()
        {
            return this.settings.view.valid &&
                (!this.settings.view.temporary || this.settings.view.minorChange);
        },

        getDisabledSubtitle: function()
        { return 'This view must be valid and saved'; },

        _getSections: function()
        {
            var userInput = {name: 'user', type: 'text', extraClass: 'friendSelect'};
            var fieldConfig = {};

            if (this.settings.view.owner.id != blist.currentUserId)
            {
                fieldConfig = {type: 'group', options: [
                    {type: 'radioGroup', name: 'datasetThief', defaultValue: 'currentUser', options:
                        [{name: 'user', value: 'Me', type: 'static', isInput: true}, userInput]}
                ]};
            }
            else
            { fieldConfig = userInput; }

            return [ {
                title: 'Transfer ownership to',
                fields: [ fieldConfig ]
            } ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            cpObj._finishProcessing();
            var formValue = cpObj._getFormValues();
            var userText = formValue.user;
            var $error = cpObj.$dom().find('.mainError');
            $error.text('');

            if (!userText)
            {
                $error.text('Please select a user.')
                return;
            }

            var userId, successText;
            if (userText == 'Me')
            {
                successText = 'You are now the owner of this ' + cpObj.settings.view.displayName;
                userId = blist.currentUserId;
            }
            else
            {
                if (userText != '' && $.subKeyDefined(cpObj, '_thief.id'))
                {
                    successText = 'Ownership successfully transferred to ' + cpObj._thief.nameAndOrEmail();
                    userId = cpObj._thief.id;
                }
                else
                {
                    var matches = userText.match(/(\w{4}-\w{4})$/);
                    if (matches)
                    {
                        userId = matches[1];
                        successText = 'Ownership successfully transferred'
                    }
                    else
                    {
                        $error.text('User not recognized. Please try searching ' +
                                    'for a user by name, email, or profile URL.');
                        return;
                    }
                }
            }

            cpObj.settings.view.changeOwner(userId, function success()
            {
                // Reload the page to re-render all the html fragments
                blist.util.railsFlash(successText);
                cpObj.settings.view.dataset.redirectTo();
            },
            function error(xhr, text, error)
            {
                var msg = (xhr.status == 404) ?  'No such user found.' :
                    ('There was a problem changing ownership of this ' +
                        cpObj.settings.view.displayName + '. Please try again later.')
                $error.text(msg);
            });
        }

    }, {name: 'plagiarism', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.plagiarize)
    { $.gridSidebar.registerConfig('manage.plagiarism', 'pane_plagiarism', 10); }

})(jQuery);
