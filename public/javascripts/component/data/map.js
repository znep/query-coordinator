;(function() {

$.component.Component.extend('Map', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    isValid: function()
    {
        return $.isBlank(this._map) ? false : this._map.isValid();
    },

    configurationSchema: function()
    {
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
            view: (this._dataContext || {}).view};
        if ($.isBlank(this._dataContext)) { return retVal; }
        retVal.schema = retVal.schema.concat(blist.configs.map.config({view: this._dataContext.view}));
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
                'individual/screen-map.css',
                'individual/rich-render-types.css']
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

var updateProperties = function(lcObj, properties)
{
    if (!lcObj._updateDataSource(properties, function()
        {
            if (!$.isBlank(this._map))
            { this._map.setView(this._dataContext.view); }
            else
            {
                this._map = this.$contents.socrataMap({
                    showRowLink: false,
                    displayFormat: this._properties.displayFormat,
                    view: this._dataContext.view
                });
                this._updateValidity();
            }
        }) &&
            !$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._map))
    { lcObj._map.reload(lcObj._properties.displayFormat); }
};

})(jQuery);
