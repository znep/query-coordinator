$.component.Component.extend('Line chart', 'data', {
    isValid: function()
    {
        // Valid until loaded
        return $.isBlank(this._rtm) ? true :
            this._rtm.$domForType('chart').socrataChart().isValid();
    },

    configurationSchema: function()
    {
        if ($.isBlank(this._view)) { return null; }
        return {schema: blist.configs.chart.configForType('line', {view: this._view, isEdit: true}),
            view: this._view};
    },

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'data-rendering' }],
            stylesheets: ['/stylesheets/chart-screen.css', 'individual/rich-render-types.css']
        };
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
            lcObj._view = view;
            lcObj._rtm = lcObj.$contents.renderTypeManager({
                handleResize: false,
                view: view,
                defaultTypes: 'chart',
                chart: {
                    chartType: 'line',
                    displayFormat: lcObj._properties.displayFormat
                }
            });
        });
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!$.isBlank(properties.displayFormat) && !$.isBlank(this._rtm))
        {
            this._rtm.$domForType('chart').socrataChart().reload(this._properties.displayFormat);
        }
    }
});
