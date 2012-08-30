;(function() {

_.each($.extend({chart: {text: 'Chart'}}, Dataset.chart.types), function(value, localChartType)
{
    $.component.Component.extend(value.text.toLowerCase().capitalize(),
        _.include(['area chart', 'bar chart', 'donut chart', 'stacked column chart',
            'stacked bar chart'], value.text.toLowerCase()) ? 'none' : 'data', {
        _init: function()
        {
            this._needsOwnContext = true;
            this._delayUntilVisible = true;
            this._super.apply(this, arguments);
            this.registerEvent({display_row: ['dataContext', 'row']});
            this._chartType = this._stringSubstitute(this._properties.chartType) || localChartType;
        },

        isValid: function()
        {
            return $.isBlank(this._chart) ? false : this._chart.isValid();
        },

        configurationSchema: function()
        {
            var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
                view: (this._dataContext || {}).dataset};
// TODO: make this work better with properties substitution
//            if ($.isBlank(this._dataContext)) { return retVal; }
//            retVal.schema = retVal.schema
//                .concat(blist.configs.chart.configForType(this._chartType,
//                        {view: this._dataContext.dataset}));
            return retVal;
        },

        _initDom: function()
        {
            var lcObj = this;
            lcObj._super.apply(lcObj, arguments);

            lcObj.$contents.off('.chart_' + lcObj.id);
            lcObj.$contents.on('display_row.chart_' + lcObj.id, function(e, args)
            {
                lcObj.trigger('display_row',
                    [{dataContext: lcObj._dataContext, row: (args || {}).row}]);
            });
        },

        _getAssets: function()
        {
            return {
                javascripts: [{ assets: 'shared-chart' }],
                stylesheets: ['/stylesheets/chart-screen.css', {assets: 'rich-render-bundle'}, { assets: 'display-chart' }]
            };
        },

        _shown: function()
        {
            this._super();
            if (!$.isBlank(this.$contents))
            { this.$contents.trigger('show'); }
        },

        _hidden: function()
        {
            this._super();
            if (!$.isBlank(this.$contents))
            { this.$contents.trigger('hide'); }
        },

        _arrange: function()
        {
            this._super();
            if (!$.isBlank(this.$contents))
            { this.$contents.trigger('resize'); }
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

            this._chartType = this._stringSubstitute(this._properties.chartType) || this._chartType;
            if (lcObj._rendered)
            { updateProperties(lcObj, properties); }
        }
    });
});

var updateProperties = function(lcObj, properties)
{
    if (!lcObj._updateDataSource(properties, function()
    {
        if ($.isBlank(this._dataContext)) { return; }

        if (!$.isBlank(this._chart))
        { this._chart.setView(this._dataContext.dataset); }
        else
        {
            this._chartType = this._stringSubstitute(this._properties.chartType) || this._chartType;
            this.$contents.empty();
            this._chart = this.$contents.socrataChart({
                chartType: this._chartType,
                displayFormat:
                    lcObj._stringSubstitute(lcObj._properties.displayFormat),
                view: this._dataContext.dataset
            });
            this._updateValidity();
        }
    }) &&
            !$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._chart))
    {
        lcObj._chart.reload(lcObj._stringSubstitute(lcObj._properties.displayFormat));
    }
};

})(jQuery);
