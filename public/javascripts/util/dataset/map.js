(function(){

Dataset.modules['map'] =
{

    _checkValidity: function()
    {
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
            view.displayFormat.type = 'heatmap';
            var region = view.displayFormat.region || '';
            view.displayFormat.heatmap = {
                type: region.toLowerCase().match(/^usa?$/) ? 'state' : 'countries'
            };

            _.each(['locationId', 'quantityId', 'descriptionId', 'redirectId'],
            function (key, index)
            {
                if (index < view.visibleColumns.length)
                {
                    view.displayFormat.plot[key] =
                        view.visibleColumns[index].tableColumnId;
                }
            });
        }

        if (isOldest)
        {
            if (view.visibleColumns.length > 1)
            {
                view.displayFormat.plot.latitudeId =
                    view.visibleColumns[0].tableColumnId;
                view.displayFormat.plot.longitudeId =
                    view.visibleColumns[1].tableColumnId;
            }
            if (view.visibleColumns.length > 2)
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
                { view.displayFormat.plot[n] = colObj[n]; }
            });


        _.each({'ycol': 'latitudeId', 'xcol': 'longitudeId',
            'titleCol': 'titleId', 'bodyCol': 'descriptionId'}, function(n, o)
        {
            if ($.isBlank(view.displayFormat.plot[n]) && !$.isBlank(colObj[o]))
            {
                view.displayFormat.plot[n] =
                    view.columnForID(colObj[o]).tableColumnId;
            }
        });
    }
};

})();
