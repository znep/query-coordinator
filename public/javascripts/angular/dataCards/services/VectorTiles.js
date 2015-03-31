(function() {
  'use strict';

  // This is the Angular wrapper around VectorTileUtil, VectorTileFeature,
  // VectorTileLayer and VectorTileManager.
  function VectorTiles() {

    /****************************************************************************
     *
     * VectorTileUtil
     *
     */

    var VectorTileUtil = {

      getTileId: function(tilePoint, zoom) {
        return [zoom, tilePoint.x, tilePoint.y].join(':');
      },

      getTileInfoByPointAndZoomLevel: function(point, zoom) {

        function deg2rad(degrees) {
          return degrees * Math.PI / 180;
        }

        var lat = deg2rad(point.lat);
        var lng = deg2rad(point.lng);

        var tileY = Math.floor(
          (lng + 180) / 360 * (1 << zoom)
        );

        var tileX = Math.floor(
          (1 - Math.log(Math.tan(deg2rad(lat)) + 1 /
          Math.cos(deg2rad(lat))) / Math.PI) / 2 * (1 << zoom)
        );

        return {
          zoom: zoom,
          tileX: tileX,
          tileY: tileY
        };
      },

      // Reads raw VectorTile data and creates an array of
      // features on each VectorTileLayer instance assigned
      // to the tile.
      unpackVectorTile: function(vectorTile) {

        var keys = Object.keys(vectorTile.layers);
        var i = keys.length;
        var vectorTileLayer;
        var features;
        var j;
        var vectorTileFeature;

        while (i--) {
          vectorTileLayer = vectorTile.layers[keys[i]];
          vectorTileLayer.features = [];
          features = vectorTileLayer._features;
          j = features.length;

          while (j--) {
            vectorTileFeature = vectorTileLayer.feature(j);
            vectorTileFeature.coordinates = vectorTileFeature.loadGeometry();
            vectorTileLayer.features.push(vectorTileFeature);
          }

        }

        return vectorTile;
      },

      getTileLayerCanvas: function(tileLayer, tileId) {
        var leafletTileId = tileId.split(':').slice(1, 3).join(':');
        return tileLayer._tiles[leafletTileId];
      }
    };


    /****************************************************************************
     *
     * VectorTileFeature
     *
     * Depends on `VectorTileUtil`
     *
     */

    function VectorTileFeature(layer, feature, styleFn) {

      var keys;
      var i;
      var key;

      if (!feature) {
        return null;
      }

      // Apply all of the properties of feature to this object.
      keys = Object.keys(feature);
      i = keys.length;

      while (i--) {
        key = keys[i];
        this[key] = feature[key];
      }

      this.tileLayer = layer;
      this.tileSize = layer.options.tileSize;
      this.map = layer.tileManager.map;
      // Divisor is the amount by which we divide coordinate values in
      // order to project them into the vector tile's coordinate space.
      this.divisor = feature.extent / this.tileSize;
      this.feature = feature;
      this.styleFn = styleFn;
    }

    // Takes a coordinate from a vector tile and turns it into a Leaflet Point.
    VectorTileFeature.prototype.projectGeometryToTilePoint = function(coordinates) {
      return new L.Point(coordinates.x / this.divisor, coordinates.y / this.divisor);
    };

    VectorTileFeature.prototype.draw = function(tileId) {

      var feature = this.feature;
      var canvas = VectorTileUtil.getTileLayerCanvas(this.tileLayer, tileId);

      switch (feature.type) {
        case 1: //Point
          this.drawPoint(canvas, feature.coordinates, this.styleFn);
          break;

        case 2: //LineString
          this.drawLineString(canvas, feature.coordinates, this.styleFn);
          break;

        case 3: //Polygon
          this.drawPolygon(canvas, feature.coordinates, this.styleFn);
          break;

        default:
          throw new Error('Cannot draw VectorTileFeature: unrecognized type: "{0}"'.format(feature.type));
      }
    };

    VectorTileFeature.prototype.drawPoint = function(canvas, geometry, computedStyle) {

      var ctx;
      var projectedPoint;
      var radius;

      if (_.isUndefined(canvas) ||
          !_.isObject(computedStyle) ||
          !computedStyle.hasOwnProperty('color') ||
          !computedStyle.hasOwnProperty('radius')) {
        return;
      }

      ctx = canvas.getContext('2d');

      if (ctx === null) {
        throw new Error('Could not draw VectorTileFeature point: canvas context is null.');
      }

      projectedPoint = this.projectGeometryToTilePoint(geometry[0][0]);

      if (_.isFunction(computedStyle.radius)) {
        radius = computedStyle.radius(this.map.getZoom());
      } else {
        radius = computedStyle.radius;
      }

      ctx.fillStyle = computedStyle.color;
      ctx.beginPath();
      ctx.arc(projectedPoint.x, projectedPoint.y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      if (computedStyle.lineWidth && computedStyle.strokeStyle) {

        ctx.lineWidth = computedStyle.lineWidth;
        ctx.strokeStyle = computedStyle.strokeStyle;
        ctx.stroke();

      }

      ctx.restore();
    };

    VectorTileFeature.prototype.drawLineString = function(canvas, coordinateArray, computedStyle) {

      var ctx;
      var projectedCoordinates;
      var i;
      var coordinates;
      var j;
      var projectedPoint;
      var coordinateGroupCount;
      var coordinateCount;

      if (!_.isObject(computedStyle) ||
          !computedStyle.hasOwnProperty('color') ||
          !computedStyle.hasOwnProperty('size')) {
        return;
      }

      if (_.isUndefined(canvas)) {
        return;
      }

      ctx = canvas.getContext('2d');

      if (ctx === null) {
        throw new Error('Could not draw lineString: canvas context is null.');
      }

      projectedCoordinates = [];

      ctx.strokeStyle = computedStyle.color;
      ctx.lineWidth = computedStyle.size;

      ctx.beginPath();

      coordinateGroupCount = coordinateArray.length;

      for (i = 0; i < coordinateGroupCount; i++) {

        coordinates = coordinateArray[i];
        coordinateCount = coordinates.length;

        for (j = 0; j < coordinateCount; j++) {
          projectedPoint = this.projectGeometryToTilePoint(coordinates[i]);
          projectedCoordinates.push(projectedPoint);

          if (j === 0) {
            ctx.moveTo(projectedPoint.x, projectedPoint.y);
          } else {
            ctx.lineTo(projectedPoint.x, projectedPoint.y);
          }

        }
      }

      ctx.stroke();
      ctx.restore();
    };

    VectorTileFeature.prototype.drawPolygon = function(canvas, coordinateArray, computedStyle) {

      function validateOutline(outline) {
        var validatedOutline = null;
        if (outline.hasOwnProperty('color') && outline.hasOwnProperty('size')) {
          validatedOutline = outline;
        }
        return validatedOutline;
      }

      var ctx;
      var outline;
      var projectedCoordinates;
      var coordinateGroupCount;
      var i;
      var coordinateCount;
      var j;
      var projectedPoint;
      var coordinates;

      if (!_.isObject(computedStyle) ||
          !computedStyle.hasOwnProperty('color') ||
          !computedStyle.hasOwnProperty('size')) {
        return;
      }

      if (_.isUndefined(canvas)) {
        return;
      }

      ctx = canvas.getContext('2d');
      outline = computedStyle.hasOwnProperty('outline') ? validateOutline(computedStyle.outline) : null;

      projectedCoordinates = [];

      // computedStyle.color may be a function or a value.
      if (_.isFunction(computedStyle.color)) {
        ctx.fillStyle = style.color();
      } else {
        ctx.fillStyle = style.color;
      }

      if (outline !== null) {
        ctx.strokeStyle = outline.color;
        ctx.lineWidth = outline.size;
      }

      ctx.beginPath();

      coordinateGroupCount = coordinateArray.length;

      for (i = 0; i < coordinateGroupCount; i++) {

        coordinates = coordinateArray[i];
        coordinateCount = coordinates.length;

        for (j = 0; j < coordinateCount; j++) {
          projectedPoint = this.projectGeometryToTilePoint(coordinates[j]);
          projectedCoordinates.push(projectedPoint);

          if (j === 0) {
            ctx.moveTo(projectedPoint.x, projectedPoint.y);
          } else {
            ctx.lineTo(projectedPoint.x, projectedPoint.y);
          }

        }
      }

      ctx.closePath();
      ctx.fill();

      if (outline !== null) {
        ctx.stroke();
      }

      ctx.restore();
    };


    /****************************************************************************
     *
     * VectorTileLayer
     *
     * Originally forked from https://gist.github.com/DGuidi/1716010
     *
     * Depends on `VectorTileFeature`
     *
     */

    var VectorTileLayer = L.TileLayer.Canvas.extend({

      initialize: function(tileManager, options) {

        this.options = {
          tileSize: 256
        };
        L.Util.setOptions(this, options);

        this.tileManager = tileManager;
        this.styleFn = options.style;
        this.featuresByTile = {};
      },

      onAdd: function(map) {

        this.map = map;
        L.TileLayer.Canvas.prototype.onAdd.call(this, map);
      },

      // drawTile is a method that Leaflet expects to exist with
      // the specified signature. This is called when we need to
      // prepare a tile for rendering, but the actual rendering
      // is handled by our own `renderTile` method instead (as
      // a result of needing to fetch and parse protocol buffers.
      drawTile: function(canvas, tilePoint, zoom) {

        var tileId = VectorTileUtil.getTileId(tilePoint, zoom);

        this.featuresByTile[tileId] = [];

        return this;
      },

      loadData: function(vectorTileData, tileId, tileRenderedCallback) {

        var features = vectorTileData.features;
        var i;
        var featureCount = features.length;
        var feature;
        var featureArray;

        if (!this.featuresByTile.hasOwnProperty(tileId) && featureCount > 0) {
          this.featuresByTile[tileId] = [];
        }

        featureArray = this.featuresByTile[tileId];

        for (i = 0; i < featureCount; i++) {

          feature = features[i];

          featureArray.push(
            new VectorTileFeature(this, feature, this.styleFn(feature))
          );

        }

        this.renderTile(tileId, tileRenderedCallback);
      },

      renderTile: function(tileId, tileRenderedCallback) {

        var features;
        var featureCount;
        var i;

        //First, clear the canvas
        if (this._tiles.hasOwnProperty(tileId)) {
          this.clearTile(tileId);
        }

        features = this.featuresByTile[tileId];
        featureCount = features.length;

        for (i = 0; i < featureCount; i++) {
          features[i].draw(tileId);
        }

        tileRenderedCallback();
      },

      clearTile: function(tileId) {

        var canvas = VectorTileUtil.getTileLayerCanvas(this.tileLayer, tileId);
        var ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });


    /****************************************************************************
     *
     * VectorTileManager
     *
     * Depends on `pbf`, `VectorTileUtil` and `VectorTileLayer`
     *
     */

    L.TileLayer.VectorTileManager = L.TileLayer.Canvas.extend({

      initialize: function(options) {

        if (!_.isObject(options)) {
          throw new Error('Cannot create VectorTileManager: options is not an object.');
        }

        if (!options.hasOwnProperty('vectorTileGetter') || !_.isFunction(options.vectorTileGetter)) {
          throw new Error('Cannot create VectorTileManager: options.vectorTileGetter is not a function.');
        }

        if (!options.hasOwnProperty('filter') || !_.isFunction(options.filter)) {
          throw new Error('Cannot create VectorTileManager: options.filter is not a function.');
        }

        if (!options.hasOwnProperty('layerOrdering') || !_.isFunction(options.layerOrdering)) {
          throw new Error('Cannot create VectorTileManager: options.layerOrdering is not a function.');
        }

        if (!options.hasOwnProperty('style') || !_.isFunction(options.style)) {
          throw new Error('Cannot create VectorTileManager: options.style is not a function.');
        }

        this.style = options.style;

        this.options = {
          debug: false,
          url: '',
          headers: {},
          tileSize: 256,
          debounceMilliseconds: 500,
          onRenderStart: function() {},
          onRenderComplete: function() {}
        };
        L.Util.setOptions(this, options);

        // Layers present in the protocol buffer responses.
        this.layers = new Map();
        this.outstandingTileDataRequests = new Map();
        this.map = null;
        this.delayedTileDataRequests = [];
        this.firstRequest = true;
        this.debouncedFlushOutstandingQueue = _.debounce(
          this.flushOutstandingQueue,
          this.options.debounceMilliseconds
        );
      },

      onAdd: function(map) {

        function getTileInfo(e) {
          e.tileInfo = VectorTileUtil.getTileInfoByPointAndZoomLevel(e.latlng, map.getZoom());
        }

        var self = this;
        var mapMousedownCallback;
        var mapMouseupCallback;
        var mapMousemoveCallback;

        this.map = map;

        if (_.isFunction(this.options.mousedown)) {

          mapMousedownCallback = function(e) {
            addTileInfo(e);
            self.options.mousedown(e);
          };

          map.on('mousedown', mapMousedownCallback);
        }

        if (_.isFunction(this.options.mouseup)) {

          mapMouseupCallback = function(e) {
            addTileInfo(e);
            self.options.mouseup(e);
          };

          map.on('mouseup', mapMouseupCallback);
        }

        if (_.isFunction(this.options.mousemove)) {

          mapMousemoveCallback = function(e) {
            addTileInfo(e);
            self.options.mousemove(e);
          };

          map.on('mousemove', mapMousemoveCallback);
        }

        map.on('layerremove', function(e) {

          // Check to see if the layer removed is this one, and if it is
          // remove its child layers.
          if (e.layer._leaflet_id === self._leaflet_id && e.layer.removeChildLayers) {

            e.layer.removeChildLayers(map);

            if (_.isFunction(self.options.mousedown)) {
              map.off('mousedown', mapMousedownCallback);
            }

            if (_.isFunction(self.options.mouseup)) {
              map.off('mouseup', mapMouseupCallback);
            }

            if (_.isFunction(self.options.mousemove)) {
              map.off('mousemove', mapMousemoveCallback);
            }

          }
        });

        this.addChildLayers();

        L.TileLayer.Canvas.prototype.onAdd.call(this, map);
      },

      drawTile: function(canvas, tilePoint, zoom) {

        if (this.options.debug) {
          this.renderDebugInfo(tilePoint, zoom);
        }

        this.debounceGetTileData(tilePoint, zoom, this.processVectorTileLayers);
      },

      debounceGetTileData: function(tilePoint, zoom, callback) {
        if (this.firstRequest) {
          this.lastCommitedZoomLevel = zoom;
          this.firstRequest = false;
        }
        var userHasZoomed = _.isUndefined(this.lastCommitedZoomLevel) || this.lastCommitedZoomLevel !== zoom;
        this.lastSeenZoomLevel = zoom;

        if (userHasZoomed) {
          this.lastCommitedZoomLevel = undefined;
          this.delayedTileDataRequests.push({
            tilePoint: tilePoint,
            zoom: zoom,
            callback: callback
          });
          this.tileLoading(VectorTileUtil.getTileId(tilePoint, zoom));
        } else {
          this.getTileData(tilePoint, zoom, callback);
        }

        this.debouncedFlushOutstandingQueue();
      },

      flushOutstandingQueue: function() {
        this.lastCommitedZoomLevel = this.lastSeenZoomLevel;
        var self = this;
        _.each(this.delayedTileDataRequests, function(request) {
          if (request.zoom === self.lastCommitedZoomLevel) {
            self.getTileData(request.tilePoint, request.zoom, request.callback);
          } else {
            self.tileLoaded(VectorTileUtil.getTileId(request.tilePoint, request.zoom));
          }
        });
        this.delayedTileDataRequests.length = 0;
      },

      getTileData: function(tilePoint, zoom, callback) {
        var self = this;
        var tileId = VectorTileUtil.getTileId(tilePoint, zoom);
        var getterPromise;

        // Don't re-request tiles that are already outstanding.
        if (self.outstandingTileDataRequests.has(tileId) &&
          self.outstandingTileDataRequests.get(tileId) !== null) {
          return;
        }
        getterPromise = self.options.vectorTileGetter(zoom, tilePoint.x, tilePoint.y);
        self.tileLoading(tileId, getterPromise);
        getterPromise.then(
          function(response) {
            if (_.isEmpty(response.data)) {
              self.tileLoaded(tileId);
            } else {
              callback.call(self, response.data, tileId);
            }
          },
          function() {
            self.tileLoaded(tileId);
          }
        );
      },

      renderDebugInfo: function(tilePoint, zoom) {

        var ctx = this._tiles[tilePoint.x + ':' + tilePoint.y].getContext('2d');
        var tileSize = this.options.tileSize;

        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';

        // Border
        ctx.strokeRect(0, 0, tileSize, tileSize);
        // Top-left corner
        ctx.fillRect(0, 0, 5, 5);
        // Top-right corner
        ctx.fillRect(0, (tileSize - 5), 5, 5);
        // Bottom-left corner
        ctx.fillRect(tileSize - 5, 0, 5, 5);
        // Bottom-right corner
        ctx.fillRect(tileSize - 5, tileSize - 5, 5, 5);
        // Center
        ctx.fillRect(tileSize / 2 - 5, tileSize / 2 - 5, 10, 10);
        // Label
        ctx.strokeText(zoom + ':' + tilePoint.x + ':' + tilePoint.y, tileSize / 2 - 30, tileSize / 2 - 10);
      },

      processVectorTileLayers: function(arrayBuffer, tileId) {

        var self = this;
        var vectorTile;
        var layerIds;
        var i;
        var layerId;
        var layer;

        function tileRenderedCallback() {
          self.tileLoaded(tileId);
        }

        vectorTile = VectorTileUtil.unpackVectorTile(
          new VectorTile(
            new pbf(arrayBuffer)
          )
        );

        layerIds = Object.keys(vectorTile.layers);
        i = layerIds.length;

        if (i === 0) {
          tileRenderedCallback();
          return;
        }

        while (i--) {
          layerId = layerIds[i];
          layer = vectorTile.layers[layerId];

          if (!this.layers.has(layerId)) {
            var newLayer = new VectorTileLayer(
              this,
              {
                filter: this.options.filter,
                layerOrdering: this.options.layerOrdering,
                style: this.style,
                name: layerId
              }
            );

            this.layers.set(layerId, newLayer);
            newLayer.addTo(this.map);
          }

          this.layers.get(layerId).loadData(layer, tileId, tileRenderedCallback);
        }
      },

      addChildLayers: function() {
        var self = this;
        this.layers.forEach(function(layer) {
          if (value.hasOwnProperty('_map')) {
            self.map.addLayer(layer);
          }
        });
      },

      removeChildLayers: function() {
        var self = this;
        this.layers.forEach(function(layer) {
          self.map.removeLayer(layer);
        });
      },

      tileLoading: function(tileId, getterPromise) {
        if (this.outstandingTileDataRequests.size === 0) {
          this.options.onRenderStart();
        }
        this.outstandingTileDataRequests.set(tileId, getterPromise || null);
      },

      tileLoaded: function(tileId) {
        this.outstandingTileDataRequests['delete'](tileId);

        if (this.outstandingTileDataRequests.size === 0) {
          this.options.onRenderComplete();
        }
      }
    });

    return {
      create: function(options) {
        return new L.TileLayer.VectorTileManager(options);
      }
    };
  }

  angular.
    module('dataCards.services').
      factory('VectorTiles', VectorTiles);

})();
