(function($)
{
    if (!$.socrataMap.mixin) { $.socrataMap.mixin = function() { }; }
    $.socrataMap.mixin.arcGISmap = function() { };

    $.extend($.socrataMap.mixin.arcGISmap.prototype,
    {
        handleRowsLoaded: function(rows)
        {
            var mapObj = this;
            mapObj._dataLoaded = true;

            // Heatmaps require a location column to work; this acts as a stand-in.
            if (!mapObj._locCol)
            { createFakeLocationColumn(mapObj); }

            if (mapObj._rows === undefined) { mapObj._rows = []; }
            mapObj._rows = mapObj._rows.concat(rows);
            if (mapObj.settings.view.totalRows > mapObj._maxRows)
            {
                mapObj.showError('This dataset has more than ' + mapObj._maxRows +
                           ' rows visible. Some points will be not be displayed.');
                mapObj._maxRowsExceeded = true;
            }

            var objectIDs = _.map(rows, function(row)
            { return row.objectID = parseInt(row[mapObj._objectIdCol.id]); });

            var query = new esri.tasks.Query();
            query.objectIds = objectIDs;
            query.returnGeometry = true;
            query.outFields = ['*'];
            query.outSpatialReference = new esri.SpatialReference({ wkid: 4326 });

            new esri.tasks.QueryTask(blist.dataset.metadata.custom_fields.Basic.Source)
                .execute(query, function(featureSet)
            {
                populateRowsWithFeatureSet(mapObj, rows, featureSet);
                mapObj.renderData(rows);
            });
        },

        renderNonPoint: function(row, details)
        {
            var mapObj = this;
            var size = details.size || 2;
            var color = details.color || [ 0, 0, 255 ];

            if (!mapObj._infoTemplate)
            { mapObj._infoTemplate = new esri.InfoTemplate("${title}", "${body}"); }

            if (mapObj.map.spatialReference.wkid == 102100
                && row.feature.geometry.spatialReference.wkid == 4326)
            { row.feature.geometry = esri.geometry.geographicToWebMercator(
                                        row.feature.geometry); }

            row.feature.attributes.title = details.title;
            row.feature.attributes.body  = details.info;

            var symbol;
            if (row.feature.geometry instanceof esri.geometry.Polygon)
            {
                symbol = new esri.symbol.SimpleFillSymbol();
                symbol.setOutline(new esri.symbol.SimpleLineSymbol().setWidth(size));
            }
            else if (row.feature.geometry instanceof esri.geometry.Polyline)
            {
                symbol = new esri.symbol.SimpleLineSymbol();
                symbol.setWidth(size);
            }

            symbol.setColor(new dojo.Color(color));

            mapObj.map.graphics.add(row.feature.setSymbol(symbol)
                                               .setInfoTemplate(mapObj._infoTemplate));

            if (!mapObj._bounds)
            { mapObj._bounds = row.feature.geometry.getExtent(); }
            else
            { mapObj._bounds = mapObj._bounds.union(row.feature.geometry.getExtent()); }

            return true;
        }
    });

    var populateRowsWithFeatureSet = function(mapObj, rows, featureSet)
    {
        _.each(featureSet.features, function(feature)
        {
            var row = _.detect(rows, function(row)
            { return row.objectID == feature.attributes[mapObj._objectIdKey]; });
            row.feature = feature;

            var point;
            if (feature.geometry instanceof esri.geometry.Point)
            { point = feature.geometry; }
            else
            { point = feature.geometry.getExtent().getCenter(); }

            row[mapObj._locCol.id] = { latitude: point.y, longitude: point.x };
        });
    };

    var createFakeLocationColumn = function(mapObj)
    {
        mapObj._locCol = { id: 'fake_location', renderTypeName: 'location' };
    };

})(jQuery);
