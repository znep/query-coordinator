;(function() {

_.each(Dataset.chart.types, function(value, localChartType)
{
    $.component.Component.extend(value.text.toLowerCase().capitalize(), 'data', {
        _init: function()
        {
            this._needsOwnContext = true;
            this._super.apply(this, arguments);
            this._chartType = localChartType;
        },

        isValid: function()
        {
            return $.isBlank(this._chart) ? false : this._chart.isValid();
        },

        configurationSchema: function()
        {
            var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
                view: (this._dataContext || {}).view};
            if ($.isBlank(this._dataContext)) { return retVal; }
            retVal.schema = retVal.schema
                .concat(blist.configs.chart.configForType(this._chartType, {view: this._dataContext.view}));
            return retVal;
        },

        _getAssets: function()
        {
            return {
                javascripts: [{ assets: 'shared-chart' }],
                stylesheets: ['/stylesheets/chart-screen.css', {assets: 'rich-render-bundle'}]
            };
        },

        _render: function()
        {
            var lcObj = this;
            if (!_.isNumber(lcObj._properties.height))
            { lcObj._properties.height = 300; }
            if (!lcObj._super.apply(lcObj, arguments)) { return false; }

            updateProperties(lcObj, lcObj._properties);
            return true;
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
    if (!lcObj._updateDataSource(properties, function()
                {
                    if (!$.isBlank(this._chart))
                    { this._chart.setView(this._dataContext.view); }
                    else
                    {
                        this._chart = this.$contents.socrataChart({
                            chartType: this._chartType,
                            displayFormat: this._properties.displayFormat,
                            view: this._dataContext.view
                        });
                        this._updateValidity();
                    }
                }) &&
            !$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._chart))
    { lcObj._chart.reload(lcObj._properties.displayFormat); }
};

})(jQuery);
