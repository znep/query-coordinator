;(function() {

_.each($.extend({chart: {value: 'Chart'}}, Dataset.chart.types), function(value, localChartType)
{
    var typeName = value.value.toLowerCase().displayable();
    switch(value.value)
    {
        case 'timeline':                                         break;
        case 'treemap':       typeName = 'Tree Map';             break;
        case 'Chart':         typeName = 'Chart';                break;
        case 'stackedcolumn': typeName = 'Stacked Column Chart'; break;
        case 'stackedbar':    typeName = 'Stacked Bar Chart';    break;
        default:              typeName += ' Chart';              break;
    }

    $.component.Component.extend(typeName,
        _.include(['area', 'bar', 'donut', 'stackedcolumn', 'stackedbar'],
            value.value.toLowerCase()) ? 'none' : 'data', {

        catalogName: (value.text || 'Chart').toLowerCase().displayable(),

        _init: function()
        {
            this._needsOwnContext = true;
            this._delayUntilVisible = true;
            this._noTransactionForUndo = true;
            this._super.apply(this, arguments);
            this.registerEvent({display_row: ['dataContext', 'row']});
            this._chartType = this._stringSubstitute(this._properties.chartType) ||
                // 'chart' is not a valid type
                (localChartType == 'chart' ? null : localChartType);
        },

        isValid: function()
        {
            return $.isBlank(this._chart) ? false : this._chart.isValid();
        },

        configurationSchema: function()
        {
            var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
                view: (this._dataContext || {}).dataset};
            if (blist.configuration.canvasX || blist.configuration.govStat)
            {
                if ($.isBlank(this._dataContext)) { return retVal; }
// TODO: make this work better with properties substitution
                retVal.schema = retVal.schema
                    .concat(blist.configs.chart.configForType(this._chartType,
                                {view: this._dataContext.dataset}));
            }
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
            lcObj.$contents.on('render_started.chart_' + lcObj.id, function()
            { lcObj.startLoading(); });
            lcObj.$contents.on('render_finished.chart_' + lcObj.id, function()
            { lcObj.finishLoading(); });
        },

        _getAssets: function()
        {
            return {
                javascripts: [{ assets: 'shared-chart' }],
                stylesheets: ['/stylesheets/chart-screen.css', {assets: 'rich-render-bundle'}, { assets: 'display-chart' }],
                translations: ['controls.charts']
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
        },

        design: function()
        {
            this._super.apply(this, arguments);
            if ($.isBlank(this.$editOverlay))
            {
                this.$editOverlay = $.tag({ tagName: 'div', 'class': 'editOverlay' });
                this.$dom.append(this.$editOverlay);
            }
            this.$editOverlay.toggleClass('hide', !this._designing);
        }
    });
});

var updateProperties = function(lcObj, properties)
{
    var setUpChart = function()
    {
        if ($.isBlank(lcObj._dataContext)) { return; }

        if (!$.isBlank(lcObj._chart))
        {
            var newC = lcObj._chart.setView(lcObj._dataContext.dataset);
            if (!$.isBlank(newC)) { lcObj._chart = newC; }
        }
        else
        {
            lcObj._chartType = lcObj._stringSubstitute(lcObj._properties.chartType) || lcObj._chartType;
            lcObj.$contents.empty();
            lcObj._chart = lcObj.$contents.socrataChart({
                chartType: lcObj._chartType,
                displayFormat:
                    lcObj._stringSubstitute(lcObj._properties.displayFormat),
                view: lcObj._dataContext.dataset
            });
            lcObj._updateValidity();
        }
    };

    if (!lcObj._updateDataSource(properties, setUpChart))
    {
        if (!$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._chart))
        {
            var newC = lcObj._chart.reload(lcObj._stringSubstitute(lcObj._properties.displayFormat));
            if (!$.isBlank(newC)) { lcObj._chart = newC; }
        }
        else
        { setUpChart(); }
    }
};

})(jQuery);
