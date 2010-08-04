(function($)
{
    var MAP_TYPE = {
        'countries': {
            'layerPath': "World_Topo_Map/MapServer/6",
            'fieldsReturned': ["NAME"],
            'where': function (mapObj, config)
                { return "TYPE = 'Country'"; },
            'zoom' : 1
        },
        'state': {
            'layerPath': "Demographics/USA_Tapestry/MapServer/4",
            'fieldsReturned': ["NAME", "ST_ABBREV"],
            'where': function (mapObj, config)
                { return "ST_ABBREV LIKE '%'" },
            'center': esri.geometry.geographicToWebMercator(new esri.geometry.Point(-104.98, 39.74, new esri.SpatialReference({ wkid: 4326 }))),
            'zoom': 4,
            'transformFeatures': {
                'Alaska': { 'scale': 0.6, 'offset': { 'x': 1950000, 'y': -4500000 } },
                'Hawaii': { 'scale': 1.2, 'offset': { 'x': 5000000, 'y': 800000 } }
                }
        },
        'counties': {
            'layerPath': "Demographics/USA_Tapestry/MapServer/3",
            'fieldsReturned': ["NAME", "ST_ABBREV"],
            'where': function (mapObj, config)
                { return "ST_ABBREV = '"+config.region.toUpperCase()+"'"; }
        }
    };

    $.socrataMap.heatmap = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataMap.heatmap.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    // Available configurations:
    // - type (required)
    // - region (required for type:counties)
    // - colors (required): hash of low and high
    // - hideLayers: automatically set when only layer is default
    // - hideZoomSlider
    // - ignoreTransforms: ignores default transformations in MAP_TYPE
    // - transformFeatures: custom transforms at view level
    $.extend($.socrataMap.heatmap, $.socrataMap.extend($.socrataMap.esri));
    $.extend($.socrataMap.heatmap.prototype,
    {
        renderData: function(rows)
        {
            var mapObj = this;
            var config;
            if (mapObj._displayConfig.heatmap)
            { config = mapObj._displayConfig.heatmap; }
            else
            {
                // Support for legacy config system.
                var heatmapType = mapObj._displayConfig.heatmapType.split('_');
                config = {
                    type: heatmapType[1],
                    region: heatmapType[0],
                    colors: {
                        low: mapObj._displayConfig.lowcolor,
                        high: mapObj._displayConfig.highcolor
                    }
                };
                mapObj._displayConfig.heatmap = config;
            }

            config.hideLayers = config.hideLayers || !mapObj._displayConfig.layers
                                || mapObj._displayConfig.layers.length == 0;
            mapObj.hideLayers();

            if (config.hideZoomSlider)
            { mapObj.map.hideZoomSlider(); }

            if (_.isUndefined(mapObj._locCol) || _.isUndefined(mapObj._quantityCol))
            {
                mapObj.errorMessage = 'Required columns missing';
                return false;
            }

            if (_.isUndefined(mapObj._segmentSymbols))
            {
                mapObj._segmentSymbols = [];
                var lowColor  = config.colors && config.colors.low  ? $.hexToRgb(config.colors.low)
                                                                    : { r: 209, g: 209, b: 209};
                var highColor = config.colors && config.colors.high ? $.hexToRgb(config.colors.high)
                                                                    : { r: 44, g: 119, b: 14};
                var colorStep = {
                    r: Math.round((highColor.r-lowColor.r)/mapObj._numSegments),
                    g: Math.round((highColor.g-lowColor.g)/mapObj._numSegments),
                    b: Math.round((highColor.b-lowColor.b)/mapObj._numSegments)
                };

                for (var i = 0; i < mapObj._numSegments; i++)
                {
                    mapObj._segmentSymbols[i] = new esri.symbol.SimpleFillSymbol();
                    mapObj._segmentSymbols[i].setColor(
                        new dojo.Color([lowColor.r+(colorStep.r*i),
                                        lowColor.g+(colorStep.g*i),
                                        lowColor.b+(colorStep.b*i),
                                        config.hideLayers ? 1.0 : 0.8])
                    );
                }

                mapObj.buildLegend(mapObj._quantityCol.name,
                    _.map(mapObj._segmentSymbols, function(symbol) { return symbol.color.toCss(false); }));
            }

            mapObj.startLoading();
            // Queries only need to be run once.
            // renderData actions happening during a query can be ignored,
            // because addFeatureSetToMap uses mapObj._rows for processing.
            if (mapObj._runningQuery) { return; }

            if (_.isUndefined(mapObj._featureSet))
            { doQueries(mapObj, config); }
            else
            { addFeatureSetToMap(mapObj, null, config); }
        },

        hideLayers: function()
        {
            var mapObj = this;
            var config = mapObj._displayConfig.heatmap;
            if (config.hideLayers || config.transformFeatures ||
                (!config.ignoreTransforms && MAP_TYPE[config.type].transformFeatures))
            {
                var layers = mapObj.getLayers();
                for (var i = 0; i < layers.length; i++)
                { mapObj.map.getLayer(layers[i].id).hide(); }
            }
        }
    });

    var doQueries = function(mapObj, config)
    {
        var query = new esri.tasks.Query();
        query.outFields = MAP_TYPE[config.type].fieldsReturned;
        query.returnGeometry = true;
        query.outSpatialReference = mapObj.map.spatialReference;

        query.where = MAP_TYPE[config.type].where(mapObj, config);
        new esri.tasks.QueryTask("http://server.arcgisonline.com/ArcGIS/rest/services/" + MAP_TYPE[config.type].layerPath)
            .execute(query, function(featureSet) { addFeatureSetToMap(mapObj, featureSet, config); });
        mapObj._runningQuery = true;
    };

    var addFeatureSetToMap = function(mapObj, featureSet, config)
    {
        if (featureSet)
        { mapObj._featureSet = featureSet; }
        else
        { featureSet = mapObj._featureSet; }

        mapObj._runningQuery = false;

        _.each(mapObj._rows, function(row)
        {
            var feature = findFeatureWithPoint(mapObj, row, featureSet);
            if(!feature) { return; }
            feature.attributes.description = $.makeArray(feature.attributes.description);
            feature.attributes.quantity    = $.makeArray(feature.attributes.quantity);

            if (mapObj._infoCol)
            { feature.attributes.description.push(row[mapObj._infoCol.dataIndex]); }
            feature.attributes.quantity.push(row[mapObj._quantityCol.dataIndex]);

            var redirectTarget;
            if (mapObj._redirectCol)
            {
                redirectTarget = mapObj._redirectCol.dataTypeName == 'url'
                                ? row[mapObj._redirectCol.dataIndex][mapObj._redirectCol.urlSubIndex]
                                : row[mapObj._redirectCol.dataIndex];
            }

            // Last value used for simplicity.
            feature.attributes.redirect_to = redirectTarget || feature.attributes.redirect_to;
        });

        // Converts array to value if array; otherwise, just returns value.
        var getValue = function(e)
        {
            if (!e.attributes.quantity)
            { return null; }

            if (!$.isArray(e.attributes.quantity))
            { return parseFloat(e.attributes.quantity); }

            e.attributes.quantity = _.compact(e.attributes.quantity);
            if (e.attributes.quantity.length == 0)
            { return null; }

            var quantityPrecision = 0;
            e.attributes.quantity = _.reduce(
                e.attributes.quantity, 0.0, function(m, v)
                {
                    var precision = v.indexOf('.') > -1
                                    ? v.length-v.lastIndexOf('.')-1 : 0;
                    quantityPrecision = quantityPrecision > precision
                                    ? quantityPrecision : precision;
                    return m + parseFloat(v);
                }).toFixed(quantityPrecision);

            return parseFloat(e.attributes.quantity);
        };

        var max = Math.ceil( _.max(_.map(featureSet.features, getValue))/50)*50;
        var min = Math.floor(_.min(_.map(featureSet.features, getValue))/50)*50;
        mapObj._$legend.find('span:first').text(min);
        mapObj._$legend.find('span:last').text(max);
        var segments = [];
        for (i = 0; i < mapObj._numSegments; i++) { segments[i] = ((i+1)*(max-min)/mapObj._numSegments)+min; }

        var info = mapObj._quantityCol.name + ": ${quantity}<br />${description}";
        var infoTemplate = new esri.InfoTemplate("${NAME}", info);

        transformFeatures(featureSet.features, config);

        mapObj.map.graphics.clear();
        var extents = [];
        _.each(featureSet.features, function(feature)
        {
            if (!feature.attributes.quantity) { return; }
            feature.attributes.description = $.makeArray(feature.attributes.description).join(', ');

            var symbol;
            for (i = 0; i < mapObj._numSegments; i++)
            {
                if (parseFloat(feature.attributes.quantity) <= segments[i])
                { symbol = mapObj._segmentSymbols[i]; break; }
            }
            mapObj.map.graphics.add(feature.setSymbol(symbol)
                                           .setInfoTemplate(infoTemplate));
            extents.push(feature.geometry.getExtent());
            if (feature.attributes.redirect_to)
            {
                $(feature.getDojoShape().rawNode)
                    .click(function(event)
                        { window.open(feature.attributes.redirect_to); })
                    .hover(
                        function(event) { blist.$display.find('div .container').css('cursor', 'pointer'); },
                        function(event) { blist.$display.find('div .container').css('cursor', 'default'); });
            }
        });

        var center = MAP_TYPE[config.type].center ? MAP_TYPE[config.type].center : mapObj.map.extent.getCenter();
        if (MAP_TYPE[config.type].zoom)
        { mapObj.map.centerAndZoom(center, MAP_TYPE[config.type].zoom); }
        else
        { mapObj.map.setExtent(buildMinimumExtentFromSet(extents), true); }

        mapObj.finishLoading();
    };

    var findFeatureWithPoint = function(mapObj, datum, featureSet)
    {
        var point;

        if (mapObj._locCol.renderTypeName == 'location')
        {
            var latVal  = datum[mapObj._locCol.dataIndex][mapObj._locCol.latSubIndex];
            var longVal = datum[mapObj._locCol.dataIndex][mapObj._locCol.longSubIndex];
            if (latVal && longVal)
            {
                point = new esri.geometry.Point(longVal, latVal, new esri.SpatialReference({ wkid: 4326 }));
                if (mapObj.map.spatialReference.wkid == 102100)
                { point = esri.geometry.geographicToWebMercator(point); }
            }
            else
            {
                if (!datum[mapObj._locCol.dataIndex][0]) { return; }
                // State is the only salient region to search for in a location w/o lat/lng.
                // Well, there are ZIP codes, but we have no GIS data for those yet.
                point = JSON.parse(datum[mapObj._locCol.dataIndex][0]);
                if (point) { point = point.state; }
                else { return; }
            }
        }
        else if (mapObj._locCol.renderTypeName == 'text')
        {
            point = datum[mapObj._locCol.dataIndex];
            if (point.substr(0, 3) == 'US-')
            { point = point.substr(3, 2); }
        }

        return _.detect(featureSet.features, function(feature)
        {
            if (point instanceof esri.geometry.Point)
            { return feature.geometry.contains(point); }
            else
            {
                var featureName = feature.attributes['NAME'];
                if (point.length == 2) { featureName = feature.attributes['ST_ABBREV']; }

                return point == featureName;
            }
        });
    };

    var buildMinimumExtentFromSet = function(extents)
    {
        if (extents.length == 0) { return; }
        var spatialReference = extents[0].spatialReference;
        var base_extent = extents[0];
        var extent = _.reduce(extents, base_extent, function(memo, extent)
            {
                return {
                    xmin: Math.min(memo.xmin, extent.xmin), ymin: Math.min(memo.ymin, extent.ymin),
                    xmax: Math.max(memo.xmax, extent.xmax), ymax: Math.max(memo.ymax, extent.ymax)
                    };
            });
        return new esri.geometry.Extent(extent.xmin, extent.ymin, extent.xmax, extent.ymax, spatialReference);
    };

    var transformFeatures = function(features, config)
    {
        if (!config.transformFeatures
            && (config.ignoreTransforms || !MAP_TYPE[config.type].transformFeatures))
        { return; }

        _.each(features, function(feature)
        {
            var transform;
            if (config.transformFeatures)
            { transform = config.transformFeatures[feature.attributes['NAME']]; }
            transform = transform || MAP_TYPE[config.type].transformFeatures[feature.attributes['NAME']];

            if (!transform) return;

            var geometry = feature.geometry;
            var rings = geometry.rings;
            var center = geometry.getExtent().getCenter();

            for (var r = 0; r < rings.length; r++)
            {
                var points = rings[r];
                for (var p = 0; p < points.length; p++)
                {
                    if (transform.scale)
                    {
                        var point = geometry.getPoint(r, p);
                        geometry.setPoint(r, p, new esri.geometry.Point(
                            center.x + (point.x - center.x) * transform.scale,
                            center.y + (point.y - center.y) * transform.scale,
                            point.spatialReference));
                    }
                    if (transform.offset)
                    { geometry.setPoint(r, p, geometry.getPoint(r, p).offset(transform.offset.x, transform.offset.y)); }
                }
            }
        });
    };

})(jQuery);
