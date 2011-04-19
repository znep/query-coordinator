(function($)
{
    if (blist.sidebarHidden.edit &&
        blist.sidebarHidden.edit.redirect) { return; }

    var configName = 'edit';
    var config =
    {
        name: configName,
        priority: 1,
        title: 'Edit',
        sections: [{
            customContent: {
                template: 'editRedirect',
                callback: function($section)
                {
                    $section.find('.editPublished').click(function(e)
                    {
                        e.preventDefault();
                        blist.dataset.getUnpublishedDataset(function(unpub)
                        {
                            if (!$.isBlank(unpub)) { unpub.redirectTo(); }
                            else
                            {
                                blist.dataset.makeUnpublishedCopy(function(copyView)
                                { copyView.redirectTo(); });
                            }
                        });
                    });
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
