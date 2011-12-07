(function($)
{
    $.Control.registerMixin('esri', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            mapObj._baseLayers = _.map(mapObj._displayFormat.layers || mapObj.settings.defaultLayers,
                function(layer, i)
                {
                    var name = layer.url.match(/services\/([A-Za-z0-9_]+)\/MapServer/)[1]
                        .replace(/_/g, ' ');
                    var baseLayer = new OpenLayers.Layer.ArcGISCache(name, layer.url, {
                        isBaseLayer: i == 0,
                        url: layer.url,
                        opacity: (layer.options || {}).opacity || 1.0,
                        projection: 'EPSG:102100',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(-20037508.342787, 20037508.342787),
                        maxExtent: new OpenLayers.Bounds(-20037508.34, -19971868.8804086,
                                                          20037508.34,  19971868.8804086),
                        transitionEffect: 'resize'
                    });
                    mapObj.map.addLayer(baseLayer);
                    mapObj.map.setLayerIndex(baseLayer, i);
                    return baseLayer;
                });
        }

/*
        initializeVisualization: function()
        {
            return this._super();

            var mapObj = this;
            mapObj.$dom().addClass('tundra');

            dojo.require("esri.arcgis.utils");
            dojo.require("esri.layers.FeatureLayer");
            dojo.require("esri.layers.wms");
            dojo.require("esri.map");
            // Apparently dojo is not loaded at the same time jQuery is; so
            // while this plugin isn't called until jQuery onLoad, we still need
            // to attach to dojo's onLoad or we get failures in WebKit
            dojo.addOnLoad(function()
            {
                var options = {};
                if (!$.isBlank(mapObj._displayFormat.zoom))
                { options.zoom = mapObj._displayFormat.zoom; }

                if (mapObj._displayFormat.viewport)
                {
                    var viewport = mapObj._displayFormat.viewport;
                    options.extent = mapObj.viewportToExtent(viewport);
                }

                // The proxy is used only for WMS GetCapabilities requests, which
                // is only needed for WMS layers.
                esri.config.defaults.io.proxyUrl = "/api/proxy";

                mapObj.map = new esri.Map(mapObj.$dom().attr('id'), options);

                dojo.connect(mapObj.map, 'onLoad', function()
                {
                    mapObj._mapLoaded = true;
                    mapObj._graphicsLayer = mapObj.map.graphics;

                    var updateEvents = function()
                    {
                        mapObj._topmostLayer = mapObj.map.getLayer(_.last(mapObj.map.layerIds));
                        if (!mapObj._heatingEvents) { mapObj._heatingEvents = []; }
                        else
                        { _.each(mapObj._heatingEvents, function(e) { dojo.disconnect(e); }); }

                        mapObj._heatingEvents.push(
                            dojo.connect(mapObj._topmostLayer, 'onUpdateStart', function()
                            { mapObj._updatingLayer = true; }));
                        mapObj._heatingEvents.push(
                            dojo.connect(mapObj._topmostLayer, 'onUpdateEnd', function()
                            {
                                mapObj._updatingLayer = false;
                                if (mapObj._needsCanvasHeatmapConversion
                                    && _.isFunction(mapObj._convertHeatmap))
                                { mapObj._convertHeatmap(this); }
                            }));
                    }

                    dojo.connect(mapObj.map, 'onLayerReorder', updateEvents);
                    updateEvents();

                    dojo.connect(mapObj.map.infoWindow, 'onHide', function()
                    {
                        if (mapObj._resetInfoWindow)
                        {
                            delete mapObj._resetInfoWindow;
                            return;
                        }

                        mapObj._infoOpen = false;
                        // Hide all selected rows
                        if ($.subKeyDefined(mapObj._primaryView, 'highlightTypes.select'))
                        {
                            mapObj._primaryView.unhighlightRows(
                                _.values(mapObj._primaryView.highlightTypes.select), 'select');
                        }
                    });

                    mapObj.mapLoaded();

                    _.each(mapObj._dataViews, function(view)
                        {
                            if (mapObj._dataLoaded)
                            { mapObj.renderData(view._rows, view); }
                            if (mapObj._clustersLoaded)
                            { mapObj.renderClusters(mapObj._byView[view.id]
                                                            ._clusters, view); }
                        });
                });

                var layers = mapObj._displayFormat.layers ||
                    mapObj.settings.defaultLayers;
                if (!$.isArray(layers) || !layers.length)
                {
                    mapObj.showError("No layers defined");
                    return;
                }

                if (mapObj._wms)
                {
                    var wmsLayerNames = mapObj._wms.layers.split(",");

                    _.each(wmsLayerNames, function(layerName)
                    {
                        layers.push({
                            type: "wms",
                            url: mapObj._wms.url,
                            options: {
                                visibleLayers: [ layerName ],
                                imageFormat: "png"
                            }
                        });
                    })
                }

                processWebappLayers(mapObj, _.select(layers, function(layer, index)
                {
                    if (layer.url == 'webapp')
                    {
                        layer.position = index;
                        return true;
                    }
                    return false;
                }));

                var layersLoaded = 0;
                for (var i = 0; i < layers.length; i++)
                {
                    var layer = layers[i];
                    if ($.isBlank(layer) ||
                        ($.isBlank(layer.url) && $.isBlank(layer.custom_url)))
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

                        case "wms":
                            constructor = esri.layers.WMSLayer;
                            break;

                        default:
                            // Invalid layer type
                            continue;
                    }

                    layer = new constructor(layer.custom_url || layer.url,
                        layer.options);

                    dojo.connect(layer, 'onLoad', function()
                    {
                        if (this.loaded) { layersLoaded++; }
                        mapObj.map.addLayer(this);
                        if (layersLoaded >= layers.length)
                        {
                            dojo.connect(mapObj._graphicsLayer, 'onClick',
                                function(evt)
                                { handleGraphicClick(mapObj, evt); });

                            _.each(mapObj._dataViews, function(view)
                            {
                                if (view.renderWithArcGISServer())
                                { mapObj._attachMapServer(view); }
                            });

                            mapObj.populateLayers();
                            if (mapObj._primaryView.snapshotting)
                            {
                                setTimeout(mapObj._primaryView.takeSnapshot, 2000);
                            }
                        }
                    });
                }

                mapObj._multipoint = new esri.geometry.Multipoint
                    (mapObj.map.spatialReference);

                mapObj.buildIdentifyTask();

                mapObj.$dom().find('.infowindow .hide').removeClass('hide')
                    .addClass('hide_infowindow');
            });
        },

        viewportToExtent: function(viewport)
        {
            var mapObj = this;
            viewport = viewport instanceof esri.geometry.Extent
                ? viewport
                : new esri.geometry.Extent(
                    viewport.xmin, viewport.ymin, viewport.xmax, viewport.ymax,
                    new esri.SpatialReference({ wkid: viewport.sr }));
            if (viewport.spatialReference.wkid == 4326
              && (!mapObj.map || isWebMercatorSpatialReference(mapObj.map)))
            { viewport = esri.geometry.geographicToWebMercator(viewport); }
            return viewport;
        }
*/
    }, {
        defaultLayers: [{type:'tile', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'}],
        defaultZoom: 11
    }, 'socrataMap');

/*
    var processWebappLayers = function(mapObj, layers)
    {
        _.each(layers, function(webapp, index)
        {
            if (!webapp.options) { webapp.options = {}; }

            mapObj._addedWebapps = $.makeArray(mapObj._addedWebapps);
            if (_.include(mapObj._addedWebapps, webapp.webappid))
            { return; }
            mapObj._addedWebapps.push(webapp.webappid);

            webapp.layers = { base: [], operational: [] };
            var callbacksPending;
            var itemDeferred = esri.arcgis.utils.getItem(webapp.webappid);
            itemDeferred.addCallback(function(itemInfo)
            {
                webapp.viewport = new esri.geometry.Extent(
                    itemInfo.item.extent[0][0], itemInfo.item.extent[0][1],
                    itemInfo.item.extent[1][0], itemInfo.item.extent[1][1],
                    new esri.SpatialReference({wkid:4326})
                );

                callbacksPending = itemInfo.itemData.baseMap.baseMapLayers.length +
                    itemInfo.itemData.operationalLayers.length;
                webapp.layerCount = callbacksPending;
                var processLayer = function(layer, type)
                {
                    var options = {
                        opacity: layer.opacity * (webapp.options.opacity || 1),
                        visible: layer.visibility
                    };
                    esri.arcgis.utils._getServiceInfo(layer.url).addCallback(
                        function(layerInfo)
                        {
                            webapp.layers[type].push(
                                new layerType(layerInfo)(layer.url, options));
                            var newLayer = _.last(webapp.layers[type]);
                            newLayer.resourceInfo = layerInfo;
                            if (newLayer.setVisibleLayers)
                            { newLayer.setVisibleLayers(layer.visibleLayers); }

                            callbacksPending--;
                            if (callbacksPending == 0)
                            { integrateLayersIntoMap(mapObj, webapp); }
                        });
                };
                _.each(itemInfo.itemData.baseMap.baseMapLayers, function(layer)
                { processLayer(layer, 'base'); });
                _.each(itemInfo.itemData.operationalLayers, function(layer)
                { processLayer(layer, 'operational'); });
            }).addErrback(function(itemInfo)
            {
                mapObj.showError('Webapp ID "' + webapp.webappid +
                                 '" is not a valid ID.');
            });
        });
    };

    var integrateLayersIntoMap = function(mapObj, webapp)
    {
        // Untested: Shifting position appropriately to correctly insert layers.
        _.each(mapObj._displayFormat.layers, function(layer, index)
        {
            if (layer.position && index > webapp.position)
            { layer.position += webmapp.layerCount-1; }
        });

        var layersToLoad = webapp.layerCount;
        var position = webapp.position;
        var layerReady = function()
        {
            layersToLoad--;
            if (layersToLoad > 0) { return; }
            mapObj.populateLayers();

            if(mapObj.map.spatialReference &&
                _.include([102100,102113,3857], mapObj.map.spatialReference.wkid))
            { webapp.viewport =
                esri.geometry.geographicToWebMercator(webapp.viewport); }
            mapObj.setViewport(webapp.viewport);
        };
        var addLayer = function(layer)
        {
            dojo.connect(layer, 'onLoad', layerReady);
            mapObj.map.addLayer(layer, position++);
        };

        _.each(webapp.layers.base, addLayer);
        _.each(webapp.layers.operational, addLayer);
        delete webapp.position;
    };

    var layerType = function(layerInfo)
    {
        // This is an extreme simplification of the process used in ESRI's
        // utils.xd.js#_initLayer.
        if (layerInfo.singleFusedMapCache === true)
        { return esri.layers.ArcGISTiledMapServiceLayer; }
        else
        { return esri.layers.ArcGISDynamicMapServiceLayer; }
    };

    var isWebMercatorSpatialReference = function(thing)
    {
        return _.include([102100, 102113, 3857], thing.spatialReference.wkid);
    };
*/

})(jQuery);
