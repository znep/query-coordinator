$.component.Component.extend('Line chart', 'data', {
    _getAssets: function()
    {
        return { javascripts: [{ assets: 'data-rendering' }] };
    },

    _render: function()
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if ($.isBlank(lcObj._properties.viewId)) { return; }

        lcObj.startLoading();
        Dataset.createFromViewId(lcObj._properties.viewId, function(view)
        {
            lcObj.finishLoading();
            lcObj.$dom.renderTypeManager({
                handleResize: false,
                view: view,
                defaultTypes: 'chart',
                chart: {
                    chartType: 'line',
                    displayFormat: lcObj._properties.displayFormat
                }
            });
        });
    }
});
