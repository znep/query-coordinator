(function($)
{
    // Should inherit from tiledata.

    // There's a concept called OverlayLayer in the old code, but I don't see any reason for it.
    $.Control.registerMixin('mondara', {
        initializeLayer: function()
        {
            var layerObj = this;

            layerObj._config = layerObj._view.metadata.geo;
            layerObj._pubDate = layerObj._view.publicationDate;
            layerObj._dataLayers = [];

            if (layerObj._config.bbox)
            { layerObj._maxExtent = OpenLayers.Bounds.fromString(layerObj._config.bbox).transform(
                new OpenLayers.Projection(layerObj._config.bboxCrs), layerObj._mapProjection); }

            // Support federation.
            if (layerObj._view.domainUrl && !/^http/.test(layerObj._config.owsUrl))
            { layerObj._config.owsUrl = layerObj._view.domainUrl + layerObj._config.owsUrl; }

            _.each(layerObj._config.layers.split(','), function(layerName)
            {
                var params = {
                    layers: layerObj._config.namespace + ':' + layerName,
                    format: 'image/png',
                    _soc_pubDate: layerObj._pubDate,
                    tiled: true,
                    transparent: true
                };
                var opacity = _.isNumber(layerObj._displayFormat.opacity)
                    && layerObj._displayFormat.opacity;
                var layer = new OpenLayers.Layer.WMS(layerName, layerObj._config.owsUrl, params, {
                    url: layerObj._config.owsUrl,
                    isBaseLayer: false,
                    transitionEffect: 'resize',
                    tileSize: new OpenLayers.Size(256, 256),
                    tileOrigin: new OpenLayers.LonLat(layerObj._map.maxExtent.left,
                        layerObj._map.maxExtent.bottom),
                    maxExtent: layerObj._maxExtent || layerObj._map.maxExtent,
                    opacity: opacity,
                    params: params
                });
                layer.atlasId = layerName;
                layerObj._map.addLayer(layer);
                layerObj._dataLayers.push(layer);
            });

            layerObj._view.getChildOptionsForType('table', function(views)
            {
                _.each(layerObj._dataLayers, function(layer, index)
                { if (index < views.length) { layer.name = views[index].name; } });
                layerObj._parent._controls.Overview.redraw();
            });

            layerObj._map.events.register('changelayer', null, function(evtObj)
            {
                if (!_.include(['visibility', 'opacity'], evtObj.property)) { return; }
                if (!_.include(layerObj._dataLayers, evtObj.layer)) { return; }
                var featureType = _(layerObj._dataLayers).chain()
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
                layerObj._getFeature.protocol.setFeatureType(featureType);
            });
        },

        featureProtocol: function()
        {
            var layerObj = this;

            if (!layerObj._featureProtocol)
            {
                layerObj._featureProtocol = new blist.openLayers.AuthenticatingFeatureProtocol({
                    featureNS: 'http://' + layerObj._config.namespace,
                    featureType: layerObj._config.layers.split(','),
                    maxFeatures: 10,
                    outputFormat: 'json',
                    readFormat: new OpenLayers.Format.GeoJSON(),
                    srsName: layerObj._map.projection,
                    url: layerObj._config.owsUrl,
                    version: '1.1.0'
                });
            }
            return layerObj._featureProtocol;
        },

        buildGetFeature: function()
        {
            var layerObj = this;
            if (layerObj._displayFormat.disableFlyouts || layerObj._getFeature) { return; }

            layerObj._getFeature = new OpenLayers.Control.GetFeature({
                protocol: layerObj.featureProtocol(),
                filterType: OpenLayers.Filter.Spatial.INTERSECTS,
                single: false
            });

            layerObj._map.addControl(layerObj._getFeature);
            layerObj._getFeature.activate();

            layerObj._selectionLayer = new OpenLayers.Layer.Vector(null, {
                styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style['default'])
                });
            layerObj._map.addLayer(layerObj._selectionLayer);

            layerObj._map.events.register('click', layerObj, function(evtObj)
            {
                var lonlat = layerObj._map.baseLayer
                    .getLonLatFromViewPortPx(layerObj._map.events.getMousePosition(evtObj));
                layerObj.flyoutHandler().sayLoading(lonlat);
            });
            layerObj._getFeature.events.register('clickout', layerObj, function() {
                this.flyoutHandler().cancel();
            });

            layerObj._getFeature.events.register('featuresselected', layerObj, function(evtObj)
            {
                var features = evtObj.features;

                layerObj._parent.closePopup('loading');

                var $popupText = $.tag({ tagName: 'div',
                contents: _.map(features, function(feature)
                {
                    return { tagName: 'div', 'class': 'row',
                        contents: _.map(feature.attributes, function(value, key)
                        {
                            if (_.include(['_SocrataID', 'bbox'], key)) { return; }
                            return {
                                tagName: 'p',
                                contents: [ {
                                    tagName: 'span', 'class': 'property',
                                    contents: $.htmlEscape(key) + ':'
                                }, {
                                    tagName: 'span', 'class': 'value',
                                    contents: $.htmlEscape(value)
                                } ]
                            };
                        })
                    };
                }) });

                if (features.length > 1)
                { layerObj.addInfoPagingToFlyout($popupText); }

                var lonlat = layerObj._getFeature.pixelToBounds(
                    layerObj._getFeature.handlers.click.evt.xy).getCenterLonLat();

                layerObj.flyoutHandler().add(layerObj, lonlat, $popupText[0].innerHTML,
                    { onlyIf: 'loading',
                      closeBoxCallback: function(evt) { layerObj._getFeature.unselectAll(); } });


                layerObj._selectionLayer.addFeatures(features);
            });

            layerObj._getFeature.events.register('featureunselected', layerObj, function(evtObj)
            {
                layerObj._selectionLayer.removeFeatures([evtObj.feature]);
                layerObj.flyoutHandler().close();
            });

            layerObj.flyoutHandler().events.register('close', layerObj,
                function() { layerObj._getFeature.unselectAll(); });
        },

        destroy: function()
        {
            this._super();
            _.each(this._dataLayers, function(layer) { layer.destroy(); });
            if (this._getFeature) { this._getFeature.destroy(); }
            if (this._selectionLayer) { this._selectionLayer.destroy(); }
            // TODO: Check events to unregister.
        },

        reloadOpacity: function()
        {
            if (_.isNumber(this._displayFormat.opacity))
            {
                _.each(this._dataLayers, function(layer)
                { layer.setOpacity(this._displayFormat.opacity); }, this);
            }
        },

        preferredExtent: function()
        {
            return this._maxExtent || this._map.maxExtent;
        },

        layersToRestack: function()
        {
            return this._dataLayers;
        },

        dataLayers: function()
        {
            return this._dataLayers;
        },

        // Cheap way to get after-saved-as-child in.
        getData: function()
        {
            this.zoomToPreferred();
            this._dataLoaded = true;
            this._parent.mapElementLoaded(this._view);
        }
    }, {}, 'socrataDataLayer', 'tiledata');
})(jQuery);
