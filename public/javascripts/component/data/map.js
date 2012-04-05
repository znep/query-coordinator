;(function() {

$.component.Component.extend('Map', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row']});
    },

    isValid: function()
    {
        return $.isBlank(this._map) ? false : this._map.isValid();
    },

    configurationSchema: function()
    {
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }],
            view: (this._dataContext || {}).dataset};
        if ($.isBlank(this._dataContext)) { return retVal; }
        retVal.schema = retVal.schema.concat(blist.configs.map.config({view: this._dataContext.dataset}));
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

    _render: function()
    {
        var lcObj = this;
        if (!_.isNumber(lcObj._properties.height))
        { lcObj._properties.height = 300; }
        if (!lcObj._super.apply(lcObj, arguments)) { return false; }

        lcObj.$contents.bind('display_row', function(e, args)
        {
            lcObj.trigger('display_row',
                [{dataContext: lcObj._dataContext, row: (args || {}).row}]);
        });
        updateProperties(lcObj, lcObj._properties);
        return true;
    },

    _shown: function()
    {
        this._super();
        this.$contents.trigger('show');
    },

    _hidden: function()
    {
        this._super();
        this.$contents.trigger('hide');
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
    if (!lcObj._updateDataSource(properties, function()
        {
            if (!$.isBlank(this._map))
            { this._map.setView(this._dataContext.dataset); }
            else
            {
                this.$contents.empty();
                this._map = this.$contents.socrataMap({
                    showRowLink: false,
                    displayFormat: this._stringSubstitute(this._properties.displayFormat),
                    view: this._dataContext.dataset
                });
                this._updateValidity();
            }
        }) &&
            !$.isBlank(properties.displayFormat) && !$.isBlank(lcObj._map))
    { lcObj._map.reload(lcObj._stringSubstitute(lcObj._properties.displayFormat)); }
};

})(jQuery);
