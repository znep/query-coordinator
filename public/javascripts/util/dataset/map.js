(function(){

Dataset.map = {};

Dataset.map.isValid = function(view, displayFormat)
{
    if ($.isBlank(view)) { return false; }
    if (displayFormat.viewDefinitions) { return true; }

    if (view.isArcGISDataset()) { return true; }
    if (view.isGeoDataset()) { return true; }
    if ($.isBlank(displayFormat.noLocations) &&
        ($.isBlank(displayFormat.plot) ||
         ($.isBlank(displayFormat.plot.latitudeId) ||
          $.isBlank(displayFormat.plot.longitudeId)) &&
         $.isBlank(displayFormat.plot.locationId))) { return false; }

    var latCol = view.columnForIdentifier(displayFormat.plot.latitudeId);
    var longCol = view.columnForIdentifier(displayFormat.plot.longitudeId);
    var locCol = view.columnForIdentifier(displayFormat.plot.locationId);

    return !$.isBlank(locCol) || (!$.isBlank(latCol) && !$.isBlank(longCol)) ||
        displayFormat.noLocations;
};

Dataset.map.convertToVersion2 = function(view, df)
{
    if (!df) { df = view.displayFormat; }

    df.viewDefinitions = [$.extend(true, {}, df)];
    df.viewDefinitions[0].uid = view.id;

    if (df.compositeMembers)
    {
        _.each(df.compositeMembers, function(uid)
        { df.viewDefinitions.push({ uid: uid, plotStyle: 'point', legacy: true }); });
    }

    if (df.type == 'google')
    { df.overrideWithLayerSet = 'Google'; df.exclusiveLayers = true; }
    else if (df.type == 'bing')
    { df.overrideWithLayerSet = 'Bing'; df.exclusiveLayers = true; }
    else if ((df.plotStyle == 'heatmap' && df.forceBasemap) || df.plotStyle != 'heatmap')
    {
        df.bkgdLayers = _.map(df.layers, function(layer) { return {
            layerName: (_.detect(Dataset.map.backgroundLayers, function(lConfig)
                { return layer.url.indexOf((lConfig.options || {}).url) > -1; }) || {}).name };
        });
    }

    if (view.isArcGISDataset())
    {
        df.bkgdLayers = [{ layerName: 'World Street Map (ESRI)', opacity: 1.0 }];
        delete df.viewDefinitions[0].plotStyle;
        delete df.viewDefinitions[0].plot;
    }

    if (view.isGeoDataset())
    {
        df.exclusiveLayers = true;
        df.bkgdLayers = [{ layerName: 'Google Roadmap', alias: 'Google', opacity: 1.0 },
                         { layerName: 'Bing Road', alias: 'Bing', opacity: 1.0 },
                         { layerName: 'World Street Map (ESRI)', alias: 'ESRI', opacity: 1.0 }];
        delete df.viewDefinitions[0].plotStyle;
        delete df.viewDefinitions[0].plot;
    }

    view.update({ displayFormat: df });
};

// Possible thought: Basic/Advanced where Basic allows Google or Bing 'layersets'.
Dataset.map.backgroundLayers = [
    { name: 'Google Roadmap', alias: 'Roadmap', className: 'Google', options: { type: 'ROADMAP' }},
    { name: 'Google Satellite', alias: 'Satellite', className: 'Google',
        options: { type: 'SATELLITE' }},
    { name: 'Google Terrain', alias: 'Terrain', className: 'Google', options: { type: 'TERRAIN' }},
    { name: 'Bing Road', alias: 'Road', className: 'Bing' },
    { name: 'Bing Aerial', alias: 'Aerial', className: 'Bing', options: { type: 'Aerial' }},
    { name: 'World Street Map (ESRI)', alias: 'World Street Map', className: 'ESRI',
        options: { url: 'World_Street_Map' }},
    { name: 'Satellite Imagery (ESRI)', alias: 'Satellite Imagery', className: 'ESRI',
        options: { url: 'World_Imagery' }},
    { name: 'Detailed USA Topographic Map (ESRI)', alias: 'USA Topographic Map', className: 'ESRI',
        options: { url: 'USA_Topo_Maps' }},
    { name: 'Annotated World Topographic Map (ESRI)', alias: 'World Topographic Map',
        className: 'ESRI', options: { url: 'World_Topo_Maps' }},
    { name: 'Natural Earth Map (ESRI)', alias: 'Natural Earth Map', className: 'ESRI',
        options: { url: 'World_Physical_Map' }}
];
Dataset.map.backgroundLayer = {custom: { name: 'custom', className: 'ESRI' }};

Dataset.map.backgroundLayerSet = {};
Dataset.map.backgroundLayerSet.Google = [
    { name: 'Google Roadmap', alias: 'Roadmap', className: 'Google', options: { type: 'ROADMAP' }},
    { name: 'Google Satellite', alias: 'Satellite', className: 'Google',
        options: { type: 'SATELLITE' }},
    { name: 'Google Terrain', alias: 'Terrain', className: 'Google', options: { type: 'TERRAIN' }}
];

Dataset.map.backgroundLayerSet.Bing = [
    { name: 'Bing Road', alias: 'Road', className: 'Bing' },
    { name: 'Bing Aerial', alias: 'Aerial', className: 'Bing', options: { type: 'Aerial' }}
];

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

    _convertLegacy: function()
    {
        var view = this;
        if ($.subKeyDefined(view, 'displayFormat.viewDefinitions')) { return; }

        var isOldest = $.isBlank(view.displayFormat.plot) &&
             $.isBlank(view.displayFormat.latitudeId);

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

        if (isOldest)
        {
            if ((view.visibleColumns || []).length > 1)
            {
                view.displayFormat.plot.latitudeId =
                    view.visibleColumns[0].tableColumnId;
                view.displayFormat.plot.longitudeId =
                    view.visibleColumns[1].tableColumnId;
            }
            if ((view.visibleColumns || []).length > 2)
            {
                view.displayFormat.plot.descriptionId =
                    view.visibleColumns[2].tableColumnId;
            }
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
