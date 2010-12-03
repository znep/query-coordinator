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

            if (mapObj._rows === undefined) { mapObj._rows = []; }
            mapObj._rows = mapObj._rows.concat(rows);
            if (mapObj.settings.view.totalRows > mapObj._maxRows)
            {
                mapObj.showError('This dataset has more than ' + mapObj._maxRows +
                           ' rows visible. Some points will be not be displayed.');
                mapObj._maxRowsExceeded = true;
            }

            var objectIDs = _.map(rows, function(row)
            { return row.objectID = row[mapObj._objectIdCol.id]; });

            // TODO: This isn't ready yet. Need to slice renderRow into two parts.
            //if (mapObj._featureLayer.geometryType != 'esriGeometryPoint')
            //{ mapObj.renderPoint = renderPoint; }

            var query = new esri.tasks.Query();
            query.objectIds = objectIDs;
            query.returnGeometry = true;
            query.outFields = ['*'];

            new esri.tasks.QueryTask(blist.dataset.description)
                .execute(query, function(featureSet)
            {
                populateRowsWithFeatureSet(rows, featureSet);
                mapObj.renderData(rows);
            });
        }
    });

    var populateRowsWithFeatureSet = function(rows, featureSet)
    {
        _.each(featureSet.features, function(feature)
        {
            var row = _.detect(rows, function(row)
            { return row.objectID == feature.attributes.OBJECTID; });
            row.feature = feature;
        });
    };

    // TODO: This isn't ready yet.
    var renderPoint = function(row)
    {
        var mapObj = this;

        var symbol;
        if (row.feature.geometry.type instanceof esri.geometry.Polygon)
        {
            symbol = new esri.symbol.SimpleFillSymbol();
            symbol.setOutline(new esri.symbol.SimpleLineSymbol().setWidth(size));
        }
        else if (row.feature.geometry.type instanceof esri.geometry.Polyline)
        {
            symbol = new esri.symbol.SimpleLineSymbol();
            symbol.setWidth(size);
        }

        symbol.setColor(new dojo.Color(color || [ 0, 0, 255 ]));

        mapObj.map.graphics.add(row.feature.setSymbol(symbol));

        if (!mapObj._bounds)
        { mapObj._bounds = row.feature.geometry.getExtent(); }
        else
        { mapObj._bounds = mapObj._bounds.union(row.feature.geometry.getExtent()); }
    };

})(jQuery);
