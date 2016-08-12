(function($) {
  // Should inherit from tiledata.

  var NBEFeatureGetter = OpenLayers.Class(OpenLayers.Control.GetFeature, { //eslint-disable-line new-cap

    initialize: function(options) {
      this._layer = options.layer;
      OpenLayers.Control.GetFeature.prototype.initialize.call(this, options);
    },

    selectClick: function(evt) {
      var proj = 'EPSG:4326';
      var toProjection = new OpenLayers.Projection(proj);
      var esp9xxLonLat = this._layer._map.baseLayer.
          getLonLatFromViewPortPx(this._layer._map.events.getMousePosition(evt));
      var coord = esp9xxLonLat.transform(this._layer._map.getProjectionObject(), toProjection);
      this.request(coord);
    },

    request: function(coord) {
      var layerIds = this._layer._config.layers.split(',');
      $.when.apply(this, layerIds.map(function(uid) {
        var layerUrl = '/api/geospatial/' + uid;
        return $.getJSON(layerUrl, {
          lat: coord.lat,
          lng: coord.lon,
          zoom: this._layer._map.zoom
        });
      }.bind(this))).then(function() {
        //$.when has a completely different callback signature when called with one argument
        //vs > 1 argument. Which is super unpleasant...so we need to do this
        //see https://api.jquery.com/jquery.when/ (or don't)
        var resps;
        if (layerIds.length === 1) {
          resps = [arguments[0]];
        } else {
          resps = Array.prototype.slice.call(arguments).map(function(args) {
            return args[0];
          });
        }

        var features = resps.reduce(function(acc, featureArr) {
          return acc.concat(featureArr);
        }, []).map(function(feature) {
          //wrap each one
          return {attributes: feature};
        });


        if (features.length) {
          this.events.triggerEvent('featuresselected', {
            features: features
          });
        }
      }.bind(this), function(err) {
        //TODO: there are no mechanisms to handle errors apparently?
        if (window.console) {
          console.error('Error fetching layer JSON', err);
        }
      });
    }
  });

  var MapProvider = function() {};

  MapProvider.prototype = {
    handlers: {
      click: function(evtObj) {
        var lonlat = this._layerModel._map.baseLayer.
          getLonLatFromViewPortPx(this._layerModel._map.events.getMousePosition(evtObj));
        this._layerModel.flyoutHandler().sayLoading(lonlat);
      }
    },

    _setBoundingBox: function() {
      if (this._layerModel._config.bbox) {
        this._layerModel._maxExtent = OpenLayers.Bounds.fromString(this._layerModel._config.bbox).transform(
          new OpenLayers.Projection(this._layerModel._config.bboxCrs), this._layerModel._mapProjection
        );
      }
    }
  };

  var NBEMapProvider = function(layerModel) {
    this._layerModel = layerModel;
    this._setBoundingBox();
  };

  NBEMapProvider.prototype = _.extend({}, MapProvider.prototype, {
    getLayer: function(layerName, layerOpts) {
      var style = encodeURIComponent(
        '#main, #multipoint, #point {' +
          'line-width: 2.0;' +
          'line-color: #000;' +
          'line-opacity:0.85;' +
          'marker-width: 8.0;' +
          'marker-fill: #fb5e2e;' +
          'marker-line-color: #000;' +
          'marker-line-width: 2.0;' +
          'marker-allow-overlap: true;' +
        '}' +
        '#multipolygon, #polygon {' +
          'polygon-fill: #AAAAAA;' +
          'polygon-opacity: 0.5;' +
          'line-width: 1;' +
          'line-opacity: 0.5;' +
          'line-color: #000000;' +
          'line-simplify: 2' +
        '}' +
        '#multilinestring, #linestring {' +
          'line-width: 2.0;' +
          'line-color: #0000ff;' +
          'line-opacity: 0.75;' +
          'line-simplify: 2' +
        '}'
      );

      // The default name for geo columns ingressed normally is 'the_geom', but
      // some datasets may have a different name which we should attempt first.
      var geoColumnFieldName = _(
          _.get(this, '_layerModel._view.columns', [])
        ).filter(function(column) {
        return /(polygon|line|point)$/.test(column.dataTypeName);
      }).pluck('fieldName').first();
      var tileUrl = [
        '/tiles/' + layerName + '/' + (geoColumnFieldName || 'the_geom'),
        '/${z}/${x}/${y}.png',
        '?$limit=200000&$overscan=32&$mondara=true&$style=' + style
      ].join('');
      return new OpenLayers.Layer.XYZ(layerName, tileUrl, layerOpts);
    },

    // this has some meaning in the OBE way. The NBE just hits the dummy
    // feature protocol. the whole feature protocol thing doesn't really
    // map well onto our use cases afaict and adds a bunch of complexity, so
    // instead of figuring it out and using it this will just have to suffice.
    _dummyProtocol:function() {
      return {
        setFeatureType: _.noop
      };
    },

    featureGetter: function() {
      return new NBEFeatureGetter({
        layer: this._layerModel,
        protocol: this._dummyProtocol()
      });
    }
  });



  // There's a concept called OverlayLayer in the old code, but I don't see any reason for it.
  $.Control.registerMixin('mondara', {
    initializeLayer: function() {
      var layerObj = this;

      layerObj._config = layerObj._view.metadata.geo;
      layerObj._pubDate = layerObj._view.publicationDate;
      layerObj._dataLayers = [];

      // If we are processing a single layer only, munge with parent properties.
      if (layerObj._view.geoParent) {
        var parentMetadata = _.cloneDeep(layerObj._view.geoParent.metadata.geo);
        parentMetadata.layers = layerObj._view.id;
        layerObj._config = parentMetadata;
      }

      this._provider = new NBEMapProvider(this);

      _.each(layerObj._config.layers.split(','), function(layerName) {
        var opacity = _.isNumber(layerObj._displayFormat.opacity)
            && layerObj._displayFormat.opacity;

        var layerOpts = {
            isBaseLayer: false,
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(256, 256),
            opacity: opacity,
            params: {
                layers: layerObj._config.namespace + ':' + layerName,
                format: 'image/png',
                _soc_pubDate: layerObj._pubDate,
                tiled: true,
                transparent: true
            }
        };

        var layer = this._provider.getLayer(layerName, layerOpts);
        layer.atlasId = layerName;
        layerObj._map.addLayer(layer);
        layerObj._dataLayers.push(layer);
      }, this);

      layerObj._view.getChildOptionsForType('table', function(views) {
        _.each(layerObj._dataLayers, function(layer, index) {
          if (index < views.length) {
            layer.name = views[index].name;
          }
        });
        layerObj._parent._controls.Overview.redraw();
      });

      layerObj._map.events.register('changelayer', null, function(evtObj) {
        if (_.isUndefined(layerObj._getFeature)) { return; }
        if (!_.include(['visibility', 'opacity'], evtObj.property)) { return; }
        if (!_.include(layerObj._dataLayers, evtObj.layer)) { return; }
        var featureType = _.chain(layerObj._dataLayers).
          map(function(layer) {
            if (layer.visibility && (_.isNull(layer.opacity) || layer.opacity > 0)) {
              return layer.atlasId;
            } else {
              return null;
            }
          }).
          compact().
          value();

        layerObj._getFeature.protocol.setFeatureType(featureType);
      });
    },

    buildGetFeature: function() {
      var layerObj = this;
      if (layerObj._displayFormat.disableFlyouts || layerObj._getFeature) { return; }

      layerObj._getFeature = this._provider.featureGetter();

      layerObj._map.addControl(layerObj._getFeature);
      layerObj._getFeature.activate();

      layerObj._selectionLayer = new OpenLayers.Layer.Vector(null, {
        styleMap: new OpenLayers.Style(OpenLayers.Feature.Vector.style['default'])
      });
      layerObj._map.addLayer(layerObj._selectionLayer);

      layerObj._map.events.register('click', layerObj, this._provider.handlers.click.bind(this._provider));
      layerObj._getFeature.events.register('clickout', layerObj, function() {
        this.flyoutHandler().cancel();
      });

      layerObj._getFeature.events.register('featuresselected', layerObj, function(evtObj) {
        var features = evtObj.features;

        layerObj._parent.closePopup('loading');

        var $popupText = $.tag({ tagName: 'div',
        contents: _.map(features, function(feature) {
          return { tagName: 'div', 'class': 'row',
              contents: _.map(feature.attributes, function(value, key) {
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

        if (features.length > 1) {
          layerObj.addInfoPagingToFlyout($popupText);
        }

        var lonlat = layerObj._getFeature.pixelToBounds(
            layerObj._getFeature.handlers.click.evt.xy).getCenterLonLat();

        layerObj.flyoutHandler().add(layerObj, lonlat, $popupText[0].innerHTML,
            { onlyIf: 'loading',
              closeBoxCallback: function() { layerObj._getFeature.unselectAll(); } });

        layerObj._selectionLayer.addFeatures(features);
      });

      layerObj._getFeature.events.register('featureunselected', layerObj, function(evtObj) {
        layerObj._selectionLayer.removeFeatures([evtObj.feature]);
        layerObj.flyoutHandler().close();
      });

      layerObj.flyoutHandler().events.register('close', layerObj,
          function() { layerObj._getFeature.unselectAll(); });
    },

    destroy: function() {
      this._super();
      _.each(this._dataLayers, function(layer) { layer.destroy(); });
      if (this._getFeature) { this._getFeature.destroy(); }
      if (this._selectionLayer) { this._selectionLayer.destroy(); }
      // TODO: Check events to unregister.
    },

    reloadOpacity: function() {
      if (_.isNumber(this._displayFormat.opacity)) {
        _.each(this._dataLayers, function(layer) {
          layer.setOpacity(this._displayFormat.opacity);
        }, this);
      }
    },

    preferredExtent: function() {
      return this._maxExtent || this._map.maxExtent;
    },

    layersToRestack: function() {
      return this._dataLayers;
    },

    dataLayers: function() {
      return this._dataLayers;
    },

    // Cheap way to get after-saved-as-child in.
    getData: function() {
      this.zoomToPreferred();
      this._dataLoaded = true;
      this._parent.mapElementLoaded(this._view);
    }
  }, {}, 'socrataDataLayer', 'tiledata');
})(jQuery);