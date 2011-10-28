(function($)
{
    $.Control.extend('pane_deleteDataset', {
        getTitle: function()
        { return 'Delete'; },

        getSubtitle: function()
        { return 'Delete this ' + this._view.displayName; },

        _getSections: function()
        {
            var message = '';
            if (this._view.type == 'blist')
            {
                if (this._view.isPublished())
                    message = 'Deleting this dataset will also delete any views associated with it.';
                else
                    message = 'You can delete this working copy and make a new one in order to ' +
                              'revert any changes you\'ve made.';
            }
            else if (this._view.viewType == 'tabular')
            {
                message = 'Deleting this view will only affect other views that are based upon it.';
            }

            return [{
                fields: [{
                    type: 'static',
                    value: message
                }]
            }];
        },
        
        _getFinishButtons: function()
        { return [{ text: "Delete this " + this._view.displayName, isDefault: true, value: true },
                  $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            cpObj._finishProcessing();
            prettyConfirm('This will delete the ' + cpObj._view.displayName + ' permanently. ' +
                'There is no undo! Are you sure you wish to proceed?',
                function() { cpObj._view.remove(function() { window.location.href = '/profile'; }); })
        }

    }, {name: 'deleteDataset'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.deleteDataset)
    { $.gridSidebar.registerConfig('manage.deleteDataset', 'pane_deleteDataset', 9); }

})(jQuery);
