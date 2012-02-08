(function($)
{
    $.Control.extend('pane_editRedirect', {
        getTitle: function()
        { return 'Edit'; },

        _getSections: function()
        {
            return [{
                customContent: {
                    callback: function($section)
                    {
                        $section.append(blist.datasetControls.editPublishedMessage());
                    }
                }
            }];
        }
    }, {name: 'edit'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.redirect)
    { $.gridSidebar.registerConfig('edit', 'pane_editRedirect'); }

})(jQuery);
