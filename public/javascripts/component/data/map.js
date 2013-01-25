;(function() {

$.component.Component.extend('Map', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row', 'datasetId']});
    },

    isValid: function()
    {
        return $.isBlank(this._map) ? false : this._map.isValid();
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
            retVal.schema = retVal.schema.concat(blist.configs.map.config({view: this._dataContext.dataset}));
        }
        return retVal;
    },

    _getAssets: function()
    {
        return {
            javascripts: [
                'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3', false,
                { assets: (blist.configuration.newMapsEnabled || $.urlParam(window.location.href, 'maps') == 'nextgen') ? 'shared-new-map' : 'shared-map' }
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

    _initDom: function()
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        lcObj.$contents.off('.map_' + lcObj.id);
        lcObj.$contents.on('display_row.map_' + lcObj.id, function(e, args)
        {
            lcObj.trigger('display_row',
                [{  dataContext: lcObj._dataContext,
                    row: (args || {}).row,
                    datasetId: (args || {}).datasetId }]);
        });
        lcObj.$contents.on('render_started.map_' + lcObj.id, function()
        { lcObj.startLoading(); });
        lcObj.$contents.on('render_finished.map_' + lcObj.id, function()
        { lcObj.finishLoading(); });
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

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if (lcObj._rendered)
        { updateProperties(lcObj, properties); }
    },

    _arrange: function()
    {
        this._super.apply(this, arguments);
        if (!$.isBlank(this.$contents))
        { this.$contents.trigger('resize'); }
    }
});

var updateProperties = function(lcObj, properties)
{
    var setUpMap = function()
    {
        if ($.isBlank(lcObj._dataContext)) { return; }
        if (!$.isBlank(lcObj._map))
        { lcObj._map.setView(lcObj._dataContext.dataset); }
        else
        {
            lcObj.$contents.empty();
            lcObj._map = lcObj.$contents.socrataMap({
                showRowLink: false,
                displayFormat: lcObj._stringSubstitute(lcObj._properties.displayFormat),
                view: lcObj._dataContext.dataset
            });
            lcObj._updateValidity();
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
