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
                template: 'editRedirect'
            }
        }]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
