(function(root) {

  'use strict';

  if (!_.has(root, 'socrata.visualizations.Visualization')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.Visualization.js',
          'socrata.visualizations.FeatureMap.js'
        )
    );
  }

  if (!root.L.TileLayer.hasOwnProperty('VectorTileManager')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.VectorTileManager.js',
          'socrata.visualizations.FeatureMap.js'
        )
    );
  }

  var FEATURE_MAP_MIN_HOVER_THRESHOLD = 5;
  var FEATURE_MAP_MAX_ZOOM = 18; // same as Leaflet default
  var FEATURE_MAP_MAX_TILE_DENSITY = 256 * 256;
  var FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL = 200;
  var FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL = 250;
  var FEATURE_MAP_FLYOUT_Y_OFFSET = 1.25;
  var FEATURE_MAP_ROW_INSPECTOR_QUERY_BOX_PADDING = 1;
  var FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY = 100;

  function FeatureMap(element, config) {

    _.extend(this, new root.socrata.visualizations.Visualization(element, config));

    var self = this;

    var _mapContainer;
    var _mapElement;
    var _chartTopAxisLabel;
    var _chartRightAxisLabel;
    var _chartBottomAxisLabel;
    var _chartLeftAxisLabel;

    var _defaultMapOptions = {
      attributionControl: false,
      center: [47.609895, -122.330259], // Center on Seattle by default.
      keyboard: false,
      scrollWheelZoom: false,
      zoom: 10,
      zoomControlPosition: 'topleft',
      maxZoom: FEATURE_MAP_MAX_ZOOM
    };
    var _mapOptions;
    var _hover;
    var _panAndZoom;
    var _startResizeFn;
    var _completeResizeFn;
    var _baseTileLayer;
    var _map;
    var _lastRenderOptions;
    var _featureLayers = {};
    var _flyoutData = {};
    var _lastPoints = null;
    var _currentLayerId;

    _panAndZoom = config.panAndZoom || false;
    _hover = config.hover || false;

    _mapOptions = _.merge(_defaultMapOptions, config.mapOptions);

    // Render template here so that we can modify the map container's styles
    // below.
    _renderTemplate(this.element);

    // CORE-4832: Disable pan and zoom on feature map
    if (_panAndZoom) {

      _mapOptions = _.merge(
        _mapOptions,
        {
          dragging: false,
          zoomControl: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false
        }
      );

      _mapContainer.css('cursor', 'default');
    }

    /**
     * Public methods
     */

    this.render = function(renderOptions) {

      if (_mapElement.width() > 0 && _mapElement.height() > 0) {

        if (!_map) {

          // Construct leaflet map
          _map = L.map(_mapElement[0], _mapOptions);

          _attachEvents(this.element);

        }

        _lastRenderOptions = renderOptions;

        _fitBounds(renderOptions.bounds);
        _updateBaseLayer(renderOptions.baseLayer.url, renderOptions.baseLayer.opacity);

        _createNewFeatureLayer(renderOptions.vectorTileGetter);
      }
    };

    this.renderError = function() {
      console.error('There was an error rendering this feature map');
    };

    this.invalidateSize = function() {
      _map.invalidateSize();
    };

    this.destroy = function() {

      if (_map) {

        _detachEvents(this.element);

        // Remove the map after detaching events since `_detachEvents()` expects
        // the `_map` instance to exist.
        _map.remove();
      }

      // Finally, clear out the container.
      this.element.empty();
    };

    /**
     * Private methods
     */

    function _renderTemplate(element, axisLabels) {

      var mapElement = $(
        '<div>',
        {
          'class': 'feature-map'
        }
      );

      var mapLegend = $(
        '<div>',
        {
          'class': 'feature-map-legend'
        }
      );

      var mapPanZoomDisabledWarningIcon = $(
        '<div>',
        {
          'class': 'icon-warning pan-zoom-disabled-warning-icon'
        }
      );

      var mapPanZoomDisabledWarning = $(
        '<div>',
        {
          'class': 'pan-zoom-disabled-warning'
        }
      ).append(mapPanZoomDisabledWarningIcon);

      var mapContainer = $(
        '<div>',
        {
          'class': 'feature-map-container'
        }
      ).append([
        mapElement,
        mapLegend,
        mapPanZoomDisabledWarning
      ]);

      self.renderAxisLabels(mapContainer);

      // Cache element selections
      _mapContainer = mapContainer;
      _mapElement = mapElement;

      element.append(mapContainer);
    }

    function _attachEvents(element) {

      // Map resizes are messy because our map containers are animated. This
      // causes Leaflet to believe that we are resizing the map n times when
      // we are really just doing it once but lerping between the container
      // sizes. To work around this we can debounce the event twice--once on
      // the leading edge and once on the trailing edge--to simulate 'start'
      // and 'stop' events for the resize.
      _startResizeFn = _.debounce(
        function() {
          // We will need to record the current min and max latitude of the
          // viewport here so that we can reset the viewport to capture a
          // similar vertical area after the resize event completes.
        },
        FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL,
        {
          leading: true,
          trailing: false
        }
      );

      _completeResizeFn = _.debounce(
        function() {
          // We will need to reset the viewport using a center point and a
          // zoom level in order to preserve the 'perceptual' area covered by
          // the map.
          // These can be constructed from the min and max latitude of the
          // pre-resize viewport, which we have conveniently recorded when
          // the event was originally fired.
        },
        FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL,
        {
          leading: false,
          trailing: true
        }
      );

      _map.on('resize', _handleMapResize);
      _map.on('resize zoomend dragend', _handleExtentChange);
      _map.on('dragstart zoomstart', _handlePanAndZoom);

      if (_hover) {
        _map.on('mousemove', _handleMousemove);
      }
    }

    function _detachEvents(element) {

      // Only detach events if the map has actually been instantiated.
      if (_map) {

        _map.off('resize', _handleMapResize);
        _map.off('resize dragend zoomend', _handleExtentChange);
        _map.off('dragstart zoomstart', _handlePanAndZoom);

        if (_hover) {
          _map.off('mousemove', _handleMousemove);
        }
      }
    }

    function _handleMapResize() {

      // This is debounced and will fire on the leading edge.
      _startResizeFn();
      // This is debounced and will fire on the trailing edge.
      // In the best case, this will be called RESIZE_DEBOUNCE_INTERVAL
      // milliseconds after the resize event is captured by this handler.
      _completeResizeFn();
    }

    function _handleExtentChange() {

      // var bounds = _map.getBounds();

      // if (bounds.isValid()) {
      //   return {
      //     southwest: [bounds.getSouth(), bounds.getWest()],
      //     northeast: [bounds.getNorth(), bounds.getEast()]
      //   };
      // }
    }

    function _handlePanAndZoom() {

      _hideFlyout();
      _hideInspector();
    }

    function _handleMousemove(event) {

      if (_flyoutData.count > 0) {

        event.originalEvent.target.style.cursor = 'pointer';
        _showFlyout(event);

      } else {

        event.originalEvent.target.style.cursor = 'inherit';
        _hideFlyout();

      }

    }

    function _handleMouseLeave(e) {

    }

    function _handleVectorTileMousemove(e) {

      // Set flyout data and force a refresh of the flyout
      _flyoutData.offset = {
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
      };
      _flyoutData.count = _.sum(e.points, 'count');
      _flyoutData.totalPoints = e.tile.totalPoints;
    }

    function _handleVectorTileClick(event) {

      var inspectorDataQueryConfig;

      if (_flyoutData.count <= FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY) {

        inspectorDataQueryConfig = {
          latLng: event.latlng,
          position: {
            pageX: event.originalEvent.pageX,
            pageY: event.originalEvent.pageY
          },
          rowCount: _.sum(event.points, 'count'),
          queryBounds: _getQueryBounds(event.containerPoint)
        };

        _showInspector(inspectorDataQueryConfig);
      }
    }

    function _handleVectorTileRenderStart() {

      _hideFlyout();
      _hideInspector();
    }

    function _handleVectorTileRenderComplete() {

      _removeOldFeatureLayers();
    }

    function _showFlyout() {

      var payload = {
        title: _flyoutData.count,
        labelUnit: _lastRenderOptions.labelUnit,
        notice: self.getLocalization('FLYOUT_CLICK_TO_INSPECT_NOTICE')
      };

      if (_flyoutData.count > FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY) {

        if (_map.getZoom() === FEATURE_MAP_MAX_ZOOM) {
          payload.notice = self.getLocalization('FLYOUT_FILTER_NOTICE');
        } else {
          payload.notice = self.getLocalization('FLYOUT_FILTER_OR_ZOOM_NOTICE');
        }

        // If the tile we are hovering over has more points then the
        // TileServer limit or the selected points contain more than the
        // max number of rows to be displayed on a flannel,
        // prompt the user to filter and/or zoom in for accurate data.
        if (_flyoutData.totalPoints >= FEATURE_MAP_MAX_TILE_DENSITY) {
          payload.title = self.getLocalization('FLYOUT_DENSE_DATA_NOTICE');
        }
      }

      self.emitEvent(
        'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
        {
          data: payload
        }
      );
    }

    function _hideFlyout() {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
        {
          data: null
        }
      );
    }

    function _showInspector(inspectorDataQueryConfig) {

      var payload = {
        data: null,
        position: inspectorDataQueryConfig.position,
        error: false,
        message: null
      }

      // Emit one event to cause the row inspector to be rendered.
      self.emitEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW',
        {
          data: payload
        }
      );

      // Emit a second event to initiate a query for the row
      // data which we intend to inspect.
      self.emitEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY',
        {
          data: inspectorDataQueryConfig
        }
      );
    }

    function _hideInspector() {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE'
      );
    }

    /**
     * Map behavior
     */

    function _updateBaseLayer(url, opacity) {

      if (_baseTileLayer) {
        _map.removeLayer(_baseTileLayer);
      }

      var _baseTileLayer = L.tileLayer(
        url,
        {
          attribution: '',
          detectRetina: false,
          opacity: opacity,
          unloadInvisibleTiles: true
        }
      );

      _map.addLayer(_baseTileLayer);
    }

    /**
     * Transforms the viewport to match or contain the provided map bounds.
     *
     * @param bounds - The Leaflet LatLngBounds object that represents the
     *   extents of the column's features.
     */
    function _fitBounds(bounds) {

      _map.fitBounds(
        bounds,
        {
          animate: false,
          pan: { animate: false },
          zoom: { animate: false }
        }
      );
    }

    /**
     * Creates a new feature layer with a specific tileServer endpoint
     * and adds it to the map. Because of the way vector tiles are
     * implemented (in mapbox-vector-tiles.js) it is necessary to
     * create an entirely new feature layer every time the page's
     * global where clause changes.
     *
     * This function should be used in conjunction with removeOldFeatureLayer
     * so that there is only ever one active feature layer attached to the
     * map at a time.
     *
     * @param {Object} map - The Leaflet map object.
     * @param {Function} vectorTileGetter - Function that gets a vector tile
     */
    function _createNewFeatureLayer(vectorTileGetter) {

      var layer;
      var layerId = _.uniqueId();
      var featureLayerOptions = {
        // Data requests
        vectorTileGetter: vectorTileGetter,
        // Behavior
        debug: false,
        hover: _hover,
        debounceMilliseconds: FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL,
        rowInspectorMaxRowDensity: FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY,
        maxZoom: FEATURE_MAP_MAX_ZOOM,
        maxTileDensity: FEATURE_MAP_MAX_TILE_DENSITY,
        // Helper functions
        getFeatureId: _getFeatureId,
        getFeatureStyle: _getFeatureStyle,
        getHoverThreshold: _getHoverThreshold,
        // Event handlers
        onRenderStart: _handleVectorTileRenderStart,
        onRenderComplete: _handleVectorTileRenderComplete,
        onMousemove: _handleVectorTileMousemove,
        onClick: _handleVectorTileClick
      };

      // Don't create duplicate layers.
      if (!_featureLayers.hasOwnProperty(layerId)) {

        layer = new L.TileLayer.VectorTileManager(featureLayerOptions);

        _map.addLayer(layer);

        _featureLayers[layerId] = layer;
        _currentLayerId = layerId;
      }
    }

    /**
     * Removes existing but out of date feature layers from the map.
     * This is used in conjunction with `_createNewFeatureLayer()`.
     *
     * @param map - The Leaflet map object.
     */
    function _removeOldFeatureLayers() {

      Object.keys(_featureLayers).forEach(function(layerId) {

        if (layerId !== _currentLayerId) {
          _map.removeLayer(_featureLayers[layerId]);
          delete _featureLayers[layerId];
        }
      });
    }

    /**
     * Determines within box query bounds to be passed into row query
     * This accepts a container point so that we can build up a bounds
     * object based on screen-space positioning (e.g. in pixels).
     *
     * @param {Object} leafletContainerPoint - The 'container point' that
     *   Leaflet provides on click events.
     *   @propery {Number} x - The x offset of the point (in pixels)
     *   @propery {Number} y - The y offset of the point (in pixels)
     *
     * @return {Object}
     *   @property {Object} northeast - The northeast point of the bounding
     *     box.
     *     @property {Number} lat - The latitude of the point.
     *     @property {Number} lng - The longitude of the point.
     *   @property {Object} southwest - The southwest point of the bounding
     *     box.
     *     @property {Number} lat - The latitude of the point.
     *     @property {Number} lng - The longitude of the point.
     */
    function _getQueryBounds(leafletContainerPoint) {

      var hoverThreshold = _getHoverThreshold(_map.getZoom());
      var delta = FEATURE_MAP_ROW_INSPECTOR_QUERY_BOX_PADDING + hoverThreshold;
      var northeastContainerPoint = L.point(
        leafletContainerPoint.x - delta,
        leafletContainerPoint.y + delta
      );
      var southwestContainerPoint = L.point(
        leafletContainerPoint.x + delta,
        leafletContainerPoint.y - delta
      );

      return {
        northeast: _map.containerPointToLatLng(northeastContainerPoint),
        southwest: _map.containerPointToLatLng(southwestContainerPoint)
      };
    }

    /**
     * Returns a unique string id for a feature that will be used as a key
     * into a key => value hash. The 'index' parameter is the index of this
     * feature into the array of all features.
     *
     * @param feature - The feature for which we will compute an id.
     * @param index - The index of the feature into the tile's collection
     *   of features.
     *
     * @return {String}
     */
    function _getFeatureId(feature, index) {
      return String(index);
    }

    /**
    * Returns the current hover threshold at the given zoom level, calculated
    * based on point radius.
    *
    * @param zoomLevel - The current zoom level of the map.
    *
    * @return {Number}
    */
    function _getHoverThreshold(zoomLevel) {

      return Math.max(
        _scalePointFeatureRadiusByZoomLevel(zoomLevel),
        FEATURE_MAP_MIN_HOVER_THRESHOLD
      );
    }

    /**
     * Scales points according to zoom level. The maximum zoom level
     * in Leaflet is 18; the minimum is 1.
     *
     * @param zoomLevel - The current zoom level of the map.
     *
     * @return {Number}
     */
    function _scalePointFeatureRadiusByZoomLevel(zoomLevel) {

      // This was created somewhat arbitrarily by Chris to
      // result in point features which get slightly larger
      // as the map is zoomed in. It can be replaced with
      // any function which computes a number that makes
      // sense as the radius of a point feature in pixels.
      return Math.pow(zoomLevel * 0.0695, 5) + 2;
    }

    /**
     * Returns an object specifying the styles with which a point feature
     * will be rendered.
     *
     * This function is called by the Vector Tile Layer extension to Leaflet
     * as it iterates over features in a vector tile.
     *
     * @return {Object} - A style object that will be used to render the
     *   feature.
     */
    function _getPointStyle() {

      return {
        color: _calculatePointColor,
        highlightColor: 'rgba(255, 255, 255, .5)',
        radius: _scalePointFeatureRadiusByZoomLevel,
        lineWidth: 1,
        strokeStyle: _calculateStrokeStyleColor
      };
    }

    /**
    * Determine point fill color at given zoom level.
    * Makes points more transparent as map zooms out.
    */
    function _calculatePointColor(zoomLevel) {
      return 'rgba(0,80,114,' + (0.3 * Math.pow(zoomLevel / 18, 5) + 0.4) + ')';
    }

    /**
    * Determine stroke style (point outline) at given zoom level.
    * Dims point outline color as map zooms out.
    */
    function _calculateStrokeStyleColor(zoomLevel) {
      return 'rgba(255,255,255,' + (0.8 * Math.pow(zoomLevel / 18, 8) + 0.1) + ')';
    }

    /**
     * Returns an object specifying the styles with which a line string
     * feature will be rendered.
     *
     * This function is called by the Vector Tile Layer extension to Leaflet
     * as it iterates over features in a vector tile.
     *
     * @return {Object} - A style object that will be used to render the
     *   feature.
     */
    function _getLineStringStyle() {

      return {
        color: 'rgba(161,217,155,0.8)',
        size: 3
      };
    }

    /**
     * Returns an object specifying the styles with which a polygon feature
     * will be rendered.
     *
     * This function is called by the Vector Tile Layer extension to Leaflet
     * as it iterates over features in a vector tile.
     *
     * @return {Object} - A style object that will be used to render the
     *   feature.
     */
    function _getPolygonStyle() {

      return {
        color: 'rgba(149,139,255,0.4)',
        outline: {
          color: 'rgb(20,20,20)',
          size: 2
        }
      };
    }

    /**
     * Provides a generic interface to the styling functions above and
     * dispatches requests to the appropriate type based on the feature
     * being styled.
     *
     * @param feature - The feature that we will style.
     *
     * @return {Object} - A function that can be used to generate a style
     *   object.
     */
    function _getFeatureStyle(feature) {

      switch (feature.type) {
        case 1:
          return _getPointStyle();
        case 2:
          return _getLineStringStyle();
        case 3:
          return _getPolygonStyle();
        default:
          throw new Error('Cannot apply style to unknown feature type "' + feature.type + '".');
      }
    }
  }

  root.socrata.visualizations.FeatureMap = FeatureMap;
})(window);
