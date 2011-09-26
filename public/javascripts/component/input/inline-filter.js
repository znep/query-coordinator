$.component.Component.extend('Inline filter', 'input', {
    _getAssets: function()
    {
        return {
            javascripts: [{assets: 'base-control'}, {assets: 'shared-editors'}, {assets: 'unified-filter'}],
            stylesheets: [{assets: 'base-control'}],
            templates: ['grid_sidebar', 'unified_filter']};
    },

    _render: function()
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if ($.isBlank(lcObj._properties.viewId)) { return; }

        lcObj.startLoading();
        $.dataContext.getContext(lcObj._properties.viewId, function(view)
        {
            lcObj.finishLoading();
            lcObj.$contents.pane_unifiedFilter({
                view: view
            }).render();
        });
    }
});
