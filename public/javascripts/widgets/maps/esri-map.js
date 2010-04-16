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
            defaultLayers: [{type:'tile', url:'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'}],
            defaultZoom: 11,
            taskMax: 10
        },

        prototype:
        {
            initializeMap: function()
            {
                var mapObj = this;
                mapObj.$dom().addClass('tundra');

                dojo.require("esri.map");
                dojo.require('esri.tasks.geometry');
                // Apparently dojo is not loaded at the same time jQuery is; so
                // while this plugin isn't called until jQuery onLoad, we still need
                // to attach to dojo's onLoad or we get failures in WebKit
                dojo.addOnLoad(function()
                {
                    var options = {};
                    if (mapObj._displayConfig.zoom !== undefined)
                    { options.zoom = mapObj._displayConfig.zoom; }

                    mapObj._extentSet = mapObj._displayConfig.extent !== undefined;
                    if (mapObj._extentSet)
                    { options.extent = new esri.geometry
                        .Extent(mapObj._displayConfig.extent); }
                    mapObj.map = new esri.Map(mapObj.$dom().attr('id'), options);

                    dojo.connect(mapObj.map, 'onLoad', function()
                    {
                        mapObj._mapLoaded = true;
                        if (mapObj._dataLoaded)
                        { mapObj.renderData(mapObj._rows); }
                    });

                    mapObj._geoService = new esri.tasks.GeometryService('http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');

                    var layers = mapObj._displayConfig.layers ||
                        mapObj.settings.defaultLayers;
                    if (!$.isArray(layers) || !layers.length)
                    {
                        mapObj.showError("No layers defined");
                        return;
                    }

                    var layersLoaded = 0;
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

                        dojo.connect(layer, 'onLoad', function()
                        {
                            if (this.loaded) { layersLoaded++; }
                            if (layersLoaded >= layers.length)
                            { mapObj.populateLayers(); }
                        });

                        mapObj.map.addLayer(layer);
                    }

                    // Not sure we want to be saving every single update a user
                    // makes to a map
                    //mapObj.map.onPanEnd = function(extent)
                    //{ mapObj.updateMap({ extent: extent }); }

                    //mapObj.map.onZoomEnd = function(extent, factor)
                    //{ mapObj.updateMap({ extent: extent, zoom: factor }); }

                    mapObj._multipoint = new esri.geometry.Multipoint
                        (mapObj.map.spatialReference);
                });
            },

            getLayers: function()
            {
                var mapObj = this;
                var layers = [];
                if (mapObj.map === undefined) { return layers; }

                _.each(mapObj.map.layerIds, function(lId, i)
                {
                    var l = mapObj.map.getLayer(lId);
                    if (!l.loaded) { return; }

                    var lName = 'Layer ' + i;
                    if (l.layerInfos !== undefined && l.layerInfos.length > 0)
                    {
                        lName = l.layerInfos[0].name;
                    }
                    layers.push({id: lId, name: lName, visible: l.visible});
                });
                return layers;
            },

            setLayer: function(layerId, isDisplayed)
            {
                var mapObj = this;
                var layer = mapObj.map.getLayer(layerId);
                if (layer !== undefined && layer !== null)
                {
                    if (isDisplayed) { layer.show(); }
                    else { layer.hide(); }
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

                mapObj._toProject = mapObj._toProject || [];
                var point = new esri.geometry.Point(longVal, latVal,
                        new esri.SpatialReference({wkid: 4326}));
                var hasContent = title !== null || info !== null;
                mapObj._toProject.push(new esri.Graphic(point, symbol,
                    { title: title, body : info }));
            },

            pointsRendered: function()
            {
                var mapObj = this;
                if (_.isUndefined(mapObj._toProject)) { return; }

                var curToProject = mapObj._toProject;
                delete mapObj._toProject;
                var totalLength = curToProject.length;
                var projectedCount = 0;

                var projectFunc = function(graphics)
                {
                    projectedCount += graphics.length;
                    _.each(graphics, function(g)
                    {
                        if (g.attributes.title !== null ||
                            g.attributes.body !== null)
                        { g.setInfoTemplate(
                            new esri.InfoTemplate("${title}", "${body}")); }
                        mapObj.map.graphics.add(g);
                        if (!mapObj._extentSet)
                        { mapObj._multipoint.addPoint(g.geometry); }
                    });
                    if (projectedCount >= totalLength)
                    { mapObj.adjustBounds(); }
                };

                while (curToProject.length > 0)
                {
                    var reqProject =
                        curToProject.splice(0, mapObj.settings.taskMax);
                    if (mapObj.map.spatialReference.wkid !=
                        reqProject[0].geometry.spatialReference.wkid)
                    {
                        mapObj._geoService.project(reqProject,
                            mapObj.map.spatialReference, projectFunc);
                    }
                    else { projectFunc(reqProject); }
                }
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
                // ESRI can't handle being resized to 0
                if (this.map !== undefined && this.$dom().height() > 0)
                { this.map.resize(); }
            },

            resetData: function()
            {
                var mapObj = this;
                mapObj._multipoint = new esri.geometry.Multipoint
                    (mapObj.map.spatialReference);
                mapObj.map.graphics.clear();
                mapObj.map.infoWindow.hide();
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
