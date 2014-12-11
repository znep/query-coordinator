(function() {
  'use strict';

/*TODO:

3. wrap up refactor of VectorTileFeature
4. begin refactor of VectorTileLayer*/

  function VectorTiles() {

    /****************************************************************************
     *
     * VectorTileUtil
     *
     * Created by Nicholas Hallahan <nhallahan@spatialdev.com> on 8/15/14.
     *
     */

    function VectorTileUtil() { }

    VectorTileUtil.getTileId = function(tilePoint, zoom) {
      return [zoom, tilePoint.x, tilePoint.y].join(':');
    };

    VectorTileUtil.getTileInfoByPointAndZoomLevel = function(point, zoom) {

      function deg2rad(degrees) {
        return degrees * Math.PI / 180;
      }

      var lat = deg2rad(point.lat);
      var lng = deg2rad(point.lng);

      var tileY = parseInt(
        Math.floor(
          (lng + 180) / 360 * (1 << zoom)
        )
      );

      var tileX = parseInt(
        Math.floor(
          (1 - Math.log(Math.tan(deg2rad(lat)) + 1 /
          Math.cos(deg2rad(lat))) / Math.PI) / 2 * (1 << zoom)
        )
      );

      return {
        zoom: zoom,
        tileX: tileX,
        tileY: tileY
      };

    };

    // Reads raw VectorTile data and creates an array of
    // features on each VectorTileLayer instance assigned
    // to the tile.
    VectorTileUtil.unpackVectorTile = function(vectorTile) {

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

    };


    /****************************************************************************
     *
     * VectorTileFeature
     *
     * Depends on `VectorTileUtil`
     *
     * Created by Ryan Whitley, Daniel Duarte, and Nicholas Hallahan on 6/03/14.
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
      this.tileManager = layer.tileManager;
      this.map = this.tileManager.map;

      // how much we divide the coordinate from the vector tile
      this.divisor = feature.extent / layer.options.tileSize;
      this.tileSize = layer.options.tileSize;

      //An object to store the contexts for this feature
      this.tiles = {};

      this.feature = feature;

      this.styleFn = styleFn;

    }

    VectorTileFeature.prototype.draw = function(canvasId) {

      var feature = this.feature;
      //Get the canvas from the parent layer's _tiles object.
      var internalTileId = canvasId.split(":").slice(1, 3).join(':');
      var canvas = this.tileLayer._tiles[internalTileId];

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

    // Takes a coordinate from a vector tile and turns it into a Leaflet Point.
    VectorTileFeature.prototype.projectGeometryToTilePoint = function(coords) {
      return new L.Point(coords.x / this.divisor, coords.y / this.divisor);
    };

    VectorTileFeature.prototype.drawPoint = function(canvas, geometry, computedStyle) {

      var ctx;
      var point;
      var radius;

      if (!_.isObject(computedStyle) ||
          !computedStyle.hasOwnProperty('color') ||
          !computedStyle.hasOwnProperty('radius')) {
        return;
      }

      if (_.isUndefined(canvas)) {
        return;
      }

      ctx = canvas.getContext('2d');

      point = this.projectGeometryToTilePoint(geometry[0][0]);

      radius = computedStyle.radius;

      if (ctx === null) {
        throw new Error('Could not draw point: canvas context is null.');
      }

      ctx.beginPath();
      ctx.fillStyle = computedStyle.color;
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
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

      ctx2d.beginPath();

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
     * Created by Ryan Whitley on 5/17/14.
     *
     * Forked from https://gist.github.com/DGuidi/1716010
     *
     * Depends on `VectorTileFeature`
     *
     */

    var VectorTileLayer = L.TileLayer.Canvas.extend({

      initialize: function(tileManager, options) {

        this.options = {
          debug: false,
          isHiddenLayer: false,
          tileSize: 256
        };
        L.Util.setOptions(this, options);

        this.tileManager = tileManager;

        this.styleFn = options.style;
        this.tiles = {};
        this.featuresByTile = {};

      },

      onAdd: function(map) {

        this.map = map;
        L.TileLayer.Canvas.prototype.onAdd.call(this, map);

      },

      drawTile: function(canvas, tilePoint, zoom) {

        var tileId = VectorTileUtil.getTileId(tilePoint, zoom);

        this.tiles[tileId] = {
          canvas: canvas,
          zoom: zoom,
          size: this.options.tileSize
        }

        this.featuresByTile[tileId] = [];

        return this;

      },

      parseVectorTileLayer: function(vectorTileLayer, tileId) {

        var features = vectorTileLayer.features;
        var i;
        var featureCount = features.length;
        var feature;
        var id;

        for (i = 0; i < featureCount; i++) {

          feature = features[i];
          feature.layer = vectorTileLayer;
          id = feature.properties.id || i;

          this.featuresByTile[tileId].push(new VectorTileFeature(this, feature, this.styleFn(feature)));

        }

        this.redrawTile(tileId);

      },

      //This is the old way.  It works, but is slow for mouseover events.  Fine for click events.
      handleClickEvent: function(evt, cb) {

        //Click happened on the GroupLayer (Manager) and passed it here
        var tileID = evt.tileID.split(":").slice(1, 3).join(":");
        var canvas = this._tiles[tileID];
        if(!canvas) (cb(evt)); //break out
        var x = evt.layerPoint.x - canvas._leaflet_pos.x;
        var y = evt.layerPoint.y - canvas._leaflet_pos.y;

        var tilePoint = {x: x, y: y};

        //no match
        //return evt with empty feature
        evt.feature = null;
        cb(evt);

      },

      clearTile: function(id) {

        //id is the entire zoom:x:y.  we just want x:y.
        var ca = id.split(":");
        var canvasId = ca[1] + ":" + ca[2];

        if (typeof this._tiles[canvasId] === 'undefined') {
          console.error("typeof this._tiles[canvasId] === 'undefined'");
          return;
        }
        var canvas = this._tiles[canvasId];

        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

      },

      redrawTile: function(tileId) {

        var features;
        var featureCount;
        var i;

        //First, clear the canvas
        if (this._tiles.hasOwnProperty(tileId)) {
          this.clearTile(tileId);
        }

        features = this.featuresByTile[tileId];
        featureCount = features.length;

        if (featureCount === 0) {
          return;
        }

        for (i = 0; i < featureCount; i++) {
          features[i].draw(tileId);
        }

      }

    });


    /****************************************************************************
     *
     * VectorTileManager
     *
     * Created by Nicholas Hallahan <nhallahan@spatialdev.com> on 8/15/14.
     *
     * Depends on `pbf`, `VectorTileUtil` and `VectorTileLayer`
     *
     */

    L.TileLayer.VectorTileManager = L.TileLayer.Canvas.extend({

      initialize: function(options) {

        if (!_.isObject(options)) {
          throw new Error('Cannot create VectorTileManager: options is not an object.');
        }

        if (!options.hasOwnProperty('url') || !_.isString(options.url)) {
          throw new Error('Cannot create VectorTileManager: options.url is not a string.');
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
          url: '', //URL TO Vector Tile Source,
          headers: {},
          tileSize: 256
        };
        L.Util.setOptions(this, options);

        // Layers present in the protocol buffer responses
        this.layers = {};
        // Store the max number of tiles to be loaded.  Later, we can use this count to count down PBF loading.
        this.tilesNotYetRendered = 0;

      },

      onAdd: function(map) {
        var self = this;
        var mapClickCallback;

        this.emitRenderStartEvent();

        if (_.isFunction(this.options.onClick)) {

          mapClickCallback = function(e) {
            e.tileInfo = VectorTileUtil.getTileInfoByPointAndZoomLevel(e.latlng, map.getZoom());
            self.options.onClick(e);
          };

          map.on('click', mapClickCallback);

        }

        map.on('zoom', function(e) {
          console.log('ZOOMING', e);
        });

        map.on('layerremove', function(e) {
          // check to see if the layer removed is this one
          // call a method to remove the child layers (the ones that actually have something drawn on them).
          if (e.layer._leaflet_id === self._leaflet_id && e.layer.removeChildLayers) {
            e.layer.removeChildLayers(map);
            if (_.isFunction(self.options.onClick)) {
              map.off('click', mapOnClickCallback);
            }
          }
        });

        this.map = map;
        this.addChildLayers();

        L.TileLayer.Canvas.prototype.onAdd.call(this, map);

      },

      drawTile: function(canvas, tilePoint, zoom) {

        // Capture the max number of the tiles to load here. this.tilesNotYetRendered is
        // an internal number we use to know when we've finished requesting all the active tiles.
        // this._tilesToLoad is maintained by Leaflet; this.tilesNotYetRendered is maintained by us.
        if (this.tilesNotYetRendered < this._tilesToLoad) {
          this.tilesNotYetRendered = this._tilesToLoad;
        }

        if (this.options.debug) {
          this.renderDebugInfo(tilePoint, zoom);
        }

        this.getTileData(tilePoint, zoom, this.renderTile);

      },

      getTileData: function(tilePoint, zoom, renderFn) {
        var self = this;
        var xhr = new XMLHttpRequest();
        var url = this.options.url.
          replace("{z}", zoom).
          replace("{x}", tilePoint.x).
          replace("{y}", tilePoint.y);

        this.registerOutstandingRequest(zoom, VectorTileUtil.getTileId(tilePoint, zoom), xhr);

        xhr.onload = function() {

          var arrayBuffer = [];

          if (parseInt(xhr.status, 10) === 200) {

            self.deregisterOutstandingRequest(VectorTileUtil.getTileId(tilePoint, zoom));

            // Check the current map layer zoom.  If fast zooming is occurring, then short-
            // circuit tiles that are for a different zoom level than we're currently on.
            if (self.map.getZoom() !== zoom) {
              console.log('Fetched tile for zoom level {0}. Map is at zoom level {1}'.format(zoom, self._map.getZoom()));
              return;
            }

            // IE9 doesn't support binary data in xhr.response, so we have to
            // use a righteous hack (See: http://stackoverflow.com/a/4330882).
            if (_.isUndefined(xhr.response) &&
                _.isDefined(window.VBArray) &&
                typeof xhr.responseBody === 'unknown') {
              arrayBuffer = new VBArray(xhr.responseBody).toArray();
            // Default for well-behaved browsers.
            } else if (xhr.response) {
              arrayBuffer = new Uint8Array(xhr.response);
            }

            // If this is a tile with no features to be drawn, quit early.
            if (arrayBuffer.length === 0) {
              return;
            }

            // Invoke renderFn within the context of 'self'
            // (the current instance of VectorTileManager).
            renderFn.call(self, arrayBuffer, VectorTileUtil.getTileId(tilePoint, zoom));

          }

        };

        xhr.onerror = function() {
          self.deregisterOutstandingRequest(tile.zoom, tile.id);
          throw new Error('Could not retrieve protocol buffer tile from tileServer: "{0} {1}"'.format(xhr.status, xhr.response));
        };

        self._emitTileLoadingEvent();

        xhr.open('GET', url, true);

        // Set user-defined headers.
        _.each(self.options.headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.responseType = 'arraybuffer';

        xhr.send();

        //either way, reduce the count of tilesNotYetRendered tiles here
        self.reduceTilesToProcessCount();

      },

      renderTile: function(arrayBuffer, tileId) {
        var vectorTile;

        vectorTile = VectorTileUtil.unpackVectorTile(
          new VectorTile(
            new pbf(arrayBuffer)
          )
        );

        this.processVectorTileLayers(vectorTile, tileId);

        this._emitTileLoadedEvent();

      },

      renderDebugInfo: function(tile) {
        var ctx = tile.canvas.getContext('2d');
        var tilePoint = tile.tilePoint;
        var tileSize = tile.tileSize;
        var zoomLevel = tile.zoomLevel;

        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';

        // Border
        ctx.strokeRect(0, 0, tileSize, tileSize);
        // Top-left cornder
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
        ctx.strokeText(zoomLevel + ' ' + tilePoint.x + ' ' + tilePoint.y, tileSize / 2 - 30, tileSize / 2 - 10);

      },

      processVectorTileLayers: function(vectorTile, tileId) {
        var layerIds = Object.keys(vectorTile.layers);
        var i = layerIds.length;
        var layerId;
        var layer;

        while (i--) {
          layerId = layerIds[i];
          layer = vectorTile.layers[layerId];

          if (!this.layers.hasOwnProperty(layerId)) {

            this.layers[layerId] = new VectorTileLayer(
              this,
              {
                filter: this.options.filter,
                layerOrdering: this.options.layerOrdering,
                style: this.style,
                name: layerId
              }
            ).
            addTo(this.map);

          }

          this.layers[layerId].parseVectorTileLayer(layer, tileId);

        }

      },

      addChildLayers: function() {
        var layerIds = Object.keys(this.layers);
        var i = layerIds.length;
        var layer;

        while (i--) {
          layer = this.layers[layerIds[i]];
          if (layer.hasOwnProperty('_map')) {
            this.map.addLayer(layer);
          }
        }

      },

      removeChildLayers: function() {
        var layerIds = Object.keys(this.layers);
        var i = layerIds.length;
        var layer;

        while (i--) {
          layer = this.layers[layerIds[i]];
          this.map.removeLayer(layer);
        }

      },

      setVisibleLayersStyle:function(style, value) {
        var keys = Object.keys(this.layers);
        var i = keys.length;

        while (i--) {
          this.layers[keys[i]]._tileContainer.style[style] = value;
        }
      },

      setOpacity:function(opacity) {
        this.setVisibleLayersStyle('opacity', opacity);
      },

      setZIndex:function(zIndex) {
        this.setVisibleLayersStyle('zIndex', zIndex);
      },


// THIS STUFF IS STILL WIP

      registerOutstandingRequest: function(zoom, id, xhr) {

      },

      deregisterOutstandingRequest: function(zoom, id) {

      },

      reduceTilesToProcessCount: function(){
        this.tilesNotYetRendered--;
        if(this.tilesNotYetRendered === 0){
          //Trigger event letting us know that all tiles have been loaded and rendered (or 404'd).
          this.bringToFront();
        }
      },

      _emitTileLoadingEvent: function() {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('protobuffer-tile-loading', true, true);
        evt.tilesToProcess = this.tilesNotYetRendered;
        this.map._container.dispatchEvent(evt);
      },

      _emitTileLoadedEvent: function() {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('protobuffer-tile-loaded', true, true);
        evt.tilesToProcess = this.tilesNotYetRendered;
        this.map._container.dispatchEvent(evt);
      },

      emitRenderStartEvent: function() {
        console.log('RENDER STARTED');
      },
      emitRenderEndEvent: function() {
        console.log('RENDER COMPLETE');
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
