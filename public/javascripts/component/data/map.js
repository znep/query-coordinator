;(function() {

$.component.Component.extend('Map', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        if ($.subKeyDefined(arguments[0], 'displayFormat.viewDefinitions'))
        {
            var contextId = arguments[0].contextId;
            arguments[0].viewDefinitions = _.map(arguments[0].displayFormat.viewDefinitions,
            function(vd)
            { // TODO: Rewrite this assuming _.map, which I wasn't before.
                if ($.isBlank(vd.displayFormat))
                {
                    vd = { displayFormat: vd };
                    vd.uid = vd.displayFormat.uid; vd.contextId = vd.displayFormat.contextId;
                }
                if ($.isBlank(vd.uid) && $.isBlank(vd.contextId) && !$.isBlank(contextId))
                { vd.contextId = contextId; }
                vd.type = 'MapLayer';

                return vd;
            });
            delete arguments[0].contextId;
            delete arguments[0].displayFormat.viewDefinitions;
        }
        this._vdefsToLoad = arguments[0].viewDefinitions || [];
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row', 'datasetId']});
    },

    updateDisplayFormat: function()
    {
        if (!$.isBlank(this._map))
        { this._map.updateDisplayFormat(this._displayFormat()); }
        this._updateValidity();
    },

    _displayFormat: function()
    {
        var lcObj = this,
            df = lcObj._stringSubstitute(lcObj._properties.displayFormat);
        if (!lcObj._dataContext) // Do not manipulate DF in legacy cases.
        {
            df.viewDefinitions = df.viewDefinitions || [];
            _.each(lcObj._viewDefinitions || [], function(vd, index)
            { df.viewDefinitions.push(vd._displayFormat()); });
        }

        return df;
    },

    isValid: function()
    {
        return !$.isBlank(this._viewDefinitions)
            || !$.isBlank(this._vdefsToLoad)
            || ($.isBlank(this._map) ? false : this._map.isValid());
    },

    configurationSchema: function()
    {
        if (this._super.apply(this, arguments) === false) { return false; }

        var retVal = {schema: [], view: (this._dataContext || {}).dataset};
        if (blist.configuration.canvasX || blist.configuration.govStat)
        {
            //if ($.isBlank(this._dataContext)) { return retVal; }
// TODO: make this work better with properties substitution
            retVal.schema = retVal.schema.concat(blist.configs.map.config({view: (this._dataContext || {}).dataset, canvas: true }));
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

        if (!lcObj.$overlay && lcObj._designing)
        {
            lcObj.$overlay = $.tag({ tagName: 'div', 'class': 'mapBoxOverlay' });
            lcObj.$dom.append(lcObj.$overlay);
            lcObj.$overlay.append($.tag({ tagName: 'div', 'class': 'mapOverlayTitle',
                contents: 'Layers in this Map:' }));
            lcObj.$contents.css('zIndex', 1);
        }

        lcObj.$contents.off('.map_' + lcObj.id);
        lcObj.$contents.on('display_row.map_' + lcObj.id, function(e, args)
        {
            var vd = _.detect(lcObj._viewDefinitions, function(layer)
                { return (layer._dataContext || {}).dataset == (args || {}).dataset });
            // TODO: This is ugly because my brain is half-functional. Can probably clean it up.
            // It's not wrong or slow in any special way so whatever.
            lcObj.trigger('display_row',
                [{  dataContext: vd ? vd._dataContext : null,
                    row: (args || {}).row,
                    datasetId: (args || {}).datasetId }]);
            if (!$.subKeyDefined(vd, '_dataContext')) { return; }
            vd.trigger('display_row',
                [{  dataContext: vd._dataContext,
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
        { viewdef = $.component.create(viewdef, this._componentSet); }
        viewdef.parent = this;

        this._viewDefinitions = this._viewDefinitions || [];

        if (!_.include(this._viewDefinitions, viewdef))
        { this._viewDefinitions.push(viewdef); }

        this._moveChildDom(viewdef);

        if (!$.isBlank(this._map) && $.isBlank(this._map.map))
        { this._map._librariesLoaded(); }

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
        _.each(lcObj._viewDefinitions || [], function(l) { lcObj._moveChildDom(l); });

        updateProperties(lcObj, lcObj._properties);
        return true;
    },

    _moveChildDom: function(child)
    {
        if (!child._initialized)
        {
            child._initDom();
            if (this._designing) { child.design(true); }
        }

        if (this.$overlay && child.$dom.parent().length == 0)
        { this.$overlay[0].appendChild(child.dom); }

        if (this._designing && this.$overlay && !child._rendered)
        { child._render(); }
    },

    _childRemoved: function(child)
    {
        var index = this._viewDefinitions.indexOf(child);
        this._viewDefinitions.splice(index, 1);

        this.updateDisplayFormat();
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

    _propRead: function()
    {
        var properties = this._super();
        var children = this._readChildren();
        if (children)
            properties.viewDefinitions = children;
        return properties;
    },

    _readChildren: function()
    {
        var children = [];
        _.each(this._viewDefinitions, function(child) { children.push(child.properties()); });
        return children;
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
    },

    design: function(designing)
    {
        var cObj = this;
        this._super.apply(this, arguments);
        _.each(this._viewDefinitions || [], function(child) { child.design(designing); });
        if (!$.isBlank(this.$dom) && this.canEdit('drop') &&
                !this.$dom.isControlClass('nativeDropTarget'))
        {
            if (designing)
            {
                this.$dom.nativeDropTarget({
                    contentEditable: false,
                    acceptCheck: function($item)
                    {
                        return $item.data('typename') == 'MapLayer' &&
                            ($item.hasClass('socrata-component') ||
                            $item.hasClass('componentCreate'));
                    },
                    dropCallback: function(dropId, dropType)
                    {
                        if (dropType == 'copy')
                        {
                            $.cf.edit.execute('add', {
                                container: cObj,
                                childTemplate: { type: 'MapLayer' }
                            });
                        }
                    }
                });
            }
        }
        else if (!$.isBlank(this.$dom) && this.$dom.isControlClass('nativeDropTarget'))
        {
            if (designing)
            { this.$dom.nativeDropTarget().enable(); }
            else
            { this.$dom.nativeDropTarget().disable(); }
        }
    }
});

var updateProperties = function(lcObj)
{
    var setUpMap = function()
    {
        var df = lcObj._displayFormat();

        if (!$.isBlank(lcObj._map))
        { lcObj._map.updateDisplayFormat(df); }
        else
        {
            lcObj.$contents.empty();
            lcObj._map = lcObj.$contents.socrataMap({
                showRowLink: false,
                displayFormat: df,
                view: (lcObj._dataContext || {}).dataset
            });
            lcObj._updateValidity();
        }
    };

    var after = _.after((lcObj._viewDefinitions || []).length, function() {
        if (!lcObj._updateDataSource(null, setUpMap)) { setUpMap(); }
    });
    _.each(lcObj._viewDefinitions || [], function(l) {
        if (!l._updateDataSource(null, after)) { after(); }
    });
};

})(jQuery);
