(function(){

Dataset.map = {};

Dataset.map.isValid = function(view, displayFormat)
{
    if ($.isBlank(displayFormat)) { return false; }
    if (displayFormat.viewDefinitions) { return true; }
    if ($.isBlank(view)) { return false; }

    if (view.isArcGISDataset()) { return true; }
    if (view.isGeoDataset()) { return true; }
    if ($.isBlank(displayFormat.noLocations) &&
        ($.isBlank(displayFormat.plot) ||
         ($.isBlank(displayFormat.plot.latitudeId) ||
          $.isBlank(displayFormat.plot.longitudeId)) &&
         $.isBlank(displayFormat.plot.locationId)) ||
        $.isBlank(displayFormat.type) || $.isBlank(displayFormat.plotStyle))
    { return false; }

    var latCol = view.columnForIdentifier(displayFormat.plot.latitudeId);
    var longCol = view.columnForIdentifier(displayFormat.plot.longitudeId);
    var locCol = view.columnForIdentifier(displayFormat.plot.locationId);

    return !$.isBlank(locCol) || (!$.isBlank(latCol) && !$.isBlank(longCol)) ||
        displayFormat.noLocations;
};

Dataset.map.convertToVersion2 = function(view, df)
{
    if (!view) { return; }
    if (!df) { df = view.displayFormat; }

    if ($.isBlank(df.viewDefinitions))
    {
        df.viewDefinitions = [$.extend(true, {}, df)];
        df.viewDefinitions[0].uid = 'self';
    }

    if (df.compositeMembers)
    {
        _.each(df.compositeMembers, function(uid)
        { df.viewDefinitions.push({ uid: uid, plotStyle: 'point', legacy: true }); });
    }

    var notABoundaryMap = df.plotStyle != 'heatmap';
    if (df.type == 'google' && notABoundaryMap)
    {
        df.exclusiveLayers = true;
        df.bkgdLayers = Dataset.map.backgroundLayerSet.Google;
    }
    else if (df.type == 'bing' && notABoundaryMap)
    {
        df.exclusiveLayers = true;
        df.bkgdLayers = Dataset.map.backgroundLayerSet.Bing;
    }
    else if ((df.plotStyle == 'heatmap' && df.forceBasemap) || notABoundaryMap)
    {
        df.bkgdLayers = _.map(df.layers, function(layer) {
            if (layer.custom_url)
            { return { custom_url: layer.custom_url }; }
            else
            { return { layerKey: (_.detect(Dataset.map.backgroundLayers, function(lConfig)
                { return layer.url.indexOf((lConfig.options || {}).url) > -1; }) || {}).key }; }
        });
    }

    if (view.isArcGISDataset())
    {
        if (!df.layers)
        { df.bkgdLayers = [{ layerKey: 'World Street Map (ESRI)', opacity: 1.0 }]; }

        delete df.viewDefinitions[0].plotStyle;
        for (var key in df.viewDefinitions[0].plot)
        {
            if (!_.include(['titleId', 'descriptionColumns'], key))
            { delete df.viewDefinitions[0].plot[key]; }
        }
    }

    if (view.isGeoDataset())
    {
        df.exclusiveLayers = true;
        df.bkgdLayers = [{ layerKey: 'Google Roadmap', alias: $.t('core.map_layers.google_roadmap_alias'), opacity: 1.0 },
                         { layerKey: 'Bing Road', alias: $.t('core.map_layers.bing_roadmap_alias'), opacity: 1.0 },
                         { layerKey: 'World Street Map (ESRI)', alias: 'ESRI', opacity: 1.0 }];
        delete df.viewDefinitions[0].plotStyle;
        delete df.viewDefinitions[0].plot;
    }

    df.distinctLegend = true;

    view.update({ displayFormat: df });
};

Dataset.map.backgroundLayers = [
    { key: 'Google Roadmap', alias: $.t('core.map_layers.roadmap'), className: 'Google', options: { type: 'ROADMAP' }},
    { key: 'Google Satellite', alias: $.t('core.map_layers.satellite'), className: 'Google',
        zoomLevels: 20, options: { type: 'SATELLITE' }},
    { key: 'Google Terrain', alias: $.t('core.map_layers.terrain'), className: 'Google',
        zoomLevels: 16, options: { type: 'TERRAIN' }},
    { key: 'World Street Map (ESRI)', alias: $.t('core.map_layers.esri_world_street_map_alias'), className: 'ESRI',
        zoomLevels: 20, options: { url: 'World_Street_Map' }},
    { key: 'Satellite Imagery (ESRI)', alias: $.t('core.map_layers.satellite'), className: 'ESRI',
        zoomLevels: 20, options: { url: 'World_Imagery' }},
    { key: 'Detailed USA Topographic Map (ESRI)', alias: $.t('core.map_layers.esri_us_topo_alias'), className: 'ESRI',
        zoomLevels: 16, options: { url: 'USA_Topo_Maps' }},
    { key: 'Annotated World Topographic Map (ESRI)', alias: $.t('core.map_layers.esri_world_topo_alias'),
        zoomLevels: 17, className: 'ESRI', options: { url: 'World_Topo_Map' }},
    { key: 'Natural Earth Map (ESRI)', alias: $.t('core.map_layers.esri_natural_earth_alias'), className: 'ESRI',
        zoomLevels: 9, options: { url: 'World_Physical_Map' }}
];
Dataset.map.backgroundLayer = {custom: { name: 'custom', className: 'ESRI' }};

Dataset.map.backgroundLayerSet = {};
Dataset.map.backgroundLayerSet.Google = [
    { layerKey: 'Google Roadmap', alias: $.t('core.map_layers.roadmap'), opacity: 1},
    { layerKey: 'Google Satellite', alias: $.t('core.map_layers.satellite'), opacity: 1},
    { layerKey: 'Google Terrain', alias: $.t('core.map_layers.terrain'), opacity: 1}
];

Dataset.map.backgroundLayerSet.Bing = [
    { layerKey: 'Bing Road', alias: $.t('core.map_layers.roadmap'), opacity: 1},
    { layerKey: 'Bing Aerial', alias: $.t('core.map_layers.aerial'), opacity: 1}
];

// Deprecation Support: Bing maps are now rendered as Google Maps.
Dataset.map.backgroundLayerDeprecationMap = {
  'Bing Road': 'Google Roadmap',
  'Bing Aerial': 'Google Satellite'
};

Dataset.modules['map'] =
{
    supportsSnapshotting: function()
    {
        return _.include(['bing', 'google', 'esri'], this.displayFormat.type);
    },

    _checkValidity: function()
    {
        if (!this._super()) { return false; }
        return Dataset.map.isValid(this, this.displayFormat);
    },

    // Old Maps didn't have an explicit 'self' reference. This function fixes
    // up this view to have correct self-references.
    _convertLegacy: function()
    {
        var view = this;
        if (view._convertedLegacy) { return; }
        view._convertedLegacy = true;

        // Legacy Support: Replace Bing keys with Google equivalents.
        if ($.subKeyDefined(view, 'displayFormat.bkgdLayers')) {
          view.displayFormat.bkgdLayers.forEach(function (layer) {
            if (Dataset.map.backgroundLayerDeprecationMap[layer.layerKey]) {
              layer.layerKey = Dataset.map.backgroundLayerDeprecationMap[layer.layerKey];
            }
          });
        }

        if ($.subKeyDefined(view, 'displayFormat.viewDefinitions'))
        {
            var fixIds = function(checkView)
            {
                var fixFilter = function(fc)
                {
                    if ($.isBlank(fc)) { return; }
                    if (fc.type == 'column' && !$.isBlank(fc.columnId))
                    {
                        var checkCol = checkView.columnForID(fc.columnId);
                        if (!$.isBlank(checkCol))
                        {
                            var curCol = view.columnForTCID(checkCol.tableColumnId);
                            if (!$.isBlank(curCol))
                            { fc.columnId = curCol.id; }
                        }
                    }
                    else if (!_.isEmpty(fc.children))
                    { _.each(fc.children, function (fcc) { fixFilter(fcc); }); }
                };

                if (checkView.isArcGISDataset() || checkView.isGeoDataset())
                { return false; }

                var checkId = checkView.id;
                // We've got some bad data; let's fix it
                var df = $.extend(true, {}, view.displayFormat);
                var md = $.extend(true, {}, view.metadata);
                var updateItems = { displayFormat: df, metadata: md };

                var vdResult = _.any(df.viewDefinitions, function(vd)
                {
                    if (vd.uid == checkId)
                    {
                        vd.uid = 'self';
                        return true;
                    }
                    return false;
                });

                // renderTypeConfig.active
                if ($.subKeyDefined(md, 'renderTypeConfig.active'))
                {
                    _.each(md.renderTypeConfig.active, function(rt, k)
                        { if (rt.id == checkId) { rt.id = 'self'; } });
                }
                // conditional formatting
                if ($.subKeyDefined(md, 'conditionalFormatting.' + checkId))
                {
                    md.conditionalFormatting.self = md.conditionalFormatting[checkId];
                    delete md.conditionalFormatting[checkId];
                }
                // metadata.query
                if ($.subKeyDefined(md, 'query.' + checkId))
                {
                    // Well, if the view already has a query, then it should take precedence
                    if (checkId != view.id && _.isEmpty(view.query.filterCondition))
                    {
                        // Oh boy, copy over and translate
                        var q = md.query[checkId];
                        fixFilter(q.filterCondition);
                        updateItems.query = q;
                    }
                    delete md.query[checkId];
                }

                view.update(updateItems);

                return vdResult;
            };

            // Fix the IDs if none have a self-reference (indicating an old
            // format). If none were fixed, try fixing the parent view.
            if (!_.any(view.displayFormat.viewDefinitions, function(vd)
                        { return vd.uid == 'self'; }) && !fixIds(view))
            {
                view.getParentView(function(parView)
                {
                    if (!fixIds(parView) && !_.any(view.displayFormat.viewDefinitions, function(vd)
                            { return vd.uid == 'self'; }))
                    {
                        // OK, if things still weren't fixed, and none of the viewDefinitions are for
                        // the current view, then look up the first one and fix it if is based on
                        // the same dataset as the current view
                        Dataset.lookupFromViewId(view.displayFormat.viewDefinitions[0].uid, function(relDS)
                        {
                            if (relDS.tableId == view.tableId)
                            { fixIds(relDS); }
                        });
                    }
                });
            }
            return;
        }

        view.displayFormat.plot = view.displayFormat.plot || {};

        if (_.include(['geomap', 'intensitymap'], view.displayType))
        {
            view.displayType = 'map';
            view.displayFormat.type = 'heatmap';
            var region = view.displayFormat.region || '';
            view.displayFormat.heatmap = {
                type: region.toLowerCase().match(/^usa?$/) ? 'state' : 'countries'
            };

            _.each(['locationId', 'quantityId', 'descriptionId', 'redirectId'],
            function (key, index)
            {
                if (index < (view.visibleColumns || []).length)
                {
                    view.displayFormat.plot[key] =
                        parseInt(view.visibleColumns[index].tableColumnId);
                }
            });
        }

        if ($.isBlank(view.displayFormat.heatmap) &&
            !$.isBlank(view.displayFormat.heatmapType))
        {
            // Support for legacy config system.
            var heatmapType = view.displayFormat.heatmapType.split('_');
            config = {
                type: heatmapType[1],
                region: heatmapType[0],
                colors: {
                    low: view.displayFormat.lowcolor,
                    high: view.displayFormat.highcolor
                }
            };
            view.displayFormat.heatmap = config;
            delete view.displayFormat.lowcolor;
            delete view.displayFormat.highcolor;
            delete view.displayFormat.heatmapType;
        }

        var colObj = view.displayFormat.plot || view.displayFormat;

        _.each(['latitudeId', 'longitudeId', 'titleId', 'descriptionId'],
            function(n)
            {
                if ($.isBlank(view.displayFormat.plot[n]) && !$.isBlank(colObj[n]))
                {
                    view.displayFormat.plot[n] = colObj[n];
                    delete colObj[n];
                }
            });


        _.each({'ycol': 'latitudeId', 'xcol': 'longitudeId',
            'titleCol': 'titleId', 'bodyCol': 'descriptionId'}, function(n, o)
        {
            if ($.isBlank(view.displayFormat.plot[n]) && !$.isBlank(colObj[o]))
            {
                view.displayFormat.plot[n] =
                    view.columnForID(colObj[o]).tableColumnId;
                delete colObj[o];
            }
        });

        if (!$.isBlank(view.displayFormat.plot.descriptionId))
        {
            view.displayFormat.plot.descriptionColumns =
                [{tableColumnId: view.displayFormat.plot.descriptionId}];
            delete view.displayFormat.plot.descriptionId;
        }

        if ($.isBlank(view.displayFormat.plotStyle))
        { view.displayFormat.plotStyle = !$.isBlank(view.displayFormat.heatmap) ? 'heatmap' : 'point'; }
    }
};

})();
