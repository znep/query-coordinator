;(function() {

$.component.Component.extend('Map', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._vdefsToLoad = arguments[0].viewDefinitions;
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

        lcObj._addDefinitions(lcObj._vdefsToLoad);
    },

    add: function(viewdef)
    {
        if ($.isBlank(viewdef)) return;
        if ($.isArray(viewdef))
        {
            var result = _.map(viewdef.slice(), function(l) { return this.add(l); }, this);

            return result;
        }

        if (!(viewdef instanceof $.component.MapLayer))
        {
            viewdef = $.component.create(viewdef, this._componentSet);
            viewdef._map = this;
            this._viewDefinitions = this._viewDefinitions || [];
            this._viewDefinitions.push(viewdef);
        }

        return viewdef;
    },

    _addDefinitions: function()
    {
        if (!$.isBlank(this._vdefsToLoad))
        {
            this.add(this._vdefsToLoad);
            delete this._vdefsToLoad;
        }
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
        var df = lcObj._stringSubstitute(lcObj._properties.displayFormat)
        if (!lcObj._dataContext) // Do not manipulate DF in legacy cases.
        {
            df.viewDefinitions = df.viewDefinitions || [];
            _.each(lcObj._viewDefinitions || [], function(vd, index)
            { df.viewDefinitions.push(vd._displayFormat()); });
        }

        if (!$.isBlank(lcObj._map))
        { lcObj._map.updateDisplayFormat(df); }
        else
        {
            lcObj.$contents.empty();
            lcObj._map = lcObj.$contents.socrataMap({
                showRowLink: false,
                displayFormat: df,
                view: lcObj._dataContext.dataset
            });
            lcObj._updateValidity();
        }
    };

    var after = _.after((lcObj._viewDefinitions || []).length, function() {
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
    });
    _.each(lcObj._viewDefinitions || [], function(l) { l._updateDataSource(null, after); });
};

})(jQuery);
