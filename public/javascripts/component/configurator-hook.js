/**
 * The application "edit bar".
 */

$.cf = {};

$(function() {

    $.cf.top = function() {
        var $top = $.tag({tagName: 'div', 'class': 'socrata-cf-top', contents:
            {tagName: 'div', 'class': 'not-edit-mode', contents:
                {tagName: 'a', href: '#edit', 'class': 'edit', contents: 'edit page'}}});
        var $body = $(document.body);
        $body.append($top);

        var initializeEditMode = function() {
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
        };

        $top.find('a.edit').click(function(e) {
            e.preventDefault();
            initializeEditMode();
        });
    };

    if (!$.isBlank(blist.currentUser) && blist.currentUser.hasRight('edit_pages') &&
            blist.currentUser.isAdmin())
    {
        $(document.body).addClass('socrata-page');
        $.cf.top();
        // Set timeout here so top menu animates in.  Delete if we decide that's undesirable
        _.defer(function() { $(document.body).addClass('configurable'); });
    }

});
