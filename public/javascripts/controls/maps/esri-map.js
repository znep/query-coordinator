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

                if (mapObj.settings.view.renderWithArcGISServer())
                { mapObj._maxRows = 0; }

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
                        if (mapObj._dataLoaded)
                        { mapObj.renderData(mapObj._rows); }
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
                                if (mapObj.settings.view.renderWithArcGISServer())
                                { mapObj._attachMapServer(); }

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
                if (!mapObj._identifyConfig || !mapObj._identifyConfig.url ||
                    !mapObj._identifyConfig.layerId
                    || !mapObj._identifyConfig.attributes ||
                    mapObj._identifyConfig.attributes.length == 0)
                { return; }

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

            handleRowsLoaded: function(rows)
            {
                var mapObj = this;
                mapObj._dataLoaded = true;

                if (mapObj._rows === undefined) { mapObj._rows = []; }
                mapObj._rows = mapObj._rows.concat(rows);
                if (mapObj.settings.view.totalRows > mapObj._maxRows)
                {
                    mapObj.showError('This dataset has more than ' + mapObj._maxRows +
                               ' rows visible. Some points will be not be displayed.');
                    mapObj._maxRowsExceeded = true;
                }

                if (mapObj._mapLoaded)
                { mapObj.renderData(rows); }
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
                    { title: details.title, body: details.info });

                if (g.attributes.title !== null || g.attributes.body !== null)
                { g.setInfoTemplate(new esri.InfoTemplate("${title}", "${body}")); }

                if (mapObj._markers[dupKey])
                { mapObj.map.graphics.remove(mapObj._markers[dupKey]); }
                mapObj._markers[dupKey] = g;

                mapObj.map.graphics.add(g);

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
                { mapObj.setViewport(mapObj.settings.view.displayFormat.viewport); }
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
                if (with_bounds && (sr == null || sr == 102100))
                { viewport = esri.geometry.webMercatorToGeographic(viewport); }
                viewport = {
                    xmin: viewport.xmin,
                    xmax: viewport.xmax,
                    ymin: viewport.ymin,
                    ymax: viewport.ymax,
                    sr: sr
                };

                return viewport;
            },

            setViewport: function(viewport)
            {
                var mapObj = this;
                mapObj.map.setExtent(viewport instanceof esri.geometry.Extent
                    ? viewport
                    : new esri.geometry.Extent(
                        viewport.xmin, viewport.ymin, viewport.xmax, viewport.ymax,
                        new esri.SpatialReference({ wkid: viewport.sr })));
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
                mapObj.map.graphics.clear();
                mapObj.map.infoWindow.hide();
            },

            clearFeatures: function()
            {
                var mapObj = this;
                if (mapObj.map.graphics) { mapObj.map.graphics.clear(); }
            },

            fetchExternalFeatureSet: function()
            {
                fetchExternalFeatureSet(this);
            },

            renderFeatureData: function()
            {
                var mapObj = this;
                if (mapObj._initialLoad) { delete mapObj._initialLoad; }

                var attributes = _.map(mapObj._featureSet.fieldAliases,
                    function(alias, key)
                    {
                        return alias + ": ${" + key + "}";
                    }).join("<br />");
                mapObj._infoTemplate = new esri.InfoTemplate(
                    "${" + mapObj._featureSet.displayFieldName + "}", attributes);

                var symbol;
                switch(mapObj._featureSet.features[0].geometry.type)
                {
                    case 'polyline':
                        symbol = new esri.symbol.SimpleLineSymbol();
                        break;
                    case 'polygon':
                        symbol = new esri.symbol.SimpleFillSymbol();
                        break;
                    case 'point':
                        symbol = new esri.symbol.SimpleMarkerSymbol();
                        symbol.setSize(10);
                        break;
                }
                symbol.setColor(new dojo.Color([255, 0, 255]));

                _.each(mapObj._featureSet.features, function(feature)
                {
                    feature.setInfoTemplate(mapObj._infoTemplate);
                    mapObj.map.graphics.add(feature.setSymbol(symbol));

                    if (feature.geometry instanceof esri.geometry.Point)
                    { mapObj._multipoint.addPoint(feature.geometry); }
                    else
                    {
                        if (!mapObj._bounds)
                        { mapObj._bounds = feature.geometry.getExtent(); }
                        else
                        { mapObj._bounds = mapObj._bounds
                                .union(feature.geometry.getExtent()); }
                    }
                });
                mapObj.rowsRendered();
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

    // This function is deprecated for now.
    var fetchExternalFeatureSet = function(mapObj)
    {
        mapObj._maxRows = 0; // Don't bother loading from the core server.

        var applyFilters = function()
        {
            var filterCond = mapObj.settings.view.query.filterCondition;
            if (_.isEmpty(filterCond)) { return '1=1'; }

            var template = {
                'EQUALS':                 '<%= field %> = <%= val1 %>',
                'NOT_EQUALS':             '<%= field %> != <%= val1 %>',
                'STARTS_WITH':            '<%= field %> LIKE \'<%= val1 %>%\'',
                'CONTAINS':               '<%= field %> LIKE \'%<%= val1 %>%\'',
                'IS_NOT_BLANK':           '<%= field %> IS NOT NULL',
                'IS_BLANK':               '<%= field %> IS NULL',
                'LESS_THAN':              '<%= field %> < <%= val1 %>',
                'LESS_THAN_OR_EQUALS':    '<%= field %> <= <%= val1 %>',
                'GREATER_THAN':           '<%= field %> > <%= val1 %>',
                'GREATER_THAN_OR_EQUALS': '<%= field %> >= <%= val1 %>',
                'BETWEEN':
                    '<%= field %> BETWEEN <%= val1 %> AND <%= val2 %>'
            };
            var transformFilterToSQL = function (filter)
            {
                var fieldName = processFilter(filter.children[0]);
                var field = _.detect(mapObj._featureLayer.fields,
                    function(field) { return field.name == fieldName });

                var value = [];
                value.push(processFilter(filter.children[1]));
                value.push(processFilter(filter.children[2]));

                // From http://help.arcgis.com/EN/webapi/javascript/arcgis/help/jsapi/field.htm#type
                // Can be one of the following:
                // "esriFieldTypeSmallInteger", "esriFieldTypeInteger",
                // "esriFieldTypeSingle",       "esriFieldTypeDouble",
                // "esriFieldTypeString",       "esriFieldTypeDate",
                // "esriFieldTypeOID",          "esriFieldTypeGeometry",
                // "esriFieldTypeBlob",         "esriFieldTypeRaster",
                // "esriFieldTypeGUID",         "esriFieldTypeGlobalID",
                // "esriFieldTypeXML"

                // TODO: Need to figure out which types are PostgreSQL strings.
                if (_.include(["String"], field.type.substr(13))
                    && !_.include(['STARTS_WITH', 'CONTAINS'], filter.value))
                { value = _.map(value, function(v)
                    { return "'" + v.replace(/'/g, "\\'") + "'"; }); }
                else
                { value = _.map(value, function(v) { return v.replace(/;.*$/, ''); }) }

                return _.template(template[filter.value],
                    {field: fieldName, val1: value[0], val2: value[1] });
            };
            var processFilter = function(filter)
            {
                if (!filter) { return ''; }
                switch (filter.type)
                {
                    case 'operator':
                        switch(filter.value)
                        {
                            case 'AND':
                                return _.map(filter.children, function(filter)
                                    { return processFilter(filter); }).join(' AND ');
                            case 'OR':
                                return _.map(filter.children, function(filter)
                                    { return processFilter(filter); }).join(' OR ');
                            default:
                                return transformFilterToSQL(filter);
                        }
                        break;
                    case 'column':
                        return blist.dataset.columnForID(filter.columnId).name;
                    case 'literal':
                        return filter.value;
                }
            };
            return processFilter(filterCond);
        };

        dojo.require('esri.layers.FeatureLayer');
        dojo.require('esri.tasks.query');
        dojo.addOnLoad(function()
        {

        mapObj._featureLayer = new esri.layers.FeatureLayer(
            blist.dataset.metadata.custom_fields.Basic.Source);

        dojo.connect(mapObj._featureLayer, 'onLoad', function()
        {
        var query = new esri.tasks.Query();
        query.outFields = ['*'];
        query.returnGeometry = true;
        query.outSpatialReference = new esri.SpatialReference({ wkid: 102100 });
        query.where = applyFilters();

        mapObj._featureLayer._task.execute(query, function(featureSet)
            {
                mapObj._featureSet = featureSet;
                mapObj._runningQuery = false;
                mapObj._featuresLoaded = true;
                mapObj.finishLoading();
                if (mapObj._mapLoaded) { mapObj.renderFeatureData(); }
            });
        mapObj._runningQuery = true;

        mapObj.startLoading();
        setTimeout(function()
        {
            // query took too long and probably timed out
            // so we're just going to kill the spinner and error it
            // if the query does finish, it will load behind the alert
            if (mapObj._runningQuery)
            {
                mapObj.finishLoading();
                alert('A data request has taken too long and timed out.');
            }
        }, 60000);
        });
        });
    };

    var isWebMercatorSpatialReference = function(thing)
    {
        return _.include([102100, 102113, 3857], thing.spatialReference.wkid);
    };

})(jQuery);
