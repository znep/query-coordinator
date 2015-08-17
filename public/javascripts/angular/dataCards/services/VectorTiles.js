(function() {
  'use strict';

  // This is the Angular wrapper around VectorTileUtil, VectorTileFeature,
  // VectorTileLayer and VectorTileManager.
  function VectorTiles(Constants, ServerConfig) {

    /****************************************************************************
     *
     * VectorTileUtil
     *
     */

    var VectorTileUtil = {

      getTileId: function(tile) {
        return _.at(tile, ['zoom', 'x', 'y']).join(':');
      },

      getLeafletTileId: function(tileId) {
        return tileId.split(':').slice(1, 3).join(':');
      },

      // Given a point and zoom level, return the x, y, and z values
      // of the tile containing this point.  The point should be specified
      // as an object containing lat and lng keys.
      getTileInfoByPointAndZoomLevel: function(point, zoom) {
        var lat = point.lat * Math.PI / 180;
        var lon = point.lng;

        var x = (lon + 180) / 360;
        var y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2;

        x = x * (1 << zoom);
        y = y * (1 << zoom);

        return {
          zoom: zoom,
          x: parseInt(Math.floor(x)),
          y: parseInt(Math.floor(y))
        };
      },

      getTileTotalPoints: function(tileLayer, tileId) {
        return _.get(tileLayer, 'totalPointsByTile[{0}]'.format(tileId), 0);
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
        return _.get(tileLayer, '_tiles.' + VectorTileUtil.getLeafletTileId(tileId));
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
      var color;
      var radius;
      var strokeStyle;

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

      // Determine point styling based on computed style and map zoom
      if (_.isFunction(computedStyle.color)) {
        color = computedStyle.color(this.map.getZoom());
      } else {
        color = computedStyle.color;
      }

      if (_.isFunction(computedStyle.radius)) {
        radius = computedStyle.radius(this.map.getZoom());
      } else {
        radius = computedStyle.radius;
      }

      if (_.isFunction(computedStyle.strokeStyle)) {
        strokeStyle = computedStyle.strokeStyle(this.map.getZoom());
      } else {
        strokeStyle = computedStyle.strokeStyle;
      }

      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(projectedPoint.x, projectedPoint.y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      if (computedStyle.lineWidth && strokeStyle) {

        ctx.lineWidth = computedStyle.lineWidth;
        ctx.strokeStyle = strokeStyle;
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
        this.totalPointsByTile = {};
        this.quadTreesByTile = {};
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
        var tileId = VectorTileUtil.getTileId({x: tilePoint.x, y: tilePoint.y, zoom: zoom});

        this.featuresByTile[tileId] = [];
        this.totalPointsByTile[tileId] = 0;
        this.quadTreesByTile[tileId] = this.tileManager.quadTreeFactory([]);

        return this;
      },

      loadData: function(vectorTileData, tileId, tileRenderedCallback) {

        var features = vectorTileData.features;
        var i;
        var featureCount = features.length;
        var feature;
        var featureArray;
        var featurePointCount = 0;

        if (!this.featuresByTile.hasOwnProperty(tileId) && featureCount > 0) {
          this.featuresByTile[tileId] = [];
        }

        if (!this.quadTreesByTile.hasOwnProperty(tileId) && featureCount > 0) {
          this.quadTreesByTile[tileId] = this.tileManager.quadTreeFactory([]);
        }

        featureArray = this.featuresByTile[tileId];

        for (i = 0; i < featureCount; i++) {
          feature = features[i];

          var vectorTileFeature = new VectorTileFeature(this, feature, this.styleFn(feature));
          var projectedPoint = vectorTileFeature.projectGeometryToTilePoint(vectorTileFeature.coordinates[0][0]);

          projectedPoint.count = vectorTileFeature.properties.count;
          featurePointCount += parseInt(_.get(vectorTileFeature, 'properties.count', 0), 10);

          projectedPoint.tile = tileId;
          this.quadTreesByTile[tileId].add(projectedPoint);

          featureArray.push(vectorTileFeature);
        }

        this.totalPointsByTile[tileId] = featurePointCount;
        this.renderTile(tileId, tileRenderedCallback);
      },

      renderTile: function(tileId, tileRenderedCallback) {

        var features;
        var featureCount;
        var i;

        // First, clear the canvas
        if (_.has(this._tiles, VectorTileUtil.getLeafletTileId(tileId))) {
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
        var canvas = VectorTileUtil.getTileLayerCanvas(this, tileId);
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
        var pointStyle = this.style({type: 1}); // getPointStyle in featureMap.js

        this.options = {
          debug: false,
          url: '',
          headers: {},
          tileSize: 256,
          debounceMilliseconds: 500,
          onRenderStart: _.noop,
          onRenderComplete: _.noop,
          // threshold options represent distance to neighboring points permitted for hover and click in px
          minHoverThreshold: Constants.FEATURE_MAP_MIN_HOVER_THRESHOLD,
          maxHoverThreshold: pointStyle.radius(Constants.FEATURE_MAP_MAX_ZOOM)
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

        /*
         * Each tile has its own quad tree containing points in that tile.
         * On hover, for tiles within the threshold but not containing the hover
         * point, we map the mouse coordinates to the coordinate space of the
         * neighboring tile to test the neighboring tile's points that lie within
         * the threshold of the hover point.
         *
         * We create a quad tree factory here to make it easier to make many quad
         * trees with the same parameters.
         */
        var maxThreshold = this.options.maxHoverThreshold;
        var size = this.options.tileSize;
        this.quadTreeFactory = d3.geom.quadtree();
        this.quadTreeFactory.extent([[-maxThreshold, -maxThreshold], [size + maxThreshold, size + maxThreshold]]);
        this.quadTreeFactory.x(_.property('x'));
        this.quadTreeFactory.y(_.property('y'));

        // Add a canvas layer for drawing highlighted points.
        this.hoverHighlightLayer = L.tileLayer.canvas({zIndex: 2});

        // Add a less dynamic canvas layer for drawing highlighted clicked points
        this.clickHighlightLayer = L.tileLayer.canvas({zIndex: 2});

        this.currentHoverPoints = [];
        this.currentClickedPoints = [];

        function drawHighlightTile(canvas, tilePoint, zoom, pointsToHighlight) {
          var ctx = canvas.getContext('2d');
          var tileId = VectorTileUtil.getTileId({x: tilePoint.x, y: tilePoint.y, zoom: zoom});

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = pointStyle.highlightColor;
          ctx.strokeStyle = pointStyle.strokeStyle;
          ctx.lineWidth = pointStyle.lineWidth;

          var points = _.filter(pointsToHighlight, function(point) {
            return point.tile === tileId;
          });

          _.each(points, function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointStyle.radius(zoom), 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
          });

          ctx.restore();
        }

        this.hoverHighlightLayer.drawTile = function(canvas, tilePoint, zoom) {
          drawHighlightTile(canvas, tilePoint, zoom, this.currentHoverPoints);
        }.bind(this);

        this.clickHighlightLayer.drawTile = function(canvas, tilePoint, zoom) {
          drawHighlightTile(canvas, tilePoint, zoom, this.currentClickedPoints);
        }.bind(this);
      },

      onAdd: function(map) {

        var self = this;
        var mapMousedownCallback;
        var mapMouseupCallback;
        var mapMousemoveCallback;
        var mapMouseoutCallback;
        var mapClickCallback;
        var flannelClosedCallback;
        var clearHighlightRequestCallback;

        this.map = map;
        this.hoverHighlightLayer.addTo(map);
        this.clickHighlightLayer.addTo(map);

        // Find all edges and corners that the mouse is near
        var edges = [['top'], ['left'], ['bottom'], ['right']];
        var corners = _.zip(['top', 'top', 'bottom', 'bottom'], ['left', 'right', 'left', 'right']);
        var hotspots = Array.prototype.concat.call(edges, corners);

        // For a given tile, mouse offset coordinates, and threshold,
        // calculate the neighboring tiles (tiles other than the current tile
        // that the user's mouse is within the threshold of.
        // Returns array of neighboringTile objects containing
        // tile id, offset.
        function getNeighboringTiles(tile, mouseTileOffset, hoverThreshold) {
          var neighboringTiles;
          var tileSize = self.options.tileSize;

          // Which tile edges are we close to?
          var edgeTests = {
            top: mouseTileOffset.y < hoverThreshold,
            left: mouseTileOffset.x < hoverThreshold,
            bottom: tileSize - mouseTileOffset.y < hoverThreshold,
            right: tileSize - mouseTileOffset.x < hoverThreshold
          };

          // Get neighboring tile id for a tile's edge
          var tileIdModifiers = {
            top: function(tile) {
              tile.y--;
            },
            left: function(tile) {
              tile.x--;
            },
            bottom: function(tile) {
              tile.y++;
            },
            right: function(tile) {
              tile.x++;
            }
          };

          // Modify tile pixel offsets
          // tileOffset = {x: tileOffsetX, y: tileOffsetY}
          var tileOffsetModifiers = {
            top: function(tileOffset) {
              tileOffset.y += tileSize;
            },
            left: function(tileOffset) {
              tileOffset.x += tileSize;
            },
            bottom: function(tileOffset) {
              tileOffset.y -= tileSize;
            },
            right: function(tileOffset) {
              tileOffset.x -= tileSize;
            }
          };

          // Now get those neighboring tile ids
          neighboringTiles = _.compact(_.map(hotspots, function(hotspot) {

            // hotspot is ['left'], ['left', 'top'], etc...
            // This ensures that all edgeTests for the given hotspot values
            // are true, which means that the mouse is within threshold of
            // all hotspot values (aka edges).
            if (_.all(_.at(edgeTests, hotspot), _.identity)) {
              var neighborTile = _.clone(tile);
              var neighborOffset = _.clone(mouseTileOffset);

              _.each(hotspot, function(dir) {
                tileIdModifiers[dir](neighborTile);
                tileOffsetModifiers[dir](neighborOffset);
              });

              return {
                id: VectorTileUtil.getTileId(neighborTile),
                offset: neighborOffset
              };
            }

            return false;
          }));

          return neighboringTiles;
        }

        // Given a mouse event object, adds useful tile-related information to
        // the event, such as the tile the mouse is hovering over and any points
        // near the mouse (accounting for neighboring tiles). Keys added:
        //  - tile: An object containing the x, y, and zoom values of the tile,
        //          as well as an id in the form 'z:x:y'.
        //  - tilePoint: Similar to layerPoint, containerPoint, etc. The mouse
        //               coordinates relative to the current tile.
        //  - points: An array of points near the mouse (see
        //            VectorTileManager.options.hoverThreshold). Coordinates are
        //            relative to the tile containing the point. Each point also
        //            contains a 'count' key representing the number of rows of
        //            data that the point represents.
        function injectTileInfo(e) {

          // TODO handle selecting layers and/or multiple layers better.
          var layer = self.layers.get('main');

          e.tile = VectorTileUtil.getTileInfoByPointAndZoomLevel(e.latlng, map.getZoom());
          e.tile.id = VectorTileUtil.getTileId(e.tile);
          e.tile.totalPoints = VectorTileUtil.getTileTotalPoints(layer, e.tile.id);

          var tileCanvas = VectorTileUtil.getTileLayerCanvas(layer, e.tile.id);
          var pointStyle = self.style({type: 1});
          var hoverThreshold = Math.max(pointStyle.radius(map.getZoom()), self.options.minHoverThreshold);

          if (_.isUndefined(tileCanvas)) {
            e.points = [];
            return;
          }

          var canvasBoundingRect = tileCanvas.getBoundingClientRect();
          var mouseTileOffset = e.tilePoint = { // mouse coordinates relative to tile
            x: e.originalEvent.clientX - canvasBoundingRect.left,
            y: e.originalEvent.clientY - canvasBoundingRect.top
          };

          var tiles = [{id: e.tile.id, offset: mouseTileOffset}].
            concat(getNeighboringTiles(e.tile, mouseTileOffset, hoverThreshold));

          // For each tile near the mouse, visit nodes of its quad tree and
          // push any nearby points onto an array.
          var points = [];
          _.each(tiles, function(tile) {
            var qt = layer.quadTreesByTile[tile.id];
            var point = tile.offset;

            if (qt) {
              qt.visit(function(node, x1, y1, x2, y2) {
                var nodePoint = node.point;

                // If this node has a point and it is near the mouse, push it
                // onto the result array.
                if (nodePoint) {
                  var dx = Math.pow(nodePoint.x - point.x, 2);
                  var dy = Math.pow(nodePoint.y - point.y, 2);
                  if (dx + dy < Math.pow(hoverThreshold, 2)) {
                    points.push(nodePoint);
                  }
                }

                // return false if this node's bounding box does not intersect
                // the square around the mouse to prevent descending into
                // children that will definitely not contain any nearby points.
                return (x1 > point.x + hoverThreshold) ||
                  (x2 < point.x - hoverThreshold) ||
                  (y1 > point.y + hoverThreshold) ||
                  (y2 < point.y - hoverThreshold);
              });
            }
          });

          // Redraw highlight layer, but only if set of hover points has changed
          if (!_.isEqual(self.currentHoverPoints, points)) {
            self.currentHoverPoints = points;
            highlightPoints(self.hoverHighlightLayer);
          }

          e.points = points;
        }

        function highlightClickedPoints(clickedPoints) {
          if (!_.isEqual(self.currentClickedPoints, clickedPoints)) {
            self.currentClickedPoints = clickedPoints;
            highlightPoints(self.clickHighlightLayer);
          }

          if (_.isEqual(self.currentClickedPoints, self.currentHoverPoints)) {
            // Remove hover highlighting on points now highlighted by click
            self.currentHoverPoints = [];
            highlightPoints(self.hoverHighlightLayer);
          }
        }

        function highlightPoints(layerToHighlight) {
          _.each(layerToHighlight._tiles, function(canvas, tileId) {
            var coordinates = tileId.split(':');
            var tile = {x: coordinates[0], y: coordinates[1]};
            layerToHighlight.drawTile(canvas, tile, map.getZoom());
          });
        }

        function clearClickedPointHighlights() {
          if (!_.isEmpty(self.currentClickedPoints)) {
            self.currentClickedPoints = [];
            highlightPoints(self.clickHighlightLayer);
          }
        }

        function clearHoverPointHighlights() {
          if (!_.isEmpty(self.currentHoverPoints)) {
            self.currentHoverPoints = [];
            highlightPoints(self.hoverHighlightLayer);
          }
        }

        // Handle callbacks for executable functions of events
        if (_.isFunction(this.options.mousedown)) {

          mapMousedownCallback = function(e) {
            injectTileInfo(e);
            self.options.mousedown(e);
          };

          map.on('mousedown', mapMousedownCallback);
        }

        if (_.isFunction(this.options.mouseup)) {

          mapMouseupCallback = function(e) {
            injectTileInfo(e);
            self.options.mouseup(e);
          };

          map.on('mouseup', mapMouseupCallback);
        }

        if (_.isFunction(this.options.mousemove)) {

          mapMousemoveCallback = function(e) {
            if (ServerConfig.get('oduxEnableFeatureMapHover')) {
              injectTileInfo(e);
            }

            self.options.mousemove(e);
          };

          map.on('mousemove', mapMousemoveCallback);
        }

        if (_.isFunction(this.options.click)) {

          mapClickCallback = function(e) {
            if (ServerConfig.get('oduxEnableFeatureMapHover')) {
              injectTileInfo(e);

              // Determine if click should be disabled (when data is dense or flannel would be full)
              var denseData = e.tile.totalPoints >= Constants.FEATURE_MAP_MAX_POINT_LIMIT;
              var manyRows = _.sum(e.points, 'count') > Constants.FLANNEL_ROW_CONTENT_LIMIT;
              if (!denseData && !manyRows) {
                highlightClickedPoints(e.points);
                self.options.click(e);
              }
            } else {
              self.options.click(e);
            }
          };

          map.on('click', mapClickCallback);
        }

        if (ServerConfig.get('oduxEnableFeatureMapHover')) {

          // Handle callbacks for other events

          // Clear hover highlighting upon mouseout of map container.
          mapMouseoutCallback = clearHoverPointHighlights;

          map.on('mouseout', mapMouseoutCallback);

          // Ensure highlighting on points previously clicked under closed flannel
          // is cleared, but points highlighted under a new flannel remain.
          flannelClosedCallback = function(e) {
            var pointsToKeepHighlighted = self.currentClickedPoints.filter(function(value) {
              return !_.contains(e.points, value);
            });
            highlightClickedPoints(pointsToKeepHighlighted);
          };

          map.on('flannelclosed', flannelClosedCallback);

          // Upon map refresh due to adding or removing a filter,
          // remove highlighting on all clicked and moused-over points
          clearHighlightRequestCallback = function() {
            clearClickedPointHighlights();
            clearHoverPointHighlights();
          };

          map.on('clearhighlightrequest', clearHighlightRequestCallback);
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

            if (_.isFunction(self.options.click)) {
              map.off('click', mapClickCallback);
            }

            if (ServerConfig.get('oduxEnableFeatureMapHover')) {
              map.off('mouseout', mapMouseoutCallback);
              map.off('flannelclosed', flannelClosedCallback);
              map.off('clearhighlightrequest', clearHighlightRequestCallback);
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
          this.tileLoading(VectorTileUtil.getTileId({x: tilePoint.x, y: tilePoint.y, zoom: zoom}));
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
            // CORE-6027:
            // Clear the outstandingTileDataRequests because we shouldn't attempt to load tiles
            // on the previous zoom level.
            self.outstandingTileDataRequests.clear();
          }
        });
        this.delayedTileDataRequests.length = 0;
      },

      getTileData: function(tilePoint, zoom, callback) {
        var self = this;
        var tileId = VectorTileUtil.getTileId({x: tilePoint.x, y: tilePoint.y, zoom: zoom});
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

        // Does this ever get run?
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
          if (layer.hasOwnProperty('_map')) {
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
