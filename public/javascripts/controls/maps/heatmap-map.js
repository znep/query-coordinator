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
            'center': esri.geometry.geographicToWebMercator(
                new esri.geometry.Point(-104.98, 39.74,
                    new esri.SpatialReference({ wkid: 4326 }))),
            'zoom': 4,
            'transformFeatures': {
                'Alaska': { 'scale': 0.6,
                    'offset': { 'x': 1950000, 'y': -4500000 } },
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

    if (!$.socrataMap.mixin) { $.socrataMap.mixin = function() { }; }
    $.socrataMap.mixin.heatmap = function() { };

    // Available configurations:
    // - type (required)
    // - region (required for type:counties)
    // - colors (required): hash of low and high
    // - hideLayers: automatically set when only layer is default
    // - hideZoomSlider
    // - ignoreTransforms: ignores default transformations in MAP_TYPE
    // - transformFeatures: custom transforms at view level
    $.extend($.socrataMap.mixin.heatmap.prototype,
    {
        renderData: function(rows)
        {
            var mapObj = this;
            var config = mapObj.settings.view.displayFormat.heatmap;

            config.hideLayers = config.hideLayers ||
                !mapObj.settings.view.displayFormat.layers
                || mapObj.settings.view.displayFormat.layers.length == 0;
            if (config.hideLayers && mapObj.hideLayers) { mapObj.hideLayers(); }

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
                var lowColor  = config.colors && config.colors.low ?
                    $.hexToRgb(config.colors.low)
                    : { r: 209, g: 209, b: 209};
                var highColor = config.colors && config.colors.high ?
                    $.hexToRgb(config.colors.high)
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

                mapObj.$legend({
                    name: mapObj._quantityCol.name,
                    gradient: _.map(mapObj._segmentSymbols, function(symbol)
                        { return symbol.color.toCss(false); })
                });
            }

            mapObj.startLoading();
            // Queries only need to be run once.
            // renderData actions happening during a query can be ignored,
            // because processRows uses mapObj._rows for initial processing.
            if (mapObj._runningQuery) { return; }

            if (_.isUndefined(mapObj._featureSet))
            { fetchFeatureSet(mapObj, config); }
            else
            { processRows(mapObj, config, rows); }
        }
    });

    var fetchFeatureSet = function(mapObj, config)
    {
        dojo.require('esri.tasks.query');
        var query = new esri.tasks.Query();
        query.outFields = MAP_TYPE[config.type].fieldsReturned;
        query.returnGeometry = true;
        query.outSpatialReference = mapObj.map.spatialReference ||
            new esri.SpatialReference({ wkid: 102100 });

        query.where = MAP_TYPE[config.type].where(mapObj, config);
        new esri.tasks.QueryTask(
                "http://server.arcgisonline.com/ArcGIS/rest/services/" +
                MAP_TYPE[config.type].layerPath)
            .execute(query, function(featureSet)
                {
                    mapObj._featureSet = featureSet;
                    processRows(mapObj, config);
                });
        mapObj._runningQuery = true;

        setTimeout(function()
        {
            // query took too long and probably timed out
            // so we're just going to kill the spinner and error it
            // if the query does finish, it will load behind the alert
            if (mapObj._runningQuery)
            {
                mapObj.finishLoading();
                alert('A data request has taken too long and timed out.');
            }
        }, 60000);
    };

    var processRows = function(mapObj, config, rows)
    {
        if (!rows) { rows = mapObj._rows; }

        mapObj._runningQuery = false;

        _.each(rows, function(row, i)
        {
            var feature = findFeatureWithPoint(mapObj, row);
            if ($.isBlank(feature)) { return; }
            feature.attributes.description =
                $.makeArray(feature.attributes.description);
            feature.attributes.quantity =
                $.makeArray(feature.attributes.quantity);

            if (mapObj._infoCol)
            { feature.attributes.description.push(
                mapObj.getText(row, mapObj._infoCol)); }
            if (!row.invalid[mapObj._quantityCol.id])
            { feature.attributes.quantity.push(row[mapObj._quantityCol.id]); }

            var redirectTarget;
            if (mapObj._redirectCol)
            {
                redirectTarget = mapObj._redirectCol.dataTypeName == 'url'
                                ? row[mapObj._redirectCol.id].url
                                : row[mapObj._redirectCol.id];
            }

            // Last value used for simplicity.
            feature.attributes.redirect_to = redirectTarget ||
                feature.attributes.redirect_to;
        });

        // Converts array to value if array; otherwise, just returns value.
        var getValue = function(e)
        {
            if (!e.attributes.quantity)
            { return null; }

            if (!_.isArray(e.attributes.quantity))
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

        var max = _.max(_.map(mapObj._featureSet.features, getValue));
        var min = _.min(_.map(mapObj._featureSet.features, getValue));
        mapObj.$legend({ minimum: min, maximum: max });
        var segments = [];
        for (i = 0; i < mapObj._numSegments; i++)
        { segments[i] = ((i+1)*(max-min)/mapObj._numSegments)+min; }

        if (!mapObj._featuresTransformed)
        {
            transformFeatures(mapObj._featureSet.features, config);
            mapObj._featuresTransformed = true;
        }

        mapObj.clearFeatures();
        _.each(mapObj._featureSet.features, function(feature)
        {
            if (!feature.attributes.quantity) { return; }
            feature.attributes.description = _.compact(
                $.makeArray(feature.attributes.description)).join(', ');

            var segmentIndex;
            for (segmentIndex = 0; segmentIndex < mapObj._numSegments; segmentIndex++)
            {
                if (parseFloat(feature.attributes.quantity) <= segments[segmentIndex])
                { break; }
            }

            mapObj.renderFeature(feature, segmentIndex);
        });

        mapObj.adjustBounds();

        if (config.hideLayers || config.transformFeatures ||
            (!config.ignoreTransforms &&
                MAP_TYPE[config.type].transformFeatures))
        { if (mapObj.hideLayers) { mapObj.hideLayers(); } }

        mapObj.finishLoading();
    };

    var findFeatureWithPoint = function(mapObj, datum)
    {
        var point;

        if (!datum[mapObj._locCol.id]) { return null; }
        if (mapObj._locCol.renderTypeName == 'location')
        {
            if ($.isBlank(datum[mapObj._locCol.id])) { return null; }

            var latVal  = datum[mapObj._locCol.id].latitude;
            var longVal = datum[mapObj._locCol.id].longitude;
            if (latVal && longVal)
            {
                point = new esri.geometry.Point(longVal, latVal,
                    new esri.SpatialReference({ wkid: 4326 }));
                if (!mapObj.map.spatialReference ||
                     mapObj.map.spatialReference.wkid == 102100)
                { point = esri.geometry.geographicToWebMercator(point); }
            }
            else
            {
                if (!datum[mapObj._locCol.id].human_address) { return null; }
                // State is the only salient region to search for in a location
                // w/o lat/lng.  Well, there are ZIP codes, but we have no GIS
                // data for those yet.
                point = JSON.parse(datum[mapObj._locCol.id].human_address);
                if (point) { point = point.state; }
                else { return null; }
            }
        }
        else if (mapObj._locCol.renderTypeName == 'text')
        {
            point = datum[mapObj._locCol.id];
            if (point.substr(0, 3) == 'US-')
            { point = point.substr(3, 2); }
        }

        return _.detect(mapObj._featureSet.features, function(feature)
        {
            if (point instanceof esri.geometry.Point)
            { return feature.geometry.contains(point); }
            else
            {
                var featureName = feature.attributes['NAME'];
                if (point.length == 2)
                { featureName = feature.attributes['ST_ABBREV']; }

                return point == featureName;
            }
        });
    };

    var transformFeatures = function(features, config)
    {
        if (!config.transformFeatures &&
            (config.ignoreTransforms || !MAP_TYPE[config.type].transformFeatures))
        { return; }

        _.each(features, function(feature)
        {
            var transform;
            if (config.transformFeatures)
            { transform = config.transformFeatures[feature.attributes['NAME']]; }
            transform = transform ||
                MAP_TYPE[config.type].transformFeatures[feature.attributes['NAME']];

            if (!transform) { return; }

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
                    { geometry.setPoint(r, p, geometry.getPoint(r, p)
                        .offset(transform.offset.x, transform.offset.y)); }
                }
            }
        });
    };

})(jQuery);
