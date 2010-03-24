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
        prototype:
        {
            initializeMap: function()
            {
                var mapObj = this;
                mapObj.$dom().addClass('tundra');
                if (mapObj._displayConfig.plot === undefined)
                {
                    mapObj.showError("No columns defined");
                    return;
                }

                dojo.require("esri.map");
                var options = {};
                if (mapObj._displayConfig.zoom !== undefined)
                { options.zoom = mapObj._displayConfig.zoom; }
                if (mapObj._displayConfig.extent !== undefined)
                { options.extent = new esri.geometry
                    .Extent(mapObj._displayConfig.extent); }
                mapObj.map = new esri.Map(mapObj.$dom()[0].id, options);

                var layers = mapObj._displayConfig.layers;
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

                    dojo.connect(mapObj.map, 'onLoad', function()
                    {
                        mapObj._mapLoaded = true;
                        if (mapObj._dataLoaded)
                        { mapObj.renderData(mapObj._rows); }
                    });

                    mapObj.map.onPanEnd = function(extent)
                    { mapObj.updateMap({ extent: extent }); }

                    mapObj.map.onZoomEnd = function(extent, factor)
                    { mapObj.updateMap({ extent: extent, zoom: factor }); }

                }
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

                mapObj.map.graphics.add(new esri.Graphic(
                    new esri.geometry.Point(longVal, latVal,
                        mapObj.map.spatialReference),
                    symbol,
                    { title: title, body : info },
                    new esri.InfoTemplate("${title}", "${body}")
                ));
            },

            resizeHandle: function(event)
            {
                this.map.resize();
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
