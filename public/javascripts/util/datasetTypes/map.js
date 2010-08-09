blist.namespace.fetch('blist.dataset.map');

blist.dataset.map.isValid = function(view)
{
    view = blist.dataset.map.convertLegacy($.extend(true, {}, view));
    var latCol = blist.dataset.columnForTCID(view,
        view.displayFormat.plot.latitudeId);
    var longCol = blist.dataset.columnForTCID(view,
        view.displayFormat.plot.longitudeId);
    var locCol = blist.dataset.columnForTCID(view,
        view.displayFormat.plot.locationId);

    return !$.isBlank(locCol) || (!$.isBlank(latCol) && !$.isBlank(longCol));
};

blist.dataset.map.convertLegacy = function(view)
{
    var isOldest = $.isBlank(view.displayFormat) ||
        ($.isBlank(view.displayFormat.plot) &&
         $.isBlank(view.displayFormat.latitudeId));

    view.displayFormat = view.displayFormat || {};
    view.displayFormat.plot = view.displayFormat.plot || {};

    if (view.displayType == 'geomap' || view.displayType == 'intensitymap')
    {
        view.displayType = 'map';
        view.displayFormat.type = 'heatmap';
        var region = view.displayFormat.region || '';
        view.displayFormat.heatmap = {
            type: region.toLowerCase().match(/^usa?$/) ? 'state' : 'countries'
        };

        var columns = _.select(view.columns, function(column)
            { return column.dataTypeName != "meta_data"; });

        _.each(['locationId', 'quantityId', 'descriptionId', 'redirectId'],
            function (key, index)
            {
                if (index < columns.length)
                { view.displayFormat.plot[key] = columns[index].tableColumnId; }
            });
    }

    if (isOldest)
    {
        var cols = _(view.columns).chain().select(function(c)
            { return c.dataTypeName != 'meta_data' &&
                (c.flags === undefined || !_.include(c.flags, 'hidden')); })
            .sortBy(function(c) { return c.position; }).value();

        if (cols.length > 1)
        {
            view.displayFormat.plot.latitudeId = cols[0].tableColumnId;
            view.displayFormat.plot.longitudeId = cols[1].tableColumnId;
        }
        if (cols.length > 2)
        { view.displayFormat.plot.descriptionId = cols[2].tableColumnId; }
    }

    var colObj = view.displayFormat.plot || view.displayFormat;

    _.each(['latitudeId', 'longitudeId', 'titleId', 'descriptionId'], function(n)
    {
        if ($.isBlank(view.displayFormat.plot[n]) && !$.isBlank(colObj[n]))
        { view.displayFormat.plot[n] = colObj[n]; }
    });


    _.each({'ycol': 'latitudeId', 'xcol': 'longitudeId',
        'titleCol': 'titleId', 'bodyCol': 'descriptionId'}, function(n, o)
    {
        if ($.isBlank(view.displayFormat.plot[n]) && !$.isBlank(colObj[o]))
        {
            view.displayFormat.plot[n] = _.detect(view.columns, function(c)
                { return c.id == colObj[o]; }).tableColumnId;
        }
    });

    return view;
};

blist.dataset.map.esriToGoogle = function(geometry)
{
    return new google.maps.Polygon({
        paths: _.map(geometry.rings, function(ring, r)
        {
            return _.map(ring, function(point, p)
            {
                var point = geometry.getPoint(r, p);
                if (point.spatialReference.wkid == 102100)
                { point = esri.geometry.webMercatorToGeographic(point); }
                return new google.maps.LatLng(point.y, point.x);
            });
        })
    });
};

blist.dataset.map.esriToBing = function(geometry)
{
    // Bing does not support multiple-ring Polygons. As a result, we're picking
    // the largest ring and using that as the polygon's definition.
    var largestRing = _.max(geometry.rings, function(ring) { return ring.length; });
    var r = _.indexOf(geometry.rings, largestRing);
    return new VEShape(VEShapeType.Polygon, _.map(largestRing, function(point, p)
    {
        var point = geometry.getPoint(r, p);
        if (point.spatialReference.wkid == 102100)
        { point = esri.geometry.webMercatorToGeographic(point); }
        return new VELatLong(point.y, point.x);
    }));
};
