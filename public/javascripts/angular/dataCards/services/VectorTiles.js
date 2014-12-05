(function() {
  'use strict';

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

    VectorTileUtil.getFeatureId = function(feature) {
      return feature.properties.id;
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


    /****************************************************************************
     *
     * VectorTileFeature
     *
     * Depends on `VectorTileUtil`
     *
     * Created by Ryan Whitley, Daniel Duarte, and Nicholas Hallahan on 6/03/14.
     *
     */

    function VectorTileFeature(layer, feature, tile, id, style) {

      var keys;
      var i;
      var key;

      if (!feature) {
        return null;
      }

      this.id = id;

      // Apply all of the properties of feature to this object.
      keys = Object.keys(feature);
      i = keys.length;

      while (i--) {
        key = keys[i];
        this[key] = feature[key];
      }


      this.tileLayer = layer;
      this.tileManager = this.tileLayer.tileManager;
      this.map = this.tileManager.map;

      //this.layerLink = this.tileManager.layerLink;
      //this.toggleEnabled = true;
      //this.selected = false;

      // how much we divide the coordinate from the vector tile
      this.divisor = feature.extent / tile.tileSize;
      this.extent = feature.extent;
      this.tileSize = tile.tileSize;

      //An object to store the paths and contexts for this feature
      this.tiles = {};

      this.style = style;

      //Add to the collection
      this.addTileFeature(feature, tile);

    }

    VectorTileFeature.prototype.setStyle = function(styleFn) {

      this.style = styleFn(this, null);

    };

    VectorTileFeature.prototype.draw = function(canvasId) {

      //Get the info from the tiles list
      var tileInfo = this.tiles[canvasId];
      var feature = tileInfo.feature;
      var tile = tileInfo.tile;
      //Get the actual canvas from the parent layer's _tiles object.
      var internalTileId = canvasId.split(":").slice(1, 3).join(':');

      tile.canvas = this.tileLayer._tiles[internalTileId];

      switch (feature.type) {
        case 1: //Point
          this.drawPoint(tile, feature.coordinates, this.style);
          break;

        case 2: //LineString
          this.drawLineString(tile, feature.coordinates, this.style);
          break;

        case 3: //Polygon
          this.drawPolygon(tile, feature.coordinates, this.style);
          break;

        default:
          throw new Error('Cannot draw VectorTileFeature: unrecognized type: "{0}"'.format(feature.type));
      }

    };

    VectorTileFeature.prototype.getPathsForTile = function(canvasId) {

      //Get the info from the parts list
      return this.tiles[canvasId].paths;

    };

    VectorTileFeature.prototype.addTileFeature = function(feature, tile) {
      //Store the important items in the tiles list

      //We only want to store info for tiles for the current map zoom.  If it is tile info for another zoom level, ignore it
      //Also, if there are existing tiles in the list for other zoom levels, expunge them.
      var zoom = this.map.getZoom();

      if (tile.zoom != zoom) {
        return;
      }

      //TODO: This iterates thru all tiles every time a new tile is added.  Figure out a better way to do this.
      this.clearTileFeatures(zoom); 

      this.tiles[tile.id] = {
        tile: tile,
        feature: feature,
        paths: []
      };

    };


    // Clear the inner list of tile features if they don't match the given zoom.
    //
    // @param zoom
    VectorTileFeature.prototype.clearTileFeatures = function(zoom) {

      //If stored tiles exist for other zoom levels, expunge them from the list.
      var keys = Object.keys(this.tiles);
      var i = keys.length;
      var key;
      while (i--) {
        key = keys[i];
        if (key.split(':')[0] !== zoom) {
          delete this.tiles[key];
        }
      }

    };

    VectorTileFeature.prototype.drawPoint = function(tileInfo, geometry, computedStyle) {

      var tile;
      var point;
      var canvas;
      var radius;
      var context;

      if (!computedStyle.hasOwnProperty('color') || !computedStyle.hasOwnProperty('radius')) {
        return;
      }

      tile = this.tiles[tileInfo.id];

      if (_.isUndefined(tileInfo.canvas)) {
        return;
      }

      canvas = tileInfo.canvas;
      point = this.mapGeometryToTilePoint(geometry[0][0]);

      // If style.radius is a function, we pass the zoom level to it in order
      // to get a zoom-level-dependent radius. Otherwise, we treat it as a
      // number and use it directly.
      if (_.isFunction(computedStyle.radius)) {
        radius = computedStyle.radius(tileInfo.zoom);
      } else{
        radius = computedStyle.radius;
      }

      context = canvas.getContext('2d');

      if (context === null) {
        throw new Error('drawPoint error: {0}'.format(e));
      }

      context.beginPath();
      context.fillStyle = computedStyle.color;
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.closePath();
      context.fill();

      if (computedStyle.lineWidth && computedStyle.strokeStyle) {

        context.lineWidth = computedStyle.lineWidth;
        context.strokeStyle = computedStyle.strokeStyle;
        context.stroke();

      }

      context.restore();
      tile.paths.push([point]);

    };

    VectorTileFeature.prototype.drawLineString = function(tile, coordsArray, style) {

      if (!style) {
        return;
      }

      var ctx2d = tile.canvas.getContext('2d');
      ctx2d.strokeStyle = style.color;
      ctx2d.lineWidth = style.size;
      ctx2d.beginPath();

      var projCoords = [];
      var thisTile = this.tiles[tile.id];

      for (var gidx in coordsArray) {
        var coords = coordsArray[gidx];

        for (i = 0; i < coords.length; i++) {
          var method = (i === 0 ? 'move' : 'line') + 'To';
          var proj = this.mapGeometryToTilePoint(coords[i]);
          projCoords.push(proj);
          ctx2d[method](proj.x, proj.y);
        }
      }

      ctx2d.stroke();
      ctx2d.restore();

      thisTile.paths.push(projCoords);

    };

    VectorTileFeature.prototype.drawPolygon = function(tile, coordsArray, style) {

      if (!style) {
        return;
      }

      if (!tile.canvas) {
        return;
      }

      var ctx2d = ctx.canvas.getContext('2d');
      var outline = style.outline;

      // color may be defined via function to make choropleth work right
      if (typeof style.color === 'function') {
        ctx2d.fillStyle = style.color();
      } else {
        ctx2d.fillStyle = style.color;
      }

      if (outline) {
        ctx2d.strokeStyle = outline.color;
        ctx2d.lineWidth = outline.size;
      }
      ctx2d.beginPath();

      var projCoords = [];
      var thisTile = this.tiles[tile.id];

      for (var gidx = 0, len = coordsArray.length; gidx < len; gidx++) {
        var coords = coordsArray[gidx];

        for (var i = 0; i < coords.length; i++) {
          var coord = coords[i];
          var method = (i === 0 ? 'move' : 'line') + 'To';
          var proj = this.mapGeometryToTilePoint(coords[i]);
          projCoords.push(proj);
          ctx2d[method](proj.x, proj.y);
        }
      }

      ctx2d.closePath();
      ctx2d.fill();
      if (outline) {
        ctx2d.stroke();
      }

      thisTile.paths.push(projCoords);

    };

    // Projects a vector tile point to the Spherical Mercator pixel space for a given zoom level.
    //
    // @param vecPt
    // @param tileX
    // @param tileY
    // @param extent
    // @param tileSize
    VectorTileFeature.prototype._project = function(vecPt, tileX, tileY, extent, tileSize) {

      var xOffset = tileX * tileSize;
      var yOffset = tileY * tileSize;

      return {
        x: Math.floor(vecPt.x + xOffset),
        y: Math.floor(vecPt.y + yOffset)
      };

    };

    // Takes a coordinate from a vector tile and turns it into a Leaflet Point.
    //
    // @param ctx
    // @param coords
    // @returns {eGeomType.Point}
    // @private
    VectorTileFeature.prototype.mapGeometryToTilePoint = function(coords) {

      return new L.Point(coords.x / this.divisor, coords.y / this.divisor);

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

      _isPointInPoly: function(pt, poly) {

        if(poly && poly.length) {
          for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
            && (c = !c);
          return c;
        }

      },

      initialize: function(tileManager, options) {

        this.options = {
          debug: false,
          isHiddenLayer: false,
          tileSize: 256
        };
        L.Util.setOptions(this, options);


        this._featureIsClicked = {};

        this.tileManager = tileManager;
        
        this.style = options.style;
        this.name = options.name;
        this._canvasIDToFeatures = {};
        this.features = {};
        this.featuresWithLabels = [];
        this._highestCount = 0;

      },

      onAdd: function(map) {

        this.map = map;
        L.TileLayer.Canvas.prototype.onAdd.call(this, map);

      },

      drawTile: function(canvas, tilePoint, zoom) {

        var tile = {
          id: VectorTileUtil.getTileId(tilePoint, zoom),
          canvas: canvas,
          // The x/y values of tilePoint correspond to the x/y coordinates of the tile
          tile: tilePoint,
          zoom: zoom,
          tileSize: this.options.tileSize
        };

        if (!this._canvasIDToFeatures[tile.id]) {
          this._initializeFeaturesHash(tile);
        }

        if (!this.features) {
          this.features = {};
        }

        return this;

      },

      _initializeFeaturesHash: function(ctx){

        this._canvasIDToFeatures[ctx.id] = {};
        this._canvasIDToFeatures[ctx.id].features = [];
        this._canvasIDToFeatures[ctx.id].canvas = ctx.canvas;

      },

      _draw: function(ctx) {
        //Draw is handled by the parent VectorTileManager object
      },

      /**
       * See https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js
       *
       * Wait until the test condition is true or a timeout occurs. Useful for waiting
       * on a server response or for a ui change (fadeIn, etc.) to occur.
       *
       * @param testFx javascript condition that evaluates to a boolean,
       * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
       * as a callback function.
       * @param onReady what to do when testFx condition is fulfilled,
       * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
       * as a callback function.
       * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
       */
       waitFor: function(testFx, onReady, timeOutMillis) {

        var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000; //< Default Max Timout is 3s
        var start = new Date().getTime();
        var condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
        var interval = setInterval(function () {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
              // If not time-out yet and condition not yet fulfilled
              condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
              if (!condition) {
                // If condition still not fulfilled (timeout but condition is 'false')
                console.log("'waitFor()' timeout");
                clearInterval(interval); //< Stop this interval
                typeof (onReady) === "string" ? eval(onReady) : onReady('timeout'); //< Do what it's supposed to do once the condition is fulfilled
              } else {
                // Condition fulfilled (timeout and/or condition is 'true')
                console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                clearInterval(interval); //< Stop this interval
                typeof (onReady) === "string" ? eval(onReady) : onReady('success'); //< Do what it's supposed to do once the condition is fulfilled
              }
            }
          }, 50); //< repeat check every 50ms
      },

      getCanvas: function(parentCtx){
        //This gets called if a vector tile feature has already been parsed.
        //We've already got the geom, just get on with the drawing.
        //Need a way to pluck a canvas element from this layer given the parent layer's id.
        //Wait for it to get loaded before proceeding.
        var tilePoint = parentCtx.tile;
        var ctx = this._tiles[tilePoint.x + ":" + tilePoint.y];

        if(ctx){
          parentCtx.canvas = ctx;
          this.redrawTile(parentCtx.id);
          return;
        }

        var self = this;

        //This is a timer that will wait for a criterion to return true.
        //If not true within the timeout duration, it will move on.
        /*waitFor(function () {
            ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
            if(ctx) {
              return true;
            }
          },
          function(){*/
            //When it finishes, do this.
            ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
            parentCtx.canvas = ctx;
            self.redrawTile(parentCtx.id);

          //}, //when done, go to next flow
          //2000); //The Timeout milliseconds.  After this, give up and move on

      },

      parseVectorTileLayer: function(vtl, ctx) {

        var self = this;
        var tilePoint = ctx.tilePoint;
        var layerCtx  = { canvas: ctx.canvas, id: ctx.id, tilePoint: ctx.tilePoint, zoom: ctx.zoom, tileSize: ctx.tileSize};

        //See if we can pluck the child tile from this PBF tile layer based on the master layer's tile id.
        layerCtx.canvas = self._tiles[tilePoint.x + ":" + tilePoint.y];

        //Initialize this tile's feature storage hash, if it hasn't already been created.  Used for when filters are updated, and features are cleared to prepare for a fresh redraw.
        if (!this._canvasIDToFeatures[layerCtx.id]) {
          this._initializeFeaturesHash(layerCtx);
        }else{
          //Clear this tile's previously saved features.
          this.clearTileFeatureHash(layerCtx.id);
        }

        var features = vtl.parsedFeatures;

        for (var i = 0, len = features.length; i < len; i++) {

          var vtf = features[i]; //vector tile feature
          vtf.layer = vtl;

          // Apply filter on feature if there is one. Defined in the options object
          // of TileLayer.VectorTileManager.js
          var filter = self.options.filter;

          if (typeof filter === 'function') {
            if ( filter(vtf, layerCtx) === false ) {
              continue;
            }
          }

          var uniqueID = VectorTileUtil.getFeatureId(vtf, i) || i;
          var feature = self.features[uniqueID];

          // Use layerOrdering function to apply a zIndex property to each vtf.  This is defined in
          // TileLayer.VectorTileManager.js.  Used below to sort features.npm
          var layerOrdering = self.options.layerOrdering;

          if (typeof layerOrdering === 'function') {
            layerOrdering(vtf, layerCtx); //Applies a custom property to the feature, which is used after we're thru iterating to sort
          }

          //Create a new VectorTileFeature if one doesn't already exist for this feature.
          if (!feature) {

            //Get a style for the feature - set it just once for each new VectorTileFeature
            var style = self.style(vtf);

            //create a new feature
            self.features[uniqueID] = feature = new VectorTileFeature(self, vtf, layerCtx, uniqueID, style);

            if (typeof style.dynamicLabel === 'function') {
              self.featuresWithLabels.push(feature);
            }

          } else {
            //Add the new part to the existing feature
            feature.addTileFeature(vtf, layerCtx);
          }

          //Associate & Save this feature with this tile for later
          if(layerCtx && layerCtx.id) self._canvasIDToFeatures[layerCtx.id]['features'].push(feature);

        }

        // Apply sorting (zIndex) on feature if there is a function defined in the options object
        // of TileLayer.VectorTileManager.js
        var layerOrdering = self.options.layerOrdering;

        if (layerOrdering) {
          //We've assigned the custom zIndex property when iterating above.  Now just sort.
          self._canvasIDToFeatures[layerCtx.id].features = self._canvasIDToFeatures[layerCtx.id].features.sort(function(a, b) {
            return -(b.properties.zIndex - a.properties.zIndex)
          });
        }

        self.redrawTile(layerCtx.id);

      },

      setStyle: function(styleFn) {

        // refresh the number for the highest count value
        // this is used only for choropleth
        this._highestCount = 0;

        this.style = styleFn;

        for (var key in this.features) {
          var feat = this.features[key];
          feat.setStyle(styleFn);
        }

        var z = this.map.getZoom();

        for (var key in this._tiles) {
          var id = z + ':' + key;
          this.redrawTile(id);
        }

      },

      // As counts for choropleths come in with the ajax data,
      // we want to keep track of which value is the highest
      // to create the color ramp for the fills of polygons.
      // @param count
      setHighestCount: function(count) {

        if (count > this._highestCount) {
          this._highestCount = count;
        }

      },

      // Returns the highest number of all of the counts that have come in
      // from setHighestCount. This is assumed to be set via ajax callbacks.
      // @returns {number}
      getHighestCount: function() {

        return this._highestCount;

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
        var features = this._canvasIDToFeatures[evt.tileID].features;
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          var paths = feature.getPathsForTile(evt.tileID);
          for (var j = 0; j < paths.length; j++) {
            if (this._isPointInPoly(tilePoint, paths[j])) {
              if (feature.toggleEnabled) {
                feature.toggle();
              }
              evt.feature = feature;
              cb(evt);
              return;
            }
          }
        }
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

      clearTileFeatureHash: function(canvasID){

        this._canvasIDToFeatures[canvasID] = { features: []}; //Get rid of all saved features

      },

      clearLayerFeatureHash: function(){

        this.features = {};

      },

      redrawTile: function(canvasID) {

        //First, clear the canvas
        if (this._tiles.hasOwnProperty(canvasID)) {
          this.clearTile(canvasID);
        }

        // If the features are not in the tile, then there is nothing to redraw.
        // This may happen if you call redraw before features have loaded and initially
        // drawn the tile.
        var featfeats = this._canvasIDToFeatures[canvasID];
        if (!featfeats) {
          return;
        }

        //Get the features for this tile, and redraw them.
        var features = featfeats.features;

        // we want to skip drawing the selected features and draw them last
        var selectedFeatures = [];

        // drawing all of the non-selected features
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          if (feature.selected) {
            selectedFeatures.push(feature);
          } else {
            feature.draw(canvasID);
          }
        }

        // drawing the selected features last
        for (var j = 0, len2 = selectedFeatures.length; j < len2; j++) {
          var selFeat = selectedFeatures[j];
          selFeat.draw(canvasID);
        }

      },

      _resetCanvasIDToFeatures: function(canvasID, canvas) {

        this._canvasIDToFeatures[canvasID] = {};
        this._canvasIDToFeatures[canvasID].features = [];
        this._canvasIDToFeatures[canvasID].canvas = canvas;

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
          throw new Error('Cannot create VectorTileManager: options is not an object');
        }

        if (!options.hasOwnProperty('style') || !_.isFunction(options.style)) {
          throw new Error('Cannot create VectorTileManager: options.style is not a function');
        }

        this.style = options.style;

        this.options = {
          debug: false,
          url: '', //URL TO Vector Tile Source,
          headers: {},
          tileSize: 256,
          visibleLayers: []
        };
        L.Util.setOptions(this, options);

        // Layers present in the protocol buffer responses
        this.layers = {};
        // Tiles that are present in the viewport
        this.activeTiles = {};
        // Tiles that have already been processed and are cached.
        this.cachedTiles = {};
        // Tiles that are present in the viewport and have already been rendered.
        this.renderedTiles = {};
        // Store the max number of tiles to be loaded.  Later, we can use this count to count down PBF loading.
        this.tilesNotYetRendered = 0;

      },

      onAdd: function(map) {

        var self = this;
        var mapClickCallback;

        if (_.isFunction(this.options.onClick)) {

          mapClickCallback = function(e) {
            e.tileInfo = VectorTileUtil.getTileInfoByPointAndZoomLevel(e.latlng, map.getZoom());
            self.options.onClick(e);
          };

          map.on('click', mapClickCallback);

        }

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
        this.addChildLayers(map);

        L.TileLayer.Canvas.prototype.onAdd.call(this, map);

      },

      drawTile: function(canvas, tilePoint, zoom) {

        var tile = {
          id: VectorTileUtil.getTileId(tilePoint, zoom),
          canvas: canvas,
          tilePoint: tilePoint,
          zoom: zoom,
          tileSize: this.options.tileSize,
          rendered: false
        };

        // Capture the max number of the tiles to load here. this.tilesNotYetRendered is
        // an internal number we use to know when we've finished requesting all the active tiles.
        // this._tilesToLoad is maintained by Leaflet; this.tilesNotYetRendered is maintained by us.
        if (this.tilesNotYetRendered < this._tilesToLoad) {
          this.tilesNotYetRendered = this._tilesToLoad;
        }

        this.activeTiles[tile.id] = tile;

        if(_.isUndefined(this.cachedTiles[tile.zoom])) {
          this.cachedTiles[tile.zoom] = {};
        }

        if (this.options.debug) {
          this.renderDebugInfo(tile);
        }

        this.render(tile);

      },

      render: function(ctx) {
        var self = this;
        var url = self.options.url;

    //    //This works to skip fetching and processing tiles if they've already been processed.
    //    var vectorTile = this.cachedTiles[ctx.zoom][ctx.id];
    //    //if we've already parsed it, don't get it again.
    //    if(vectorTile){
    //      console.log("Skipping fetching " + ctx.id);
    //      self.checkVectorTileLayers(self.parseVT(vectorTile), ctx, true);
    //      self.reduceTilesToProcessCount();
    //      return;
    //    }

        if (!this.options.url) return;

        url = url.replace("{z}", ctx.zoom).replace("{x}", ctx.tilePoint.x).replace("{y}", ctx.tilePoint.y);

        var xhr = new XMLHttpRequest();

        xhr.onload = function() {

          var arrayBuffer;

          if (xhr.status == "200") {

            // Obtain the data as an array.
            // Some browsers (IE9) don't support xhr.response. Try alternatives.
            if (typeof xhr.response === 'undefined') {
              // IE9 specific hack, if available.
              // See: http://stackoverflow.com/a/4330882
              if (typeof xhr.responseBody === 'unknown' && typeof window.VBArray !== 'undefined') {
                arrayBuffer = new VBArray(xhr.responseBody).toArray();
              }
            } else if (xhr.response) {
              arrayBuffer = new Uint8Array(xhr.response);
            }

            if (!arrayBuffer) {
              // No/empty data (i.e. a tile with no points).
              // Nothing to do.
              return;
            }

            var buf = new pbf(arrayBuffer);
            var vt = new VectorTile(buf);
            //Check the current map layer zoom.  If fast zooming is occurring, then short circuit tiles that are for a different zoom level than we're currently on.
            if(self.map && self.map.getZoom() != ctx.zoom) {
              console.log("Fetched tile for zoom level " + ctx.zoom + ". Map is at zoom level " + self._map.getZoom());
              return;
            }
            self.checkVectorTileLayers(self.parseVT(vt), ctx);

            self._emitTileLoadedEvent();

            self.tileLoaded(self, ctx);
          }
        };

        xhr.onerror = function() {
          console.log("xhr error: " + xhr.status)
        };

        self._emitTileLoadingEvent();

        xhr.open('GET', url, true); //async is true

        var headerKeys = Object.keys(self.options.headers);
        var i;
        for (i = 0; i < headerKeys.length; i++) {
          xhr.setRequestHeader(headerKeys[i], self.options.headers[headerKeys[i]])
        }

        xhr.responseType = 'arraybuffer';

        xhr.send();

        //either way, reduce the count of tilesNotYetRendered tiles here
        self.reduceTilesToProcessCount();
      },

      renderDebugInfo: function(tile) {
        
        var ctx = tile.canvas.getContext('2d');
        var tilePoint = tile.tilePoint;
        var tileSize = tile.tileSize;
        var zoomLevel = tile.zoomLevel;

        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';

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

      tileLoaded: function(pbfSource, ctx) {
        pbfSource.renderedTiles[ctx.id] = ctx;
      },

      parseVT: function(vt){

        function parseVTFeatures(vtl){
          vtl.parsedFeatures = [];
          var features = vtl._features;
          for (var i = 0, len = features.length; i < len; i++) {
            var vtf = vtl.feature(i);
            vtf.coordinates = vtf.loadGeometry();
            vtl.parsedFeatures.push(vtf);
          }
          return vtl;
        }

        for (var key in vt.layers) {
          var lyr = vt.layers[key];
          parseVTFeatures(lyr);
        }
        return vt;
      },



      reduceTilesToProcessCount: function(){
        this.tilesNotYetRendered--;
        if(this.tilesNotYetRendered === 0){
          //Trigger event letting us know that all tiles have been loaded and rendered (or 404'd).
          this.bringToFront();
        }
      },

      checkVectorTileLayers: function(vt, ctx, parsed) {
        var self = this;

        //Check if there are specified visible layers
        if(self.options.visibleLayers && self.options.visibleLayers.length > 0){
          //only let thru the layers listed in the visibleLayers array
          for(var i=0; i < self.options.visibleLayers.length; i++){
            var layerName = self.options.visibleLayers[i];
            if(vt.layers[layerName]){
               //Proceed with parsing
              self.prepareVectorTileLayers(vt.layers[layerName], layerName, ctx, parsed);
            }
          }
        }else{
          //Parse all vt.layers
          for (var key in vt.layers) {
            self.prepareVectorTileLayers(vt.layers[key], key, ctx, parsed);
          }
        }
      },

      prepareVectorTileLayers: function(lyr ,key, ctx, parsed) {
        var self = this;

        if (!self.layers[key]) {
          //Create VectorTileLayer or MVTPointLayer for user
          self.layers[key] = self.createVectorTileLayer(key, lyr.parsedFeatures[0].type || null);
        }

        if (parsed) {
          //We've already parsed it.  Go get canvas and draw.
          self.layers[key].getCanvas(ctx, lyr);
        } else {
          self.layers[key].parseVectorTileLayer(lyr, ctx);
        }

      },

      createVectorTileLayer: function(key, type) {
        var self = this;

        //Take the layer and create a new VectorTileLayer or MVTPointLayer if one doesn't exist.
        var layer = new VectorTileLayer(self, {
            filter: self.options.filter,
            layerOrdering: self.options.layerOrdering,
            style: self.style,
            name: key,
            asynch: true
          }).addTo(self.map);

        return layer;
      },

      getLayers: function() {
        return this.layers;
      },

      hideLayer: function(id) {
        if (this.layers[id]) {
          this._map.removeLayer(this.layers[id]);
          if(this.options.visibleLayers.indexOf("id") > -1){
            this.visibleLayers.splice(this.options.visibleLayers.indexOf("id"), 1);
          }
        }
      },

      showLayer: function(id) {
        if (this.layers[id]) {
          this._map.addLayer(this.layers[id]);
          if(this.options.visibleLayers.indexOf("id") == -1){
            this.visibleLayers.push(id);
          }
        }
        //Make sure manager layer is always in front
        this.bringToFront();
      },

      removeChildLayers: function(map){
        //Remove child layers of this group layer
        for (var key in this.layers) {
          var layer = this.layers[key];
          map.removeLayer(layer);
        }
      },

      addChildLayers: function(map) {
        var self = this;
        if(self.options.visibleLayers.length > 0){
          //only let thru the layers listed in the visibleLayers array
          for(var i=0; i < self.options.visibleLayers.length; i++){
            var layerName = self.options.visibleLayers[i];
            var layer = this.layers[layerName];
            if(layer){
              //Proceed with parsing
              map.addLayer(layer);
            }
          }
        }else{
          //Add all layers
          for (var key in this.layers) {
            var layer = this.layers[key];
            // layer is set to visible and is not already on map
            if (!layer._map) {
              map.addLayer(layer);
            }
          }
        }
      },


      _onClick: function(evt) {
        //Here, pass the event on to the child VectorTileLayer and have it do the hit test and handle the result.
        var self = this;
        var onClick = self.options.onClick;
        var clickableLayers = self.options.clickableLayers;
        var layers = self.layers;

        evt.tileID =  VectorTileUtil.getTileUrlByPointAndZoomLevel(evt.latlng, this.map.getZoom());

        // We must have an array of clickable layers, otherwise, we just pass
        // the event to the public onClick callback in options.
        if (clickableLayers && clickableLayers.length > 0) {
          for (var i = 0, len = clickableLayers.length; i < len; i++) {
            var key = clickableLayers[i];
            var layer = layers[key];
            if (layer) {
              layer.handleClickEvent(evt, function(evt) {
                if (typeof onClick === 'function') {
                  onClick(evt);
                }
              });
            }
          }
        } else {
          if (typeof onClick === 'function') {
            onClick(evt);
          }
        }

      },


      /**
       * Take in a new style function and propogate to child layers.
       * If you do not set a layer name, it resets the style for all of the layers.
       * @param styleFunction
       * @param layerName
       */
      setStyle: function(styleFn, layerName) {
        for (var key in this.layers) {
          var layer = this.layers[key];
          if (layerName) {
            if(key.toLowerCase() == layerName.toLowerCase()) {
              layer.setStyle(styleFn);
            }
          } else {
            layer.setStyle(styleFn);
          }
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
