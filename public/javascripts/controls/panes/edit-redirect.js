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
                        var cpObj = this;
                        cpObj._startProcessing();
                        blist.dataset.getUnpublishedDataset(function(workingCopy)
                        {
                            var hasWorkingCopy = !$.isBlank(workingCopy);
                            $section.append(blist.datasetControls.editPublishedMessage(hasWorkingCopy));
                            cpObj._finishProcessing();
                        });
                    }
                }
            }];
        }
    }, {name: 'edit'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.redirect)
    { $.gridSidebar.registerConfig('edit', 'pane_editRedirect'); }

})(jQuery);
