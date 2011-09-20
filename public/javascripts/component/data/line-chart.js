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
        return {schema: [{
                fields: [{type: 'text', name: 'viewId', text: 'View ID', data: { '4x4uid': 'foo'}}]
            }].concat(blist.configs.chart.configForType('line', {view: this._view, isEdit: true})),
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
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);
        if ($.isBlank(lcObj._rtm)) { return; }

        if (!$.isBlank(properties.viewId) && ($.isBlank(lcObj._view) || lcObj._view.id != properties.viewId))
        {
            lcObj.startLoading();
            if (!$.isBlank(lcObj._propEditor))
            { lcObj._propEditor.setComponent(null); }
            Dataset.createFromViewId(lcObj._properties.viewId, function(view)
            {
                lcObj.finishLoading();
                lcObj._view = view;
                if (!$.isBlank(lcObj._propEditor))
                { lcObj._propEditor.setComponent(lcObj); }
                lcObj._rtm.$domForType('chart').socrataChart().setView(lcObj._view);
            });
        }
        else if (!$.isBlank(properties.displayFormat))
        { lcObj._rtm.$domForType('chart').socrataChart().reload(this._properties.displayFormat); }
    }
});
