;(function() {
$.component.Component.extend('Line chart', 'data', {
    isValid: function()
    {
        // Valid until loaded
        return $.isBlank(this._rtm) || !_.isFunction(this._rtm.$domForType('chart').socrataChart) ? true :
            this._rtm.$domForType('chart').socrataChart().isValid();
    },

    configurationSchema: function()
    {
        var retVal = {schema: [{
            fields: [{type: 'text', name: 'viewId', required: true, text: 'View ID', data: { '4x4uid': 'foo'}}]
        }],
        view: this._view};
        if ($.isBlank(this._view)) { return retVal; }
        retVal.schema = retVal.schema
            .concat(blist.configs.chart.configForType('line', {view: this._view}));
        return retVal;
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

        updateProperties(lcObj, lcObj._properties);
    },

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        updateProperties(lcObj, properties);
    }
});

var updateProperties = function(lcObj, properties)
{
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
            if (!$.isBlank(lcObj._rtm))
            { lcObj._rtm.$domForType('chart').socrataChart().setView(lcObj._view); }
            else
            {
                lcObj._rtm = lcObj.$contents.renderTypeManager({
                    handleResize: false,
                    defaultTypes: 'chart',
                    view: lcObj._view,
                    chart: {
                        chartType: 'line',
                        displayFormat: lcObj._properties.displayFormat
                    }
                });
            }
        });
    }
    else if (!$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._rtm))
    { lcObj._rtm.$domForType('chart').socrataChart().reload(lcObj._properties.displayFormat); }
};

})(jQuery);
