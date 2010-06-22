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
    });

    var doQueries = function(mapObj)
    {
        var queryTask = new esri.tasks.QueryTask("http://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Tapestry/MapServer/4");
        var query = new esri.tasks.Query();
        query.outFields = ["NAME", "ST_ABBREV"];
        query.returnGeometry = true;
        query.outSpatialReference = mapObj.map.spatialReference;
        query.where = "ST_ABBREV LIKE '%'";
        queryTask.execute(query, function(featureSet) { addFeatureSetToMap(mapObj, featureSet); },
                                 function(error) { if (window.console && window.console.log) console.log(error); });
    };

    var addFeatureSetToMap = function(mapObj, featureSet)
    {
        var info = mapObj._quantityCol.name + ": ";
        info += (mapObj._quantityCol.dataTypeName == 'money' ? '$' : '') + "${quantity}";
        info += "<br />${description}";
        var infoTemplate = new esri.InfoTemplate("${NAME}", info);
        var data = _.map(mapObj._rows, function(row)
            {
                var redirectTarget;
                if (mapObj._redirectCol)
                {
                    redirectTarget = mapObj._redirectCol.dataTypeName == 'url'
                                    ? row[mapObj._redirectCol.dataIndex][mapObj._redirectCol.urlSubIndex]
                                    : row[mapObj._redirectCol.dataIndex];
                }
                return {
                    state: JSON.parse(row[mapObj._locCol.dataIndex][0]).state,
                    description: row[mapObj._infoCol.dataIndex],
                    redirect_to: redirectTarget,
                    value: parseInt(row[mapObj._quantityCol.dataIndex])
                };
            });

        var getValue = function(e) { return e.value; };
        var max = Math.ceil( _.max(_.map(data, getValue))/50)*50;
        var min = Math.floor(_.min(_.map(data, getValue))/50)*50;
        var segments = [];
        for (i = 0; i < 10; i++) { segments[i] = ((i+1)*(max-min)/10)+min; }

        _.each(featureSet.features, function(feature) {
            var stateAbbr = feature.attributes['ST_ABBREV'];
            var stateName = feature.attributes['NAME'];
            var datum = _.detect(data, function(d) { return d.state == stateAbbr
                                                         || d.state == stateName; });
            if (!datum) return;

            var symbol;
            for (i = 0; i < 10; i++)
            {
                if (datum.value <= segments[i])
                { symbol = mapObj._segmentSymbols[i]; break; }
            }
            mapObj.map.graphics.add(feature.setSymbol(symbol)
                                           .setAttributes({
                                                NAME: feature.attributes['NAME'],
                                                description: datum.description,
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
