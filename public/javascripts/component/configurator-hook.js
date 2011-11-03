/**
 * The application "edit bar".
 */
(function($) {
    $.cf = {};

    $.cf.top = function() {
        var $top = $.tag({tagName: 'div', 'class': 'socrata-cf-top', contents:
            {tagName: 'div', 'class': 'not-edit-mode', contents:
                {tagName: 'a', href: '#edit', 'class': 'edit', contents: 'edit page'}}});
        $(document.body).append($top);
        $top.find('a.edit').click(function(e)
            {
                e.preventDefault();
                if ($.subKeyDefined($.cf, 'edit'))
                {
                    $.cf.edit(true);
                    return;
                }

                $('.socrata-page').loadingSpinner({showInitially: true, overlay: true});
                // Need to load & set-up
                blist.util.assetLoading.loadAssets(
                    {javascripts: [{assets: 'configurator'}, {assets: 'shared-editors'}],
                        stylesheets: [{assets: 'colorpicker'}, {assets: 'base-control-third-party'},
                            {assets: 'base-control'}, {assets: 'configurator'}],
                        templates: ['grid_sidebar']}, function()
                {
                    $('.socrata-page').loadingSpinner().showHide(false);
                    $.cf.initialize($top);
                });
            });
    };

    // TODO: Not the most robust perms check...
    if (!$.isBlank(blist.currentUser) && blist.currentUser.hasRight('edit_others_datasets') &&
            blist.currentUser.hasRight('edit_site_theme'))
    {
        $(document.body).addClass('socrata-page');
        $.cf.top();
        // Set timeout here so top menu animates in.  Delete if we decide that's undesirable
        setTimeout(function() { $(document.body).addClass('configurable'); }, 1);
    }

})(jQuery);
