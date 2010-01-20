(function($) {
    var initializeEsri = function(config)
    {
        dojo.require("esri.map");

        var self = this;
        var map;
        var plot = config.plot;
        var mapLoaded;
        var dataLoaded;
        
        (function() {
            var options = {
                //nav: true
            };
            if (config.zoom != undefined)
                options.zoom = config.zoom;
            if (config.extent != undefined)
                options.extent = new esri.geometry.Extent(config.extent);
            map = new esri.Map(this[0].id, options);
        }).call(this);

        function updateMap(settings)
        {
            // Can't save settings w/ out editable view
            if (!blist.display.viewId || !blist.display.editable)
                return;

            // Gather state information
            var zoom = settings.zoom;
            if (zoom != undefined)
                config.zoom = zoom;
            var extent = settings.extent;
            if (extent != undefined)
                config.extent = {
                    xmin: extent.xmin,
                    ymin: extent.ymin,
                    xmax: extent.xmax,
                    ymax: extent.ymax,
                    spatialReference: {
                        wkid: extent.spatialReference.wkid
                    }
                };

            // Write to server
            $.ajax(
            {
                url: '/views/' + blist.display.viewId + '.json',
                type: 'PUT',
                contentType: 'application/json',
                data: $.json.serialize(
                {
                    displayFormat: config
                })
            });
        }

        var createMapSymbol = function(config)
        {
            var symbolConfig = {
                backgroundColor: [ 255, 0, 255, .5 ],
                size: 10,
                symbol: 'circle',
                borderColor: [ 0, 0, 0, .5 ],
                borderStyle: 'solid',
                borderWidth: 1
            };
            if (typeof config == "object")
                $.extend(symbolConfig, config);
            var symbolBackgroundColor = new dojo.Color(symbolConfig.backgroundColor);
            var symbolBorderColor = new dojo.Color(symbolConfig.borderColor);
            var symbolBorder = new esri.symbol.SimpleLineSymbol(
                symbolConfig.borderStyle,
                symbolBorderColor,
                symbolConfig.borderWidth
            );
            return new esri.symbol.SimpleMarkerSymbol(
                symbolConfig.symbol,
                symbolConfig.size,
                symbolBorder,
                symbolBackgroundColor
            );
        }

        var addPoints = function()
        {
            var model = this.blistModel();

            // Retrieve column by ID if IDs are present
            var xcol = model.findConfiguredColumn(plot.xcol, [ "x", "lat", "latitude" ]);
            var ycol = model.findConfiguredColumn(plot.ycol, [ "y", "long", "longitude" ]);
            var titleCol = model.findConfiguredColumn(plot.titleCol, [ "title", "caption", "description" ]);
            var bodyCol = model.findConfiguredColumn(plot.bodyCol, [ "body", "content", "address" ]);

            // If do not have point columns then give up
            if (xcol == undefined || ycol == undefined)
                return;

            // Retrieve the column indices
            xcol = xcol.dataIndex;
            ycol = ycol.dataIndex;
            titleCol = titleCol.dataIndex;
            bodyCol = bodyCol.dataIndex;

            // Create the map symbol
            var symbol = createMapSymbol(plot);

            // Add the points
            var rows = model.rows();
            for (i = 0; i < rows.length; i++) {
                var row = rows[i];
                var x = row[xcol];
                var y = row[ycol];
                if (x == undefined || y == undefined)
                    continue;
                map.graphics.add(new esri.Graphic(
                    new esri.geometry.Point(x, y, map.spatialReference),
                    symbol,
                    { title: titleCol == undefined ? 'Title' : row[titleCol], body : bodyCol == undefined ? 'No details available' : row[bodyCol] },
                    new esri.InfoTemplate("${title}", "${body}")
                ));
            }
        }

        map.onPanEnd = function(extent)
        {
            updateMap({ extent: extent });
        }

        map.onZoomEnd = function(extent, factor)
        {
            updateMap({ extent: extent, zoom: factor });
        }

        dojo.connect(map, 'onLoad', function()
        {
            mapLoaded = true;
            if (dataLoaded && plot)
                addPoints.call(self);
        });

        this.bind("resize", function()
        {
            map.resize();
        });

        var layers = config.layers;
        if (!$.isArray(layers) || !layers.length)
        {
            this.html("No layers defined");
            return;
        }

        for (var i = 0; i < layers.length; i++)
        {
            var layer = layers[i];
            if (!layer || !layer.url)
                continue;

            switch (layer.type) {
            case "tile":
                var constructor = esri.layers.ArcGISTiledMapServiceLayer;
                break;

            case "dynamic":
                constructor = esri.layers.ArcGISDynamicMapServiceLayer;
                break;

            case "image":
                constructor = esri.layers.ArcGISImageServiceLayer;
                break;

            default:
                // Invalid layer type
                continue;
            }

            layer = new constructor(layer.url, layer.options);

            map.addLayer(layer);
        }

        if (plot) {
            var model = this.blistModel();

            model.ajax({
                url: '/views/' + blist.display.viewId + '/rows.json',
                cache: false
            });

            this.bind("after_load", function() {
                dataLoaded = true;
                if (mapLoaded)
                    addPoints.call(self);
            });
        }
    }

    var initializers = {
        esri: initializeEsri
    }
    
    $.fn.blistMap = function(config) {
        if (config == null)
        {
            this.html("Missing map configuration");
            return this;
        }
        var type = config.type;
        if (type == null)
        {
            this.html("Missing map type");
            return this;
        }
        var initialize = initializers[config.type];
        if (initialize == null)
        {
            this.html("Unrecognized map type \"" + config.type + "\"");
            return this;
        }
    
        initialize.call(this, config);
        this.addClass('tundra');

        return this;
    }
})(jQuery);
