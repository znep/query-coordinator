(function($) {
    var initializeEsri = function(config)
    {
        dojo.require("esri.map");

        var map;
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

        map.onPanEnd = function(extent)
        {
            updateMap({ extent: extent });
        };

        map.onZoomEnd = function(extent, factor)
        {
            updateMap({ extent: extent, zoom: factor });
        };

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

        return this;
    }
})(jQuery);
