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
