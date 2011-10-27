(function($)
{
    $.Control.extend('pane_appendReplace', {
        getTitle: function()
        { return 'Append and Replace'; },


        getSubtitle: function()
        { return 'Upload a new data file whose contents will be added to ' +
            'or replace your current data.'; },

        _getSections: function()
        {
            return [{
                customContent: {
                    template: 'appendReplace',
                    data: {},
                    directive: {}
                }
            }];
        }
    }, {name: 'appendReplace', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.appendReplace)
    { $.gridSidebar.registerConfig('edit.appendReplace', 'pane_appendReplace', 5); }

})(jQuery);
