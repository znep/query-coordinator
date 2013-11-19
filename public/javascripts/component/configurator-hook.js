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
            var stylesheets = [ {assets: 'colorpicker'}, {assets: 'base-control-third-party'},
                        {assets: 'base-control'}, {assets: 'configurator'} ];
            var translations = ['dataslate.configurator', 'dataslate.context_picker',
                                'dataslate.component', 'dataslate.edit', 'dataslate.edit_component',
                                'dataslate.edit_properties', 'dataslate.permissions',
                                'dataslate.settings', 'controls.common.sidebar.tabs'];
            if (!blist.configuration.govStat)
            { stylesheets.unshift( {sheet: '/webfonts/ss-standard.css', hasFonts: true} ); }
            else
            { translations.push('govstat.reports.component'); }
            blist.util.assetLoading.loadAssets(
                {javascripts: [{assets: 'configurator'}, {assets: 'shared-editors'}],
                    stylesheets: stylesheets,
                    translations: translations,
                    templates: ['grid_sidebar'],
                    newModals: ['configurator_permissions', 'configurator_settings'],
                    modals: ['select_dataset?federate=true']},
            function()
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

    blist.configuration.onCurrentUser(function(user)
    {
        if (!$.isBlank(user) && (user.hasRight('edit_pages') || user.id == blist.configuration.page.owner ||
                user.id == (blist.configuration.page.owner || {}).id) &&
            blist.configuration.designerAvailable)
        {
            $(document.body).addClass('socrata-page');
            $.cf.top();
            _.defer(function() { $(document.body).addClass('configurable'); });
        }
    });

});
