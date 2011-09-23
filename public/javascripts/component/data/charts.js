;(function() {

_.each(Dataset.chart.types, function(value, localChartType)
{
    $.component.Component.extend(value.text.toLowerCase().capitalize(), 'data', {
        _init: function()
        {
            this._super.apply(this, arguments);
            this._chartType = localChartType;
        },

        isValid: function()
        {
            return $.isBlank(this._chart) ? false : this._chart.isValid();
        },

        configurationSchema: function()
        {
            var retVal = {schema: [{
                fields: [{type: 'text', name: 'viewId', required: true, text: 'View ID',
                            data: { '4x4uid': 'req'}}]
            }],
            view: this._view};
            if ($.isBlank(this._view)) { return retVal; }
            retVal.schema = retVal.schema
                .concat(blist.configs.chart.configForType(this._chartType, {view: this._view}));
            return retVal;
        },

        _getAssets: function()
        {
            return {
                javascripts: [{ assets: 'shared-chart' }],
                stylesheets: ['/stylesheets/chart-screen.css', 'individual/rich-render-types.css']
            };
        },

        _render: function()
        {
            var lcObj = this;
            if (!_.isNumber(lcObj._properties.height))
            { lcObj._properties.height = 300; }
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
            if (!$.isBlank(lcObj._chart))
            { lcObj._chart.setView(lcObj._view); }
            else
            {
                lcObj._chart = lcObj.$contents.socrataChart({
                    chartType: lcObj._chartType,
                    displayFormat: lcObj._properties.displayFormat,
                    view: lcObj._view
                });
                lcObj._updateValidity();
            }
        });
    }
    else if (!$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._chart))
    { lcObj._chart.reload(lcObj._properties.displayFormat); }
};

})(jQuery);
