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
            defaultZoom: 11
        },

        prototype:
        {
            initializeMap: function()
            {
                var mapObj = this;
                mapObj.$dom().addClass('tundra');

                dojo.require("esri.arcgis.utils");
                dojo.require("esri.layers.FeatureLayer");
                dojo.require("esri.map");
                // Apparently dojo is not loaded at the same time jQuery is; so
                // while this plugin isn't called until jQuery onLoad, we still need
                // to attach to dojo's onLoad or we get failures in WebKit
                dojo.addOnLoad(function()
                {
                    var options = {};
                    if (!$.isBlank(mapObj.settings.view.displayFormat.zoom))
                    { options.zoom = mapObj.settings.view.displayFormat.zoom; }

                    mapObj._extentSet =
                        !$.isBlank(mapObj.settings.view.displayFormat.extent);
                    if (mapObj._extentSet)
                    { options.extent = new esri.geometry
                        .Extent(mapObj.settings.view.displayFormat.extent); }
                    mapObj.map = new esri.Map(mapObj.$dom().attr('id'), options);

                    dojo.connect(mapObj.map, 'onLoad', function()
                    {
                        mapObj._mapLoaded = true;
                        mapObj._graphicsLayer = mapObj.map.graphics;
                        _.each(mapObj._dataViews, function(view)
                            {
                                if (mapObj._dataLoaded)
                                { mapObj.renderData(view._rows, view); }
                                if (mapObj._clustersLoaded)
                                { mapObj.renderClusters(mapObj._byView[view.id]
                                                                ._clusters, view); }
                            });
                    });

                    var layers = mapObj.settings.view.displayFormat.layers ||
                        mapObj.settings.defaultLayers;
                    if (!$.isArray(layers) || !layers.length)
                    {
                        mapObj.showError("No layers defined");
                        return;
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
                                if (mapObj.settings.view.snapshotting)
                                {
                                    setTimeout(mapObj.settings.view.takeSnapshot, 2000);
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

            buildIdentifyTask: function()
            {
                var mapObj = this;
                mapObj._identifyConfig =
                    mapObj.settings.view.displayFormat.identifyTask;
// mapObj._identifyConfig = { // Test!
//     url: "http://navigator.state.or.us/ArcGIS/rest/services/Projects/ARRA_Unemployment/MapServer",
//     layerId: 2,
//     attributes: [{key:'March2010',text:'Unemployment Rate in March 2010'}]
// };
                if (!isIdentifyTask(mapObj)) { return; }

                dojo.connect(mapObj.map, 'onClick',
                    function(evt) { identifyFeature(mapObj, evt); });

                mapObj._identifyParameters = new esri.tasks.IdentifyParameters();
                mapObj._identifyParameters.tolerance = 3;
                mapObj._identifyParameters.returnGeometry = false;
                mapObj._identifyParameters.layerIds =
                    [mapObj._identifyConfig.layerId];
                mapObj._identifyParameters.layerOption =
                    esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
                mapObj._identifyParameters.width  = mapObj.map.width;
                mapObj._identifyParameters.height = mapObj.map.height;
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

            handleRowsLoaded: function(rows, view)
            {
                var mapObj = this;
                mapObj._dataLoaded = true;

                if (mapObj._mapLoaded)
                { mapObj.renderData(rows, view); }
            },

            handleClustersLoaded: function(clusters, view)
            {
                var mapObj = this;
                mapObj._clustersLoaded = true;
                mapObj._byView[view.id]._clusters = clusters;

                if (mapObj._mapLoaded)
                { mapObj.renderClusters(clusters, view); }
            },

            renderGeometry: function(geoType, geometry, dupKey, details)
            {
                var mapObj = this;

                var symbol = getESRIMapSymbol(mapObj, geoType, details);

                if (!(geometry instanceof esri.geometry.Polygon))
                {
                    var constructor;
                    switch (geoType)
                    {
                        case 'point':    constructor = esri.geometry.Point; break;
                        case 'polygon':  constructor = esri.geometry.Polygon; break;
                        case 'polyline': constructor = esri.geometry.Polyline; break;
                    }

                    if (geometry.latitude)  { geometry.y = geometry.latitude; }
                    if (geometry.longitude) { geometry.x = geometry.longitude; }
                    geometry.spatialReference = { wkid: 4326 };

                    geometry = new constructor(geometry);
                    if (isWebMercatorSpatialReference(mapObj.map))
                    { geometry = esri.geometry.geographicToWebMercator(geometry); }
                }

                if (mapObj.map.spatialReference.wkid != geometry.spatialReference.wkid)
                {
                    mapObj.errorMessage =
                        'Map does not have a supported spatial reference';
                    return false;
                }

                var g = new esri.Graphic(geometry, symbol,
                        {rows: details.rows, flyoutDetails: details.flyoutDetails,
                         dataView: details.dataView});

                if (mapObj._markers[dupKey])
                { mapObj._graphicsLayer.remove(mapObj._markers[dupKey]); }
                mapObj._markers[dupKey] = g;

                mapObj._graphicsLayer.add(g);

                if (!mapObj._extentSet && geoType == 'point')
                { mapObj._multipoint.addPoint(g.geometry); }

                if (geoType != 'point')
                {
                    if (!mapObj._bounds)
                    { mapObj._bounds = g.geometry.getExtent(); }
                    else
                    { mapObj._bounds = mapObj._bounds.union(g.geometry.getExtent()); }
                }

                if (details.redirect_to && geoType == 'polygon')
                {
                    $(g.getDojoShape().rawNode)
                        .click(function(event)
                            { window.open(details.redirect_to); })
                        .hover(
                            function(event) { mapObj.$dom()
                                .find('div .container').css('cursor', 'pointer'); },
                            function(event) { mapObj.$dom()
                                .find('div .container').css('cursor', 'default'); });
                }

                return true;
            },

            renderCluster: function(cluster, details)
            {
                var mapObj = this;

                if (cluster.count <= 0) { return; }

                // Count:     1 -> Size: 20.
                // Count:   100 -> Size: 50.
                // Count:  1000 -> Size: 60.
                // Count: 10000 -> Size: 70.
                var convertCountToSize = function(count)
                    {
                        if (count <= 100)
                        { return 20 + Math.floor(0.3 * count); }
                        else if (count <= 1000)
                        { return 50 + Math.floor(0.01 * count); }
                        else
                        { return 60 + Math.floor((Math.log(count)
                                                 /Math.log(10) - 4) * 10); }
                    };

                var symbol = getESRIMapSymbol(mapObj, 'point',
                    $.extend({}, details, { size: convertCountToSize(cluster.count) }));
                var geometry = esri.geometry.geographicToWebMercator(
                    new esri.geometry.Point({
                        x: cluster.point.lon,
                        y: cluster.point.lat,
                        spatialReference: { wkid: 4326 }}));
                var graphic = new esri.Graphic(geometry, symbol);

                var textSymbol = new esri.symbol.TextSymbol(cluster.count);
                textSymbol.setFont(new esri.symbol.Font({ size: '12px',
                    weight: esri.symbol.Font.WEIGHT_BOLD }));
                textSymbol.setOffset(0, -3);
                textSymbol.setColor($.rgbToHsv(symbol.color).v < 50 ? 'white' : 'black');
                var textGraphic = new esri.Graphic(geometry, textSymbol);

                graphic.textGraphic = textGraphic;

                mapObj._graphicsLayer.add(graphic);
                mapObj._graphicsLayer.add(textGraphic);

                mapObj._multipoint.addPoint(geometry);

                return true;
            },

            hideLayers: function()
            {
                var mapObj = this;
                var layers = mapObj.getLayers();
                for (var i = 0; i < layers.length; i++)
                { mapObj.map.getLayer(layers[i].id).hide(); }
            },

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._extentSet) { return; }
                if (!mapObj._bounds && mapObj._multipoint.points.length == 0)
                { return; }

                if (mapObj._viewportListener)
                { dojo.disconnect(mapObj._viewportListener); }

                var extent = mapObj._bounds || mapObj._multipoint.getExtent();
                // Adjust x & y by about 10% so points aren't on the very edge
                // Use max & min diff since lat/long may be negative, and we
                // want to expand the viewport.  Using height/width may cause it
                // to shrink
                var xadj = (extent.xmax - extent.xmin) * 0.05;
                var yadj = (extent.ymax - extent.ymin) * 0.05;

                if (mapObj.settings.view.displayFormat.viewport)
                {
                    mapObj.setViewport(mapObj.settings.view.displayFormat.viewport);
                    if (_.isEmpty(mapObj.settings.view.query))
                    { mapObj.updateRowsByViewport(); }
                }
                else if (xadj == 0 || yadj == 0)
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

                var curVP;
                mapObj._extentChanging = true;
                mapObj._viewportListener = dojo.connect(mapObj.map, 'onExtentChange',
                    function()
                    {
                        if (mapObj._extentChanging)
                        {
                            mapObj._extentChanging = false;
                            curVP = mapObj.getViewport();
                            return;
                        }
                        var vp = mapObj.getViewport();
                        // Theory: All of these will be different if user-initiated
                        // panning or zooming occurs. But one will hold constant if
                        // it's just automatic.
                        if (_.any(['xmin', 'ymin', 'ymax'], function(p)
                            { return vp[p] == curVP[p]; }))
                        { return; }

                        mapObj.settings.view.update({
                            displayFormat: $.extend({},
                                mapObj.settings.view.displayFormat,
                                { viewport: vp })
                        }, false, true);
                        curVP = vp;
                        mapObj.updateRowsByViewport();
                    });
            },

            getViewport: function(with_bounds)
            {
                var mapObj = this;
                var viewport = mapObj.map.extent;
                var sr = viewport.spatialReference.wkid
                        || mapObj.map.spatialReference.wkid;
                if (sr == null || sr == 102100)
                { viewport = esri.geometry.webMercatorToGeographic(viewport); }
                viewport = {
                    xmin: viewport.xmin,
                    xmax: viewport.xmax,
                    ymin: viewport.ymin,
                    ymax: viewport.ymax,
                    sr: viewport.spatialReference.wkid
                };
                _.each(['xmin', 'ymin', 'xmax', 'ymax'], function(key)
                { viewport[key] = $.jsonIntToFloat(viewport[key]); });

                return viewport;
            },

            setViewport: function(viewport)
            {
                var mapObj = this;
                viewport = viewport instanceof esri.geometry.Extent
                    ? viewport
                    : new esri.geometry.Extent(
                        viewport.xmin, viewport.ymin, viewport.xmax, viewport.ymax,
                        new esri.SpatialReference({ wkid: viewport.sr }));
                if (viewport.spatialReference.wkid == 4326
                  && isWebMercatorSpatialReference(mapObj.map))
                { viewport = esri.geometry.geographicToWebMercator(viewport); }
                mapObj.map.setExtent(viewport);
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
                delete mapObj._segmentSymbols;
                delete mapObj._bounds;
                delete mapObj._byView[mapObj.settings.view.id]._clusters;
                mapObj._graphicsLayer.clear();
                mapObj.map.infoWindow.hide();
            },

            clearFeatures: function()
            {
                var mapObj = this;
                if (mapObj._graphicsLayer) { mapObj._graphicsLayer.clear(); }
            }
        }
    }));

    var getESRIMapSymbol = function(mapObj, geoType, details)
    {
        if (mapObj._esriSymbol === undefined) { mapObj._esriSymbol = {}; }

        var customRender = function(point)
        {
            var customization = {};

            if (!_.isUndefined(point.icon))
            {
                customization.icon = point.icon;
                customization.key = point.icon;
                customization.type = 'picture';
                return customization;
            }

            _.each(['size', 'color', 'shape', 'opacity'], function(property)
            {
                if (point[property])
                { customization[property] = point[property]; }
            });

            if (!_.isEmpty(customization))
            {
                customization.key = _.map(_.keys(customization), function(element)
                    { return element + '=' + customization[element]; }).join('|');
                customization.type = 'simple';
                return customization;
            }

            return null;
        };

        var customization = customRender(details) ||
            { type: 'simple', key: 'default' };
        if (mapObj._esriSymbol[customization.key])
        { return mapObj._esriSymbol[customization.key]; }

        var renderers = {};
        renderers['picture'] = function(customization)
        {
            var key = customization.key;

            mapObj._esriSymbol[key] =
                new esri.symbol.PictureMarkerSymbol(customization.icon, 10, 10);
            var image = new Image();
            image.onload = function() {
                mapObj._esriSymbol[key].setHeight(image.height);
                mapObj._esriSymbol[key].setWidth(image.width);
            };
            image.src = customization.icon;

            return mapObj._esriSymbol[key];
        };

        renderers['simple'] = function(customization)
        {
            var symbolConfig = {
                backgroundColor: customization.color || [ 255, 0, 255 ],
                size: customization.size || 10,
                symbol: customization.shape || 'circle',
                borderColor: [ 0, 0, 0, .5 ],
                borderStyle: 'solid',
                borderWidth: 1
            };

            $.extend(symbolConfig, mapObj.settings.view.displayFormat.plot);
            var symbolBackgroundColor =
                new dojo.Color(symbolConfig.backgroundColor);
            symbolBackgroundColor.a = customization.opacity || 0.8;
            var symbolBorderColor = new dojo.Color(symbolConfig.borderColor);
            var symbolBorder = new esri.symbol.SimpleLineSymbol(
                    symbolConfig.borderStyle,
                    symbolBorderColor,
                    symbolConfig.borderWidth
            );

            var symbol;
            switch (geoType)
            {
                case 'point':
                    symbol = new esri.symbol.SimpleMarkerSymbol(
                        symbolConfig.symbol,
                        symbolConfig.size,
                        symbolBorder,
                        symbolBackgroundColor
                    );
                    break;
                case 'polygon':
                    symbol = new esri.symbol.SimpleFillSymbol(
                        esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                        symbolBorder,
                        symbolBackgroundColor
                    );
                    break;
                case 'polyline':
                    symbol = new esri.symbol.SimpleLineSymbol(
                        esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                        symbolBackgroundColor,
                        symbolBorder.width
                    );
                    break;
            }

            mapObj._esriSymbol[customization.key] = symbol;

            return mapObj._esriSymbol[customization.key];
        }
        return renderers[customization.type](customization);
    };

    var isIdentifyTask = function(mapObj)
    {
        return $.subKeyDefined(mapObj._identifyConfig, 'url') &&
            $.subKeyDefined(mapObj._identifyConfig, 'layerId') &&
            $.subKeyDefined(mapObj._identifyConfig, 'attributes') &&
            mapObj._identifyConfig.attributes.length > 0;
    };

    var handleGraphicClick = function(mapObj, evt)
    {
        if (isIdentifyTask(mapObj)) { return; }
        if (mapObj._byView[mapObj.settings.view.id]._clusters) { return; }

        mapObj.map.infoWindow.setContent(
            mapObj.getFlyout(evt.graphic.attributes.rows,
                evt.graphic.attributes.flyoutDetails,
                evt.graphic.attributes.dataView)[0])
            .show(evt.screenPoint,
                mapObj.map.getInfoWindowAnchor(evt.screenPoint));
    };

    var identifyFeature = function(mapObj, evt)
    {
        if (!mapObj._identifyParameters) { return; }
        mapObj._identifyParameters.geometry = evt.mapPoint;
        mapObj._identifyParameters.mapExtent = mapObj.map.extent;

        mapObj.map.infoWindow.setContent("Loading...").setTitle('')
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));

        new esri.tasks.IdentifyTask(mapObj._identifyConfig.url)
            .execute(mapObj._identifyParameters,
            function(idResults) { displayIdResult(mapObj, evt, idResults[0]); });
    };

    var displayIdResult = function(mapObj, evt, idResult)
    {
        if (!idResult) { return; }

        var feature = idResult.feature;
        var info = _.map(mapObj._identifyConfig.attributes, function(attribute)
        { return attribute.text + ': ' +
            feature.attributes[attribute.key]; }).join('<br />');

        mapObj.map.infoWindow.setContent(info)
            .setTitle(feature.attributes[idResult.displayFieldName])
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));
    };

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
        _.each(mapObj.settings.view.displayFormat.layers, function(layer, index)
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

})(jQuery);
