(function($)
{
    blist.namespace.fetch('blist.openLayers');

    blist.openLayers.ZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, {
        draw: function(px)
        {
            // derived from PanZoomBar source, because it's the only way to change
            // these sizes. because of course.

            OpenLayers.Control.prototype.draw.apply(this, arguments);
            px = this.position.clone();
            this.buttons = [];

            var padding = new OpenLayers.Size(-2, -2);

            // HACK HACK HACK HACK HCAK HCAK HCAKHCAKHC AKHACKHAC HKACK HACKH ACHKACHK
            var sz = new OpenLayers.Size(21, 21);
            this._addButton('zoomin', 'zoom-plus-mini.png', px.add(padding.w, padding.h), sz);
            var centered = this._addZoomBar(px.add(padding.w + 1, padding.h + 19));
            this._addButton('zoomout', 'zoom-minus-mini.png', centered.add(-1, 2), sz);

            return this.div;
        }
    });

    blist.openLayers.Map = OpenLayers.Class(OpenLayers.Map, {
        initialize: function(div, options)
        {
            // add our defaults on top of the user's
            options = $.extend({}, {
                controls: []
            }, options);

            // call the default constructor but with no theme or controls; we'll add our own
            OpenLayers.Map.prototype.initialize.apply(this, [div, options]);

            this.addControl(new OpenLayers.Control.Attribution());
            this.addControl(new OpenLayers.Control.Navigation());
            this.addControl(new OpenLayers.Control.LayerSwitcher()); // TODO: sidebar config instead possibly?
            this.addControl(new blist.openLayers.ZoomBar());
        }
    });

    $.Control.registerMixin('openlayers', {
        initializeVisualization: function()
        {
            this._super();

            var mapObj = this;

            var mapOptions =
            {
                theme: '/stylesheets/openlayers/style.css',
                projection: 'EPSG:900913',
                units: 'm',
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
                maxResolution: 156543.0339,
                numZoomLevels: 21
            };

            OpenLayers.ImgPath = '/images/openlayers/';
            OpenLayers.ProxyHost = '/api/proxy?proxyUrl=';

            mapObj.map = new blist.openLayers.Map(mapObj.$dom()[0], mapOptions);

            var getDataBbox = function()
            {
                if (mapObj._geo && mapObj._geo.bbox)
                {
                    var dataBbox = OpenLayers.Bounds.fromString(mapObj._geo.bbox);
                    var bboxProjection = new OpenLayers.Projection(mapObj._geo.bboxCrs);

                    return dataBbox.transform(bboxProjection, new OpenLayers.Projection(mapOptions.projection));
                }
                else
                {
                    return mapObtions.maxExtent;
                }
            }

            var layers = [
                {
                    type: 'google',
                    options: { isBaseLayer: true }
                },
                {
                    type: 'bing',
                    options: {
                        isBaseLayer: true,
                        key: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                        transitionEffect: 'resize'
                    }
                },
                {
                    type: 'esri',
                    options:{
                        isBaseLayer: true,
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
                        transitionEffect: 'resize',
                        projection: 'EPSG:102100',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(-20037508.342787, 20037508.342787),
                        maxExtent: new OpenLayers.Bounds(-20037508.34, -19971868.8804086, 20037508.34, 19971868.8804086)
                    }
                }
            ];

            var featureProtocol = null;
            var getOverlayLayer = null;
            if (mapObj._geo)
            {
                var layerNames = mapObj._geo.layers.split(',');

                var getWmsOptions = function(layerName, params, options)
                {
                    var result = {
                        url: mapObj._geo.owsUrl,
                        isBaseLayer: false,
                        transitionEffect: 'resize',
                        opacity: 0.4,
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(mapOptions.maxExtent.left,
                            mapOptions.maxExtent.bottom),
                        maxExtent: getDataBbox(),
                        params: {
                            layers: mapObj._geo.namespace + ':' + layerName,
                            format: 'image/png',
                            tiled: true,
                            transparent: true
                        }
                    };

                    if (params)
                    {
                        result.params = $.extend(result.params, params);
                    }

                    if (options)
                    {
                        result = $.extend(result, options);
                    }

                    return result;
                };

                // Setup the basic feature protocol that will be used
                // for retrieving vector feature data.
                featureProtocol = new OpenLayers.Protocol.WFS({
                    featureNS: 'http://' + mapObj._geo.namespace,
                    featureType: layerNames,
                    maxFeatures: 1,
                    outputFormat: 'json',
                    readFormat: new OpenLayers.Format.GeoJSON(),
                    srsName: mapObj.map.projection,
                    url: mapObj._geo.owsUrl,
                    version: '1.1.0'
                });

                getOverlayLayer = function(feature)
                {
                    var layerName = feature.fid.match(/^[^\.]+/)[0];

                    var options = getWmsOptions(layerName,
                        {
                            env: 'id:' + feature.attributes[mapObj._geo.featureIdAttribute],
                            styles: 'socrata_overlay'
                        },
                        {
                            buffer: 0,
                            maxExtent: feature.bounds,
                            opacity: 0.7
                        });

                    return mapObj._createWmsLayer(layerName, options);
                };

                _.each(layerNames, function(layerName)
                {
                    layers.push({
                        type: 'wms',
                        options: getWmsOptions(layerName)
                    });
                });
            }

            for (var i = 0; i < layers.length; i++)
            {
                var layer = layers[i];
                if ($.isBlank(layer)) { continue; }

                switch (layer.type)
                {
                    case 'google':
                        layer = new OpenLayers.Layer.Google('Google', layer.options);
                        break;

                    case 'bing':
                        layer = new OpenLayers.Layer.Bing(layer.options);
                        break;

                    case 'esri':
                        layer = new OpenLayers.Layer.ArcGISCache('Esri', layer.options.url, layer.options);
                        break;

                    case 'wms':
                        layer = mapObj._createWmsLayer(i, layer.options);
                        break;

                    default:
                        // Invalid layer type
                        continue;
                }

                mapObj.map.addLayer(layer)
            }

            if (featureProtocol)
            {
                var selectedVectors = new OpenLayers.Layer.Vector('Selection',
                    {
                        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style['default'])
                    });
                mapObj.map.addLayer(selectedVectors);

                var getFeature = new OpenLayers.Control.GetFeature({
                    protocol: featureProtocol,
                    single: false
                });

                getFeature.events.register('featureselected', this, function(event)
                {
                    var selectedFeature = event.feature;

                    var popupText = "";
                    _.each(selectedFeature.attributes, function(value, key)
                    {
                        popupText += key + ': ' + value + '<br />';
                    })

                    var bounds = getFeature.pixelToBounds(getFeature.handlers.click.evt.xy);

                    var popup = new OpenLayers.Popup.FramedCloud('featurePopup',
                        bounds.getCenterLonLat(),
                        new OpenLayers.Size(100, 100),
                        popupText, null, true,
                        function()
                        {
                            getFeature.unselect(selectedFeature);
                        }
                    );

                    selectedFeature.popup = popup
                    popup.feature = selectedFeature;

                    selectedVectors.addFeatures([selectedFeature]);
                    mapObj.map.addPopup(popup);

                    var overlayLayer = getOverlayLayer(selectedFeature);

                    selectedFeature.overlayLayer = overlayLayer
                    mapObj.map.addLayer(overlayLayer);
                });

                getFeature.events.register('featureunselected', this, function(event)
                {
                    var unselectedFeature = event.feature;
                    var popup = unselectedFeature.popup
                    var overlayLayer = unselectedFeature.overlayLayer;

                    if (popup)
                    {
                        mapObj.map.removePopup(popup);
                        selectedVectors.removeFeatures([unselectedFeature]);

                        popup.feature = null;
                        unselectedFeature.popup.destroy();
                        unselectedFeature.popup = null;
                    }

                    if (overlayLayer)
                    {
                        mapObj.map.removeLayer(overlayLayer);

                        unselectedFeature.overlayLayer.destroy()
                        unselectedFeature.overlayLayer = null;
                    }
                });

                mapObj.map.addControl(getFeature);
                getFeature.activate();
            }

            mapObj.map.addControl(new OpenLayers.Control.LayerSwitcher());

            mapObj._markerLayer = new OpenLayers.Layer.Markers('Markers');
            mapObj.map.addLayer(mapObj._markerLayer);

            mapObj.map.zoomToExtent(getDataBbox());
            mapObj.mapLoaded();
        },

        currentZoom: function()
        {
            if (this.map)
            { return this.map.getZoom(); }
        },

        renderGeometry: function(geoType, geometry, dupKey, details)
        {
            var mapObj = this;

            var size = new OpenLayers.Size(21,25);
            var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
            var icon = new OpenLayers.Icon('/images/openlayers/marker.png',size,offset);

            var lonlat = new OpenLayers.LonLat(geometry.longitude, geometry.latitude).transform(
                new OpenLayers.Projection('EPSG:4326'), mapObj.map.getProjectionObject());
            var marker = new OpenLayers.Marker( lonlat, icon );

            mapObj._markerLayer.addMarker(marker);
            mapObj._bounds.extend(lonlat);

            return marker;
        },

        renderCluster: function(cluster, details)
        {
        },

        setAnimationOlds: function()
        {
        },

        dataRendered: function()
        {
            this._super();
        },

        adjustBounds: function()
        {
            this.map.zoomToExtent(this._bounds);
        },

        getCustomViewport: function()
        {
        },

        setViewport: function(viewport)
        {
        },

        fitPoint: function(point)
        {
        },

        showLayers: function()
        {
        },

        hideLayers: function()
        {
        },

        clearGeometries: function()
        {
        },

        cleanVisualization: function()
        {
        },

        reset: function()
        {
        },

        resizeHandle: function()
        {
        },

        getRequiredJavascripts: function()
        {
            // This is a terrible hack; but we need to know if Google
            // has already been loaded, since it has a special callback.
            // We can't store a normal object var, because the whole
            // library is being recreated
            if (blist.util.googleCallbackMap) { return null; }

            blist.util.googleCallback = this._setupLibraries;
            blist.util.googleCallbackMap = this;
            return 'https://maps.google.com/maps/api/js?sensor=true&libraries=geometry&callback=blist.util.googleCallback';
        },

        _setupLibraries: function()
        {
            // Grab a reference to the current object (this) from a global
            var mapObj = blist.util.googleCallbackMap;
            mapObj._librariesLoaded();
        },

        _createWmsLayer: function(name, options)
        {
            return new OpenLayers.Layer.WMS(name, options.url, options.params, options);
        }
    }, {defaultZoom: 13}, 'socrataMap');

    var showInfoWindow = function(mapObj, shape)
    {
    };

    var closeInfoWindow = function()
    {
    };

    var animate = function(animations, callback)
    {
    };

})(jQuery);
