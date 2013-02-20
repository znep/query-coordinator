;(function() {

$.component.Component.extend('Map Layer', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row', 'datasetId']});
    },

    _displayFormat: function()
    {
        return $.extend(true, {}, this._properties.displayFormat,
            { context: { dataset: (this._dataContext || {}).dataset }, component: this });
    },

    setDataObj: function(dataObj)
    {
        this._dataObj = dataObj;
    },

    isValid: function()
    {
        //return $.isBlank(this._dataObj) ? false : this._dataObj.isValid();
        var valid = $.isBlank(this._dataContext) ? false :
            ($.subKeyDefined(this._properties, 'displayFormat.plot.locationId')
             && $.subKeyDefined(this._properties, 'displayFormat.plotStyle'));
        if ($.deepGet(this._properties, 'displayFormat', 'plotStyle') == 'heatmap')
        { valid = valid && $.subKeyDefined(this._properties, 'displayFormat.heatmap.type'); }
        return valid;
    },

    configurationSchema: function()
    {
        if (this._super.apply(this, arguments) === false) { return false; }

        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
            view: (this._dataContext || {}).dataset};
        if (blist.configuration.canvasX || blist.configuration.govStat)
        {
            if ($.isBlank(this._dataContext)) { return retVal; }
// TODO: make this work better with properties substitution
            retVal.schema = retVal.schema
                .concat({ title: 'Basic Configuration',
                    fields: blist.configs.map.dataLayer.socrataBase({view: this._dataContext.dataset})})
                .concat({ title: 'Advanced Configuration',
                    fields: blist.configs.map.dataLayer.socrata({view: this._dataContext.dataset})});
        }
        return retVal;
    },

    // No dragging; no repositioning. For now.
    dragFocus: function()
    {
        if (this.$dom.isControlClass('nativeDraggable'))
        { this.$dom.nativeDraggable().disable(); }
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [
                { assets: 'shared-map-configuration' }
            ]
        };
    },

    _render: function()
    {
        if (!this._super()) { return false; }

        updateProperties(this);

        return true;
    },

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if (lcObj._rendered)
        { updateProperties(lcObj); }
    }
});

var updateProperties = function(lcObj)
{
    var updateMap = function()
    {
        var text;
        if (!$.subKeyDefined(lcObj._dataContext, 'dataset'))
        { text = 'No dataset selected'; }
        //else if (lcObj._dataObj)
        //{ text = lcObj._dataObj.describe(); }
        else if (!$.subKeyDefined(lcObj._properties, 'displayFormat.plotStyle'))
        {
            var ds = lcObj._dataContext.dataset;

            text = 'Layer for dataset ' + (ds.name || ds.id) + '. No plot style selected';
        }
        else
        {
            var ds = lcObj._dataContext.dataset,
                df = lcObj._properties.displayFormat,
                info = [];

            if (df.plotStyle == 'point')
            { info.push('Point map for dataset '); }
            else if (df.plotStyle == 'heatmap')
            { info.push('Boundary map for dataset '); }
            else if (df.plotStyle == 'rastermap')
            { info.push('Heat map for dataset '); }
            info.push('<b>' + ds.name || ds.id + '</b>');

            text = info.join('');
        }
        lcObj.$contents.html(text);

        if (lcObj.isValid())
        { lcObj.parent.updateDisplayFormat(); }
    };
    if (!lcObj._updateDataSource(null, updateMap)) { updateMap(); }
};

})(jQuery);
