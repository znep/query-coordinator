(function($)
{
    blist.namespace.fetch('blist.openLayers');

    blist.openLayers.ZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, {
        destroy: function()
        {
            if (this.sliderEvents)
            { OpenLayers.Control.PanZoomBar.prototype.destroy.apply(this, arguments); return; }

            this.map.events.un({
                "changebaselayer": this.redraw,
                scope: this
            });

            OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);

            delete this.mouseDragStart;
            delete this.zoomStart;
        },

        redraw: function()
        {
            if (this.div != null)
            {
                this.removeButtons();
                if (this.sliderEvents) { this._removeZoomBar(); }
            }
            this.draw();
        },

        draw: function(px)
        {
            // derived from PanZoomBar source, because it's the only way to change
            // these sizes. because of course.

            OpenLayers.Control.prototype.draw.apply(this, arguments);
            px = this.position.clone();
            this.buttons = [];

            var padding = new OpenLayers.Size(-2, -2);

            // Magic number is height as specified in openlayers.sass.
            var small = $(this.map.div).height() < 277;

            // HACK HACK HACK HACK HCAK HCAK HCAKHCAKHC AKHACKHAC HKACK HACKH ACHKACHK
            var sz = new OpenLayers.Size(21, 21);
            this._addButton('zoomin', 'zoom-plus-mini.png', px.add(padding.w, padding.h), sz);
            if (small)
            {
                $(this.div).addClass('small');
                this._addButton('zoomout', 'zoom-minus-mini.png',
                    px.add(padding.w, padding.h + 19), sz);
            }
            else
            {
                $(this.div).removeClass('small');
                var centered = this._addZoomBar(px.add(padding.w + 1, padding.h + 19));
                this._addButton('zoomout', 'zoom-minus-mini.png', centered.add(-1, 2), sz);
            }

            return this.div;
        },

        CLASS_NAME: "blist.openLayers.ZoomBar"
    });

    blist.openLayers.Attribution = OpenLayers.Class(OpenLayers.Control.Attribution, {
        initialize: function()
        {
            this.EVENT_TYPES = ['attributionupdated'].concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.Attribution.prototype.initialize.apply(this, arguments);
        },

        updateAttribution: function()
        {
            var control = this;
            OpenLayers.Control.Attribution.prototype.updateAttribution.apply(this, arguments);

            var imgs = this.div.getElementsByTagName('img');
            var toLoad = imgs.length;
            for (var i = 0; i < toLoad; i++)
            { imgs[i].onload = function() {
                toLoad--;
                if (toLoad == 0)
                { control.events.triggerEvent('attributionupdated'); }
            }; }
            if (toLoad == 0)
            { this.events.triggerEvent('attributionupdated'); }
        }
    });

    blist.openLayers.Map = OpenLayers.Class(OpenLayers.Map, {
        initialize: function(div, options)
        {
            options.controls = [
                new blist.openLayers.Attribution(),
                new OpenLayers.Control.Navigation(),
                new blist.openLayers.ZoomBar(),
                new blist.openLayers.MapTypeSwitcher()
            ];

            // call the default constructor but with no theme or controls; we'll add our own
            OpenLayers.Map.prototype.initialize.apply(this, [div, options]);
        }
    });

    $.Control.registerMixin('openlayers', {
        initializeBaseLayers: function()
        {
            // let us make POST requests with OpenLayers (for things like WFS)
            var csrfToken = $('meta[name="csrf-token"]').attr('content');

            var mapObj = this;

            var mtSwitcher = mapObj.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0];

            var getDataBbox = function()
            {
                if (mapObj._geo && mapObj._geo.bbox)
                {
                    var dataBbox = OpenLayers.Bounds.fromString(mapObj._geo.bbox);
                    var bboxProjection = new OpenLayers.Projection(mapObj._geo.bboxCrs);

                    return dataBbox.transform(bboxProjection, new OpenLayers.Projection(mapObj.map.projection));
                }
                else
                {
                    return mapObj.map.maxExtent;
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
                        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
                        transitionEffect: 'resize',
                        projection: 'EPSG:102113',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(-20037508.342787, 20037508.342787),
                        maxExtent: new OpenLayers.Bounds(-20037508.34, -19971868.8804086, 20037508.34, 19971868.8804086)
                    }
                }
            ];

            var featureProtocol = null;
            var getOverlayLayer = null;
            var manipulableLayers = [];
            if (mapObj._geo)
            {
                var layerNames = mapObj._geo.layers.split(',');

                var getWmsOptions = function(layerName, params, options)
                {
                    var maxExtent = mapObj.map.maxExtent;

                    var result = {
                        url: mapObj._geo.owsUrl,
                        atlasId: layerName,
                        isBaseLayer: false,
                        transitionEffect: 'resize',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(maxExtent.left,
                            maxExtent.bottom),
                        maxExtent: getDataBbox(),
                        params: {
                            layers: mapObj._geo.namespace + ':' + layerName,
                            format: 'image/png',
                            _soc_pubDate: mapObj._pubDate,
                            tiled: true,
                            transparent: true
                        }
                    };

                    if (params)
                    {
                        $.extend(result.params, params);
                    }

                    if (options)
                    {
                        result = $.extend(result, options);
                    }

                    return result;
                };

                // Setup the basic feature protocol that will be used
                // for retrieving vector feature data.
                var AuthenticatingFeatureProtocol = new OpenLayers.Class(OpenLayers.Protocol.WFS.v1_1_0,
                {
                    read: function(options)
                    {
                        options = OpenLayers.Util.extend({}, options);
                        options.headers = OpenLayers.Util.extend({
                            'X-App-Token': blist.configuration.appToken,
                            'X-CSRF-Token': csrfToken
                        }, options.headers);

                        return OpenLayers.Protocol.WFS.v1_1_0.prototype.read.call(this, options);
                    }
                });

                var featureProtocol = new AuthenticatingFeatureProtocol({
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
                            maxExtent: feature.bounds
                        });

                    return mapObj._createWmsLayer(layerName, options);
                };

                _.each(layerNames, function(layerName, index)
                {
                    layers.push({
                        type: 'wms',
                        options: getWmsOptions(layerName)
                    });
                });
            }

            OpenLayers.Layer.Google.v3.repositionMapElements = function() {};
            for (var i = 0; i < layers.length; i++)
            {
                var layer = layers[i];
                if ($.isBlank(layer)) { continue; }

                switch (layer.type)
                {
                    case 'google':
                        layer = new OpenLayers.Layer.Google('Google', layer.options);
                        mtSwitcher.registerMapType('Google', layer);
                        break;

                    case 'bing':
                        layer = new OpenLayers.Layer.Bing(layer.options);
                        mtSwitcher.registerMapType('Bing', layer);
                        break;

                    case 'esri':
                        layer = new OpenLayers.Layer.ArcGISCache('Esri', layer.options.url, layer.options);
                        mtSwitcher.registerMapType('ESRI', layer);
                        break;

                    case 'wms':
                        layer = mapObj._createWmsLayer(null, layer.options);
                        manipulableLayers.push(layer);
                        break;

                    default:
                        // Invalid layer type
                        continue;
                }

                mapObj.map.addLayer(layer)
            }

            mtSwitcher.setCurrentMapType('Google');

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

                mapObj._getFeature = getFeature;

                getFeature.events.register('featureselected', this, function(event)
                {
                    var selectedFeature = event.feature;

                    var popupText = _.map(selectedFeature.attributes, function(value, key)
                    {
                        if (key == '_SocrataID' || key == 'bbox') { return; }
                        return $.tag({
                            tagName: 'p',
                            contents: [ {
                                tagName: 'span', 'class': 'property',
                                contents: $.htmlEscape(key) + ':'
                            }, {
                                tagName: 'span', 'class': 'value',
                                contents: $.htmlEscape(value)
                            } ]
                        }, true);
                    }).join('');

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

            mapObj._baseLayers = [mapObj.map.baseLayer];
            mapObj._dataLayers = manipulableLayers;
            fetchLayerNames(mapObj);

            if (mapObj._displayFormat.viewport)
            { mapObj.setViewport(mapObj._displayFormat.viewport); }
            else
            { mapObj.map.zoomToExtent(getDataBbox()); }
        },

        initializeEvents: function()
        {
            var mapObj = this;
            mapObj._super();

            mapObj.events.changedVisibility = function()
            {
                var featureType = _(mapObj._dataLayers).chain()
                    .map(function(layer, index)
                        {
                            if (layer.visibility
                                && (_.isNull(layer.opacity) || layer.opacity > 0))
                            { return layer.atlasId; }
                            else
                            { return null; }
                        })
                    .compact()
                    .value();
                mapObj._getFeature.protocol.setFeatureType(featureType);
            };
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

        getDataForAllViews: function ()
        {
            // Allow the moveend event to do its thing, and that's it.
            delete this._initialLoad;
        },

        _setupLibraries: function()
        {
            // Grab a reference to the current object (this) from a global
            var mapObj = blist.util.googleCallbackMap;
            mapObj._librariesLoaded();
        },

        _createWmsLayer: function(name, options)
        {
            var layer = new OpenLayers.Layer.WMS(name, options.url, options.params, options);
            layer.atlasId = options.atlasId;
            return layer;
        }
    }, {defaultZoom: 13}, 'socrataMap');

    var fetchLayerNames = function(mapObj)
    {
        mapObj._primaryView.getChildOptionsForType('table', function(views)
        {
            _.each(mapObj._dataLayers, function(layer, index)
            { if (index < views.length) { layer.name = views[index].name; } });
            mapObj.populateLayers();
        });
    };

})(jQuery);
