;(function() {

$.component.Component.extend('Map Layer', 'data', {
    _init: function()
    {
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row', 'datasetId']});
    },

    _displayFormat: function()
    {
        return $.extend(true, {}, this._properties.displayFormat,
            { context: { dataset: this._dataContext.dataset }});
    },

    isValid: function()
    {
        return true; // TODO
        //return $.isBlank(this._map) ? false : this._map.isValid();
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
            retVal.schema = retVal.schema.concat(blist.configs.map.dataLayer.config({view: this._dataContext.dataset}));
        }
        return retVal;
    },

    _getAssets: function()
    {
        return {
            javascripts: [
                'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3', false,
                { assets: 'shared-map' }
            ],
            stylesheets: ['https://serverapi.arcgisonline.com/jsapi/arcgis' +
                '/1.5/js/dojo/dijit/themes/tundra/tundra.css',
                {assets: 'render-images-bundle', hasImages: true},
                {assets: 'display-map'},
                {assets: 'rich-render-bundle'}]
        };
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [
                { assets: 'shared-map-configuration' }
            ]
        };
    },

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if (lcObj._rendered)
        { updateProperties(lcObj, properties); }
    }
});

var updateProperties = function(lcObj, properties)
{
    var setUpMap = function()
    {
        if (!$.isBlank(lcObj._map))
        {
            lcObj._map.updateDisplayFormat(df);
        }
    };

    if (!lcObj._updateDataSource(null, setUpMap))
    {
        if (!$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._map))
        {
            var newM = lcObj._map.reload(lcObj._stringSubstitute(lcObj._properties.displayFormat));
            if (!$.isBlank(newM)) { lcObj._map = newM; }
        }
        else
        { setUpMap(); }
    }
};

})(jQuery);
