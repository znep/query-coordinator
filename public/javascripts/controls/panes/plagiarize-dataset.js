(function($)
 {
    $.Control.extend('pane_plagiarism', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
        },

        render: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            if (this._pickerHooked) { return; }
            var $friendSelect = cpObj.$dom().find('.friendSelect');
            $friendSelect.userPicker({
                attachTo: $('#templates'),
                chooseCallback: function(user) { cpObj._thief = user; },
                filterCallback: function(user)
                { return user.id !== cpObj._view.owner.id; },
                valueFunction: function(user) { return user.email; },
                limit: 25
            });
            this._pickerHooked = true;
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.ownership.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.ownership.subtitle'); },

        isAvailable: function()
        {
            return this._view.valid &&
                (!this._view.temporary || this._view.minorChange);
        },

        getDisabledSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.ownership.validation.valid_saved'); },

        _getSections: function()
        {
            var userInput = {name: 'user', type: 'text', extraClass: 'friendSelect'};
            var fieldConfig = {};

            if (this._view.owner.id != blist.currentUserId)
            {
                fieldConfig = {type: 'group', options: [
                    {type: 'radioGroup', name: 'datasetThief', defaultValue: 'currentUser', options:
                        [{name: 'user', value: $.t('screens.ds.grid_sidebar.ownership.me'), type: 'static', isInput: true}, userInput]}
                ]};
            }
            else
            { fieldConfig = userInput; }

            return [ {
                title: $.t('screens.ds.grid_sidebar.ownership.transfer_to'),
                fields: [ fieldConfig ]
            } ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
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
                $error.text($.t('screens.ds.grid_sidebar.ownership.validation.no_user'))
                return;
            }

            var userId, successText;
            // i claim no responsibility if this breaks.. :)
            if (userText == $.t('screens.ds.grid_sidebar.ownership.me'))
            {
                successText = $.t('screens.ds.grid_sidebar.ownership.success.me');
                userId = blist.currentUserId;
            }
            else
            {
                if (userText != '' && $.subKeyDefined(cpObj, '_thief.id'))
                {
                    successText = $.t('screens.ds.grid_sidebar.ownership.success.user', { owner: cpObj._thief.nameAndOrEmail() });
                    userId = cpObj._thief.id;
                }
                else
                {
                    var matches = userText.match(/(\w{4}-\w{4})$/);
                    if (matches)
                    {
                        userId = matches[1];
                        successText = $.t('screens.ds.grid_sidebar.ownership.success.other');
                    }
                    else
                    {
                        $error.text($.t('screens.ds.grid_sidebar.ownership.validation.invalid_user'));
                        return;
                    }
                }
            }

            cpObj._view.changeOwner(userId, function success()
            {
                // Reload the page to re-render all the html fragments
                blist.util.railsFlash(successText);
                if (_.isFunction(finalCallback)) { finalCallback(); }
                cpObj._view.redirectTo();
            },
            function error(xhr, text, error)
            {
                var msg = (xhr.status == 404) ? $.t('screens.ds.grid_sidebar.ownership.validation.invalid_user') : $.t('screens.ds.grid_sidebar.ownership.error');
                $error.text(msg);
            });
        }

    }, {name: 'plagiarism', noReset: true}, 'controlPane');

    if (blist.sidebarHidden && ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.plagiarize))
    { $.gridSidebar.registerConfig('manage.plagiarism', 'pane_plagiarism', 10); }

})(jQuery);
