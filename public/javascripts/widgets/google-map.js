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

                currentObj._displayConfig = currentObj.settings.displayFormat || {};
                currentObj._type = currentObj._displayConfig.type || 'google';

                currentObj._rowsLeft = 0;
                currentObj._rowsLoaded = 0;
                currentObj._markers = {};

                if (currentObj._type == 'esri')
                {
                    $domObj.addClass('tundra');
                    if (currentObj._displayConfig.plot === undefined)
                    {
                        showError(currentObj, "No columns defined");
                        return;
                    }

                    dojo.require("esri.map");
                    var options = {};
                    if (currentObj._displayConfig.zoom !== undefined)
                    { options.zoom = currentObj._displayConfig.zoom; }
                    if (currentObj._displayConfig.extent !== undefined)
                    { options.extent = new esri.geometry
                        .Extent(currentObj._displayConfig.extent); }
                    currentObj.map = new esri.Map($domObj[0].id, options);

                    var layers = currentObj._displayConfig.layers;
                    if (!$.isArray(layers) || !layers.length)
                    {
                        showError(currentObj, "No layers defined");
                        return;
                    }

                    for (var i = 0; i < layers.length; i++)
                    {
                        var layer = layers[i];
                        if (layer === undefined || layer === null ||
                            layer.url === undefined)
                        { continue; }

                        switch (layer.type)
                        {
                            case "tile":
                                var constructor =
                                    esri.layers.ArcGISTiledMapServiceLayer;
                                break;

                            case "dynamic":
                                constructor =
                                    esri.layers.ArcGISDynamicMapServiceLayer;
                                break;

                            case "image":
                                constructor = esri.layers.ArcGISImageServiceLayer;
                                break;

                            default:
                                // Invalid layer type
                                continue;
                        }

                        layer = new constructor(layer.url, layer.options);

                        currentObj.map.addLayer(layer);

                        dojo.connect(currentObj.map, 'onLoad', function()
                        {
                            currentObj._mapLoaded = true;
                            if (currentObj._dataLoaded)
                            { renderData(currentObj, currentObj._rows); }
                        });

                        currentObj.map.onPanEnd = function(extent)
                        { updateMap(currentObj, { extent: extent }); }

                        currentObj.map.onZoomEnd = function(extent, factor)
                        { updateMap(currentObj, { extent: extent, zoom: factor }); }

                    }
                }
                else if (currentObj._type == 'google')
                {
                    currentObj.map = new google.maps.Map($domObj[0],
                        {
                            zoom: 3,
                            center: new google.maps.LatLng(40.000, -100.000),
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        });

                    currentObj._bounds = new google.maps.LatLngBounds();
                }

                $domObj.resize(function(e) { resizeHandle(currentObj, e); });

                $domObj.parent().append('<div class="loadingSpinnerContainer">' +
                    '<div class="loadingSpinner"></div></div>');
                $domObj.before('<div id="mapError" class="mainError"></div>');
                $domObj.prev('#mapError').hide();

                loadRows(currentObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: currentObj.settings.pageSize});
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
                mapObj._rowsLeft = 0;
                mapObj._rowsLoaded = 0;

                loadRows(mapObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: mapObj.settings.pageSize});
            }
        }
    });

    var showError = function(mapObj, errorMessage)
    {
        mapObj.$dom().prev('#mapError').show().text(errorMessage);
    };

    var loadRows = function(mapObj, args)
    {
        mapObj.$dom().parent().find('.loadingSpinnerContainer')
            .removeClass('hidden');
        $.ajax({url: '/views/' + blist.display.viewId + '/rows.json',
                data: args, type: 'GET', dataType: 'json',
                complete: function()
                    { mapObj.$dom().parent().find('.loadingSpinnerContainer')
                        .addClass('hidden'); },
                success: function(data) { rowsLoaded(mapObj, data); }});
    };

    var rowsLoaded = function(mapObj, data)
    {
        if (data.meta !== undefined)
        {
            if (!getColumns(mapObj, data.meta.view))
            { getLegacyColumns(mapObj, data.meta.view); }
            mapObj._rowsLeft = data.meta.totalRows - mapObj._rowsLoaded;
        }

        var rows = data.data.data || data.data;
        mapObj._rowsLoaded += rows.length;
        mapObj._rowsLeft -= rows.length;
        loadMoreRows(mapObj);

        if (mapObj._type == 'google')
        { renderData(mapObj, rows); }
        else if (mapObj._type == 'esri')
        {
            mapObj._dataLoaded = true;
            if (mapObj._mapLoaded)
            { renderData(mapObj, rows); }
            else
            {
                if (mapObj._rows === undefined) { mapObj._rows = []; }
                mapObj._rows = mapObj._rows.concat(rows);
            }
        }
    };

    var renderData = function(mapObj, rows)
    {
        if (mapObj._latIndex === undefined ||
            mapObj._longIndex === undefined)
        { return; }

        var addedMarkers = false;
        var badPoints = false;
        _.each(rows, function(r)
        {
            var lat = r[mapObj._latIndex];
            var longVal = r[mapObj._longIndex];
            if (lat === null || longVal === null) { return; }
            if (lat < -90 || lat > 90 || longVal < -180 || longVal > 180)
            {
                badPoints = true;
                return;
            }
            var info = mapObj._infoIndex !== undefined ?
                r[mapObj._infoIndex] : null;
            var title = mapObj._titleIndex !== undefined ?
                    r[mapObj._titleIndex] : null;
            var hasInfo = info !== null;

            if (mapObj._type == 'google')
            {
                var ll = new google.maps.LatLng(lat, longVal);
                var marker = new google.maps.Marker({position: ll,
                    title: title, clickable: hasInfo, map: mapObj.map});
                mapObj._markers[r[mapObj._idIndex]] = marker;

                if (hasInfo)
                {
                    marker.infoContent = "<div class='mapInfoContainer" +
                        (mapObj._infoIsRich ? ' richText' : '') + "'>" +
                        info + "</div>";
                    google.maps.event.addListener(marker, 'click',
                        function() { markerClick(mapObj, marker); });
                }
                mapObj._bounds.extend(ll);
            }
            else if (mapObj._type == 'esri')
            {
                // Create the map symbol
                var symbol = getESRIMapSymbol(mapObj);

                mapObj.map.graphics.add(new esri.Graphic(
                    new esri.geometry.Point(longVal, lat,
                        mapObj.map.spatialReference),
                    symbol,
                    { title: title, body : info },
                    new esri.InfoTemplate("${title}", "${body}")
                ));
            }

            addedMarkers = true;
        });

        if (badPoints)
        {
            showError(mapObj, 'Some points were invalid. ' +
                    'Latitude must be between -90 and 90, and longitude ' +
                    'must be between -180 and 180');
        }

        if (addedMarkers)
        {
            if (mapObj._type == 'google')
            { mapObj.map.fitBounds(mapObj._bounds); }
        }
    };

    var loadMoreRows = function(mapObj)
    {
        if (mapObj._rowsLeft < 1) { return; }

        var toLoad = Math.min(mapObj._rowsLeft, mapObj.settings.pageSize);

        loadRows(mapObj, { method: 'getByIds', start: mapObj._rowsLoaded,
            length: toLoad });
    };

    var markerClick = function(mapObj, marker)
    {
        if (mapObj.infoWindow === undefined)
        { mapObj.infoWindow = new google.maps.InfoWindow({maxWidth: 300}); }

        mapObj.infoWindow.setContent(marker.infoContent);
        mapObj.infoWindow.open(mapObj.map, marker);
    };

    var getESRIMapSymbol = function(mapObj)
    {
        if (mapObj._esriSymbol === undefined)
        {
            var symbolConfig = {
                backgroundColor: [ 255, 0, 255, .5 ],
                size: 10,
                symbol: 'circle',
                borderColor: [ 0, 0, 0, .5 ],
                borderStyle: 'solid',
                borderWidth: 1
            };

            $.extend(symbolConfig, mapObj._displayConfig.plot);
            var symbolBackgroundColor =
                new dojo.Color(symbolConfig.backgroundColor);
            var symbolBorderColor = new dojo.Color(symbolConfig.borderColor);
            var symbolBorder = new esri.symbol.SimpleLineSymbol(
                    symbolConfig.borderStyle,
                    symbolBorderColor,
                    symbolConfig.borderWidth
            );
            mapObj._esriSymbol = new esri.symbol.SimpleMarkerSymbol(
                    symbolConfig.symbol,
                    symbolConfig.size,
                    symbolBorder,
                    symbolBackgroundColor
            );
        }
        return mapObj._esriSymbol;
    };

    var resizeHandle = function(mapObj, event)
    {
        if (mapObj._type == 'esri') { mapObj.map.resize(); }
    };

    var updateMap = function(mapObj, settings)
    {
        // Can't save settings w/ out editable view
        if (!blist.display.editable) { return; }

        // Gather state information
        var zoom = settings.zoom;
        if (zoom !== undefined) { mapObj._displayConfig.zoom = zoom; }
        var extent = settings.extent;
        if (extent !== undefined)
        {
            mapObj._displayConfig.extent = {
                xmin: extent.xmin,
                ymin: extent.ymin,
                xmax: extent.xmax,
                ymax: extent.ymax,
                spatialReference: { wkid: extent.spatialReference.wkid }
            };
        }

        // Write to server
        $.ajax({ url: '/views/' + blist.display.viewId + '.json',
                type: 'PUT',
                contentType: 'application/json',
                data: $.json.serialize( { displayFormat: mapObj._displayConfig })
            });
    };

    var getColumns = function(mapObj, view)
    {
        if (view.displayFormat === undefined ||
            (view.displayFormat.plot === undefined &&
             view.displayFormat.latitudeId === undefined))
        { return false; }

        mapObj._infoIsRich = false;
        var colFormat = view.displayFormat.plot || view.displayFormat;
        _.each(view.columns, function(c, i)
        {
            if (c.dataTypeName == 'meta_data' && c.name == 'sid')
            { mapObj._idIndex = i; }

            if (c.tableColumnId == colFormat.latitudeId || c.id == colFormat.ycol)
            { mapObj._latIndex = i; }
            if (c.tableColumnId == colFormat.longitudeId || c.id == colFormat.xcol)
            { mapObj._longIndex = i; }

            if (c.tableColumnId == colFormat.titleId || c.id == colFormat.titleCol)
            { mapObj._titleIndex = i; }
            if (c.tableColumnId == colFormat.descriptionId ||
                c.id == colFormat.bodyCol)
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
