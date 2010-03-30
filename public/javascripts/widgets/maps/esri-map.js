(function($)
{
    $.socrataMap.esri = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataMap.esri.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataMap.esri, $.socrataMap.extend(
    {
        defaults:
        {
            defaultLayers: [{type:'tile', url:'http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer'}],
            defaultZoom: 11
        },

        prototype:
        {
            initializeMap: function()
            {
                var mapObj = this;
                mapObj.$dom().addClass('tundra');

                dojo.require("esri.map");
                var options = {};
                if (mapObj._displayConfig.zoom !== undefined)
                { options.zoom = mapObj._displayConfig.zoom; }

                mapObj._extentSet = mapObj._displayConfig.extent !== undefined;
                if (mapObj._extentSet)
                { options.extent = new esri.geometry
                    .Extent(mapObj._displayConfig.extent); }
                mapObj.map = new esri.Map(mapObj.$dom()[0].id, options);

                var layers = mapObj._displayConfig.layers ||
                    mapObj.settings.defaultLayers;
                if (!$.isArray(layers) || !layers.length)
                {
                    mapObj.showError("No layers defined");
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

                    mapObj.map.addLayer(layer);
                }

                dojo.connect(mapObj.map, 'onLoad', function()
                {
                    mapObj._mapLoaded = true;
                    if (mapObj._dataLoaded)
                    { mapObj.renderData(mapObj._rows); }
                });

                // Not sure we want to be saving every single update a user
                // makes to a map
                //mapObj.map.onPanEnd = function(extent)
                //{ mapObj.updateMap({ extent: extent }); }

                //mapObj.map.onZoomEnd = function(extent, factor)
                //{ mapObj.updateMap({ extent: extent, zoom: factor }); }

                mapObj._multipoint = new esri.geometry.Multipoint
                    (mapObj.map.spatialReference);
            },

            handleRowsLoaded: function(rows)
            {
                var mapObj = this;
                mapObj._dataLoaded = true;
                if (mapObj._mapLoaded)
                { mapObj.renderData(rows); }
                else
                {
                    if (mapObj._rows === undefined) { mapObj._rows = []; }
                    mapObj._rows = mapObj._rows.concat(rows);
                }
            },

            renderPoint: function(latVal, longVal, title, info, rowId)
            {
                var mapObj = this;
                // Create the map symbol
                var symbol = getESRIMapSymbol(mapObj);

                var point = new esri.geometry.Point(longVal, latVal,
                        mapObj.map.spatialReference);
                var hasContent = title !== null || info !== null;
                mapObj.map.graphics.add(new esri.Graphic(point, symbol,
                    { title: title, body : info },
                    hasContent ? new esri.InfoTemplate("${title}", "${body}") : null
                ));

                if (!mapObj._extentSet) { this._multipoint.addPoint(point); }
            },

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._extentSet) { return; }

                var extent = mapObj._multipoint.getExtent();
                // Adjust x & y by about 10% so points aren't on the very edge
                // Use max & min diff since lat/long may be negative, and we
                // want to expand the viewport.  Using height/width may cause it
                // to shrink
                var xadj = (extent.xmax - extent.xmin) * 0.05;
                var yadj = (extent.ymax - extent.ymin) * 0.05;

                if (xadj == 0 || yadj == 0)
                {
                    mapObj.map.centerAndZoom(extent.getCenter(),
                        mapObj.settings.defaultZoom);
                }
                else
                {
                    extent.xmax += xadj;
                    extent.xmin -= xadj;
                    extent.ymax += yadj;
                    extent.ymin -= yadj;
                    mapObj.map.setExtent(extent);
                }
            },

            resizeHandle: function(event)
            {
                if (this.map !== undefined)
                { this.map.resize(); }
            },

            resetData: function()
            {
                var mapObj = this;
                mapObj._multipoint = new esri.geometry.Multipoint
                    (mapObj.map.spatialReference);
                mapObj.map.graphics.clear();
            }
        }
    }));

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

})(jQuery);
