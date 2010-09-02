(function(){

Dataset.modules['map'] =
{

    _checkValidity: function()
    {
        if (($.isBlank(this.displayFormat.plot.latitudeId) ||
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
                        view.visibleColumns[index].tableColumnId;
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
