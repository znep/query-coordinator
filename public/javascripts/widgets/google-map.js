(function($)
{
    $.fn.GoogleMap = function(options)
    {
        // Check if object was already created
        var GoogleMap = $(this[0]).data("GoogleMap");
        if (!GoogleMap)
        {
            GoogleMap = new GoogleMapObj(options, this[0]);
        }
        return GoogleMap;
    };

    var GoogleMapObj = function(options, dom)
    {
        this.settings = $.extend({}, GoogleMapObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(GoogleMapObj,
    {
        defaults:
        {
            pageSize: 100
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("GoogleMap", currentObj);

                currentObj._rowsToLoad = [];
                currentObj._markers = {};

                currentObj.map = new google.maps.Map($domObj[0],
                    {
                        zoom: 3,
                        center: new google.maps.LatLng(40.000, -100.000),
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });

                currentObj._bounds = new google.maps.LatLngBounds();

                $domObj.parent().append('<div class="loadingSpinner"></div>');
                $domObj.before('<div id="mapError" class="mainError"></div>');
                $domObj.prev('#mapError').hide();

                loadRows(currentObj,
                    {include_ids_after: currentObj.settings.pageSize});
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            reload: function()
            {
                var mapObj = this;
                mapObj.$dom().prev('#mapError').hide().text('');

                if (mapObj.infoWindow !== undefined) { mapObj.infoWindow.close(); }
                _.each(mapObj._markers, function(m) { m.setMap(null); });
                mapObj._bounds = new google.maps.LatLngBounds();

                mapObj._markers = {};
                mapObj._rowsToLoad = [];

                loadRows(mapObj, {include_ids_after: mapObj.settings.pageSize});
            }
        }
    });

    var loadRows = function(mapObj, args)
    {
        mapObj.$dom().parent().find('.loadingSpinner').removeClass('hidden');
        $.ajax({url: '/views/' + blist.display.viewId + '/rows.json',
                data: args, type: 'GET', dataType: 'json',
                complete: function()
                    { mapObj.$dom().parent().find('.loadingSpinner')
                        .addClass('hidden'); },
                success: function(data) { rowsLoaded(mapObj, data); }});
    };

    var rowsLoaded = function(mapObj, data)
    {
        if (data.meta !== undefined)
        {
            if (!getColumns(mapObj, data.meta.view))
            { getLegacyColumns(mapObj, data.meta.view); }
        }

        if (mapObj._latIndex === undefined ||
            mapObj._longIndex === undefined)
        { return; }

        var rows = data.data;

        var addedMarkers = false;
        var badPoints = false;
        _.each(rows, function(r)
        {
            if (typeof r == 'object')
            {
                var lat = r[mapObj._latIndex];
                var longVal = r[mapObj._longIndex];
                if (lat === null || longVal === null) { return; }
                if (lat < -90 || lat > 90 || longVal < -180 || longVal > 180)
                {
                    badPoints = true;
                    return;
                }
                var ll = new google.maps.LatLng(lat, longVal);

                var hasInfo = mapObj._infoIndex !== undefined &&
                    r[mapObj._infoIndex] !== null;
                var marker = new google.maps.Marker({position: ll,
                    clickable: hasInfo, map: mapObj.map});
                mapObj._markers[r[mapObj._idIndex]] = marker;

                if (hasInfo)
                {
                    marker.infoContent = "<div class='mapInfoContainer" +
                        (mapObj._infoIsRich ? ' richText' : '') + "'>" +
                        r[mapObj._infoIndex] + "</div>";
                    google.maps.event.addListener(marker, 'click',
                        function() { markerClick(mapObj, marker); });
                }

                mapObj._bounds.extend(ll);
                addedMarkers = true;
            }
            else { mapObj._rowsToLoad.push(r); }
        });

        if (badPoints)
        {
            mapObj.$dom().prev('#mapError').show()
                .text('Some points were invalid. ' +
                    'Latitude must be between -90 and 90, and longitude ' +
                    'must be between -180 and 180');
        }
        if (addedMarkers) { mapObj.map.fitBounds(mapObj._bounds); }

        loadMoreRows(mapObj);
    };

    var loadMoreRows = function(mapObj)
    {
        if (mapObj._rowsToLoad === undefined || mapObj._rowsToLoad.length < 1)
        { return; }

        var toLoad = mapObj._rowsToLoad.splice(0, mapObj.settings.pageSize);

        if (toLoad.length > 0) { loadRows(mapObj, { ids: toLoad }); }
    };

    var markerClick = function(mapObj, marker)
    {
        if (mapObj.infoWindow === undefined)
        { mapObj.infoWindow = new google.maps.InfoWindow({maxWidth: 300}); }

        mapObj.infoWindow.setContent(marker.infoContent);
        mapObj.infoWindow.open(mapObj.map, marker);
    };


    var getColumns = function(mapObj, view)
    {
        if (view.displayFormat === undefined ||
            view.displayFormat.latitudeId === undefined)
        { return false; }

        mapObj._infoIsRich = false;
        _.each(view.columns, function(c, i)
        {
            if (c.dataTypeName == 'meta_data' && c.name == 'sid')
            { mapObj._idIndex = i; }
            if (c.tableColumnId == view.displayFormat.latitudeId)
            { mapObj._latIndex = i; }
            if (c.tableColumnId == view.displayFormat.longitudeId)
            { mapObj._longIndex = i; }
            if (c.tableColumnId == view.displayFormat.descriptionId)
            {
                mapObj._infoIndex = i;
                mapObj._infoIsRich = c.renderTypeName == "text" &&
                    c.format !== undefined &&
                    c.format.formatting_option == "Rich";
            }
        });

        return true;
    };

    var getLegacyColumns = function(mapObj, view)
    {
        _.each(view.columns, function(c, i) { c.dataIndex = i; });
        var cols = _.select(view.columns, function(c)
            { return c.dataTypeName != 'meta_data' &&
                (c.flags === undefined || !_.include(c.flags, 'hidden')); });
        cols = _.sortBy(cols, function(c) { return c.position; });

        if (cols.length < 2) { return false; }

        mapObj._idIndex = _.detect(view.columns, function(c)
            { return c.dataTypeName == 'meta_data' && c.name == 'sid'; }).dataIndex;
        mapObj._latIndex = cols[0].dataIndex;
        mapObj._longIndex = cols[1].dataIndex;
        mapObj._infoIsRich = false;
        if (cols.length > 2)
        {
            var infoCol = cols[2];
            mapObj._infoIndex = infoCol.dataIndex;
            mapObj._infoIsRich = infoCol.renderTypeName == "text" &&
                infoCol.format !== undefined &&
                infoCol.format.formatting_option == "Rich";
        }
        return true;
    };

})(jQuery);
