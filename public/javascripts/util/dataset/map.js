(function(){

Dataset.map = {};
Dataset.map.toGoogle = {
    polygon: function(geometry)
    {
        return _.map(geometry.rings, function(ring, r)
        {
            return _.map(ring, function(point, p)
            {
                var point = geometry.getPoint(r, p);
                if (point.spatialReference.wkid == 102100)
                { point = esri.geometry.webMercatorToGeographic(point); }
                return new google.maps.LatLng(point.y, point.x);
            });
        });
    },
    extent: function(extent)
    {
        var sw = new esri.geometry.Point(extent.xmin, extent.ymax,
            extent.spatialReference);
        var ne = new esri.geometry.Point(extent.xmax, extent.ymin,
            extent.spatialReference);
        if (extent.spatialReference.wkid == 102100)
        {
            sw = esri.geometry.webMercatorToGeographic(sw);
            ne = esri.geometry.webMercatorToGeographic(ne);
        }
        return new google.maps.LatLngBounds(
            new google.maps.LatLng(sw.y, sw.x),
            new google.maps.LatLng(ne.y, ne.x));
    }
};
Dataset.map.toBing = {
    polygon: function(geometry)
    {
        // Bing does not support multiple-ring Polygons. As a result, we're picking
        // the largest ring and using that as the polygon's definition.
    //    var largestRing = _.max(geometry.rings, function(ring) { return ring.length; });
    //    var r = _.indexOf(geometry.rings, largestRing);

        // Bing's documentation flouts their inability to close polygons, so let's do
        // it for them.
    //    if (largestRing[largestRing.length - 1] != largestRing[0])
    //    { largestRing.push(largestRing[0]); }
        return _.map(geometry.rings, function(ring, r)
        {
            if (ring[ring.length - 1] != ring[0])
            { ring.push(ring[0]); }
            return new Microsoft.Maps.Polygon(_.map(ring, function(point, p)
            {
                var point = geometry.getPoint(r, p);
                if (point.spatialReference.wkid == 102100)
                { point = esri.geometry.webMercatorToGeographic(point); }
                return new Microsoft.Maps.Location(point.y, point.x);
            }))
        });
    }
};

Dataset.modules['map'] =
{
    supportsSnapshotting: function()
    {
        return _.include(['bing', 'google', 'esri'], this.displayFormat.type);
    },

    _checkValidity: function()
    {
        if (this.isArcGISDataset()) { return true; }
        if ($.isBlank(this.displayFormat.noLocations) &&
            ($.isBlank(this.displayFormat.plot.latitudeId) ||
            $.isBlank(this.displayFormat.plot.longitudeId)) &&
            $.isBlank(this.displayFormat.plot.locationId)) { return false; }

        var latCol = this.columnForTCID(this.displayFormat.plot.latitudeId);
        var longCol = this.columnForTCID(this.displayFormat.plot.longitudeId);
        var locCol = this.columnForTCID(this.displayFormat.plot.locationId);

        return !$.isBlank(locCol) || (!$.isBlank(latCol) && !$.isBlank(longCol)) ||
            this.displayFormat.noLocations;
    },

    _convertLegacy: function()
    {
        var view = this;
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
