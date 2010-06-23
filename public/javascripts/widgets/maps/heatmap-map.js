(function($)
{
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

            if (_.isUndefined(mapObj._locCol) && _.isUndefined(mapObj._quantityCol))
            {
                mapObj.errorMessage = 'Required columns missing';
                return false;
            }

            if (_.isUndefined(mapObj._segmentSymbols))
            {
                mapObj._segmentSymbols = [];
                for (var i = 0; i < 10; i++)
                {
                    mapObj._segmentSymbols[i] = new esri.symbol.SimpleFillSymbol();
                    mapObj._segmentSymbols[i].setColor(
                        new dojo.Color([50,50+(20*i),50,0.8])
                    );
                }

                doQueries(mapObj);
            }
            else
            {
                addFeatureSetToMap(mapObj, null);
            }
        }
    });

    var doQueries = function(mapObj)
    {
        var queryTask = new esri.tasks.QueryTask("http://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Tapestry/MapServer/4");
        var query = new esri.tasks.Query();
        query.outFields = ["NAME", "ST_ABBREV"];
        query.returnGeometry = true;
        query.outSpatialReference = mapObj.map.spatialReference;
        query.where = "ST_ABBREV LIKE '%'";
        queryTask.execute(query, function(featureSet) { addFeatureSetToMap(mapObj, featureSet); });
    };

    var addFeatureSetToMap = function(mapObj, featureSet)
    {
        if (featureSet)
        { mapObj._featureSet = featureSet; }
        else
        { featureSet = mapObj._featureSet; }
        mapObj.resetData();

        var info = mapObj._quantityCol.name + ": ${quantity}<br />${description}";
        var infoTemplate = new esri.InfoTemplate("${NAME}", info);

        var stateMapping = {};
        _.each(featureSet.features, function(feature)
        { stateMapping[feature.attributes['NAME'].toLowerCase()] = feature.attributes['ST_ABBREV']; });

        var data = {};
        _.each(mapObj._rows, function(row)
        {
            var redirectTarget;
            if (mapObj._redirectCol)
            {
                redirectTarget = mapObj._redirectCol.dataTypeName == 'url'
                                ? row[mapObj._redirectCol.dataIndex][mapObj._redirectCol.urlSubIndex]
                                : row[mapObj._redirectCol.dataIndex];
            }
            var key = JSON.parse(row[mapObj._locCol.dataIndex][0]).state.toLowerCase().replace(/[^a-z ]/g, '');
            if (stateMapping[key])
            { key = stateMapping[key]; }
            if (!data[key])
            { data[key] = { description: [], value: [] }; }

            if (mapObj._infoCol)
            { data[key].description.push(row[mapObj._infoCol.dataIndex]); }
            data[key].redirect_to = redirectTarget || data[key].redirect_to; // Last value used for simplicity.
            data[key].value.push(row[mapObj._quantityCol.dataIndex]);
        });

        // Converts array to value if array; otherwise, just returns value.
        var getValue = function(e)
        {
            if (!$.isArray(e.value)) return parseFloat(e.value);

            var quantityPrecision = 0;
            e.value = _.reduce(e.value, 0.0, function(m, v)
                {
                    var precision = v.length-v.lastIndexOf('.')-1;
                    quantityPrecision = quantityPrecision > precision
                                    ? quantityPrecision : precision;
                    return m + parseFloat(v);
                }).toFixed(quantityPrecision);

            return parseFloat(e.value);
        };
        var max = Math.ceil( _.max(_.map(data, getValue))/50)*50;
        var min = Math.floor(_.min(_.map(data, getValue))/50)*50;
        var segments = [];
        for (i = 0; i < 10; i++) { segments[i] = ((i+1)*(max-min)/10)+min; }

        _.each(featureSet.features, function(feature)
        {
            var stateAbbr = feature.attributes['ST_ABBREV'].toLowerCase();
            var datum = data[stateAbbr];
            if (!datum) return;

            var symbol;
            for (i = 0; i < 10; i++)
            {
                if (parseFloat(datum.value) <= segments[i])
                { symbol = mapObj._segmentSymbols[i]; break; }
            }
            mapObj.map.graphics.add(feature.setSymbol(symbol)
                                           .setAttributes({
                                                NAME: feature.attributes['NAME'],
                                                ST_ABBREV: feature.attributes['ST_ABBREV'],
                                                description: datum.description.join(', '),
                                                quantity: datum.value })
                                           .setInfoTemplate(infoTemplate));
            if (datum.redirect_to)
            {
                $(feature.getDojoShape().rawNode)
                    .click(function(event)
                        { window.open(datum.redirect_to); })
                    .hover(
                        function(event) { blist.$display.find('div .container').css('cursor', 'pointer'); },
                        function(event) { blist.$display.find('div .container').css('cursor', 'default'); });
            }
        });
        mapObj.map.centerAndZoom(esri.geometry.geographicToWebMercator(new esri.geometry.Point(-111.88, 41.75, new esri.SpatialReference({ wkid: 4326 }))), 3);
    };

})(jQuery);
