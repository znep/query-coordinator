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

                dojo.require("esri.map");
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
                            (layer.url === undefined && layer.custom_url === undefined))
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

                        layer = new constructor(layer.custom_url || layer.url, layer.options);

                        dojo.connect(layer, 'onLoad', function()
                        {
                            if (this.loaded) { layersLoaded++; }
                            mapObj.map.addLayer(this);
                            if (layersLoaded >= layers.length)
                            {
                                if (mapObj.hideLayers)
                                { mapObj.hideLayers(); }
                                mapObj.populateLayers();
                            }
                        });
                    }

                    // Not sure we want to be saving every single update a user
                    // makes to a map
                    //mapObj.map.onPanEnd = function(extent)
                    //{ mapObj.updateMap({ extent: extent }); }

                    //mapObj.map.onZoomEnd = function(extent, factor)
                    //{ mapObj.updateMap({ extent: extent, zoom: factor }); }

                    mapObj._multipoint = new esri.geometry.Multipoint
                        (mapObj.map.spatialReference);

                    mapObj.buildIdentifyTask();

                    blist.$display.find('.infowindow .hide').removeClass('hide')
                                                            .addClass('hide_infowindow');
                });
            },

            buildIdentifyTask: function()
            {
                var mapObj = this;
                mapObj._identifyConfig = mapObj._displayConfig.identifyTask;
// mapObj._identifyConfig = { // Test!
//     url: "http://navigator.state.or.us/ArcGIS/rest/services/Projects/ARRA_Unemployment/MapServer",
//     layerId: 2,
//     attributes: [{key:'March2010',text:'Unemployment Rate in March 2010'}]
// };
                if (!mapObj._identifyConfig || !mapObj._identifyConfig.url || !mapObj._identifyConfig.layerId
                    || !mapObj._identifyConfig.attributes || mapObj._identifyConfig.attributes.length == 0)
                { return; }

                dojo.connect(mapObj.map, 'onClick', function(evt) { identifyFeature(mapObj, evt); });
                mapObj._identifyParameters = new esri.tasks.IdentifyParameters();
                mapObj._identifyParameters.tolerance = 3;
                mapObj._identifyParameters.returnGeometry = false;
                mapObj._identifyParameters.layerIds = [mapObj._identifyConfig.layerId];
                mapObj._identifyParameters.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
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

            handleRowsLoaded: function(rows)
            {
                var mapObj = this;
                mapObj._dataLoaded = true;

                if (mapObj._rows === undefined) { mapObj._rows = []; }
                mapObj._rows = mapObj._rows.concat(rows);

                if (mapObj._mapLoaded)
                { mapObj.renderData(rows); }
            },

            renderPoint: function(latVal, longVal, rowId, details)
            {
                var mapObj = this;
                // Create the map symbol
                var symbol = getESRIMapSymbol(mapObj, details);

                mapObj._toProject = mapObj._toProject || [];
                var point = new esri.geometry.Point(longVal, latVal,
                        new esri.SpatialReference({wkid: 4326}));
                if (mapObj.map.spatialReference.wkid == 102100)
                { point = esri.geometry.geographicToWebMercator(point); }
                else if (mapObj.map.spatialReference.wkid !=
                    point.spatialReference.wkid)
                {
                    mapObj.errorMessage =
                        'Map does not have a supported spatial reference';
                    return false;
                }

                var g = new esri.Graphic(point, symbol,
                    { title: details.title, body : details.info });

                if (g.attributes.title !== null || g.attributes.body !== null)
                { g.setInfoTemplate(new esri.InfoTemplate("${title}", "${body}")); }

                if (mapObj._markers[rowId])
                {
                  mapObj.map.graphics.remove(mapObj._markers[rowId]);
                }
                mapObj._markers[rowId] = g;
                mapObj.map.graphics.add(g);
                if (!mapObj._extentSet)
                { mapObj._multipoint.addPoint(g.geometry); }

                return true;
            },

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._extentSet) { return; }
                if (mapObj._multipoint.points.length == 0) { return; }

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
                delete mapObj._segmentSymbols;
                mapObj.map.graphics.clear();
                mapObj.map.infoWindow.hide();
            },

            buildLegend: function(name, gradient)
            {
                var mapObj = this;

                var SWATCH_WIDTH = 17;

                mapObj._$legend = mapObj.$dom().siblings('#mapLegend');
                if (!mapObj._$legend.length)
                {
                    mapObj.$dom().before('<div id="mapLegend">' +
                        '<div class="contentBlock">' +
                        '<h3>' + name +
                        '</h3><div style="width: ' + (mapObj._numSegments*SWATCH_WIDTH) +
                        'px;"><ul></ul><span></span>' +
                        '<span style="float: right;"></span></div>' +
                        '</div></div>');
                    mapObj._$legend = $('#mapLegend');
                }

                var $ul = mapObj._$legend.find('ul');
                $ul.empty();
                _.each(gradient, function(color)
                    {
                        $ul.append( $("<div class='color_swatch'><div class='inner'>&nbsp;</div></div>")
                                .css('background-color', color)
                            );
                    }
                );
            }
        }
    }));

    var getESRIMapSymbol = function(mapObj, details)
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

        var customization = customRender(details) || { type: 'simple', key: 'default' };
        if (mapObj._esriSymbol[customization.key])
        { return mapObj._esriSymbol[customization.key]; }

        var renderers = {};
        renderers['picture'] = function(customization)
        {
            var key = customization.key;

            mapObj._esriSymbol[key] = new esri.symbol.PictureMarkerSymbol(customization.icon, 10, 10);
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

            $.extend(symbolConfig, mapObj._displayConfig.plot);
            var symbolBackgroundColor =
                new dojo.Color(symbolConfig.backgroundColor);
            symbolBackgroundColor.a = customization.opacity || 0.8;
            var symbolBorderColor = new dojo.Color(symbolConfig.borderColor);
            var symbolBorder = new esri.symbol.SimpleLineSymbol(
                    symbolConfig.borderStyle,
                    symbolBorderColor,
                    symbolConfig.borderWidth
            );
            mapObj._esriSymbol[customization.key] = new esri.symbol.SimpleMarkerSymbol(
                    symbolConfig.symbol,
                    symbolConfig.size,
                    symbolBorder,
                    symbolBackgroundColor
            );

            return mapObj._esriSymbol[customization.key];
        }
        return renderers[customization.type](customization);
    };

    var identifyFeature = function(mapObj, evt)
    {
        if (!mapObj._identifyParameters) { return; }
        mapObj._identifyParameters.geometry = evt.mapPoint;
        mapObj._identifyParameters.mapExtent = mapObj.map.extent;
        mapObj.map.infoWindow.setContent("Loading...").setTitle('')
                             .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));
        new esri.tasks.IdentifyTask(mapObj._identifyConfig.url)
                      .execute(mapObj._identifyParameters, function(idResults) { displayIdResult(mapObj, evt, idResults[0]); });
    };

    var displayIdResult = function(mapObj, evt, idResult)
    {
        if (!idResult) { return; }

        var feature = idResult.feature;
        var info = _.map(mapObj._identifyConfig.attributes, function(attribute)
        { return attribute.text + ': ' + feature.attributes[attribute.key]; }).join('<br />');
        mapObj.map.infoWindow.setContent(info).setTitle(feature.attributes[idResult.displayFieldName])
                             .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));
    };

})(jQuery);
