/**
 * The application "edit bar".
 */

$.cf = {};

$(function() {

    $.cf.top = function()
    {
        var $editLink = $.tag({tagName: 'a', href: '#edit', 'class': 'cfEditSwitch', title: 'Edit Page'});
        var $body = $(document.body);
        $body.append($editLink);

        var loading = false;

        var initializeEditMode = function()
        {
            if ($.subKeyDefined($.cf, 'edit'))
            {
                $.cf.edit(true);
                return;
            }

            if (loading) { return; }
            loading = true;
            $('.socrata-page').loadingSpinner().showHide(true);
            // Need to load & set-up
            blist.util.assetLoading.loadAssets(
                {javascripts: [{assets: 'configurator'}, {assets: 'shared-editors'}],
                    stylesheets: [{sheet: '/webfonts/ss-standard.css', hasFonts: true},
                        {assets: 'colorpicker'}, {assets: 'base-control-third-party'},
                        {assets: 'base-control'}, {assets: 'configurator'}],
                    templates: ['grid_sidebar'], modals: ['configurator_settings']}, function()
            {
                $('.socrata-page').loadingSpinner().showHide(false);
                $.cf.initialize();
                loading = false;
            },
            function() { $(window).trigger('resize'); });
        };

        $editLink.click(function(e)
        {
            e.preventDefault();
            initializeEditMode();
        });

        if (blist.configuration.immediateEdit)
        { initializeEditMode(); }
    };

    if (!$.isBlank(blist.currentUser) && blist.currentUser.hasRight('edit_pages') &&
            blist.configuration.designerAvailable)
    {
        $(document.body).addClass('socrata-page');
        $.cf.top();
        _.defer(function() { $(document.body).addClass('configurable'); });
    }

});
