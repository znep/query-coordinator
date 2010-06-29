(function($)
{
    var NUM_SEGMENTS = 10;

    $.socrataMap.heatmap = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataMap.heatmap.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataMap.heatmap, $.socrataMap.extend($.socrataMap.esri));
    $.extend($.socrataMap.heatmap.prototype,
    {
        renderData: function(rows)
        {
            var mapObj = this;
            var heatmapType = mapObj._displayConfig.heatmapType.split('_');
            type = { type: heatmapType[1], where: heatmapType[0] };

            if (_.isUndefined(mapObj._locCol) || _.isUndefined(mapObj._quantityCol))
            {
                mapObj.errorMessage = 'Required columns missing';
                return false;
            }

            if (_.isUndefined(mapObj._segmentSymbols))
            {
                mapObj._segmentSymbols = [];
                var lowColor  = mapObj._displayConfig.lowcolor  ? $.hexToRgb(mapObj._displayConfig.lowcolor)
                                                                : { r: 209, g: 209, b: 209};
                var highColor = mapObj._displayConfig.highcolor ? $.hexToRgb(mapObj._displayConfig.highcolor)
                                                                : { r: 0, g: 255, b: 0};
                var colorStep = {
                    r: Math.round((highColor.r-lowColor.r)/NUM_SEGMENTS),
                    g: Math.round((highColor.g-lowColor.g)/NUM_SEGMENTS),
                    b: Math.round((highColor.b-lowColor.b)/NUM_SEGMENTS)
                };

                for (var i = 0; i < NUM_SEGMENTS; i++)
                {
                    mapObj._segmentSymbols[i] = new esri.symbol.SimpleFillSymbol();
                    mapObj._segmentSymbols[i].setColor(
                        new dojo.Color([lowColor.r+(colorStep.r*i),
                                        lowColor.g+(colorStep.g*i),
                                        lowColor.b+(colorStep.b*i),
                                        0.8])
                    );
                }
            }

            if (_.isUndefined(mapObj._featureSet))
            { doQueries(mapObj, type); }
            else
            { addFeatureSetToMap(mapObj, null, type); }
        }
    });

    var doQueries = function(mapObj, type)
    {
        var featureLayer = type.type == 'counties' ? 3 : 4;
        var queryTask = new esri.tasks.QueryTask("http://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Tapestry/MapServer/"+featureLayer);
        var query = new esri.tasks.Query();
        query.outFields = ["NAME", "ST_ABBREV"];
        query.returnGeometry = true;
        query.outSpatialReference = mapObj.map.spatialReference;
        query.where = "ST_ABBREV";
        query.where += type.type == 'counties'
                        ? " = '"+type.where.toUpperCase()+"'"
                        : " LIKE '%'";
        queryTask.execute(query, function(featureSet) { addFeatureSetToMap(mapObj, featureSet, type); });
    };

    var addFeatureSetToMap = function(mapObj, featureSet, type)
    {
        if (featureSet)
        { mapObj._featureSet = featureSet; }
        else
        { featureSet = mapObj._featureSet; }

        _.each(mapObj._rows, function(row)
        {
            var feature = findFeatureWithPoint(mapObj, row, featureSet);
            if(!feature) { return; }
            if(!feature.attributes.description) { feature.attributes.description = []; }
            if(!feature.attributes.quantity)    { feature.attributes.quantity = []; }

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
        var segments = [];
        for (i = 0; i < NUM_SEGMENTS; i++) { segments[i] = ((i+1)*(max-min)/NUM_SEGMENTS)+min; }

        var info = mapObj._quantityCol.name + ": ${quantity}<br />${description}";
        var infoTemplate = new esri.InfoTemplate("${NAME}", info);

        mapObj.map.graphics.clear();
        var extents = [];
        _.each(featureSet.features, function(feature)
        {
            if (!feature.attributes.quantity) return;
            feature.attributes.description = feature.attributes.description.join(', ');

            var symbol;
            for (i = 0; i < NUM_SEGMENTS; i++)
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
        if (type.type == 'state')
        {
            mapObj.map.centerAndZoom(esri.geometry.geographicToWebMercator(
                new esri.geometry.Point(-111.88, 41.75, new esri.SpatialReference({ wkid: 4326 }))), 3);
        }
        else
        {
            var spatialReference = extents[0].spatialReference;
            var base_extent = extents[0];
            extents = _.reduce(extents, base_extent, function(memo, extent)
                {
                    return {
                        xmin: Math.min(memo.xmin, extent.xmin), ymin: Math.min(memo.ymin, extent.ymin),
                        xmax: Math.max(memo.xmax, extent.xmax), ymax: Math.max(memo.ymax, extent.ymax)
                        };
                });
            mapObj.map.setExtent(
                new esri.geometry.Extent(extents.xmin, extents.ymin, extents.xmax, extents.ymax, spatialReference), true);
        }
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
                // State is the only salient region to search for in a location w/o lat/lng.
                // Well, there are ZIP codes, but we have no GIS data for those yet.
                point = JSON.parse(datum[mapObj._locCol.dataIndex][0]).state;
            }
        }
        else if (mapObj._locCol.renderTypeName == 'text')
        {
            point = datum[mapObj._locCol.dataIndex];
        }

        return _.detect(featureSet.features, function(feature)
        {
            if (point instanceof esri.geometry.Point)
            { return feature.geometry.contains(point); }
            else
            {
                return point.toLowerCase() ==
                    ((point.length == 2) ? feature.attributes['ST_ABBREV'].toLowerCase()
                                         : feature.attributes['NAME']).toLowerCase();
            }
        });
    };

})(jQuery);
