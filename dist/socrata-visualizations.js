(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("socrata.utils"), require("d3"), require("jQuery"), require("_"), require("moment"), require("L"));
	else if(typeof define === 'function' && define.amd)
		define(["socrata.utils", "d3", "jQuery", "_", "moment", "L"], factory);
	else if(typeof exports === 'object')
		exports["visualizations"] = factory(require("socrata.utils"), require("d3"), require("jQuery"), require("_"), require("moment"), require("L"));
	else
		root["socrata"] = root["socrata"] || {}, root["socrata"]["visualizations"] = factory(root["socrata"]["utils"], root["d3"], root["jQuery"], root["_"], root["moment"], root["L"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_17__, __WEBPACK_EXTERNAL_MODULE_19__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var views = __webpack_require__(1);
	var dataProviders = __webpack_require__(22);
	// vv these requires have the side effect of registering jQuery plugins vv
	var ChoroplethMap = __webpack_require__(41);
	var ColumnChart = __webpack_require__(43);
	var FeatureMap = __webpack_require__(44);
	var Table = __webpack_require__(45);
	var TimelineChart = __webpack_require__(46);

	// TODO: add exported function here called `init` which takes a VIF and instantiates the
	// appropriate visualization based on the VIF's `type` field

	module.exports = {
	  views: views,
	  dataProviders: dataProviders,
	  ChoroplethMap: ChoroplethMap,
	  ColumnChart: ColumnChart,
	  FeatureMap: FeatureMap,
	  Table: Table,
	  TimelineChart: TimelineChart
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ChoroplethMap = __webpack_require__(2);
	var ChoroplethMapUtils = __webpack_require__(11);
	var ColumnChart = __webpack_require__(12);
	var Pager = __webpack_require__(13);
	var TimelineChart = __webpack_require__(14);
	var Table = __webpack_require__(15);
	var FeatureMap = __webpack_require__(18);
	var FlyoutRenderer = __webpack_require__(20);
	var RowInspector = __webpack_require__(21);

	module.exports = {
	  ChoroplethMap: ChoroplethMap,
	  ChoroplethMapUtils: ChoroplethMapUtils,
	  ColumnChart: ColumnChart,
	  Pager: Pager,
	  Table: Table,
	  TimelineChart: TimelineChart,
	  FeatureMap: FeatureMap,
	  FlyoutRenderer: FlyoutRenderer,
	  RowInspector: RowInspector
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * TODO:
	 * - Lowercase "constants" that are really configurations
	 * - Pass in either savedExtent or defaultExtent, rather than both
	 */

	var utils = __webpack_require__(3);
	var d3 = __webpack_require__(4);
	var ss = __webpack_require__(5);
	var chroma = __webpack_require__(6);
	var $ = __webpack_require__(8);
	var _ = __webpack_require__(9);

	var Visualization = __webpack_require__(10);
	var ChoroplethMapUtils = __webpack_require__(11);

	function ChoroplethMap(element, vif) {

	  _.extend(this, new Visualization(element, vif));

	  var self = this;
	  // Data mapping to geojson
	  var LABEL_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.name;
	  var UNFILTERED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.unfiltered;
	  var FILTERED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.filtered;
	  var SELECTED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.selected;
	  // Map configuration
	  var MAP_MIN_ZOOM = vif.configuration.mapMinZoom || 1;
	  var MAP_MAX_ZOOM = vif.configuration.mapMaxZoom || 18;
	  var MAP_ENABLE_ZOOM_ANIMATION = vif.configuration.mapZoomAnimation || false;
	  var MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS = 200;
	  var MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS = 400;
	  // Choropleth class derivation
	  var MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED = vif.configuration.maxJenksClassBreaks || 7;
	  // Choropleth region rendering
	  var CHOROPLETH_REGION_DEFAULT_STROKE_WIDTH = vif.configuration.defaultFeatureStrokeWidth || 1;
	  var CHOROPLETH_REGION_HIGHLIGHTED_STROKE_WIDTH = vif.configuration.highlightedFeatureStrokeWidth || 4;
	  // Legend rendering
	  var CONTINUOUS_LEGEND_ZERO_COLOR = '#ffffff';
	  var CONTINUOUS_LEGEND_POSITIVE_COLOR = '#003747';
	  var CONTINUOUS_LEGEND_NEGATIVE_COLOR = '#c6663d';
	  var DISCRETE_LEGEND_ZERO_COLOR = '#eeeeee';
	  var DISCRETE_LEGEND_POSITIVE_COLOR = '#408499';
	  var DISCRETE_LEGEND_NEGATIVE_COLOR = '#c6663d';

	  var _utilConstants = {
	    UNFILTERED_GEOJSON_PROPERTY_NAME: UNFILTERED_GEOJSON_PROPERTY_NAME,
	    FILTERED_GEOJSON_PROPERTY_NAME: FILTERED_GEOJSON_PROPERTY_NAME,
	    SELECTED_GEOJSON_PROPERTY_NAME: SELECTED_GEOJSON_PROPERTY_NAME,
	    MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED: MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED
	  };

	  var _visualizationUtils = new ChoroplethMapUtils(_utilConstants);

	  var _choroplethContainer;
	  var _choroplethMapContainer;
	  var _choroplethLegend;
	  // These configuration options belong to Leaflet, not the visualization we are
	  // building on top of it.
	  var _mapOptions = _.extend(
	    {
	      attributionControl: false,
	      center: [47.609895, -122.330259], // Center on Seattle by default.
	      keyboard: false,
	      scrollWheelZoom: false,
	      zoom: 1,
	      zoomControlPosition: 'topleft',
	      minZoom: MAP_MIN_ZOOM,
	      maxZoom: MAP_MAX_ZOOM,
	      zoomAnimation: MAP_ENABLE_ZOOM_ANIMATION
	    },
	    vif.configuration.mapOptions
	  );

	  var _lastElementWidth;
	  var _lastElementHeight;

	  var _map;
	  var _baseTileLayer;
	  var _minLng;
	  var _maxLng;
	  var _minLat;
	  var _maxLat;
	  var _boundsArray;
	  var _coordinates;

	  // Keep track of the geojson layers so that we can remove them cleanly.
	  // Every redraw of the map forces us to remove the layer entirely because
	  // there is no way to mutate already-rendered geojson objects.
	  var _geojsonBaseLayer = null;

	  // Watch for first render so we know whether or not to update the center/bounds.
	  // (We don't update the center or the bounds if the choropleth has already been
	  // rendered so that we can retain potential panning and zooming done by the user.
	  var _firstRender = true;

	  var _lastRenderOptions = {};
	  var _lastRenderedVif;

	  var _interactive = vif.configuration.interactive === true;

	  // Keep track of click details so that we can zoom on double-click but
	  // still selects on single clicks.
	  var _lastClick = 0;
	  var _lastClickTimeout = null;

	  // Render layout
	  _renderTemplate(self.element);

	  // Construct leaflet map
	  _map = L.map(_choroplethMapContainer[0], _mapOptions);

	  // Attach Miscellaneous Events
	  _attachEvents();

	  // Initialize map's bounds if provided with that data
	  var _extentsDefined = (!_.isEmpty(vif.configuration.defaultExtent) || !_.isEmpty(vif.configuration.savedExtent));

	  // If bounds are not defined, this will get handled when render is first
	  // called, as the fallback bounds calculation requires the geoJSON data.
	  if (_firstRender && _extentsDefined) {
	    _initializeMap(_choroplethContainer);
	  }

	  // Setup legend
	  var _LegendType = _LegendContinuous;

	  if (vif.configuration.hasOwnProperty('legend')) {

	    if (vif.configuration.legend.hasOwnProperty('negativeColor')) {
	      CONTINUOUS_LEGEND_NEGATIVE_COLOR = vif.configuration.legend.negativeColor;
	    }

	    if (vif.configuration.legend.hasOwnProperty('zeroColor')) {
	      CONTINUOUS_LEGEND_ZERO_COLOR = vif.configuration.legend.negativeColor;
	    }

	    if (vif.configuration.legend.hasOwnProperty('positiveColor')) {
	      CONTINUOUS_LEGEND_POSITIVE_COLOR = vif.configuration.legend.negativeColor;
	    }

	    if (vif.configuration.legend.hasOwnProperty('type') && vif.configuration.legend.type === 'discrete') {
	      _LegendType = _LegendDiscrete;

	      if (vif.configuration.legend.hasOwnProperty('negativeColor')) {
	        DISCRETE_LEGEND_NEGATIVE_COLOR = vif.configuration.legend.negativeColor;
	      }

	      if (vif.configuration.legend.hasOwnProperty('zeroColor')) {
	        DISCRETE_LEGEND_ZERO_COLOR = vif.configuration.legend.negativeColor;
	      }

	      if (vif.configuration.legend.hasOwnProperty('positiveColor')) {
	        DISCRETE_LEGEND_POSITIVE_COLOR = vif.configuration.legend.negativeColor;
	      }
	    }
	  }

	  var _legend = new _LegendType(self.element.find('.choropleth-legend'), self.element);

	  /**
	   * Public methods
	   */

	  this.render = function(data, options) {
	    // Stop rendering if element has no width or height
	    if (_choroplethContainer.width() <= 0 || _choroplethContainer.height() <= 0) {
	      if (window.console && window.console.warn) {
	        console.warn('Aborted rendering choropleth map: map width or height is zero.');
	      }
	      return;
	    }

	    // Why are we merging the options here but replacing them in other
	    // visualization implementations?
	    _.merge(_lastRenderOptions, options);
	    // Eventually we may only want to pass in the VIF instead of other render
	    // options as well as the VIF, but for the time being we will just treat it
	    // as another property on `options`.
	    _lastRenderedVif = options.vif;

	    // Calling _initializeMap should only occur here if bounds were not specified in the VIF.
	    // We call it here because the fallback bounds calculation requires geoJSON.
	    if (_firstRender) {
	      _initializeMap(_choroplethContainer, data);
	    }

	    _updateFeatureLayer(data);

	    // TODO: React to active filters being cleared.
	  };

	  // TODO: Remove this once Data Lens is using the new (correct)
	  // `.invalidateSize()` method instead of `.updateDimensions()`.
	  this.updateDimensions = function() {
	    _updateDimensions(_choroplethContainer);
	  };

	  this.invalidateSize = function() {
	    _updateDimensions(_choroplethContainer);
	  };

	  this.updateTileLayer = function(options) {
	    _.merge(_lastRenderOptions, options);
	    _updateTileLayer(options.baseLayer.url, options.baseLayer.opacity);
	  };

	  this.renderError = function() {
	    // TODO: Some helpful error message.
	  };

	  this.destroy = function() {

	    // Remove Miscellaneous Events
	    _detachEvents();

	    if (_map) {
	      _map.remove();
	    }

	    self.element.empty();
	  };


	  /**
	   * Private methods
	   */

	  /**
	   * Creates HTML for visualization and adds it to the provided element.
	   *
	   * @param {jQuery Element} element - element to append visualization
	   */
	  function _renderTemplate(el) {

	    // jQuery doesn't support SVG, so we have to create these elements manually :(
	    var xmlns = 'http://www.w3.org/2000/svg';

	    var ticks = document.createElementNS(xmlns, 'g');
	    ticks.setAttribute('class', 'ticks');

	    var legendTicks = document.createElementNS(xmlns, 'svg');
	    legendTicks.setAttribute('class', 'legend-ticks');
	    $(legendTicks).append(ticks);

	    var gradient = document.createElementNS(xmlns, 'svg');
	    gradient.setAttribute('class', 'gradient');

	    var choroplethLegend = $(
	      '<div>',
	      {
	        'class': 'choropleth-legend'
	      }
	    ).append([
	      gradient,
	      legendTicks
	    ]);

	    var choroplethMapContainer = $(
	      '<div>',
	      {
	        'class': 'choropleth-map-container'
	      }
	    );

	    var choroplethContainer = el.find('.choropleth-container');

	    if (_.isEmpty(choroplethContainer)) {
	      choroplethContainer = $(
	        '<div>',
	        {
	          'class': 'choropleth-container'
	        }
	      );
	    }

	    choroplethContainer.append([
	      choroplethMapContainer,
	      choroplethLegend
	    ]);

	    // Cache element selections
	    _choroplethContainer = choroplethContainer;
	    _choroplethMapContainer = choroplethMapContainer;
	    _choroplethLegend = choroplethLegend;

	    el.append(choroplethContainer);
	  }

	  function _initializeMap(el, data) {
	    // Only update bounds on the first render so we can persist
	    // users' panning and zooming.
	    // It is critical to invalidate size prior to updating bounds
	    // Otherwise, Leaflet will fit the bounds to an incorrectly sized viewport.
	    // This manifests itself as the map being zoomed all of the way out.
	    _map.invalidateSize();
	    _updateBounds(data, vif.configuration.defaultExtent, vif.configuration.savedExtent);
	    _firstRender = false;

	    _lastElementWidth = el.width();
	    _lastElementHeight = el.height();
	  }

	  /**
	   * Attach Miscellanous Events
	   */
	  function _attachEvents() {

	    _choroplethLegend.on('mousemove', '.choropleth-legend-color', _showLegendFlyout);
	    _choroplethLegend.on('mouseout', '.choropleth-legend-color', _hideFlyout);

	    _map.on('mouseout', _hideFlyout);
	    _map.on('zoomend dragend', _emitExtentEventsFromMap);
	  }

	  /**
	   * Detach Miscellanous Events
	   */
	  function _detachEvents() {

	    _choroplethLegend.off('mousemove', '.choropleth-legend-color', _showLegendFlyout);
	    _choroplethLegend.off('mouseout', '.choropleth-legend-color', _hideFlyout);

	    _map.off('mouseout', _hideFlyout);
	    _map.off('zoomend dragend', _emitExtentEventsFromMap);
	  }

	  /**
	   * Handle mouse over feature.
	   */
	  function _onFeatureMouseOver(event) {
	    _addHighlight(event);
	    _showFlyout(event);
	  }

	  /**
	   * Handle mousing out of a feature.
	   */
	  function _onFeatureMouseOut(event) {
	    _removeHighlight(event);
	    _hideFlyout();
	  }

	  /**
	   * Handle clicking on a feature.
	   */
	  function _onSelectRegion(event) {
	    var now = Date.now();
	    var delay = now - _lastClick;

	    _lastClick = now;

	    if (_interactive) {
	      if (delay < MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS) {
	        if (!_.isNull(_lastClickTimeout)) {

	          // If this is actually a double click, cancel the timeout which
	          // selects the feature and zoom in instead.
	          window.clearTimeout(_lastClickTimeout);
	          _lastClickTimeout = null;
	          _map.setView(event.latlng, _map.getZoom() + 1);
	        }
	      } else {
	        _lastClickTimeout = window.setTimeout(
	          function() { _emitSelectRegionEvent(event); },
	          MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS
	        );
	      }
	    }
	  }

	  function _emitSelectRegionEvent(event) {
	    utils.assertHasProperties(
	      _lastRenderedVif,
	      'configuration.shapefile.primaryKey'
	    );

	    var feature = event.target.feature;
	    var shapefilePrimaryKey = _lastRenderedVif.
	      configuration.
	      shapefile.
	      primaryKey;

	    if (feature.properties.hasOwnProperty(shapefilePrimaryKey)) {
	      self.emitEvent(
	        'SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION',
	        {
	          // TODO: Once Data Lens has been updated, kill the `layer` and
	          // `feature` properties of the emitted event payload.
	          layer: event.target,
	          feature: event.target.feature,
	          shapefileFeatureId: feature.properties[shapefilePrimaryKey]
	        }
	      );
	    }
	  }

	  function _showFlyout(event) {
	    var feature = event.target.feature;
	    var unfilteredValueUnit;
	    var filteredValueUnit;
	    var payload = {
	      element: event.target,
	      clientX: event.originalEvent.clientX,
	      clientY: event.originalEvent.clientY,
	      title: feature.properties[LABEL_GEOJSON_PROPERTY_NAME],
	      unfilteredValueLabel: self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL'),
	      filteredValueLabel: self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL'),
	      selectedNotice: self.getLocalization('FLYOUT_SELECTED_NOTICE'),
	      selected: feature.properties[SELECTED_GEOJSON_PROPERTY_NAME]
	    };

	    if (feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME] === 1) {

	      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
	        _lastRenderOptions.unit.one :
	        vif.unit.one;

	    } else {

	      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
	        _lastRenderOptions.unit.other :
	        vif.unit.other;
	    }

	    if (feature.properties[FILTERED_GEOJSON_PROPERTY_NAME] === 1) {

	      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
	        _lastRenderOptions.unit.one :
	        vif.unit.one;

	    } else {

	      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
	        _lastRenderOptions.unit.other :
	        vif.unit.other;
	    }

	    if (_.isNumber(feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME])) {

	      payload.unfilteredValue = '{0} {1}'.format(
	        utils.formatNumber(feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME]),
	        unfilteredValueUnit
	      );

	    } else {

	      payload.unfilteredValue = self.getLocalization('NO_VALUE');
	    }

	    if (_lastRenderOptions.showFiltered) {

	      if (_.isNumber(feature.properties[FILTERED_GEOJSON_PROPERTY_NAME])) {

	        payload.filteredValue = '{0} {1}'.format(
	          utils.formatNumber(feature.properties[FILTERED_GEOJSON_PROPERTY_NAME]),
	          filteredValueUnit
	        );

	      } else {

	        payload.filteredValue = self.getLocalization('NO_VALUE');
	      }
	    }

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT',
	      payload
	    );
	  }

	  function _showLegendFlyout(event) {

	    var el = event.target;

	    var payload = {
	      title: el.getAttribute('data-flyout-text'),
	      element: el
	    };

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_LEGEND_FLYOUT',
	      payload
	    );
	  }

	  function _hideFlyout() {

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE',
	      null
	    );
	  }

	  function _emitExtentEventsFromMap() {
	    var leafletBounds = _map.getBounds();

	    utils.assert(leafletBounds.isValid(), 'Bounds object is not valid.');

	    var updatedBounds = {
	      southwest: {
	        lat: leafletBounds.getSouth(),
	        lng: leafletBounds.getWest()
	      },
	      northeast: {
	        lat: leafletBounds.getNorth(),
	        lng: leafletBounds.getEast()
	      }
	    };

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_EXTENT_CHANGE',
	      updatedBounds
	    );
	  }

	  /**
	   * Creates a new base tile layer and adds it to the map.
	   *
	   * @param {String} url - tile server endpoint to use
	   * @param {Number} opacity - opacity of the tile layer
	   */
	  function _updateTileLayer(url, opacity) {

	    if (_baseTileLayer) {
	      _map.removeLayer(_baseTileLayer);
	    }

	    _baseTileLayer = L.tileLayer(
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
	   * Creates a new feature layer and adds it to the map.
	   *
	   * @param {Object} data - geoJson feature collection to be rendered
	   */
	  function _updateFeatureLayer(data) {

	    // Validate data is geoJson
	    utils.assertHasProperties(
	      data,
	      'features',
	      'type'
	    );

	    // Emit render started
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_START',
	      {
	        timestamp: Date.now()
	      }
	    );

	    // Determine dimensions
	    var dimensions = {
	      width: _lastElementWidth,
	      height: _lastElementHeight
	    };

	    // Add legend and get color scale
	    var _coloring = _legend.update(data, dimensions);

	    var featureOptions = {
	      onEachFeature: function(feature, layer) {
	        layer.on({
	          mouseover: _onFeatureMouseOver,
	          mouseout: _onFeatureMouseOut,
	          mousemove: _showFlyout,
	          click: _onSelectRegion
	        });
	      },
	      style: _visualizationUtils.getStyleFn(_coloring)
	    };

	    if (!_.isNull(_geojsonBaseLayer)) {
	      _map.removeLayer(_geojsonBaseLayer);
	    }

	    _geojsonBaseLayer = L.geoJson(data, featureOptions);
	    _geojsonBaseLayer.addTo(_map);

	    // Emit render complete
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE',
	      {
	        timestamp: Date.now()
	      }
	    );
	  }

	  /**
	   * Update map bounds.
	   */
	  function _updateBounds(geojsonData, defaultExtent, savedExtent) {

	    function _buildPositionArray(positions) {

	      var cleanPositions = positions.filter(function(position) {
	        return _.isNumber(position[0]) && _.isNumber(position[1]);
	      });

	      // IMPORTANT NOTE: in geojson, positions are denoted as [longitude, latitude] pairs
	      var lngs = _.map(cleanPositions, function(lngLat) { return lngLat[0]; });
	      var lats = _.map(cleanPositions, function(lngLat) { return lngLat[1]; });

	      // Clamp values to min and max
	      if (_.min(lngs) < _minLng) {
	        _minLng = _.min(lngs);
	      }

	      if (_.max(lngs) > _maxLng) {
	        _maxLng = _.max(lngs);
	      }

	      if (_.min(lats) < _minLat) {
	        _minLat = _.min(lats);
	      }

	      if (_.max(lats) > _maxLat) {
	        _maxLat = _.max(lats);
	      }
	    }

	    function _buildBounds(featureExtent) {

	      var southWest = L.latLng(featureExtent.southwest[0], featureExtent.southwest[1]);
	      var northEast = L.latLng(featureExtent.northeast[0], featureExtent.northeast[1]);
	      var bounds = L.latLngBounds(southWest, northEast);

	      utils.assert(bounds.isValid(), 'Bounds is not valid.');

	      return bounds;
	    }

	    _minLng = 180;
	    _maxLng = -180;
	    _minLat = 90;
	    _maxLat = -90;
	    _boundsArray = [
	      [_maxLat, _maxLng],
	      [_minLat, _minLng]
	    ];

	    if (!_.isUndefined(geojsonData)) {

	      if (geojsonData.type !== 'FeatureCollection') {
	        throw new Error('Cannot calculate geojson bounds: geojsonData is not of type <FeatureCollection>.');
	      }

	      _.each(geojsonData.features, function(feature) {
	        _coordinates = feature.geometry.coordinates;

	        switch (feature.geometry.type) {

	          // Polygon or MultiLineString coordinates
	          // = arrays of position arrays
	          case 'Polygon':
	          case 'MultiLineString':
	            _.each(_coordinates, function(positionArrays) {
	              _buildPositionArray(positionArrays);
	            });
	            break;

	          // MultiPolygon coordinates = an array of Polygon coordinate arrays
	          case 'MultiPolygon':
	            _.each(_coordinates, function(polygonCoordinates) {
	              _.each(polygonCoordinates, function(positionArrays) {
	                _buildPositionArray(positionArrays);
	              });
	            });
	            break;

	          // LineString coordinates = position array
	          case 'LineString':
	            _buildPositionArray(_coordinates);
	            break;
	        }
	      });

	      _boundsArray = [
	        [_maxLat, _maxLng],
	        [_minLat, _minLng]
	      ];
	    }

	    var computedBounds = L.latLngBounds([
	      _boundsArray[1][0],
	      _boundsArray[1][1]
	    ], [
	      _boundsArray[0][0],
	      _boundsArray[0][1]
	    ]);
	    var initialBounds = computedBounds;

	    if (!_.isEmpty(savedExtent)) {
	      initialBounds = _buildBounds(savedExtent);
	    } else if (!_.isEmpty(defaultExtent)) {
	      var defaultBounds = _buildBounds(defaultExtent);

	      if (!defaultBounds.contains(computedBounds)) {
	        initialBounds = defaultBounds;
	      }
	    }

	    // We need to explicitly pass an options object with
	    // animate set to false because (in some cases) Leaflet
	    // will default to an empty object if none is explicitly
	    // provided and then check the value of a non-existent
	    // animate property, causing a TypeError and halting
	    // execution.
	    _map.fitBounds(
	      initialBounds,
	      {
	        animate: false
	      }
	    );
	  }

	  function _updateDimensions(el) {
	    var mapWidth = el.width();
	    var mapHeight = el.height();

	    // Recenter map if container's dimensions have changed
	    if (_lastElementWidth !== mapWidth || _lastElementHeight !== mapHeight) {
	      _map.invalidateSize();

	      _lastElementWidth = mapWidth;
	      _lastElementHeight = mapHeight;
	    }
	  }

	  /**
	   * Add highlighted style to layer.
	   */
	  function _addHighlight(event) {

	    var layer = event.target;

	    if (!_isLayerSelected(layer)) {
	      layer.setStyle({
	        weight: CHOROPLETH_REGION_HIGHLIGHTED_STROKE_WIDTH
	      });

	      // IE HACK (CORE-3566): IE exhibits (not fully-characterized) pointer madness if you bring a layer
	      // containing a MultiPolygon which actually contains more than one polygon to the
	      // front in a featureMouseOver. The rough cause is that the paths corresponding to this
	      // layer get removed and re-added elsewhere in the dom while the mouseover is getting handled.
	      // The symptoms of this are IE spewing mouseout events all over the place on each mousemove.
	      if (!L.Browser.ie) {
	        layer.bringToFront();
	      }
	    }
	  }

	  /**
	   * Remove highlighted style to layer.
	   */
	  function _removeHighlight(event) {

	    var layer = event.target;

	    if (!_isLayerSelected(layer)) {
	      layer.setStyle({
	        weight: CHOROPLETH_REGION_DEFAULT_STROKE_WIDTH
	      });
	      layer.bringToBack();
	    }
	  }

	  /**
	   * Determines whether or not the given layer is selected.
	   */
	  function _isLayerSelected(layer) {

	    var selectedPropertyName = 'feature.properties.{0}'.
	      format(SELECTED_GEOJSON_PROPERTY_NAME);

	    return _.get(layer, selectedPropertyName);
	  }

	  /**
	   * A choropleth legend, with discrete colors for ranges of values.
	   */
	  function _LegendDiscrete(legendElement, container) {
	    this.legendElement = legendElement;
	    this.container = container;
	  }

	  $.extend(_LegendDiscrete.prototype, {

	    /**
	     * Generates a color scale for the given classBreaks.
	     * @param {Number[]} classBreaks The values that define the boundaries of the different
	     *   discrete groups of values.
	     * @return {Object} an object with 'colors' and 'scale' functions, that mirror a chroma scale.
	     */
	    colorScaleFor: function(classBreaks) {

	      var marginallyNegative = chroma.interpolate(
	        DISCRETE_LEGEND_ZERO_COLOR,
	        DISCRETE_LEGEND_NEGATIVE_COLOR,
	        0.1
	      );
	      var marginallyPositive = chroma.interpolate(
	        DISCRETE_LEGEND_ZERO_COLOR,
	        DISCRETE_LEGEND_POSITIVE_COLOR,
	        0.1
	      );

	      if (classBreaks.length === 1) {

	        // There's only one value. So give it only one color.
	        var color;
	        if (classBreaks[0] < 0) {
	          color = DISCRETE_LEGEND_NEGATIVE_COLOR;
	        } else if (classBreaks[0] > 0) {
	          color = DISCRETE_LEGEND_POSITIVE_COLOR;
	        } else {
	          color = DISCRETE_LEGEND_ZERO_COLOR;
	        }

	        var singleColorScale = _.constant([color]);
	        singleColorScale.colors = _.constant([color]);

	        return singleColorScale;
	      }

	      if (classBreaks[0] < 0) {

	        // If we have values that straddle zero, add the zero point as one of our breaks
	        if (_.last(classBreaks) > 0) {
	          var indexOfZero = classBreaks.indexOf(0);
	          if (indexOfZero < 0) {
	            throw 'Expecting classBreaks to contain a break at 0, if the values straddle 0';
	          }

	          var negatives = classBreaks.slice(0, indexOfZero + 1);
	          var positives = classBreaks.slice(indexOfZero);

	          // When the values straddle 0 unevenly, we want the brightness of the colors to be
	          // proportional to how far from 0 it is. In particular, we want eg 5 and -5 to have
	          // about the same amount of luminosity. So - have the colors scale to the same absolute
	          // distance from zero.
	          var negativeHeavy = -classBreaks[0] > _.last(classBreaks);
	          if (negativeHeavy) {

	            // The last value of classBreaks is interpreted as the highest value that's in the
	            // last class. Since we're adding another value to the end, it's meaning changes - now
	            // it is the lowest value (inclusive) of the last break. Since we actually want that
	            // value to be included in the last class, we have to increment it.
	            positives[positives.length - 1] += (-classBreaks[0] - _.last(positives)) / 100;
	            positives.push(-classBreaks[0]);
	          } else {
	            negatives.unshift(-_.last(classBreaks));
	          }

	          var negativeColorScale = _visualizationUtils.calculateColoringScale(
	            [DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
	            negatives
	          );
	          var positiveColorScale = _visualizationUtils.calculateColoringScale(
	            [marginallyPositive, DISCRETE_LEGEND_POSITIVE_COLOR],
	            positives
	          );

	          // Create a faux colorScale that implements the interface, but delegates to the positive
	          // or negative actual-scale depending on what you're trying to scale.
	          var fauxColorScale = _.bind(function(value) {
	            if (value === 0) {
	              return chroma(DISCRETE_LEGEND_ZERO_COLOR);
	            } else {
	              return (value < 0 ? negativeColorScale : positiveColorScale)(value);
	            }
	          }, this);

	          /**
	           * Our faux .colors method basically just retrieves the positive and negative arrays and
	           * combines them.
	           */
	          fauxColorScale.colors = function() {

	            var negColors = negativeColorScale.colors();
	            var posColors = positiveColorScale.colors();

	            // We added a break to catch the most-luminescent color, on the scale that didn't have
	            // values as high as the other one. So - drop that color.
	            if (negativeHeavy) {
	              posColors.pop();
	            } else {
	              negColors.shift();
	            }

	            // chroma gives us 2 colors if we give it a domain of only 2 values. This messes
	            // things up later on when we assume that classBreaks.length == colors.length + 1, so
	            // shave off some colors if we have to.
	            if (negatives.length === 2) {
	              negColors = negColors.slice(0, 1);
	            }
	            if (positives.length === 2) {
	              posColors = posColors.slice(1);
	            }

	            return negColors.concat(posColors);
	          };

	          return fauxColorScale;

	        } else {

	          // All the numbers are negative. Give them the negative color scale.
	          return _visualizationUtils.calculateColoringScale(
	            [DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
	            classBreaks
	          );
	        }
	      } else {
	        // Otherwise, it's all positive, so give them the positive color scale.
	        return _visualizationUtils.calculateColoringScale(
	          [marginallyPositive, DISCRETE_LEGEND_POSITIVE_COLOR],
	          classBreaks
	        );
	      }
	    },

	    /**
	     * Updates the legend.
	     *
	     * @param {Number[]} data The data being plotted on the map.
	     *
	     * @return {chroma.scale} A chroma color scale that maps a datum value to a color.
	     */
	    update: function(data) {

	      var classBreaks = _visualizationUtils.calculateDataClassBreaks(
	        data,
	        UNFILTERED_GEOJSON_PROPERTY_NAME
	      );

	      _visualizationUtils.addZeroIfNecessary(classBreaks);

	      var numTicks = 3;
	      var tickValues;
	      var colorScale = this.colorScaleFor(classBreaks);

	      switch (classBreaks.length) {

	        case 0:
	          this.legendElement.hide();
	          return null;

	        case 1:
	          tickValues = classBreaks.slice(0);

	          // If there is just 1 value, make it range from 0 to that value.
	          if (classBreaks[0] === 0) {

	            // ...the only value is 0. Give 'em a fake range. It's all they deserve.
	            classBreaks.push(1);
	          } else if (classBreaks[0] < 0) {
	            classBreaks.push(0);
	          } else {
	            classBreaks.unshift(0);
	          }
	          break;

	        case 2:

	          // If there are two values, duplicate the max value, to allow there to be a color stop
	          tickValues = classBreaks.slice(0);
	          classBreaks = [classBreaks[0], classBreaks[1], classBreaks[1]];
	          break;

	        default:
	          if (this.container.height() < 250) {
	            numTicks = 3;
	          } else {
	            numTicks = Math.min(classBreaks.length, 4);
	          }
	      }

	      var minBreak = classBreaks[0];
	      var maxBreak = _.last(classBreaks);

	      // Size of the colored scale.
	      var COLOR_BAR_WIDTH = 15;
	      var colorBarHeight = Math.floor(Math.min(this.container.height() - 60, 250));

	      // Reserve some padding space for the bottom-most tick label text.
	      var BOTTOM_PADDING = 15;

	      var colors = colorScale.colors();

	      // Give the svg an empty datum, so that it will create/reuse one svg
	      var svg = d3.select(this.legendElement[0]).
	        selectAll('svg').
	        data([{}]);

	      svg.enter().
	        append('svg');

	      svg.attr('height', colorBarHeight + BOTTOM_PADDING);

	      var yTickScale = d3.scale.linear().range([colorBarHeight - 1, 1]);
	      var yLabelScale = d3.scale.linear().range([colorBarHeight, 0]);
	      var yAxis = d3.svg.
	        axis().
	        scale(yTickScale).
	        orient('left');

	      if (tickValues) {
	        yAxis.tickValues(tickValues);
	      } else {
	        yAxis.ticks(numTicks);
	      }

	      // Ensure that there's always a 0 tick
	      /* FIXME (jerjou): 2015-02-04 I can't seem to get a d3 range to NOT give me a 0 if it
	       * straddles 0. So while I could leave this block in, I can't figure out a way to verify
	       * that it works.
	      if (minBreak <= 0 && maxBreak >= 0) {
	        var ticks = yTickScale.ticks(numTicks);
	        var index = ticks.indexOf(0);
	        if (-1 === index) {
	          ticks.splice(0, 0, 0);
	        }
	        yAxis.tickValues(ticks);
	      }
	      */

	      var yTickScaleDomain = yTickScale.domain([minBreak, maxBreak]);
	      var yLabelScaleDomain = yLabelScale.domain([minBreak, maxBreak]);

	      // 'ss' is simple_statistics.js
	      var isLargeRange = ss.standard_deviation(classBreaks) > 10;

	      if (isLargeRange) {

	        // d3 quirk: using a #tickFormat formatter that just returns the value
	        // gives unexpected results due to floating point math.
	        // We want to just return the value for "small-ranged" data.
	        // --> do not call a tickFormatter on yAxis if range is small.
	        yAxis.tickFormat(_visualizationUtils.bigNumTickFormatter);

	        // Due to similar issues, d3's scale#nice method also has
	        // floating point math issues.
	        yTickScaleDomain.nice();
	        yLabelScaleDomain.nice();

	        // Update first and last class breaks to nice y domain
	        classBreaks[0] = yTickScale.domain()[0];
	        classBreaks[classBreaks.length - 1] = yTickScale.domain()[1];
	      }

	      // Give it some data so it creates the container element
	      var labels = svg.selectAll('.labels').
	          data([null]);

	      labels.enter().
	        append('g').
	        attr('class', 'labels');

	      // Remove axis line that comes with d3 axis
	      labels.
	        call(yAxis).
	        select('path').
	        remove();

	      labels.
	        exit().
	        remove();

	      var labelTextElement = this.legendElement.find('.labels > .tick > text');
	      var maxLabelWidth = _.reduce(labelTextElement, function(accumulator, el) {
	        return Math.max(accumulator, $(el).width());
	      }, 0);
	      var tickAreaWidth = maxLabelWidth + yAxis.tickSize() + yAxis.tickPadding();

	      // The d3 axis places all elements LEFT of the origin (negative X coords).
	      // Translate everything to within the bounds of the SVG.
	      labels.
	        attr('transform', 'translate({0})'.format(tickAreaWidth));

	      // Size the SVG appropriately.
	      svg.attr('width', tickAreaWidth + COLOR_BAR_WIDTH);

	      // Size the container appropriately
	      _choroplethLegend.css('height', colorBarHeight + BOTTOM_PADDING);
	      _choroplethLegend.css('width', tickAreaWidth + COLOR_BAR_WIDTH);

	      // draw legend colors
	      var rects = svg.
	        selectAll('.choropleth-legend-color').
	        data(colors);

	      rects.enter().
	        append('rect');

	      rects.
	        attr('class', 'choropleth-legend-color').
	        attr('width', COLOR_BAR_WIDTH).
	        attr('height', _.bind(function(c, i) {
	          return Math.floor(
	            yLabelScale(classBreaks[i]) -
	            yLabelScale(classBreaks[i + 1])
	          );
	        }, this)).
	        attr('x', tickAreaWidth).
	        attr('y', function(c, i) {
	          return Math.floor(yLabelScale(classBreaks[i + 1]));
	        }).
	        style('fill', function(c) {
	          return c;
	        });

	      if ((tickValues ? tickValues.length : numTicks) === 1) {
	        var value = _.filter(classBreaks)[0];
	        if (isLargeRange) {
	          rects.
	            attr('data-flyout-text', _visualizationUtils.bigNumTickFormatter(value));
	        } else {
	          rects.
	            attr('data-flyout-text', value);
	        }
	      } else {
	        if (isLargeRange) {
	          rects.
	            attr('data-flyout-text', _.bind(function(color, i) {
	              return _visualizationUtils.bigNumTickFormatter(classBreaks[i]) + ' – ' +
	                _visualizationUtils.bigNumTickFormatter(classBreaks[i + 1]);
	            }, this));
	        } else {
	          rects.
	            attr('data-flyout-text', function(color, i) {
	              return '{0} – {1}'.format(classBreaks[i], classBreaks[i + 1]);
	            });
	        }
	      }

	      rects.exit().
	        remove();

	      return colorScale;
	    }
	  });

	  /**
	   * A Legend with a continuous scale.
	   */
	  function _LegendContinuous(legendElement, container) {

	    this.legendElement = legendElement.addClass('continuous');
	    this.container = container;
	    this.gradientId = 'gradient-{0}'.format(_.uniqueId());
	  }

	  $.extend(_LegendContinuous.prototype, {
	    /**
	     * Finds an array of values, including the min, max, and numStops - 2 more values,
	     * evenly-spaced between the min and max.
	     *
	     * @param {d3.scale} scale a d3 scale whose domain is the value domain.
	     * @param {Number} numStops the number of values to find.
	     *
	     * @return {Number[]} a sorted array of numbers, of length numStops. The first element is the
	     *   smallest value in the features, the last element is the largest, and the other values are
	     *   evenly spaced between them (and may not actually appear in the dataset).
	     * @private
	     */
	    findTickStops: function(scale, numStops) {

	      var scaleForReversing = scale.copy().range([0, 1]);
	      var stops = _.map(
	        _.range(0, 1, 1 / (numStops - 1)),
	        _.bind(scaleForReversing.invert, scaleForReversing)
	      ).concat(_.last(scaleForReversing.domain()));

	      if (_.last(stops) - stops[0] > 5) {
	        stops = _.map(stops, Math.round);
	      }

	      // For log scales, if the first stop is zero, set it to the minimum value.
	      if (scale.base && _.first(stops) === 0) {
	        stops[0] = _.first(scale.domain());
	      }

	      return stops;
	    },

	    /**
	     * Draw an SVG rectangle with the appropriate gradient.
	     *
	     * @param {jQuery selection} gradientSvg The node to render into.
	     * @param {Number[]} tickStops the values at which ticks will be drawn. The first value should
	     *   be the minimum value, and the last value should be the maximum.
	     * @param {d3.scale} colorScale a scale from a value, to a color.
	     *
	     * @private
	     */
	    drawGradient: function(gradientSvg, tickStops, colorScale) {

	      var gradientSvgSelection = d3.select(gradientSvg[0]);

	      if (d3.select('#' + this.gradientId).empty()) {
	        gradientSvgSelection.append('linearGradient').attr({
	          id: this.gradientId,
	          gradientUnits: 'userSpaceOnUse',
	          y1: '100%',
	          x1: 0,
	          x2: 0,
	          y2: 0
	        });
	      }

	      // Due to a webkit bug (https://bugs.webkit.org/show_bug.cgi?id=83438), we can't select a
	      // camelCase element. So select it by id
	      var gradient = gradientSvgSelection.selectAll('#{0}'.format(this.gradientId));

	      // Create a scale for positioning values by percentage
	      var positionScale = colorScale.copy().range([0, 100]);
	      var domain = positionScale.domain();
	      if (domain.length > 2) {
	        positionScale.domain([domain[0], _.last(domain)]);
	      }

	      // We'll make a stop in the gradient for each tick stop, to ensure the gradients grade
	      // similarly.
	      var gradientStops = gradient.selectAll('stop').data(tickStops);
	      gradientStops.enter().append('stop');
	      gradientStops.attr({
	        'offset': function(value) {
	          return '{0}%'.format(positionScale(value));
	        },
	        'stop-color': colorScale
	      });
	      gradientStops.exit().remove();

	      // Draw the rectangles in pieces, so as to store the data, so the ticks can access them.
	      var rectangles = gradientSvgSelection.
	        selectAll('rect').
	        data(tickStops);

	      rectangles.enter().
	        append('rect');

	      rectangles.attr({
	        x: 0,
	        y: function(value) {

	          // Since y is actually 'top', and we want the lowest value at the bottom, subtract
	          // from 100
	          return '{0}%'.format(100 - positionScale(value));
	        },
	        width: '100%',
	        height: function(value, i) {
	          if (i === 0) {
	            return 0;
	          }
	          return '{0}%'.format(Math.abs(positionScale(value) - positionScale(tickStops[i - 1])));
	        },
	        fill: 'url(#{0})'.format(this.gradientId)
	      });

	      rectangles.exit().remove();
	    },

	    /**
	     * Creates the d3 scale used to map from a value to a color.
	     *
	     * @param {Number[]} tickStops an array of values, the first of which should be the minimum
	     *   value of the data, the last of which should be the maximum value of the data.
	     * @param {d3.scale} scale a d3 scale whose domain is the value domain.
	     *
	     * @return {d3.scale} a scale mapping from a value within features, to a color.
	     * @private
	     */
	    createColorScale: function(tickStops, scale) {

	      var domain;
	      var range = [
	        CONTINUOUS_LEGEND_NEGATIVE_COLOR,
	        CONTINUOUS_LEGEND_ZERO_COLOR,
	        CONTINUOUS_LEGEND_POSITIVE_COLOR
	      ];
	      var min = tickStops[0];
	      var max = _.last(tickStops);

	      if (min >= 0) {

	        // All positive values
	        domain = [min, max];
	        range = range.slice(1);
	      } else if (max <= 0) {

	        // All negative values
	        domain = [min, max];
	        range = range.slice(0, 2);
	      } else {

	        // Straddle zero
	        domain = [min, 0, max];
	      }

	      // For log scales, if the domain includes zero, set it to the minimum value instead.
	      if (scale.base && _.first(domain) === 0) {
	        domain[0] = min;
	      }

	      return scale.copy().
	        domain(domain).
	        range(range);
	    },

	    /**
	     * Draw the ticks and labels for the legend.
	     *
	     * @param {jQuery selection} ticksSvg The node to render into.
	     * @param {jQuery selection} gradientSvg The associated gradient node to consult for layout.
	     * @param {Number[]} tickStops the values at which ticks will be drawn. The first value should
	     *   be the minimum value, and the last value should be the maximum.
	     * @param {d3.scale} colorScale a scale from a value, to a color.
	     * @param {Number} indexOfZero The index of the origin in ticks.
	     *
	     * @private
	     */
	    drawAxis: function(ticksSvg, gradientSvg, tickStops, scale, indexOfZero) {

	      var ticksGroup = ticksSvg.find('g.ticks');
	      var positionScale = scale.copy().range([this.legendElement.height(), 0]);
	      var axis = d3.svg.axis().
	        scale(positionScale).
	        tickValues(tickStops).
	        orient('left');

	      if (_.last(tickStops) - tickStops[0] > 10) {
	        axis.tickFormat(_visualizationUtils.bigNumTickFormatter);
	      }

	      axis(ticksGroup);

	      // We want to size the ticks differently than d3's default. Do that manually.
	      var ticks = d3.select(ticksGroup[0]).selectAll('g.tick');

	      // Round ticks close to zero to fix logarithmic special cases.
	      ticks.each(function(d) {
	        if (Math.abs(d) < 1) {
	          d3.select(this).select('text').text('0');
	        }
	      });

	      // Alternate small/big, starting with big.
	      var isSmall = true;

	      ticks.classed('small', function(value, i) {

	        // Zero was added artificially. Show a tick, but make it small.
	        if (i === indexOfZero) {
	          return true;
	        }

	        // Always make the end ticks big
	        if (tickStops.length === (i + 1)) {
	          return false;
	        }

	        // For normal ticks, alternate big and small
	        isSmall = !isSmall;
	        return isSmall;

	      }).style('opacity', ''); // d3 sets an opacity for some reason. unset it.

	      // D3's axis draws ticks left-of-origin, which causes issues with browsers that won't render
	      // SVG elements outside of the parent SVG node's bounds (PhantomJS).
	      // So shift the ticks right into positive X coordinates, and then move the entire SVG left
	      // to compensate.
	      // Similarly, D3's tick text extends above and below the SVG bounds. Compensate much the same way.
	      var MAGICAL_FONT_RENDERING_ALLOWANCE = 10;
	      var tickMaxWidth = d3.max(
	        ticksGroup.find('g.tick').map(function(i, el) {
	          return el.getBoundingClientRect().width;
	        })
	      ) + MAGICAL_FONT_RENDERING_ALLOWANCE;

	      var tickMaxHeight = d3.max(
	        ticksGroup.find('g.tick').map(function(i, el) {
	          return el.getBoundingClientRect().height;
	        })
	      );

	      // Allow for 1/2 tick height above and below by bumping up height.
	      ticksSvg.height(gradientSvg.height() + tickMaxHeight);
	      ticksSvg.width(gradientSvg.width() + tickMaxWidth);

	      // Shift the entire SVG appropriately.
	      ticksSvg.css('left', '{0}px'.format(-tickMaxWidth));
	      ticksSvg.css('top', '{0}px'.format(parseInt(gradientSvg.css('top'), 10) - tickMaxHeight / 2));

	      // Now listen to me very carefully. Compensate for shift in SVG by putting the ticks back.
	      ticksGroup.attr('transform', 'translate({0},{1})'.format(tickMaxWidth, tickMaxHeight / 2));
	    },

	    /**
	     * Determines the type of d3 scale to create for the given values, and creates it.
	     *
	     * @param {Number[]} values the data values we're visualizing.
	     * @param {Number=} min the minimum value within values. Saves us the trouble of finding it,
	     *   if you already have it.
	     * @param {Number=} max the maximum value within values. Saves us the trouble of finding it,
	     *   if you already have it.
	     *
	     * @return {d3.scale} a d3 scale of the determined type, with the domain set.
	     */
	    scaleForValues: function(values, min, max) {

	      var scale;

	      min = min || _.min(values);
	      max = max || _.max(values);

	      if (min > 0 || max < 0) {

	        // Eligible for logarithmic scale, if all-positive or all-negative values
	        var deltaMagnitude = Math.log(max - min) / Math.LN10; // Originally `log10` from lodash-mixins.js in Frontend
	        if (deltaMagnitude >= 3) {

	          // Only logarithmic if we've got a large change in magnitude
	          scale = d3.scale.log();
	        } else {
	          scale = d3.scale.linear();
	        }
	      } else {
	        scale = d3.scale.linear();
	      }

	      return scale.domain([min, max]).nice();
	    },

	    NUM_TICKS: 5,

	    /**
	     * Redraw the legend.
	     *
	     * @return {d3.scale} a scale mapping from value to color.
	     */
	    update: function(data, dimensions) {

	      if (!(data.features && data.features.length)) {
	        return undefined;
	      }

	      var values = _.pluck(
	        _.pluck(data.features, 'properties'),
	        UNFILTERED_GEOJSON_PROPERTY_NAME
	      );
	      var min = _.min(values);
	      var max = _.max(values);

	      if (_.isFinite(min) && _.isFinite(max)) {
	        this.legendElement.show();
	      } else {
	        this.legendElement.hide();
	        return;
	      }

	      if (min === max) {

	        // If there's only one value, make it a scale from 0 to that value.
	        if (max < 0) {
	          values.push(0);
	          max = 0;
	        } else if (min > 0) {
	          values.unshift(0);
	          min = 0;

	        // ...the only value is 0. Give 'em a fake range. It's all they deserve.
	        } else {
	          values.push(1);
	          max = 1;
	        }
	      }

	      var scale = this.scaleForValues(values, min, max);
	      var tickStops = this.findTickStops(scale, Math.min(values.length, this.NUM_TICKS));
	      var indexOfZero = _visualizationUtils.addZeroIfNecessary(tickStops);

	      var colorScale = this.createColorScale(tickStops, scale);
	      var gradientSvg = this.legendElement.find('svg.gradient');
	      var ticksSvg = this.legendElement.find('svg.legend-ticks');

	      // Grab the top and bottom padding from the css.
	      var legendPaddingTop = parseInt(this.legendElement.css('padding-top'), 10);
	      var legendPaddingBottom = parseInt(this.legendElement.css('padding-bottom'), 10);
	      var legendVerticalPadding = legendPaddingTop + legendPaddingBottom;

	      // We want the maximum height that will fit inside the visualization,
	      // which comes down to: visualizationHeight - legendVerticalPadding.
	      var legendHeight = Math.min(
	        dimensions.height - legendVerticalPadding,
	        parseInt(this.legendElement.css('maxHeight'), 10)
	      );

	      // Assign this height to both the legend container and the gradient.
	      // This will cause the legend to be rendered inside the visualization
	      // in all cases, and at its maximum height if the visualization is
	      // sufficiently tall.
	      this.legendElement.height(legendHeight);
	      gradientSvg.height(legendHeight);

	      this.drawGradient(gradientSvg, tickStops, colorScale);
	      this.drawAxis(ticksSvg, gradientSvg, tickStops, scale, indexOfZero);

	      return colorScale;
	    }
	  });
	}

	module.exports = ChoroplethMap;


/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* global module */
	// # simple-statistics
	//
	// A simple, literate statistics system. The code below uses the
	// [Javascript module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth),
	// eventually assigning `simple-statistics` to `ss` in browsers or the
	// `exports` object for node.js
	(function() {
	    var ss = {};

	    if (true) {
	        // Assign the `ss` object to exports, so that you can require
	        // it in [node.js](http://nodejs.org/)
	        module.exports = ss;
	    } else {
	        // Otherwise, in a browser, we assign `ss` to the window object,
	        // so you can simply refer to it as `ss`.
	        this.ss = ss;
	    }

	    // # [Linear Regression](http://en.wikipedia.org/wiki/Linear_regression)
	    //
	    // [Simple linear regression](http://en.wikipedia.org/wiki/Simple_linear_regression)
	    // is a simple way to find a fitted line
	    // between a set of coordinates.
	    function linear_regression() {
	        var linreg = {},
	            data = [];

	        // Assign data to the model. Data is assumed to be an array.
	        linreg.data = function(x) {
	            if (!arguments.length) return data;
	            data = x.slice();
	            return linreg;
	        };

	        // Calculate the slope and y-intercept of the regression line
	        // by calculating the least sum of squares
	        linreg.mb = function() {
	            var m, b;

	            // Store data length in a local variable to reduce
	            // repeated object property lookups
	            var data_length = data.length;

	            //if there's only one point, arbitrarily choose a slope of 0
	            //and a y-intercept of whatever the y of the initial point is
	            if (data_length === 1) {
	                m = 0;
	                b = data[0][1];
	            } else {
	                // Initialize our sums and scope the `m` and `b`
	                // variables that define the line.
	                var sum_x = 0, sum_y = 0,
	                    sum_xx = 0, sum_xy = 0;

	                // Use local variables to grab point values
	                // with minimal object property lookups
	                var point, x, y;

	                // Gather the sum of all x values, the sum of all
	                // y values, and the sum of x^2 and (x*y) for each
	                // value.
	                //
	                // In math notation, these would be SS_x, SS_y, SS_xx, and SS_xy
	                for (var i = 0; i < data_length; i++) {
	                    point = data[i];
	                    x = point[0];
	                    y = point[1];

	                    sum_x += x;
	                    sum_y += y;

	                    sum_xx += x * x;
	                    sum_xy += x * y;
	                }

	                // `m` is the slope of the regression line
	                m = ((data_length * sum_xy) - (sum_x * sum_y)) /
	                    ((data_length * sum_xx) - (sum_x * sum_x));

	                // `b` is the y-intercept of the line.
	                b = (sum_y / data_length) - ((m * sum_x) / data_length);
	            }

	            // Return both values as an object.
	            return { m: m, b: b };
	        };

	        // a shortcut for simply getting the slope of the regression line
	        linreg.m = function() {
	            return linreg.mb().m;
	        };

	        // a shortcut for simply getting the y-intercept of the regression
	        // line.
	        linreg.b = function() {
	            return linreg.mb().b;
	        };

	        // ## Fitting The Regression Line
	        //
	        // This is called after `.data()` and returns the
	        // equation `y = f(x)` which gives the position
	        // of the regression line at each point in `x`.
	        linreg.line = function() {

	            // Get the slope, `m`, and y-intercept, `b`, of the line.
	            var mb = linreg.mb(),
	                m = mb.m,
	                b = mb.b;

	            // Return a function that computes a `y` value for each
	            // x value it is given, based on the values of `b` and `a`
	            // that we just computed.
	            return function(x) {
	                return b + (m * x);
	            };
	        };

	        return linreg;
	    }

	    // # [R Squared](http://en.wikipedia.org/wiki/Coefficient_of_determination)
	    //
	    // The r-squared value of data compared with a function `f`
	    // is the sum of the squared differences between the prediction
	    // and the actual value.
	    function r_squared(data, f) {
	        if (data.length < 2) return 1;

	        // Compute the average y value for the actual
	        // data set in order to compute the
	        // _total sum of squares_
	        var sum = 0, average;
	        for (var i = 0; i < data.length; i++) {
	            sum += data[i][1];
	        }
	        average = sum / data.length;

	        // Compute the total sum of squares - the
	        // squared difference between each point
	        // and the average of all points.
	        var sum_of_squares = 0;
	        for (var j = 0; j < data.length; j++) {
	            sum_of_squares += Math.pow(average - data[j][1], 2);
	        }

	        // Finally estimate the error: the squared
	        // difference between the estimate and the actual data
	        // value at each point.
	        var err = 0;
	        for (var k = 0; k < data.length; k++) {
	            err += Math.pow(data[k][1] - f(data[k][0]), 2);
	        }

	        // As the error grows larger, its ratio to the
	        // sum of squares increases and the r squared
	        // value grows lower.
	        return 1 - (err / sum_of_squares);
	    }


	    // # [Bayesian Classifier](http://en.wikipedia.org/wiki/Naive_Bayes_classifier)
	    //
	    // This is a naïve bayesian classifier that takes
	    // singly-nested objects.
	    function bayesian() {
	        // The `bayes_model` object is what will be exposed
	        // by this closure, with all of its extended methods, and will
	        // have access to all scope variables, like `total_count`.
	        var bayes_model = {},
	            // The number of items that are currently
	            // classified in the model
	            total_count = 0,
	            // Every item classified in the model
	            data = {};

	        // ## Train
	        // Train the classifier with a new item, which has a single
	        // dimension of Javascript literal keys and values.
	        bayes_model.train = function(item, category) {
	            // If the data object doesn't have any values
	            // for this category, create a new object for it.
	            if (!data[category]) data[category] = {};

	            // Iterate through each key in the item.
	            for (var k in item) {
	                var v = item[k];
	                // Initialize the nested object `data[category][k][item[k]]`
	                // with an object of keys that equal 0.
	                if (data[category][k] === undefined) data[category][k] = {};
	                if (data[category][k][v] === undefined) data[category][k][v] = 0;

	                // And increment the key for this key/value combination.
	                data[category][k][item[k]]++;
	            }
	            // Increment the number of items classified
	            total_count++;
	        };

	        // ## Score
	        // Generate a score of how well this item matches all
	        // possible categories based on its attributes
	        bayes_model.score = function(item) {
	            // Initialize an empty array of odds per category.
	            var odds = {}, category;
	            // Iterate through each key in the item,
	            // then iterate through each category that has been used
	            // in previous calls to `.train()`
	            for (var k in item) {
	                var v = item[k];
	                for (category in data) {
	                    // Create an empty object for storing key - value combinations
	                    // for this category.
	                    if (odds[category] === undefined) odds[category] = {};

	                    // If this item doesn't even have a property, it counts for nothing,
	                    // but if it does have the property that we're looking for from
	                    // the item to categorize, it counts based on how popular it is
	                    // versus the whole population.
	                    if (data[category][k]) {
	                        odds[category][k + '_' + v] = (data[category][k][v] || 0) / total_count;
	                    } else {
	                        odds[category][k + '_' + v] = 0;
	                    }
	                }
	            }

	            // Set up a new object that will contain sums of these odds by category
	            var odds_sums = {};

	            for (category in odds) {
	                // Tally all of the odds for each category-combination pair -
	                // the non-existence of a category does not add anything to the
	                // score.
	                for (var combination in odds[category]) {
	                    if (odds_sums[category] === undefined) odds_sums[category] = 0;
	                    odds_sums[category] += odds[category][combination];
	                }
	            }

	            return odds_sums;
	        };

	        // Return the completed model.
	        return bayes_model;
	    }

	    // # sum
	    //
	    // is simply the result of adding all numbers
	    // together, starting from zero.
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function sum(x) {
	        var value = 0;
	        for (var i = 0; i < x.length; i++) {
	            value += x[i];
	        }
	        return value;
	    }

	    // # mean
	    //
	    // is the sum over the number of values
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function mean(x) {
	        // The mean of no numbers is null
	        if (x.length === 0) return null;

	        return sum(x) / x.length;
	    }

	    // # geometric mean
	    //
	    // a mean function that is more useful for numbers in different
	    // ranges.
	    //
	    // this is the nth root of the input numbers multiplied by each other
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function geometric_mean(x) {
	        // The mean of no numbers is null
	        if (x.length === 0) return null;

	        // the starting value.
	        var value = 1;

	        for (var i = 0; i < x.length; i++) {
	            // the geometric mean is only valid for positive numbers
	            if (x[i] <= 0) return null;

	            // repeatedly multiply the value by each number
	            value *= x[i];
	        }

	        return Math.pow(value, 1 / x.length);
	    }


	    // # harmonic mean
	    //
	    // a mean function typically used to find the average of rates
	    //
	    // this is the reciprocal of the arithmetic mean of the reciprocals
	    // of the input numbers
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function harmonic_mean(x) {
	        // The mean of no numbers is null
	        if (x.length === 0) return null;

	        var reciprocal_sum = 0;

	        for (var i = 0; i < x.length; i++) {
	            // the harmonic mean is only valid for positive numbers
	            if (x[i] <= 0) return null;

	            reciprocal_sum += 1 / x[i];
	        }

	        // divide n by the the reciprocal sum
	        return x.length / reciprocal_sum;
	    }


	    // # min
	    //
	    // This is simply the minimum number in the set.
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function min(x) {
	        var value;
	        for (var i = 0; i < x.length; i++) {
	            // On the first iteration of this loop, min is
	            // undefined and is thus made the minimum element in the array
	            if (x[i] < value || value === undefined) value = x[i];
	        }
	        return value;
	    }

	    // # max
	    //
	    // This is simply the maximum number in the set.
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function max(x) {
	        var value;
	        for (var i = 0; i < x.length; i++) {
	            // On the first iteration of this loop, max is
	            // undefined and is thus made the maximum element in the array
	            if (x[i] > value || value === undefined) value = x[i];
	        }
	        return value;
	    }

	    // # [variance](http://en.wikipedia.org/wiki/Variance)
	    //
	    // is the sum of squared deviations from the mean
	    //
	    // depends on `mean()`
	    function variance(x) {
	        // The variance of no numbers is null
	        if (x.length === 0) return null;

	        var mean_value = mean(x),
	            deviations = [];

	        // Make a list of squared deviations from the mean.
	        for (var i = 0; i < x.length; i++) {
	            deviations.push(Math.pow(x[i] - mean_value, 2));
	        }

	        // Find the mean value of that list
	        return mean(deviations);
	    }

	    // # [standard deviation](http://en.wikipedia.org/wiki/Standard_deviation)
	    //
	    // is just the square root of the variance.
	    //
	    // depends on `variance()`
	    function standard_deviation(x) {
	        // The standard deviation of no numbers is null
	        if (x.length === 0) return null;

	        return Math.sqrt(variance(x));
	    }

	    // The sum of deviations to the Nth power.
	    // When n=2 it's the sum of squared deviations.
	    // When n=3 it's the sum of cubed deviations.
	    //
	    // depends on `mean()`
	    function sum_nth_power_deviations(x, n) {
	        var mean_value = mean(x),
	            sum = 0;

	        for (var i = 0; i < x.length; i++) {
	            sum += Math.pow(x[i] - mean_value, n);
	        }

	        return sum;
	    }

	    // # [variance](http://en.wikipedia.org/wiki/Variance)
	    //
	    // is the sum of squared deviations from the mean
	    //
	    // depends on `sum_nth_power_deviations`
	    function sample_variance(x) {
	        // The variance of no numbers is null
	        if (x.length <= 1) return null;

	        var sum_squared_deviations_value = sum_nth_power_deviations(x, 2);

	        // Find the mean value of that list
	        return sum_squared_deviations_value / (x.length - 1);
	    }

	    // # [standard deviation](http://en.wikipedia.org/wiki/Standard_deviation)
	    //
	    // is just the square root of the variance.
	    //
	    // depends on `sample_variance()`
	    function sample_standard_deviation(x) {
	        // The standard deviation of no numbers is null
	        if (x.length <= 1) return null;

	        return Math.sqrt(sample_variance(x));
	    }

	    // # [covariance](http://en.wikipedia.org/wiki/Covariance)
	    //
	    // sample covariance of two datasets:
	    // how much do the two datasets move together?
	    // x and y are two datasets, represented as arrays of numbers.
	    //
	    // depends on `mean()`
	    function sample_covariance(x, y) {

	        // The two datasets must have the same length which must be more than 1
	        if (x.length <= 1 || x.length != y.length){
	            return null;
	        }

	        // determine the mean of each dataset so that we can judge each
	        // value of the dataset fairly as the difference from the mean. this
	        // way, if one dataset is [1, 2, 3] and [2, 3, 4], their covariance
	        // does not suffer because of the difference in absolute values
	        var xmean = mean(x),
	            ymean = mean(y),
	            sum = 0;

	        // for each pair of values, the covariance increases when their
	        // difference from the mean is associated - if both are well above
	        // or if both are well below
	        // the mean, the covariance increases significantly.
	        for (var i = 0; i < x.length; i++){
	            sum += (x[i] - xmean) * (y[i] - ymean);
	        }

	        // the covariance is weighted by the length of the datasets.
	        return sum / (x.length - 1);
	    }

	    // # [correlation](http://en.wikipedia.org/wiki/Correlation_and_dependence)
	    //
	    // Gets a measure of how correlated two datasets are, between -1 and 1
	    //
	    // depends on `sample_standard_deviation()` and `sample_covariance()`
	    function sample_correlation(x, y) {
	        var cov = sample_covariance(x, y),
	            xstd = sample_standard_deviation(x),
	            ystd = sample_standard_deviation(y);

	        if (cov === null || xstd === null || ystd === null) {
	            return null;
	        }

	        return cov / xstd / ystd;
	    }

	    // # [median](http://en.wikipedia.org/wiki/Median)
	    //
	    // The middle number of a list. This is often a good indicator of 'the middle'
	    // when there are outliers that skew the `mean()` value.
	    function median(x) {
	        // The median of an empty list is null
	        if (x.length === 0) return null;

	        // Sorting the array makes it easy to find the center, but
	        // use `.slice()` to ensure the original array `x` is not modified
	        var sorted = x.slice().sort(function (a, b) { return a - b; });

	        // If the length of the list is odd, it's the central number
	        if (sorted.length % 2 === 1) {
	            return sorted[(sorted.length - 1) / 2];
	        // Otherwise, the median is the average of the two numbers
	        // at the center of the list
	        } else {
	            var a = sorted[(sorted.length / 2) - 1];
	            var b = sorted[(sorted.length / 2)];
	            return (a + b) / 2;
	        }
	    }

	    // # [mode](http://bit.ly/W5K4Yt)
	    //
	    // The mode is the number that appears in a list the highest number of times.
	    // There can be multiple modes in a list: in the event of a tie, this
	    // algorithm will return the most recently seen mode.
	    //
	    // This implementation is inspired by [science.js](https://github.com/jasondavies/science.js/blob/master/src/stats/mode.js)
	    //
	    // This runs on `O(n)`, linear time in respect to the array
	    function mode(x) {

	        // Handle edge cases:
	        // The median of an empty list is null
	        if (x.length === 0) return null;
	        else if (x.length === 1) return x[0];

	        // Sorting the array lets us iterate through it below and be sure
	        // that every time we see a new number it's new and we'll never
	        // see the same number twice
	        var sorted = x.slice().sort(function (a, b) { return a - b; });

	        // This assumes it is dealing with an array of size > 1, since size
	        // 0 and 1 are handled immediately. Hence it starts at index 1 in the
	        // array.
	        var last = sorted[0],
	            // store the mode as we find new modes
	            value,
	            // store how many times we've seen the mode
	            max_seen = 0,
	            // how many times the current candidate for the mode
	            // has been seen
	            seen_this = 1;

	        // end at sorted.length + 1 to fix the case in which the mode is
	        // the highest number that occurs in the sequence. the last iteration
	        // compares sorted[i], which is undefined, to the highest number
	        // in the series
	        for (var i = 1; i < sorted.length + 1; i++) {
	            // we're seeing a new number pass by
	            if (sorted[i] !== last) {
	                // the last number is the new mode since we saw it more
	                // often than the old one
	                if (seen_this > max_seen) {
	                    max_seen = seen_this;
	                    value = last;
	                }
	                seen_this = 1;
	                last = sorted[i];
	            // if this isn't a new number, it's one more occurrence of
	            // the potential mode
	            } else { seen_this++; }
	        }
	        return value;
	    }

	    // # [t-test](http://en.wikipedia.org/wiki/Student's_t-test)
	    //
	    // This is to compute a one-sample t-test, comparing the mean
	    // of a sample to a known value, x.
	    //
	    // in this case, we're trying to determine whether the
	    // population mean is equal to the value that we know, which is `x`
	    // here. usually the results here are used to look up a
	    // [p-value](http://en.wikipedia.org/wiki/P-value), which, for
	    // a certain level of significance, will let you determine that the
	    // null hypothesis can or cannot be rejected.
	    //
	    // Depends on `standard_deviation()` and `mean()`
	    function t_test(sample, x) {
	        // The mean of the sample
	        var sample_mean = mean(sample);

	        // The standard deviation of the sample
	        var sd = standard_deviation(sample);

	        // Square root the length of the sample
	        var rootN = Math.sqrt(sample.length);

	        // Compute the known value against the sample,
	        // returning the t value
	        return (sample_mean - x) / (sd / rootN);
	    }

	    // # [2-sample t-test](http://en.wikipedia.org/wiki/Student's_t-test)
	    //
	    // This is to compute two sample t-test.
	    // Tests whether "mean(X)-mean(Y) = difference", (
	    // in the most common case, we often have `difference == 0` to test if two samples
	    // are likely to be taken from populations with the same mean value) with
	    // no prior knowledge on standard deviations of both samples
	    // other than the fact that they have the same standard deviation.
	    //
	    // Usually the results here are used to look up a
	    // [p-value](http://en.wikipedia.org/wiki/P-value), which, for
	    // a certain level of significance, will let you determine that the
	    // null hypothesis can or cannot be rejected.
	    //
	    // `diff` can be omitted if it equals 0.
	    //
	    // [This is used to confirm or deny](http://www.monarchlab.org/Lab/Research/Stats/2SampleT.aspx)
	    // a null hypothesis that the two populations that have been sampled into
	    // `sample_x` and `sample_y` are equal to each other.
	    //
	    // Depends on `sample_variance()` and `mean()`
	    function t_test_two_sample(sample_x, sample_y, difference) {
	        var n = sample_x.length,
	            m = sample_y.length;

	        // If either sample doesn't actually have any values, we can't
	        // compute this at all, so we return `null`.
	        if (!n || !m) return null ;

	        // default difference (mu) is zero
	        if (!difference) difference = 0;

	        var meanX = mean(sample_x),
	            meanY = mean(sample_y);

	        var weightedVariance = ((n - 1) * sample_variance(sample_x) +
	            (m - 1) * sample_variance(sample_y)) / (n + m - 2);

	        return (meanX - meanY - difference) /
	            Math.sqrt(weightedVariance * (1 / n + 1 / m));
	    }

	    // # quantile
	    //
	    // This is a population quantile, since we assume to know the entire
	    // dataset in this library. Thus I'm trying to follow the
	    // [Quantiles of a Population](http://en.wikipedia.org/wiki/Quantile#Quantiles_of_a_population)
	    // algorithm from wikipedia.
	    //
	    // Sample is a one-dimensional array of numbers,
	    // and p is either a decimal number from 0 to 1 or an array of decimal
	    // numbers from 0 to 1.
	    // In terms of a k/q quantile, p = k/q - it's just dealing with fractions or dealing
	    // with decimal values.
	    // When p is an array, the result of the function is also an array containing the appropriate
	    // quantiles in input order
	    function quantile(sample, p) {

	        // We can't derive quantiles from an empty list
	        if (sample.length === 0) return null;

	        // Sort a copy of the array. We'll need a sorted array to index
	        // the values in sorted order.
	        var sorted = sample.slice().sort(function (a, b) { return a - b; });

	        if (p.length) {
	            // Initialize the result array
	            var results = [];
	            // For each requested quantile
	            for (var i = 0; i < p.length; i++) {
	                results[i] = quantile_sorted(sorted, p[i]);
	            }
	            return results;
	        } else {
	            return quantile_sorted(sorted, p);
	        }
	    }

	    // # quantile
	    //
	    // This is the internal implementation of quantiles: when you know
	    // that the order is sorted, you don't need to re-sort it, and the computations
	    // are much faster.
	    function quantile_sorted(sample, p) {
	        var idx = (sample.length) * p;
	        if (p < 0 || p > 1) {
	            return null;
	        } else if (p === 1) {
	            // If p is 1, directly return the last element
	            return sample[sample.length - 1];
	        } else if (p === 0) {
	            // If p is 0, directly return the first element
	            return sample[0];
	        } else if (idx % 1 !== 0) {
	            // If p is not integer, return the next element in array
	            return sample[Math.ceil(idx) - 1];
	        } else if (sample.length % 2 === 0) {
	            // If the list has even-length, we'll take the average of this number
	            // and the next value, if there is one
	            return (sample[idx - 1] + sample[idx]) / 2;
	        } else {
	            // Finally, in the simple case of an integer value
	            // with an odd-length list, return the sample value at the index.
	            return sample[idx];
	        }
	    }

	    // # [Interquartile range](http://en.wikipedia.org/wiki/Interquartile_range)
	    //
	    // A measure of statistical dispersion, or how scattered, spread, or
	    // concentrated a distribution is. It's computed as the difference between
	    // the third quartile and first quartile.
	    function iqr(sample) {
	        // We can't derive quantiles from an empty list
	        if (sample.length === 0) return null;

	        // Interquartile range is the span between the upper quartile,
	        // at `0.75`, and lower quartile, `0.25`
	        return quantile(sample, 0.75) - quantile(sample, 0.25);
	    }

	    // # [Median Absolute Deviation](http://en.wikipedia.org/wiki/Median_absolute_deviation)
	    //
	    // The Median Absolute Deviation (MAD) is a robust measure of statistical
	    // dispersion. It is more resilient to outliers than the standard deviation.
	    function mad(x) {
	        // The mad of nothing is null
	        if (!x || x.length === 0) return null;

	        var median_value = median(x),
	            median_absolute_deviations = [];

	        // Make a list of absolute deviations from the median
	        for (var i = 0; i < x.length; i++) {
	            median_absolute_deviations.push(Math.abs(x[i] - median_value));
	        }

	        // Find the median value of that list
	        return median(median_absolute_deviations);
	    }

	    // ## Compute Matrices for Jenks
	    //
	    // Compute the matrices required for Jenks breaks. These matrices
	    // can be used for any classing of data with `classes <= n_classes`
	    function jenksMatrices(data, n_classes) {

	        // in the original implementation, these matrices are referred to
	        // as `LC` and `OP`
	        //
	        // * lower_class_limits (LC): optimal lower class limits
	        // * variance_combinations (OP): optimal variance combinations for all classes
	        var lower_class_limits = [],
	            variance_combinations = [],
	            // loop counters
	            i, j,
	            // the variance, as computed at each step in the calculation
	            variance = 0;

	        // Initialize and fill each matrix with zeroes
	        for (i = 0; i < data.length + 1; i++) {
	            var tmp1 = [], tmp2 = [];
	            // despite these arrays having the same values, we need
	            // to keep them separate so that changing one does not change
	            // the other
	            for (j = 0; j < n_classes + 1; j++) {
	                tmp1.push(0);
	                tmp2.push(0);
	            }
	            lower_class_limits.push(tmp1);
	            variance_combinations.push(tmp2);
	        }

	        for (i = 1; i < n_classes + 1; i++) {
	            lower_class_limits[1][i] = 1;
	            variance_combinations[1][i] = 0;
	            // in the original implementation, 9999999 is used but
	            // since Javascript has `Infinity`, we use that.
	            for (j = 2; j < data.length + 1; j++) {
	                variance_combinations[j][i] = Infinity;
	            }
	        }

	        for (var l = 2; l < data.length + 1; l++) {

	            // `SZ` originally. this is the sum of the values seen thus
	            // far when calculating variance.
	            var sum = 0,
	                // `ZSQ` originally. the sum of squares of values seen
	                // thus far
	                sum_squares = 0,
	                // `WT` originally. This is the number of
	                w = 0,
	                // `IV` originally
	                i4 = 0;

	            // in several instances, you could say `Math.pow(x, 2)`
	            // instead of `x * x`, but this is slower in some browsers
	            // introduces an unnecessary concept.
	            for (var m = 1; m < l + 1; m++) {

	                // `III` originally
	                var lower_class_limit = l - m + 1,
	                    val = data[lower_class_limit - 1];

	                // here we're estimating variance for each potential classing
	                // of the data, for each potential number of classes. `w`
	                // is the number of data points considered so far.
	                w++;

	                // increase the current sum and sum-of-squares
	                sum += val;
	                sum_squares += val * val;

	                // the variance at this point in the sequence is the difference
	                // between the sum of squares and the total x 2, over the number
	                // of samples.
	                variance = sum_squares - (sum * sum) / w;

	                i4 = lower_class_limit - 1;

	                if (i4 !== 0) {
	                    for (j = 2; j < n_classes + 1; j++) {
	                        // if adding this element to an existing class
	                        // will increase its variance beyond the limit, break
	                        // the class at this point, setting the `lower_class_limit`
	                        // at this point.
	                        if (variance_combinations[l][j] >=
	                            (variance + variance_combinations[i4][j - 1])) {
	                            lower_class_limits[l][j] = lower_class_limit;
	                            variance_combinations[l][j] = variance +
	                                variance_combinations[i4][j - 1];
	                        }
	                    }
	                }
	            }

	            lower_class_limits[l][1] = 1;
	            variance_combinations[l][1] = variance;
	        }

	        // return the two matrices. for just providing breaks, only
	        // `lower_class_limits` is needed, but variances can be useful to
	        // evaluate goodness of fit.
	        return {
	            lower_class_limits: lower_class_limits,
	            variance_combinations: variance_combinations
	        };
	    }

	    // ## Pull Breaks Values for Jenks
	    //
	    // the second part of the jenks recipe: take the calculated matrices
	    // and derive an array of n breaks.
	    function jenksBreaks(data, lower_class_limits, n_classes) {

	        var k = data.length - 1,
	            kclass = [],
	            countNum = n_classes;

	        // the calculation of classes will never include the upper and
	        // lower bounds, so we need to explicitly set them
	        kclass[n_classes] = data[data.length - 1];
	        kclass[0] = data[0];

	        // the lower_class_limits matrix is used as indices into itself
	        // here: the `k` variable is reused in each iteration.
	        while (countNum > 1) {
	            kclass[countNum - 1] = data[lower_class_limits[k][countNum] - 2];
	            k = lower_class_limits[k][countNum] - 1;
	            countNum--;
	        }

	        return kclass;
	    }

	    // # [Jenks natural breaks optimization](http://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization)
	    //
	    // Implementations: [1](http://danieljlewis.org/files/2010/06/Jenks.pdf) (python),
	    // [2](https://github.com/vvoovv/djeo-jenks/blob/master/main.js) (buggy),
	    // [3](https://github.com/simogeo/geostats/blob/master/lib/geostats.js#L407) (works)
	    //
	    // Depends on `jenksBreaks()` and `jenksMatrices()`
	    function jenks(data, n_classes) {

	        if (n_classes > data.length) return null;

	        // sort data in numerical order, since this is expected
	        // by the matrices function
	        data = data.slice().sort(function (a, b) { return a - b; });

	        // get our basic matrices
	        var matrices = jenksMatrices(data, n_classes),
	            // we only need lower class limits here
	            lower_class_limits = matrices.lower_class_limits;

	        // extract n_classes out of the computed matrices
	        return jenksBreaks(data, lower_class_limits, n_classes);

	    }

	    // # [Skewness](http://en.wikipedia.org/wiki/Skewness)
	    //
	    // A measure of the extent to which a probability distribution of a
	    // real-valued random variable "leans" to one side of the mean.
	    // The skewness value can be positive or negative, or even undefined.
	    //
	    // Implementation is based on the adjusted Fisher-Pearson standardized
	    // moment coefficient, which is the version found in Excel and several
	    // statistical packages including Minitab, SAS and SPSS.
	    //
	    // Depends on `sum_nth_power_deviations()` and `sample_standard_deviation`
	    function sample_skewness(x) {
	        // The skewness of less than three arguments is null
	        if (x.length < 3) return null;

	        var n = x.length,
	            cubed_s = Math.pow(sample_standard_deviation(x), 3),
	            sum_cubed_deviations = sum_nth_power_deviations(x, 3);

	        return n * sum_cubed_deviations / ((n - 1) * (n - 2) * cubed_s);
	    }

	    // # Standard Normal Table
	    // A standard normal table, also called the unit normal table or Z table,
	    // is a mathematical table for the values of Φ (phi), which are the values of
	    // the cumulative distribution function of the normal distribution.
	    // It is used to find the probability that a statistic is observed below,
	    // above, or between values on the standard normal distribution, and by
	    // extension, any normal distribution.
	    //
	    // The probabilities are taken from http://en.wikipedia.org/wiki/Standard_normal_table
	    // The table used is the cumulative, and not cumulative from 0 to mean
	    // (even though the latter has 5 digits precision, instead of 4).
	    var standard_normal_table = [
	        /*  z      0.00    0.01    0.02    0.03    0.04    0.05    0.06    0.07    0.08    0.09 */
	        /* 0.0 */
	        0.5000, 0.5040, 0.5080, 0.5120, 0.5160, 0.5199, 0.5239, 0.5279, 0.5319, 0.5359,
	        /* 0.1 */
	        0.5398, 0.5438, 0.5478, 0.5517, 0.5557, 0.5596, 0.5636, 0.5675, 0.5714, 0.5753,
	        /* 0.2 */
	        0.5793, 0.5832, 0.5871, 0.5910, 0.5948, 0.5987, 0.6026, 0.6064, 0.6103, 0.6141,
	        /* 0.3 */
	        0.6179, 0.6217, 0.6255, 0.6293, 0.6331, 0.6368, 0.6406, 0.6443, 0.6480, 0.6517,
	        /* 0.4 */
	        0.6554, 0.6591, 0.6628, 0.6664, 0.6700, 0.6736, 0.6772, 0.6808, 0.6844, 0.6879,
	        /* 0.5 */
	        0.6915, 0.6950, 0.6985, 0.7019, 0.7054, 0.7088, 0.7123, 0.7157, 0.7190, 0.7224,
	        /* 0.6 */
	        0.7257, 0.7291, 0.7324, 0.7357, 0.7389, 0.7422, 0.7454, 0.7486, 0.7517, 0.7549,
	        /* 0.7 */
	        0.7580, 0.7611, 0.7642, 0.7673, 0.7704, 0.7734, 0.7764, 0.7794, 0.7823, 0.7852,
	        /* 0.8 */
	        0.7881, 0.7910, 0.7939, 0.7967, 0.7995, 0.8023, 0.8051, 0.8078, 0.8106, 0.8133,
	        /* 0.9 */
	        0.8159, 0.8186, 0.8212, 0.8238, 0.8264, 0.8289, 0.8315, 0.8340, 0.8365, 0.8389,
	        /* 1.0 */
	        0.8413, 0.8438, 0.8461, 0.8485, 0.8508, 0.8531, 0.8554, 0.8577, 0.8599, 0.8621,
	        /* 1.1 */
	        0.8643, 0.8665, 0.8686, 0.8708, 0.8729, 0.8749, 0.8770, 0.8790, 0.8810, 0.8830,
	        /* 1.2 */
	        0.8849, 0.8869, 0.8888, 0.8907, 0.8925, 0.8944, 0.8962, 0.8980, 0.8997, 0.9015,
	        /* 1.3 */
	        0.9032, 0.9049, 0.9066, 0.9082, 0.9099, 0.9115, 0.9131, 0.9147, 0.9162, 0.9177,
	        /* 1.4 */
	        0.9192, 0.9207, 0.9222, 0.9236, 0.9251, 0.9265, 0.9279, 0.9292, 0.9306, 0.9319,
	        /* 1.5 */
	        0.9332, 0.9345, 0.9357, 0.9370, 0.9382, 0.9394, 0.9406, 0.9418, 0.9429, 0.9441,
	        /* 1.6 */
	        0.9452, 0.9463, 0.9474, 0.9484, 0.9495, 0.9505, 0.9515, 0.9525, 0.9535, 0.9545,
	        /* 1.7 */
	        0.9554, 0.9564, 0.9573, 0.9582, 0.9591, 0.9599, 0.9608, 0.9616, 0.9625, 0.9633,
	        /* 1.8 */
	        0.9641, 0.9649, 0.9656, 0.9664, 0.9671, 0.9678, 0.9686, 0.9693, 0.9699, 0.9706,
	        /* 1.9 */
	        0.9713, 0.9719, 0.9726, 0.9732, 0.9738, 0.9744, 0.9750, 0.9756, 0.9761, 0.9767,
	        /* 2.0 */
	        0.9772, 0.9778, 0.9783, 0.9788, 0.9793, 0.9798, 0.9803, 0.9808, 0.9812, 0.9817,
	        /* 2.1 */
	        0.9821, 0.9826, 0.9830, 0.9834, 0.9838, 0.9842, 0.9846, 0.9850, 0.9854, 0.9857,
	        /* 2.2 */
	        0.9861, 0.9864, 0.9868, 0.9871, 0.9875, 0.9878, 0.9881, 0.9884, 0.9887, 0.9890,
	        /* 2.3 */
	        0.9893, 0.9896, 0.9898, 0.9901, 0.9904, 0.9906, 0.9909, 0.9911, 0.9913, 0.9916,
	        /* 2.4 */
	        0.9918, 0.9920, 0.9922, 0.9925, 0.9927, 0.9929, 0.9931, 0.9932, 0.9934, 0.9936,
	        /* 2.5 */
	        0.9938, 0.9940, 0.9941, 0.9943, 0.9945, 0.9946, 0.9948, 0.9949, 0.9951, 0.9952,
	        /* 2.6 */
	        0.9953, 0.9955, 0.9956, 0.9957, 0.9959, 0.9960, 0.9961, 0.9962, 0.9963, 0.9964,
	        /* 2.7 */
	        0.9965, 0.9966, 0.9967, 0.9968, 0.9969, 0.9970, 0.9971, 0.9972, 0.9973, 0.9974,
	        /* 2.8 */
	        0.9974, 0.9975, 0.9976, 0.9977, 0.9977, 0.9978, 0.9979, 0.9979, 0.9980, 0.9981,
	        /* 2.9 */
	        0.9981, 0.9982, 0.9982, 0.9983, 0.9984, 0.9984, 0.9985, 0.9985, 0.9986, 0.9986,
	        /* 3.0 */
	        0.9987, 0.9987, 0.9987, 0.9988, 0.9988, 0.9989, 0.9989, 0.9989, 0.9990, 0.9990
	    ];

	    // # [Cumulative Standard Normal Probability](http://en.wikipedia.org/wiki/Standard_normal_table)
	    //
	    // Since probability tables cannot be
	    // printed for every normal distribution, as there are an infinite variety
	    // of normal distributions, it is common practice to convert a normal to a
	    // standard normal and then use the standard normal table to find probabilities
	    function cumulative_std_normal_probability(z) {

	        // Calculate the position of this value.
	        var absZ = Math.abs(z),
	            // Each row begins with a different
	            // significant digit: 0.5, 0.6, 0.7, and so on. So the row is simply
	            // this value's significant digit: 0.567 will be in row 0, so row=0,
	            // 0.643 will be in row 1, so row=10.
	            row = Math.floor(absZ * 10),
	            column = 10 * (Math.floor(absZ * 100) / 10 - Math.floor(absZ * 100 / 10)),
	            index = Math.min((row * 10) + column, standard_normal_table.length - 1);

	        // The index we calculate must be in the table as a positive value,
	        // but we still pay attention to whether the input is positive
	        // or negative, and flip the output value as a last step.
	        if (z >= 0) {
	            return standard_normal_table[index];
	        } else {
	            // due to floating-point arithmetic, values in the table with
	            // 4 significant figures can nevertheless end up as repeating
	            // fractions when they're computed here.
	            return +(1 - standard_normal_table[index]).toFixed(4);
	        }
	    }

	    // # [Z-Score, or Standard Score](http://en.wikipedia.org/wiki/Standard_score)
	    //
	    // The standard score is the number of standard deviations an observation
	    // or datum is above or below the mean. Thus, a positive standard score
	    // represents a datum above the mean, while a negative standard score
	    // represents a datum below the mean. It is a dimensionless quantity
	    // obtained by subtracting the population mean from an individual raw
	    // score and then dividing the difference by the population standard
	    // deviation.
	    //
	    // The z-score is only defined if one knows the population parameters;
	    // if one only has a sample set, then the analogous computation with
	    // sample mean and sample standard deviation yields the
	    // Student's t-statistic.
	    function z_score(x, mean, standard_deviation) {
	        return (x - mean) / standard_deviation;
	    }

	    // We use `ε`, epsilon, as a stopping criterion when we want to iterate
	    // until we're "close enough".
	    var epsilon = 0.0001;

	    // # [Factorial](https://en.wikipedia.org/wiki/Factorial)
	    //
	    // A factorial, usually written n!, is the product of all positive
	    // integers less than or equal to n. Often factorial is implemented
	    // recursively, but this iterative approach is significantly faster
	    // and simpler.
	    function factorial(n) {

	        // factorial is mathematically undefined for negative numbers
	        if (n < 0 ) { return null; }

	        // typically you'll expand the factorial function going down, like
	        // 5! = 5 * 4 * 3 * 2 * 1. This is going in the opposite direction,
	        // counting from 2 up to the number in question, and since anything
	        // multiplied by 1 is itself, the loop only needs to start at 2.
	        var accumulator = 1;
	        for (var i = 2; i <= n; i++) {
	            // for each number up to and including the number `n`, multiply
	            // the accumulator my that number.
	            accumulator *= i;
	        }
	        return accumulator;
	    }

	    // # Bernoulli Distribution
	    //
	    // The [Bernoulli distribution](http://en.wikipedia.org/wiki/Bernoulli_distribution)
	    // is the probability discrete
	    // distribution of a random variable which takes value 1 with success
	    // probability `p` and value 0 with failure
	    // probability `q` = 1 - `p`. It can be used, for example, to represent the
	    // toss of a coin, where "1" is defined to mean "heads" and "0" is defined
	    // to mean "tails" (or vice versa). It is
	    // a special case of a Binomial Distribution
	    // where `n` = 1.
	    function bernoulli_distribution(p) {
	        // Check that `p` is a valid probability (0 ≤ p ≤ 1)
	        if (p < 0 || p > 1 ) { return null; }

	        return binomial_distribution(1, p);
	    }

	    // # Binomial Distribution
	    //
	    // The [Binomial Distribution](http://en.wikipedia.org/wiki/Binomial_distribution) is the discrete probability
	    // distribution of the number of successes in a sequence of n independent yes/no experiments, each of which yields
	    // success with probability `probability`. Such a success/failure experiment is also called a Bernoulli experiment or
	    // Bernoulli trial; when trials = 1, the Binomial Distribution is a Bernoulli Distribution.
	    function binomial_distribution(trials, probability) {
	        // Check that `p` is a valid probability (0 ≤ p ≤ 1),
	        // that `n` is an integer, strictly positive.
	        if (probability < 0 || probability > 1 ||
	            trials <= 0 || trials % 1 !== 0) {
	            return null;
	        }

	        // a [probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function)
	        function probability_mass(x, trials, probability) {
	            return factorial(trials) /
	                (factorial(x) * factorial(trials - x)) *
	                (Math.pow(probability, x) * Math.pow(1 - probability, trials - x));
	        }

	        // We initialize `x`, the random variable, and `accumulator`, an accumulator
	        // for the cumulative distribution function to 0. `distribution_functions`
	        // is the object we'll return with the `probability_of_x` and the
	        // `cumulative_probability_of_x`, as well as the calculated mean &
	        // variance. We iterate until the `cumulative_probability_of_x` is
	        // within `epsilon` of 1.0.
	        var x = 0,
	            cumulative_probability = 0,
	            cells = {};

	        // This algorithm iterates through each potential outcome,
	        // until the `cumulative_probability` is very close to 1, at
	        // which point we've defined the vast majority of outcomes
	        do {
	            cells[x] = probability_mass(x, trials, probability);
	            cumulative_probability += cells[x];
	            x++;
	        // when the cumulative_probability is nearly 1, we've calculated
	        // the useful range of this distribution
	        } while (cumulative_probability < 1 - epsilon);

	        return cells;
	    }

	    // # Poisson Distribution
	    //
	    // The [Poisson Distribution](http://en.wikipedia.org/wiki/Poisson_distribution)
	    // is a discrete probability distribution that expresses the probability
	    // of a given number of events occurring in a fixed interval of time
	    // and/or space if these events occur with a known average rate and
	    // independently of the time since the last event.
	    //
	    // The Poisson Distribution is characterized by the strictly positive
	    // mean arrival or occurrence rate, `λ`.
	    function poisson_distribution(lambda) {
	        // Check that lambda is strictly positive
	        if (lambda <= 0) { return null; }

	        // our current place in the distribution
	        var x = 0,
	            // and we keep track of the current cumulative probability, in
	            // order to know when to stop calculating chances.
	            cumulative_probability = 0,
	            // the calculated cells to be returned
	            cells = {};

	        // a [probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function)
	        function probability_mass(x, lambda) {
	            return (Math.pow(Math.E, -lambda) * Math.pow(lambda, x)) /
	                factorial(x);
	        }

	        // This algorithm iterates through each potential outcome,
	        // until the `cumulative_probability` is very close to 1, at
	        // which point we've defined the vast majority of outcomes
	        do {
	            cells[x] = probability_mass(x, lambda);
	            cumulative_probability += cells[x];
	            x++;
	        // when the cumulative_probability is nearly 1, we've calculated
	        // the useful range of this distribution
	        } while (cumulative_probability < 1 - epsilon);

	        return cells;
	    }

	    // # Percentage Points of the χ2 (Chi-Squared) Distribution
	    // The [χ2 (Chi-Squared) Distribution](http://en.wikipedia.org/wiki/Chi-squared_distribution) is used in the common
	    // chi-squared tests for goodness of fit of an observed distribution to a theoretical one, the independence of two
	    // criteria of classification of qualitative data, and in confidence interval estimation for a population standard
	    // deviation of a normal distribution from a sample standard deviation.
	    //
	    // Values from Appendix 1, Table III of William W. Hines & Douglas C. Montgomery, "Probability and Statistics in
	    // Engineering and Management Science", Wiley (1980).
	    var chi_squared_distribution_table = {
	        1: { 0.995:  0.00, 0.99:  0.00, 0.975:  0.00, 0.95:  0.00, 0.9:  0.02, 0.5:  0.45, 0.1:  2.71, 0.05:  3.84, 0.025:  5.02, 0.01:  6.63, 0.005:  7.88 },
	        2: { 0.995:  0.01, 0.99:  0.02, 0.975:  0.05, 0.95:  0.10, 0.9:  0.21, 0.5:  1.39, 0.1:  4.61, 0.05:  5.99, 0.025:  7.38, 0.01:  9.21, 0.005: 10.60 },
	        3: { 0.995:  0.07, 0.99:  0.11, 0.975:  0.22, 0.95:  0.35, 0.9:  0.58, 0.5:  2.37, 0.1:  6.25, 0.05:  7.81, 0.025:  9.35, 0.01: 11.34, 0.005: 12.84 },
	        4: { 0.995:  0.21, 0.99:  0.30, 0.975:  0.48, 0.95:  0.71, 0.9:  1.06, 0.5:  3.36, 0.1:  7.78, 0.05:  9.49, 0.025: 11.14, 0.01: 13.28, 0.005: 14.86 },
	        5: { 0.995:  0.41, 0.99:  0.55, 0.975:  0.83, 0.95:  1.15, 0.9:  1.61, 0.5:  4.35, 0.1:  9.24, 0.05: 11.07, 0.025: 12.83, 0.01: 15.09, 0.005: 16.75 },
	        6: { 0.995:  0.68, 0.99:  0.87, 0.975:  1.24, 0.95:  1.64, 0.9:  2.20, 0.5:  5.35, 0.1: 10.65, 0.05: 12.59, 0.025: 14.45, 0.01: 16.81, 0.005: 18.55 },
	        7: { 0.995:  0.99, 0.99:  1.25, 0.975:  1.69, 0.95:  2.17, 0.9:  2.83, 0.5:  6.35, 0.1: 12.02, 0.05: 14.07, 0.025: 16.01, 0.01: 18.48, 0.005: 20.28 },
	        8: { 0.995:  1.34, 0.99:  1.65, 0.975:  2.18, 0.95:  2.73, 0.9:  3.49, 0.5:  7.34, 0.1: 13.36, 0.05: 15.51, 0.025: 17.53, 0.01: 20.09, 0.005: 21.96 },
	        9: { 0.995:  1.73, 0.99:  2.09, 0.975:  2.70, 0.95:  3.33, 0.9:  4.17, 0.5:  8.34, 0.1: 14.68, 0.05: 16.92, 0.025: 19.02, 0.01: 21.67, 0.005: 23.59 },
	        10: { 0.995:  2.16, 0.99:  2.56, 0.975:  3.25, 0.95:  3.94, 0.9:  4.87, 0.5:  9.34, 0.1: 15.99, 0.05: 18.31, 0.025: 20.48, 0.01: 23.21, 0.005: 25.19 },
	        11: { 0.995:  2.60, 0.99:  3.05, 0.975:  3.82, 0.95:  4.57, 0.9:  5.58, 0.5: 10.34, 0.1: 17.28, 0.05: 19.68, 0.025: 21.92, 0.01: 24.72, 0.005: 26.76 },
	        12: { 0.995:  3.07, 0.99:  3.57, 0.975:  4.40, 0.95:  5.23, 0.9:  6.30, 0.5: 11.34, 0.1: 18.55, 0.05: 21.03, 0.025: 23.34, 0.01: 26.22, 0.005: 28.30 },
	        13: { 0.995:  3.57, 0.99:  4.11, 0.975:  5.01, 0.95:  5.89, 0.9:  7.04, 0.5: 12.34, 0.1: 19.81, 0.05: 22.36, 0.025: 24.74, 0.01: 27.69, 0.005: 29.82 },
	        14: { 0.995:  4.07, 0.99:  4.66, 0.975:  5.63, 0.95:  6.57, 0.9:  7.79, 0.5: 13.34, 0.1: 21.06, 0.05: 23.68, 0.025: 26.12, 0.01: 29.14, 0.005: 31.32 },
	        15: { 0.995:  4.60, 0.99:  5.23, 0.975:  6.27, 0.95:  7.26, 0.9:  8.55, 0.5: 14.34, 0.1: 22.31, 0.05: 25.00, 0.025: 27.49, 0.01: 30.58, 0.005: 32.80 },
	        16: { 0.995:  5.14, 0.99:  5.81, 0.975:  6.91, 0.95:  7.96, 0.9:  9.31, 0.5: 15.34, 0.1: 23.54, 0.05: 26.30, 0.025: 28.85, 0.01: 32.00, 0.005: 34.27 },
	        17: { 0.995:  5.70, 0.99:  6.41, 0.975:  7.56, 0.95:  8.67, 0.9: 10.09, 0.5: 16.34, 0.1: 24.77, 0.05: 27.59, 0.025: 30.19, 0.01: 33.41, 0.005: 35.72 },
	        18: { 0.995:  6.26, 0.99:  7.01, 0.975:  8.23, 0.95:  9.39, 0.9: 10.87, 0.5: 17.34, 0.1: 25.99, 0.05: 28.87, 0.025: 31.53, 0.01: 34.81, 0.005: 37.16 },
	        19: { 0.995:  6.84, 0.99:  7.63, 0.975:  8.91, 0.95: 10.12, 0.9: 11.65, 0.5: 18.34, 0.1: 27.20, 0.05: 30.14, 0.025: 32.85, 0.01: 36.19, 0.005: 38.58 },
	        20: { 0.995:  7.43, 0.99:  8.26, 0.975:  9.59, 0.95: 10.85, 0.9: 12.44, 0.5: 19.34, 0.1: 28.41, 0.05: 31.41, 0.025: 34.17, 0.01: 37.57, 0.005: 40.00 },
	        21: { 0.995:  8.03, 0.99:  8.90, 0.975: 10.28, 0.95: 11.59, 0.9: 13.24, 0.5: 20.34, 0.1: 29.62, 0.05: 32.67, 0.025: 35.48, 0.01: 38.93, 0.005: 41.40 },
	        22: { 0.995:  8.64, 0.99:  9.54, 0.975: 10.98, 0.95: 12.34, 0.9: 14.04, 0.5: 21.34, 0.1: 30.81, 0.05: 33.92, 0.025: 36.78, 0.01: 40.29, 0.005: 42.80 },
	        23: { 0.995:  9.26, 0.99: 10.20, 0.975: 11.69, 0.95: 13.09, 0.9: 14.85, 0.5: 22.34, 0.1: 32.01, 0.05: 35.17, 0.025: 38.08, 0.01: 41.64, 0.005: 44.18 },
	        24: { 0.995:  9.89, 0.99: 10.86, 0.975: 12.40, 0.95: 13.85, 0.9: 15.66, 0.5: 23.34, 0.1: 33.20, 0.05: 36.42, 0.025: 39.36, 0.01: 42.98, 0.005: 45.56 },
	        25: { 0.995: 10.52, 0.99: 11.52, 0.975: 13.12, 0.95: 14.61, 0.9: 16.47, 0.5: 24.34, 0.1: 34.28, 0.05: 37.65, 0.025: 40.65, 0.01: 44.31, 0.005: 46.93 },
	        26: { 0.995: 11.16, 0.99: 12.20, 0.975: 13.84, 0.95: 15.38, 0.9: 17.29, 0.5: 25.34, 0.1: 35.56, 0.05: 38.89, 0.025: 41.92, 0.01: 45.64, 0.005: 48.29 },
	        27: { 0.995: 11.81, 0.99: 12.88, 0.975: 14.57, 0.95: 16.15, 0.9: 18.11, 0.5: 26.34, 0.1: 36.74, 0.05: 40.11, 0.025: 43.19, 0.01: 46.96, 0.005: 49.65 },
	        28: { 0.995: 12.46, 0.99: 13.57, 0.975: 15.31, 0.95: 16.93, 0.9: 18.94, 0.5: 27.34, 0.1: 37.92, 0.05: 41.34, 0.025: 44.46, 0.01: 48.28, 0.005: 50.99 },
	        29: { 0.995: 13.12, 0.99: 14.26, 0.975: 16.05, 0.95: 17.71, 0.9: 19.77, 0.5: 28.34, 0.1: 39.09, 0.05: 42.56, 0.025: 45.72, 0.01: 49.59, 0.005: 52.34 },
	        30: { 0.995: 13.79, 0.99: 14.95, 0.975: 16.79, 0.95: 18.49, 0.9: 20.60, 0.5: 29.34, 0.1: 40.26, 0.05: 43.77, 0.025: 46.98, 0.01: 50.89, 0.005: 53.67 },
	        40: { 0.995: 20.71, 0.99: 22.16, 0.975: 24.43, 0.95: 26.51, 0.9: 29.05, 0.5: 39.34, 0.1: 51.81, 0.05: 55.76, 0.025: 59.34, 0.01: 63.69, 0.005: 66.77 },
	        50: { 0.995: 27.99, 0.99: 29.71, 0.975: 32.36, 0.95: 34.76, 0.9: 37.69, 0.5: 49.33, 0.1: 63.17, 0.05: 67.50, 0.025: 71.42, 0.01: 76.15, 0.005: 79.49 },
	        60: { 0.995: 35.53, 0.99: 37.48, 0.975: 40.48, 0.95: 43.19, 0.9: 46.46, 0.5: 59.33, 0.1: 74.40, 0.05: 79.08, 0.025: 83.30, 0.01: 88.38, 0.005: 91.95 },
	        70: { 0.995: 43.28, 0.99: 45.44, 0.975: 48.76, 0.95: 51.74, 0.9: 55.33, 0.5: 69.33, 0.1: 85.53, 0.05: 90.53, 0.025: 95.02, 0.01: 100.42, 0.005: 104.22 },
	        80: { 0.995: 51.17, 0.99: 53.54, 0.975: 57.15, 0.95: 60.39, 0.9: 64.28, 0.5: 79.33, 0.1: 96.58, 0.05: 101.88, 0.025: 106.63, 0.01: 112.33, 0.005: 116.32 },
	        90: { 0.995: 59.20, 0.99: 61.75, 0.975: 65.65, 0.95: 69.13, 0.9: 73.29, 0.5: 89.33, 0.1: 107.57, 0.05: 113.14, 0.025: 118.14, 0.01: 124.12, 0.005: 128.30 },
	        100: { 0.995: 67.33, 0.99: 70.06, 0.975: 74.22, 0.95: 77.93, 0.9: 82.36, 0.5: 99.33, 0.1: 118.50, 0.05: 124.34, 0.025: 129.56, 0.01: 135.81, 0.005: 140.17 }
	    };

	    // # χ2 (Chi-Squared) Goodness-of-Fit Test
	    //
	    // The [χ2 (Chi-Squared) Goodness-of-Fit Test](http://en.wikipedia.org/wiki/Goodness_of_fit#Pearson.27s_chi-squared_test)
	    // uses a measure of goodness of fit which is the sum of differences between observed and expected outcome frequencies
	    // (that is, counts of observations), each squared and divided by the number of observations expected given the
	    // hypothesized distribution. The resulting χ2 statistic, `chi_squared`, can be compared to the chi-squared distribution
	    // to determine the goodness of fit. In order to determine the degrees of freedom of the chi-squared distribution, one
	    // takes the total number of observed frequencies and subtracts the number of estimated parameters. The test statistic
	    // follows, approximately, a chi-square distribution with (k − c) degrees of freedom where `k` is the number of non-empty
	    // cells and `c` is the number of estimated parameters for the distribution.
	    function chi_squared_goodness_of_fit(data, distribution_type, significance) {
	        // Estimate from the sample data, a weighted mean.
	        var input_mean = mean(data),
	            // Calculated value of the χ2 statistic.
	            chi_squared = 0,
	            // Degrees of freedom, calculated as (number of class intervals -
	            // number of hypothesized distribution parameters estimated - 1)
	            degrees_of_freedom,
	            // Number of hypothesized distribution parameters estimated, expected to be supplied in the distribution test.
	            // Lose one degree of freedom for estimating `lambda` from the sample data.
	            c = 1,
	            // The hypothesized distribution.
	            // Generate the hypothesized distribution.
	            hypothesized_distribution = distribution_type(input_mean),
	            observed_frequencies = [],
	            expected_frequencies = [],
	            k;

	        // Create an array holding a histogram from the sample data, of
	        // the form `{ value: numberOfOcurrences }`
	        for (var i = 0; i < data.length; i++) {
	            if (observed_frequencies[data[i]] === undefined) {
	                observed_frequencies[data[i]] = 0;
	            }
	            observed_frequencies[data[i]]++;
	        }

	        // The histogram we created might be sparse - there might be gaps
	        // between values. So we iterate through the histogram, making
	        // sure that instead of undefined, gaps have 0 values.
	        for (i = 0; i < observed_frequencies.length; i++) {
	            if (observed_frequencies[i] === undefined) {
	                observed_frequencies[i] = 0;
	            }
	        }

	        // Create an array holding a histogram of expected data given the
	        // sample size and hypothesized distribution.
	        for (k in hypothesized_distribution) {
	            if (k in observed_frequencies) {
	                expected_frequencies[k] = hypothesized_distribution[k] * data.length;
	            }
	        }

	        // Working backward through the expected frequencies, collapse classes
	        // if less than three observations are expected for a class.
	        // This transformation is applied to the observed frequencies as well.
	        for (k = expected_frequencies.length - 1; k >= 0; k--) {
	            if (expected_frequencies[k] < 3) {
	                expected_frequencies[k - 1] += expected_frequencies[k];
	                expected_frequencies.pop();

	                observed_frequencies[k - 1] += observed_frequencies[k];
	                observed_frequencies.pop();
	            }
	        }

	        // Iterate through the squared differences between observed & expected
	        // frequencies, accumulating the `chi_squared` statistic.
	        for (k = 0; k < observed_frequencies.length; k++) {
	            chi_squared += Math.pow(
	                observed_frequencies[k] - expected_frequencies[k], 2) /
	                expected_frequencies[k];
	        }

	        // Calculate degrees of freedom for this test and look it up in the
	        // `chi_squared_distribution_table` in order to
	        // accept or reject the goodness-of-fit of the hypothesized distribution.
	        degrees_of_freedom = observed_frequencies.length - c - 1;
	        return chi_squared_distribution_table[degrees_of_freedom][significance] < chi_squared;
	    }

	    // # Mixin
	    //
	    // Mixin simple_statistics to a single Array instance if provided
	    // or the Array native object if not. This is an optional
	    // feature that lets you treat simple_statistics as a native feature
	    // of Javascript.
	    function mixin(array) {
	        var support = !!(Object.defineProperty && Object.defineProperties);
	        if (!support) throw new Error('without defineProperty, simple-statistics cannot be mixed in');

	        // only methods which work on basic arrays in a single step
	        // are supported
	        var arrayMethods = ['median', 'standard_deviation', 'sum',
	            'sample_skewness',
	            'mean', 'min', 'max', 'quantile', 'geometric_mean',
	            'harmonic_mean'];

	        // create a closure with a method name so that a reference
	        // like `arrayMethods[i]` doesn't follow the loop increment
	        function wrap(method) {
	            return function() {
	                // cast any arguments into an array, since they're
	                // natively objects
	                var args = Array.prototype.slice.apply(arguments);
	                // make the first argument the array itself
	                args.unshift(this);
	                // return the result of the ss method
	                return ss[method].apply(ss, args);
	            };
	        }

	        // select object to extend
	        var extending;
	        if (array) {
	            // create a shallow copy of the array so that our internal
	            // operations do not change it by reference
	            extending = array.slice();
	        } else {
	            extending = Array.prototype;
	        }

	        // for each array function, define a function that gets
	        // the array as the first argument.
	        // We use [defineProperty](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty)
	        // because it allows these properties to be non-enumerable:
	        // `for (var in x)` loops will not run into problems with this
	        // implementation.
	        for (var i = 0; i < arrayMethods.length; i++) {
	            Object.defineProperty(extending, arrayMethods[i], {
	                value: wrap(arrayMethods[i]),
	                configurable: true,
	                enumerable: false,
	                writable: true
	            });
	        }

	        return extending;
	    }

	    ss.linear_regression = linear_regression;
	    ss.standard_deviation = standard_deviation;
	    ss.r_squared = r_squared;
	    ss.median = median;
	    ss.mean = mean;
	    ss.mode = mode;
	    ss.min = min;
	    ss.max = max;
	    ss.sum = sum;
	    ss.quantile = quantile;
	    ss.quantile_sorted = quantile_sorted;
	    ss.iqr = iqr;
	    ss.mad = mad;

	    ss.sample_covariance = sample_covariance;
	    ss.sample_correlation = sample_correlation;
	    ss.sample_variance = sample_variance;
	    ss.sample_standard_deviation = sample_standard_deviation;
	    ss.sample_skewness = sample_skewness;

	    ss.geometric_mean = geometric_mean;
	    ss.harmonic_mean = harmonic_mean;
	    ss.variance = variance;
	    ss.t_test = t_test;
	    ss.t_test_two_sample = t_test_two_sample;

	    // jenks
	    ss.jenksMatrices = jenksMatrices;
	    ss.jenksBreaks = jenksBreaks;
	    ss.jenks = jenks;

	    ss.bayesian = bayesian;

	    // Distribution-related methods
	    ss.epsilon = epsilon; // We make ε available to the test suite.
	    ss.factorial = factorial;
	    ss.bernoulli_distribution = bernoulli_distribution;
	    ss.binomial_distribution = binomial_distribution;
	    ss.poisson_distribution = poisson_distribution;
	    ss.chi_squared_goodness_of_fit = chi_squared_goodness_of_fit;

	    // Normal distribution
	    ss.z_score = z_score;
	    ss.cumulative_std_normal_probability = cumulative_std_normal_probability;
	    ss.standard_normal_table = standard_normal_table;

	    // Alias this into its common name
	    ss.average = mean;
	    ss.interquartile_range = iqr;
	    ss.mixin = mixin;
	    ss.median_absolute_deviation = mad;

	})(this);


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {// Generated by CoffeeScript 1.6.2
	/**
	 * @license
	 *
	 * chroma.js - JavaScript library for color conversions
	 * 
	 * Copyright (c) 2011-2013, Gregor Aisch
	 * All rights reserved.
	 * 
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 * 
	 * 1. Redistributions of source code must retain the above copyright notice, this
	 * list of conditions and the following disclaimer.
	 * 
	 * 2. Redistributions in binary form must reproduce the above copyright notice,
	 * this list of conditions and the following disclaimer in the documentation
	 * and/or other materials provided with the distribution.
	 * 
	 * 3. The name Gregor Aisch may not be used to endorse or promote products
	 * derived from this software without specific prior written permission.
	 * 
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	 * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
	 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
	 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/


	(function() {
	  var Color, K, PITHIRD, TWOPI, X, Y, Z, bezier, brewer, chroma, clip_rgb, colors, cos, css2rgb, hex2rgb, hsi2rgb, hsl2rgb, hsv2rgb, lab2lch, lab2rgb, lab_xyz, lch2lab, lch2rgb, limit, luminance, luminance_x, rgb2hex, rgb2hsi, rgb2hsl, rgb2hsv, rgb2lab, rgb2lch, rgb_xyz, root, type, unpack, xyz_lab, xyz_rgb, _ref;

	  chroma = function(x, y, z, m) {
	    return new Color(x, y, z, m);
	  };

	  if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
	    module.exports = chroma;
	  }

	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return chroma;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else {
	    root = typeof exports !== "undefined" && exports !== null ? exports : this;
	    root.chroma = chroma;
	  }

	  chroma.color = function(x, y, z, m) {
	    return new Color(x, y, z, m);
	  };

	  chroma.hsl = function(h, s, l, a) {
	    return new Color(h, s, l, a, 'hsl');
	  };

	  chroma.hsv = function(h, s, v, a) {
	    return new Color(h, s, v, a, 'hsv');
	  };

	  chroma.rgb = function(r, g, b, a) {
	    return new Color(r, g, b, a, 'rgb');
	  };

	  chroma.hex = function(x) {
	    return new Color(x);
	  };

	  chroma.css = function(x) {
	    return new Color(x);
	  };

	  chroma.lab = function(l, a, b) {
	    return new Color(l, a, b, 'lab');
	  };

	  chroma.lch = function(l, c, h) {
	    return new Color(l, c, h, 'lch');
	  };

	  chroma.hsi = function(h, s, i) {
	    return new Color(h, s, i, 'hsi');
	  };

	  chroma.gl = function(r, g, b, a) {
	    return new Color(r * 255, g * 255, b * 255, a, 'gl');
	  };

	  chroma.interpolate = function(a, b, f, m) {
	    if ((a == null) || (b == null)) {
	      return '#000';
	    }
	    if (type(a) === 'string') {
	      a = new Color(a);
	    }
	    if (type(b) === 'string') {
	      b = new Color(b);
	    }
	    return a.interpolate(f, b, m);
	  };

	  chroma.mix = chroma.interpolate;

	  chroma.contrast = function(a, b) {
	    var l1, l2;

	    if (type(a) === 'string') {
	      a = new Color(a);
	    }
	    if (type(b) === 'string') {
	      b = new Color(b);
	    }
	    l1 = a.luminance();
	    l2 = b.luminance();
	    if (l1 > l2) {
	      return (l1 + 0.05) / (l2 + 0.05);
	    } else {
	      return (l2 + 0.05) / (l1 + 0.05);
	    }
	  };

	  chroma.luminance = function(color) {
	    return chroma(color).luminance();
	  };

	  chroma._Color = Color;

	  /**
	      chroma.js
	  
	      Copyright (c) 2011-2013, Gregor Aisch
	      All rights reserved.
	  
	      Redistribution and use in source and binary forms, with or without
	      modification, are permitted provided that the following conditions are met:
	  
	      * Redistributions of source code must retain the above copyright notice, this
	        list of conditions and the following disclaimer.
	  
	      * Redistributions in binary form must reproduce the above copyright notice,
	        this list of conditions and the following disclaimer in the documentation
	        and/or other materials provided with the distribution.
	  
	      * The name Gregor Aisch may not be used to endorse or promote products
	        derived from this software without specific prior written permission.
	  
	      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
	      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
	      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	  
	      @source: https://github.com/gka/chroma.js
	  */


	  Color = (function() {
	    function Color() {
	      var a, arg, args, m, me, me_rgb, x, y, z, _i, _len, _ref, _ref1, _ref2, _ref3;

	      me = this;
	      args = [];
	      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
	        arg = arguments[_i];
	        if (arg != null) {
	          args.push(arg);
	        }
	      }
	      if (args.length === 0) {
	        _ref = [255, 0, 255, 1, 'rgb'], x = _ref[0], y = _ref[1], z = _ref[2], a = _ref[3], m = _ref[4];
	      } else if (type(args[0]) === "array") {
	        if (args[0].length === 3) {
	          _ref1 = args[0], x = _ref1[0], y = _ref1[1], z = _ref1[2];
	          a = 1;
	        } else if (args[0].length === 4) {
	          _ref2 = args[0], x = _ref2[0], y = _ref2[1], z = _ref2[2], a = _ref2[3];
	        } else {
	          throw 'unknown input argument';
	        }
	        m = args[1];
	      } else if (type(args[0]) === "string") {
	        x = args[0];
	        m = 'hex';
	      } else if (type(args[0]) === "object") {
	        _ref3 = args[0]._rgb, x = _ref3[0], y = _ref3[1], z = _ref3[2], a = _ref3[3];
	        m = 'rgb';
	      } else if (args.length >= 3) {
	        x = args[0];
	        y = args[1];
	        z = args[2];
	      }
	      if (args.length === 3) {
	        m = 'rgb';
	        a = 1;
	      } else if (args.length === 4) {
	        if (type(args[3]) === "string") {
	          m = args[3];
	          a = 1;
	        } else if (type(args[3]) === "number") {
	          m = 'rgb';
	          a = args[3];
	        }
	      } else if (args.length === 5) {
	        a = args[3];
	        m = args[4];
	      }
	      if (a == null) {
	        a = 1;
	      }
	      if (m === 'rgb') {
	        me._rgb = [x, y, z, a];
	      } else if (m === 'gl') {
	        me._rgb = [x * 255, y * 255, z * 255, a];
	      } else if (m === 'hsl') {
	        me._rgb = hsl2rgb(x, y, z);
	        me._rgb[3] = a;
	      } else if (m === 'hsv') {
	        me._rgb = hsv2rgb(x, y, z);
	        me._rgb[3] = a;
	      } else if (m === 'hex') {
	        me._rgb = hex2rgb(x);
	      } else if (m === 'lab') {
	        me._rgb = lab2rgb(x, y, z);
	        me._rgb[3] = a;
	      } else if (m === 'lch') {
	        me._rgb = lch2rgb(x, y, z);
	        me._rgb[3] = a;
	      } else if (m === 'hsi') {
	        me._rgb = hsi2rgb(x, y, z);
	        me._rgb[3] = a;
	      }
	      me_rgb = clip_rgb(me._rgb);
	    }

	    Color.prototype.rgb = function() {
	      return this._rgb.slice(0, 3);
	    };

	    Color.prototype.rgba = function() {
	      return this._rgb;
	    };

	    Color.prototype.hex = function() {
	      return rgb2hex(this._rgb);
	    };

	    Color.prototype.toString = function() {
	      return this.name();
	    };

	    Color.prototype.hsl = function() {
	      return rgb2hsl(this._rgb);
	    };

	    Color.prototype.hsv = function() {
	      return rgb2hsv(this._rgb);
	    };

	    Color.prototype.lab = function() {
	      return rgb2lab(this._rgb);
	    };

	    Color.prototype.lch = function() {
	      return rgb2lch(this._rgb);
	    };

	    Color.prototype.hsi = function() {
	      return rgb2hsi(this._rgb);
	    };

	    Color.prototype.gl = function() {
	      return [this._rgb[0] / 255, this._rgb[1] / 255, this._rgb[2] / 255, this._rgb[3]];
	    };

	    Color.prototype.luminance = function() {
	      return luminance(this._rgb);
	    };

	    Color.prototype.name = function() {
	      var h, k;

	      h = this.hex();
	      for (k in chroma.colors) {
	        if (h === chroma.colors[k]) {
	          return k;
	        }
	      }
	      return h;
	    };

	    Color.prototype.alpha = function(alpha) {
	      if (arguments.length) {
	        this._rgb[3] = alpha;
	        return this;
	      }
	      return this._rgb[3];
	    };

	    Color.prototype.css = function(mode) {
	      var hsl, me, rgb, rnd;

	      if (mode == null) {
	        mode = 'rgb';
	      }
	      me = this;
	      rgb = me._rgb;
	      if (mode.length === 3 && rgb[3] < 1) {
	        mode += 'a';
	      }
	      if (mode === 'rgb') {
	        return mode + '(' + rgb.slice(0, 3).join(',') + ')';
	      } else if (mode === 'rgba') {
	        return mode + '(' + rgb.join(',') + ')';
	      } else if (mode === 'hsl' || mode === 'hsla') {
	        hsl = me.hsl();
	        rnd = function(a) {
	          return Math.round(a * 100) / 100;
	        };
	        hsl[0] = rnd(hsl[0]);
	        hsl[1] = rnd(hsl[1] * 100) + '%';
	        hsl[2] = rnd(hsl[2] * 100) + '%';
	        if (mode.length === 4) {
	          hsl[3] = rgb[3];
	        }
	        return mode + '(' + hsl.join(',') + ')';
	      }
	    };

	    Color.prototype.interpolate = function(f, col, m) {
	      /*
	      interpolates between colors
	      f = 0 --> me
	      f = 1 --> col
	      */

	      var dh, hue, hue0, hue1, lbv, lbv0, lbv1, me, res, sat, sat0, sat1, xyz0, xyz1;

	      me = this;
	      if (m == null) {
	        m = 'rgb';
	      }
	      if (type(col) === "string") {
	        col = new Color(col);
	      }
	      if (m === 'hsl' || m === 'hsv' || m === 'lch' || m === 'hsi') {
	        if (m === 'hsl') {
	          xyz0 = me.hsl();
	          xyz1 = col.hsl();
	        } else if (m === 'hsv') {
	          xyz0 = me.hsv();
	          xyz1 = col.hsv();
	        } else if (m === 'hsi') {
	          xyz0 = me.hsi();
	          xyz1 = col.hsi();
	        } else if (m === 'lch') {
	          xyz0 = me.lch();
	          xyz1 = col.lch();
	        }
	        if (m.substr(0, 1) === 'h') {
	          hue0 = xyz0[0], sat0 = xyz0[1], lbv0 = xyz0[2];
	          hue1 = xyz1[0], sat1 = xyz1[1], lbv1 = xyz1[2];
	        } else {
	          lbv0 = xyz0[0], sat0 = xyz0[1], hue0 = xyz0[2];
	          lbv1 = xyz1[0], sat1 = xyz1[1], hue1 = xyz1[2];
	        }
	        if (!isNaN(hue0) && !isNaN(hue1)) {
	          if (hue1 > hue0 && hue1 - hue0 > 180) {
	            dh = hue1 - (hue0 + 360);
	          } else if (hue1 < hue0 && hue0 - hue1 > 180) {
	            dh = hue1 + 360 - hue0;
	          } else {
	            dh = hue1 - hue0;
	          }
	          hue = hue0 + f * dh;
	        } else if (!isNaN(hue0)) {
	          hue = hue0;
	          if (lbv1 === 1 || lbv1 === 0) {
	            sat = sat0;
	          }
	        } else if (!isNaN(hue1)) {
	          hue = hue1;
	          if (lbv0 === 1 || lbv0 === 0) {
	            sat = sat1;
	          }
	        } else {
	          hue = Number.NaN;
	        }
	        if (sat == null) {
	          sat = sat0 + f * (sat1 - sat0);
	        }
	        lbv = lbv0 + f * (lbv1 - lbv0);
	        if (m.substr(0, 1) === 'h') {
	          res = new Color(hue, sat, lbv, m);
	        } else {
	          res = new Color(lbv, sat, hue, m);
	        }
	      } else if (m === 'rgb') {
	        xyz0 = me._rgb;
	        xyz1 = col._rgb;
	        res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
	      } else if (m === 'lab') {
	        xyz0 = me.lab();
	        xyz1 = col.lab();
	        res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
	      } else {
	        throw "color mode " + m + " is not supported";
	      }
	      res.alpha(me.alpha() + f * (col.alpha() - me.alpha()));
	      return res;
	    };

	    Color.prototype.premultiply = function() {
	      var a, rgb;

	      rgb = this.rgb();
	      a = this.alpha();
	      return chroma(rgb[0] * a, rgb[1] * a, rgb[2] * a, a);
	    };

	    Color.prototype.darken = function(amount) {
	      var lch, me;

	      if (amount == null) {
	        amount = 20;
	      }
	      me = this;
	      lch = me.lch();
	      lch[0] -= amount;
	      return chroma.lch(lch).alpha(me.alpha());
	    };

	    Color.prototype.darker = function(amount) {
	      return this.darken(amount);
	    };

	    Color.prototype.brighten = function(amount) {
	      if (amount == null) {
	        amount = 20;
	      }
	      return this.darken(-amount);
	    };

	    Color.prototype.brighter = function(amount) {
	      return this.brighten(amount);
	    };

	    Color.prototype.saturate = function(amount) {
	      var lch, me;

	      if (amount == null) {
	        amount = 20;
	      }
	      me = this;
	      lch = me.lch();
	      lch[1] += amount;
	      return chroma.lch(lch).alpha(me.alpha());
	    };

	    Color.prototype.desaturate = function(amount) {
	      if (amount == null) {
	        amount = 20;
	      }
	      return this.saturate(-amount);
	    };

	    return Color;

	  })();

	  clip_rgb = function(rgb) {
	    var i;

	    for (i in rgb) {
	      if (i < 3) {
	        if (rgb[i] < 0) {
	          rgb[i] = 0;
	        }
	        if (rgb[i] > 255) {
	          rgb[i] = 255;
	        }
	      } else if (i === 3) {
	        if (rgb[i] < 0) {
	          rgb[i] = 0;
	        }
	        if (rgb[i] > 1) {
	          rgb[i] = 1;
	        }
	      }
	    }
	    return rgb;
	  };

	  css2rgb = function(css) {
	    var hsl, i, m, rgb, _i, _j, _k, _l;

	    if ((chroma.colors != null) && chroma.colors[css]) {
	      return hex2rgb(chroma.colors[css]);
	    }
	    if (m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/)) {
	      rgb = m.slice(1, 4);
	      for (i = _i = 0; _i <= 2; i = ++_i) {
	        rgb[i] = +rgb[i];
	      }
	      rgb[3] = 1;
	    } else if (m = css.match(/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/)) {
	      rgb = m.slice(1, 5);
	      for (i = _j = 0; _j <= 3; i = ++_j) {
	        rgb[i] = +rgb[i];
	      }
	    } else if (m = css.match(/rgb\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
	      rgb = m.slice(1, 4);
	      for (i = _k = 0; _k <= 2; i = ++_k) {
	        rgb[i] = Math.round(rgb[i] * 2.55);
	      }
	      rgb[3] = 1;
	    } else if (m = css.match(/rgba\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
	      rgb = m.slice(1, 5);
	      for (i = _l = 0; _l <= 2; i = ++_l) {
	        rgb[i] = Math.round(rgb[i] * 2.55);
	      }
	      rgb[3] = +rgb[3];
	    } else if (m = css.match(/hsl\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
	      hsl = m.slice(1, 4);
	      hsl[1] *= 0.01;
	      hsl[2] *= 0.01;
	      rgb = hsl2rgb(hsl);
	      rgb[3] = 1;
	    } else if (m = css.match(/hsla\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
	      hsl = m.slice(1, 4);
	      hsl[1] *= 0.01;
	      hsl[2] *= 0.01;
	      rgb = hsl2rgb(hsl);
	      rgb[3] = +m[4];
	    }
	    return rgb;
	  };

	  hex2rgb = function(hex) {
	    var a, b, g, r, rgb, u;

	    if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
	      if (hex.length === 4 || hex.length === 7) {
	        hex = hex.substr(1);
	      }
	      if (hex.length === 3) {
	        hex = hex.split("");
	        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	      }
	      u = parseInt(hex, 16);
	      r = u >> 16;
	      g = u >> 8 & 0xFF;
	      b = u & 0xFF;
	      return [r, g, b, 1];
	    }
	    if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
	      if (hex.length === 9) {
	        hex = hex.substr(1);
	      }
	      u = parseInt(hex, 16);
	      r = u >> 24 & 0xFF;
	      g = u >> 16 & 0xFF;
	      b = u >> 8 & 0xFF;
	      a = u & 0xFF;
	      return [r, g, b, a];
	    }
	    if (rgb = css2rgb(hex)) {
	      return rgb;
	    }
	    throw "unknown color: " + hex;
	  };

	  hsi2rgb = function(h, s, i) {
	    /*
	    borrowed from here:
	    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
	    */

	    var b, g, r, _ref;

	    _ref = unpack(arguments), h = _ref[0], s = _ref[1], i = _ref[2];
	    h /= 360;
	    if (h < 1 / 3) {
	      b = (1 - s) / 3;
	      r = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
	      g = 1 - (b + r);
	    } else if (h < 2 / 3) {
	      h -= 1 / 3;
	      r = (1 - s) / 3;
	      g = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
	      b = 1 - (r + g);
	    } else {
	      h -= 2 / 3;
	      g = (1 - s) / 3;
	      b = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
	      r = 1 - (g + b);
	    }
	    r = limit(i * r * 3);
	    g = limit(i * g * 3);
	    b = limit(i * b * 3);
	    return [r * 255, g * 255, b * 255];
	  };

	  hsl2rgb = function() {
	    var b, c, g, h, i, l, r, s, t1, t2, t3, _i, _ref, _ref1;

	    _ref = unpack(arguments), h = _ref[0], s = _ref[1], l = _ref[2];
	    if (s === 0) {
	      r = g = b = l * 255;
	    } else {
	      t3 = [0, 0, 0];
	      c = [0, 0, 0];
	      t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
	      t1 = 2 * l - t2;
	      h /= 360;
	      t3[0] = h + 1 / 3;
	      t3[1] = h;
	      t3[2] = h - 1 / 3;
	      for (i = _i = 0; _i <= 2; i = ++_i) {
	        if (t3[i] < 0) {
	          t3[i] += 1;
	        }
	        if (t3[i] > 1) {
	          t3[i] -= 1;
	        }
	        if (6 * t3[i] < 1) {
	          c[i] = t1 + (t2 - t1) * 6 * t3[i];
	        } else if (2 * t3[i] < 1) {
	          c[i] = t2;
	        } else if (3 * t3[i] < 2) {
	          c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6;
	        } else {
	          c[i] = t1;
	        }
	      }
	      _ref1 = [Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255)], r = _ref1[0], g = _ref1[1], b = _ref1[2];
	    }
	    return [r, g, b];
	  };

	  hsv2rgb = function() {
	    var b, f, g, h, i, p, q, r, s, t, v, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;

	    _ref = unpack(arguments), h = _ref[0], s = _ref[1], v = _ref[2];
	    v *= 255;
	    if (s === 0) {
	      r = g = b = v;
	    } else {
	      if (h === 360) {
	        h = 0;
	      }
	      if (h > 360) {
	        h -= 360;
	      }
	      if (h < 0) {
	        h += 360;
	      }
	      h /= 60;
	      i = Math.floor(h);
	      f = h - i;
	      p = v * (1 - s);
	      q = v * (1 - s * f);
	      t = v * (1 - s * (1 - f));
	      switch (i) {
	        case 0:
	          _ref1 = [v, t, p], r = _ref1[0], g = _ref1[1], b = _ref1[2];
	          break;
	        case 1:
	          _ref2 = [q, v, p], r = _ref2[0], g = _ref2[1], b = _ref2[2];
	          break;
	        case 2:
	          _ref3 = [p, v, t], r = _ref3[0], g = _ref3[1], b = _ref3[2];
	          break;
	        case 3:
	          _ref4 = [p, q, v], r = _ref4[0], g = _ref4[1], b = _ref4[2];
	          break;
	        case 4:
	          _ref5 = [t, p, v], r = _ref5[0], g = _ref5[1], b = _ref5[2];
	          break;
	        case 5:
	          _ref6 = [v, p, q], r = _ref6[0], g = _ref6[1], b = _ref6[2];
	      }
	    }
	    r = Math.round(r);
	    g = Math.round(g);
	    b = Math.round(b);
	    return [r, g, b];
	  };

	  K = 18;

	  X = 0.950470;

	  Y = 1;

	  Z = 1.088830;

	  lab2lch = function() {
	    var a, b, c, h, l, _ref;

	    _ref = unpack(arguments), l = _ref[0], a = _ref[1], b = _ref[2];
	    c = Math.sqrt(a * a + b * b);
	    h = Math.atan2(b, a) / Math.PI * 180;
	    return [l, c, h];
	  };

	  lab2rgb = function(l, a, b) {
	    /*
	    adapted to match d3 implementation
	    */

	    var g, r, x, y, z, _ref, _ref1;

	    if (l !== void 0 && l.length === 3) {
	      _ref = l, l = _ref[0], a = _ref[1], b = _ref[2];
	    }
	    if (l !== void 0 && l.length === 3) {
	      _ref1 = l, l = _ref1[0], a = _ref1[1], b = _ref1[2];
	    }
	    y = (l + 16) / 116;
	    x = y + a / 500;
	    z = y - b / 200;
	    x = lab_xyz(x) * X;
	    y = lab_xyz(y) * Y;
	    z = lab_xyz(z) * Z;
	    r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
	    g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
	    b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
	    return [limit(r, 0, 255), limit(g, 0, 255), limit(b, 0, 255), 1];
	  };

	  lab_xyz = function(x) {
	    if (x > 0.206893034) {
	      return x * x * x;
	    } else {
	      return (x - 4 / 29) / 7.787037;
	    }
	  };

	  xyz_rgb = function(r) {
	    return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
	  };

	  lch2lab = function() {
	    /*
	    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel. These formulas were invented by David Dalrymple to obtain maximum contrast without going out of gamut if the parameters are in the range 0-1.
	    A saturation multiplier was added by Gregor Aisch
	    */

	    var c, h, l, _ref;

	    _ref = unpack(arguments), l = _ref[0], c = _ref[1], h = _ref[2];
	    h = h * Math.PI / 180;
	    return [l, Math.cos(h) * c, Math.sin(h) * c];
	  };

	  lch2rgb = function(l, c, h) {
	    var L, a, b, g, r, _ref, _ref1;

	    _ref = lch2lab(l, c, h), L = _ref[0], a = _ref[1], b = _ref[2];
	    _ref1 = lab2rgb(L, a, b), r = _ref1[0], g = _ref1[1], b = _ref1[2];
	    return [limit(r, 0, 255), limit(g, 0, 255), limit(b, 0, 255)];
	  };

	  luminance = function(r, g, b) {
	    var _ref;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    r = luminance_x(r);
	    g = luminance_x(g);
	    b = luminance_x(b);
	    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	  };

	  luminance_x = function(x) {
	    x /= 255;
	    if (x <= 0.03928) {
	      return x / 12.92;
	    } else {
	      return Math.pow((x + 0.055) / 1.055, 2.4);
	    }
	  };

	  rgb2hex = function() {
	    var b, g, r, str, u, _ref;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    u = r << 16 | g << 8 | b;
	    str = "000000" + u.toString(16);
	    return "#" + str.substr(str.length - 6);
	  };

	  rgb2hsi = function() {
	    /*
	    borrowed from here:
	    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
	    */

	    var TWOPI, b, g, h, i, min, r, s, _ref;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    TWOPI = Math.PI * 2;
	    r /= 255;
	    g /= 255;
	    b /= 255;
	    min = Math.min(r, g, b);
	    i = (r + g + b) / 3;
	    s = 1 - min / i;
	    if (s === 0) {
	      h = 0;
	    } else {
	      h = ((r - g) + (r - b)) / 2;
	      h /= Math.sqrt((r - g) * (r - g) + (r - b) * (g - b));
	      h = Math.acos(h);
	      if (b > g) {
	        h = TWOPI - h;
	      }
	      h /= TWOPI;
	    }
	    return [h * 360, s, i];
	  };

	  rgb2hsl = function(r, g, b) {
	    var h, l, max, min, s, _ref;

	    if (r !== void 0 && r.length >= 3) {
	      _ref = r, r = _ref[0], g = _ref[1], b = _ref[2];
	    }
	    r /= 255;
	    g /= 255;
	    b /= 255;
	    min = Math.min(r, g, b);
	    max = Math.max(r, g, b);
	    l = (max + min) / 2;
	    if (max === min) {
	      s = 0;
	      h = Number.NaN;
	    } else {
	      s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
	    }
	    if (r === max) {
	      h = (g - b) / (max - min);
	    } else if (g === max) {
	      h = 2 + (b - r) / (max - min);
	    } else if (b === max) {
	      h = 4 + (r - g) / (max - min);
	    }
	    h *= 60;
	    if (h < 0) {
	      h += 360;
	    }
	    return [h, s, l];
	  };

	  rgb2hsv = function() {
	    var b, delta, g, h, max, min, r, s, v, _ref;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    min = Math.min(r, g, b);
	    max = Math.max(r, g, b);
	    delta = max - min;
	    v = max / 255.0;
	    if (max === 0) {
	      h = Number.NaN;
	      s = 0;
	    } else {
	      s = delta / max;
	      if (r === max) {
	        h = (g - b) / delta;
	      }
	      if (g === max) {
	        h = 2 + (b - r) / delta;
	      }
	      if (b === max) {
	        h = 4 + (r - g) / delta;
	      }
	      h *= 60;
	      if (h < 0) {
	        h += 360;
	      }
	    }
	    return [h, s, v];
	  };

	  rgb2lab = function() {
	    var b, g, r, x, y, z, _ref;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    r = rgb_xyz(r);
	    g = rgb_xyz(g);
	    b = rgb_xyz(b);
	    x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / X);
	    y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / Y);
	    z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / Z);
	    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
	  };

	  rgb_xyz = function(r) {
	    if ((r /= 255) <= 0.04045) {
	      return r / 12.92;
	    } else {
	      return Math.pow((r + 0.055) / 1.055, 2.4);
	    }
	  };

	  xyz_lab = function(x) {
	    if (x > 0.008856) {
	      return Math.pow(x, 1 / 3);
	    } else {
	      return 7.787037 * x + 4 / 29;
	    }
	  };

	  rgb2lch = function() {
	    var a, b, g, l, r, _ref, _ref1;

	    _ref = unpack(arguments), r = _ref[0], g = _ref[1], b = _ref[2];
	    _ref1 = rgb2lab(r, g, b), l = _ref1[0], a = _ref1[1], b = _ref1[2];
	    return lab2lch(l, a, b);
	  };

	  /*
	      chroma.js
	  
	      Copyright (c) 2011-2013, Gregor Aisch
	      All rights reserved.
	  
	      Redistribution and use in source and binary forms, with or without
	      modification, are permitted provided that the following conditions are met:
	  
	      * Redistributions of source code must retain the above copyright notice, this
	        list of conditions and the following disclaimer.
	  
	      * Redistributions in binary form must reproduce the above copyright notice,
	        this list of conditions and the following disclaimer in the documentation
	        and/or other materials provided with the distribution.
	  
	      * The name Gregor Aisch may not be used to endorse or promote products
	        derived from this software without specific prior written permission.
	  
	      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
	      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
	      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	  
	      @source: https://github.com/gka/chroma.js
	  */


	  chroma.scale = function(colors, positions) {
	    var classifyValue, f, getClass, getColor, resetCache, setColors, setDomain, tmap, _colorCache, _colors, _correctLightness, _domain, _fixed, _max, _min, _mode, _nacol, _numClasses, _out, _pos, _spread;

	    _mode = 'rgb';
	    _nacol = chroma('#ccc');
	    _spread = 0;
	    _fixed = false;
	    _domain = [0, 1];
	    _colors = [];
	    _out = false;
	    _pos = [];
	    _min = 0;
	    _max = 1;
	    _correctLightness = false;
	    _numClasses = 0;
	    _colorCache = {};
	    setColors = function(colors, positions) {
	      var c, col, _i, _j, _ref, _ref1, _ref2;

	      if (colors == null) {
	        colors = ['#ddd', '#222'];
	      }
	      if ((colors != null) && type(colors) === 'string' && (((_ref = chroma.brewer) != null ? _ref[colors] : void 0) != null)) {
	        colors = chroma.brewer[colors];
	      }
	      if (type(colors) === 'array') {
	        colors = colors.slice(0);
	        for (c = _i = 0, _ref1 = colors.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; c = 0 <= _ref1 ? ++_i : --_i) {
	          col = colors[c];
	          if (type(col) === "string") {
	            colors[c] = chroma(col);
	          }
	        }
	        if (positions != null) {
	          _pos = positions;
	        } else {
	          _pos = [];
	          for (c = _j = 0, _ref2 = colors.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; c = 0 <= _ref2 ? ++_j : --_j) {
	            _pos.push(c / (colors.length - 1));
	          }
	        }
	      }
	      resetCache();
	      return _colors = colors;
	    };
	    setDomain = function(domain) {
	      if (domain == null) {
	        domain = [];
	      }
	      /*
	      # use this if you want to display a limited number of data classes
	      # possible methods are "equalinterval", "quantiles", "custom"
	      */

	      _domain = domain;
	      _min = domain[0];
	      _max = domain[domain.length - 1];
	      resetCache();
	      if (domain.length === 2) {
	        return _numClasses = 0;
	      } else {
	        return _numClasses = domain.length - 1;
	      }
	    };
	    getClass = function(value) {
	      var i, n;

	      if (_domain != null) {
	        n = _domain.length - 1;
	        i = 0;
	        while (i < n && value >= _domain[i]) {
	          i++;
	        }
	        return i - 1;
	      }
	      return 0;
	    };
	    tmap = function(t) {
	      return t;
	    };
	    classifyValue = function(value) {
	      var i, maxc, minc, n, val;

	      val = value;
	      if (_domain.length > 2) {
	        n = _domain.length - 1;
	        i = getClass(value);
	        minc = _domain[0] + (_domain[1] - _domain[0]) * (0 + _spread * 0.5);
	        maxc = _domain[n - 1] + (_domain[n] - _domain[n - 1]) * (1 - _spread * 0.5);
	        val = _min + ((_domain[i] + (_domain[i + 1] - _domain[i]) * 0.5 - minc) / (maxc - minc)) * (_max - _min);
	      }
	      return val;
	    };
	    getColor = function(val, bypassMap) {
	      var c, col, f0, i, k, p, t, _i, _ref;

	      if (bypassMap == null) {
	        bypassMap = false;
	      }
	      if (isNaN(val)) {
	        return _nacol;
	      }
	      if (!bypassMap) {
	        if (_domain.length > 2) {
	          c = getClass(val);
	          t = c / (_numClasses - 1);
	        } else {
	          t = f0 = (val - _min) / (_max - _min);
	          t = Math.min(1, Math.max(0, t));
	        }
	      } else {
	        t = val;
	      }
	      if (!bypassMap) {
	        t = tmap(t);
	      }
	      k = Math.floor(t * 10000);
	      if (_colorCache[k]) {
	        col = _colorCache[k];
	      } else {
	        if (type(_colors) === 'array') {
	          for (i = _i = 0, _ref = _pos.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
	            p = _pos[i];
	            if (t <= p) {
	              col = _colors[i];
	              break;
	            }
	            if (t >= p && i === _pos.length - 1) {
	              col = _colors[i];
	              break;
	            }
	            if (t > p && t < _pos[i + 1]) {
	              t = (t - p) / (_pos[i + 1] - p);
	              col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode);
	              break;
	            }
	          }
	        } else if (type(_colors) === 'function') {
	          col = _colors(t);
	        }
	        _colorCache[k] = col;
	      }
	      return col;
	    };
	    resetCache = function() {
	      return _colorCache = {};
	    };
	    setColors(colors, positions);
	    f = function(v) {
	      var c;

	      c = getColor(v);
	      if (_out && c[_out]) {
	        return c[_out]();
	      } else {
	        return c;
	      }
	    };
	    f.domain = function(domain, classes, mode, key) {
	      var d;

	      if (mode == null) {
	        mode = 'e';
	      }
	      if (!arguments.length) {
	        return _domain;
	      }
	      if (classes != null) {
	        d = chroma.analyze(domain, key);
	        if (classes === 0) {
	          domain = [d.min, d.max];
	        } else {
	          domain = chroma.limits(d, mode, classes);
	        }
	      }
	      setDomain(domain);
	      return f;
	    };
	    f.mode = function(_m) {
	      if (!arguments.length) {
	        return _mode;
	      }
	      _mode = _m;
	      resetCache();
	      return f;
	    };
	    f.range = function(colors, _pos) {
	      setColors(colors, _pos);
	      return f;
	    };
	    f.out = function(_o) {
	      _out = _o;
	      return f;
	    };
	    f.spread = function(val) {
	      if (!arguments.length) {
	        return _spread;
	      }
	      _spread = val;
	      return f;
	    };
	    f.correctLightness = function(v) {
	      if (!arguments.length) {
	        return _correctLightness;
	      }
	      _correctLightness = v;
	      resetCache();
	      if (_correctLightness) {
	        tmap = function(t) {
	          var L0, L1, L_actual, L_diff, L_ideal, max_iter, pol, t0, t1;

	          L0 = getColor(0, true).lab()[0];
	          L1 = getColor(1, true).lab()[0];
	          pol = L0 > L1;
	          L_actual = getColor(t, true).lab()[0];
	          L_ideal = L0 + (L1 - L0) * t;
	          L_diff = L_actual - L_ideal;
	          t0 = 0;
	          t1 = 1;
	          max_iter = 20;
	          while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
	            (function() {
	              if (pol) {
	                L_diff *= -1;
	              }
	              if (L_diff < 0) {
	                t0 = t;
	                t += (t1 - t) * 0.5;
	              } else {
	                t1 = t;
	                t += (t0 - t) * 0.5;
	              }
	              L_actual = getColor(t, true).lab()[0];
	              return L_diff = L_actual - L_ideal;
	            })();
	          }
	          return t;
	        };
	      } else {
	        tmap = function(t) {
	          return t;
	        };
	      }
	      return f;
	    };
	    f.colors = function(out) {
	      var i, samples, _i, _j, _len, _ref;

	      if (out == null) {
	        out = 'hex';
	      }
	      colors = [];
	      samples = [];
	      if (_domain.length > 2) {
	        for (i = _i = 1, _ref = _domain.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
	          samples.push((_domain[i - 1] + _domain[i]) * 0.5);
	        }
	      } else {
	        samples = _domain;
	      }
	      for (_j = 0, _len = samples.length; _j < _len; _j++) {
	        i = samples[_j];
	        colors.push(f(i)[out]());
	      }
	      return colors;
	    };
	    return f;
	  };

	  if ((_ref = chroma.scales) == null) {
	    chroma.scales = {};
	  }

	  chroma.scales.cool = function() {
	    return chroma.scale([chroma.hsl(180, 1, .9), chroma.hsl(250, .7, .4)]);
	  };

	  chroma.scales.hot = function() {
	    return chroma.scale(['#000', '#f00', '#ff0', '#fff'], [0, .25, .75, 1]).mode('rgb');
	  };

	  /*
	      chroma.js
	  
	      Copyright (c) 2011-2013, Gregor Aisch
	      All rights reserved.
	  
	      Redistribution and use in source and binary forms, with or without
	      modification, are permitted provided that the following conditions are met:
	  
	      * Redistributions of source code must retain the above copyright notice, this
	        list of conditions and the following disclaimer.
	  
	      * Redistributions in binary form must reproduce the above copyright notice,
	        this list of conditions and the following disclaimer in the documentation
	        and/or other materials provided with the distribution.
	  
	      * The name Gregor Aisch may not be used to endorse or promote products
	        derived from this software without specific prior written permission.
	  
	      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
	      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
	      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	  
	      @source: https://github.com/gka/chroma.js
	  */


	  chroma.analyze = function(data, key, filter) {
	    var add, k, r, val, visit, _i, _len;

	    r = {
	      min: Number.MAX_VALUE,
	      max: Number.MAX_VALUE * -1,
	      sum: 0,
	      values: [],
	      count: 0
	    };
	    if (filter == null) {
	      filter = function() {
	        return true;
	      };
	    }
	    add = function(val) {
	      if ((val != null) && !isNaN(val)) {
	        r.values.push(val);
	        r.sum += val;
	        if (val < r.min) {
	          r.min = val;
	        }
	        if (val > r.max) {
	          r.max = val;
	        }
	        r.count += 1;
	      }
	    };
	    visit = function(val, k) {
	      if (filter(val, k)) {
	        if ((key != null) && type(key) === 'function') {
	          return add(key(val));
	        } else if ((key != null) && type(key) === 'string' || type(key) === 'number') {
	          return add(val[key]);
	        } else {
	          return add(val);
	        }
	      }
	    };
	    if (type(data) === 'array') {
	      for (_i = 0, _len = data.length; _i < _len; _i++) {
	        val = data[_i];
	        visit(val);
	      }
	    } else {
	      for (k in data) {
	        val = data[k];
	        visit(val, k);
	      }
	    }
	    r.domain = [r.min, r.max];
	    r.limits = function(mode, num) {
	      return chroma.limits(r, mode, num);
	    };
	    return r;
	  };

	  chroma.limits = function(data, mode, num) {
	    var assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max, max_log, min, min_log, mindist, n, nb_iters, newCentroids, p, pb, pr, repeat, sum, tmpKMeansBreaks, value, values, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t, _u, _v, _w;

	    if (mode == null) {
	      mode = 'equal';
	    }
	    if (num == null) {
	      num = 7;
	    }
	    if (data.values == null) {
	      data = chroma.analyze(data);
	    }
	    min = data.min;
	    max = data.max;
	    sum = data.sum;
	    values = data.values.sort(function(a, b) {
	      return a - b;
	    });
	    limits = [];
	    if (mode.substr(0, 1) === 'c') {
	      limits.push(min);
	      limits.push(max);
	    }
	    if (mode.substr(0, 1) === 'e') {
	      limits.push(min);
	      for (i = _i = 1, _ref1 = num - 1; 1 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
	        limits.push(min + (i / num) * (max - min));
	      }
	      limits.push(max);
	    } else if (mode.substr(0, 1) === 'l') {
	      if (min <= 0) {
	        throw 'Logarithmic scales are only possible for values > 0';
	      }
	      min_log = Math.LOG10E * Math.log(min);
	      max_log = Math.LOG10E * Math.log(max);
	      limits.push(min);
	      for (i = _j = 1, _ref2 = num - 1; 1 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 1 <= _ref2 ? ++_j : --_j) {
	        limits.push(Math.pow(10, min_log + (i / num) * (max_log - min_log)));
	      }
	      limits.push(max);
	    } else if (mode.substr(0, 1) === 'q') {
	      limits.push(min);
	      for (i = _k = 1, _ref3 = num - 1; 1 <= _ref3 ? _k <= _ref3 : _k >= _ref3; i = 1 <= _ref3 ? ++_k : --_k) {
	        p = values.length * i / num;
	        pb = Math.floor(p);
	        if (pb === p) {
	          limits.push(values[pb]);
	        } else {
	          pr = p - pb;
	          limits.push(values[pb] * pr + values[pb + 1] * (1 - pr));
	        }
	      }
	      limits.push(max);
	    } else if (mode.substr(0, 1) === 'k') {
	      /*
	      implementation based on
	      http://code.google.com/p/figue/source/browse/trunk/figue.js#336
	      simplified for 1-d input values
	      */

	      n = values.length;
	      assignments = new Array(n);
	      clusterSizes = new Array(num);
	      repeat = true;
	      nb_iters = 0;
	      centroids = null;
	      centroids = [];
	      centroids.push(min);
	      for (i = _l = 1, _ref4 = num - 1; 1 <= _ref4 ? _l <= _ref4 : _l >= _ref4; i = 1 <= _ref4 ? ++_l : --_l) {
	        centroids.push(min + (i / num) * (max - min));
	      }
	      centroids.push(max);
	      while (repeat) {
	        for (j = _m = 0, _ref5 = num - 1; 0 <= _ref5 ? _m <= _ref5 : _m >= _ref5; j = 0 <= _ref5 ? ++_m : --_m) {
	          clusterSizes[j] = 0;
	        }
	        for (i = _n = 0, _ref6 = n - 1; 0 <= _ref6 ? _n <= _ref6 : _n >= _ref6; i = 0 <= _ref6 ? ++_n : --_n) {
	          value = values[i];
	          mindist = Number.MAX_VALUE;
	          for (j = _o = 0, _ref7 = num - 1; 0 <= _ref7 ? _o <= _ref7 : _o >= _ref7; j = 0 <= _ref7 ? ++_o : --_o) {
	            dist = Math.abs(centroids[j] - value);
	            if (dist < mindist) {
	              mindist = dist;
	              best = j;
	            }
	          }
	          clusterSizes[best]++;
	          assignments[i] = best;
	        }
	        newCentroids = new Array(num);
	        for (j = _p = 0, _ref8 = num - 1; 0 <= _ref8 ? _p <= _ref8 : _p >= _ref8; j = 0 <= _ref8 ? ++_p : --_p) {
	          newCentroids[j] = null;
	        }
	        for (i = _q = 0, _ref9 = n - 1; 0 <= _ref9 ? _q <= _ref9 : _q >= _ref9; i = 0 <= _ref9 ? ++_q : --_q) {
	          cluster = assignments[i];
	          if (newCentroids[cluster] === null) {
	            newCentroids[cluster] = values[i];
	          } else {
	            newCentroids[cluster] += values[i];
	          }
	        }
	        for (j = _r = 0, _ref10 = num - 1; 0 <= _ref10 ? _r <= _ref10 : _r >= _ref10; j = 0 <= _ref10 ? ++_r : --_r) {
	          newCentroids[j] *= 1 / clusterSizes[j];
	        }
	        repeat = false;
	        for (j = _s = 0, _ref11 = num - 1; 0 <= _ref11 ? _s <= _ref11 : _s >= _ref11; j = 0 <= _ref11 ? ++_s : --_s) {
	          if (newCentroids[j] !== centroids[i]) {
	            repeat = true;
	            break;
	          }
	        }
	        centroids = newCentroids;
	        nb_iters++;
	        if (nb_iters > 200) {
	          repeat = false;
	        }
	      }
	      kClusters = {};
	      for (j = _t = 0, _ref12 = num - 1; 0 <= _ref12 ? _t <= _ref12 : _t >= _ref12; j = 0 <= _ref12 ? ++_t : --_t) {
	        kClusters[j] = [];
	      }
	      for (i = _u = 0, _ref13 = n - 1; 0 <= _ref13 ? _u <= _ref13 : _u >= _ref13; i = 0 <= _ref13 ? ++_u : --_u) {
	        cluster = assignments[i];
	        kClusters[cluster].push(values[i]);
	      }
	      tmpKMeansBreaks = [];
	      for (j = _v = 0, _ref14 = num - 1; 0 <= _ref14 ? _v <= _ref14 : _v >= _ref14; j = 0 <= _ref14 ? ++_v : --_v) {
	        tmpKMeansBreaks.push(kClusters[j][0]);
	        tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
	      }
	      tmpKMeansBreaks = tmpKMeansBreaks.sort(function(a, b) {
	        return a - b;
	      });
	      limits.push(tmpKMeansBreaks[0]);
	      for (i = _w = 1, _ref15 = tmpKMeansBreaks.length - 1; _w <= _ref15; i = _w += 2) {
	        if (!isNaN(tmpKMeansBreaks[i])) {
	          limits.push(tmpKMeansBreaks[i]);
	        }
	      }
	    }
	    return limits;
	  };

	  /**
	  	ColorBrewer colors for chroma.js
	  
	  	Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The 
	  	Pennsylvania State University.
	  
	  	Licensed under the Apache License, Version 2.0 (the "License"); 
	  	you may not use this file except in compliance with the License.
	  	You may obtain a copy of the License at	
	  	http://www.apache.org/licenses/LICENSE-2.0
	  
	  	Unless required by applicable law or agreed to in writing, software distributed
	  	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
	  	CONDITIONS OF ANY KIND, either express or implied. See the License for the
	  	specific language governing permissions and limitations under the License.
	  
	      @preserve
	  */


	  chroma.brewer = brewer = {
	    OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
	    PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
	    BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
	    Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
	    BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
	    YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
	    YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
	    Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
	    RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
	    Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
	    YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
	    Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
	    GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
	    Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
	    YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
	    PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
	    Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
	    PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
	    Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
	    RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
	    RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
	    PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
	    PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
	    RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
	    BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
	    RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
	    PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
	    Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
	    Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
	    Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
	    Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
	    Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
	    Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
	    Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
	    Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
	  };

	  /**
	  	X11 color names
	  
	  	http://www.w3.org/TR/css3-color/#svg-color
	  */


	  chroma.colors = colors = {
	    indigo: "#4b0082",
	    gold: "#ffd700",
	    hotpink: "#ff69b4",
	    firebrick: "#b22222",
	    indianred: "#cd5c5c",
	    yellow: "#ffff00",
	    mistyrose: "#ffe4e1",
	    darkolivegreen: "#556b2f",
	    olive: "#808000",
	    darkseagreen: "#8fbc8f",
	    pink: "#ffc0cb",
	    tomato: "#ff6347",
	    lightcoral: "#f08080",
	    orangered: "#ff4500",
	    navajowhite: "#ffdead",
	    lime: "#00ff00",
	    palegreen: "#98fb98",
	    darkslategrey: "#2f4f4f",
	    greenyellow: "#adff2f",
	    burlywood: "#deb887",
	    seashell: "#fff5ee",
	    mediumspringgreen: "#00fa9a",
	    fuchsia: "#ff00ff",
	    papayawhip: "#ffefd5",
	    blanchedalmond: "#ffebcd",
	    chartreuse: "#7fff00",
	    dimgray: "#696969",
	    black: "#000000",
	    peachpuff: "#ffdab9",
	    springgreen: "#00ff7f",
	    aquamarine: "#7fffd4",
	    white: "#ffffff",
	    orange: "#ffa500",
	    lightsalmon: "#ffa07a",
	    darkslategray: "#2f4f4f",
	    brown: "#a52a2a",
	    ivory: "#fffff0",
	    dodgerblue: "#1e90ff",
	    peru: "#cd853f",
	    lawngreen: "#7cfc00",
	    chocolate: "#d2691e",
	    crimson: "#dc143c",
	    forestgreen: "#228b22",
	    darkgrey: "#a9a9a9",
	    lightseagreen: "#20b2aa",
	    cyan: "#00ffff",
	    mintcream: "#f5fffa",
	    silver: "#c0c0c0",
	    antiquewhite: "#faebd7",
	    mediumorchid: "#ba55d3",
	    skyblue: "#87ceeb",
	    gray: "#808080",
	    darkturquoise: "#00ced1",
	    goldenrod: "#daa520",
	    darkgreen: "#006400",
	    floralwhite: "#fffaf0",
	    darkviolet: "#9400d3",
	    darkgray: "#a9a9a9",
	    moccasin: "#ffe4b5",
	    saddlebrown: "#8b4513",
	    grey: "#808080",
	    darkslateblue: "#483d8b",
	    lightskyblue: "#87cefa",
	    lightpink: "#ffb6c1",
	    mediumvioletred: "#c71585",
	    slategrey: "#708090",
	    red: "#ff0000",
	    deeppink: "#ff1493",
	    limegreen: "#32cd32",
	    darkmagenta: "#8b008b",
	    palegoldenrod: "#eee8aa",
	    plum: "#dda0dd",
	    turquoise: "#40e0d0",
	    lightgrey: "#d3d3d3",
	    lightgoldenrodyellow: "#fafad2",
	    darkgoldenrod: "#b8860b",
	    lavender: "#e6e6fa",
	    maroon: "#800000",
	    yellowgreen: "#9acd32",
	    sandybrown: "#f4a460",
	    thistle: "#d8bfd8",
	    violet: "#ee82ee",
	    navy: "#000080",
	    magenta: "#ff00ff",
	    dimgrey: "#696969",
	    tan: "#d2b48c",
	    rosybrown: "#bc8f8f",
	    olivedrab: "#6b8e23",
	    blue: "#0000ff",
	    lightblue: "#add8e6",
	    ghostwhite: "#f8f8ff",
	    honeydew: "#f0fff0",
	    cornflowerblue: "#6495ed",
	    slateblue: "#6a5acd",
	    linen: "#faf0e6",
	    darkblue: "#00008b",
	    powderblue: "#b0e0e6",
	    seagreen: "#2e8b57",
	    darkkhaki: "#bdb76b",
	    snow: "#fffafa",
	    sienna: "#a0522d",
	    mediumblue: "#0000cd",
	    royalblue: "#4169e1",
	    lightcyan: "#e0ffff",
	    green: "#008000",
	    mediumpurple: "#9370db",
	    midnightblue: "#191970",
	    cornsilk: "#fff8dc",
	    paleturquoise: "#afeeee",
	    bisque: "#ffe4c4",
	    slategray: "#708090",
	    darkcyan: "#008b8b",
	    khaki: "#f0e68c",
	    wheat: "#f5deb3",
	    teal: "#008080",
	    darkorchid: "#9932cc",
	    deepskyblue: "#00bfff",
	    salmon: "#fa8072",
	    darkred: "#8b0000",
	    steelblue: "#4682b4",
	    palevioletred: "#db7093",
	    lightslategray: "#778899",
	    aliceblue: "#f0f8ff",
	    lightslategrey: "#778899",
	    lightgreen: "#90ee90",
	    orchid: "#da70d6",
	    gainsboro: "#dcdcdc",
	    mediumseagreen: "#3cb371",
	    lightgray: "#d3d3d3",
	    mediumturquoise: "#48d1cc",
	    lemonchiffon: "#fffacd",
	    cadetblue: "#5f9ea0",
	    lightyellow: "#ffffe0",
	    lavenderblush: "#fff0f5",
	    coral: "#ff7f50",
	    purple: "#800080",
	    aqua: "#00ffff",
	    whitesmoke: "#f5f5f5",
	    mediumslateblue: "#7b68ee",
	    darkorange: "#ff8c00",
	    mediumaquamarine: "#66cdaa",
	    darksalmon: "#e9967a",
	    beige: "#f5f5dc",
	    blueviolet: "#8a2be2",
	    azure: "#f0ffff",
	    lightsteelblue: "#b0c4de",
	    oldlace: "#fdf5e6"
	  };

	  /*
	      chroma.js
	  
	      Copyright (c) 2011-2013, Gregor Aisch
	      All rights reserved.
	  
	      Redistribution and use in source and binary forms, with or without
	      modification, are permitted provided that the following conditions are met:
	  
	      * Redistributions of source code must retain the above copyright notice, this
	        list of conditions and the following disclaimer.
	  
	      * Redistributions in binary form must reproduce the above copyright notice,
	        this list of conditions and the following disclaimer in the documentation
	        and/or other materials provided with the distribution.
	  
	      * The name Gregor Aisch may not be used to endorse or promote products
	        derived from this software without specific prior written permission.
	  
	      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
	      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
	      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	  
	      @source: https://github.com/gka/chroma.js
	  */


	  type = (function() {
	    /*
	    for browser-safe type checking+
	    ported from jQuery's $.type
	    */

	    var classToType, name, _i, _len, _ref1;

	    classToType = {};
	    _ref1 = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
	    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	      name = _ref1[_i];
	      classToType["[object " + name + "]"] = name.toLowerCase();
	    }
	    return function(obj) {
	      var strType;

	      strType = Object.prototype.toString.call(obj);
	      return classToType[strType] || "object";
	    };
	  })();

	  limit = function(x, min, max) {
	    if (min == null) {
	      min = 0;
	    }
	    if (max == null) {
	      max = 1;
	    }
	    if (x < min) {
	      x = min;
	    }
	    if (x > max) {
	      x = max;
	    }
	    return x;
	  };

	  unpack = function(args) {
	    if (args.length >= 3) {
	      return args;
	    } else {
	      return args[0];
	    }
	  };

	  TWOPI = Math.PI * 2;

	  PITHIRD = Math.PI / 3;

	  cos = Math.cos;

	  /*
	  interpolates between a set of colors uzing a bezier spline
	  */


	  bezier = function(colors) {
	    var I, I0, I1, c, lab0, lab1, lab2, lab3, _ref1, _ref2, _ref3;

	    colors = (function() {
	      var _i, _len, _results;

	      _results = [];
	      for (_i = 0, _len = colors.length; _i < _len; _i++) {
	        c = colors[_i];
	        _results.push(chroma(c));
	      }
	      return _results;
	    })();
	    if (colors.length === 2) {
	      _ref1 = (function() {
	        var _i, _len, _results;

	        _results = [];
	        for (_i = 0, _len = colors.length; _i < _len; _i++) {
	          c = colors[_i];
	          _results.push(c.lab());
	        }
	        return _results;
	      })(), lab0 = _ref1[0], lab1 = _ref1[1];
	      I = function(t) {
	        var i, lab;

	        lab = (function() {
	          var _i, _results;

	          _results = [];
	          for (i = _i = 0; _i <= 2; i = ++_i) {
	            _results.push(lab0[i] + t * (lab1[i] - lab0[i]));
	          }
	          return _results;
	        })();
	        return chroma.lab.apply(chroma, lab);
	      };
	    } else if (colors.length === 3) {
	      _ref2 = (function() {
	        var _i, _len, _results;

	        _results = [];
	        for (_i = 0, _len = colors.length; _i < _len; _i++) {
	          c = colors[_i];
	          _results.push(c.lab());
	        }
	        return _results;
	      })(), lab0 = _ref2[0], lab1 = _ref2[1], lab2 = _ref2[2];
	      I = function(t) {
	        var i, lab;

	        lab = (function() {
	          var _i, _results;

	          _results = [];
	          for (i = _i = 0; _i <= 2; i = ++_i) {
	            _results.push((1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]);
	          }
	          return _results;
	        })();
	        return chroma.lab.apply(chroma, lab);
	      };
	    } else if (colors.length === 4) {
	      _ref3 = (function() {
	        var _i, _len, _results;

	        _results = [];
	        for (_i = 0, _len = colors.length; _i < _len; _i++) {
	          c = colors[_i];
	          _results.push(c.lab());
	        }
	        return _results;
	      })(), lab0 = _ref3[0], lab1 = _ref3[1], lab2 = _ref3[2], lab3 = _ref3[3];
	      I = function(t) {
	        var i, lab;

	        lab = (function() {
	          var _i, _results;

	          _results = [];
	          for (i = _i = 0; _i <= 2; i = ++_i) {
	            _results.push((1 - t) * (1 - t) * (1 - t) * lab0[i] + 3 * (1 - t) * (1 - t) * t * lab1[i] + 3 * (1 - t) * t * t * lab2[i] + t * t * t * lab3[i]);
	          }
	          return _results;
	        })();
	        return chroma.lab.apply(chroma, lab);
	      };
	    } else if (colors.length === 5) {
	      I0 = bezier(colors.slice(0, 3));
	      I1 = bezier(colors.slice(2, 5));
	      I = function(t) {
	        if (t < 0.5) {
	          return I0(t * 2);
	        } else {
	          return I1((t - 0.5) * 2);
	        }
	      };
	    }
	    return I;
	  };

	  chroma.interpolate.bezier = bezier;

	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)(module)))

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var $ = __webpack_require__(8);
	var _ = __webpack_require__(9);

	function Visualization(element, vif) {

	  var _defaultVIF = {
	    configuration: {
	      axisLabels: {
	        top: false,
	        right: false,
	        bottom: false,
	        left: false
	      },
	      localization: {},
	      interactive: true
	    }
	  };
	  var _vif = _.merge(_defaultVIF, vif);

	  utils.assertInstanceOf(element, $);
	  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.top, 'boolean', 'string');
	  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.right, 'boolean', 'string');
	  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.bottom, 'boolean', 'string');
	  utils.assertIsOneOfTypes(_vif.configuration.axisLabels.left, 'boolean', 'string');

	  this.element = element;

	  if (_vif.configuration.interactive) {
	    element.addClass('filterable');
	  }

	  /**
	   * Public methods
	   */

	  this.renderAxisLabels = function(container) {

	    var axisLabels = _vif.configuration.axisLabels;

	    var topAxisLabel = $(
	      '<div>',
	      {
	        'class': 'top-axis-label'
	      }
	    );

	    var rightAxisLabel = $(
	      '<div>',
	      {
	        'class': 'right-axis-label'
	      }
	    );

	    var bottomAxisLabel = $(
	      '<div>',
	      {
	        'class': 'bottom-axis-label'
	      }
	    );

	    var leftAxisLabel = $(
	      '<div>',
	      {
	        'class': 'left-axis-label'
	      }
	    );

	    if (axisLabels.top) {

	      topAxisLabel.
	        text(axisLabels.top);

	      container.
	        addClass('top-axis-label').
	        append(topAxisLabel);
	    }

	    if (axisLabels.right) {

	      rightAxisLabel.
	        text(axisLabels.right);

	      container.
	        addClass('right-axis-label').
	        append(rightAxisLabel);
	    }

	    if (axisLabels.bottom) {

	      bottomAxisLabel.
	        text(axisLabels.bottom);

	      container.
	        addClass('bottom-axis-label').
	        append(bottomAxisLabel);
	    }

	    if (axisLabels.left) {

	      leftAxisLabel.
	        text(axisLabels.left);

	      container.
	        addClass('left-axis-label').
	        append(leftAxisLabel);
	    }

	  };

	  this.getLocalization = function(key) {

	    var localizedString = '';

	    if (_.has(_vif.configuration.localization, key)) {
	      localizedString = _vif.configuration.localization[key];
	    } else {
	      _logWarning('No localized string found for key `{0}`.'.format(key));
	    }

	    return localizedString;
	  };

	  this.emitEvent = function(name, payload) {
	    this.element[0].dispatchEvent(
	      new window.CustomEvent(
	        name,
	        { detail: payload, bubbles: true }
	      )
	    );
	  };

	  /**
	   * Private methods
	   */

	  function _logWarning(message) {
	    if (window.console && window.console.warn) {
	      window.console.warn(message);
	    }
	  }
	}

	module.exports = Visualization;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var _ = __webpack_require__(9);
	var utils = __webpack_require__(3);
	var ss = __webpack_require__(5);
	var chroma = __webpack_require__(6);

	/**
	 * Dynamic choropleth styles based on the individual dataset.
	 */
	function ChoroplethMapUtils(constants) {

	  this.constants = constants;

	  // Default colors.
	  this.nullColor = '#ddd';
	  this.defaultSingleColor = 'teal';
	  this.defaultStrokeColor = 'white';
	  this.defaultHighlightColor = '#debb1e';

	  // Color classes.
	  this.negativeColorRange = ['#c6663d', '#e4eef0'];
	  this.positiveColorRange = ['#e4eef0', '#408499'];
	  this.divergingColors = ['brown', 'lightyellow', 'teal'];
	  this.qualitativeColors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
	  this.defaultColorRange = this.positiveColorRange;
	}

	$.extend(ChoroplethMapUtils.prototype, {

	  // Data calculation

	  calculateDataClassBreaks: function(geojsonAggregateData, propertyName) {

	    var geojsonValues = this.getGeojsonValues(geojsonAggregateData, propertyName);
	    var uniqueGeojsonValues = _.uniq(geojsonValues);
	    var numberOfPossibleBreaks = uniqueGeojsonValues.length - 1;
	    var classBreaksArgs = {};

	    // For very small values, 'jenks' does not make sense (produces
	    // duplicate values).  Thus, use 'equalInterval' in this cases.
	    if (numberOfPossibleBreaks <= this.constants.MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED) {
	      classBreaksArgs.method = 'equalInterval';
	      classBreaksArgs.numberOfClasses = uniqueGeojsonValues.length;
	    } else {
	      classBreaksArgs.method = 'jenks';
	      classBreaksArgs.numberOfClasses = this.numberOfClasses(geojsonValues);
	    }

	    return this.createClassBreaks({
	      method: classBreaksArgs.method,
	      data: geojsonValues,
	      numberOfClasses: classBreaksArgs.numberOfClasses
	    });
	  },

	  getGeojsonValues: function(geojson, attr) {

	    return _.reduce(geojson.features, function(data, feature) {

	      if (_.get(feature, 'properties', false)) {

	        var val = feature.properties[attr];

	        if (_hasValue(val)) {
	          data.push(feature.properties[attr]);
	        }
	      }

	      return data;
	    }, []);
	  },

	  oddNumbered: function(num) {
	    if (num % 2 === 0) {
	      return num - 1;
	    } else {
	      return num;
	    }
	  },

	  numberOfClasses: function(values) {

	    // Handles numberOfClasses in Jenks (implemented for _.uniq(values).length > 6)
	    var possibleBreaks = _.uniq(values).length;

	    if (possibleBreaks <= this.constants.MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED) {
	      throw new Error('[Choropleth] Why are you calling numberOfClasses when # unique values <= {0}?'.format(this.constants.MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED));
	    }

	    var evenPossibleBreaks = possibleBreaks - (possibleBreaks % 2);
	    var maxNumClasses = evenPossibleBreaks / 2;
	    return _.min([this.oddNumbered(maxNumClasses), 7]);
	  },

	  createClassBreaks: function(options) {
	    var classBreaks;

	    switch (options.method || 'jenks') {
	      case 'jenks':
	        options.methodParam = options.numberOfClasses || 4;
	        classBreaks = ss.jenks(options.data, options.methodParam);
	        break;
	      case 'quantile':
	        options.methodParam = options.p;
	        classBreaks = ss.quantile(options.data, options.methodParam);
	        break;
	      case 'equalInterval':
	        var minVal = _.min(options.data);
	        var maxVal = _.max(options.data);

	        if (minVal === maxVal) {
	          classBreaks = [minVal];
	        } else {
	          var scale = d3.scale.linear().domain([minVal, maxVal]);
	          classBreaks = scale.nice().ticks(_.min([options.numberOfClasses, 4]));

	          // Make sure min and max are in the classBreak ticks that d3 gives us.
	          if (classBreaks[0] > minVal) {
	            classBreaks.unshift(minVal);
	          }

	          if (_.last(classBreaks) < maxVal) {
	            classBreaks.push(maxVal);
	          }
	        }
	        break;
	      default:
	        throw new Error('Invalid/non-supported class breaks method {0}'.format(options.method));
	    }
	    return _.uniq(classBreaks);
	  },


	  // Style calculation

	  /**
	   * @param {String[]|String} colorRange A string, or an array of color strings defining the range
	   * of colors the scale should span. There are several predefined values you can use:
	   * this.divergingColors, this.qualitativeColors, this.positiveColorRange.
	   */
	  calculateColoringScale: function(colorRange, classBreaks) {

	    if (!_.isArray(classBreaks)) {
	      throw new Error('Cannot calculate coloring parameters with nvalid class breaks.');
	    }

	    if (this.qualitativeColors === colorRange) {
	      if (classBreaks.length > colorRange.length) {
	        throw new Error('Cannot calculate qualitative coloring parameters for more than {0} class breaks.'.format(this.qualitativeColors.length));
	      }
	      colorRange = this.qualitativeColors.slice(0, classBreaks.length);
	    }

	    if (colorRange.length === 2) {
	      colorRange = chroma.interpolate.bezier(colorRange);
	    }

	    return chroma.
	      scale(colorRange).
	      domain(classBreaks).

	      // For linear color ranges, make sure the lightness varies linearly
	      correctLightness(colorRange.length === 2).

	      // use LAB color space to approximate perceptual brightness
	      // See more: https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
	      mode('lab');
	  },

	  fillColor: function(colorScale, feature) {

	    var unfilteredValue = _.get(feature, 'properties.{0}'.format(this.constants.UNFILTERED_GEOJSON_PROPERTY_NAME));
	    var filteredValue = _.get(feature, 'properties.{0}'.format(this.constants.FILTERED_GEOJSON_PROPERTY_NAME));

	    if (_.isFinite(filteredValue) && _.isFinite(unfilteredValue)) {
	      if (colorScale) {
	        return String(colorScale(filteredValue));
	      } else {
	        return 'transparent';
	      }
	    } else {
	      return this.nullColor;
	    }
	  },

	  strokeColor: function(colorScale, feature, highlighted) {

	    if (!_.has(feature, 'geometry.type')) {
	      throw new Error('Cannot calculate stroke color for undefined feature geometry type.');
	    }

	    if (!_.contains(['LineString', 'MultiLineString'], feature.geometry.type)) {
	      return highlighted ? this.defaultHighlightColor : this.defaultStrokeColor;
	    }

	    if (!_hasValue(_.get(feature, 'properties.{0}'.format(this.constants.FILTERED_GEOJSON_PROPERTY_NAME), undefined)) ||
	        !_.isFinite(feature.properties[this.constants.UNFILTERED_GEOJSON_PROPERTY_NAME])) {
	      return this.nullColor;
	    }

	    if (highlighted) {
	      return this.defaultHighlightColor;
	    } else if (colorScale) {
	      return this.fillColor(colorScale, feature, false);
	    } else {
	      return this.defaultStrokeColor;
	    }
	  },

	  strokeWidth: function(feature, highlighted) {

	    if (!_.has(feature, 'geometry.type')) {
	      throw new Error('Cannot calculate stroke width for undefined feature geometry type.');
	    }

	    switch (feature.geometry.type) {
	      case 'LineString':
	      case 'MultiLineString':
	        return 3;
	      default:
	        return (highlighted) ? 3 : 1;
	    }
	  },

	  getStyleFn: function(colorScale) {

	    var visualization = this;
	    var selectedPropertyName = this.constants.SELECTED_GEOJSON_PROPERTY_NAME;

	    return function(feature) {
	      var highlighted = false;
	      var opacity = colorScale ? 0.8 : 1;

	      if (_hasValue(_.get(feature, 'properties.{0}'.format(selectedPropertyName), undefined))) {
	        highlighted = feature.properties[selectedPropertyName];
	      }

	      return {
	        fillColor: visualization.fillColor(colorScale, feature, highlighted),
	        color: visualization.strokeColor(colorScale, feature, highlighted),
	        weight: visualization.strokeWidth(feature, highlighted),
	        opacity: opacity,
	        dashArray: 0,
	        fillOpacity: opacity
	      };
	    };
	  },

	  bigNumTickFormatter: function(val) {

	    // Used if ss.standard_deviation(classBreaks) > 10
	    // val = a * 10^b (a: coefficient, b: exponent);
	    if (val === 0) {
	      return 0;
	    }

	    var exponent = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
	    var coefficient = val / Math.pow(10, exponent);
	    var isMultipleOf10 = coefficient % 10 === 0;
	    var numNonzeroDigits;
	    var formattedNum;

	    if (isMultipleOf10) {
	      numNonzeroDigits = coefficient.toString().length;
	      formattedNum = utils.formatNumber(val, {
	        precision: 0,
	        maxLength: _.min([numNonzeroDigits, 3])
	      });
	    } else {
	      numNonzeroDigits = coefficient.toString().length - 1;
	      formattedNum = utils.formatNumber(val, {
	        maxLength: _.min([numNonzeroDigits, 3])
	      });
	    }

	    return formattedNum;
	  },

	  /**
	   * If the values straddle 0, we want to add a break at 0
	   *
	   * @return {Number} the index at which we added 0, or -1 if we didn't.
	   * @protected
	   */
	  addZeroIfNecessary: function(classBreaks) {

	    var indexOfZero = _.sortedIndex(classBreaks, 0);

	    // Do not need to add break if it already exists.
	    if (_.inRange(indexOfZero, 1, classBreaks.length) &&
	      (classBreaks[indexOfZero] !== 0) &&
	      (classBreaks[indexOfZero - 1] !== 0)) {
	      classBreaks.splice(indexOfZero, 0, 0);
	      return indexOfZero;
	    }

	    return -1;
	  }
	});

	/**
	 * A function originally from `lodash-mixins.js`
	 */
	function _hasValue(value) {
	  return value !== null && value !== undefined;
	}

	module.exports = ChoroplethMapUtils;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var Visualization = __webpack_require__(10);
	var _ = __webpack_require__(9);
	var d3 = __webpack_require__(4);

	// TODO: Figure out how to do this better (and probably not through jQuery).
	$.relativeToPx = function(rems) {
	  var $div = $(document.createElement('div')).css('width', rems).appendTo(document.body);
	  var width = $div.width();

	  $div.remove();

	  return width;
	};

	function ColumnChart(element, vif) {

	  _.extend(this, new Visualization(element, vif));

	  var self = this;

	  var _chartElement;
	  var _chartWrapper;
	  var _chartScroll;
	  var _chartLabels;

	  var _truncationMarker;
	  var _lastRenderData;
	  var _lastRenderOptions;

	  var _interactive = vif.configuration.interactive === true;

	  var _truncationMarkerSelector = '.truncation-marker';
	  var _barGroupAndLabelsSelector = '.bar-group, .labels .label .contents span, .labels .label .callout';
	  var _nonDefaultSelectedLabelSelector = '.labels .label.selected.non-default';

	  // TODO: Validate columns
	  var NAME_INDEX = vif.configuration.columns.name;
	  var UNFILTERED_INDEX = vif.configuration.columns.unfilteredValue;
	  var FILTERED_INDEX = vif.configuration.columns.filteredValue;
	  var SELECTED_INDEX = vif.configuration.columns.selected;

	  _renderTemplate(this.element);
	  _attachEvents(this.element);

	  /**
	   * Public methods
	   */

	  this.render = function(data, options) {
	    _lastRenderData = data;
	    _lastRenderOptions = options;
	    // Eventually we may only want to pass in the VIF instead of other render
	    // options as well as the VIF, but for the time being we will just treat it
	    // as another property on `options`.
	    _renderData(_chartElement, data, options);
	  };

	  this.renderError = function() {
	    // TODO: Some helpful error message.
	  };

	  this.invalidateSize = function() {
	    if (_lastRenderData && _lastRenderOptions) {
	      _renderData(_chartElement, _lastRenderData, _lastRenderOptions);
	    }
	  };

	  this.destroy = function() {
	    _detachEvents(this.element);
	    this.element.find('.column-chart-container').remove();
	  };

	  /**
	   * Private methods
	   */

	  function _renderTemplate(el) {

	    var truncationMarker = $(
	      '<div>',
	      {
	        'class': 'truncation-marker'
	      }
	    ).html('&raquo;');

	    var chartWrapper = $(
	      '<div>',
	      {
	        'class': 'column-chart-wrapper'
	      }
	    ).append(truncationMarker);

	    var chartLabels = $(
	      '<div>',
	      {
	        'class': 'labels'
	      }
	    );

	    var chartScroll = $(
	      '<div>',
	      {
	        'class': 'chart-scroll'
	      }
	    ).append([
	      chartWrapper,
	      chartLabels
	    ]);

	    var chartElement = $(
	      '<div>',
	      {
	        'class': 'column-chart'
	      }
	    ).append(chartScroll);

	    var chartContainer = $(
	      '<div>',
	      {
	        'class': 'column-chart-container'
	      }
	    ).append(
	      chartElement
	    );

	    self.renderAxisLabels(chartContainer);

	    // Cache element selections
	    _chartElement = chartElement;
	    _chartWrapper = chartWrapper;
	    _chartScroll = chartScroll;
	    _chartLabels = chartLabels;
	    _truncationMarker = truncationMarker;

	    el.append(chartContainer);
	  }

	  function _attachEvents(el) {

	    el.on(
	      'mouseenter, mousemove',
	      _barGroupAndLabelsSelector,
	      showFlyout
	    );

	    el.on(
	      'mouseleave',
	      _barGroupAndLabelsSelector,
	      hideFlyout
	    );

	    el.on(
	      'mouseenter',
	      _barGroupAndLabelsSelector,
	      addHoverClassToBarGroup
	    );

	    el.on(
	      'mouseleave',
	      _barGroupAndLabelsSelector,
	      removeHoverClassFromBarGroup
	    );

	    _chartElement.on(
	      'mouseleave',
	      removeHoverClassFromBarGroup
	    );

	    if (_interactive) {

	      el.on(
	        'click',
	        _barGroupAndLabelsSelector,
	        selectDatum
	      );

	      el.on(
	        'click',
	        _truncationMarkerSelector,
	        expandVisualization
	      );

	      // We respond to mouseup in this case because if the user clicks to
	      // clear a selection with a non-default label (i.e. not one of the first
	      // three when not expanded), then we should dismiss the highlight.
	      // (The 'non-default' class is applied to labels that wouldn't normally
	      // be drawn unless a datum is selected)
	      el.on(
	        'mouseup',
	        _nonDefaultSelectedLabelSelector,
	        removeHoverClassFromBarGroup
	      );
	    }
	  }

	  function _detachEvents(el) {

	    el.off(
	      'mouseenter, mousemove',
	      _barGroupAndLabelsSelector,
	      showFlyout
	    );

	    el.off(
	      'mouseleave',
	      _barGroupAndLabelsSelector,
	      hideFlyout
	    );

	    el.off(
	      'mouseenter',
	      _barGroupAndLabelsSelector,
	      addHoverClassToBarGroup
	    );

	    el.off(
	      'mouseleave',
	      _barGroupAndLabelsSelector,
	      removeHoverClassFromBarGroup
	    );

	    _chartElement.off(
	      'mouseleave',
	      removeHoverClassFromBarGroup
	    );

	    if (_interactive) {

	      el.off(
	        'click',
	        _barGroupAndLabelsSelector,
	        selectDatum
	      );

	      el.off(
	        'click',
	        _truncationMarkerSelector,
	        expandVisualization
	      );

	      el.off(
	        'mouseup',
	        _nonDefaultSelectedLabelSelector,
	        removeHoverClassFromBarGroup
	      );
	    }
	  }

	  function selectDatum(event) {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
	      {
	        name: d3.select(event.currentTarget).datum()[NAME_INDEX]
	      }
	    );
	  }

	  function expandVisualization() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_EXPANSION',
	      {
	        expanded: true
	      }
	    );
	  }

	  function showFlyout(event) {
	    var datum = d3.select(event.currentTarget).datum();
	    var barGroupName = _toEscapedString(datum[NAME_INDEX]);
	    var barGroupElement = _chartWrapper.
	      find('.bar-group').
	      filter(function(index, el) { return el.getAttribute('data-bar-name') === barGroupName; }).
	      find('.unfiltered').
	      get(0);
	    var unfilteredValueUnit;
	    var filteredValueUnit;

	    if (datum[UNFILTERED_INDEX] === 1) {

	      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
	        _lastRenderOptions.unit.one :
	        vif.unit.one;

	    } else {

	      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
	        _lastRenderOptions.unit.other :
	        vif.unit.other;

	    }

	    if (datum[FILTERED_INDEX] === 1) {

	      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
	        _lastRenderOptions.unit.one :
	        vif.unit.one;

	    } else {

	      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
	        _lastRenderOptions.unit.other :
	        vif.unit.other;

	    }

	    var payload = {
	      element: barGroupElement,
	      title: _labelValueOrPlaceholder(datum[NAME_INDEX]),
	      unfilteredValueLabel: self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL'),
	      unfilteredValue: '{0} {1}'.format(
	        utils.formatNumber(datum[UNFILTERED_INDEX]),
	        unfilteredValueUnit
	      ),
	      selectedNotice: self.getLocalization('FLYOUT_SELECTED_NOTICE'),
	      selected: datum[SELECTED_INDEX]
	    };

	    if (_lastRenderOptions.showFiltered) {

	      payload.filteredValueLabel = self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL');
	      payload.filteredValue = '{0} {1}'.format(
	        utils.formatNumber(datum[FILTERED_INDEX]),
	        filteredValueUnit
	      );
	    }

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
	      payload
	    );
	  }

	  function hideFlyout() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
	      null
	    );
	  }

	  function addHoverClassToBarGroup(event) {
	    var datum = d3.select(event.currentTarget).datum();
	    var barName = _toEscapedString(datum[NAME_INDEX]);

	    _chartWrapper.
	      find('.bar-group').
	      filter(function(index, el) { return el.getAttribute('data-bar-name') === barName; }).
	      addClass('highlight');
	  }

	  function removeHoverClassFromBarGroup() {
	    _chartWrapper.find('.bar-group').removeClass('highlight');
	  }

	  /**
	   * Visualization renderer and helper functions
	   */

	  function _renderData(el, data, options) {

	    // Cache dimensions and options
	    var chartWidth = el.width();
	    var chartHeight = el.height();
	    var showAllLabels = options.showAllLabels;
	    var showFiltered = options.showFiltered;

	    if (chartWidth <= 0 || chartHeight <= 0) {
	      if (window.console && window.console.warn) {
	        console.warn('Aborted rendering column chart: chart width or height is zero.');
	      }
	      return;
	    }

	    if (showAllLabels) {
	      _chartElement.addClass('show-all-labels');
	    } else {
	      _chartElement.removeClass('show-all-labels');
	    }

	    if (showFiltered) {
	      _chartWrapper.addClass('filtered');
	    } else {
	      _chartWrapper.removeClass('filtered');
	    }

	    /**
	     * Implementation begins here
	     */

	    var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
	    var bottomMargin; // Calculated based on label text length
	    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization
	    var numberOfDefaultLabels = showAllLabels ? data.length : 3;
	    var maximumBottomMargin = 140;
	    var d3Selection = d3.select(_chartWrapper.get(0));
	    // The `_.property(NAME_INDEX)` below is equivalent to `function(d) { return d[NAME_INDEX]; }`
	    var barGroupSelection = d3Selection.selectAll('.bar-group').data(data, _.property(NAME_INDEX));
	    var labelSelection = d3.select(_chartLabels[0]).selectAll('.label');
	    var chartTruncated = false;
	    var truncationMarkerWidth = _truncationMarker.width();
	    var fixedLabelWidth = 15.5;

	    var horizontalScaleDetails = _computeHorizontalScale(chartWidth, data, showAllLabels);
	    var horizontalScale = horizontalScaleDetails.scale;
	    chartTruncated = horizontalScaleDetails.truncated;
	    var rangeBand = Math.ceil(horizontalScale.rangeBand());
	    var chartScrollTop = _chartScroll.offset().top - el.offset().top;

	    // Compute chart margins
	    if (showAllLabels) {

	      var maxLength = _.max(data.map(function(item) {
	        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
	        return _labelValueOrPlaceholder(item[NAME_INDEX]).visualLength('1rem');
	      }));
	      bottomMargin = Math.floor(Math.min(
	        maxLength + $.relativeToPx('1rem'),
	        $.relativeToPx(fixedLabelWidth + 1 + 'rem')
	      ) / Math.sqrt(2));

	      chartTruncated = false;

	    } else {

	      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');

	      // Do not compensate for chart scrollbar if only showing 3 labels (scrollbar would not exist)
	      horizontalScrollbarHeight = 0;
	    }

	    // Clamp the bottom margin to a reasonable maximum since long labels are ellipsified.
	    bottomMargin = bottomMargin > maximumBottomMargin ? maximumBottomMargin : bottomMargin;

	    var innerHeight = Math.max(0, chartHeight - topMargin - bottomMargin - horizontalScrollbarHeight);

	    // If not all labels are visible, limit our vert scale computation to what's actually
	    // visible. We still render the bars outside the viewport to speed up horizontal resizes.
	    var chartDataRelevantForVerticalScale = showAllLabels ?
	      data : _.take(data, Math.ceil(chartWidth / rangeBand) + 1);
	    var verticalScale = _computeVerticalScale(innerHeight, chartDataRelevantForVerticalScale, showFiltered);

	    var chartLeftOffset = horizontalScale.range()[0];
	    var chartRightEdge = chartWidth - chartLeftOffset;

	    _chartWrapper.css('height', innerHeight + topMargin + 1);
	    _chartScroll.css({
	      'padding-top': 0,
	      'padding-bottom': bottomMargin,
	      'top': 'initial',
	      'width': chartWidth,
	      'height': innerHeight + topMargin + horizontalScrollbarHeight
	    });

	    var _renderTicks = function() {
	      // The `+ 3` term accounts for the border-width.
	      var tickHeight = parseInt(el.css('font-size'), 10) + 3;
	      var numberOfTicks = 3;
	      // We need to ensure that there is always a '0' tick mark, so we concat
	      // the calculated ticks with '0' and then take the unique values. This
	      // could potentially give us 4 overall tick marks, since the way that d3
	      // decides which ticks to draw is a little opaque.
	      var uniqueTickMarks = _.uniq(
	        [0].concat(verticalScale.ticks(numberOfTicks))
	      ).sort(
	        function(a, b) {
	          return a >= b;
	        }
	      );

	      var tickMarks = uniqueTickMarks.map(
	        function(tickValue, index) {

	          var tick = $('<div>', {
	            'class': tickValue === 0 ? 'tick origin' : 'tick',
	            text: utils.formatNumber(tickValue)
	          });
	          var tickTopOffset = innerHeight - verticalScale(tickValue);

	          // If this is the 'top' tick (which will be the last one since they
	          // are sorted ascendingly, then we want to draw the label beneath the
	          // tick instead of above it. This is mainly to match the behavior of
	          // the timeline chart, which is a little less flexible in how it
	          // chooses and renders y-scale ticks.
	          if (index === uniqueTickMarks.length - 1) {
	            tickTopOffset += tickHeight;
	            tick.addClass('below');
	          }

	          tick.attr('style', 'top: {0}px'.format(tickTopOffset));

	          return tick;
	        }
	      );
	      var ticksStyle = 'top: {0}px; width: {1}px; height: {2}px;'.format(
	        chartScrollTop + topMargin,
	        chartWidth,
	        innerHeight + topMargin
	      );

	      return $('<div>', {
	        'class': 'ticks',
	        style: ticksStyle
	      }).append(tickMarks);
	    };

	    var updateLabels = function(label) {

	      /**
	       * Labels come in two sets of column names:
	       *
	       * - Default labels. If showAllLabels is true, this consists of one
	       *   label per bar. Otherwise, only 3 labels are shown.
	       *
	       * - Selected labels. Contains the names of columns which are selected.
	       */
	      var defaultLabelData = _.take(data, numberOfDefaultLabels);
	      var selectedLabelData = data.filter(
	        function(datum) {
	          return datum[SELECTED_INDEX] === true;
	        }
	      );
	      var labelData = _.union(defaultLabelData, selectedLabelData);
	      var labelOrientationsByIndex = [];

	      if (selectedLabelData.length > 1) {
	        throw new Error('Multiple selected labels not supported yet in column chart');
	      }

	      function isOnlyInSelected(datum, index) {
	        return datum[SELECTED_INDEX] && index >= numberOfDefaultLabels;
	      }

	      function preComputeLabelOrientation(datum, index) {

	        var leftHanded = false;

	        if (!showAllLabels) {

	          var labelWidth = $(this).find('.contents').width();
	          var proposedLeftOfText = horizontalScale(datum[NAME_INDEX]);

	          var rangeMagnitude = (chartRightEdge - chartLeftOffset);

	          var spaceAvailableOnLeft = (proposedLeftOfText - chartLeftOffset);

	          var spaceAvailableOnRight = rangeMagnitude -
	            proposedLeftOfText -
	            chartLeftOffset;

	          var spaceRemainingOnRight = (spaceAvailableOnRight - labelWidth);

	          leftHanded = (spaceRemainingOnRight <= 10) &&
	            (spaceAvailableOnLeft > spaceAvailableOnRight);
	        }

	        labelOrientationsByIndex[index] = leftHanded;

	      }

	      function labelOrientationLeft(datum, index) {
	        return labelOrientationsByIndex[index];
	      }

	      function labelOrientationRight(datum, index) {
	        return !labelOrientationsByIndex[index];
	      }

	      var centering = chartLeftOffset - rangeBand / 2;
	      var verticalPositionOfSelectedLabelRem = 2;
	      var labelMargin = showAllLabels ? 0 : 0.75;
	      var selectedLabelMargin = -0.4;
	      // The `_.property(NAME_INDEX)` below is equivalent to `function(d) { return d[NAME_INDEX]; }`
	      var labelDivSelection = label.data(labelData, _.property(NAME_INDEX));

	      var labelDivSelectionEnter = labelDivSelection.
	        enter().
	        append('div').
	        classed('label', true).
	        classed('non-default', isOnlyInSelected).
	        attr('data-bar-name', function(d) {
	          return _toEscapedString(_labelValueOrPlaceholder(d[NAME_INDEX]));
	        });

	      // For new labels, add a contents div containing a span for the filter icon,
	      // a span for the label text, and a span for the clear filter icon.
	      // The filter icon and close icon are toggled via CSS classes.
	      var labelText = labelDivSelectionEnter.append('div').classed('contents', true);
	      labelText.append('span').classed('icon-filter', true);
	      labelText.append('span').classed('text', true);
	      labelText.append('span').classed('icon-close', true);

	      labelDivSelectionEnter.append('div').classed('callout', true);

	      // Bind data to child spans
	      labelDivSelection.each(function(d) {
	        d3.select(this).selectAll('span').datum(d);
	      });

	      labelDivSelection.
	        select('.contents').
	          style('top', function(d, i) {
	            var topOffset;

	            if (showAllLabels) {
	              topOffset = 0;
	            } else if (isOnlyInSelected(d, i)) {
	              topOffset = verticalPositionOfSelectedLabelRem;
	            } else {
	              topOffset = defaultLabelData.length - 0.5 - Math.min(i, numberOfDefaultLabels - 1);
	            }

	            return '{0}rem'.format(topOffset);
	          }).
	          classed('undefined', function(d) {
	            return _labelValueOrPlaceholder(d[NAME_INDEX]) === self.getLocalization('NO_VALUE');
	          }).
	          select('.text').
	            text(function(d) {
	              return _labelValueOrPlaceholder(d[NAME_INDEX]);
	            });

	      labelDivSelection.
	        select('.callout').
	          style('height', function(d, i) {

	            // Slanted labels have auto height.
	            if (showAllLabels) {
	              return '';
	            } else {
	              if (isOnlyInSelected(d, i)) {
	                return verticalPositionOfSelectedLabelRem + 'rem';
	              } else {
	                return (defaultLabelData.length - i - (d[SELECTED_INDEX] ? 0.75 : 0)) + 'rem';
	              }
	            }
	          }).

	          // Hide the '.callout' if there is no room for it
	          style('display', function(d) {
	            var scaleOffset = horizontalScale(d[NAME_INDEX]) - centering - 1;

	            if (scaleOffset >= chartWidth) {
	              return 'none';
	            }
	          });

	      // For each label, re-compute their orientations and set all left and
	      // right offsets.
	      labelDivSelection.
	        classed('orientation-left', false).
	        classed('orientation-right', false).
	        each(preComputeLabelOrientation).
	        classed('orientation-left', labelOrientationLeft).
	        classed('orientation-right', labelOrientationRight).
	        classed('dim', function(d) {
	          return selectedLabelData.length > 0 && !d[SELECTED_INDEX];
	        }).
	        classed('selected', function(d) { return d[SELECTED_INDEX]; }).
	        each(function(d) {

	          var $this = $(this);

	          // Save references to all d3 selections.
	          var labelSel = d3.select(this);
	          var labelContentSelection = labelSel.select('.contents');
	          var labelTextSelection = labelContentSelection.select('.text');

	          var labelLeftOffset = 0;
	          var labelRightOffset = 0;
	          var labelContentLeftOffset;
	          var labelContentRightOffset;
	          var isSelected = d[SELECTED_INDEX];
	          var scaleOffset = horizontalScale(d[NAME_INDEX]) - centering - 1;
	          var noRoomForCallout = scaleOffset >= chartWidth && isSelected && !showAllLabels;
	          var leftOriented = $this.hasClass('orientation-left');
	          var labelIconPadding = 30;
	          var halfWidthOfCloseIcon;
	          var textMaxWidth;
	          var labelSelectionStyle;
	          var desiredLabelContentLeft = '';
	          var desiredLabelContentRight = '';
	          var labelTextSelectionStyle;

	          // Logic for setting label and content offsets and text max widths.
	          if (showAllLabels || !isSelected) {
	            labelLeftOffset = scaleOffset;
	            labelContentLeftOffset = labelMargin;
	          } else if (leftOriented) {
	            halfWidthOfCloseIcon = ($this.find('.icon-close').width() / 2) - 1;
	            labelRightOffset = chartRightEdge - scaleOffset;
	            labelContentRightOffset = -halfWidthOfCloseIcon;
	            textMaxWidth = scaleOffset - labelIconPadding;
	          } else {
	            labelLeftOffset = scaleOffset;
	            labelContentLeftOffset = selectedLabelMargin;
	            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
	          }

	          if (!isSelected && !showAllLabels) {
	            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
	          }

	          if (noRoomForCallout) {
	            labelRightOffset = 0;
	            labelContentLeftOffset = 0;
	            labelContentRightOffset = 0;
	            textMaxWidth = chartWidth - labelIconPadding;
	          }

	          // Apply styles
	          labelSelectionStyle = 'left: {0}px; right: {1}px;'.format(labelLeftOffset, labelRightOffset);
	          if (labelSel.attr('style') !== labelSelectionStyle) {
	            labelSel.attr('style', labelSelectionStyle);
	          }

	          if (!_.isUndefined(labelContentLeftOffset)) {
	            desiredLabelContentLeft = '{0}rem'.format(labelContentLeftOffset);
	          }

	          if (!_.isUndefined(labelContentRightOffset)) {
	            desiredLabelContentRight = '{0}px'.format(labelContentRightOffset);
	          }

	          // Calls to .style() in this section were costing about 150ms per render,
	          // even if nothing changed about the style.
	          // We need to avoid even calling .style() if nothing changed. We accomplish
	          // this by storing details of the last-rendered style in data attributes,
	          // which are fast to read.
	          if (labelContentSelection.attr('data-left') !== desiredLabelContentLeft) {
	            labelContentSelection.style('left', desiredLabelContentLeft);
	            labelContentSelection.attr('data-left', desiredLabelContentLeft);
	          }
	          if (labelContentSelection.attr('data-right') !== desiredLabelContentRight) {
	            labelContentSelection.style('right', desiredLabelContentRight);
	            labelContentSelection.attr('data-right', desiredLabelContentRight);
	          }

	          labelTextSelectionStyle = 'max-width: {0}px;'.format(textMaxWidth);

	          if (labelTextSelection.attr('style') !== labelTextSelectionStyle) {
	            labelTextSelection.attr('style', labelTextSelectionStyle);
	          }
	        });

	      labelDivSelection.exit().remove();
	    };

	    var horizontalBarPosition = function(d) {
	      return horizontalScale(d[NAME_INDEX]) - chartLeftOffset;
	    };

	    var updateBars = function(selection) {
	      // Bars are composed of a bar group and two bars (total and filtered).

	      // ENTER PROCESSING

	      // Create bar groups.
	      selection.enter().
	        append('div').
	          classed('bar-group', true);

	      // Create 2 bars, total and filtered. Filtered bars default to 0 height if there is no data for them.
	      // The smaller bar needs to go on top of the other. However, if the bar on top is also the total (can
	      // happen for aggregations other than count), the top bar needs to be semitransparent.
	      // This function transforms each piece of data (containing filtered and total amounts) into
	      // an ordered pair of objects representing a bar. The order is significant and ultimately determines the
	      // order of the bars in the dom.
	      // Each object in the pair looks like:
	      // {
	      //    isTotal: [boolean, is this bar representing the total value?],
	      //    value: [number, the numerical value this bar should represent]
	      // }
	      function makeBarData(d) {
	        // If we're not showing the filtered value, just render it zero height.
	        var filtered = showFiltered ? d[FILTERED_INDEX] : 0;

	        // Figure out if the totals bar is on top. This controls styling.
	        var totalIsOnTop;
	        if (d[UNFILTERED_INDEX] * filtered < 0) {
	          // Opposite signs. Setting total on top by convention (makes styles easier).
	          totalIsOnTop = true;
	        } else {
	          // Same sign.
	          totalIsOnTop = Math.abs(d[UNFILTERED_INDEX]) >= Math.abs(filtered);
	        }

	        if (totalIsOnTop) {

	          return [
	            {
	              isTotal: true,
	              value: d[UNFILTERED_INDEX]
	            },
	            {
	              isTotal: false,
	              value: filtered
	            }
	          ];

	        } else {

	          return [
	            {
	              isTotal: false,
	              value: filtered
	            },
	            {
	              isTotal: true,
	              value: d[UNFILTERED_INDEX]
	            }
	          ];

	        }
	      }
	      var bars = selection.selectAll('.bar').data(makeBarData);

	      // Bars are just a div.
	      bars.enter().
	        append('div');

	      // UPDATE PROCESSING
	      // Update the position of the groups.
	      selection.
	        attr('data-bar-name', function(d) {
	          return _toEscapedString(_labelValueOrPlaceholder(d[NAME_INDEX]));
	        }).
	        style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
	        style('width', rangeBand + 'px').
	        style('height', function() { return innerHeight + 'px'; }).
	        classed('unfiltered-on-top', function(d) {
	          // This is really confusing. In CSS, we refer to the total bar as the unfiltered bar.
	          // If total bar is last in the dom, then apply this class.
	          return makeBarData(d)[1].isTotal;
	        }).
	        classed('selected', function(d) { return d[SELECTED_INDEX]; }).
	        classed('active', function(d) { return showAllLabels || horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

	      // Update the position of the individual bars.
	      bars.
	        style('width', rangeBand + 'px').
	        style('height', function(d) {

	          if (_.isNaN(d.value)) {
	            return 0;
	          }

	          return Math.max(
	            d.value === 0 ? 0 : 1,  // Always show at least one pixel for non-zero-valued bars.
	            Math.abs(verticalScale(d.value) - verticalScale(0))
	          ) + 'px';
	        }).
	        style('bottom', function(d) {

	          if (_.isNaN(d.value)) {
	            return 0;
	          }

	          return verticalScale(Math.min(0, d.value)) + 'px';
	        }).
	        classed('bar', true).
	        classed('unfiltered', _.property('isTotal')).
	        classed('filtered', function(d) { return !d.isTotal; });

	      // EXIT PROCESSING
	      bars.exit().remove();
	      selection.exit().remove();
	    };

	    barGroupSelection.call(updateBars);
	    labelSelection.call(updateLabels);

	    _chartElement.children('.ticks').remove();
	    _chartElement.prepend(_renderTicks());

	    // Set "Click to Expand" truncation marker + its tooltip
	    _truncationMarker.css({
	      top: innerHeight,
	      display: chartTruncated ? 'block' : 'none'
	    });
	  }

	  // To string and escape backslashes and quotes
	  function _toEscapedString(value) {
	    return String(value).
	      replace(/\\/g, '\\\\').
	      replace(/"/g, '\\\"');
	  }

	  function _labelValueOrPlaceholder(value, placeholder) {

	    var placeholderText = placeholder || self.getLocalization('NO_VALUE');
	    var valueText;

	    if ($.isNumeric(value)) {
	      return value;
	    } else if (_.isNaN(value)) {
	      return placeholderText;
	    }

	    if (_.isBoolean(value)) {
	      valueText = value.toString();
	    }

	    valueText = String(value) || '';

	    return utils.valueIsBlank(valueText.trim().escapeSpaces()) ?
	      placeholderText :
	      valueText;
	  }

	  function _computeDomain(chartData, showFiltered) {

	    var allData = chartData.map(function(d) { return d[UNFILTERED_INDEX]; }).concat(
	      (showFiltered) ?
	        chartData.map(function(d) { return d[FILTERED_INDEX]; }) :
	        []
	    );

	    function _makeDomainIncludeZero(domain) {
	      var min = domain[0];
	      var max = domain[1];
	      if (min > 0) { return [ 0, max ]; }
	      if (max < 0) { return [ min, 0]; }
	      return domain;
	    }

	    return _makeDomainIncludeZero(d3.extent(allData));
	  }

	  function _computeVerticalScale(innerHeight, chartData, showFiltered) {
	    return d3.scale.linear().domain(_computeDomain(chartData, showFiltered)).range([0, innerHeight]);
	  }

	  function _computeHorizontalScale(chartWidth, chartData, showAllLabels) {

	    // Horizontal scale configuration
	    var barPadding = 0.25;
	    var minBarWidth = 0;
	    var maxBarWidth = 0;
	    var minSmallCardBarWidth = 8;
	    var maxSmallCardBarWidth = 30;
	    var minExpandedCardBarWidth = 15;
	    var maxExpandedCardBarWidth = 40;
	    // End configuration

	    var horizontalScale;
	    var numberOfBars = chartData.length;
	    var isChartTruncated = false;
	    var rangeBand;

	    if (showAllLabels) {
	      minBarWidth = minExpandedCardBarWidth;
	      maxBarWidth = maxExpandedCardBarWidth;
	    } else {
	      minBarWidth = minSmallCardBarWidth;
	      maxBarWidth = maxSmallCardBarWidth;
	    }

	    var _computeChartDimensionsForRangeInterval = function(rangeInterval) {

	      horizontalScale = d3.scale.ordinal().rangeBands(
	        [0, Math.ceil(rangeInterval)], barPadding).domain(chartData.map(function(d) { return d[NAME_INDEX]; })
	      );
	      rangeBand = Math.ceil(horizontalScale.rangeBand());
	    };

	    _computeChartDimensionsForRangeInterval(chartWidth);

	    /**
	     * According to the D3 API reference for Ordinal Scales#rangeBands
	     * (https://github.com/mbostock/d3/wiki/Ordinal-Scales#ordinal_rangeBands):
	     *
	     * For the method `ordinal.rangeBands(barWidth[, barPadding[, outerPadding]]) = rangeInterval`
	     * `barPadding` corresponds to the amount of space in the `rangeInterval` as a percentage of
	     * `rangeInterval` (width in px):
	     *
	     * => rangeInterval = barPadding * rangeInterval + numberOfBars * barWidth
	     * => (1 - barPadding) * rangeInterval = numberOfBars * barWidth
	     * => rangeInterval = (numberOfBars * barWidth) / (1 - barPadding)
	     */
	    if (rangeBand < minBarWidth) {
	      // --> desired rangeBand (bar width) is less than accepted minBarWidth
	      // use computeChartDimensionsForRangeInterval to set rangeBand = minBarWidth
	      // and update horizontalScale accordingly
	      _computeChartDimensionsForRangeInterval(minBarWidth * numberOfBars / (1 - barPadding));
	      isChartTruncated = true;
	    } else if (rangeBand > maxBarWidth) {
	      // --> desired rangeBand (bar width) is greater than accepted maxBarWidth
	      // use computeChartDimensionsForRangeInterval to set rangeBand = maxBarWidth
	      _computeChartDimensionsForRangeInterval(maxBarWidth * numberOfBars / (1 - barPadding) + maxBarWidth * barPadding);
	    }

	    return {
	      scale: horizontalScale,
	      truncated: isChartTruncated
	    };
	  }
	}

	module.exports = ColumnChart;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var Visualization = __webpack_require__(10);
	var _ = __webpack_require__(9);

	module.exports = function Pager(element, vif) {
	  _.extend(this, new Visualization(element, vif));

	  var self = this;
	  var _lastRenderOptions;

	  utils.assertHasProperties(vif,
	    'configuration.localization.PREVIOUS',
	    'configuration.localization.NEXT',
	    'configuration.localization.NO_ROWS',
	    'configuration.localization.ONLY_ROW',
	    'configuration.localization.MANY_ROWS',
	    'unit.one',
	    'unit.other'
	  );

	  _attachEvents(this.element);

	  /**
	   * Public Methods
	   */

	  this.render = function(options) {
	    if (_.isEqual(options, _lastRenderOptions)) {
	      return;
	    }

	    _lastRenderOptions = options;

	    _render(options);
	  };

	  this.destroy = function() {
	    _detachEvents(this.element);
	    this.element.find('.socrata-pager').remove();
	  };

	  /**
	   * Private Methods
	   */

	  function _templatePagerLabel(options) {
	    var message;
	    var endIndex = Math.min(options.datasetRowCount, options.endIndex);

	    if (options.datasetRowCount === 0) {
	      message = vif.configuration.localization.NO_ROWS;
	    } else if (options.endIndex === options.startIndex + 1) {
	      message = vif.configuration.localization.ONLY_ROW;
	    } else {
	      message = vif.configuration.localization.MANY_ROWS;
	    }

	    message = message.format({
	      unitOne: vif.unit.one,
	      unitOther: vif.unit.other,
	      firstRowOrdinal: options.datasetRowCount ? utils.commaify(options.startIndex + 1) : undefined,
	      lastRowOrdinal: options.datasetRowCount ? utils.commaify(endIndex) : undefined,
	      datasetRowCount: utils.commaify(options.datasetRowCount)
	    });

	    return '<span class="pager-label">{0}</span>'.format(message);
	  }

	  function _templatePagerButtons(options) {
	    var template = [
	      '<span class="pager-buttons">',
	        '<button{previousDisabled} class="pager-button-previous"><span class="icon-arrow-left"></span> {previous}</button>',
	        '<button{nextDisabled} class="pager-button-next">{next} <span class="icon-arrow-right"></span></button>',
	      '</span>'
	    ].join('\n');

	    return template.format({
	      previous: vif.configuration.localization.PREVIOUS,
	      next: vif.configuration.localization.NEXT,
	      previousDisabled: (options.disabled || options.startIndex === 0) ? ' disabled' : '',
	      nextDisabled: (options.disabled || options.endIndex >= options.datasetRowCount - 1) ? ' disabled' : ''
	    });
	  }

	  function _templatePager(options) {
	    return [
	      '<div class="socrata-pager">',
	        _templatePagerButtons(options),
	        _templatePagerLabel(options),
	      '</div>'
	    ].join('\n');
	  }

	  function _render(options) {
	    var $template = $(_templatePager(options));
	    self.element.find('.socrata-pager').remove(); // Enhancement: Incremental updates (vs. rerender every time).
	    self.element.append($template);
	  }

	  function _attachEvents() {
	    self.element.on('click', '.pager-buttons .pager-button-previous', _handlePrevious);
	    self.element.on('click', '.pager-buttons .pager-button-next', _handleNext);
	  }

	  function _detachEvents() {
	    self.element.off('click', '.pager-buttons .pager-button-previous', _handlePrevious);
	    self.element.off('click', '.pager-buttons .pager-button-next', _handleNext);
	  }

	  function _handleNext() {
	    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_NEXT');
	  }

	  function _handlePrevious() {
	    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');
	  }
	};


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var Visualization = __webpack_require__(10);
	var d3 = __webpack_require__(4);
	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);

	var Constants = {
	  TIMELINE_CHART_MARGIN: {
	    TOP: 0,
	    RIGHT: 0,
	    BOTTOM: 30,
	    LEFT: 0
	  },
	  TIMELINE_CHART_NUMBER_OF_TICKS: 3,
	  TIMELINE_CHART_TICK_SIZE: 3,
	  TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN: 50,
	  TIMELINE_CHART_GUTTER: 15,
	  TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET: 11,
	  TIMELINE_CHART_DRAG_HANDLE_WIDTH: 24,
	  TIMELINE_CHART_MIN_LABEL_WIDTH: 150,
	  TIMELINE_CHART_REQUIRED_LABEL_WIDTH: 50
	};

	var DateHelpers = {
	  serializeFloatingTimestamp: utils.serializeFloatingTimestamp,
	  deserializeFloatingTimestamp: utils.deserializeFloatingTimestamp,
	  decrementDateByHalfInterval: function(date, interval) {

	    var newDate;

	    switch (interval.toUpperCase()) {
	      case 'DECADE':
	        newDate = moment(date).subtract(5, 'year').toDate();
	        break;
	      case 'YEAR':
	        newDate = moment(date).subtract(6, 'month').toDate();
	        break;
	      case 'MONTH':
	        newDate = moment(date).subtract(15, 'day').toDate();
	        break;
	      case 'DAY':
	        newDate = moment(date).subtract(12, 'hour').toDate();
	        break;
	      default:
	        throw new Error(
	          'Cannot decrement date by dataset precision: invalid interval "{0}"'.
	          format(interval)
	        );
	    }

	    return newDate;
	  },

	  incrementDateByHalfInterval: function(date, interval) {

	    var newDate;

	    switch (interval.toUpperCase()) {
	      case 'DECADE':
	        newDate = moment(date).add(5, 'year').toDate();
	        break;
	      case 'YEAR':
	        newDate = moment(date).add(6, 'month').toDate();
	        break;
	      case 'MONTH':
	        newDate = moment(date).add(15, 'day').toDate();
	        break;
	      case 'DAY':
	        newDate = moment(date).add(12, 'hour').toDate();
	        break;
	      default:
	        throw new Error(
	          'Cannot increment date by dataset precision: invalid interval "{0}"'.
	          format(interval)
	        );
	    }

	    return newDate;

	  }
	};

	/*
	KNOWN BUGS

	1. The heuristic by which we decide when to display only some labels is
	   pretty neat.

	TERMINOLOGY

	'selection' is the yellow region when the visualization is being filtered.
	'highlight' is the white region that follows the cursor.
	'filter' is the mechanism by which queries are altered.
	*/

	function TimelineChart(element, vif) {

	  _.extend(this, new Visualization(element, vif));

	  var self = this;

	  utils.assertHasProperty(vif, 'configuration');

	  var _chartElement;
	  var _chartWrapper;
	  var _lastRenderData;
	  var _lastRenderOptions;

	  var _interactive = vif.configuration.interactive === true;

	  _renderTemplate(this.element);
	  _attachEvents(this.element);

	  /**
	   * Public methods
	   */

	  this.render = function(data, options) {
	    _lastRenderData = data;
	    _lastRenderOptions = options;
	    // Eventually we may only want to pass in the VIF instead of other render
	    // options as well as the VIF, but for the time being we will just treat it
	    // as another property on `options`.
	    _renderData(_chartElement, data, options);
	  };

	  this.renderError = function() {
	    // TODO: Some helpful error message.
	  };

	  this.invalidateSize = function() {
	    if (_lastRenderData && _lastRenderOptions) {
	      _renderData(_chartElement, _lastRenderData, _lastRenderOptions);
	    }
	  };

	  this.destroy = function() {
	    _unattachEvents(this.element);
	    this.element.find('.timeline-chart-container').remove();
	  };

	  /**
	   * Private methods
	   */

	  function _renderTemplate(el) {

	    function divWithClass(clsName) {
	      return $(
	        '<div>',
	        {
	          'class': clsName
	        }
	      );
	    }

	    function $xml(namespace, nodeName, attributeMap) {
	      var xmlNode = document.createElementNS(namespace, nodeName);
	      _.each(attributeMap, function(value, key) {
	        xmlNode.setAttributeNS(null, key, value);
	      });
	      return $(xmlNode);
	    }

	    function $svg(nodeName, attributeMap) {
	      return $xml('http://www.w3.org/2000/svg', nodeName, attributeMap);
	    }

	    function svgWithClass(clsName) {
	      return $svg(
	        'svg',
	        {
	          'class': clsName
	        }
	      ).append(
	        $svg('g')
	      );
	    }

	    var yTicks = divWithClass('y-ticks');
	    var xTicks = divWithClass('x-ticks');
	    var datumLabel = divWithClass('datum-label');
	    var timelineUnfilteredMask = divWithClass('timeline-chart-unfiltered-mask').
	      append(svgWithClass('timeline-chart-unfiltered-visualization'));
	    var timelineFilteredMask = divWithClass('timeline-chart-filtered-mask').
	      append(svgWithClass('timeline-chart-filtered-visualization'));
	    var timelineSelectionMask = divWithClass('timeline-chart-selection-mask').
	      append(svgWithClass('timeline-chart-selection'));

	    var leftSelectionLine = $svg(
	      'line',
	      {
	        y1: '0',
	        y2: '100%'
	      }
	    );
	    var leftSelectionTriangle = $svg(
	      'path',
	      {
	        d: 'M0,0L-10,0L-10,8L0,16Z'
	      }
	    );
	    var leftSelectionRect = $svg(
	      'rect',
	      {
	        'class': 'selection-marker',
	        'data-selection-target': 'left',
	        'x': '-24',
	        'width': '24',
	        'height': '100%'
	      }
	    );

	    var leftSelectionGroup = $svg(
	      'g',
	      {
	        transform: 'translate(24, 0)'
	      }
	    ).append([
	      leftSelectionLine,
	      leftSelectionTriangle,
	      leftSelectionRect
	    ]);

	    var leftSelectionSvg = $svg('svg').append(leftSelectionGroup);
	    var leftSelectionMarker = divWithClass('timeline-chart-left-selection-marker').
	      append(leftSelectionSvg);

	    var rightSelectionLine = $svg(
	      'line',
	      {
	        y1: '0',
	        y2: '100%'
	      }
	    );
	    var rightSelectionTriangle = $svg(
	      'path',
	      {
	        d: 'M0,0L10,0L10,8L0,16Z'
	      }
	    );
	    var rightSelectionRect = $svg(
	      'rect',
	      {
	        'class': 'selection-marker',
	        'data-selection-target': 'right',
	        'x': '0',
	        'width': '24',
	        'height': '100%'
	      }
	    );

	    var rightSelectionGroup = $svg(
	      'g',
	      {
	        transform: 'translate(0,0)'
	      }
	    ).append([
	      rightSelectionLine,
	      rightSelectionTriangle,
	      rightSelectionRect
	    ]);

	    var rightSelectionSvg = $svg('svg').append(rightSelectionGroup);
	    var rightSelectionMarker = divWithClass('timeline-chart-right-selection-marker').
	      append(rightSelectionSvg);

	    var timelineHighlightContainer = svgWithClass('timeline-chart-highlight-container');
	    var timelineHighlightTarget = divWithClass('timeline-chart-highlight-target');
	    var timelineClearSelectionLabel = $(
	      '<span>',
	      {
	        'class': 'timeline-chart-clear-selection-label'
	      }
	    );

	    var chartWrapper = $(
	      '<div>',
	      {
	        'class': 'timeline-chart-wrapper'
	      }
	    ).append([
	      yTicks,
	      xTicks,
	      datumLabel,
	      timelineUnfilteredMask,
	      timelineFilteredMask,
	      timelineSelectionMask,
	      leftSelectionMarker,
	      rightSelectionMarker,
	      timelineHighlightContainer,
	      timelineHighlightTarget,
	      timelineClearSelectionLabel
	    ]);

	    var chartLabels = $(
	      '<div>',
	      {
	        'class': 'labels'
	      }
	    );

	    var chartScroll = $(
	      '<div>',
	      {
	        'class': 'chart-scroll'
	      }
	    ).append([
	      chartWrapper,
	      chartLabels
	    ]);

	    var chartElement = $(
	      '<div>',
	      {
	        'class': 'timeline-chart'
	      }
	    ).append(chartScroll);

	    var chartContainer = $(
	      '<div>',
	      {
	        'class': 'timeline-chart-container'
	      }
	    ).append(
	      chartElement
	    );

	    self.renderAxisLabels(chartContainer);

	    // Cache element selections
	    _chartElement = chartElement;
	    _chartWrapper = chartWrapper;

	    el.append(chartContainer);
	  }

	  function _attachEvents(el) {
	    if (vif.configuration.isMobile) {
	      el.on(
	        'click touchmove',
	        '.timeline-chart',
	        showFlyout
	      );
	    } else {
	      el.on(
	        'mouseenter mousemove',
	        '.timeline-chart',
	        showFlyout
	      );

	      el.on(
	        'mouseleave',
	        '.timeline-chart',
	        mouseHasLeftChart
	      );


	      if (_interactive) {
	        el.on(
	          'mousedown mouseup',
	          '.timeline-chart',
	          leftMouseButtonStateHasChanged
	        );

	        el.on(
	          'mousedown',
	          '.timeline-chart-clear-selection-label',
	          handleClearSelectionLabelMousedownEvent
	        );
	      }

	      el.on(
	        'mousemove',
	        '.timeline-chart-clear-selection-label',
	        showFlyout
	      );
	    }
	  }

	  function _unattachEvents(el) {
	    if (vif.configuration.isMobile) {
	      el.off(
	        'click touchmove',
	        '.timeline-chart',
	        showFlyout
	      );
	    } else {
	      el.off(
	        'mouseenter mousemove',
	        '.timeline-chart',
	        showFlyout
	      );

	      el.off(
	        'mouseleave',
	        '.timeline-chart',
	        hideFlyout
	      );

	      if (_interactive) {
	        el.off(
	          'mousedown mouseup',
	          '.timeline-chart',
	          leftMouseButtonStateHasChanged
	        );

	        el.off(
	          'mousedown',
	          '.timeline-chart-clear-selection-label',
	          handleClearSelectionLabelMousedownEvent
	        );
	      }

	      el.off(
	        'mousemove',
	        '.timeline-chart-clear-selection-label',
	        showFlyout
	      );
	    }
	  }

	  /**
	   * Visualization renderer and helper functions
	   */

	  function emitFlyoutEvent(payload) {
	    self.emitEvent('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', payload);
	  }

	  function showFlyout(event) {
	    mouseHasMoved(event, false);

	    if (currentlyDragging) {
	      return emitFlyoutEvent(null);
	    }

	    function formatValue(value) {
	      var rules = (_.has(_lastRenderOptions, 'unit')) ?
	        _lastRenderOptions.unit :
	        vif.unit;

	      utils.assertHasProperty(rules, 'other');

	      if (_.isNull(value) || !isFinite(value)) {
	        return 'No value';
	      }

	      value = Number(value);
	      utils.assert(!_.isNaN(value));

	      var resolve = function(rule) {
	        return '{0} {1}'.format(utils.formatNumber(value), rule);
	      };

	      if (value === 1 && rules.one) {
	        return resolve(rules.one);
	      } else {
	        return resolve(rules.other);
	      }
	    }

	    var payload = {
	      title: null,
	      unfilteredLabel: null,
	      unfilteredValue: null,
	      filteredLabel: null,
	      filteredValue: null,
	      filteredClass: null
	    };

	    var $target = $(event.target);

	    if ($target.is('.timeline-chart-clear-selection-button')) {

	      payload.title = 'Clear filter range';
	      payload.element = $target.get(0);

	      return emitFlyoutEvent(payload);

	    } else if (_interactive && $target.is('.selection-marker')) {

	      payload.title = 'Drag to change filter range';
	      payload.element = $target.get(0);

	      return emitFlyoutEvent(payload);

	    }

	    var flyoutTarget = _chartElement.find('.timeline-chart-flyout-target');

	    if (flyoutTarget.length === 0) {
	      return emitFlyoutEvent(null);
	    }

	    payload.element = flyoutTarget.get(0);

	    var isIntervalFlyout = $target.
	      is(flyoutIntervalTopSelectors.concat([flyoutIntervalPathSelector]).join(', '));
	    var isSelectionRendered = !_.isNull(selectionStartDate) &&
	      !_.isNull(selectionEndDate) &&
	      selectionIsCurrentlyRendered;

	    var datumIsDefined = !(_.isUndefined(currentDatum) || _.isNull(currentDatum));

	    if (isIntervalFlyout) {
	      return renderIntervalFlyout();
	    } else if (datumIsDefined) {
	      return renderDatumFlyout();
	    } else {
	      return;
	    }

	    function renderIntervalFlyout() {
	      var unfilteredValue = $target.attr('data-aggregate-unfiltered');
	      var filteredValue = $target.attr('data-aggregate-filtered');

	      payload.title = $target.attr('data-flyout-label');
	      payload.unfilteredValue = formatValue(unfilteredValue);
	      payload.unfilteredLabel = self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL');

	      var date = $target.attr('data-start');

	      // Using == for correct date comparison here.
	      var isWithinSelection = (date == selectionStartDate); // eslint-disable-line

	      if (!_.isUndefined(filteredValue) && (unfilteredValue !== filteredValue || isWithinSelection)) {
	        payload.filteredValue = formatValue(filteredValue);
	        payload.filteredLabel = self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL');
	      }

	      if (isSelectionRendered) {
	        payload.filteredBySelection = isWithinSelection;
	      }

	      emitFlyoutEvent(payload);
	    }

	    function renderDatumFlyout() {
	      if (currentDatum.hasOwnProperty('flyoutLabel')) {
	        payload.title = currentDatum.flyoutLabel;
	      } else {
	        var formatStrings = {
	          DECADE: 'YYYYs',
	          YEAR: 'YYYY',
	          MONTH: 'MMMM YYYY',
	          DAY: 'D MMMM YYYY'
	        };

	        payload.title = moment(currentDatum.date).format(formatStrings[datasetPrecision]);
	      }

	      payload.unfilteredValue = formatValue(currentDatum.unfiltered);
	      payload.unfilteredLabel = self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL');

	      var isWithinSelection = currentDatum.date >= selectionStartDate && currentDatum.date <= selectionEndDate;

	      if (isWithinSelection || currentDatum.unfiltered !== currentDatum.filtered) {
	        payload.filteredValue = formatValue(currentDatum.filtered);
	        payload.filteredLabel = self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL');
	      }

	      if (isSelectionRendered) {
	        payload.filteredBySelection = isWithinSelection;
	      }

	      emitFlyoutEvent(payload);
	    }
	  }

	  function hideFlyout() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_TIMELINE_FLYOUT',
	      null
	    );
	  }

	  // Cache a bunch of stuff that is useful in a lot of places that don't
	  // need to be wrapped in Rx mojo.
	  var cachedChartDimensions = null;
	  var cachedChartData = null;

	  // Keep track of whether or not the mouse position is within this
	  // instance of a timeline chart's visualization area (the chart itself
	  // and the x-axis labels beneath it).
	  var mousePositionWithinChartElement = false;
	  var mousePositionWithinChartDisplay = false;
	  var mousePositionWithinChartLabels = true;

	  // These two values are in pixels.
	  var visualizedDatumWidth = 0;
	  var halfVisualizedDatumWidth = 0;

	  // currentDatum is used to persist information about the highlighted
	  // region between the filterChartData and flyout rendering functions.
	  var currentDatum = null;

	  // datasetPrecision is used in multiple places in order to test and
	  // modify dates, but we only really have a notion of it within the
	  // context of Rx reactions; for this reason it's cached globally.
	  var datasetPrecision = null;

	  var labelPrecision = null;

	  // The X and Y scales that d3 uses are global to the directive so
	  // that we can use the same ones between the renderChart and
	  // renderChartHighlight functions.
	  // They are initialized to null so that we don't accidentally try
	  // to render a highlight before a chart is rendered.
	  var d3XScale = null;
	  var d3YScale = null;

	  // The following cached jQuery/d3 selectors are used throughout the
	  // directive.
	  var $body = $('body');
	  var $chartElement = _chartElement.find('.timeline-chart-wrapper');
	  var $highlightTargetElement = _chartElement.find('.timeline-chart-highlight-target');
	  var $chartSelectionElement = _chartElement.find('.timeline-chart-selection');
	  var $leftSelectionMarker = _chartElement.find('.timeline-chart-left-selection-marker');
	  var $rightSelectionMarker = _chartElement.find('.timeline-chart-right-selection-marker');
	  var $clearSelectionLabel = _chartElement.find('.timeline-chart-clear-selection-label');
	  var $datumLabel = _chartElement.find('.datum-label');
	  var d3ChartElement = d3.select($chartElement[0]);

	  // Keep track of the start and end of the selection.
	  var selectionStartDate = null;
	  var selectionEndDate = null;

	  // We use these two values to 'dirty check' changes
	  // to selectionStartDate and selectionEndDate and
	  // conditionally NOOP in the selection rendering
	  // code if what would be rendered has not changed.
	  var renderedSelectionStartDate = null;
	  var renderedSelectionEndDate = null;

	  var selectionIsCurrentlyRendered = false;

	  // Keep track of whether or not this instance of a timeline chart is in
	  // the 'dragging' state so that we can selectively listen for mouseup
	  // and apply the 'goalpost' selection area.
	  var currentlyDragging = false;

	  var allChartLabelsShown = true;

	  var flyoutIntervalPathSelector = '.datum-label';
	  var flyoutIntervalTopSelectors = [
	    '.x-tick-label',
	    '.timeline-chart-clear-selection-label'
	  ];

	  function _renderData(el, data, options) {

	    _chartElement.width(options.width);
	    _chartElement.height(options.height);

	    // Cache dimensions and options
	    var chartWidth = el.width();
	    var chartHeight = el.height();
	    var showAllLabels = options.showAllLabels;
	    var showFiltered = options.showFiltered;
	    var precision = options.precision;
	    var unit = options.unit;

	    if (chartWidth <= 0 || chartHeight <= 0) {
	      if (window.console && window.console.warn) {
	        console.warn('Aborted rendering timeline chart: chart width or height is zero.');
	      }
	      return;
	    }

	    utils.assert(precision);

	    if (showAllLabels) {
	      _chartElement.addClass('show-all-labels');
	    } else {
	      _chartElement.removeClass('show-all-labels');
	    }

	    if (showFiltered) {
	      _chartWrapper.addClass('filtered');
	    } else {
	      _chartWrapper.removeClass('filtered');
	    }

	    /**
	     * Basically just prepares the underlying chart data and then calls
	     * special functions that render the x-axis, the y-axis, unfiltered
	     * and filtered values.
	     */
	    function renderChart() {

	      var margin;
	      var width;
	      var height;

	      if (cachedChartDimensions.width <= 0 || cachedChartDimensions.height <= 0) {
	        return;
	      }

	      //
	      // Prepare dimensions used in chart rendering.
	      //
	      margin = Constants.TIMELINE_CHART_MARGIN;

	      // width and height do not include margins so that
	      // we can use the margins to render axis ticks.
	      width = cachedChartDimensions.width - margin.LEFT - margin.RIGHT;
	      height = cachedChartDimensions.height - margin.TOP - margin.BOTTOM;

	      // Set up the scales and the chart-specific stack and area functions.
	      // Also create the root svg element to which the other d3 functions
	      // will append elements.

	      // d3XScale is global to the directive so that we can
	      // access it without having to re-render.
	      d3XScale = d3.
	        time.
	        scale().
	        domain([
	          DateHelpers.decrementDateByHalfInterval(cachedChartData.minDate, datasetPrecision),
	          DateHelpers.incrementDateByHalfInterval(cachedChartData.maxDate, datasetPrecision)
	        ]).
	        range([0, width]);

	      // d3YScale is global to the directive so that we can
	      // access it without having to re-render.
	      d3YScale = d3.
	        scale.
	        linear().
	        domain([cachedChartData.minValue, cachedChartData.maxValue]).
	        range([height, 0]).
	        clamp(true);

	      // Render the x-axis.
	      renderChartXAxis();

	      // Render the y-axis. Since we eschew d3's built-in y-axis for a
	      // custom implementation this calls out to a separate function.
	      renderChartYAxis(
	        width,
	        height
	      );

	      // Render the unfiltered and filtered values of the chart.
	      renderChartUnfilteredValues();
	      renderChartFilteredValues();
	    }

	    // Render the chart
	    function cacheThenRender(chartDimensions, chartData, chartPrecision) {

	      var filter;

	      if (_.isUndefined(chartData) || _.isNull(chartData) || _.isUndefined(chartPrecision)) {
	        return;
	      }

	      // Because we are about to divide by the number of values in the
	      // provided chart data, we need to first check to make sure we
	      // won't try to divide by zero and throw an exception instead of
	      // rendering if that's the case.
	      utils.assertHasProperty(chartData, 'values.length');
	      if (chartData.values.length === 0) {
	        console.error('Failed to render timeline chart because it was given no values.');
	        return;
	      }

	      // Cache the datum width and half the datum width for use elsewhere
	      // instead of repeated recomputation.
	      visualizedDatumWidth = Math.floor(chartDimensions.width / chartData.values.length);
	      halfVisualizedDatumWidth = Math.floor(visualizedDatumWidth / 2);

	      // Update the cached value for dataset precision.
	      // This is global to the directive, but only updated here.
	      datasetPrecision = chartPrecision;

	      // Cache the row display unit for use in the flyout (which
	      // necessarily is handled outside the scope of this subscribeLatest
	      // and which probably shouldn't be wrapped in its own
	      // subscribeLatest or other combinator).

	      cachedChartDimensions = chartDimensions;
	      cachedChartData = chartData;

	      renderChart();
	      clearChartHighlight();

	      // Make sure we also re-render the chart selection if it is visible
	      // (such as in the case of a visualization re-render triggered by
	      // the window being resized).
	      if (selectionIsCurrentlyRendered) {
	        renderedSelectionStartDate = null;
	        renderedSelectionEndDate = null;
	        renderChartSelection();
	      }

	      // This was the original implementation to support filtering from data
	      // lens, but now that we are consolidating this functionality, we will
	      // probably want to deprecate this method in favor of:
	      //
	      // First: getting the VIF from the render options.
	      //
	      // Eventually: receiving the VIF instead of the render options.
	      if (_.isArray(options.activeFilters) && options.activeFilters.length > 0) {

	        filter = _.first(options.activeFilters);

	        selectionStartDate = filter.start;
	        selectionEndDate = filter.end;
	        renderChartSelection();
	        enterSelectedState();

	      // Re: the above, this is phase one of the transition to using the VIF to
	      // describe filter state. A second PR will be made to convert the render
	      // options into a VIF on its own.
	      } else if (options.vif) {

	        //derive selection start and end
	        var filtersOnThisColumn = options.
	          vif.
	          filters.
	          filter(function(filterComponent) {
	            return (
	              (filterComponent.columnName === options.vif.columnName) &&
	              (filterComponent.function === 'timeRange')
	            );
	          });

	        if (filtersOnThisColumn.length > 0) {

	          filter = filtersOnThisColumn[0];

	          selectionStartDate = new Date(filter.arguments.start);
	          selectionEndDate = new Date(filter.arguments.end);
	          renderChartSelection();
	          enterSelectedState();

	        }

	      } else {
	        enterDefaultState();
	      }
	    }

	    var dimensions = { width: chartWidth, height: chartHeight };

	    cacheThenRender(dimensions, data, precision, unit);

	    // TODO: React to active filters being cleared.
	  }

	  // These rendering functions are generated by a helper due to their
	  // high degree of similarity. The functions are decoupled so that we
	  // can independently update and manipulate the filtered values as
	  // selections are made.
	  var renderChartUnfilteredValues = generateChartValueRenderer({
	    valueTransformer: function(values) {
	      return [transformValuesForRendering(values)];
	    },
	    ySelector: function(d) { return d3YScale(d.unfiltered); },
	    svgSelector: 'svg.timeline-chart-unfiltered-visualization',
	    areaClass: 'context',
	    lineClass: 'context-trace'
	  });

	  var renderChartFilteredValues = generateChartValueRenderer({
	    valueTransformer: function(values) {
	      if (selectionIsCurrentlyRendered) {
	        return [];
	      } else {
	        return [transformValuesForRendering(values)];
	      }
	    },
	    ySelector: function(d) { return d3YScale(d.filtered); },
	    svgSelector: 'svg.timeline-chart-filtered-visualization',
	    areaClass: 'shaded',
	    lineClass: 'shaded-trace'
	  });

	  /* Use a function generator to DRY up very similar rendering functions.
	   * The specified opts object factors out the few bits where filtered and
	   * unfiltered chart rendering are different.
	   * @param {number} chartOpts
	   *   @property {function} valueTransformer - function for obtaining values
	   *   @property {function} ySelector - function for choosing correct y value
	   *   @property {string} svgSelector - selector fo SVG element
	   *   @property {string} areaClass - CSS class for area element
	   *   @property {string} lineClass - CSS class for line element
	   */
	  function generateChartValueRenderer(chartOpts) {

	    return function() {

	      var margin;
	      var values;
	      var line;
	      var area;
	      var svgChart;
	      var selection;

	      margin = Constants.TIMELINE_CHART_MARGIN;
	      values = chartOpts.valueTransformer(cachedChartData.values);

	      line = d3.
	        svg.
	        line().
	        defined(function(d) { return !_.isNull(d.unfiltered); }).
	        x(function(d) { return d3XScale(d.date); }).
	        y(chartOpts.ySelector);

	      area = d3.
	        svg.
	        area().
	        defined(line.defined()).
	        x(line.x()).
	        y0(function() { return d3YScale(0); }).
	        y1(line.y());

	      svgChart = d3ChartElement.
	        select(chartOpts.svgSelector).
	        attr('width', cachedChartDimensions.width).
	        attr('height', cachedChartDimensions.height).
	        select('g').
	        attr('transform', 'translate({0}, {1})'.format(margin.LEFT, margin.TOP));

	      selection = svgChart.
	        selectAll('path').
	        data(values);

	      selection.
	        enter().
	        append('path');

	      selection.
	        exit().
	        remove();

	      selection.
	        attr('class', chartOpts.areaClass).
	        attr('d', area);

	      svgChart.
	        append('path').
	        data(values).
	        attr('class', chartOpts.lineClass).
	        attr('d', line);
	    };
	  }

	  /**
	   * Similar to formatDateLabel but for ranges instead of discrete dates.
	   *
	   * @param {Date} startDate
	   * @param {Date} endDate
	   * @return {String} The formatteddate.
	   */
	  function formatDateRangeLabel(startDate, endDate) {

	    function numberOfMonthsDifferent(date1, date2) {
	      return moment(date2).diff(moment(date1), 'months', false);
	    }

	    function datesAreExactlyOneMonthDifferent(date1, date2) {
	      var exactlyOneMonthDifferent = true;

	      if (date2.getFullYear() !== date1.getFullYear() ||
	        date2.getMonth() - 1 !== date1.getMonth() ||
	        date2.getDate() !== date1.getDate()) {

	        exactlyOneMonthDifferent = false;
	      }
	      return exactlyOneMonthDifferent;
	    }

	    // This is the expected behavior: an interval of exactly two months
	    // should read 'Jan - Feb'.
	    var adjustedEndDate = DateHelpers.decrementDateByHalfInterval(endDate, datasetPrecision);
	    var difference;
	    var dateFormatPrecision;
	    var showRange = true;
	    var formattedStartDate;
	    var formattedEndDate;
	    var label;

	    switch (labelPrecision) {

	      case 'DECADE':
	        difference = endDate.getFullYear() - startDate.getFullYear();
	        // We should not show a range if only a single year is selected.
	        // Similarly, we should show exact years if the selection does
	        // not fall on exact decade-by-decade boundaries. Otherwise, we
	        // should show a decade-specific range, e.g. '1930s - 1940s'.
	        if (difference === 10 && (startDate.getFullYear() % 10 === 0)) {
	          showRange = false;
	        } else if (startDate.getFullYear() % 10 !== 0 || endDate.getFullYear() % 10 !== 0) {
	          dateFormatPrecision = 'YEAR';
	        }
	        break;

	      case 'YEAR':
	        difference = numberOfMonthsDifferent(startDate, endDate);
	        // We should still show the month-to-month label even if
	        // the interval is exactly one year in the case that the
	        // start date is not January--otherwise we see a 1-year
	        // span that, e.g., starts in June 2000 and ends in June
	        // 2001 still listed as '2000'.
	        if (difference === 12 && startDate.getMonth() === 0) {
	          showRange = false;
	        } else {
	          dateFormatPrecision = 'MONTH';
	        }
	        break;

	      case 'MONTH':
	        if (datesAreExactlyOneMonthDifferent(startDate, endDate) && startDate.getDate() === 1) {
	          showRange = false;
	        } else {
	          dateFormatPrecision = 'DAY';
	        }
	        break;

	      case 'DAY':
	        difference = moment.duration(moment(endDate) - moment(startDate)).asDays();
	        if (difference <= 1) {
	          showRange = false;
	        }
	        break;

	      default:
	        break;
	    }

	    formattedStartDate = formatDateLabel(startDate, false, dateFormatPrecision);
	    formattedEndDate = formatDateLabel(adjustedEndDate, false, dateFormatPrecision);

	    if (showRange && (formattedStartDate !== formattedEndDate)) {
	      label = '{0} - {1}'.format(formattedStartDate, formattedEndDate);
	    } else {
	      label = formattedStartDate;
	    }

	    return (_interactive) ?
	      '{0} <span class="timeline-chart-clear-selection-button">×</span>'.format(label) :
	      '{0}'.format(label);
	  }

	  /**
	   * Is probably the most complicated function in the directive
	   * simply because of all the special casing that needs to happen for
	   * sensible display of axis labels across multiple time intervals.
	   */
	  function renderChartXAxis() {

	    function deriveXAxisLabelPrecision() {

	      var domain;
	      var xAxisLabelPrecision;

	      domain = _.map(d3XScale.domain(), function(date) {
	        return moment(date);
	      });

	      xAxisLabelPrecision = 'DECADE';

	      // ...then use the domain to derive a timeline granularity.
	      if (moment(domain[0]).add(2, 'months').isAfter(domain[1])) {
	        xAxisLabelPrecision = 'DAY';
	      } else if (moment(domain[0]).add(2, 'years').isAfter(domain[1])) {
	        xAxisLabelPrecision = 'MONTH';
	      } else if (moment(domain[0]).add(20, 'years').isAfter(domain[1])) {
	        xAxisLabelPrecision = 'YEAR';
	      }

	      return xAxisLabelPrecision;
	    }

	    function deriveXAxisLabelDatumStep(allLabels) {

	      var numberOfLabels = allLabels.length;

	      // TIMELINE_CHART_REQUIRED_LABEL_WIDTH is the min
	      // width required for labels with month ("Oct 15")
	      var labelsWeHaveRoomFor = Math.floor(cachedChartDimensions.width /
	        Constants.TIMELINE_CHART_REQUIRED_LABEL_WIDTH);
	      var labelEveryN;

	      // TODO - write integration tests for the number of labels shown at given
	      // screen widths and ensuring that they are interactive.

	      // Show every label, every other label, etc...
	      if (numberOfLabels <= labelsWeHaveRoomFor) {
	        labelEveryN = 1;
	      } else if (numberOfLabels / 2 <= labelsWeHaveRoomFor) {
	        labelEveryN = 2;
	      } else if (numberOfLabels / 3 <= labelsWeHaveRoomFor) {
	        labelEveryN = 3;
	      } else if (numberOfLabels / 5 <= labelsWeHaveRoomFor) {
	        labelEveryN = 5;
	      } else {
	        labelEveryN = 7;
	      }

	      return labelEveryN;
	    }

	    // pxPerDay == pixelsPerDay
	    function recordLabel(allLabels, startDate, endDate, pxPerDay, shouldLabel) {
	      allLabels.push({
	        startDate: startDate,
	        endDate: endDate,
	        left: d3XScale(startDate) - halfVisualizedDatumWidth,
	        width: moment.duration(moment(endDate) - moment(startDate)).asDays() * pxPerDay,
	        shouldLabel: shouldLabel
	      });
	    }

	    var pixelsPerDay;
	    var jqueryAxisContainer;
	    var tickLocations = [];
	    var labels = [];
	    var thisDate;
	    var intervalStartDate = cachedChartData.values[0].date;
	    var intervalEndDate = null;
	    var maxDatePlusLabelPrecision;
	    var shouldLabelEveryN;

	    // This is half the width of each tick as defined in the accompanying CSS
	    var halfTickWidth = 2;
	    var jqueryAxisTick;
	    var dataAggregate;
	    var unfilteredAggregate;
	    var filteredAggregate;
	    var labelText;
	    var jqueryAxisTickLabel;
	    var finalEndDate;

	    // Note that labelPrecision is actually global to the directive, but
	    // it is set within the context of rendering the x-axis since it
	    // seems as reasonable to do so here as anywhere else.
	    labelPrecision = deriveXAxisLabelPrecision();

	    pixelsPerDay = cachedChartDimensions.width /
	      moment.duration(
	        moment(cachedChartData.maxDate).add(1, datasetPrecision) -
	        moment(cachedChartData.minDate)
	      ).asDays();

	    // Set up the container for the x-axis ticks.
	    jqueryAxisContainer = $('<div>').
	      addClass('x-ticks').
	      css({
	        width: cachedChartDimensions.width,
	        height: Constants.TIMELINE_CHART_MARGIN.BOTTOM
	      });

	    _.each(cachedChartData.values, function(value, i) {

	      if (i === 0) {
	        return;
	      }

	      thisDate = value.date;

	      switch (labelPrecision) {
	        case 'DECADE':
	          if (thisDate.getFullYear() % 10 === 0) {
	            tickLocations.push(i);
	            recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
	            intervalStartDate = thisDate;
	          }
	          break;
	        case 'YEAR':
	          if (thisDate.getMonth() === 0) {
	            tickLocations.push(i);
	            recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
	            intervalStartDate = thisDate;
	          }
	          break;
	        case 'MONTH':
	          if (thisDate.getDate() === 1) {
	            tickLocations.push(i);
	            recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
	            intervalStartDate = thisDate;
	          }
	          break;
	        case 'DAY':
	          tickLocations.push(i);
	          recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
	          intervalStartDate = thisDate;
	          break;
	      }
	    });

	    intervalEndDate = moment(cachedChartData.maxDate).add(1, datasetPrecision).toDate();

	    // If the last date is not a tick, we still need a label to extend
	    // from the last tick to the end of the visualization.
	    // Additionally, moment has no notion of decades so we need to catch
	    // that case and add 10 years instead.
	    finalEndDate = _.isEmpty(labels) ? intervalEndDate : _.last(labels).endDate;
	    if (labelPrecision === 'DECADE') {
	      maxDatePlusLabelPrecision =
	        moment(finalEndDate).add(10, 'YEAR').toDate();
	    } else {
	      maxDatePlusLabelPrecision =
	        moment(finalEndDate).add(1, labelPrecision).toDate();
	    }

	    labels.push({
	      startDate: intervalStartDate,
	      endDate: intervalEndDate,
	      width: cachedChartDimensions.width - d3XScale(intervalStartDate) +
	        (2 * halfTickWidth) + halfVisualizedDatumWidth,
	      left: d3XScale(intervalStartDate) - halfVisualizedDatumWidth,
	      // If the distance from the last tick to the end of the visualization is
	      // equal to one labelPrecision unit or if we have no labels, then we
	      // should label the interval.  Otherwise, we should draw it but not label it.
	      shouldLabel: (maxDatePlusLabelPrecision.getTime() === intervalEndDate.getTime()) ||
	        _.isEmpty(labels)
	    });

	    // Now that we know how many *labels* we can potentially draw, we
	    // decide whether or not we can draw all of them or just some.
	    shouldLabelEveryN = deriveXAxisLabelDatumStep(labels);

	    // Note that allChartLabelsShown is also actually global to the
	    // directive and is also set within the context of rendering the
	    // x-axis since it seems as reasonable to do so as anywhere else.
	    allChartLabelsShown = shouldLabelEveryN === 1;

	    // Finally, we filter the group of all labels so that we only
	    // label every Nth one.
	    labels = labels.filter(function(label, i) {
	      return (i % shouldLabelEveryN) === 0;
	    });

	    if (!allChartLabelsShown) {

	      var halfExtendedLabelWidth = (visualizedDatumWidth * Math.floor(shouldLabelEveryN / 2));

	      // Revisit each label and increase its width to accommodate the
	      // space that would have been consumed by the missing labels.
	      // The first one is a special case since it will only be enlarged
	      // by half the amount that the others are, since it already sits at
	      // the left edge of the labels. The last will be a special case
	      // also, but it's easier to just adjust it after the map operation.
	      labels.map(function(label) {
	        label.left -= halfExtendedLabelWidth;
	        label.width += (2 * halfExtendedLabelWidth);
	      });

	    }

	    // Now we go through and draw ticks.
	    _.each(tickLocations, function(location) {
	      jqueryAxisTick = $('<rect>').
	        addClass('x-tick').
	        css({
	          left: d3XScale(cachedChartData.values[location].date) -
	            halfVisualizedDatumWidth - halfTickWidth
	        });

	      jqueryAxisContainer.append(jqueryAxisTick);
	    });

	    // Now we to through and draw labels.
	    _.each(labels, function(label) {

	      // Calculate the data aggregates for this interval so we can
	      // stash them as data-attributes and not need to recalculate
	      // them whenever the mouse moves over this label.
	      dataAggregate = cachedChartData.values.
	        filter(function(datum) {
	          return datum.date.getTime() >= label.startDate.getTime() &&
	                 datum.date.getTime() < label.endDate.getTime();
	        });

	      unfilteredAggregate = dataAggregate.
	        reduce(function(acc, datum) {
	          return acc + datum.unfiltered;
	        }, 0);

	      filteredAggregate = dataAggregate.
	        reduce(function(acc, datum) {
	          return acc + datum.filtered;
	        }, 0);

	      labelText = label.shouldLabel ? formatDateLabel(label.startDate, false, labelPrecision) : '';

	      // Finally, add the label to the x-axis container.
	      jqueryAxisTickLabel = $('<span>').
	        addClass('x-tick-label').
	        attr('data-start', label.startDate).
	        attr('data-median', label.startDate).
	        attr('data-end', label.endDate).
	        attr('data-aggregate-unfiltered', unfilteredAggregate).
	        attr('data-aggregate-filtered', filteredAggregate).
	        attr('data-flyout-label', formatDateLabel(label.startDate, true)).
	        text(labelText).
	        css({
	          left: label.left,
	          width: label.width - halfTickWidth
	        });

	      jqueryAxisContainer.append(jqueryAxisTickLabel);

	    });

	    // Replace the existing x-axis ticks with the new ones.
	    $chartElement.children('.x-ticks').replaceWith(jqueryAxisContainer);

	  }

	  /**
	   * This function is comparatively straightforward, but operates
	   * in the same way as renderChartXAxis.
	   */
	  function renderChartYAxis(chartWidth, chartHeight) {

	    var jqueryAxisContainer;
	    var labels;
	    var ticks;
	    var tickElement;


	    jqueryAxisContainer = $('<div>').
	      addClass('y-ticks').
	      css({
	        width: chartWidth,
	        height: chartHeight
	      });

	    labels = [
	      Math.round(cachedChartData.minValue),
	      Math.round(cachedChartData.meanValue),
	      Math.round(cachedChartData.maxValue)
	    ];

	    ticks = [0, 0.5, 1];

	    // If our values straddle 0, then we need to force the middle tick to
	    // be 0, not the average of the min and the max values.
	    if (labels[0] * labels[2] < 0) {
	      labels[1] = 0;
	      ticks[1] = Math.abs(cachedChartData.minValue) /
	        (Math.abs(cachedChartData.minValue) + Math.abs(cachedChartData.maxValue));
	    }

	    _.each(ticks, function(tick, index) {

	      tickElement = $('<div>').
	        addClass('y-tick').
	        css('bottom', Math.floor(chartHeight * tick)).
	        text(utils.formatNumber(labels[index]));

	      if (labels[index] === 0) {
	        tickElement.addClass('origin');
	      }

	      if (index === ticks.length - 1) {
	        tickElement.addClass('below');
	      }

	      jqueryAxisContainer.append(tickElement);

	    });

	    // Remove old y-axis ticks and replace them
	    $chartElement.children('.y-ticks').replaceWith(jqueryAxisContainer);

	  }

	  /**
	   * Because we want the points representing aggregation values to fall
	   * between ticks but the highlight edges and ticks to straddle the
	   * points representing aggregation values we need to create synthetic
	   * points one-half of a <datasetPrecision> interval at the beginning
	   * and end of a series of values we plan to render.
	   *
	   * If leadingValue and/or trailingValue is falsey then this function
	   * will extend the first and/or last actual point's value to these
	   * synthetic points.
	   *
	   * Otherwise (currently only in the case of rendering the chart
	   * selection) leadingValue will be used for the value of the leading
	   * synthetic point and trailingValue will be used for the value of the
	   * trailing synthetic point. This allows the chart selection to mimic
	   * d3's interpolation between points so that the selection's contour
	   * tracks that of the unfiltered values rendered behind it rather than
	   * extending levelly from the first and last actual selection values.
	   *
	   * @param {Array} values - The array of values to transform.
	   * @param {Number} leadingValue - The optional value to use for the
	   *                                leading half-<datasetPrecision>
	   *                                point.
	   * @param {Number} trailingValue - The optional value to use for the
	   *                                 trailing half-<datasetPrecision>
	   *                                 point.
	   * @return {Array} An array containing the query response data with
	   *                 additional points one-half of a dataset precision
	   *                 unit before the first and after the last datum in
	   *                 order for the visualization to span the full
	   *                 available width while also placing individual points
	   *                 between ticks.
	   */
	  function transformValuesForRendering(
	    values,
	    leadingValue,
	    trailingValue) {

	    var outputValues = [];
	    var i;

	    for (i = 0; i < values.length; i++) {
	      var datum = _.pick(values[i], ['date', 'filtered', 'unfiltered']);
	      var prevDatum = values[i - 1];
	      var nextDatum = values[i + 1];
	      var dateNudge;

	      /**
	       * If this datum is the first value or if there is a discontinuity
	       * to the left of this datum, add a synthetic half-step left.
	       */
	      if (_.isUndefined(prevDatum) || _.isNull(prevDatum.unfiltered)) {
	        dateNudge = DateHelpers.decrementDateByHalfInterval(
	          datum.date,
	          datasetPrecision
	        );
	        outputValues.push(_.extend(_.clone(datum), { date: dateNudge }));
	      }

	      /**
	       * Always add the datum.
	       */
	      outputValues.push(datum);

	      /**
	       * If this datum is the last value or if there is a discontinuity
	       * to the right of this datum, add a synthetic half-step right.
	       */
	      if (_.isUndefined(nextDatum) || _.isNull(nextDatum.unfiltered)) {
	        dateNudge = DateHelpers.incrementDateByHalfInterval(
	          datum.date,
	          datasetPrecision
	        );
	        outputValues.push(_.extend(_.clone(datum), { date: dateNudge }));
	      }
	    }

	    /**
	     * Override the leading and trailing values if requested.
	     */
	    if (leadingValue) {
	      _.first(outputValues).filtered = leadingValue;
	      _.first(outputValues).unfiltered = leadingValue;
	    }

	    if (trailingValue) {
	      _.last(outputValues).filtered = trailingValue;
	      _.last(outputValues).unfiltered = trailingValue;
	    }

	    return outputValues;
	  }

	  function renderChartSelection() {

	    /**
	     * This function will select the data points that fall between the
	     * selection start and end dates and then create synthetic points one
	     * half of a <datasetPrecision> unit before and after the selection.
	     * This is to support the behavior that the point representing the
	     * value of each interval is drawn in the center of the interval, not
	     * on its left edge.
	     *
	     * The half <datasetPrecision> unit synthetic points must
	     * furthermore have values that are interpolated between the first/
	     * last actual data points and the points just before or after them,
	     * so that the rendered selection mirrors the unfiltered data drawn
	     * behind it.
	     *
	     * In the case that the selection starts at the beginning of the
	     * overall data the first data point's value will be used instead.
	     *
	     * In the case that the selection ends at the end of the overall data
	     * the last data point's value will be used instead.
	     */
	    function deriveSelectionValues(chartData, minimumDate, maximumDate) {

	      var lastChartDatum = _.last(chartData.values);
	      var prevOutOfBoundsDatum = { filtered: null };
	      var nextOutOfBoundsDatum = { filtered: null };
	      var firstSelectionDatum = null;
	      var lastSelectionDatum = null;
	      var firstSelectionValueAmount = false;
	      var lastSelectionValueAmount = false;
	      var selectionValues = [];

	      _.each(chartData.values, function(datum) {

	        if (datum.date >= minimumDate && datum.date <= maximumDate) {
	          if (_.isNull(firstSelectionDatum)) {
	            firstSelectionDatum = datum;
	          }
	          // Track the current datum as "beyond the end of the selection"
	          // instead of "last in selection" because we chop off the last
	          // value below!
	          nextOutOfBoundsDatum = datum;
	          selectionValues.push(datum);
	        } else if (datum.date < minimumDate) {
	          prevOutOfBoundsDatum = datum;
	        } else if (datum.date > maximumDate) {
	          return false;
	        }
	      });

	      // Drop the last selection value since they are all incremented
	      // by half of a dataset precision unit, and the last value to
	      // meet the date range criteria will actually be drawn outside
	      // the range indicated by the x-axis ticks.
	      // We could accomplish the same thing by looking ahead in the
	      // above for loop, but throwing away the last value seemed easier
	      // with regard to bounds checking and so forth.
	      selectionValues.length = selectionValues.length - 1;

	      // Because of the way the data is displayed, it is valid for a
	      // selection to begin on the last datum and end on the last datum
	      // + 1 <datasetPrecision> unit. Therefore we need to check to see
	      // our selection's end date is after the last date in the actual
	      // values and append a surrogate value to the filtered array with
	      // an appropriate date to show as the end of the x scale.
	      if (lastChartDatum.date < maximumDate) {
	        selectionValues.push(lastChartDatum);
	      }

	      // Only at this point can we define the true "last" datum.
	      lastSelectionDatum = _.last(selectionValues);

	      // If there is a non-null value immediately before the start of the
	      // selection, then force the first value to be halfway between the
	      // first selected datum and the preceding datum in order to keep the
	      // line consistent.
	      //
	      // Otherwise leave firstSelectionValueAmount false and let
	      // transformValuesForRendering choose how to extend the selection
	      // area (which it will do if firstSelectionValueAmount is falsey).
	      if (!_.isNull(prevOutOfBoundsDatum.filtered)) {
	        firstSelectionValueAmount = (
	          firstSelectionDatum.filtered + prevOutOfBoundsDatum.filtered
	        ) / 2;
	      }

	      // If there is a non-null value immediately after the end of the
	      // selection, then force the last value to be halfway between the
	      // last selected datum and the following datum in order to keep the
	      // line consistent.
	      //
	      // Otherwise leave lastSelectionValueAmount false and let
	      // transformValuesForRendering choose how to extend the selection
	      // area (which it will do if lastSelectionValueAmount is falsey).
	      if (!_.isNull(nextOutOfBoundsDatum.filtered)) {
	        lastSelectionValueAmount = (
	          lastSelectionDatum.filtered + nextOutOfBoundsDatum.filtered
	        ) / 2;
	      }

	      return transformValuesForRendering(
	        selectionValues,
	        firstSelectionValueAmount,
	        lastSelectionValueAmount
	      );
	    }

	    var minDate;
	    var maxDate;
	    var line;
	    var area;
	    var svgChart;
	    var selection;
	    var selectionStartPosition;
	    var selectionEndPosition;
	    var labelWidth;
	    var minLabelWidth;
	    var labelNegativeXOffset;
	    var dateRangeLabel;
	    var dateRangeFlyoutLabel;
	    var labelLeftOffset;
	    var labelRightPosition;
	    var selectionDelta;
	    var margin;
	    var values;
	    var transformedMinDate;
	    var transformedMaxDate;
	    var labelTextAlign;
	    var dataAggregate;
	    var unfilteredAggregate;
	    var filteredAggregate;

	    if (_.isNull(d3XScale) || _.isNull(d3YScale)) {
	      return;
	    }

	    if (selectionStartDate < selectionEndDate) {
	      minDate = selectionStartDate;
	      maxDate = selectionEndDate;
	    } else {
	      minDate = selectionEndDate;
	      maxDate = selectionStartDate;
	    }

	    if (!_.isNull(minDate) && !_.isNull(maxDate)) {

	      // If the effective selection will not change because the selection
	      // start and end dates have not changed, quit early.
	      if (!_.isNull(renderedSelectionStartDate) &&
	          !_.isNull(renderedSelectionEndDate) &&
	          selectionStartDate.getTime() === renderedSelectionStartDate.getTime() &&
	          selectionEndDate.getTime() === renderedSelectionEndDate.getTime()) {
	        // Note that even if we are quitting early we still may need to
	        // show the selection (since it may be possible that the same
	        // interval was previously rendered but is now just hidden).
	        $chartSelectionElement.show();
	        return;
	      }

	      margin = Constants.TIMELINE_CHART_MARGIN;

	      values = [
	        deriveSelectionValues(cachedChartData, minDate, maxDate)
	      ];

	      // Reset minDate and maxDate to accurately reflect the 'half-way'
	      // interpolated values created by transformValuesForRendering.
	      transformedMinDate = _.first(values[0]).date;
	      transformedMaxDate = _.last(values[0]).date;

	      line = d3.
	        svg.
	        line().
	        defined(function(d) { return !_.isNull(d.filtered); }).
	        x(function(d) { return d3XScale(d.date); }).
	        y(function(d) { return d3YScale(d.filtered); });

	      area = d3.
	        svg.
	        area().
	        defined(line.defined()).
	        x(line.x()).
	        y0(function() { return d3YScale(0); }).
	        y1(line.y());

	      svgChart = d3ChartElement.
	        select('svg.timeline-chart-selection').
	        attr('width', cachedChartDimensions.width).
	        attr('height', cachedChartDimensions.height).
	        select('g').
	        attr('transform', 'translate(' + margin.LEFT + ',' + margin.TOP + ')');

	      selection = svgChart.
	        selectAll('path').
	        data(values);

	      selection.
	        enter().
	        append('path');

	      selection.
	        exit().
	        remove();

	      selection.
	        attr('class', 'selection').
	        attr('d', area);

	      svgChart.
	        append('path').
	        data(values).
	        attr('class', 'selection-trace').
	        attr('d', line);

	      selectionStartPosition = Math.floor(d3XScale(transformedMinDate));

	      // Subtract one from the scaled and transformed maxDate in order to
	      // prevent d3 from giving us a value that is outside the actual
	      // element to which we are rendering.
	      selectionEndPosition = Math.floor(d3XScale(transformedMaxDate)) - 1;

	      $leftSelectionMarker.css(
	        {
	          left: selectionStartPosition -
	            Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET -
	            (Constants.TIMELINE_CHART_DRAG_HANDLE_WIDTH / 2),
	          height: cachedChartDimensions.height - margin.TOP - margin.BOTTOM
	        }
	      );

	      $rightSelectionMarker.css(
	        {
	          left: selectionEndPosition -
	            Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET +
	            (Constants.TIMELINE_CHART_DRAG_HANDLE_WIDTH / 2),
	          height: cachedChartDimensions.height - margin.TOP - margin.BOTTOM
	        }
	      );

	      labelWidth = Math.floor(d3XScale(transformedMaxDate) - d3XScale(transformedMinDate));
	      minLabelWidth = Constants.TIMELINE_CHART_MIN_LABEL_WIDTH;
	      labelNegativeXOffset = 0;

	      if (labelWidth < minLabelWidth) {
	        labelNegativeXOffset = (minLabelWidth - labelWidth) / 2;
	        labelWidth = minLabelWidth;
	      }

	      dateRangeLabel = formatDateRangeLabel(minDate, maxDate);

	      // Bounds-check the position of the label and keep it from
	      // overflowing the card bounds
	      labelLeftOffset = selectionStartPosition - labelNegativeXOffset;

	      if (labelLeftOffset < -(Constants.TIMELINE_CHART_GUTTER)) {
	        labelLeftOffset = -(Constants.TIMELINE_CHART_GUTTER);
	      }

	      labelRightPosition = labelLeftOffset + labelWidth;
	      if (labelRightPosition > cachedChartDimensions.width) {
	        selectionDelta = labelRightPosition - cachedChartDimensions.width;
	        labelLeftOffset = labelLeftOffset -
	          selectionDelta + Constants.TIMELINE_CHART_GUTTER;
	      }

	      labelTextAlign = 'center';

	      if (labelLeftOffset < 0) {

	        labelTextAlign = 'left';
	        labelWidth += labelLeftOffset;
	        labelLeftOffset = 0;

	      } else if ((labelLeftOffset + labelWidth) > cachedChartDimensions.width) {

	        labelWidth += (cachedChartDimensions.width - (labelLeftOffset + labelWidth));
	        labelLeftOffset = cachedChartDimensions.width - labelWidth;
	        labelTextAlign = 'right';

	      }

	      // Adding aggregate and label data to the label for flyout.
	      dataAggregate = cachedChartData.values.
	        filter(function(datum) {
	          return datum.date.getTime() >= selectionStartDate.getTime() &&
	                 datum.date.getTime() < selectionEndDate.getTime();
	        });

	      unfilteredAggregate = dataAggregate.
	        reduce(function(acc, datum) {
	          return acc + datum.unfiltered;
	        }, 0);

	      filteredAggregate = dataAggregate.
	        reduce(function(acc, datum) {
	          return acc + datum.filtered;
	        }, 0);

	      dateRangeFlyoutLabel = '{0} - {1}'.
	        format(formatDateLabel(minDate, true), formatDateLabel(maxDate, true));

	      $clearSelectionLabel.
	        attr('data-start', selectionStartDate).
	        attr('data-end', selectionEndDate).
	        attr('data-aggregate-unfiltered', unfilteredAggregate).
	        attr('data-aggregate-filtered', filteredAggregate).
	        attr('data-flyout-label', dateRangeFlyoutLabel).
	        html(dateRangeLabel).
	        css({
	          left: labelLeftOffset,
	          width: labelWidth,
	          // The '- 1' term accounts for the 1 pixel y-axis.
	          height: Constants.TIMELINE_CHART_MARGIN.BOTTOM - 1,
	          textAlign: labelTextAlign,
	          top: cachedChartDimensions.height -
	            Constants.TIMELINE_CHART_MARGIN.TOP -
	            Constants.TIMELINE_CHART_MARGIN.BOTTOM
	        });

	      $chartSelectionElement.show();

	      renderedSelectionStartDate = selectionStartDate;
	      renderedSelectionEndDate = selectionEndDate;

	    }

	  }

	  function clearChartSelection() {

	    selectionIsCurrentlyRendered = false;
	    selectionStartDate = null;
	    selectionEndDate = null;
	    renderedSelectionStartDate = null;
	    renderedSelectionEndDate = null;
	    $chartSelectionElement.hide();
	    $chartElement.removeClass('selected');

	  }

	  function enterDraggingState() {
	    currentlyDragging = true;
	    selectionIsCurrentlyRendered = false;
	    hideDatumLabel();
	    $chartElement.find('.timeline-chart-filtered-mask').hide();
	    $body.addClass('prevent-user-select');
	    $chartElement.removeClass('selected').addClass('selecting');
	  }

	  function enterSelectedState() {
	    currentlyDragging = false;
	    selectionIsCurrentlyRendered = true;
	    hideDatumLabel();
	    renderChartFilteredValues();
	    $chartElement.find('.timeline-chart-filtered-mask').show();
	    $body.removeClass('prevent-user-select');
	    $chartElement.removeClass('selecting').addClass('selected');
	  }

	  function enterDefaultState() {
	    currentlyDragging = false;
	    selectionIsCurrentlyRendered = false;
	    clearChartSelection();
	    hideDatumLabel();
	    if (d3XScale && d3YScale) {
	      // Check if d3 scales exist before attempting to render filtered values.
	      // This is mainly needed for the onload case when enterDefaultState is called
	      // and the chart has a width/height of zero, so the scales are still null.
	      renderChartFilteredValues();
	    }
	    $body.removeClass('prevent-user-select');
	    $chartElement.removeClass('selecting').removeClass('selected');
	  }

	  function requestChartFilterByCurrentSelection() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_TIMELINE_FILTER',
	      {
	        // Todo: Change this to emit ISO-8601 strings rather than instances of
	        // moment.
	        start: selectionStartDate,
	        end: selectionEndDate
	      }
	    );
	  }

	  function requestChartFilterReset() {
	    self.emitEvent('SOCRATA_VISUALIZATION_TIMELINE_FILTER', null);
	  }

	  /**
	   * @param {Number} offsetX - The left offset of the mosue cursor into
	   *                           the visualization, in pixels.
	   * @return {Date} The date to which the mouse position is mapped by
	   *                d3's x-scale.
	   */
	  function getDateFromMousePosition(offsetX) {

	    var date = d3XScale.invert(offsetX);

	    // Clear out unneeded precision from the date objects.
	    if (datasetPrecision === 'YEAR') {
	      date.setMonth(0);
	    } else if (datasetPrecision === 'MONTH') {
	      date.setDate(1);
	    }

	    date.setMilliseconds(0);
	    date.setSeconds(0);
	    date.setMinutes(0);
	    date.setHours(0);

	    return date;

	  }

	  /**
	   * @param {number} offsetX - The offset of the mouse pointer into the
	   *                           visualization, in pixels
	   * @param {DOM Element} target - The DOM element receiving the mouse
	   *                               event.
	   */
	  function setSelectionStartAndEndDateByMousePosition(offsetX, target) {

	    var candidateSelectionEndDate = null;

	    if (mousePositionWithinChartLabels) {

	      candidateSelectionEndDate = target.getAttribute('data-end');

	      if (candidateSelectionEndDate === null) {
	        return;
	      }

	      candidateSelectionEndDate = new Date(candidateSelectionEndDate);

	      if (candidateSelectionEndDate <= selectionStartDate) {
	        candidateSelectionEndDate = new Date(target.getAttribute('data-start'));
	      }

	    } else if (mousePositionWithinChartDisplay) {

	      candidateSelectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

	    } else {

	      candidateSelectionEndDate = selectionEndDate;

	    }

	    if (candidateSelectionEndDate !== null && selectionStartDate !== null) {

	      // Prevent null selections by auto-incrementing by a
	      // 'datasetPrecision' unit if the calculated start and end dates
	      // are the same.
	      if (candidateSelectionEndDate.getTime() === selectionStartDate.getTime()) {
	        candidateSelectionEndDate = getDateFromMousePosition(
	          offsetX + halfVisualizedDatumWidth + visualizedDatumWidth);
	      }

	      if (candidateSelectionEndDate < cachedChartData.minDate) {
	        candidateSelectionEndDate = cachedChartData.minDate;
	      }

	      if (candidateSelectionEndDate > cachedChartData.maxDate) {
	        candidateSelectionEndDate = moment(cachedChartData.maxDate).
	          add(1, datasetPrecision).toDate();
	      }

	      setCurrentDatumByDate(candidateSelectionEndDate);

	      selectionEndDate = candidateSelectionEndDate;

	      // Handle the special case wherein the start and end dates can end
	      // up identical. This can happen when the cursor is placed on the
	      // '0th' pixel of the interval. We solve it by selectively adding
	      // or subtracting one <datasetPrecision> unit to/from the end date,
	      // depending on whether or not subtracting from the end date would
	      // put us outside the x-axis scale.
	      if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
	        if (selectionStartDate.getTime() === cachedChartData.minDate.getTime()) {
	          selectionEndDate = moment(selectionEndDate).
	            add(1, datasetPrecision).toDate();
	        } else {
	          selectionEndDate = moment(selectionEndDate).
	            subtract(1, datasetPrecision).toDate();
	        }
	      }

	    }

	  }

	  /**
	   * Interprets clicking and dragging and applies the expected state
	   * transitions before conditionally rendering the chart selection.
	   *
	   * @param {Object} mouseStatus
	   *   @property {Boolean} leftButtonPressed
	   *   @property {Object} position
	   *     @property {Number} clientX
	   *     @property {Number} clientY
	   */
	  function handleChartSelectionEvents(mouseStatus) {

	    function selectionIsExactlyTheSameAsHasBeenRendered(startDate, endDate) {

	      return !_.isNull(renderedSelectionStartDate) &&
	             !_.isNull(renderedSelectionEndDate) &&
	             startDate.getTime() === renderedSelectionStartDate.getTime() &&
	             endDate.getTime() === renderedSelectionEndDate.getTime();
	    }

	    var offsetX;
	    var offsetY;
	    var candidateStartDate;
	    var targetIsClearSelection =
	      $(mouseStatus.position.target).is('.timeline-chart-clear-selection-button') ||
	      $(mouseStatus.position.target).is('.timeline-chart-clear-selection-label');
	    var chartHasNotRendered =
	      _.isNull(cachedChartDimensions) ||
	      _.isNull(element.offset());


	    // Fail early if the chart hasn't rendered itself at all yet or
	    // if we are clicking the 'Clear selection' label.
	    if (chartHasNotRendered || targetIsClearSelection) {
	      return;
	    }

	    offsetX = mouseStatus.position.clientX - element.offset().left + halfVisualizedDatumWidth;
	    offsetY = mouseStatus.position.clientY - element.get(0).getBoundingClientRect().top;

	    // Mouse down while not dragging (start selecting):
	    if (mouseStatus.leftButtonPressed && !currentlyDragging) {

	      if (mousePositionWithinChartLabels) {

	        candidateStartDate = mouseStatus.position.target.getAttribute('data-start');
	        if (!_.isNull(candidateStartDate)) {
	          selectionStartDate = new Date(candidateStartDate);
	          selectionEndDate = new Date(mouseStatus.position.target.getAttribute('data-end'));
	          enterDraggingState();
	        }

	      } else if (mousePositionWithinChartElement) {

	        // The target markers on the left and right of the selection have
	        //  a 'data-selection-target' attribute value of 'left' and
	        // 'right', respectively. Attempting to get that attribute on any
	        // other element (e.g. the chart itself or, more specifically,
	        // the highlight target that sits on top of it) will return null,
	        // which will be caught by the default case and treated as a
	        // normal selection-start event.
	        switch (mouseStatus.position.target.getAttribute('data-selection-target')) {
	          case 'left':
	            selectionStartDate = selectionEndDate;
	            selectionEndDate = getDateFromMousePosition(offsetX);
	            break;
	          case 'right':
	            break;
	          default:

	            // If the mouse is inside the chart element and inside the
	            // chart display, then we can just do the drag selection as
	            // normal.
	            if (mousePositionWithinChartDisplay) {

	              selectionStartDate = getDateFromMousePosition(offsetX);
	              selectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

	              if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
	                selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
	              }

	              // If the user is clicking on the same selection again,
	              // then we deselect it.
	              if (selectionIsExactlyTheSameAsHasBeenRendered(selectionStartDate, selectionEndDate)) {
	                enterDefaultState();
	                requestChartFilterReset();
	                return;
	              }

	            } else {

	              // If the mouse is above the chart, do not enter a dragging
	              // state because this will try to filter using the topmost
	              // y-tick as a target, which will cause unexpected behavior.
	              if (offsetY < 0) {
	                return;
	              }

	              // If the mouse is inside the chart element but outside the
	              // chart display, then it must be in the left or right
	              // margin, in which case we want to anchor the min or max
	              // date to the chart's min or max date and make the
	              // selection 1 display unit wide.
	              if (offsetX < cachedChartDimensions.width / 2) {
	                selectionStartDate = cachedChartData.minDate;
	                selectionEndDate = moment(cachedChartData.minDate).
	                  add(1, datasetPrecision).toDate();
	              } else {
	                selectionStartDate = moment(cachedChartData.maxDate).
	                  add(1, datasetPrecision).toDate();
	                selectionEndDate = cachedChartData.maxDate;
	              }

	            }
	            break;
	        }

	        enterDraggingState();

	      }

	    }

	    // Mouse up while dragging (stop selecting):
	    if (currentlyDragging && !mouseStatus.leftButtonPressed) {

	      clearChartHighlight();

	      if (selectionStartDate > selectionEndDate) {

	        // candidateStartDate is used here as a temporary variable
	        // when swapping the two values so that the selectionStartDate
	        // always occurs before the selectionEndDate.
	        candidateStartDate = selectionStartDate;
	        selectionStartDate = selectionEndDate;
	        selectionEndDate = candidateStartDate;
	      }

	      if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
	        selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
	      }

	      enterSelectedState();

	      requestChartFilterByCurrentSelection();

	    }

	  }

	  function handleClearSelectionLabelMousedownEvent() {
	    requestChartFilterReset();
	    enterDefaultState();
	  }

	  function clearHighlightedLabels() {
	    _chartElement.find('.x-tick-label').removeClass('highlight');
	  }

	  function highlightLabel(target) {
	    clearHighlightedLabels();
	    $(target).addClass('highlight');
	  }

	  /**
	   * @param {DOM Element} target - A DOM element with data attributes
	   *                               describing an interval's start date,
	   *                               end date, filtered and unfiltered
	   *                               values and the formatted flyout label.
	   */
	  function highlightChartByInterval(target) {
	    if (vif.configuration.isMobile) {
	      if (!$(target).hasClass('x-tick-label')) {
	        clearChartHighlight();
	        return;
	      } else {
	        highlightLabel(target);
	      }
	    }

	    var startDate;
	    var endDate;
	    startDate = new Date(target.getAttribute('data-start'));
	    endDate = new Date(target.getAttribute('data-end'));
	    hideDatumLabel();
	    highlightChart(startDate, endDate);
	  }

	  /**
	   * This function renders the white highlight on the visualization.
	   * This rendering is agnostic to how the underlying data has been filtered
	   * and simply takes a subset of the full chart data and renders it in a
	   * similar fashion to how the filtered and unfiltered chart data
	   * is rendered.
	   *
	   * This function also determines flyout positioning by drawing
	   * a small line where the flyout should be positioned.
	   *
	   * @param {Object} highlightData - The output of either
	   *                                 filterChartDataByOffset
	   *                                 or filterChartDataByInterval.
	   */
	  function renderChartHighlight(highlightData) {

	    var highlightArea;
	    var flyoutPosition;
	    var selection;

	    if (_.isNull(d3XScale) || _.isNull(d3YScale)) {
	      return;
	    }

	    var targetMargin = Constants.TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN;
	    var gutter = Constants.TIMELINE_CHART_GUTTER;

	    var cardWidth = cachedChartDimensions.width;
	    var width = highlightData.width + (targetMargin * 2);
	    var leftPos = highlightData.left - targetMargin;
	    width = Math.min(width, cardWidth + gutter - leftPos);
	    // Previously, the line below read:
	    //
	    // leftPos = Math.max(leftPos, -gutter);
	    //
	    // Presumably this was to allow selection of the timeline chart to occur
	    // outside the rendered chart in Data Lens: the cards have extra margins
	    // around the periphery and it made sense to enable people to start the
	    // selection to the left of the left edge of the visualization, or to the
	    // right of the right edge (if selecting from right to left).
	    //
	    // Unfortunately, this breaks the visualization in other contexts (it leaks
	    // out of its container, potentially covering other elements in the DOM
	    // where it clearly should not) so we will need to figure out a better
	    // solution for that. In the meantime, selection behavior may be impaired.
	    leftPos = Math.max(0, Math.min(leftPos, cardWidth - width));

	    $highlightTargetElement.css({
	      left: leftPos,
	      width: width,
	      height: cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM
	    });

	    highlightArea = d3.
	      svg.
	      area().
	      x(function(d) { return d3XScale(d.date); }).
	      y0(cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM).
	      y1(d3YScale(highlightData.maxValue));

	    d3ChartElement.
	      select('svg.timeline-chart-highlight-container').
	      select('g').
	      remove();

	    selection = d3ChartElement.
	      select('svg.timeline-chart-highlight-container').
	      attr('width', highlightData.width).
	      attr('height', cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM).
	      append('g');

	    selection.
	      append('path').
	      datum(highlightData.data).
	      attr('class', 'timeline-chart-highlight').
	      attr('d', highlightArea);

	    // This function determines the vertical position of the flyout.
	    // It always positions the flyout above all timeline paths.
	    function flyoutVerticalPosition() {
	      var hoveringWithinSelection =
	        currentDatum.date >= selectionStartDate && currentDatum.date <= selectionEndDate;

	      return (selectionIsCurrentlyRendered && !hoveringWithinSelection) ?
	        d3YScale(_.max([currentDatum.unfiltered, 0])) :
	        d3YScale(_.max([currentDatum.unfiltered, currentDatum.filtered, 0]));
	    }

	    // Sets the x and y flyout position.
	    flyoutPosition = d3.
	      svg.
	      line().
	      x(function(d) { return d3XScale(d.date); }).
	      y(flyoutVerticalPosition());

	    // This is the actual svg element that flyouts are
	    // positioned on.
	    selection.
	      append('path').
	      datum(highlightData.data).
	      attr('class', 'timeline-chart-flyout-target').
	      attr('d', flyoutPosition);

	  }

	  function clearChartHighlight() {
	    // Since we attach event handlers before the visualization has rendered for
	    // the first time, it is possible that we have never cached the chart
	    // dimensions (cachedChartDimensions, below). As such, attempting to clear
	    // the chart highlight (which is triggered by moving the mouse over the
	    // container) will attempt to read the `.height` property of `null` and
	    // report an uncaught TypeError.
	    //
	    // To avoid this, we only actually attempt to clear the chart highlight if
	    // we have cached the chart dimensions.
	    if (cachedChartDimensions) {

	      element.find('.timeline-chart-highlight-container > g > path').remove();
	      element.find('.timeline-chart-highlight-container').
	        css('height', cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM);

	      if (vif.configuration.isMobile) {
	        self.emitEvent('SOCRATA_VISUALIZATION_TIMELINE_CHART_CLEAR');
	      }
	    }
	  }

	  /**
	   * @param {Date} startDate
	   * @param {Date} endDate
	   */
	  function highlightChart(startDate, endDate) {
	    var highlightData;
	    clearHighlightedLabels();
	    setCurrentDatumByDate(startDate);
	    highlightData = filterChartDataByInterval(
	      startDate,
	      endDate
	    );
	    renderChartHighlight(highlightData);
	  }

	  /**
	   * @param {Number} offsetX - The left offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   */
	  function highlightChartByMouseOffset(offsetX) {
	    var highlightData;
	    if (mousePositionWithinChartDisplay || mousePositionWithinChartLabels) {
	      highlightData = filterChartDataByOffset(offsetX);
	      renderChartHighlight(highlightData);
	      hideDatumLabel();
	    }
	  }

	  /**
	   * @param {Number} offsetX - The left offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   */
	  function highlightChartWithHiddenLabelsByMouseOffset(offsetX) {

	    var indexIntoChartData;
	    var startDate;
	    var endDate;
	    var currentPrecision;
	    var datumLabelOffset;
	    var datumLabelWidth;

	    indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) *
	      cachedChartData.values.length);

	    // Note that currentDatum is a global variable that is set when the
	    // user hovers over the visualization. The value of currentDatum is
	    // read by the flyout code.
	    currentDatum = cachedChartData.values[indexIntoChartData];

	    // If we are hovering within the labels and they are all shown, we should use
	    // the label precision.  Otherwise, because labels are hidden, we should use
	    // the smaller datasetPrecision.
	    currentPrecision = (mousePositionWithinChartLabels && allChartLabelsShown) ?
	      labelPrecision : datasetPrecision;

	    startDate = currentDatum.date;
	    endDate = new Date(moment(currentDatum.date).add(1, currentPrecision).toDate());

	    // Dim existing labels and add text and attribute information to the datum label.
	    if (!vif.configuration.isMobile) {
	      $chartElement.addClass('dimmed');
	    }

	    $datumLabel.
	      text(formatDateLabel(startDate, false, currentPrecision)).
	      attr('data-start', startDate).
	      attr('data-end', endDate).
	      attr('data-aggregate-unfiltered', currentDatum.unfiltered).
	      attr('data-aggregate-filtered', currentDatum.filtered).
	      attr('data-flyout-label', formatDateLabel(startDate, true, currentPrecision));

	    // Now that the datum label has text (and thus a width), calculate its
	    // left offset.  Make sure it does not overflow either edge of the chart.
	    datumLabelWidth = $datumLabel.width();
	    datumLabelOffset = Math.ceil(d3XScale(startDate));
	    datumLabelOffset = (datumLabelOffset > (datumLabelWidth / 2)) ?
	       datumLabelOffset - (datumLabelWidth / 2) : 0;
	    datumLabelOffset = Math.min(
	      datumLabelOffset,
	      cachedChartDimensions.width - datumLabelWidth
	    );

	    // Set the left offset and show the label.
	    $datumLabel.
	      css('left', Math.floor(datumLabelOffset)).
	      show();

	    highlightChart(startDate, endDate);

	  }

	  /**
	   * Data can be filtered by the x-offset of the cursor from the left
	   * edge of the chart or by arbitrary intervals specified with start-
	   * and end Date objects.
	   *
	   * The two filter functions each have a SIDE-EFFECT: they both set
	   * the global 'currentDatum' variable to a synthetic value which is
	   * used by the flyout code to keep the highlighted areas and their
	   * corresponding flyout labels in sync.
	   *
	   * @param {Number} offsetX - The left offset of the mouse cursor into the
	   *                           visualization, in pixels.
	   * @return {Object}
	   *   @property {Array} highlightData - The data for the start and end
	   *                                     date including the unfiltered
	   *                                     and filtered values.
	   *   @property {Number} left - The left offset of the selection,
	   *                             in pixels.
	   *   @property {Number} width - The width of one <datum>, in pixels.
	   *   @property {Number} maxValue - the maximum unfiltered value in the
	   *                                 latest data request.
	   */
	  function filterChartDataByOffset(offsetX) {

	    var indexIntoChartData;
	    var transformedStartDate;
	    var transformedEndDate;
	    var highlightData;
	    var leftOffset;
	    var width = visualizedDatumWidth;
	    var maxValue = cachedChartData.maxValue;

	    indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) *
	      cachedChartData.values.length);

	    // Note that currentDatum is a global variable that is set when the
	    // user hovers over the visualization. The value of currentDatum is
	    // read by the flyout code.
	    currentDatum = cachedChartData.values[indexIntoChartData];

	    transformedStartDate = DateHelpers.decrementDateByHalfInterval(
	      currentDatum.date, datasetPrecision
	    );
	    transformedEndDate = DateHelpers.decrementDateByHalfInterval(
	      moment(currentDatum.date).add(1, datasetPrecision).toDate(), datasetPrecision
	    );

	    highlightData = [
	      { date: transformedStartDate },
	      { date: transformedEndDate }
	    ];

	    leftOffset = d3XScale(transformedStartDate);

	    return {
	      data: highlightData,
	      left: leftOffset,
	      width: width,
	      maxValue: maxValue
	    };

	  }

	  function hideDatumLabel() {
	    $datumLabel.hide();

	    if (!vif.configuration.isMobile) {
	      $chartElement.removeClass('dimmed');
	    }
	  }

	  /**
	   * This is used to keep the flyout updated as you drag a selection
	   * marker.
	   */
	  function setCurrentDatumByDate(date) {
	    currentDatum = _.find(cachedChartData.values, function(value) {
	      return value.date >= date;
	    });
	  }

	  /**
	   * Converts a date and a unit into a string representation.
	   *
	   * @param {Date} labelDate - The date to format.
	   * @param {Boolean} useFullMonthNames - Whether or not the date should
	   *                                      be rendered with full month
	   *                                      names.
	   * @param {String} overriddenLabelPrecision - An optional precision
	   *                                            to use in favor of the
	   *                                            globally-defined dataset
	   *                                            precision. Must be one of
	   *                                            'decade', 'year', 'month'
	   *                                            or 'day'.
	   * @return {String} The formatted date.
	   */
	  function formatDateLabel(labelDate, useFullMonthNames, overriddenLabelPrecision) {

	    var labelPrecisionToUse = overriddenLabelPrecision || labelPrecision;
	    var label;

	    switch (labelPrecisionToUse) {

	      case 'DECADE':
	        label = Math.floor(labelDate.getFullYear() / 10) + '0s';
	        break;

	      case 'YEAR':
	        label = labelDate.getFullYear();
	        break;

	      case 'MONTH':
	        if (useFullMonthNames) {
	          label = '{0} {1}'.format(
	            moment(labelDate).format('MMMM'),
	            labelDate.getFullYear()
	          );
	        } else {
	          label = "{0} '{1}".format(
	            moment(labelDate).format('MMM'),
	            '0{0}'.format(labelDate.getFullYear() % 100).slice(-2)
	          );
	        }
	        break;

	      case 'DAY':
	        if (useFullMonthNames) {
	          label = '{0} {1} {2}'.format(
	            labelDate.getDate(),
	            moment(labelDate).format('MMMM'),
	            labelDate.getFullYear()
	          );
	        } else {
	          label = '{0} {1}'.format(
	            labelDate.getDate(),
	            moment(labelDate).format('MMM')
	          );
	        }
	        break;

	      default:
	        throw new Error(
	          'Cannot format date label for unrecognized unit "{0}".'.format(labelPrecisionToUse));

	    }

	    return label;

	  }

	  /**
	   * Returns a bundle of stuff about the data points occurring between
	   * two points in time.
	   *
	   * @param {Date} startDate
	   * @param {Date} endDate
	   * @return {Object}
	   *   @property {Array} highlightData - The data for the start and end
	   *                                     date including the unfiltered
	   *                                     and filtered values.
	   *   @property {Number} left - The left offset of the selection,
	   *                             in pixels.
	   *   @property {Number} width - The width of the selection, in pixels.
	   *   @property {Number} maxValue - The maximum unfiltered value in the
	   *                                 latest data request.
	   */
	  function filterChartDataByInterval(startDate, endDate) {

	    var transformedStartDate = DateHelpers.decrementDateByHalfInterval(
	      startDate, datasetPrecision);
	    var transformedEndDate = DateHelpers.decrementDateByHalfInterval(
	      endDate, datasetPrecision);
	    var highlightData;
	    var leftOffset = d3XScale(transformedStartDate);
	    var width = d3XScale(transformedEndDate) - leftOffset;
	    var maxValue = cachedChartData.maxValue;

	    highlightData = [
	      { date: transformedStartDate },
	      { date: transformedEndDate }
	    ];

	    return {
	      data: highlightData,
	      left: leftOffset,
	      width: width,
	      maxValue: maxValue
	    };

	  }

	  /**
	   * @param {Number} offsetX - The left offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   * @param {Number} offsetY - The top offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   * @return {Boolean}
	   */
	  function isMouseWithinChartDisplay(offsetX, offsetY) {

	    return offsetX > 0.5 &&
	      offsetX <= cachedChartDimensions.width &&
	      offsetY > 0 &&
	      offsetY <= cachedChartDimensions.height -
	        Constants.TIMELINE_CHART_MARGIN.BOTTOM;

	  }

	  /**
	   * @param {Number} offsetX - The left offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   * @param {Number} offsetY - The top offset of the mouse cursor into
	   *                           the visualization, in pixels.
	   * @return {Boolean}
	   */
	  function isMouseWithinChartLabels(offsetX, offsetY) {
	    return offsetX > 0 &&
	      offsetX <= cachedChartDimensions.width &&
	      offsetY > cachedChartDimensions.height -
	        Constants.TIMELINE_CHART_MARGIN.BOTTOM &&
	      offsetY <= cachedChartDimensions.height;

	  }

	  /**
	   * @param {DOM Element} target - The DOM element belonging to this
	   *                               instance of the visualization.
	   * @return {Boolean}
	   */
	  function isMouseOverChartElement(target) {
	    return $(target).closest('.timeline-chart').get(0) === _chartElement[0];
	  }

	  function leftMouseButtonStateHasChanged(event) {
	    var payload = {
	      leftButtonPressed: event.type == 'mousedown',
	      position: {
	        clientX: event.clientX,
	        clientY: event.clientY,
	        target: event.target
	      }
	    };

	    handleChartSelectionEvents(payload);
	    mouseHasMoved(payload.position, payload.leftButtonPressed);
	  }

	  function mouseHasMoved(mousePosition, mouseLeftButtonNowPressed) {
	    var offsetX;
	    var offsetY;
	    var mousePositionTarget = mousePosition.target;

	    // Work-around for browsers with no pointer-event support.
	    //mousePositionTarget = FlyoutService.targetUnder();

	    var $mousePositionTarget = $(mousePositionTarget);
	    var mousePositionIsClearButton = $mousePositionTarget.
	      hasClass('timeline-chart-clear-selection-button');
	    var mousePositionIsSelectionLabel = $mousePositionTarget.
	      hasClass('timeline-chart-clear-selection-label');

	    // Fail early if the chart hasn't rendered itself at all yet.
	    if (_.isNull(cachedChartDimensions) || _.isNull(element.offset())) {
	      return;
	    }

	    if (vif.configuration.isMobile && mousePosition.originalEvent.touches) {
	      offsetX = mousePosition.originalEvent.touches[0].clientX - element.offset().left;
	    } else {
	      offsetX = mousePosition.clientX - element.offset().left;
	    }

	    // The method 'getBoundingClientRect().top' must be used here
	    // because the offset of expanded cards changes as the window
	    // scrolls.
	    if (vif.configuration.isMobile && mousePosition.originalEvent.touches) {
	      offsetY = mousePosition.originalEvent.touches[0].clientY - element.get(0).getBoundingClientRect().top;
	    } else {
	      offsetY = mousePosition.clientY - element.get(0).getBoundingClientRect().top;
	    }

	    // mousePositionWithinChartElement is a global variable that is
	    // used elsewhere as well
	    mousePositionWithinChartElement = isMouseOverChartElement(mousePositionTarget);

	    // First figure out which region (display, labels, outside) of the
	    // visualization the mouse is currently over and cache the result
	    // for this and other functions to use.
	    //
	    // mousePositionWithinChartDisplay and
	    // mousePositionWithinChartLabels are both also global variables
	    // that are used elsewhere as well.
	    if (isMouseWithinChartDisplay(offsetX, offsetY) && mousePositionWithinChartElement) {
	      mousePositionWithinChartDisplay = true;
	      mousePositionWithinChartLabels = false;
	    } else if (isMouseWithinChartLabels(offsetX, offsetY) && mousePositionWithinChartElement) {
	      mousePositionWithinChartDisplay = false;
	      mousePositionWithinChartLabels = true;
	    } else {
	      mousePositionWithinChartDisplay = false;
	      mousePositionWithinChartLabels = false;
	    }

	    // If we are currently dragging, then we need to update and
	    // re-render the selected area.
	    if (currentlyDragging) {
	      setSelectionStartAndEndDateByMousePosition(offsetX, mousePositionTarget);
	      renderChartSelection();
	    // Otherwise we need to update and render an appropriate highlight
	    // (by mouse position if the mouse is within the display or by
	    // interval if the mouse is over the chart labels).
	    } else {
	      if (mousePositionWithinChartDisplay) {
	        if (!allChartLabelsShown) {
	          highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePositionTarget);
	        } else {
	          highlightChartByMouseOffset(offsetX, mousePositionTarget);
	        }
	      } else if (mousePositionWithinChartLabels && !mouseLeftButtonNowPressed) {
	        // Clear the chart highlight if the mouse is currently over the
	        // 'clear chart selection' button.
	        if (mousePositionIsClearButton) {
	          clearChartHighlight();
	          hideDatumLabel();
	        // Otherwise, render a highlight over the interval indicated by
	        // the label that is currently under the mouse.
	        } else {
	          if (!allChartLabelsShown && !mousePositionIsSelectionLabel) {
	            if (vif.configuration.isMobile) {
	              highlightChartByInterval(mousePosition.target);
	            } else {
	              highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePositionTarget);
	            }
	          } else {
	            highlightChartByInterval(mousePosition.target);
	          }
	        }
	      } else {
	        $chartElement.find('.x-tick-label').removeClass('emphasis');
	        hideDatumLabel();
	        clearChartHighlight();
	      }
	    }
	  }

	  function mouseHasLeftChart() {
	    hideDatumLabel();
	    hideFlyout();
	    clearChartHighlight();
	  }
	}

	module.exports = TimelineChart;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var Visualization = __webpack_require__(10);
	var _ = __webpack_require__(9);
	var DataTypeFormatter = __webpack_require__(16);

	module.exports = function Table(element, vif) {
	  _.extend(this, new Visualization(element, vif));

	  var SORT_ICON_WIDTH = 32;

	  var self = this;
	  var _lastRenderData;
	  var _lastRenderOptions;
	  var _scrollbarHeightPx;

	  // If defined, this is an object that maps column name to pixel widths.
	  // See freezeColumnWidths().
	  var _columnWidths;

	  utils.assertHasProperties(
	    vif,
	    'configuration.localization.LATITUDE',
	    'configuration.localization.LONGITUDE',
	    'configuration.localization.NO_COLUMN_DESCRIPTION'
	  );

	  _attachEvents(this.element);

	  /**
	   * Public Methods
	   */

	  this.render = function(data, options) {
	    utils.assertHasProperties(data, 'rows', 'columns');
	    if (_.isEqual(_lastRenderData, data) && _.isEqual(_lastRenderOptions, options)) {
	      return;
	    }

	    _lastRenderData = data;
	    _lastRenderOptions = options;

	    _render(data, options);
	  };

	  /**
	   * Compute how many rows can fit into the given pixel height (taking into account header
	   * size).
	   * NOTE: This assumes each row is the same vertical height, no matter the content.
	   * Currently this is true due to how the table is styled. Caveat emptor.
	   */
	  this.howManyRowsCanFitInHeight = function(overallHeightPx) {
	    if (!_.isFinite(overallHeightPx)) {
	      return 0;
	    }

	    var headerHeightPx;
	    var rowHeightPx;
	    var heightLeftAfterHeaderPx;
	    var maxRowCount;
	    var numberOfRows;
	    var alreadyHasData = _lastRenderData && _lastRenderOptions && _lastRenderData.rows.length > 0;

	    // We need some data in the table to do the measurements.
	    // If there is none there, render a placeholder.
	    if (!alreadyHasData) {
	      // Render sample data into the table. Used for UI element measurement.
	      self.render(
	        {
	          columns: [ { fieldName: 'placeholder', renderTypeName: 'text' } ],
	          rows: [ [ 'placeholder' ] ]
	        },
	        [ {} ]
	      );
	    }

	    utils.assertInstanceOf(element.find('thead')[0], HTMLElement);
	    utils.assertInstanceOf(element.find('tbody tr')[0], HTMLElement);

	    // Measure.
	    headerHeightPx = element.find('thead').outerHeight();
	    rowHeightPx = element.find('tbody tr').outerHeight();

	    // Compute
	    heightLeftAfterHeaderPx = overallHeightPx - headerHeightPx - _scrollbarHeightPx;
	    numberOfRows = heightLeftAfterHeaderPx / rowHeightPx;

	    if (_.isFinite(numberOfRows)) {
	      maxRowCount = Math.max(0, Math.floor(numberOfRows));
	    } else {
	      maxRowCount = 0;
	    }

	    // If we rendered placeholder data, remove it.
	    if (!alreadyHasData) {
	      element.find('.table-container').remove();
	    }

	    return maxRowCount;
	  };

	  this.destroy = function() {
	    _detachEvents(this.element);
	    this.element.find('.socrata-table').remove();
	  };

	  // Causes all columns to maintain their absolute widths, regardless of any new content.
	  // If a column is added after this function is called, the new column will get a default
	  // width of 150px.
	  this.freezeColumnWidthsAndRender = function() {
	    // TODO If we implement persistent column resizing, this function
	    // should be modified to simply return columnWidths for later use
	    // as a render option.
	    var headerWidths = element.find('thead th').map(function() {
	      return this.getBoundingClientRect().width;
	    });

	    var columns = _.pluck(_lastRenderData.columns, 'fieldName');

	    _columnWidths = _.zipObject(
	      columns,
	      headerWidths
	    );

	    _render(_lastRenderData, _lastRenderOptions);
	  };

	  /**
	   * Private Methods
	   */

	  function _templateTableCell(column, cell) {
	    return [
	      '<td data-cell-render-type="{renderTypeName}">',
	        '<div>',
	          DataTypeFormatter.renderCell(cell, column, {
	            latitude: vif.configuration.localization.LATITUDE,
	            longitude: vif.configuration.localization.LONGITUDE
	          }),
	        '</div>',
	      '</td>'
	    ].join('').format(column);
	  }

	  function _templateTableSortedHeader() {
	    return [
	      '<th data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}" data-sort scope="col">',
	        '<div>{columnTitle}<span class="icon-{sortDirection}"></span></div>',
	      '</th>'
	    ].join('');
	  }

	  function _templateTableUnsortableHeader() {
	    return [
	      '<th data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}" scope="col">',
	        '<div>{columnTitle}</div>',
	      '</th>'
	    ].join('');
	  }

	  function _templateTableHeader() {
	    return [
	      '<th data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}" scope="col">',
	        '<div>{columnTitle}<span class="icon-arrow-down"></span></div>',
	      '</th>'
	    ].join('');
	  }

	  function _templateTable(data, options) {
	    var activeSort = options[0];

	    return _.flatten([
	      '<div class="socrata-table">',
	        '<table>',
	          '<thead>',
	            '<tr>',
	              data.columns.map(function(column) {
	                var template;

	                if (_isGeometryType(column)) {
	                  template = _templateTableUnsortableHeader();
	                } else {
	                  template = activeSort.columnName === column.fieldName ?
	                    _templateTableSortedHeader() :
	                    _templateTableHeader();
	                }

	                return template.format({
	                  columnName: column.fieldName,
	                  columnTitle: (column && column.name) || column.fieldName,
	                  columnDescription: (column && column.description) || '',
	                  renderTypeName: (column && column.renderTypeName) || '',
	                  sortDirection: activeSort.ascending ? 'arrow-down' : 'arrow-up'
	                });
	              }),
	            '</tr>',
	          '</thead>',
	          '<tbody>',
	            _.map(data.rows, function(row) {
	              if (!row) {
	                return '<tr class="null-row"></tr>';
	              }

	              return '<tr>' + data.columns.map(function(column, columnIndex) {
	                return _templateTableCell(column, row[columnIndex]);
	              }).join('\n') + '</tr>';
	            }),
	          '</tbody>',
	        '</table>',
	      '</div>'
	    ]).join('\n');
	  }

	  function _render(data, options) {
	    var $existingTable = self.element.find('.socrata-table');
	    var $template = $(_templateTable(data, options));
	    var scrollLeft = _.get($existingTable, '[0].scrollLeft') || 0;
	    var $newTable;

	    _applyFrozenColumns($template);

	    if ($existingTable.length) {
	      $existingTable.replaceWith($template);
	    } else {
	      self.element.append($template);
	    }

	    $newTable = self.element.find('.socrata-table');
	    $newTable[0].scrollLeft = scrollLeft;

	    // Cache the scrollbar height for later use.
	    _scrollbarHeightPx = _scrollbarHeightPx || $newTable[0].offsetHeight - $newTable[0].clientHeight;
	  }

	  function _attachEvents() {
	    self.element.on('click', '.socrata-table thead th', _handleRowHeaderClick);

	    self.element.on('mouseenter mousemove', '.socrata-table thead th', _showDescriptionFlyout);
	    self.element.on('mouseleave', '.socrata-table thead th', _hideDescriptionFlyout);

	    self.element.on('mouseenter mousemove', '.socrata-table tbody td', _showCellFlyout);
	    self.element.on('mouseleave', '.socrata-table tbody td', _hideCellFlyout);
	  }

	  function _detachEvents() {
	    self.element.off('click', '.socrata-table thead th', _handleRowHeaderClick);

	    self.element.off('mouseenter mousemove', '.socrata-table thead th', _showDescriptionFlyout);
	    self.element.off('mouseleave', '.socrata-table thead th', _hideDescriptionFlyout);

	    self.element.off('mouseenter mousemove', '.socrata-table tbody td', _showCellFlyout);
	    self.element.off('mouseleave', '.socrata-table tbody td', _hideCellFlyout);
	  }

	  function _showDescriptionFlyout(event) {
	    var $target = $(event.currentTarget);
	    var noColumnDescription = '<em>{noColumnDescription}</em>';
	    var description = $target.data('column-description') || noColumnDescription;
	    var content = [
	      '<span>{title}</span><br>',
	      '<span>{description}</span>'
	    ].join('\n');

	    content = content.format({
	      title: $target.text(),
	      description: description,
	      noColumnDescription: vif.configuration.localization.NO_COLUMN_DESCRIPTION
	    });

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
	      {
	        element: $target[0],
	        content: content,
	        belowTarget: true,
	        rightSideHint: false
	      }
	    );
	  }

	  function _hideDescriptionFlyout() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
	      null
	    );
	  }

	  function _showCellFlyout(event) {
	    var $target = $(event.currentTarget).find('div');
	    var data = $target.text();
	    var overflowing = $target[0].clientWidth < $target[0].scrollWidth;

	    if (overflowing) {
	      self.emitEvent(
	        'SOCRATA_VISUALIZATION_CELL_FLYOUT',
	        {
	          element: $target[0],
	          content: data,
	          belowTarget: true,
	          rightSideHint: false
	        }
	      );
	    }
	  }

	  function _hideCellFlyout() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
	      null
	    );
	  }

	  function _isGeometryType(column) {
	    return _.includes([
	      'point',
	      'multipoint',
	      'line',
	      'multiline',
	      'polygon',
	      'multipolygon',
	      'location'
	    ], column.renderTypeName);
	  }

	  function _handleRowHeaderClick() {
	    var columnName = this.getAttribute('data-column-name');
	    var columnRenderType = this.getAttribute('data-column-render-type');

	    if (columnName && !_isGeometryType({renderTypeName: columnRenderType})) {
	      self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_CLICKED', columnName);
	    }
	  }

	  function _applyFrozenColumns($template) {
	    $template.toggleClass('frozen-columns', !!_columnWidths);
	    $template.find('thead th').each(function() {
	      var $th = $(this);
	      var columnName = $th.attr('data-column-name');
	      var frozenWidth = _.get(_columnWidths, columnName, 150);
	      $th.width(frozenWidth + SORT_ICON_WIDTH);
	    });
	  }
	};


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	'use strict';
	var utils = __webpack_require__(3);
	var moment = __webpack_require__(17);

	module.exports = {
	  renderCell: renderCell,
	  renderBooleanCell: renderBooleanCell,
	  renderNumberCell: renderNumberCell,
	  renderGeoCell: renderGeoCell,
	  renderGeoCellHTML: renderGeoCellHTML,
	  renderMoneyCell: renderMoneyCell,
	  renderTimestampCell: renderTimestampCell
	};

	function renderCell(cellContent, column, i18n) {
	  var cellText;

	  utils.assertIsOneOfTypes(column, 'object');
	  utils.assertHasProperty(column, 'renderTypeName');

	  if (_.isUndefined(cellContent)) {
	    return '';
	  }

	  switch (column.renderTypeName) {
	    case 'checkbox':
	      cellText = _.escape(renderBooleanCell(cellContent, column));
	      break;
	    case 'number':
	      cellText = _.escape(renderNumberCell(cellContent, column));
	      break;

	    // Avoid escaping because cell content is HTML.
	    case 'geo_entity':
	    case 'point':
	      cellText = renderGeoCellHTML(cellContent, column, i18n);
	      break;
	    case 'calendar_date':
	      cellText = _.escape(renderTimestampCell(cellContent, column));
	      break;
	    case 'money':
	      cellText = _.escape(renderMoneyCell(cellContent, column));
	      break;
	    default:
	      cellText = _.escape(cellContent);
	      break;
	  }
	  return cellText;
	}



	/**
	* Renders a boolean value in checkbox format
	*/
	function renderBooleanCell(cellContent) {
	  return _.isBoolean(cellContent) && cellContent ? '✓' : '';
	}

	/**
	* Render a number based on column specified formatting.
	* This has lots of possible options, so we delegate to helpers.
	*/
	function renderNumberCell(input, column) {
	  if (_.isNull(input) || _.isUndefined(input) || input.toString().length === 0) {
	    return '';
	  }

	  var amount = parseFloat(input);

	  var format = _.extend({
	    precisionStyle: 'standard',
	    precision: undefined,
	    noCommas: false,
	    currency: '$',
	    decimalSeparator: '.',
	    groupSeparator: ',',
	    mask: null
	  }, column.format || {});

	  format.commaifyOptions = {
	    decimalCharacter: format.decimalSeparator,
	    groupCharacter: format.groupSeparator
	  };

	  if (column.dataTypeName === 'percent') {
	    return _renderPercentageNumber(amount, format);
	  } else if (format.mask) {
	    return _renderMaskedNumber(amount, format);
	  } else {
	    switch (format.precisionStyle) {
	      case 'percentage':
	        return _renderPercentageNumber(amount, format);
	      case 'scientific':
	        return _renderScientificNumber(amount, format);
	      case 'currency':
	        return _renderCurrencyNumber(amount, format);
	      case 'financial':
	        return _renderFinancialNumber(amount, format);
	      case 'standard':
	      default:
	        return _renderStandardNumber(amount, format);
	    }
	  }
	}

	/**
	* Renders a Point in plain text as a lat/lng pair.
	*/
	function renderGeoCell(cellContent) {
	  var latitudeIndex = 1;
	  var longitudeIndex = 0;
	  var coordinates = _cellCoordinates(cellContent);
	  if (coordinates) {
	    return '({latitude}°, {longitude}°)'.format({
	      latitude: coordinates[latitudeIndex],
	      longitude: coordinates[longitudeIndex]
	    });
	  } else {
	    return '';
	  }
	}

	/**
	* Renders a Point wrapped in an HTML span element
	*
	* Parameters:
	* - cellContent: data for the cell (from soda fountain).
	* - i18n: Object containing localized strings for latitude and longitude. Example:
	*   {
	*     latitude: 'Latitude',
	*     longitude: 'Longitude'
	*   }
	*/
	function renderGeoCellHTML(cellContent, columnMetadata, i18n) {
	  var latitudeIndex = 1;
	  var longitudeIndex = 0;
	  var coordinates = _cellCoordinates(cellContent);

	  utils.assertHasProperties(i18n, 'latitude', 'longitude');
	  if (coordinates) {
	    var template = '<span title="{0}">{1}°</span>';
	    var latitude = template.format(i18n.latitude, coordinates[latitudeIndex]);
	    var longitude = template.format(i18n.longitude, coordinates[longitudeIndex]);
	    return '({latitude}, {longitude})'.format({
	      latitude: latitude,
	      longitude: longitude
	    });
	  } else {
	    return '';
	  }
	}

	/**
	* Render a numeric value as currency
	*/
	function renderMoneyCell(cellContent, column) {
	  var format = _.extend({
	    currency: '$',
	    decimalSeparator: '.',
	    groupSeparator: ',',
	    humane: false,
	    precision: 2
	  }, column.format || {});
	  var amount = parseFloat(cellContent);

	  if (_.isFinite(amount)) {
	    if (format.humane) {
	      // We can't use formatNumber here because this use case is
	      // slightly different — we want to enforce a certain precision,
	      // whereas the normal humane numbers want to use the fewest
	      // digits possible at all times.
	      // The handling on thousands-scale numbers is also different,
	      // because humane currency will always be expressed with the K
	      // scale suffix, whereas our normal humane numbers allow four-
	      // digit thousands output.
	      var absVal = Math.abs(amount);
	      if (absVal < 1000) {
	        cellContent = absVal.toFixed(format.precision).
	          replace('.', format.decimalSeparator);
	      } else {
	        // At this point, we know that we're going to use a suffix for
	        // scale, so we lean on commaify to split up the scale groups.
	        // The number of groups can be used to select the correct
	        // scale suffix, and we can do precision-related formatting
	        // by taking the first two scale groups and treating them
	        // as a float.
	        // For instance, "12,345,678" will become an array of three
	        // substrings, and the first two will combine into "12.345"
	        // so that our toFixed call can work its magic.
	        var scaleGroupedVal = utils.commaify(Math.floor(absVal)).split(',');
	        var symbols = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
	        var symbolIndex = scaleGroupedVal.length - 2;

	        var value = parseFloat(scaleGroupedVal[0] + '.' + scaleGroupedVal[1]);
	        value = value.toFixed(format.precision);
	        if (parseFloat(value) === 1000) {
	          // The only edge case is when rounding takes us into the
	          // next scale group: 999,999 should be 1M not 1000K.
	          value = '1';
	          if (format.precision > 0) {
	            value += '.' + _.repeat('0', format.precision);
	          }
	          symbolIndex++;
	        }

	        cellContent = value.replace('.', format.decimalSeparator) + symbols[symbolIndex];
	      }
	    } else {
	      // Normal formatting without abbreviation.
	      var commaifyOptions = {
	        groupCharacter: format.groupSeparator,
	        decimalCharacter: format.decimalSeparator
	      };

	      cellContent = utils.commaify(
	        Math.abs(amount).toFixed(format.precision),
	        commaifyOptions
	      );
	    }
	    cellContent = '{sign}{currency}{cellContent}'.format({
	      sign: amount < 0 ? '-' : '',
	      currency: format.currency,
	      cellContent: cellContent
	    });
	  }
	  return cellContent;
	}

	/**
	* Render a date or timestamp following column formatting, otherwise following defaults.
	*/
	function renderTimestampCell(cellContent, column) {
	  if (!_.isEmpty(cellContent)) {
	    var time = moment(new Date(cellContent));
	    if (time.isValid()) {
	      if (column.format && column.format.formatString) {
	        // Option A: format using user-specified format string
	        return time.format(column.format.formatString);
	      } else if (time.hour() + time.minute() + time.second() + time.millisecond() === 0) {
	        // Option B: infer date-only string format
	        return time.format('YYYY MMM DD');
	      } else {
	        // Option C: use date-with-time format
	        return time.format('YYYY MMM DD hh:mm:ss A');
	      }
	    }
	  }
	  return '';
	}

	/**
	 * hoisted helper methods below
	 * (must belong to this scope in order to access $window)
	 */

	function _renderCurrencyNumber(amount, format) {
	  var isNegative = amount < 0;

	  var value = Math.abs(amount);
	  if (format.precision >= 0) {
	    value = value.toFixed(format.precision);
	  }

	  value = utils.commaify(value, format.commaifyOptions);
	  if (format.noCommas) {
	    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
	  }

	  return '{sign}{currency}{value}'.format({
	    sign: isNegative ? '-' : '',
	    currency: format.currency,
	    value: value
	  });
	}

	function _renderFinancialNumber(amount, format) {
	  var isNegative = amount < 0;

	  var value = Math.abs(amount);
	  if (format.precision >= 0) {
	    value = value.toFixed(format.precision);
	  }

	  value = utils.commaify(value, format.commaifyOptions);
	  if (format.noCommas) {
	    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
	  }

	  if (isNegative) {
	    return '({0})'.format(value);
	  } else {
	    return String(value);
	  }
	}

	function _renderScientificNumber(amount, format) {
	  var value =  amount.toExponential(format.precision);

	  // no groups, so we can skip groupSeparator and commaify and noCommas
	  return value.replace('.', format.decimalSeparator);
	}

	function _renderPercentageNumber(amount, format) {
	  var value = amount;
	  if (format.precision >= 0) {
	    value = value.toFixed(format.precision);
	  }

	  value = utils.commaify(value, format.commaifyOptions);
	  if (format.noCommas) {
	    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
	  }

	  return value + '%';
	}

	function _renderStandardNumber(amount, format) {
	  var value = amount;
	  if (format.precision >= 0) {
	    value = value.toFixed(format.precision);
	  }

	  if (/^-?\d{4}$/.test(value)) {
	    return value;
	  }

	  value = utils.commaify(value, format.commaifyOptions);
	  // Force commaify off for four-digit numbers (workaround for year columns)
	  if (format.noCommas) {
	    value = value.replace(new RegExp('\\' + format.groupSeparator, 'g'), '');
	  }

	  return value;
	}

	// NOTE: In the dataset view, a mask can lead to some really strange output.
	// We're going to start with a simple approach and refine as we go on.
	function _renderMaskedNumber(amount, format) {
	  var maskChar = '#';
	  var amountChars = String(amount).split('');
	  var output = format.mask.slice(0, amountChars.length);

	  while (output.indexOf(maskChar) > -1) {
	    output = output.replace(maskChar, amountChars.shift());
	  }
	  output += amountChars.join('');

	  return output;
	}

	function _cellCoordinates(cellContent) {
	  var coordinates = _.get(cellContent, 'value.coordinates', cellContent.coordinates);
	  return _.isArray(coordinates) ? coordinates : null;
	}



/***/ },
/* 17 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_17__;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var Visualization = __webpack_require__(10);
	var L = __webpack_require__(19);
	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);

	var FEATURE_MAP_MIN_HOVER_THRESHOLD = 5;
	var FEATURE_MAP_MAX_ZOOM = 18; // same as Leaflet default
	var FEATURE_MAP_MAX_TILE_DENSITY = 256 * 256;
	var FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD = 6;
	var FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL = 200;
	var FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL = 250;
	var FEATURE_MAP_FLYOUT_Y_OFFSET = 1.25;
	var FEATURE_MAP_ROW_INSPECTOR_QUERY_BOX_PADDING = 1;
	var FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY = 100;
	var FEATURE_MAP_DEFAULT_HOVER = true;
	var FEATURE_MAP_DEFAULT_PAN_AND_ZOOM = true;
	var FEATURE_MAP_DEFAULT_LOCATE_USER = false;

	function FeatureMap(element, vif) {

	  _.extend(this, new Visualization(element, vif));

	  var self = this;

	  var _mapContainer;
	  var _mapElement;
	  var _mapPanZoomDisabledWarning;
	  var _mapLocateUserButton;
	  // This is the element that will be displayed as a marker.
	  var _userCurrentPositionIcon;
	  // This is the actual marker as it exists on the map. We keep this
	  // reference so that we can remove the existing marker if the user
	  // clicks the 'locate me' button more than one time.
	  var _userCurrentPositionMarker;
	  var _userCurrentPositionBounds;

	  var _defaultMapOptions = {
	    attributionControl: false,
	    center: [47.609895, -122.330259], // Center on Seattle by default.
	    keyboard: false,
	    scrollWheelZoom: false,
	    zoom: 1,
	    zoomControlPosition: 'topleft',
	    maxZoom: FEATURE_MAP_MAX_ZOOM
	  };
	  var _mapOptions;
	  var _debug;
	  var _hover;
	  var _panAndZoom;
	  var _locateUser;
	  var _startResizeFn;
	  var _completeResizeFn;
	  var _baseTileLayer;
	  var _map;
	  var _lastRenderOptions;

	  // We buffer feature layers so that there isn't a visible flash
	  // of emptiness when we transition from one to the next. This is accomplished
	  // by only removing the previous layers when the current one completes rendering.

	  // We also keep a handle on the current feature layer Url so we know which of
	  // the existing layers we can safely remove (i.e. not the current one).
	  var _featureLayers = {};
	  var _flyoutData = {};
	  var _currentLayerId;

	  _debug = vif.configuration.debug;
	  _hover = (_.isUndefined(vif.configuration.hover)) ? FEATURE_MAP_DEFAULT_HOVER : vif.configuration.hover;
	  _panAndZoom = (_.isUndefined(vif.configuration.panAndZoom)) ? FEATURE_MAP_DEFAULT_PAN_AND_ZOOM : vif.configuration.panAndZoom;
	  _locateUser = !(vif.configuration.locateUser && ('geolocation' in navigator)) ? FEATURE_MAP_DEFAULT_LOCATE_USER : vif.configuration.locateUser;

	  _mapOptions = _.merge(_defaultMapOptions, vif.configuration.mapOptions);

	  // Render template here so that we can modify the map container's styles
	  // below.
	  _renderTemplate(this.element);

	  // CORE-4832: Disable pan and zoom on feature map
	  if (!_panAndZoom) {

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
	    _mapPanZoomDisabledWarning.show();
	  }

	  /**
	   * Public methods
	   */

	  this.render = function(renderOptions) {

	    if (_mapElement.width() > 0 && _mapElement.height() > 0) {

	      var boundsChanged;
	      var baseLayerChanged;
	      var vectorTileGetterChanged;

	      // Emit render start event
	      _emitRenderStart();

	      if (!_map) {

	        // Construct leaflet map
	        _map = L.map(_mapElement[0], _mapOptions);
	        // Attach events on first render only
	        _attachEvents(this.element);
	      }

	      boundsChanged = renderOptions.bounds !== _.get(_lastRenderOptions, 'bounds');
	      baseLayerChanged = renderOptions.baseLayer !== _.get(_lastRenderOptions, 'baseLayer');
	      vectorTileGetterChanged = renderOptions.vectorTileGetter !== _.get(_lastRenderOptions, 'vectorTileGetter');

	      _lastRenderOptions = _.cloneDeep(renderOptions);
	      _lastRenderOptions.bounds = new L.LatLngBounds(
	        renderOptions.bounds.getSouthWest(),
	        renderOptions.bounds.getNorthEast()
	      );

	      if (_userCurrentPositionBounds) {
	        _fitBounds(_userCurrentPositionBounds);
	      } else if (boundsChanged) {
	        _fitBounds(renderOptions.bounds);
	      }

	      if (baseLayerChanged) {
	        _updateBaseLayer(renderOptions.baseLayer.url, renderOptions.baseLayer.opacity);
	      }

	      if (vectorTileGetterChanged) {
	        _createNewFeatureLayer(renderOptions.vectorTileGetter);
	      }
	    }
	  };

	  this.renderError = function() {
	    console.error('There was an error rendering this feature map');
	  };

	  this.invalidateSize = function() {
	    if (_map) {
	      _map.invalidateSize();
	    }
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

	  function _renderTemplate(el) {

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
	        'class': 'icon-warning feature-map-pan-zoom-disabled-warning-icon'
	      }
	    );

	    var mapPanZoomDisabledWarning = $(
	      '<div>',
	      {
	        'class': 'feature-map-pan-zoom-disabled-warning'
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

	    if (_locateUser) {

	      var mapLocateUserIcon = $(
	        '<svg class="feature-map-locate-user-icon" viewBox="-289 381 32 32">' +
	        '<polygon class="st0" points="-262.5,386.5 -285.5,398 -274,398 -274,409.5 "/>' +
	        '</svg>'
	      );

	      var mapLocateUserBusySpinner = $(
	        '<div>',
	        {
	          'class': 'feature-map-locate-user-busy-spinner'
	        }
	      );

	      var mapLocateUserErrorIcon = $(
	        '<svg class="feature-map-locate-user-error-icon" viewBox="0 0 1024 1024">' +
	        '<path fill="rgb(68, 68, 68)" d="M978.77 846.495c16.932 33.178 15.816 64.164-3.348 95.176-19.907 31.693-48.312 46.49-85.212 46.49h-756.762c-36.869 0-65.275-14.802-85.181-46.49-18.417-30.264-19.907-61.788-4.434-95.713l378.399-756.495c19.164-36.869 49.055-55.183 89.615-55.183 41.303 0 70.825 18.519 88.561 55.388l378.363 756.828zM455.409 867.517c15.503 15.442 34.324 23.194 56.438 23.194 22.139 0 40.929-7.752 56.438-23.194 15.442-15.503 23.194-34.294 23.194-56.438s-7.752-40.929-23.194-56.438c-15.503-15.503-34.294-23.255-56.438-23.255-22.108 0-40.929 7.752-56.438 23.255-15.473 15.503-23.224 34.294-23.224 56.438s7.752 40.934 23.224 56.438zM450.56 291.84v337.92h122.88v-337.92h-122.88z"/>' +
	        '</svg>'
	      );

	      var mapLocateUserButton = $(
	        '<button>',
	        {
	          'class': 'feature-map-locate-user-btn',
	          'data-locate-user-status': 'ready'
	        }
	      ).append([
	        mapLocateUserIcon,
	        mapLocateUserBusySpinner,
	        mapLocateUserErrorIcon
	      ]);

	      mapContainer.append(mapLocateUserButton);

	      _userCurrentPositionIcon = L.divIcon({ className: 'feature-map-user-current-position-icon' });
	    }

	    self.renderAxisLabels(mapContainer);

	    // Cache element selections
	    _mapContainer = mapContainer;
	    _mapElement = mapElement;
	    _mapPanZoomDisabledWarning = mapPanZoomDisabledWarning;
	    _mapLocateUserButton = mapLocateUserButton;

	    el.append(mapContainer);
	  }

	  function _attachEvents() {
	    var $document = $(document);

	    // Only attach map events if the map has actually been instantiated.
	    if (_map) {
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
	      _map.on('mouseout', _hideFlyout);

	      if (_hover) {
	        _map.on('mousemove', _handleMousemove);

	        // react to the interactions that would close the RowInspector flannel
	        $document.on('click', _captureLeftClickAndClearHighlight);
	        $document.on('keydown', _captureEscapeAndClearHighlight);
	      }

	      _mapPanZoomDisabledWarning.on('mousemove', _handlePanZoomDisabledWarningMousemove);
	      _mapPanZoomDisabledWarning.on('mouseout', _handlePanZoomDisabledWarningMouseout);

	      // While this element does not rely on the map existing, it cannot
	      // have any purpose if the map does not exist so we include it in
	      // the check for map existence anyway.
	      if (_locateUser) {
	        _mapLocateUserButton.on('click', _handleLocateUserButtonClick);
	        _mapLocateUserButton.on('mousemove', _handleLocateUserButtonMousemove);

	        if (!vif.configuration.isMobile) {
	          _mapLocateUserButton.on('mouseout', _hideFlyout);
	        }
	      }
	    }

	    $(window).on('resize', _hideRowInspector);
	  }

	  function _detachEvents() {
	    var $document = $(document);

	    // Only detach map events if the map has actually been instantiated.
	    if (_map) {

	      _map.off('resize', _handleMapResize);
	      _map.off('resize dragend zoomend', _handleExtentChange);
	      _map.off('dragstart zoomstart', _handlePanAndZoom);
	      _map.off('mouseout', _hideFlyout);

	      if (_hover) {
	        _map.off('mousemove', _handleMousemove);

	        $document.on('click', _captureLeftClickAndClearHighlight);
	        $document.on('keydown', _captureEscapeAndClearHighlight);
	      }

	      _mapPanZoomDisabledWarning.off('mousemove', _handlePanZoomDisabledWarningMousemove);
	      _mapPanZoomDisabledWarning.off('mouseout', _handlePanZoomDisabledWarningMouseout);

	      // While this element does not rely on the map existing, it cannot
	      // have any purpose if the map does not exist so we include it in
	      // the check for map existence anyway.
	      if (_locateUser) {
	        _mapLocateUserButton.off('click', _handleLocateUserButtonClick);
	        _mapLocateUserButton.off('mousemove', _handleLocateUserButtonMousemove);
	        _mapLocateUserButton.off('mouseout', _hideFlyout);
	      }
	    }

	    $(window).off('resize', _hideRowInspector);
	  }

	  function _emitRenderStart() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START',
	      null
	    );
	  }

	  function _emitRenderComplete() {
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE',
	      null
	    );
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

	    var formattedBounds;
	    var bounds = _map.getBounds();

	    if (bounds.isValid()) {
	      formattedBounds = {
	        southwest: [bounds.getSouth(), bounds.getWest()],
	        northeast: [bounds.getNorth(), bounds.getEast()]
	      };

	      self.emitEvent(
	        'SOCRATA_VISUALIZATION_FEATURE_MAP_EXTENT_CHANGE',
	        formattedBounds
	      );

	      return formattedBounds;
	    }
	  }

	  function _handlePanAndZoom() {

	    _hideFlyout();
	    _hideRowInspector();
	  }

	  function _handleMousemove(event) {

	    if (_flyoutData.count > 0) {

	      event.originalEvent.target.style.cursor = 'pointer';
	      _showFeatureFlyout(event);

	    } else {

	      event.originalEvent.target.style.cursor = 'inherit';
	      _hideFlyout();

	    }

	  }

	  function _handlePanZoomDisabledWarningMousemove() {
	    _showPanZoomDisabledWarningFlyout();
	  }

	  function _handlePanZoomDisabledWarningMouseout() {
	    _hideFlyout();
	  }

	  function _handleLocateUserButtonClick() {

	    _updateLocateUserButtonStatus('busy');
	    _showLocateUserButtonFlyout();

	    navigator.geolocation.getCurrentPosition(
	      _handleLocateUserSuccess,
	      _handleLocateUserError
	    );
	  }

	  function _handleLocateUserSuccess(position) {

	    // Test position (City Lights bookstore in San Francisco):
	    //
	    // var userLatLng = new L.LatLng(
	    //   37.79771,
	    //   -122.40647
	    // );
	    var userLatLng = new L.LatLng(
	      position.coords.latitude,
	      position.coords.longitude
	    );
	    var featureBounds = _lastRenderOptions.bounds;
	    var distanceFromBoundsSouthWest;
	    var distanceFromBoundsNorthEast;

	    function latLngIsInsideBounds(latLng, bounds) {

	      return (
	        latLng.lat >= bounds.getSouthWest().lat &&
	        latLng.lat <= bounds.getNorthEast().lat &&
	        latLng.lng >= bounds.getSouthWest().lng &&
	        latLng.lng <= bounds.getNorthEast().lng
	      );
	    }

	    // If the user's current location is within the bounds, then do not
	    // adjust the rendered bounds.
	    if (latLngIsInsideBounds(userLatLng, featureBounds)) {

	      _userCurrentPositionBounds = featureBounds;

	    // Otherwise, figure out which edge to extend and update the bounds.
	    } else {

	      distanceFromBoundsSouthWest = userLatLng.distanceTo(featureBounds.getSouthWest());
	      distanceFromBoundsNorthEast = userLatLng.distanceTo(featureBounds.getNorthEast());

	      if (distanceFromBoundsSouthWest <= distanceFromBoundsNorthEast) {

	        _userCurrentPositionBounds = L.latLngBounds(userLatLng, featureBounds.getNorthEast());

	      } else {

	        _userCurrentPositionBounds = L.latLngBounds(featureBounds.getSouthWest(), userLatLng);

	      }
	    }

	    if (!_userCurrentPositionMarker) {

	      _userCurrentPositionMarker = L.marker(
	        userLatLng,
	        {
	          icon: _userCurrentPositionIcon,
	          clickable: false,
	          title: self.getLocalization('USER_CURRENT_POSITION'),
	          alt: self.getLocalization('USER_CURRENT_POSITION')
	        }
	      );

	      _userCurrentPositionMarker.addTo(_map);

	    } else {

	      _userCurrentPositionMarker.update(userLatLng);

	    }

	    _map.fitBounds(
	      _userCurrentPositionBounds,
	      {
	        animate: true
	      }
	    );

	    _updateLocateUserButtonStatus('ready');
	  }

	  function _handleLocateUserError() {

	    _updateLocateUserButtonStatus('error');
	    _showLocateUserButtonFlyout();
	  }

	  function _updateLocateUserButtonStatus(status) {

	    utils.assert(
	      status === 'ready' ||
	      status === 'busy' ||
	      status === 'error',
	      'Unrecognized locate user button status: {0}'.format(status)
	    );

	    switch (status) {

	      case 'ready':
	        _mapLocateUserButton.attr('data-locate-user-status', 'ready');
	        break;

	      case 'busy':
	        _mapLocateUserButton.attr('data-locate-user-status', 'busy');
	        break;

	      case 'error':
	        _mapLocateUserButton.attr('data-locate-user-status', 'error');
	        break;

	      default:
	        break;
	    }
	  }

	  function _handleLocateUserButtonMousemove() {

	    _showLocateUserButtonFlyout();
	  }

	  function _handleVectorTileMousemove(event) {

	    if (event.hasOwnProperty('tile')) {

	      // Set flyout data and force a refresh of the flyout
	      _flyoutData.offset = {
	        x: event.originalEvent.clientX,
	        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
	      };
	      _flyoutData.count = _.sum(event.points, 'count');
	      _flyoutData.totalPoints = event.tile.totalPoints;
	    }
	  }

	  function _handleVectorTileClick(event) {

	    if (vif.configuration.isMobile) {
	      _flyoutData.offset = {
	        x: event.originalEvent.clientX,
	        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
	      };

	      _flyoutData.count = _.sum(event.points, 'count');
	    }

	    var inspectorDataQueryConfig;
	    var position = vif.configuration.isMobile ?
	      { pageX: 0, pageY: (_mapContainer.height() + _mapContainer.offset().top) } :
	      { pageX: event.originalEvent.pageX, pageY: event.originalEvent.pageY };

	    if (_flyoutData.count > 0 &&
	      _flyoutData.count <= FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY) {

	      inspectorDataQueryConfig = {
	        latLng: event.latlng,
	        position: position,
	        rowCount: _.sum(event.points, 'count'),
	        queryBounds: _getQueryBounds(event.containerPoint)
	      };

	      if (vif.configuration.isMobile) {
	        _map.panTo(event.latlng);
	        var bottom = $('.map-container').height() + $('.map-container').offset().top - 120;
	        inspectorDataQueryConfig.position.pageX = 0;
	        inspectorDataQueryConfig.position.pageY = bottom;
	      }

	      _showRowInspector(inspectorDataQueryConfig);

	    }
	  }

	  function _handleVectorTileRenderStart() {

	    _hideFlyout();
	    _hideRowInspector();
	  }

	  function _handleVectorTileRenderComplete() {

	    _removeOldFeatureLayers();

	    if (_hover) {
	      _map.fire('clearhighlightrequest');
	    }

	    // Emit render complete event
	    _emitRenderComplete();
	  }

	  function _showFeatureFlyout(event) {
	    var rowCountUnit;
	    var payload;

	    if (_flyoutData.count === 1) {
	      rowCountUnit = (_.has(_lastRenderOptions, 'unit.one')) ? _lastRenderOptions.unit.one : vif.unit.one;
	    } else {
	      rowCountUnit = (_.has(_lastRenderOptions, 'unit.other')) ? _lastRenderOptions.unit.other : vif.unit.other;
	    }

	    payload = {
	      title: '{0} {1}'.format(
	        _flyoutData.count,
	        rowCountUnit
	      ),
	      notice: self.getLocalization('FLYOUT_CLICK_TO_INSPECT_NOTICE'),
	      flyoutOffset: {
	        left: event.originalEvent.clientX,
	        top: event.originalEvent.clientY
	      }
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
	        payload.title = '{0} {1}'.format(
	          self.getLocalization('FLYOUT_DENSE_DATA_NOTICE'),
	          (_.has(_lastRenderOptions, 'unit.other')) ? _lastRenderOptions.unit.other : vif.unit.other
	        );
	      }
	    }

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
	      payload
	    );
	  }

	  function _showPanZoomDisabledWarningFlyout() {

	    var payload = {
	      element: _mapPanZoomDisabledWarning[0],
	      title: self.getLocalization('FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE')
	    };

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
	      payload
	    );
	  }

	  function _showLocateUserButtonFlyout() {

	    var locateUserStatus = _mapLocateUserButton.attr('data-locate-user-status');
	    var payload;

	    if (locateUserStatus === 'ready') {

	      payload = {
	        element: _mapLocateUserButton[0],
	        title: self.getLocalization('FLYOUT_CLICK_TO_LOCATE_USER_TITLE'),
	        notice: self.getLocalization('FLYOUT_CLICK_TO_LOCATE_USER_NOTICE')
	      };

	    } else if (locateUserStatus === 'busy') {

	      payload = {
	        element: _mapLocateUserButton[0],
	        title: self.getLocalization('FLYOUT_LOCATING_USER_TITLE'),
	        notice: null
	      };

	    } else {

	      payload = {
	        element: _mapLocateUserButton[0],
	        title: self.getLocalization('FLYOUT_LOCATE_USER_ERROR_TITLE'),
	        notice: self.getLocalization('FLYOUT_LOCATE_USER_ERROR_NOTICE')
	      };

	    }

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
	      payload
	    );
	  }

	  function _hideFlyout() {

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_FLYOUT_HIDE',
	      null
	    );
	  }

	  function _showRowInspector(inspectorDataQueryConfig) {

	    var payload = {
	      data: null,
	      position: inspectorDataQueryConfig.position,
	      error: false,
	      message: null
	    };

	    // Emit one event to cause the row inspector to be rendered.
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW',
	      payload
	    );

	    // Emit a second event to initiate a query for the row
	    // data which we intend to inspect.
	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY',
	      inspectorDataQueryConfig
	    );
	  }

	  function _hideRowInspector() {

	    self.emitEvent(
	      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE'
	    );

	    _map.fire('clearhighlightrequest');
	  }

	  function _captureEscapeAndClearHighlight(event) {

	    if (event.which === 27) {
	      _map.fire('clearhighlightrequest');
	    }
	  }

	  function _captureLeftClickAndClearHighlight(event) {

	    var $target = $(event.target);
	    var isLeftClick = event.which === 1;
	    var isOutsideOfCurrentMap = $target.closest('.feature-map-container')[0] !== _mapContainer[0];
	    var isIconClose = $target.is('.icon-close');

	    if (isLeftClick && (isOutsideOfCurrentMap || isIconClose)) {
	      _map.fire('clearhighlightrequest');
	    }
	  }

	  /**
	   * Map behavior
	   */

	  function _updateBaseLayer(url, opacity) {

	    if (_baseTileLayer) {
	      _map.removeLayer(_baseTileLayer);
	    }

	    _baseTileLayer = L.tileLayer(
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
	   * Derives a bounding box that contains each element in a set of points
	   * and then causes the map to fit that bounding box within its viewport.
	   *
	   * @param bounds - The Leaflet LatLngBounds object that represents the
	   *   extents of the column's features.
	   */
	  function _fitBounds(bounds) {

	    // It is critical to invalidate size prior to updating bounds.
	    // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
	    // This manifests itself as the map being zoomed all of the way out.
	    _map.invalidateSize();

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
	      debug: _debug,
	      hover: _hover,
	      debounceMilliseconds: FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL,
	      rowInspectorMaxRowDensity: FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY,
	      maxZoom: FEATURE_MAP_MAX_ZOOM,
	      maxTileDensity: FEATURE_MAP_MAX_TILE_DENSITY,
	      tileOverlapZoomThreshold: FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD,
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
	    return 'rgba(234,105,0,' + (0.2 * Math.pow(zoomLevel / 18, 5) + 0.6) + ')';
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

	module.exports = FeatureMap;


/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_19__;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);

	function FlyoutRenderer() {

	  var FLYOUT_WINDOW_PADDING = 22;
	  var FLYOUT_BOTTOM_PADDING = 1;
	  var FLYOUT_TOP_PADDING = 10;

	  var _window = $(window);
	  var _flyout;
	  var _flyoutContent;
	  var _flyoutHint;

	  // Don't attempt to add yourself to the DOM unless
	  // it actually exists.
	  $(function() {
	    _renderFlyoutTemplate();
	    _hideFlyout();
	  });

	  /**
	   * Public methods
	   */

	  this.render = function(options) {
	    _renderFlyoutData(options);
	  };

	  this.clear = function() {
	    _hideFlyout();
	  };

	  /**
	   * Private methods
	   */

	  function _renderFlyoutTemplate() {

	    var flyoutContent = $(
	      '<div>',
	      {
	        'class': 'socrata-flyout-content'
	      }
	    );

	    var flyoutHint = $(
	      '<div>',
	      {
	        'class': 'socrata-flyout-hint'
	      }
	    );

	    var flyout = $(
	      '<div>',
	      {
	        id: 'socrata-flyout'
	      }
	    ).append([
	      flyoutContent,
	      flyoutHint
	    ]);

	    _flyout = flyout;
	    _flyoutContent = flyoutContent;
	    _flyoutHint = flyoutHint;

	    $('body').append(flyout);
	  }

	  /**
	   * This is a jQuery event handler that responds to `.trigger()`, so the
	   * second argument is expected and contains the payload of the event.
	   */
	  function _renderFlyoutData(options) {

	    var content = options.content;
	    var flyoutOffset = options.flyoutOffset;
	    var belowTarget = options.belowTarget;
	    var rightSideHint = options.rightSideHint;
	    var windowWidth;
	    var flyoutWidth;
	    var flyoutHeight;
	    var flyoutHintHeight;
	    var flyoutStyles = {
	      left: '',
	      top: ''
	    };
	    var flyoutHintStyles = {
	      left: '',
	      top: ''
	    };
	    var flyoutTargetBoundingClientRect;
	    var flyoutRightEdge;
	    var windowRightEdgeMinusPadding;

	    // Reset the left position so that width calculations are not
	    // affected by text flow.
	    _flyout.css('left', 0);
	    _flyoutContent.html(content);

	    // Use $(window).width() instead of window.innerWidth because
	    // the latter includes scrollbars depending on the browser.
	    windowWidth = _window.width();
	    flyoutWidth = _flyout.outerWidth(true);
	    flyoutHeight = _flyout.outerHeight(true);
	    flyoutHintHeight = _flyoutHint.outerHeight(true);

	    // Set the left and top of flyout depending on its type
	    if (flyoutOffset) {

	      // Position the flyout so that the hint points to the current
	      // location of the cursor.
	      flyoutStyles.left = flyoutOffset.left;
	      flyoutStyles.top = flyoutOffset.top -
	        flyoutHeight -
	        flyoutHintHeight -
	        FLYOUT_BOTTOM_PADDING;

	    } else {

	      flyoutTargetBoundingClientRect = options.element.getBoundingClientRect();

	      // Set the left of the flyout to the exact middle of the
	      // target element.
	      flyoutStyles.left = flyoutTargetBoundingClientRect.left +
	        (flyoutTargetBoundingClientRect.width / 2);

	      // Set the top of the flyout, depending on whether the flyout
	      // should be positioned above or below the target.
	      if (belowTarget) {

	        flyoutStyles.top = flyoutTargetBoundingClientRect.bottom +
	          flyoutHintHeight +
	          FLYOUT_TOP_PADDING;

	      } else {

	        flyoutStyles.top = flyoutTargetBoundingClientRect.top -
	          (flyoutHeight + flyoutHintHeight) -
	          FLYOUT_BOTTOM_PADDING;
	      }
	    }

	    flyoutRightEdge = flyoutStyles.left + flyoutWidth;
	    windowRightEdgeMinusPadding = windowWidth - FLYOUT_WINDOW_PADDING;

	    // If the right edge of the flyout will be drawn off the right edge of
	    // the screen, move the flyout to the left until its right edge is flush
	    // with the right edge of the screen less the FLYOUT_WINDOW_PADDING.
	    if (flyoutRightEdge >= windowRightEdgeMinusPadding) {

	      // Adjust the position of the hint first so that it remains centered
	      // over the element.
	      flyoutHintStyles.left = flyoutStyles.left -
	        (windowRightEdgeMinusPadding - flyoutWidth);
	      // Then move the left edge of the flyout content over until it is
	      // correctly positioned.
	      flyoutStyles.left -= (flyoutRightEdge - windowRightEdgeMinusPadding);
	    }

	    // If hint is at least halfway across the flyout, change its orientation.
	    if (flyoutHintStyles.left > flyoutWidth / 2) {

	      flyoutHintStyles.left = flyoutHintStyles.left - flyoutHintHeight;
	      rightSideHint = true;
	    }

	    // If top of flyout is cut off by window, top-align the flyout.
	    if (flyoutStyles.top < 0) {
	      flyoutStyles.top = 0;
	    }

	    // Apply computed styles to the flyout hint.
	    _flyoutHint.css(flyoutHintStyles);

	    _flyout.
	      toggleClass('southwest', !rightSideHint && !belowTarget).
	      toggleClass('southeast', rightSideHint && !belowTarget).
	      toggleClass('northwest', !rightSideHint && belowTarget).
	      toggleClass('northeast', rightSideHint && belowTarget).
	      css(flyoutStyles);

	    _showFlyout();
	  }

	  function _showFlyout() {
	    _flyout.addClass('visible');
	  }

	  function _hideFlyout() {
	    _flyout.removeClass('visible');
	  }
	}

	module.exports = FlyoutRenderer;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);

	var ROW_INSPECTOR_WIDTH = 350;
	var ROW_INSPECTOR_MAX_CONTENT_HEIGHT = 250;
	var ROW_INSPECTOR_WINDOW_PADDING = 22;
	var ROW_INSPECTOR_PADDING_COMPENSATION = 3;
	var ROW_INSPECTOR_HINT_WIDTH = 10;

	var ROW_INSPECTOR_DEFAULT_TRANSLATIONS = {
	  previous: 'Previous',
	  next: 'Next',
	  defaultLabelUnit: 'Row',
	  showing: 'Showing {0}',
	  paging: '{0} of {1}'
	};

	var _$rowInspectorContainer;
	var _$rowInspectorToolPanel;
	var _$rowInspectorContent;
	var _$rowInspectorToolPanelHint;
	var _$paginationButtonPrevious;
	var _$paginationButtonNext;
	var _$pagingPanel;
	var _$paginationMessage;
	var _$paginationPosition;
	var _$pendingContent;
	var _$errorContent;
	var _$stickyBorderBottom;

	var _config;
	var _state;

	var _$target;

	/**
	 * @function setup
	 * @description
	 *
	 * Adds JavaScript functionality to a row inspector template.
	 *
	 * In this particular case, the row inspector is a flyout panel
	 * that visualizes tabular data. It includes paging between
	 * rows of the data, and showing per-column visualizations of
	 * the row data.
	 *
	 * Events and Interaction:
	 *
	 *   - Example with Successful Payload:
	 *
	 *     { error: false,
	 *       message: null,
	 *       position: {pageX: 0, pageY: 0}, // Must be numbers
	 *       labelUnit: null, // or a string literal
	 *       data: [ // This attribute is optional, a spinner will be shown if missing/null.
	 *         [ // Represents a row
	 *           {column: 'columnName', value: 'columnValue' }, // Represents a column.
	 *           ...
	 *         ],
	 *         ...
	 *       ]
	 *     }
	 *
	 *   - Example with Error Payload:
	 *
	 *     { error: true,
	 *       message: 'There was an error',
	 *       position: {pageX: 0, pageY: 0} // Must be numbers
	 *     }
	 *
	 *   Event Names:
	 *
	 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW:
	 *   - Places the row inspector where the mouse was clicked.
	 *   - Optionally, Accepts a payload (See example payload)
	 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE:
	 *   - Accepts a payload and loads the first row into the view.
	 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE:
	 *   - Hides the row inspector.
	 *
	 * @param {Object} config - An object containing translations in a localization-keyed subobject.
	 *
	 * Example Configuration:
	 *   config = {
	 *     localization: {
	 *       previous: 'PREVIOUS'
	 *     }
	 *   }
	 *
	 * @param {Object} $target - Target container. Falls back to body
	 *
	 * These translations will be merged into the default translations.
	 * For other available keys, see ROW_INSPECTOR_DEFAULT_TRANSLATIONS in this file.
	 */
	function setup(config, $target) {
	  _config = _.cloneDeep(config || {});

	  _config.localization = _config.localization || {};
	  _config.localization = _.merge({}, ROW_INSPECTOR_DEFAULT_TRANSLATIONS, _config.localization);

	  _$target = $target || $('body');

	  if (_$target.find('#socrata-row-inspector').length === 0) {

	    if (_config.isMobile) {

	      _$rowInspectorContainer = $(
	        [
	          '<div id="socrata-row-inspector">',
	            '<div class="tool-panel">',
	              '<div class="tool-panel-arrow"></div>',
	              '<div class="tool-panel-main">',
	                '<div class="icon-close"></div>',
	                '<div class="paging-panel">',
	                  '<button type="button" class="l-to-r paging-btn action-btn previous">',
	                    '<span class="arrow"></span>',
	                  '</button>',
	                  '<button type="button" class="r-to-l paging-btn action-btn next">',
	                    '<span class="arrow"></span>',
	                  '</button>',
	                  '<div class="paging-info">',
	                    '<div class="message">',
	                      '<div></div>',
	                      '<div></div>',
	                    '</div>',
	                  '</div>',
	                '</div>',
	                '<div class="tool-panel-inner-container">',
	                  '<!-- Successful query response -->',
	                  '<div class="row-inspector-content">',
	                    '<div class="row-data-item">',
	                      '<span class="name"></span>',
	                      '<span class="value"></span>',
	                    '</div>',
	                  '</div>',
	                  '<!-- Loading spinner while query pending-->',
	                  '<div class="pending-content"></div>',
	                  '<!-- Error message if row query unsuccessful -->',
	                  '<div class="error-content">',
	                    '<div class="icon-warning"></div>',
	                    '<div class="error-message"></div>',
	                  '</div>',
	                '</div>',
	                '<div class="sticky-border bottom show-more">',
	                  '<a class="show-more-button">',
	                  '<span class="show-details">Show More</span>',
	                  '<span class="hide-details">Show Less</span>',
	                  '</a>',
	                '</div>',
	              '</div>',
	            '</div>',
	          '</div>'
	        ].join('')
	      );

	    } else {

	      _$rowInspectorContainer = $(
	        [
	          '<div id="socrata-row-inspector">',
	            '<div class="tool-panel">',
	              '<div class="tool-panel-main">',
	                '<div class="icon-close"></div>',
	                '<div class="sticky-border"></div>',
	                '<div class="tool-panel-inner-container">',
	                  '<!-- Successful query response -->',
	                  '<div class="row-inspector-content">',
	                    '<div class="row-data-item">',
	                      '<span class="name"></span>',
	                      '<span class="value"></span>',
	                    '</div>',
	                  '</div>',
	                  '<!-- Loading spinner while query pending-->',
	                  '<div class="pending-content"></div>',
	                  '<!-- Error message if row query unsuccessful -->',
	                  '<div class="error-content">',
	                    '<div class="icon-warning"></div>',
	                    '<div class="error-message"></div>',
	                  '</div>',
	                '</div>',
	                '<div class="sticky-border bottom"></div>',
	                '<div class="paging-panel">',
	                  '<button type="button" class="l-to-r paging-btn action-btn previous">',
	                    '<span class="caret"></span>',
	                  '</button>',
	                  '<button type="button" class="r-to-l paging-btn action-btn next">',
	                    '<span class="caret"></span>',
	                  '</button>',
	                  '<div class="paging-info">',
	                    '<div class="message">',
	                      '<div></div>',
	                      '<div></div>',
	                    '</div>',
	                  '</div>',
	                '</div>',
	                '<div class="tool-panel-hint"></div>',
	              '</div>',
	            '</div>',
	          '</div>'
	        ].join('')
	      );

	    }

	    _$target.append(_$rowInspectorContainer);

	  } else {

	    _$rowInspectorContainer = _$target.find('#socrata-row-inspector');

	  }

	  // Grab all children that we run operations on.
	  _$rowInspectorToolPanel = _$rowInspectorContainer.find('.tool-panel');
	  _$rowInspectorContent = _$rowInspectorContainer.find('.row-inspector-content');
	  _$pendingContent = _$rowInspectorContainer.find('.pending-content');
	  _$errorContent = _$rowInspectorContainer.find('.error-content');
	  _$rowInspectorToolPanelHint = _$rowInspectorContainer.find('.tool-panel-hint');
	  _$paginationButtonPrevious = _$rowInspectorContainer.find('.paging-btn.previous');
	  _$paginationButtonNext = _$rowInspectorContainer.find('.paging-btn.next');
	  _$pagingPanel = _$rowInspectorContainer.find('.paging-panel');
	  _$paginationMessage = _$rowInspectorContainer.find('.paging-info .message div:first-child');
	  _$paginationPosition = _$rowInspectorContainer.find('.paging-info .message div + div');
	  _$stickyBorderBottom = _$rowInspectorContainer.find('.sticky-border.bottom');

	  // Add translations
	  if (!_config.isMobile) {
	    _$paginationButtonPrevious.find('span').text(_config.localization.previous);
	    _$paginationButtonNext.find('span').text(_config.localization.next);
	  }

	  // rowInspectorSetup can be called multiple times
	  // but we only want our bindings set once.
	  _attachEventsOnce();
	}

	var _attachEventsOnce = _.once(function() {
	  var $document = $(document);
	  var $body = $(document.body);

	  _$target.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function(event, jQueryPayload) {
	    event.stopPropagation();

	    // These events are CustomEvents. jQuery < 3.0 does not understand that
	    // event.detail should be passed as an argument to the handler.
	    var payload = jQueryPayload || _.get(event, 'originalEvent.detail');

	    // Defer, otherwise the click that triggered this event will immediately close the flannel.
	    _.defer(_show);
	    _setState(payload);
	  });

	  _$target.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', function(event, jQueryPayload) {
	    event.stopPropagation();

	    // These events are CustomEvents. jQuery < 3.0 does not understand that
	    // event.detail should be passed as an argument to the handler.
	    var payload = jQueryPayload || _.get(event, 'originalEvent.detail');

	    if (_.isUndefined(payload.position)) {
	      // Reuse position from SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW if not specified.
	      payload.position = _state.position;
	    }

	    _setState(payload);
	  });

	  $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE', _hide);
	  $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_ADJUST_POSITION', _render);

	  $document.on('click', _captureLeftClickAndHide);
	  $document.on('keydown', _captureEscapeAndHide);

	  _$paginationButtonPrevious.on('click', _decrementPageByOne);
	  _$paginationButtonNext.on('click', _incrementPageByOne);
	});

	function _captureLeftClickAndHide(event) {
	  var $target = $(event.target);
	  var isLeftClick = event.which === 1;
	  var isOutsideOfRowInspector = $target.closest(_$rowInspectorContainer).length === 0;
	  var isIconClose = $target.is('.icon-close');

	  if (isLeftClick && (isOutsideOfRowInspector || isIconClose)) {
	    _hide();
	  }
	}

	function _captureEscapeAndHide(event) {
	  if (event.which === 27) {
	    _hide();
	  }
	}

	function _incrementPageByOne() {
	  _state.pageIndex = Math.min(_state.pageIndex + 1, _state.rows.length - 1);
	  _render();
	}

	function _decrementPageByOne() {
	  _state.pageIndex = Math.max(0, _state.pageIndex - 1);
	  _render();
	}

	function _adjustPosition(position) {
	  var hintRightOffset;
	  var hintPositionFromRight;
	  var distanceOutOfView = $(window).scrollTop();
	  var xPosition = position.pageX;
	  var yPosition = position.pageY;
	  var windowWidth = $(window).width();
	  var windowHeight = $(window).innerHeight();
	  var positionFlannelEast = false;
	  var positionFlannelNorth = false;

	  var abutsRightEdge = windowWidth <
	    (xPosition + ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_WINDOW_PADDING);

	  var panelPositionStyle = {left: '', right: ''};
	  var hintPositionStyle = {left: '', right: ''};

	  panelPositionStyle.top = '{0}px'.format(yPosition);

	  // Display flannel above clicked point if the point is more than halfway
	  // down the window viewport. Else display flannel below the point.
	  positionFlannelNorth = (yPosition - distanceOutOfView) < (windowHeight / 2);

	  if (abutsRightEdge) {
	    positionFlannelEast = xPosition + (ROW_INSPECTOR_WIDTH / 2) >
	      windowWidth - (ROW_INSPECTOR_WINDOW_PADDING + ROW_INSPECTOR_PADDING_COMPENSATION);

	    panelPositionStyle.right = '{0}px'.format(
	      ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
	    );

	    hintRightOffset = xPosition + ROW_INSPECTOR_WINDOW_PADDING +
	      (positionFlannelEast ? 0 : ROW_INSPECTOR_HINT_WIDTH);
	    hintPositionFromRight = Math.max(0, windowWidth - hintRightOffset);

	    hintPositionStyle.right = '{0}px'.format(hintPositionFromRight);
	    hintPositionStyle.left = 'auto';
	  } else {
	    panelPositionStyle.left = '{0}px'.format(xPosition);
	    positionFlannelEast = false;
	  }

	  _$rowInspectorToolPanel.css(panelPositionStyle);
	  _$rowInspectorToolPanelHint.css(hintPositionStyle);
	  _$rowInspectorToolPanel.toggleClass('west', !positionFlannelEast);
	  _$rowInspectorToolPanel.toggleClass('east', positionFlannelEast);
	  _$rowInspectorToolPanel.toggleClass('south', !positionFlannelNorth);
	  _$rowInspectorToolPanel.toggleClass('north', positionFlannelNorth);
	}


	function _render() {
	  var rows = _state.rows;
	  var position = _state.position;
	  var hasRows = Array.isArray(rows) && rows.length;
	  var isScrollable;
	  var scrollingElement = _$rowInspectorContainer.find('.tool-panel-inner-container');

	  // Set position
	  _adjustPosition(position);

	  // Set initial paging button states
	  _$paginationButtonPrevious.prop('disabled', true);
	  _$paginationButtonNext.prop('disabled', true);

	  // Conditionally hide the pending content
	  _$pendingContent.toggleClass('visible', !hasRows && !_state.error);

	  _renderPage();
	  _renderPagination();
	  _renderError();

	  isScrollable = _$rowInspectorContent.innerHeight() >
	    ROW_INSPECTOR_MAX_CONTENT_HEIGHT;

	  utils.isolateScrolling(scrollingElement, isScrollable);
	}

	function _renderError() {
	  var message = _state.message;
	  var $errorMessage = _$rowInspectorContainer.find('.error-message');

	  $errorMessage.text(message);
	  _$errorContent.toggleClass('visible', _state.error);
	}

	function _renderPage() {
	  var row = _.get(_state, ['rows', _state.pageIndex]);
	  var title = _.get(_state, ['titles', _state.pageIndex]);

	  _$rowInspectorContent.empty();

	  // We may not have a row to render, but we still want to
	  // render pagination and clean out a previously-rendered page.
	  if (!row) {
	    return;
	  }

	  utils.assert(Array.isArray(row), 'rowInspector data must be composed of an array of arrays');
	  utils.assert(row.length > 0, 'This row is empty.');

	  if (title) {
	    _$rowInspectorContent.append('<h3 class="row-inspector-title">{0}</h3>'.format(title));
	  }

	  row.forEach(function(columnValue) {
	    var $rowDataItem = $('<div>', {'class': 'row-data-item'});
	    var $name = $('<span>', {'class': 'name'});
	    var $value = $('<span>', {'class': 'value'});

	    utils.assertHasProperties(columnValue, 'column', 'value');

	    $name.text(columnValue.column);
	    $value.text(columnValue.value);

	    $rowDataItem.append($name).append($value);
	    _$rowInspectorContent.append($rowDataItem);
	  });
	}

	function _renderPagination() {
	  var numRows = _.get(_state, 'rows.length');
	  var labelUnit = _state.labelUnit;

	  if (numRows > 1) {
	    _$paginationMessage.text(_config.localization.showing.format(labelUnit));
	    _$paginationPosition.text(_config.localization.paging.format(_state.pageIndex + 1, numRows));
	    _$paginationButtonPrevious.prop('disabled', _state.pageIndex === 0);
	    _$paginationButtonNext.prop('disabled', _state.pageIndex === numRows - 1);

	    _$pagingPanel.addClass('visible');
	    _$stickyBorderBottom.css('bottom', _$pagingPanel.outerHeight());
	  } else {
	    _$pagingPanel.removeClass('visible');
	    _$stickyBorderBottom.css('bottom', 0);
	  }
	}

	function _show() {
	  _$rowInspectorContainer.addClass('visible');
	}

	function _hide() {
	  _$rowInspectorContainer.removeClass('visible');
	}

	function _setState(payload) {
	  utils.assertIsOneOfTypes(payload, 'object');

	  utils.assertHasProperties(payload, 'position', 'error');
	  utils.assertHasProperties(payload.position, 'pageX', 'pageY');

	  if (payload.data) {
	    utils.assert(_.isArray(payload.data), 'rowInspector row data must be an array');
	  }

	  if (payload.titles) {
	    utils.assert(_.isArray(payload.titles), 'rowInspector title data must be an array');
	  }

	  _state = {
	    rows: payload.error ? null : payload.data,
	    titles: payload.error ? null : payload.titles,
	    labelUnit: payload.labelUnit || _config.localization.defaultLabelUnit,
	    error: payload.error,
	    message: payload.message,
	    position: payload.position,
	    pageIndex: 0
	  };

	  _render();
	}

	module.exports = {
	  setup: setup
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var GeospaceDataProvider = __webpack_require__(23);
	var MetadataProvider = __webpack_require__(25);
	var SoqlDataProvider = __webpack_require__(26);
	var TileserverDataProvider = __webpack_require__(27);
	var VectorTileManager = __webpack_require__(28);

	module.exports = {
	  GeospaceDataProvider: GeospaceDataProvider,
	  MetadataProvider: MetadataProvider,
	  SoqlDataProvider: SoqlDataProvider,
	  TileserverDataProvider: TileserverDataProvider,
	  VectorTileManager: VectorTileManager
	};



/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var DataProvider = __webpack_require__(24);
	var _ = __webpack_require__(9);

	function GeospaceDataProvider(config) {

	  _.extend(this, new DataProvider(config));

	  utils.assertHasProperty(config, 'domain');
	  utils.assertHasProperty(config, 'datasetUid');

	  utils.assertIsOneOfTypes(config.domain, 'string');
	  utils.assertIsOneOfTypes(config.datasetUid, 'string');

	  /**
	   * Public methods
	   */

	  this.getFeatureExtent = function(columnName) {
	    var url = 'https://{0}/resource/{1}.json?$select=extent({2})'.format(
	      this.getConfigurationProperty('domain'),
	      this.getConfigurationProperty('datasetUid'),
	      columnName
	    );
	    var headers = {
	      Accept: 'application/json'
	    };

	    return (
	      new Promise(function(resolve, reject) {
	        var xhr = new XMLHttpRequest();

	        function onFail() {
	          var error;

	          try {
	            error = JSON.parse(xhr.responseText);
	          } catch (e) {
	            console.log(e);
	            error = xhr.statusText;
	          }

	          return reject({
	            status: parseInt(xhr.status, 10),
	            message: xhr.statusText,
	            soqlError: error
	          });
	        }

	        xhr.onload = function() {
	          var status = parseInt(xhr.status, 10);

	          if (status === 200) {

	            try {
	              var responseTextWithoutNewlines = xhr.
	                responseText.
	                replace(/\n/g, '');
	              var coordinates = _.get(
	                JSON.parse(responseTextWithoutNewlines),
	                '[0].extent_{0}.coordinates[0][0]'.format(columnName)
	              );

	              if (!_.isUndefined(coordinates)) {

	                return resolve({
	                  southwest: [coordinates[0][1], coordinates[0][0]],
	                  northeast: [coordinates[2][1], coordinates[2][0]]
	                });
	              }
	            } catch (e) {
	              // Let this fall through to the `onFail()` below.
	            }
	          }

	          onFail();
	        };

	        xhr.onabort = onFail;
	        xhr.onerror = onFail;

	        xhr.open('GET', url, true);

	        // Set user-defined headers.
	        _.each(headers, function(value, key) {
	          xhr.setRequestHeader(key, value);
	        });

	        xhr.send();
	      })
	    );
	  };

	  this.getShapefile = function(extent) {
	    var url = 'https://{0}/resource/{1}.geojson'.format(
	      this.getConfigurationProperty('domain'),
	      this.getConfigurationProperty('datasetUid')
	    );
	    var headers = {
	      Accept: 'application/json'
	    };
	    var extentQuery = "?$select=*&$where=intersects(the_geom, 'MULTIPOLYGON((({0})))')&$limit=5000";
	    var extentValidationErrorMessage = 'Argument `extent` must be an object ' +
	      'with two keys: `southwest` and `northeast`; the value assigned to ' +
	      'each key must be an array of two numbers in the following format: `[' +
	      'latitude, longitude]`.';

	    // Do not use a looser test for falsiness because if an invalid extent is
	    // provided in any form we want to kick an error up to help with debugging.
	    if (!_.isUndefined(extent)) {
	      if (extentIsValid(extent)) {

	        url += extentQuery.format(
	          mapExtentToMultipolygon(extent)
	        );

	      } else {

	        return (
	          new Promise(function(resolve, reject) {
	            return reject({
	              status: -1,
	              message: extentValidationErrorMessage,
	              soqlError: null
	            });
	          })
	        );
	      }
	    }

	    return (
	      new Promise(function(resolve, reject) {
	        var xhr = new XMLHttpRequest();

	        function onFail() {
	          var error;

	          try {
	            error = JSON.parse(xhr.responseText);
	          } catch (e) {
	            console.log(e);
	            error = xhr.statusText;
	          }

	          return reject({
	            status: parseInt(xhr.status, 10),
	            message: xhr.statusText,
	            soqlError: error
	          });
	        }

	        xhr.onload = function() {
	          var status = parseInt(xhr.status, 10);

	          if (status === 200) {

	            try {
	              var responseTextWithoutNewlines = xhr.
	                responseText.
	                replace(/\n/g, '');

	              resolve(JSON.parse(responseTextWithoutNewlines));

	            } catch (e) {
	              console.log(e);
	              // Let this fall through to the `onFail()` below.
	            }
	          }

	          onFail();
	        };

	        xhr.onabort = onFail;
	        xhr.onerror = onFail;

	        xhr.open('GET', url, true);

	        // Set user-defined headers.
	        _.each(headers, function(value, key) {
	          xhr.setRequestHeader(key, value);
	        });

	        xhr.send();
	      })
	    );
	  };

	  function extentIsValid(extent) {

	    return (
	      // Validate that it is an object with northeast and
	      // southwest properties.
	      _.isObject(extent) &&
	      // Next validate the northeast property.
	      _.isArray(extent.northeast) &&
	      extent.northeast.length === 2 &&
	      _.every(extent.northeast, _.isNumber) &&
	      // Then validate the southwest property.
	      _.isArray(extent.southwest) &&
	      extent.southwest.length === 2 &&
	      _.every(extent.southwest, _.isNumber)
	    );
	  }

	  /**
	   * Multipolygon queries expect a polygon in clockwise order, starting from
	   * the bottom left. Polygons are closed, meaning that the start and end
	   * points must be identical.
	   *
	   * Example:
	   *
	   * 2----3
	   * |    |
	   * 1,5--4
	   *
	   * Where each pair is: longitude latitude
	   */
	  function mapExtentToMultipolygon(extent) {

	    return '{0} {1},{2} {3},{4} {5},{6} {7}, {8} {9}'.format(
	      extent.southwest[1],
	      extent.southwest[0],
	      extent.southwest[1],
	      extent.northeast[0],
	      extent.northeast[1],
	      extent.northeast[0],
	      extent.northeast[1],
	      extent.southwest[0],
	      extent.southwest[1],
	      extent.southwest[0]
	    );
	  }
	}

	module.exports = GeospaceDataProvider;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);

	function DataProvider(config) {

	  var _defaultConfig = {
	    timeout: 5000
	  };
	  var _config = _.merge(_defaultConfig, config);

	  /**
	   * Public methods
	   */

	  /**
	   * @param {String} property - The desired configuration property key.
	   *
	   * @return {*} - The configuration property value that was passed in
	   *   at instantiation.
	   */
	  this.getConfigurationProperty = function(property) {

	    if (!_.has(_config, property)) {

	      throw new Error(
	        'Configuration property `{0}` does not exist.'.format(property)
	      );
	    }

	    return _config[property];
	  };

	  this.emitEvent = function(name, payload) {
	    this.element[0].dispatchEvent(
	      new window.CustomEvent(
	        name,
	        { detail: payload, bubbles: true }
	      )
	    );
	  };

	  /**
	   * Parse headers into a key => value mapping.
	   *
	   * @param {string} headers - Raw headers as a string.
	   *
	   * @return {Object} Parsed headers as key value object.
	   */
	  this.parseHeaders = function(headers) {

	    var parsed = {};
	    var key;
	    var val;
	    var colonIndex;

	    if (!headers) {
	      return parsed;
	    }

	    headers.
	      split('\n').
	      forEach(function(line) {
	        colonIndex = line.indexOf(':');
	        key = line.substr(0, colonIndex).trim().toLowerCase();
	        val = line.substr(colonIndex + 1).trim();

	        if (key) {
	          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	        }
	      }
	    );

	    return parsed;
	  };

	  /**
	   * Private methods
	   */
	}

	module.exports = DataProvider;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var DataProvider = __webpack_require__(24);
	var _ = __webpack_require__(9);

	function MetadataProvider(config) {
	  var self = this;

	  _.extend(this, new DataProvider(config));

	  utils.assertHasProperty(config, 'domain');
	  utils.assertHasProperty(config, 'datasetUid');

	  utils.assertIsOneOfTypes(config.domain, 'string');
	  utils.assertIsOneOfTypes(config.datasetUid, 'string');

	  /**
	   * Public methods
	   */

	  /**
	   * NOTE:
	   * Columns are structured in an Array.
	   * (See: https://localhost/api/docs/types#View)
	   */
	  this.getDatasetMetadata = function() {
	    var url = 'https://{0}/api/views/{1}.json'.format(
	      this.getConfigurationProperty('domain'),
	      this.getConfigurationProperty('datasetUid')
	    );

	    return Promise.resolve($.get(url));
	  };

	  /**
	   * NOTE:
	   * Columns are structured in an object, where the key is the
	   * API field name and the value is column metadata.
	   */
	  this.getPhidippidesAugmentedDatasetMetadata = function() {

	    var url = 'https://{0}/metadata/v1/dataset/{1}.json'.format(
	      this.getConfigurationProperty('domain'),
	      this.getConfigurationProperty('datasetUid')
	    );
	    var headers = {
	      Accept: 'application/json'
	    };

	    return new Promise(function(resolve, reject) {

	      var xhr = new XMLHttpRequest();

	      function onFail() {

	        return reject({
	          status: parseInt(xhr.status, 10),
	          message: xhr.statusText
	        });
	      }

	      xhr.onload = function() {

	        var status = parseInt(xhr.status, 10);

	        if (status === 200) {

	          try {

	            return resolve(
	              JSON.parse(xhr.responseText)
	            );
	          } catch (e) {
	            // Let this fall through to the `onFail()` below.
	          }
	        }

	        onFail();
	      };

	      xhr.onabort = onFail;
	      xhr.onerror = onFail;

	      xhr.open('GET', url, true);

	      // Set user-defined headers.
	      _.each(headers, function(value, key) {
	        xhr.setRequestHeader(key, value);
	      });

	      xhr.send();
	    });
	  };

	  this.isSystemColumn = function(fieldName) {
	    return fieldName[0] === ':';
	  };

	  /*
	   * CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
	   * sub-columns become their own columns. This function uses heuristics to figure out if a
	   * column is likely to be a subcolumn (so not guaranteed to be 100% accurate!).
	   *
	   * This code is lifted from frontend: lib/common_metadata_methods.rb.
	   */
	  this.isSubcolumn = function(fieldName, datasetMetadata) {
	    utils.assertIsOneOfTypes(fieldName, 'string');

	    var isSubcolumn = false;
	    var columns = datasetMetadata.columns;
	    var fieldNameByName = {};

	    var fieldNameWithoutCollisionSuffix = fieldName.replace(/_\d+$/g, '');
	    var hasExplodedSuffix = /_(address|city|state|zip|type|description)$/.test(fieldNameWithoutCollisionSuffix);

	    var matchedColumn = _.find(columns, _.matches({ fieldName: fieldName }));
	    var parentColumnName;

	    utils.assert(
	      matchedColumn,
	      'could not find column {0} in dataset {1}'.format(fieldName, datasetMetadata.id)
	    );

	    // The naming convention is that child column names are the parent column name, followed by the
	    // child column name in parentheses. Remove the parentheses to get the parent column's name.
	    parentColumnName = matchedColumn.name.replace(/(\w) +\(.+\)$/, '$1');

	    /*
	     * CORE-6925: Fairly brittle, but with no other clear option, it seems that
	     * we can and should only flag a column as a subcolumn if it follows the
	     * naming conventions associated with "exploding" location, URL, and phone
	     * number columns, which is an OBE-to-NBE occurrence. Robert Macomber has
	     * verified the closed set of suffixes in Slack PM:
	     *
	     *   _type for the type subcolumn on phones (the number has no suffix)
	     *   _description for the description subcolumn on urls (the url itself has no suffix)
	     *   _address, _city, _state, _zip for location columns (the point has no suffix)
	     *
	     * See also https://socrata.slack.com/archives/engineering/p1442959713000621
	     * for an unfortunately lengthy conversation on this topic.
	     *
	     * Complicating this matter... there is no strict guarantee that any suffix
	     * for collision prevention (e.g. `_1`) will belong to a user-given column
	     * or an exploded column consistently. It's possible that a user will have
	     * a column ending in a number. Given that we're already restricting the
	     * columns that we're willing to mark as subcolumns based on the closed set
	     * of (non-numeric) suffixes, and the low probability of this very specific
	     * type of column name similarity, we'll strip numeric parts off the end of
	     * the column name *before* checking the closed set. This leaves us with a
	     * very low (but non-zero) probability that a user-provided column will be
	     * marked as an exploded subcolumn.
	     */


	    if (parentColumnName !== matchedColumn.name && hasExplodedSuffix) {
	      _.each(columns, function(column) {
	        fieldNameByName[column.name] = fieldNameByName[column.name] || [];
	        fieldNameByName[column.name].push(column.fieldName);
	      });

	      // Look for the parent column
	      // There are columns that have the same name as this one, sans parenthetical.
	      // Its field_name naming convention should also match, for us to infer it's a subcolumn.
	      isSubcolumn = (fieldNameByName[parentColumnName] || []).
	        some(function(parentFieldName) {
	          return parentFieldName + '_' === fieldName.substring(0, parentFieldName.length + 1);
	        });
	    }

	    return isSubcolumn;
	  };

	  // Given a dataset metadata object (see .getDatasetMetadata()),
	  // returns an array of the columns  which are suitable for
	  // display to the user (all columns minus system and subcolumns).
	  //
	  // @return {Object[]}
	  this.getDisplayableColumns = function(datasetMetadata) {
	    utils.assertHasProperty(datasetMetadata, 'columns');

	    return _.reject(datasetMetadata.columns, function(column) {
	      return self.isSystemColumn(column.fieldName) ||
	        self.isSubcolumn(column.fieldName, datasetMetadata);
	    });
	  };


	}

	module.exports = MetadataProvider;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var DataProvider = __webpack_require__(24);
	var _ = __webpack_require__(9);

	/**
	 * `SoqlDataProvider` is an implementation of `DataProvider` that enables
	 * users to query SoQL data sources on the current domain.
	 *
	 * @constructor
	 *
	 * @param {Object} config
	 *  @property {String} domain - The domain against which to make the query.
	 *  @property {String} datasetUid - The uid of the dataset against which
	 *    the user intends to query.
	 */
	function SoqlDataProvider(config) {
	  'use strict';

	  _.extend(this, new DataProvider(config));

	  utils.assertHasProperty(config, 'domain');
	  utils.assertHasProperty(config, 'datasetUid');

	  utils.assertIsOneOfTypes(config.domain, 'string');
	  utils.assertIsOneOfTypes(config.datasetUid, 'string');

	  var _self = this;

	  /**
	   * Public methods
	   */

	  this.buildBaseQuery = function() {
	    // TODO: Implement mapping of filters array into a query string
	    return '';
	  };

	  /**
	   * `.query()` executes a SoQL query against the current domain that returns
	   * key => value pairs. The query string is passed in by the caller, meaning
	   * that at this level of abstraction we have no notion of SoQL grammar.
	   *
	   * A note on `nameAlias` and `valueAlias`:
	   *
	   *   Since it is possible that columns have names that may collide with
	   *   SoQL keywords (e.g. a column named 'null'), we alias all fields in
	   *   the SELECT clause like this:
	   *
	   *     "SELECT `null` as ALIAS_NAME, `false` AS ALIAS_VALUE..."
	   *
	   *   These aliases are set by the caller and will also be used as column
	   *   names in the resulting 'table' object returned by the request.
	   *
	   * @param {String} queryString - A valid SoQL query.
	   * @param {String} nameAlias - The alias used for the 'name' column.
	   * @param {String} valueAlias - The alias used for the 'value' column.
	   *
	   * @return {Promise}
	   */
	  this.query = function(queryString, nameAlias, valueAlias) {

	    var url = _queryUrl('$query={0}'.format(queryString));

	    return _makeSoqlGetRequestWithSalt(url).then(
	      function(data) {
	        return _mapRowsResponseToTable([ nameAlias, valueAlias ], data);
	      }
	    );
	  };

	  this.getRowCount = function() {
	    return Promise.resolve(
	      $.get(_queryUrl('$select=count(*)'))
	    ).then(
	      function(data) {
	        return parseInt(_.get(data, '[0].count'), 10);
	      }
	    );
	  };

	  /**
	   * `.getRows()` executes a SoQL query against the current domain that
	   * returns all rows. The response is mapped to the DataProvider data schema (1).
	   * The query string is passed in by the caller, meaning
	   * that at this level of abstraction we have no notion of SoQL grammar.
	   *
	   * @param {String[]} columnNames - A list of column names to extract from the response.
	   * @param {String} queryString - A valid SoQL query.
	   *
	   * (1) - The DataProvider data schema:
	   * {
	   *   columns: {String[]},
	   *   rows: {{Object[]}[]}.
	   * }
	   * Row:
	   *
	   * Example:
	   * {
	   *   columns: [ 'date', 'id' ],
	   *   rows: [
	   *    [ '2016-01-15T11:08:45.000', '123' ],
	   *    [ '2016-01-15T11:08:45.000', '345' ]
	   *   ]
	   * }
	   *
	   * @return {Promise}
	   */
	  this.getRows = function(columnNames, queryString) {
	    utils.assertInstanceOf(columnNames, Array);
	    utils.assert(columnNames.length > 0);
	    utils.assertIsOneOfTypes(queryString, 'string');
	    _.each(columnNames, function(columnName) {
	      utils.assertIsOneOfTypes(columnName, 'string');
	    });

	    return _makeSoqlGetRequestWithSalt(_queryUrl(queryString)).then(
	      function(soqlData) {
	        return _mapRowsResponseToTable(columnNames, soqlData);
	      }
	    );
	  };

	  /**
	   * `.getTableData()`
	   *
	   * Gets a page of data from the dataset. In addition to an offset
	   * and limit, you must specify an ordering and a list of columns.
	   *
	   * @param {String[]} columnNames - Columns to grab data from.
	   * @param {Object[]} order - An array of order clauses. For the moment, there must always
	   *                           be exactly one order clause. A clause looks like:
	   *                           {
	   *                             columnName: {String} - a column,
	   *                             ascending: {Boolean} - ascending or descending
	   *                           }
	   * @param {Number} offset - Skip this many rows.
	   * @param {Number} limit - Fetch this many rows, starting from offset.
	   *
	   * @return {Promise}
	   */
	  this.getTableData = function(columnNames, order, offset, limit, whereClauseComponents) {
	    utils.assertInstanceOf(columnNames, Array);
	    utils.assertIsOneOfTypes(offset, 'number');
	    utils.assertIsOneOfTypes(limit, 'number');

	    // We only support one order for the moment.
	    utils.assert(order.length === 1, 'order parameter must be an array with exactly one element.');

	    utils.assertHasProperties(order,
	      '[0].ascending',
	      '[0].columnName'
	    );

	    var queryString = '$select={0}&$order=`{1}`+{2}&$limit={3}&$offset={4}{5}'.format(
	      columnNames.map(_escapeColumnName).join(','),
	      order[0].columnName,
	      (order[0].ascending ? 'ASC' : 'DESC'),
	      limit,
	      offset,
	      whereClauseComponents ? "&$where=" + whereClauseComponents : ''
	    );

	    return _makeSoqlGetRequestWithSalt(_queryUrl(queryString)).then(function(data) {
	      return _mapRowsResponseToTable(columnNames, data);
	    });
	  };

	  /**
	   * Private methods
	   */

	  // Returns a Promise for a GET against the given SOQL url.
	  // Adds salt to the end of the URL for cache bust.
	  // On error, rejects with an object: {
	  //   status: HTTP code,
	  //   message: status text,
	  //   soqlError: response JSON
	  // }
	  function _makeSoqlGetRequestWithSalt(url) {
	    return Promise.resolve($.get(_withSalt(url))).
	      catch(function(error) {
	        return Promise.reject({
	          status: parseInt(error.status, 10),
	          message: error.statusText,
	          soqlError: error.responseJSON || error.responseText
	        });
	      });
	  }

	  function _escapeColumnName(columnName) {
	    return '`{0}`'.format(columnName);
	  }

	  function _queryUrl(queryString) {
	    return 'https://{0}/api/id/{1}.json?{2}'.format(
	      _self.getConfigurationProperty('domain'),
	      _self.getConfigurationProperty('datasetUid'),
	      queryString
	    );
	  }

	  /**
	   * Transforms a raw row request result into a 'table' object.
	   *
	   * @param {String[]} columnNames - The list of columns to process.
	   * @param {Object[]} data - The row request result, which is an array of
	   *    objects with keys equal to the column name and values equal to the
	   *    row value for each respective column.
	   *
	   * @return {Object}
	   *   @property {String[]} columns - An ordered list of the column aliases
	   *     present in the query.
	   *   @property {[][]} rows - An array of rows returned by the query.
	   *
	   * The columns array is of the format:
	   *
	   *   [<first column name>, <second column name>, ...]
	   *
	   * Accordingly, each row in the rows array is of the format:
	   *
	   *   [
	   *     <first column value>,
	   *     <second column value>,
	   *     ...
	   *   ]
	   */
	  function _mapRowsResponseToTable(columnNames, data) {

	    var table = {
	      columns: columnNames,
	      rows: []
	    };

	    if (data.length > 0) {

	      var rows = data.map(function(datum) {

	        var row = [];

	        for (var i = 0; i < table.columns.length; i++) {

	          var column = table.columns[i];
	          var value = datum.hasOwnProperty(column) ? datum[column] : undefined;

	          row.push(value);
	        }

	        return row;
	      });

	      table.rows = rows;
	    }

	    return table;
	  }

	  /**
	   * Transforms a URL to include a salt on the end.
	   * https://socrata.atlassian.net/browse/CHART-204
	   *
	   * @param {string} url
	   * @return {string} salted url
	   */
	  function _withSalt(url) {
	    var hasQuery = _.includes(url, '?');
	    var formatVars = { url: url, salt: new Date().getTime() };

	    if (hasQuery) {
	      return '{url}&_={salt}'.format(formatVars);
	    } else {
	      return '{url}?_={salt}'.format(formatVars);
	    }
	  }
	}

	module.exports = SoqlDataProvider;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var DataProvider = __webpack_require__(24);
	var _ = __webpack_require__(9);

	var MAX_FEATURES_PER_TILE = 256 * 256;
	var DEFAULT_FEATURES_PER_TILE = 50000;

	/**
	 * @param {Object} config
	 *   @property {String[]} tileserverHosts - An array of tileserver hostnames
	 *     against which to make requests. Hostnames in this array must include
	 *     a protocol (e.g. 'https://tileserver.example.com').
	 *   @property {Number} [featuresPerTile] - The maximum number of features
	 *     expected per tile. This defaults to (256 * 256). This value will be
	 *     provided as the `LIMIT` parameter in the query string.
	 *   @property {String} cname - The CNAME of the current domain. This value
	 *     will be provided as the 'X-Socrata-Host' header in tile data requests.
	 */
	function TileserverDataProvider(config) {

	  _.extend(this, new DataProvider(config));

	  utils.assertHasProperty(config, 'domain');
	  utils.assertHasProperty(config, 'datasetUid');
	  utils.assertHasProperty(config, 'columnName');
	  utils.assertHasProperty(config, 'featuresPerTile');
	  utils.assertHasProperty(config, 'tileserverHosts');

	  utils.assertIsOneOfTypes(config.domain, 'string');
	  utils.assertIsOneOfTypes(config.datasetUid, 'string');
	  utils.assertIsOneOfTypes(config.columnName, 'string');
	  utils.assertIsOneOfTypes(config.featuresPerTile, 'number');
	  utils.assertIsOneOfTypes(config.tileserverHosts, 'object');

	  var _self = this;

	  var _originHost = '{0}//{1}'.format(window.location.protocol, window.location.host);
	  var _instanceRequestIdComponent = _randomNChars(16);

	  /**
	   * Public methods
	   */

	  /**
	   * Curries datasetUid, columnName and whereClause into a function that can
	   * be called to perform an ajax call for a vector tile
	   *
	   * @param {String} columnName
	   * @param {String} datasetUid
	   * @param {String} [whereClause]
	   * @param {Boolean} [useOriginHost] - Whether or not all tiles should be
	   *   requested from the origin host (as opposed to selecting one of the
	   *   hosts in the `tileserverHosts` configuration property.
	   *
	   * @return {Function}
	   */
	  this.buildTileGetter = function(whereClause, useOriginHost) {

	    var domain = this.getConfigurationProperty('domain');
	    var datasetUid = this.getConfigurationProperty('datasetUid');
	    var columnName = this.getConfigurationProperty('columnName');
	    var featuresPerTile = parseInt(this.getConfigurationProperty('featuresPerTile'), 10);

	    utils.assertIsOneOfTypes(whereClause, 'string', 'undefined');
	    utils.assertIsOneOfTypes(useOriginHost, 'boolean', 'undefined');

	    if (
	      _.isNaN(featuresPerTile) ||
	      featuresPerTile < 0 ||
	      featuresPerTile > MAX_FEATURES_PER_TILE
	    ) {

	      featuresPerTile = DEFAULT_FEATURES_PER_TILE;
	    }

	    /**
	     * Returns a promise that, when resolved, will provide error details or
	     * the result of the tile data request as an ArrayBuffer.
	     *
	     * @param {Number} zoom
	     * @param {Number} x
	     * @param {Number} y
	     *
	     * @return {Promise}
	     */
	    function tileGetter(zoom, x, y) {

	      utils.assertIsOneOfTypes(zoom, 'number');
	      utils.assertIsOneOfTypes(x, 'number');
	      utils.assertIsOneOfTypes(y, 'number');

	      var url = '{0}/tiles/{1}/{2}/{3}/{4}/{5}.pbf?'.format(
	        _getHost(x, y, useOriginHost),
	        datasetUid,
	        columnName,
	        zoom,
	        x,
	        y
	      );

	      url += '$limit={0}'.format(featuresPerTile);

	      if (!_.isEmpty(whereClause)) {
	        url += '&$WHERE={0}'.format(whereClause);
	      }

	      return _getArrayBuffer(
	        url,
	        {
	          headers: {
	            'X-Socrata-Host': domain,
	            'X-Socrata-RequestId': _instanceRequestIdComponent + _randomNChars(16)
	          }
	        }
	      );
	    }

	    return tileGetter;
	  };

	  /**
	   * Private methods
	   */

	  function _randomNChars(n) {
	    var text = '';
	    var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	    for (var i = 0; i < n; i++ ) {
	      text += possible.charAt(Math.floor(Math.random() * possible.length));
	    }

	    return text;
	  }

	  /**
	   * Given the x and y values for a tile and whether to use the the origin host,
	   * if there is an array of tileservers available, return one for a public
	   * tileserver hosts, otherwise return the originating host
	   *
	   * @param {Number} x
	   * @param {Number} y
	   * @param {Boolean} useOriginHost
	   *
	   * @return {String}
	   */
	  function _getHost(x, y, useOriginHost) {

	    var tileserverHosts = _self.getConfigurationProperty('tileserverHosts');
	    var index;
	    var host;

	    if (useOriginHost || _.isEmpty(tileserverHosts)) {

	      host = _originHost;

	    } else {

	      index = (Math.abs(x) + Math.abs(y)) % tileserverHosts.length;
	      host = tileserverHosts[index];
	    }

	    return host;
	  }

	  /**
	   * IE9 doesn't support binary data in xhr.response, so we have to
	   * use a righteous hack (See: http://stackoverflow.com/a/4330882).
	   */
	  function _xhrHasVBArray(xhr) {

	    return (
	      _.isUndefined(xhr.response) &&
	      _.isDefined(window.VBArray) &&
	      typeof xhr.responseBody === 'unknown' // eslint-disable-line valid-typeof
	    );
	  }

	  function _typedArrayFromArrayBufferResponse(xhr) {

	    // Handle IE.
	    if (_xhrHasVBArray(xhr)) {
	      return new VBArray(xhr.responseBody).toArray();
	    // Fall back to default for well-behaved browsers.
	    } else if (xhr.response && xhr.response instanceof ArrayBuffer) {
	      return new Uint8Array(xhr.response);
	    }

	    return undefined;
	  }

	  /**
	   * Makes an AJAX request for an array buffer to Socrata Tileserver.
	   *
	   * @param {String} url
	   * @param {{headers: Object}} configuration
	   *
	   * @return {Promise}
	   */
	  function _getArrayBuffer(url, configuration) {

	    return (
	      new Promise(
	        function(resolve, reject) {
	          var xhr = new XMLHttpRequest();

	          function onFail() {

	            return reject({
	              status: parseInt(xhr.status, 10),
	              headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
	              config: configuration,
	              statusText: xhr.statusText
	            });
	          }

	          xhr.onload = function() {

	            var arrayBuffer;
	            var status = parseInt(xhr.status, 10);

	            if (status === 200) {

	              arrayBuffer = _typedArrayFromArrayBufferResponse(xhr);

	              if (!_.isUndefined(arrayBuffer)) {

	                return resolve({
	                  data: arrayBuffer,
	                  status: status,
	                  headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
	                  config: configuration,
	                  statusText: xhr.statusText
	                });
	              }
	            }

	            onFail();
	          };

	          xhr.onabort = onFail;
	          xhr.onerror = onFail;

	          xhr.open('GET', url, true);

	          // Set user-defined headers.
	          _.each(configuration.headers, function(value, key) {
	            xhr.setRequestHeader(key, value);
	          });

	          xhr.responseType = 'arraybuffer';

	          xhr.send();
	        }
	      ).catch(
	        function(error) {
	          throw error;
	        }
	      )
	    );
	  }
	}

	module.exports = TileserverDataProvider;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var utils = __webpack_require__(3);
	var d3 = __webpack_require__(4);
	var L = __webpack_require__(19);
	var VectorTile = __webpack_require__(29).VectorTile;
	var pbf = __webpack_require__(34);

	/**
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
	  },

	  hotspots: [
	    ['top'],
	    ['left'],
	    ['bottom'],
	    ['right']
	  ].concat(
	    _.zip(
	      ['top', 'top', 'bottom', 'bottom'],
	      ['left', 'right', 'left', 'right']
	    )
	  ),

	  oppositeDirections: {
	    top: 'bottom',
	    bottom: 'top',
	    left: 'right',
	    right: 'left'
	  },

	  tileSize: 256,

	  tileIdModifiers: {
	    top: function(neighborTile) {
	      neighborTile.y--;
	    },
	    left: function(neighborTile) {
	      neighborTile.x--;
	    },
	    bottom: function(neighborTile) {
	      neighborTile.y++;
	    },
	    right: function(neighborTile) {
	      neighborTile.x++;
	    }
	  },

	  tileOffsetModifiers: {
	    top: function(tileOffset) {
	      tileOffset.y -= VectorTileUtil.tileSize;
	    },
	    left: function(tileOffset) {
	      tileOffset.x -= VectorTileUtil.tileSize;
	    },
	    bottom: function(tileOffset) {
	      tileOffset.y += VectorTileUtil.tileSize;
	    },
	    right: function(tileOffset) {
	      tileOffset.x += VectorTileUtil.tileSize;
	    }
	  }
	};

	/**
	 * VectorTileFeature
	 *
	 * Depends on `VectorTileUtil`
	 */

	function VectorTileFeature(layer, feature, getFeatureStyle) {

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
	  this.getFeatureStyle = getFeatureStyle;
	}

	// Takes a coordinate from a vector tile and turns it into a Leaflet Point.
	VectorTileFeature.prototype.projectGeometryToTilePoint = function(coordinates) {
	  return new L.Point(coordinates.x / this.divisor, coordinates.y / this.divisor);
	};

	VectorTileFeature.prototype.draw = function(tileId, offset) {

	  var feature = this.feature;
	  var canvas = VectorTileUtil.getTileLayerCanvas(this.tileLayer, tileId);

	  switch (feature.type) {
	    case 1: //Point
	      this.drawPoint(canvas, feature.coordinates, this.getFeatureStyle, offset);
	      break;

	    case 2: //LineString
	      this.drawLineString(canvas, feature.coordinates, this.getFeatureStyle);
	      break;

	    case 3: //Polygon
	      this.drawPolygon(canvas, feature.coordinates, this.getFeatureStyle);
	      break;

	    default:
	      throw new Error('Cannot draw VectorTileFeature: unrecognized type: "{0}"'.format(feature.type));
	  }
	};

	VectorTileFeature.prototype.drawPoint = function(canvas, geometry, computedStyle, offset) {
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

	  if (offset) {
	    projectedPoint.x += offset.x;
	    projectedPoint.y += offset.y;
	  }

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

	  function validateOutline(computedOutline) {
	    var validatedOutline = null;
	    if (_.has(computedOutline, 'color') && _.has(computedOutline, 'size')) {
	      validatedOutline = computedOutline;
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
	    ctx.fillStyle = computedStyle.color();
	  } else {
	    ctx.fillStyle = computedStyle.color;
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


	/**
	 *
	 * VectorTileLayer
	 *
	 * Originally forked from https://gist.github.com/DGuidi/1716010
	 *
	 * Depends on `VectorTileFeature`
	 */

	var VectorTileLayer = L.TileLayer.Canvas.extend({

	  initialize: function(tileManager, options) {

	    this.options = {
	      tileSize: VectorTileUtil.tileSize
	    };
	    L.Util.setOptions(this, options);

	    this.tileManager = tileManager;
	    this.getFeatureStyle = options.getFeatureStyle;
	    this.featuresByTile = {};
	    this.totalPointsByTile = {};
	    this.quadTreesByTile = {};
	    this.boundaryPointsByTile = {};
	    this.boundaryPointCountByTileAndDirection = {};
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
	    this.boundaryPointsByTile[tileId] = {
	      top: [],
	      left: [],
	      bottom: [],
	      right: []
	    };
	    this.boundaryPointCountByTileAndDirection[tileId] = {
	      top: 0,
	      left: 0,
	      right: 0,
	      bottom: 0,
	      topleft: 0,
	      topright: 0,
	      bottomleft: 0,
	      bottomright: 0
	    };

	    return this;
	  },

	  loadData: function(vectorTileData, tileId, tileRenderedCallback) {

	    var features = vectorTileData.features;
	    var i;
	    var featureCount = features.length;
	    var feature;
	    var featureArray;
	    var featurePointCount = 0;
	    var tileSize = this.options.tileSize;

	    var style = this.getFeatureStyle({type: 1});
	    var featureRadius;
	    if (_.isFunction(style.radius)) {
	      featureRadius = style.radius(this.map.getZoom());
	    } else {
	      featureRadius = style.radius;
	    }

	    if (!this.featuresByTile.hasOwnProperty(tileId) && featureCount > 0) {
	      this.featuresByTile[tileId] = [];
	    }

	    if (!this.quadTreesByTile.hasOwnProperty(tileId) && featureCount > 0) {
	      this.quadTreesByTile[tileId] = this.tileManager.quadTreeFactory([]);
	    }

	    featureArray = this.featuresByTile[tileId];

	    for (i = 0; i < featureCount; i++) {
	      feature = features[i];

	      var vectorTileFeature = new VectorTileFeature(this, feature, this.getFeatureStyle(feature));
	      var projectedPoint = vectorTileFeature.projectGeometryToTilePoint(vectorTileFeature.coordinates[0][0]);

	      var boundaryPoints = this.boundaryPointsByTile[tileId];
	      if (boundaryPoints) {
	        if (projectedPoint.x <= featureRadius) {
	          boundaryPoints.left.push(vectorTileFeature);
	        } else if (projectedPoint.x >= tileSize - featureRadius) {
	          boundaryPoints.right.push(vectorTileFeature);
	        }

	        if (projectedPoint.y <= featureRadius) {
	          boundaryPoints.top.push(vectorTileFeature);
	        } else if (projectedPoint.y >= tileSize - featureRadius) {
	          boundaryPoints.bottom.push(vectorTileFeature);
	        }
	      }

	      projectedPoint.count = vectorTileFeature.properties.count;
	      featurePointCount += parseInt(_.get(vectorTileFeature, 'properties.count', 0), 10);

	      projectedPoint.tile = tileId;
	      this.quadTreesByTile[tileId].add(projectedPoint);

	      featureArray.push(vectorTileFeature);
	    }

	    this.totalPointsByTile[tileId] = featurePointCount;
	    this.renderTile(tileId, tileRenderedCallback);
	  },

	  renderTileOverlap: function(tileId) {
	    var self = this;

	    var tileInfo = _.chain(['z', 'x', 'y']).
	      zipObject(tileId.split(':')).
	      mapValues(Number).
	      value();

	    _.each(VectorTileUtil.hotspots, function(hotspot) {
	      var neighbor = _.clone(tileInfo);
	      var offset = {x: 0, y: 0};

	      _.each(hotspot, function(direction) {
	        VectorTileUtil.tileIdModifiers[direction](neighbor);
	        VectorTileUtil.tileOffsetModifiers[direction](offset);
	      });

	      neighbor.zoom = neighbor.z;
	      neighbor.id = VectorTileUtil.getTileId(neighbor);
	      var features = [];

	      _.each(hotspot, function(direction) {
	        if (self.boundaryPointsByTile[neighbor.id]) {
	          features = features.concat(self.boundaryPointsByTile[neighbor.id][VectorTileUtil.oppositeDirections[direction]]);
	        }
	      });

	      var featureCount = features.length;
	      var serializedHotspot = hotspot.join('');
	      var boundaryPointCount = self.boundaryPointCountByTileAndDirection[tileId];
	      if (boundaryPointCount && (!boundaryPointCount[serializedHotspot] || boundaryPointCount[serializedHotspot] < featureCount)) {
	        boundaryPointCount[serializedHotspot] = featureCount;
	        for (var i = 0; i < featureCount; i++) {
	          features[i].draw(tileId, offset);
	        }
	      }
	    });
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


	/**
	 * VectorTileManager
	 *
	 * Depends on `pbf`, `VectorTileUtil` `VectorTile`, `VectorTileFeature` and `VectorTileLayer`
	 */

	L.TileLayer.VectorTileManager = L.TileLayer.Canvas.extend({

	  initialize: function(options) {

	    utils.assertIsOneOfTypes(options, 'object');
	    utils.assertHasProperties(
	      options,
	      'vectorTileGetter',
	      'getFeatureStyle'
	    );

	    utils.assertIsOneOfTypes(options.vectorTileGetter, 'function');
	    utils.assertIsOneOfTypes(options.getFeatureStyle, 'function');

	    var self = this;

	    var pointStyle;
	    var maxThreshold;
	    var tileSize;

	    function drawHighlightTile(canvas, tilePoint, zoom, pointsToHighlight) {

	      var ctx = canvas.getContext('2d');
	      var tileId = VectorTileUtil.getTileId({ x: tilePoint.x, y: tilePoint.y, zoom: zoom });

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

	    this.getFeatureStyle = options.getFeatureStyle;

	    pointStyle = this.getFeatureStyle({ type: 1 }); // getPointStyle in featureMap.js

	    this.options = {
	      debug: false,
	      // Initialize the layer to be non-interactive so that we do not attempt
	      // to handle events while the layer is loading. This value is then set
	      // to true once the layer has completed loading.
	      interactive: false,
	      tileSize: VectorTileUtil.tileSize,
	      debounceMilliseconds: 500,
	      onRenderStart: _.noop,
	      onRenderComplete: _.noop,
	      // threshold options represent distance to neighboring points permitted for hover and click in px
	      getHoverThreshold: _.noop,
	      maxHoverThreshold: pointStyle.radius(options.maxZoom),
	      maxTileDensity: options.maxTileDensity,
	      tileOverlapZoomThreshold: options.tileOverlapZoomThreshold
	    };

	    L.Util.setOptions(this, options);

	    // Layers present in the protocol buffer responses.
	    this.layers = {};
	    this.outstandingTileDataRequests = {};
	    this.map = null;
	    this.delayedTileDataRequests = [];
	    this.firstRequest = true;
	    this.debouncedFlushOutstandingQueue = _.debounce(
	      this.flushOutstandingQueue,
	      this.options.debounceMilliseconds
	    );

	    // Each tile has its own quad tree containing points in that tile.
	    // On hover, for tiles within the threshold but not containing the hover
	    // point, we map the mouse coordinates to the coordinate space of the
	    // neighboring tile to test the neighboring tile's points that lie within
	    // the threshold of the hover point.
	    //
	    // We create a quad tree factory here to make it easier to make many quad
	    // trees with the same parameters.
	    maxThreshold = this.options.maxHoverThreshold;
	    tileSize = this.options.tileSize;

	    this.quadTreeFactory = d3.geom.quadtree();
	    this.quadTreeFactory.extent([
	      [-maxThreshold, -maxThreshold],
	      [tileSize + maxThreshold, tileSize + maxThreshold]
	    ]);
	    this.quadTreeFactory.x(_.property('x'));
	    this.quadTreeFactory.y(_.property('y'));

	    // Add a canvas layer for drawing highlighted points.
	    this.hoverHighlightLayer = L.tileLayer.canvas({ zIndex: 2 });

	    // Add a less dynamic canvas layer for drawing highlighted clicked points
	    this.clickHighlightLayer = L.tileLayer.canvas({ zIndex: 2 });

	    this.currentHoverPoints = [];
	    this.currentClickedPoints = [];

	    this.hoverHighlightLayer.drawTile = function(canvas, tilePoint, zoom) {
	      drawHighlightTile(canvas, tilePoint, zoom, self.currentHoverPoints);
	    };

	    this.clickHighlightLayer.drawTile = function(canvas, tilePoint, zoom) {
	      drawHighlightTile(canvas, tilePoint, zoom, self.currentClickedPoints);
	    };
	  },

	  onAdd: function(map) {

	    var self = this;
	    var mapMousedownCallback;
	    var mapMouseupCallback;
	    var mapMousemoveCallback;
	    var mapClickCallback;
	    var mapMouseoutCallback;

	    var mapDragstartCallback;
	    var mapZoomstartCallback;

	    var flannelClosedCallback;
	    var clearHighlightRequestCallback;

	    this.map = map;
	    this.hoverHighlightLayer.addTo(map);
	    this.clickHighlightLayer.addTo(map);

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

	      // Now get those neighboring tile ids
	      neighboringTiles = _.compact(
	        _.map(
	          VectorTileUtil.hotspots,
	          function(hotspot) {

	            // hotspot is ['left'], ['left', 'top'], etc...
	            // This ensures that all edgeTests for the given hotspot values
	            // are true, which means that the mouse is within threshold of
	            // all hotspot values (aka edges).
	            if (_.all(_.at(edgeTests, hotspot), _.identity)) {
	              var neighborTile = _.clone(tile);
	              var neighborOffset = _.clone(mouseTileOffset);

	              _.each(hotspot, function(dir) {
	                VectorTileUtil.tileIdModifiers[dir](neighborTile);
	                VectorTileUtil.tileOffsetModifiers[VectorTileUtil.oppositeDirections[dir]](neighborOffset);
	              });

	              return {
	                id: VectorTileUtil.getTileId(neighborTile),
	                offset: neighborOffset
	              };
	            }

	            return false;
	          }
	        )
	      );

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
	      var layer = self.layers.main;

	      e.tile = VectorTileUtil.getTileInfoByPointAndZoomLevel(e.latlng, map.getZoom());
	      e.tile.id = VectorTileUtil.getTileId(e.tile);
	      e.tile.totalPoints = VectorTileUtil.getTileTotalPoints(layer, e.tile.id);

	      var tileCanvas = VectorTileUtil.getTileLayerCanvas(layer, e.tile.id);
	      var hoverThreshold = self.options.getHoverThreshold(map.getZoom());

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
	        var tile = { x: coordinates[0], y: coordinates[1] };

	        layerToHighlight.drawTile(canvas, tile, map.getZoom());
	      });
	    }

	    self.clearClickedPointHighlights = function clearClickedPointHighlights() {

	      if (!_.isEmpty(self.currentClickedPoints)) {

	        self.currentClickedPoints = [];
	        highlightPoints(self.clickHighlightLayer);
	      }
	    };

	    self.clearHoverPointHighlights = function clearHoverPointHighlights() {

	      if (!_.isEmpty(self.currentHoverPoints)) {

	        self.currentHoverPoints = [];
	        highlightPoints(self.hoverHighlightLayer);
	      }
	    };

	    // Handle callbacks for executable functions of events
	    if (_.isFunction(this.options.onMousedown)) {

	      mapMousedownCallback = function(e) {

	        injectTileInfo(e);
	        self.options.onMousedown(e);
	      };

	      map.on('mousedown', mapMousedownCallback);
	    }

	    if (_.isFunction(this.options.onMouseup)) {

	      mapMouseupCallback = function(e) {

	        injectTileInfo(e);
	        self.options.onMouseup(e);
	      };

	      map.on('mouseup', mapMouseupCallback);
	    }

	    if (_.isFunction(this.options.onMousemove)) {

	      mapMousemoveCallback = function(e) {

	        if (self.options.hover) {
	          // Only execute mousemove if not disabled during map load
	          if (self.options.interactive) {
	            injectTileInfo(e);
	            self.options.onMousemove(e);
	          }
	        } else {
	          self.options.onMousemove(e);
	        }
	      };

	      map.on('mousemove', mapMousemoveCallback);
	    }

	    if (_.isFunction(this.options.onClick)) {

	      mapClickCallback = function(e) {

	        if (self.options.hover && self.options.interactive) {

	          injectTileInfo(e);

	          // Only execute click if data under cursor does not exceed inspector
	          // row density.
	          //
	          // NOTE: `self.options` (which refers to the VectorTileManager
	          // instance options) is not the same as `this.options` (which refers
	          // to the map instance options).
	          var manyRows = _.sum(e.points, 'count') > self.options.rowInspectorMaxRowDensity;

	          if (!manyRows) {
	            highlightClickedPoints(e.points);
	            self.options.onClick(e);
	          } else {
	            // clear any existing highlights that are hanging around
	            self.clearClickedPointHighlights();
	          }

	        } else {
	          self.options.onClick(e);
	        }
	      };

	      map.on('click', mapClickCallback);
	    }

	    if (self.options.hover) {
	      mapMouseoutCallback = function() {
	        self.clearHoverPointHighlights();
	      };

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
	        self.clearClickedPointHighlights();
	        self.clearHoverPointHighlights();
	      };

	      map.on('clearhighlightrequest', clearHighlightRequestCallback);
	    }

	    mapDragstartCallback = function() {
	      self.clearHoverPointHighlights();
	      self.clearClickedPointHighlights();
	    };

	    map.on('dragstart', mapDragstartCallback);

	    mapZoomstartCallback = function() {
	      self.clearHoverPointHighlights();
	      self.clearClickedPointHighlights();
	    };

	    map.on('zoomstart', mapZoomstartCallback);

	    map.on('layerremove', function(e) {

	      // Check to see if the layer removed is this one and if it is,
	      // remove its child layers.
	      if (e.layer._leaflet_id === self._leaflet_id && e.layer.removeChildLayers) {

	        e.layer.removeChildLayers(map);

	        if (_.isFunction(self.options.onMousedown)) {
	          map.off('mousedown', mapMousedownCallback);
	        }

	        if (_.isFunction(self.options.onMouseup)) {
	          map.off('mouseup', mapMouseupCallback);
	        }

	        if (_.isFunction(self.options.onMousemove)) {
	          map.off('mousemove', mapMousemoveCallback);
	        }

	        if (_.isFunction(self.options.onClick)) {
	          map.off('click', mapClickCallback);
	        }

	        if (self.options.hover) {
	          map.off('mouseout', mapMouseoutCallback);
	          map.off('flannelclosed', flannelClosedCallback);
	          map.off('clearhighlightrequest', clearHighlightRequestCallback);
	        }

	        map.off('dragstart', mapDragstartCallback);
	        map.off('zoomstart', mapZoomstartCallback);
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

	    var userHasZoomed;

	    if (this.firstRequest) {
	      this.lastCommitedZoomLevel = zoom;
	      this.firstRequest = false;
	    }

	    userHasZoomed = _.isUndefined(this.lastCommitedZoomLevel) || this.lastCommitedZoomLevel !== zoom;

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

	    var self = this;

	    this.lastCommitedZoomLevel = this.lastSeenZoomLevel;

	    _.each(this.delayedTileDataRequests, function(request) {

	      if (request.zoom === self.lastCommitedZoomLevel) {
	        self.getTileData(request.tilePoint, request.zoom, request.callback);
	      } else {
	        // CORE-6027:
	        // Clear the outstandingTileDataRequests because we shouldn't attempt to load tiles
	        // on the previous zoom level.
	        self.outstandingTileDataRequests = {};
	      }
	    });

	    this.delayedTileDataRequests.length = 0;
	  },

	  getTileData: function(tilePoint, zoom, callback) {

	    var self = this;
	    var tileId = VectorTileUtil.getTileId({x: tilePoint.x, y: tilePoint.y, zoom: zoom});
	    var getterPromise;

	    // Don't re-request tiles that are already outstanding.
	    if (self.outstandingTileDataRequests.hasOwnProperty(tileId) &&
	      self.outstandingTileDataRequests[tileId] !== null) {
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
	    ).catch(
	      function(error) {
	        throw error;
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

	    // VectorTile is a Leaflet global variable
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

	      if (!this.layers.hasOwnProperty(layerId)) {

	        var newLayer = new VectorTileLayer(
	          this,
	          {
	            name: layerId,
	            getFeatureStyle: this.getFeatureStyle
	          }
	        );

	        this.layers[layerId] = newLayer;
	        newLayer.addTo(this.map);
	      }

	      this.layers[layerId].loadData(layer, tileId, tileRenderedCallback);
	    }
	  },

	  addChildLayers: function() {

	    var self = this;

	    Object.keys(this.layers).forEach(function(layerId) {

	      var layer = this.layers[layerId];

	      if (layer.hasOwnProperty('_map')) {
	        self.map.addLayer(layer);
	      }
	    });
	  },

	  removeChildLayers: function() {

	    var self = this;

	    Object.keys(self.layers).forEach(function(layerId) {

	      var layer = self.layers[layerId];

	      self.map.removeLayer(layer);
	    });
	  },

	  tileLoading: function(tileId, getterPromise) {

	    if (Object.keys(this.outstandingTileDataRequests).length === 0) {
	      this.options.onRenderStart();
	    }

	    this.outstandingTileDataRequests[tileId] = getterPromise || null;
	  },

	  tileLoaded: function(tileId) {

	    var self = this;

	    delete this.outstandingTileDataRequests[tileId];

	    if (Object.keys(this.outstandingTileDataRequests).length === 0) {
	      if (this.lastCommitedZoomLevel > this.options.tileOverlapZoomThreshold) {

	        Object.keys(self.layers).forEach(function(layerId) {
	          var layer = self.layers[layerId];

	          _.each(_.keys(layer.featuresByTile), function(tile) {
	            layer.renderTileOverlap(tile);
	          });
	        });
	      }

	      // Set the layer's interactivity to true so that we will begin to
	      // handle events.
	      this.options.interactive = true;

	      // Clear all related highlights.
	      this.clearClickedPointHighlights();
	      this.clearHoverPointHighlights();

	      // Inform the caller that the layer has completed rendering.
	      this.options.onRenderComplete();
	    }
	  }
	});

	module.exports = {
	  VectorTileUtil: VectorTileUtil,
	  VectorTileFeature: VectorTileFeature,
	  VectorTileLayer: VectorTileLayer
	};
	// module also has the side effect of setting L.TileLayer.VectorTileManager.
	// not sure if this will work for Webpack.


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	module.exports.VectorTile = __webpack_require__(30);
	module.exports.VectorTileFeature = __webpack_require__(32);
	module.exports.VectorTileLayer = __webpack_require__(31);


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var VectorTileLayer = __webpack_require__(31);

	module.exports = VectorTile;

	function VectorTile(buffer, end) {

	    this.layers = {};
	    this._buffer = buffer;

	    end = end || buffer.length;

	    while (buffer.pos < end) {
	        var val = buffer.readVarint(),
	            tag = val >> 3;

	        if (tag == 3) {
	            var layer = this.readLayer();
	            if (layer.length) this.layers[layer.name] = layer;
	        } else {
	            buffer.skip(val);
	        }
	    }
	}

	VectorTile.prototype.readLayer = function() {
	    var buffer = this._buffer,
	        bytes = buffer.readVarint(),
	        end = buffer.pos + bytes,
	        layer = new VectorTileLayer(buffer, end);

	    buffer.pos = end;

	    return layer;
	};


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var VectorTileFeature = __webpack_require__(32);

	module.exports = VectorTileLayer;
	function VectorTileLayer(buffer, end) {
	    // Public
	    this.version = 1;
	    this.name = null;
	    this.extent = 4096;
	    this.length = 0;

	    // Private
	    this._buffer = buffer;
	    this._keys = [];
	    this._values = [];
	    this._features = [];

	    var val, tag;

	    end = end || buffer.length;

	    while (buffer.pos < end) {
	        val = buffer.readVarint();
	        tag = val >> 3;

	        if (tag === 15) {
	            this.version = buffer.readVarint();
	        } else if (tag === 1) {
	            this.name = buffer.readString();
	        } else if (tag === 5) {
	            this.extent = buffer.readVarint();
	        } else if (tag === 2) {
	            this.length++;
	            this._features.push(buffer.pos);
	            buffer.skip(val);

	        } else if (tag === 3) {
	            this._keys.push(buffer.readString());
	        } else if (tag === 4) {
	            this._values.push(this.readFeatureValue());
	        } else {
	            buffer.skip(val);
	        }
	    }
	}

	VectorTileLayer.prototype.readFeatureValue = function() {
	    var buffer = this._buffer,
	        value = null,
	        bytes = buffer.readVarint(),
	        end = buffer.pos + bytes,
	        val, tag;

	    while (buffer.pos < end) {
	        val = buffer.readVarint();
	        tag = val >> 3;

	        if (tag == 1) {
	            value = buffer.readString();
	        } else if (tag == 2) {
	            throw new Error('read float');
	        } else if (tag == 3) {
	            value = buffer.readDouble();
	        } else if (tag == 4) {
	            value = buffer.readVarint();
	        } else if (tag == 5) {
	            throw new Error('read uint');
	        } else if (tag == 6) {
	            value = buffer.readSVarint();
	        } else if (tag == 7) {
	            value = Boolean(buffer.readVarint());
	        } else {
	            buffer.skip(val);
	        }
	    }

	    return value;
	};

	// return feature `i` from this layer as a `VectorTileFeature`
	VectorTileLayer.prototype.feature = function(i) {
	    if (i < 0 || i >= this._features.length) throw new Error('feature index out of bounds');

	    this._buffer.pos = this._features[i];
	    var end = this._buffer.readVarint() + this._buffer.pos;

	    return new VectorTileFeature(this._buffer, end, this.extent, this._keys, this._values);
	};


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Point = __webpack_require__(33);

	module.exports = VectorTileFeature;

	function VectorTileFeature(buffer, end, extent, keys, values) {

	    this.properties = {};

	    // Public
	    this.extent = extent;
	    this.type = 0;

	    // Private
	    this._buffer = buffer;
	    this._geometry = -1;

	    end = end || buffer.length;

	    while (buffer.pos < end) {
	        var val = buffer.readVarint(),
	            tag = val >> 3;

	        if (tag == 1) {
	            this._id = buffer.readVarint();

	        } else if (tag == 2) {
	            var tagEnd = buffer.pos + buffer.readVarint();

	            while (buffer.pos < tagEnd) {
	                var key = keys[buffer.readVarint()];
	                var value = values[buffer.readVarint()];
	                this.properties[key] = value;
	            }

	        } else if (tag == 3) {
	            this.type = buffer.readVarint();

	        } else if (tag == 4) {
	            this._geometry = buffer.pos;
	            buffer.skip(val);

	        } else {
	            buffer.skip(val);
	        }
	    }
	}

	VectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon'];

	VectorTileFeature.prototype.loadGeometry = function() {
	    var buffer = this._buffer;
	    buffer.pos = this._geometry;

	    var bytes = buffer.readVarint(),
	        end = buffer.pos + bytes,
	        cmd = 1,
	        length = 0,
	        x = 0,
	        y = 0,
	        lines = [],
	        line;

	    while (buffer.pos < end) {
	        if (!length) {
	            var cmd_length = buffer.readVarint();
	            cmd = cmd_length & 0x7;
	            length = cmd_length >> 3;
	        }

	        length--;

	        if (cmd === 1 || cmd === 2) {
	            x += buffer.readSVarint();
	            y += buffer.readSVarint();

	            if (cmd === 1) {
	                // moveTo
	                if (line) {
	                    lines.push(line);
	                }
	                line = [];
	            }

	            line.push(new Point(x, y));
	        } else if (cmd === 7) {
	            // closePolygon
	            line.push(line[0].clone());
	        } else {
	            throw new Error('unknown command ' + cmd);
	        }
	    }

	    if (line) lines.push(line);

	    return lines;
	};

	VectorTileFeature.prototype.bbox = function() {
	    var buffer = this._buffer;
	    buffer.pos = this._geometry;

	    var bytes = buffer.readVarint(),
	        end = buffer.pos + bytes,

	        cmd = 1,
	        length = 0,
	        x = 0,
	        y = 0,
	        x1 = Infinity,
	        x2 = -Infinity,
	        y1 = Infinity,
	        y2 = -Infinity;

	    while (buffer.pos < end) {
	        if (!length) {
	            var cmd_length = buffer.readVarint();
	            cmd = cmd_length & 0x7;
	            length = cmd_length >> 3;
	        }

	        length--;

	        if (cmd === 1 || cmd === 2) {
	            x += buffer.readSVarint();
	            y += buffer.readSVarint();
	            if (x < x1) x1 = x;
	            if (x > x2) x2 = x;
	            if (y < y1) y1 = y;
	            if (y > y2) y2 = y;

	        } else if (cmd !== 7) {
	            throw new Error('unknown command ' + cmd);
	        }
	    }

	    return [x1, y1, x2, y2];
	};


/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';

	module.exports = Point;

	function Point(x, y) {
	    this.x = x;
	    this.y = y;
	}

	Point.prototype = {
	    clone: function() { return new Point(this.x, this.y); },

	    add:     function(p) { return this.clone()._add(p);     },
	    sub:     function(p) { return this.clone()._sub(p);     },
	    mult:    function(k) { return this.clone()._mult(k);    },
	    div:     function(k) { return this.clone()._div(k);     },
	    rotate:  function(a) { return this.clone()._rotate(a);  },
	    matMult: function(m) { return this.clone()._matMult(m); },
	    unit:    function() { return this.clone()._unit(); },
	    perp:    function() { return this.clone()._perp(); },
	    round:   function() { return this.clone()._round(); },

	    mag: function() {
	        return Math.sqrt(this.x * this.x + this.y * this.y);
	    },

	    equals: function(p) {
	        return this.x === p.x &&
	               this.y === p.y;
	    },

	    dist: function(p) {
	        return Math.sqrt(this.distSqr(p));
	    },

	    distSqr: function(p) {
	        var dx = p.x - this.x,
	            dy = p.y - this.y;
	        return dx * dx + dy * dy;
	    },

	    angle: function() {
	        return Math.atan2(this.y, this.x);
	    },

	    angleTo: function(b) {
	        return Math.atan2(this.y - b.y, this.x - b.x);
	    },

	    angleWith: function(b) {
	        return this.angleWithSep(b.x, b.y);
	    },

	    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
	    angleWithSep: function(x, y) {
	        return Math.atan2(
	            this.x * y - this.y * x,
	            this.x * x + this.y * y);
	    },

	    _matMult: function(m) {
	        var x = m[0] * this.x + m[1] * this.y,
	            y = m[2] * this.x + m[3] * this.y;
	        this.x = x;
	        this.y = y;
	        return this;
	    },

	    _add: function(p) {
	        this.x += p.x;
	        this.y += p.y;
	        return this;
	    },

	    _sub: function(p) {
	        this.x -= p.x;
	        this.y -= p.y;
	        return this;
	    },

	    _mult: function(k) {
	        this.x *= k;
	        this.y *= k;
	        return this;
	    },

	    _div: function(k) {
	        this.x /= k;
	        this.y /= k;
	        return this;
	    },

	    _unit: function() {
	        this._div(this.mag());
	        return this;
	    },

	    _perp: function() {
	        var y = this.y;
	        this.y = this.x;
	        this.x = -y;
	        return this;
	    },

	    _rotate: function(angle) {
	        var cos = Math.cos(angle),
	            sin = Math.sin(angle),
	            x = cos * this.x - sin * this.y,
	            y = sin * this.x + cos * this.y;
	        this.x = x;
	        this.y = y;
	        return this;
	    },

	    _round: function() {
	        this.x = Math.round(this.x);
	        this.y = Math.round(this.y);
	        return this;
	    }
	};

	// constructs Point from an array if necessary
	Point.convert = function (a) {
	    if (a instanceof Point) {
	        return a;
	    }
	    if (Array.isArray(a)) {
	        return new Point(a[0], a[1]);
	    }
	    return a;
	};


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	module.exports = Pbf;

	var Buffer = global.Buffer || __webpack_require__(35);

	function Pbf(buf) {
	    this.buf = !Buffer.isBuffer(buf) ? new Buffer(buf || 0) : buf;
	    this.pos = 0;
	    this.length = this.buf.length;
	}

	Pbf.Varint  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
	Pbf.Fixed64 = 1; // 64-bit: double, fixed64, sfixed64
	Pbf.Bytes   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
	Pbf.Fixed32 = 5; // 32-bit: float, fixed32, sfixed32

	var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
	    SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32,
	    POW_2_63 = Math.pow(2, 63);

	Pbf.prototype = {

	    destroy: function() {
	        this.buf = null;
	    },

	    // === READING =================================================================

	    readFields: function(readField, result, end) {
	        end = end || this.length;

	        while (this.pos < end) {
	            var val = this.readVarint(),
	                tag = val >> 3,
	                startPos = this.pos;

	            readField(tag, result, this);

	            if (this.pos === startPos) this.skip(val);
	        }
	        return result;
	    },

	    readMessage: function(readField, result) {
	        return this.readFields(readField, result, this.readVarint() + this.pos);
	    },

	    readFixed32: function() {
	        var val = this.buf.readUInt32LE(this.pos);
	        this.pos += 4;
	        return val;
	    },

	    readSFixed32: function() {
	        var val = this.buf.readInt32LE(this.pos);
	        this.pos += 4;
	        return val;
	    },

	    // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

	    readFixed64: function() {
	        var val = this.buf.readUInt32LE(this.pos) + this.buf.readUInt32LE(this.pos + 4) * SHIFT_LEFT_32;
	        this.pos += 8;
	        return val;
	    },

	    readSFixed64: function() {
	        var val = this.buf.readUInt32LE(this.pos) + this.buf.readInt32LE(this.pos + 4) * SHIFT_LEFT_32;
	        this.pos += 8;
	        return val;
	    },

	    readFloat: function() {
	        var val = this.buf.readFloatLE(this.pos);
	        this.pos += 4;
	        return val;
	    },

	    readDouble: function() {
	        var val = this.buf.readDoubleLE(this.pos);
	        this.pos += 8;
	        return val;
	    },

	    readVarint: function() {
	        var buf = this.buf,
	            val, b, b0, b1, b2, b3;

	        b0 = buf[this.pos++]; if (b0 < 0x80) return b0;                 b0 = b0 & 0x7f;
	        b1 = buf[this.pos++]; if (b1 < 0x80) return b0 | b1 << 7;       b1 = (b1 & 0x7f) << 7;
	        b2 = buf[this.pos++]; if (b2 < 0x80) return b0 | b1 | b2 << 14; b2 = (b2 & 0x7f) << 14;
	        b3 = buf[this.pos++]; if (b3 < 0x80) return b0 | b1 | b2 | b3 << 21;

	        val = b0 | b1 | b2 | (b3 & 0x7f) << 21;

	        b = buf[this.pos++]; val += (b & 0x7f) * 0x10000000;         if (b < 0x80) return val;
	        b = buf[this.pos++]; val += (b & 0x7f) * 0x800000000;        if (b < 0x80) return val;
	        b = buf[this.pos++]; val += (b & 0x7f) * 0x40000000000;      if (b < 0x80) return val;
	        b = buf[this.pos++]; val += (b & 0x7f) * 0x2000000000000;    if (b < 0x80) return val;
	        b = buf[this.pos++]; val += (b & 0x7f) * 0x100000000000000;  if (b < 0x80) return val;
	        b = buf[this.pos++]; val += (b & 0x7f) * 0x8000000000000000; if (b < 0x80) return val;

	        throw new Error('Expected varint not more than 10 bytes');
	    },

	    readVarint64: function() {
	        var startPos = this.pos,
	            val = this.readVarint();

	        if (val < POW_2_63) return val;

	        var pos = this.pos - 2;
	        while (this.buf[pos] === 0xff) pos--;
	        if (pos < startPos) pos = startPos;

	        val = 0;
	        for (var i = 0; i < pos - startPos + 1; i++) {
	            var b = ~this.buf[startPos + i] & 0x7f;
	            val += i < 4 ? b << i * 7 : b * Math.pow(2, i * 7);
	        }

	        return -val - 1;
	    },

	    readSVarint: function() {
	        var num = this.readVarint();
	        return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
	    },

	    readBoolean: function() {
	        return Boolean(this.readVarint());
	    },

	    readString: function() {
	        var end = this.readVarint() + this.pos,
	            str = this.buf.toString('utf8', this.pos, end);
	        this.pos = end;
	        return str;
	    },

	    readBytes: function() {
	        var end = this.readVarint() + this.pos,
	            buffer = this.buf.slice(this.pos, end);
	        this.pos = end;
	        return buffer;
	    },

	    // verbose for performance reasons; doesn't affect gzipped size

	    readPackedVarint: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readVarint());
	        return arr;
	    },
	    readPackedSVarint: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readSVarint());
	        return arr;
	    },
	    readPackedBoolean: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readBoolean());
	        return arr;
	    },
	    readPackedFloat: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readFloat());
	        return arr;
	    },
	    readPackedDouble: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readDouble());
	        return arr;
	    },
	    readPackedFixed32: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readFixed32());
	        return arr;
	    },
	    readPackedSFixed32: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readSFixed32());
	        return arr;
	    },
	    readPackedFixed64: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readFixed64());
	        return arr;
	    },
	    readPackedSFixed64: function() {
	        var end = this.readVarint() + this.pos, arr = [];
	        while (this.pos < end) arr.push(this.readSFixed64());
	        return arr;
	    },

	    skip: function(val) {
	        var type = val & 0x7;
	        if (type === Pbf.Varint) while (this.buf[this.pos++] > 0x7f) {}
	        else if (type === Pbf.Bytes) this.pos = this.readVarint() + this.pos;
	        else if (type === Pbf.Fixed32) this.pos += 4;
	        else if (type === Pbf.Fixed64) this.pos += 8;
	        else throw new Error('Unimplemented type: ' + type);
	    },

	    // === WRITING =================================================================

	    writeTag: function(tag, type) {
	        this.writeVarint((tag << 3) | type);
	    },

	    realloc: function(min) {
	        var length = this.length || 16;

	        while (length < this.pos + min) length *= 2;

	        if (length !== this.length) {
	            var buf = new Buffer(length);
	            this.buf.copy(buf);
	            this.buf = buf;
	            this.length = length;
	        }
	    },

	    finish: function() {
	        this.length = this.pos;
	        this.pos = 0;
	        return this.buf.slice(0, this.length);
	    },

	    writeFixed32: function(val) {
	        this.realloc(4);
	        this.buf.writeUInt32LE(val, this.pos);
	        this.pos += 4;
	    },

	    writeSFixed32: function(val) {
	        this.realloc(4);
	        this.buf.writeInt32LE(val, this.pos);
	        this.pos += 4;
	    },

	    writeFixed64: function(val) {
	        this.realloc(8);
	        this.buf.writeInt32LE(val & -1, this.pos);
	        this.buf.writeUInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
	        this.pos += 8;
	    },

	    writeSFixed64: function(val) {
	        this.realloc(8);
	        this.buf.writeInt32LE(val & -1, this.pos);
	        this.buf.writeInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
	        this.pos += 8;
	    },

	    writeVarint: function(val) {
	        val = +val;

	        if (val <= 0x7f) {
	            this.realloc(1);
	            this.buf[this.pos++] = val;

	        } else if (val <= 0x3fff) {
	            this.realloc(2);
	            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 7) & 0x7f);

	        } else if (val <= 0x1fffff) {
	            this.realloc(3);
	            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 7) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 14) & 0x7f);

	        } else if (val <= 0xfffffff) {
	            this.realloc(4);
	            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 7) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 14) & 0x7f) | 0x80;
	            this.buf[this.pos++] = ((val >>> 21) & 0x7f);

	        } else {
	            var pos = this.pos;
	            while (val >= 0x80) {
	                this.realloc(1);
	                this.buf[this.pos++] = (val & 0xff) | 0x80;
	                val /= 0x80;
	            }
	            this.realloc(1);
	            this.buf[this.pos++] = val | 0;
	            if (this.pos - pos > 10) throw new Error('Given varint doesn\'t fit into 10 bytes');
	        }
	    },

	    writeSVarint: function(val) {
	        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
	    },

	    writeBoolean: function(val) {
	        this.writeVarint(Boolean(val));
	    },

	    writeString: function(str) {
	        str = String(str);
	        var bytes = Buffer.byteLength(str);
	        this.writeVarint(bytes);
	        this.realloc(bytes);
	        this.buf.write(str, this.pos);
	        this.pos += bytes;
	    },

	    writeFloat: function(val) {
	        this.realloc(4);
	        this.buf.writeFloatLE(val, this.pos);
	        this.pos += 4;
	    },

	    writeDouble: function(val) {
	        this.realloc(8);
	        this.buf.writeDoubleLE(val, this.pos);
	        this.pos += 8;
	    },

	    writeBytes: function(buffer) {
	        var len = buffer.length;
	        this.writeVarint(len);
	        this.realloc(len);
	        for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
	    },

	    writeRawMessage: function(fn, obj) {
	        this.pos++; // reserve 1 byte for short message length

	        // write the message directly to the buffer and see how much was written
	        var startPos = this.pos;
	        fn(obj, this);
	        var len = this.pos - startPos;

	        var varintLen =
	            len <= 0x7f ? 1 :
	            len <= 0x3fff ? 2 :
	            len <= 0x1fffff ? 3 :
	            len <= 0xfffffff ? 4 : Math.ceil(Math.log(len) / (Math.LN2 * 7));

	        // if 1 byte isn't enough for encoding message length, shift the data to the right
	        if (varintLen > 1) {
	            this.realloc(varintLen - 1);
	            for (var i = this.pos - 1; i >= startPos; i--) this.buf[i + varintLen - 1] = this.buf[i];
	        }

	        // finally, write the message length in the reserved place and restore the position
	        this.pos = startPos - 1;
	        this.writeVarint(len);
	        this.pos += len;
	    },

	    writeMessage: function(tag, fn, obj) {
	        this.writeTag(tag, Pbf.Bytes);
	        this.writeRawMessage(fn, obj);
	    },

	    writePackedVarint:   function(tag, arr) { this.writeMessage(tag, writePackedVarint, arr);   },
	    writePackedSVarint:  function(tag, arr) { this.writeMessage(tag, writePackedSVarint, arr);  },
	    writePackedBoolean:  function(tag, arr) { this.writeMessage(tag, writePackedBoolean, arr);  },
	    writePackedFloat:    function(tag, arr) { this.writeMessage(tag, writePackedFloat, arr);    },
	    writePackedDouble:   function(tag, arr) { this.writeMessage(tag, writePackedDouble, arr);   },
	    writePackedFixed32:  function(tag, arr) { this.writeMessage(tag, writePackedFixed32, arr);  },
	    writePackedSFixed32: function(tag, arr) { this.writeMessage(tag, writePackedSFixed32, arr); },
	    writePackedFixed64:  function(tag, arr) { this.writeMessage(tag, writePackedFixed64, arr);  },
	    writePackedSFixed64: function(tag, arr) { this.writeMessage(tag, writePackedSFixed64, arr); },

	    writeBytesField: function(tag, buffer) {
	        this.writeTag(tag, Pbf.Bytes);
	        this.writeBytes(buffer);
	    },
	    writeFixed32Field: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed32);
	        this.writeFixed32(val);
	    },
	    writeSFixed32Field: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed32);
	        this.writeSFixed32(val);
	    },
	    writeFixed64Field: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed64);
	        this.writeFixed64(val);
	    },
	    writeSFixed64Field: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed64);
	        this.writeSFixed64(val);
	    },
	    writeVarintField: function(tag, val) {
	        this.writeTag(tag, Pbf.Varint);
	        this.writeVarint(val);
	    },
	    writeSVarintField: function(tag, val) {
	        this.writeTag(tag, Pbf.Varint);
	        this.writeSVarint(val);
	    },
	    writeStringField: function(tag, str) {
	        this.writeTag(tag, Pbf.Bytes);
	        this.writeString(str);
	    },
	    writeFloatField: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed32);
	        this.writeFloat(val);
	    },
	    writeDoubleField: function(tag, val) {
	        this.writeTag(tag, Pbf.Fixed64);
	        this.writeDouble(val);
	    },
	    writeBooleanField: function(tag, val) {
	        this.writeVarintField(tag, Boolean(val));
	    }
	};

	function writePackedVarint(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);   }
	function writePackedSVarint(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);  }
	function writePackedFloat(arr, pbf)    { for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);    }
	function writePackedDouble(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);   }
	function writePackedBoolean(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);  }
	function writePackedFixed32(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);  }
	function writePackedSFixed32(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]); }
	function writePackedFixed64(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);  }
	function writePackedSFixed64(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]); }

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

	// lightweight Buffer shim for pbf browser build
	// based on code from github.com/feross/buffer (MIT-licensed)

	module.exports = Buffer;

	var ieee754 = __webpack_require__(40);

	var BufferMethods;

	function Buffer(length) {
	    var arr;
	    if (length && length.length) {
	        arr = length;
	        length = arr.length;
	    }
	    var buf = new Uint8Array(length || 0);
	    if (arr) buf.set(arr);

	    buf.readUInt32LE = BufferMethods.readUInt32LE;
	    buf.writeUInt32LE = BufferMethods.writeUInt32LE;
	    buf.readInt32LE = BufferMethods.readInt32LE;
	    buf.writeInt32LE = BufferMethods.writeInt32LE;
	    buf.readFloatLE = BufferMethods.readFloatLE;
	    buf.writeFloatLE = BufferMethods.writeFloatLE;
	    buf.readDoubleLE = BufferMethods.readDoubleLE;
	    buf.writeDoubleLE = BufferMethods.writeDoubleLE;
	    buf.toString = BufferMethods.toString;
	    buf.write = BufferMethods.write;
	    buf.slice = BufferMethods.slice;
	    buf.copy = BufferMethods.copy;

	    buf._isBuffer = true;
	    return buf;
	}

	var lastStr, lastStrEncoded;

	BufferMethods = {
	    readUInt32LE: function(pos) {
	        return ((this[pos]) |
	            (this[pos + 1] << 8) |
	            (this[pos + 2] << 16)) +
	            (this[pos + 3] * 0x1000000);
	    },

	    writeUInt32LE: function(val, pos) {
	        this[pos] = val;
	        this[pos + 1] = (val >>> 8);
	        this[pos + 2] = (val >>> 16);
	        this[pos + 3] = (val >>> 24);
	    },

	    readInt32LE: function(pos) {
	        return ((this[pos]) |
	            (this[pos + 1] << 8) |
	            (this[pos + 2] << 16)) +
	            (this[pos + 3] << 24);
	    },

	    readFloatLE:  function(pos) { return ieee754.read(this, pos, true, 23, 4); },
	    readDoubleLE: function(pos) { return ieee754.read(this, pos, true, 52, 8); },

	    writeFloatLE:  function(val, pos) { return ieee754.write(this, val, pos, true, 23, 4); },
	    writeDoubleLE: function(val, pos) { return ieee754.write(this, val, pos, true, 52, 8); },

	    toString: function(encoding, start, end) {
	        var str = '',
	            tmp = '';

	        start = start || 0;
	        end = Math.min(this.length, end || this.length);

	        for (var i = start; i < end; i++) {
	            var ch = this[i];
	            if (ch <= 0x7F) {
	                str += decodeURIComponent(tmp) + String.fromCharCode(ch);
	                tmp = '';
	            } else {
	                tmp += '%' + ch.toString(16);
	            }
	        }

	        str += decodeURIComponent(tmp);

	        return str;
	    },

	    write: function(str, pos) {
	        var bytes = str === lastStr ? lastStrEncoded : encodeString(str);
	        for (var i = 0; i < bytes.length; i++) {
	            this[pos + i] = bytes[i];
	        }
	    },

	    slice: function(start, end) {
	        return this.subarray(start, end);
	    },

	    copy: function(buf, pos) {
	        pos = pos || 0;
	        for (var i = 0; i < this.length; i++) {
	            buf[pos + i] = this[i];
	        }
	    }
	};

	BufferMethods.writeInt32LE = BufferMethods.writeUInt32LE;

	Buffer.byteLength = function(str) {
	    lastStr = str;
	    lastStrEncoded = encodeString(str);
	    return lastStrEncoded.length;
	};

	Buffer.isBuffer = function(buf) {
	    return !!(buf && buf._isBuffer);
	};

	function encodeString(str) {
	    var length = str.length,
	        bytes = [];

	    for (var i = 0, c, lead; i < length; i++) {
	        c = str.charCodeAt(i); // code point

	        if (c > 0xD7FF && c < 0xE000) {

	            if (lead) {
	                if (c < 0xDC00) {
	                    bytes.push(0xEF, 0xBF, 0xBD);
	                    lead = c;
	                    continue;

	                } else {
	                    c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
	                    lead = null;
	                }

	            } else {
	                if (c > 0xDBFF || (i + 1 === length)) bytes.push(0xEF, 0xBF, 0xBD);
	                else lead = c;

	                continue;
	            }

	        } else if (lead) {
	            bytes.push(0xEF, 0xBF, 0xBD);
	            lead = null;
	        }

	        if (c < 0x80) bytes.push(c);
	        else if (c < 0x800) bytes.push(c >> 0x6 | 0xC0, c & 0x3F | 0x80);
	        else if (c < 0x10000) bytes.push(c >> 0xC | 0xE0, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
	        else bytes.push(c >> 0x12 | 0xF0, c >> 0xC & 0x3F | 0x80, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
	    }
	    return bytes;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(36).Buffer))

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(37)
	var ieee754 = __webpack_require__(38)
	var isArray = __webpack_require__(39)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(36).Buffer, (function() { return this; }())))

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 38 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 39 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 40 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var ChoroplethMap = __webpack_require__(2);
	var MetadataProvider = __webpack_require__(25);
	var GeospaceDataProvider = __webpack_require__(23);
	var SoqlDataProvider = __webpack_require__(26);
	var SoqlHelpers = __webpack_require__(42);

	var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
	var DEFAULT_BASE_LAYER_OPACITY = 0.8;
	var NAME_ALIAS = '__NAME_ALIAS__';
	var VALUE_ALIAS = '__VALUE_ALIAS__';
	var BASE_QUERY = 'SELECT `{0}` AS {1}, COUNT(*) AS {2} {3} GROUP BY `{0}` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200';
	var WINDOW_RESIZE_RERENDER_DELAY = 200;

	/**
	 * Instantiates a Socrata Choropleth Visualization from the
	 * `socrata-visualizations` package.
	 *
	 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
	 */
	$.fn.socrataChoroplethMap = function(vif) {

	  // Verify important properties got passed in
	  utils.assertHasProperties(
	    vif,
	    'columnName',
	    'configuration',
	    'datasetUid',
	    'domain',
	    'unit'
	  );

	  utils.assertHasProperties(
	    vif.unit,
	    'one',
	    'other'
	  );

	  utils.assertHasProperties(
	    vif.configuration,
	    'computedColumnName',
	    'localization',
	    'shapefile'
	  );

	  utils.assertHasProperties(
	    vif.configuration.localization,
	    'NO_VALUE',
	    'FLYOUT_UNFILTERED_AMOUNT_LABEL',
	    'FLYOUT_FILTERED_AMOUNT_LABEL',
	    'FLYOUT_SELECTED_NOTICE'
	  );

	  utils.assertHasProperties(
	    vif.configuration.shapefile,
	    'geometryLabel',
	    'primaryKey',
	    'uid'
	  );

	  /**
	   * Setup visualization
	   */
	  var $element = $(this);

	  var visualization = new ChoroplethMap($element, vif);

	  // Setup Data Providers
	  var shapefileMetadataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.configuration.shapefile.uid
	  };

	  var shapefileMetadataProvider = new MetadataProvider(
	    shapefileMetadataProviderConfig
	  );

	  var datasetGeospaceDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };

	  var datasetGeospaceDataProvider = new GeospaceDataProvider(
	    datasetGeospaceDataProviderConfig
	  );

	  var shapefileGeospaceDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.configuration.shapefile.uid
	  };

	  var shapefileGeospaceDataProvider = new GeospaceDataProvider(
	    shapefileGeospaceDataProviderConfig
	  );

	  var soqlDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };

	  var unfilteredSoqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  var filteredSoqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  var cachedShapefile;

	  var datasetColumnExtentDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  var shapefileMetadataRequest;
	  var featureExtentRequest;
	  var cachedGeometryLabel;
	  var rerenderOnResizeTimeout;
	  var _lastRenderedVif;

	  _attachEvents();

	  if (_.isString(vif.configuration.shapefile.geometryLabel)) {
	    // This fake shapefile dataset metadata response is used so that we can
	    // conform to the promise chain all the way down to visualization render,
	    // rather than conditionally requiring one or two requests to complete
	    // before proceeding.
	    shapefileMetadataRequest = Promise.resolve({
	      geometryLabel: vif.configuration.shapefile.geometryLabel
	    });

	  } else {

	    shapefileMetadataRequest = shapefileMetadataProvider.
	      getPhidippidesAugmentedDatasetMetadata().
	      then(
	        function(shapefileMetadata) {
	          return shapefileMetadata;
	        },
	        function(error) {
	          _logError(error);

	          // If the shapefile metadata request fails, we can still proceed,
	          // albeit with degraded flyout behavior. This is because the only
	          // thing we're trying to get from the shapefile metadata is the
	          // geometryLabel (the column in the shapefile that corresponds to a
	          // human-readable name for each region) and, if it is not present,
	          // the visualization will simply not show the human-readable name in
	          // the flyout at all (it will still show values).
	          //
	          // Accordingly, we still want to resolve this promise in its error
	          // state.
	          return {
	            geometryLabel: null
	          };
	        }
	      );

	  }

	  featureExtentRequest = datasetGeospaceDataProvider.
	    getFeatureExtent(vif.columnName).
	    // If the request has succeeded, return the response (using _.identity());
	    // if it failed then log the resulting error.
	    then(
	      _.identity,
	      _logError
	    );

	  Promise.
	    all([shapefileMetadataRequest, featureExtentRequest]).
	    then(function(values) {
	      var shapefileMetadata = values[0];
	      var featureExtent = values[1];

	      shapefileGeospaceDataProvider.
	        getShapefile(featureExtent).
	        then(
	          function(shapefile) {

	            // First cache the geometryLabel and shapefile so that we only need
	            // to request them once per page load.
	            //
	            // Downstream users of geometryLabel expect null, but will probably
	            // behave ok with undefined; regardless, default to null if the
	            // property does not exist.
	            cachedGeometryLabel = shapefileMetadata.geometryLabel || null;
	            cachedShapefile = shapefile;
	            // Next, render base layer.
	            visualization.updateTileLayer(_getRenderOptions(vif));
	            // Finally, make the data queries and prepare to draw the choropleth
	            // regions.
	            _updateData(vif);
	          },
	          function(error) {
	            _logError(error);
	          }
	        );
	      }
	    );

	  function _getRenderOptions(vifToRender) {

	    return {
	      baseLayer: {
	        url: vifToRender.configuration.baseLayerUrl || DEFAULT_BASE_LAYER_URL,
	        opacity: vifToRender.configuration.baseLayerOpacity || DEFAULT_BASE_LAYER_OPACITY
	      },
	      showFiltered: vifToRender.filters.length > 0,
	      vif: vifToRender
	    };
	  }

	  /**
	   * Fetches SOQL data and aggregates with shapefile geoJSON
	   */
	  function _updateData(vifToRender) {
	    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender);
	    var unfilteredQueryString = BASE_QUERY.format(
	      vifToRender.configuration.computedColumnName,
	      NAME_ALIAS,
	      VALUE_ALIAS,
	      ''
	    );
	    var filteredQueryString = BASE_QUERY.format(
	      vifToRender.configuration.computedColumnName,
	      NAME_ALIAS,
	      VALUE_ALIAS,
	      (whereClauseComponents) ? 'WHERE {0}'.format(whereClauseComponents) : ''
	    );
	    var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
	      query(unfilteredQueryString, NAME_ALIAS, VALUE_ALIAS)
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });
	    var filteredSoqlQuery = filteredSoqlDataProvider.
	      query(filteredQueryString, NAME_ALIAS, VALUE_ALIAS)
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });

	    Promise.
	      all([unfilteredSoqlQuery, filteredSoqlQuery]).
	      then(function(values) {
	        var unfilteredQueryResponse = values[0].rows.map(function(row) {
	          var value = parseInt(row[1], 10);

	          return {
	            name: row[0],
	            value: value
	          };
	        });
	        var filteredQueryResponse = values[1].rows.map(function(row) {
	          var value = parseInt(row[1], 10);

	          return {
	            name: row[0],
	            value: value
	          };
	        });

	        // Consolidate configuration and data into one object
	        var aggregatedData = _aggregateGeoJsonData(
	          cachedGeometryLabel,
	          vifToRender.configuration.shapefile.primaryKey,
	          cachedShapefile,
	          unfilteredQueryResponse,
	          filteredQueryResponse,
	          vifToRender
	        );

	        if (vifToRender) {
	          _lastRenderedVif = vifToRender;
	        }

	        visualization.render(
	          aggregatedData,
	          _getRenderOptions(_lastRenderedVif)
	        );
	      })
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });
	  }

	  /**
	   * Data Formatting Functions
	   */

	  /**
	   * See CardVisualizationChoroplethHelpers.js in the frontend repo for more
	   * details about _aggregateGeoJsonData
	   *
	   * Consolidates the given geojson data into one object.
	   *
	   * @param {String} geometryLabel - The name of the property that should be
	   *   used as the 'human-readable' name for a region.
	   * @param {String} primaryKey - Name of the property to be used as the primary key
	   * @param {Object} geojsonRegions - A geoJson-formatted object.
	   * @param {Object[]} unfilteredData - An array of objects with 'name' and
	   *   'value' keys (the unfiltered values of the data).
	   * @param {Object[]} filteredData - An array of objects with 'name' and
	   *   'value' keys (the filtered values of the data).
	   * @param {Object[]} vifToRender - The vif that is being rendered.
	   *
	   * @return {Object} (See _mergeRegionAndAggregateData)
	   */
	  function _aggregateGeoJsonData(
	    geometryLabel,
	    primaryKey,
	    geojsonRegions,
	    unfilteredData,
	    filteredData,
	    vifToRender) {

	    var unfilteredDataAsHash = _.mapValues(_.indexBy(unfilteredData, 'name'), 'value');
	    var filteredDataAsHash = _.mapValues(_.indexBy(filteredData, 'name'), 'value');
	    var ownFilterOperands = vifToRender.
	      filters.
	      filter(
	        function(filter) {

	          return (
	            (filter.columnName === vifToRender.columnName) &&
	            (filter.function === 'binaryComputedGeoregionOperator') &&
	            (filter.arguments.computedColumnName === vifToRender.configuration.computedColumnName)
	          );
	        }
	      ).
	      map(
	        function(filter) {
	          return filter.arguments.operand;
	        }
	      );

	    return _mergeRegionAndAggregateData(
	      geometryLabel,
	      primaryKey,
	      geojsonRegions,
	      unfilteredDataAsHash,
	      filteredDataAsHash,
	      ownFilterOperands
	    );
	  }

	  /**
	   * See CardVisualizationChoroplethHelpers.js in the frontend repo for more
	   * details about _mergeRegionAndAggregateData
	   *
	   * @param {String} geometryLabel - The name of the property that should be
	   *   used as the 'human-readable' name for a region.
	   * @param {String} primaryKey - Name of the property to be used as the primary key
	   * @param {Object} geojsonRegions - The source GeoJSON shape file.
	   * @param {Object} unfilteredDataAsHash - The aggregate unfiltered values
	   *   associated with each region.
	   * @param {Object} filteredDataAsHash - The aggregate filtered values
	   *   associated with each region.
	   * @param {String[]} activeFilterNames - An array of currently-filtered regions
	   *   keyed by id.
	   *
	   * @return {Object} - A GeoJSON shape file.
	   *   @property {Object} crs - The GeoJSON shape file's coordinate reference
	   *     system (CRS). We do not modify this.
	   *   @property {Object[]} features - An array of GeoJSON feature objects
	   *     with the following properties:
	   *     @property {Object} geometry - The feature's geometry property.
	   *     @property {Object} properties - The properties associated with this
	   *       feature augmented with the unfiltered and filtered aggregate
	   *       values with which it is associated.
	   *     @property {String} type - The GeoJSON type associated with this
	   *       feature.
	   *   @property {String} type - The GeoJSON Type associated with this shape
	   *     file.
	   */
	  function _mergeRegionAndAggregateData(
	    geometryLabel,
	    primaryKey,
	    geojsonRegions,
	    unfilteredDataAsHash,
	    filteredDataAsHash,
	    ownFilterOperands
	  ) {

	    var newFeatures = _.chain(_.get(geojsonRegions, 'features', [])).
	      filter(function(geojsonFeature) {
	        return _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
	      }).
	      map(function(geojsonFeature) {
	        var name = _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
	        var humanReadableName = _.get(geojsonFeature, 'properties.{0}'.format(geometryLabel), '');
	        var properties = {};

	        properties[primaryKey] = name;
	        properties[vif.configuration.shapefile.columns.name] = humanReadableName;
	        properties[vif.configuration.shapefile.columns.filtered] = filteredDataAsHash[name] || null;
	        properties[vif.configuration.shapefile.columns.unfiltered] = unfilteredDataAsHash[name];
	        properties[vif.configuration.shapefile.columns.selected] = _.contains(ownFilterOperands, name);

	        // Create a new object to get rid of superfluous shapefile-specific
	        // fields coming out of the backend.
	        return {
	          geometry: geojsonFeature.geometry,
	          properties: properties,
	          type: geojsonFeature.type
	        };
	      }).value();

	    return {
	      crs: geojsonRegions.crs,
	      features: newFeatures,
	      type: geojsonRegions.type
	    };
	  }

	  /**
	   * Event handling
	   */
	  function _attachEvents() {

	    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
	    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
	      clearTimeout(rerenderOnResizeTimeout);
	      visualization.destroy();
	      _detachEvents();
	    });

	    $(window).on('resize', _handleWindowResize);

	    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', _handleFeatureFlyout);
	    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_LEGEND_FLYOUT', _handleLegendFlyout);
	    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', _hideFlyout);
	    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', _handleSelection);
	    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _detachEvents() {

	    $(window).off('resize', _handleWindowResize);

	    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', _handleFeatureFlyout);
	    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_LEGEND_FLYOUT', _handleLegendFlyout);
	    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', _hideFlyout);
	    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', _handleSelection);
	    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _handleWindowResize() {

	    clearTimeout(rerenderOnResizeTimeout);

	    rerenderOnResizeTimeout = setTimeout(
	      visualization.invalidateSize,
	      // Add some jitter in order to make sure multiple visualizations are
	      // unlikely to all attempt to rerender themselves at the exact same
	      // moment.
	      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
	    );
	  }

	  function _handleFeatureFlyout(event) {
	    var payload = event.originalEvent.detail;
	    var flyoutPayload;
	    var flyoutContent;
	    var flyoutTable;
	    var flyoutElements;
	    var flyoutTitle;
	    var flyoutUnfilteredValueLabelCell;
	    var flyoutUnfilteredValueCell;
	    var flyoutUnfilteredValueRow;
	    var filteredRowClass;
	    var flyoutFilteredValueLabelCell;
	    var flyoutFilteredValueCell;
	    var flyoutFilteredValueRow;
	    var flyoutSpacerRow;
	    var flyoutSelectedNoticeLabel;
	    var flyoutSelectedNoticeRow;

	    if (payload !== null) {

	      flyoutContent = $(document.createDocumentFragment());
	      flyoutTable = $('<table>', { 'class': 'socrata-flyout-table' });
	      flyoutElements = [];

	      // 'Datum Title'
	      flyoutTitle = $(
	        '<div>',
	        {
	          'class': 'socrata-flyout-title'
	        }
	      ).text(payload.title);

	      // 'Total: XXX rows'
	      flyoutUnfilteredValueLabelCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredValueLabel);

	      flyoutUnfilteredValueCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredValue);

	      flyoutUnfilteredValueRow = $(
	        '<tr>',
	        {
	          'class': 'socrata-flyout-row'
	        }
	      ).append([
	        flyoutUnfilteredValueLabelCell,
	        flyoutUnfilteredValueCell
	      ]);

	      flyoutElements.push(flyoutUnfilteredValueRow);

	      // If we are showing filtered data, then
	      // show the filtered data on the flyout.
	      if (payload.hasOwnProperty('filteredValue')) {

	        filteredRowClass = (payload.selected) ?
	          'socrata-flyout-cell is-selected' :
	          'socrata-flyout-cell emphasis';

	        // 'Filtered: XXX rows'
	        flyoutFilteredValueLabelCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredValueLabel);

	        flyoutFilteredValueCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredValue);

	        flyoutFilteredValueRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row'
	          }
	        ).append([
	          flyoutFilteredValueLabelCell,
	          flyoutFilteredValueCell
	        ]);

	        flyoutElements.push(flyoutFilteredValueRow);
	      }

	      // If we are hovering over a region we are
	      // currently filtering by, then display a special
	      // flyout message.
	      if (payload.selected) {

	        // 'This visualization is currently filtered...'
	        flyoutSpacerRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append(
	          $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;')
	        );

	        flyoutSelectedNoticeLabel = $(
	          '<td>',
	          {
	            'class': 'socrata-flyout-cell'
	          }
	        ).text(payload.selectedNotice);

	        flyoutSelectedNoticeRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append([
	          flyoutSelectedNoticeLabel
	        ]);

	        flyoutElements.push(flyoutSpacerRow);
	        flyoutElements.push(flyoutSelectedNoticeRow);
	      }

	      flyoutTable.append(flyoutElements);

	      flyoutContent.append([
	        flyoutTitle,
	        flyoutTable
	      ]);

	      flyoutPayload = {
	        flyoutOffset: {
	          left: payload.clientX,
	          top: payload.clientY
	        },
	        content: flyoutContent,
	        rightSideHint: false,
	        belowTarget: false
	      };
	    }

	    // Dispatch new event for example
	    _dispatchFlyout(flyoutPayload);
	  }

	  function _handleLegendFlyout(event) {

	    var payload = event.originalEvent.detail;
	    var flyoutContent = '<div class="flyout-title">{0}</div>'.format(payload.title);

	    // Assemble payload
	    var flyoutPayload = {
	      element: payload.element,
	      content: flyoutContent,
	      rightSideHint: false,
	      belowTarget: false
	    };

	    // Dispatch new event for example
	    _dispatchFlyout(flyoutPayload);
	  }

	  function _hideFlyout() {

	    _dispatchFlyout(null);
	  }

	  function _handleSelection(event) {
	    var payload = event.originalEvent.detail;
	    var newVif = _.cloneDeep(_lastRenderedVif);
	    var ownFilterOperands = newVif.
	      filters.
	      filter(
	        function(filter) {

	          return (
	            (filter.columnName === newVif.columnName) &&
	            (filter.function === 'binaryComputedGeoregionOperator') &&
	            (filter.arguments.computedColumnName === newVif.configuration.computedColumnName)
	          );
	        }
	      ).
	      map(
	        function(filter) {
	          return filter.arguments.operand;
	        }
	      );

	    newVif.filters = newVif.
	      filters.
	      filter(function(filter) {

	        return (
	          (filter.columnName !== newVif.columnName) &&
	          (filter.function !== 'binaryComputedGeoregionOperator') &&
	          (filter.arguments.computedColumnName !== newVif.configuration.computedColumnName)
	        );
	      });

	    if (ownFilterOperands.indexOf(payload.shapefileFeatureId) === -1) {

	      newVif.
	        filters.
	        push(
	          {
	            'columnName': newVif.columnName,
	            'function': 'binaryComputedGeoregionOperator',
	            'arguments': {
	              'computedColumnName': newVif.configuration.computedColumnName,
	              'operator': '=',
	              'operand': payload.shapefileFeatureId
	            }
	          }
	        );
	    }

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_VIF_UPDATED',
	        {
	          detail: newVif,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleRenderVif(event) {
	    var newVif = event.originalEvent.detail;

	    if (newVif.type !== 'choroplethMap') {
	      throw new Error(
	        'Cannot update VIF; old type: `choroplethMap`, new type: `{0}`.'.
	          format(
	            newVif.type
	          )
	        );
	    }

	    _updateData(newVif);
	  }

	  function _dispatchFlyout(payload) {

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT',
	        {
	          detail: payload,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _logError(error) {
	    if (window.console && window.console.error) {
	      console.error(error);
	    }
	  }

	  return this;
	};

	module.exports = $.fn.socrataChoroplethMap;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var utils = __webpack_require__(3);
	var _ = __webpack_require__(9);

	var VALID_BINARY_OPERATORS = ['=', '!=', '<', '<=', '>', '>='];

	/**
	 * 'Public' methods
	 */

	/**
	 * @param {Object} vif
	 */
	function whereClauseNotFilteringOwnColumn(vif) {
	  var whereClauseComponents = _whereClauseFromVif(vif, false);

	  if (whereClauseComponents) {
	    return whereClauseComponents;
	  }

	  return '';
	}

	/**
	 * @param {Object} vif
	 */
	function whereClauseFilteringOwnColumn(vif) {
	  var whereClauseComponents = _whereClauseFromVif(vif, true);

	  if (whereClauseComponents) {
	    return whereClauseComponents;
	  }

	  return '';
	}

	/**
	 * 'Private' methods
	 */

	function _whereClauseFromVif(vif, filterOwnColumn) {
	  var filters = vif.filters || [];

	  utils.assertHasProperties(
	    vif,
	    'columnName',
	    'filters'
	  );
	  utils.assertIsOneOfTypes(vif.columnName, 'string');
	  utils.assertInstanceOf(filters, Array);

	  return filters.
	    filter(
	      function(filter) {
	        return filterOwnColumn || (filter.columnName !== vif.columnName);
	      }
	    ).map(
	      _filterToWhereClauseComponent
	    ).
	    join(' AND ');
	}

	function _filterToWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'function',
	    'arguments'
	  );

	  switch (filter.function) {
	    case 'binaryOperator':
	      return _binaryOperatorWhereClauseComponent(filter);
	    case 'binaryComputedGeoregionOperator':
	      return _binaryComputedGeoregionOperatorWhereClauseComponent(filter);
	    case 'isNull':
	      return _isNullWhereClauseComponent(filter);
	    case 'timeRange':
	      return _timeRangeWhereClauseComponent(filter);
	    case 'valueRange':
	      return _valueRangeWhereClauseComponent(filter);
	    default:
	      throw new Error(
	        'Invalid filter function: `{0}`.'.format(filter.function)
	      );
	  }
	}

	function _soqlEncodeColumnName(columnName) {
	  utils.assertIsOneOfTypes(columnName, 'string');

	  return '`{0}`'.format(
	    columnName.replace(/\-/g, '_')
	  );
	}

	function _soqlEncodeValue(value) {
	  // Note: These conditionals will fall through.
	  if (_.isString(value)) {
	    return _soqlEncodeString(value);
	  }

	  if (_.isDate(value)) {
	    return _soqlEncodeDate(value);
	  }

	  if (_.isNumber(value) || _.isBoolean(value)) {
	    return value;
	  }

	  throw new Error(
	    'Cannot soql-encode value of type: {0}'.format(typeof value)
	  );
	}

	function _soqlEncodeString(value) {
	  return "'{0}'".format(value.replace(/'/g, "''"));
	}

	function _soqlEncodeDate(value) {
	  return _soqlEncodeString(
	    _serializeFloatingTimestamp(
	      value
	    )
	  );
	}

	function _serializeFloatingTimestamp(date) {
	  function _formatToTwoPlaces(value) {
	    return (value < 10) ?
	      '0' + value.toString() :
	      value.toString();
	  }

	  return '{0}-{1}-{2}T{3}:{4}:{5}'.format(
	    date.getFullYear(),
	    // The month component of JavaScript dates is 0-indexed (I have no idea
	    // why) so when we are serializing a JavaScript date as ISO-8601 date we
	    // need to increment the month value.
	    _formatToTwoPlaces(date.getMonth() + 1),
	    _formatToTwoPlaces(date.getDate()),
	    _formatToTwoPlaces(date.getHours()),
	    _formatToTwoPlaces(date.getMinutes()),
	    _formatToTwoPlaces(date.getSeconds())
	  );
	}

	function _binaryOperatorWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'arguments'
	  );

	  // If `arguments` is an array, that means that we want multiple binary
	  // operators to be joined with an 'OR'.
	  if (_.isArray(filter.arguments)) {

	    filter.arguments.forEach(function(argument) {

	      utils.assertHasProperties(
	        argument,
	        'operator',
	        'operand'
	      );

	      utils.assert(
	        VALID_BINARY_OPERATORS.indexOf(argument.operator) > -1,
	        'Invalid binary operator: `{0}`'.format(argument.operator)
	      );
	    });

	    return '({0})'.format(
	      filter.
	        arguments.
	        map(function(argument) {
	          return '{0} {1} {2}'.format(
	            _soqlEncodeColumnName(filter.columnName),
	            argument.operator,
	            _soqlEncodeValue(argument.operand)
	          );
	        }).
	        join(' OR ')
	      );
	  // If `arguments` is an object, that means that we want this binary
	  // operator to exist on its own (as if arguments were an array with one
	  // element.
	  } else {

	    utils.assertHasProperties(
	      filter,
	      'arguments.operator',
	      'arguments.operand'
	    );

	    utils.assert(
	      VALID_BINARY_OPERATORS.indexOf(filter.arguments.operator) > -1,
	      'Invalid binary operator: `{0}`'.format(filter.arguments.operator)
	    );

	    return '{0} {1} {2}'.format(
	      _soqlEncodeColumnName(filter.columnName),
	      filter.arguments.operator,
	      _soqlEncodeValue(filter.arguments.operand)
	    );
	  }
	}

	function _binaryComputedGeoregionOperatorWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'arguments',
	    'arguments.computedColumnName',
	    'arguments.operator',
	    'arguments.operand'
	  );
	  utils.assert(
	    VALID_BINARY_OPERATORS.indexOf(filter.arguments.operator) > -1,
	    'Invalid binary operator: `{0}`'.format(filter.arguments.operator)
	  );

	  return '{0} {1} {2}'.format(
	    _soqlEncodeColumnName(filter.arguments.computedColumnName),
	    filter.arguments.operator,
	    _soqlEncodeValue(filter.arguments.operand)
	  );
	}

	function _isNullWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'arguments',
	    'arguments.isNull'
	  );

	  return '{0} {1}' .format(
	    _soqlEncodeColumnName(filter.columnName),
	    filter.arguments.isNull ? 'IS NULL' : 'IS NOT NULL'
	  );
	}

	function _timeRangeWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'arguments',
	    'arguments.start',
	    'arguments.end'
	  );

	  return '{0} >= {1} AND {0} < {2}'.format(
	    _soqlEncodeColumnName(filter.columnName),
	    _soqlEncodeValue(filter.arguments.start),
	    _soqlEncodeValue(filter.arguments.end)
	  );
	}

	function _valueRangeWhereClauseComponent(filter) {
	  utils.assertHasProperties(
	    filter,
	    'columnName',
	    'arguments',
	    'arguments.start',
	    'arguments.end'
	  );

	  return '{0} >= {1} AND {0} < {2}'.format(
	    _soqlEncodeColumnName(filter.columnName),
	    _soqlEncodeValue(filter.arguments.start),
	    _soqlEncodeValue(filter.arguments.end)
	  );
	}

	module.exports = {
	  whereClauseNotFilteringOwnColumn: whereClauseNotFilteringOwnColumn,
	  whereClauseFilteringOwnColumn: whereClauseFilteringOwnColumn
	};


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var ColumnChart = __webpack_require__(12);
	var SoqlDataProvider = __webpack_require__(26);
	var SoqlHelpers = __webpack_require__(42);

	var NAME_INDEX = 0;
	var UNFILTERED_INDEX = 1;
	var FILTERED_INDEX = 2;
	var SELECTED_INDEX = 3;
	var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
	var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
	var BASE_QUERY = 'SELECT `{0}` AS {1}, COUNT(*) AS {2} {3} GROUP BY `{0}` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200';
	var WINDOW_RESIZE_RERENDER_DELAY = 200;

	/**
	 * Temporary polyfills until we can come up with a better implementation and include it somewhere else.
	 */

	String.prototype.visualSize = _.memoize(
	  function(fontSize) {
	    var $ruler = $('#ruler');
	    var dimensions;

	    if ($ruler.length < 1) {
	      $('body').append('<span class="ruler" id="ruler"></span>');
	      $ruler = $('#ruler');
	    }
	    if (!fontSize) {
	      fontSize = '';
	    }
	    $ruler.css('font-size', fontSize);
	    $ruler.text(this + '');
	    dimensions = {width: $ruler.width(), height: $ruler.height()};
	    $ruler.remove();

	    return dimensions;
	  },
	  function(fontSize) { // memoization key
	    return this + '|' + fontSize;
	  }
	);

	String.prototype.visualLength = function(fontSize) {
	  return this.visualSize(fontSize).width;
	};

	/**
	 * Instantiates a Socrata ColumnChart Visualization from the
	 * `socrata-visualizations` package.
	 *
	 * Supported event triggers:
	 * - invalidateSize: Forces a rerender, useful if the hosting page has resized the container.
	 *
	 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
	 */
	$.fn.socrataColumnChart = function(vif) {

	  utils.assertHasProperties(
	    vif,
	    'columnName',
	    'configuration',
	    'datasetUid',
	    'domain',
	    'unit'
	  );

	  utils.assertHasProperties(
	    vif.unit,
	    'one',
	    'other'
	  );

	  utils.assertHasProperties(
	    vif.configuration,
	    'localization'
	  );

	  utils.assertHasProperties(
	    vif.configuration.localization,
	    'NO_VALUE',
	    'FLYOUT_UNFILTERED_AMOUNT_LABEL',
	    'FLYOUT_FILTERED_AMOUNT_LABEL',
	    'FLYOUT_SELECTED_NOTICE'
	  );

	  var $element = $(this);

	  // SoQL returns row results for display as columns.
	  // We need separate data providers for 'unfiltered'
	  // and 'filtered' requests, which are merged below.
	  var unfilteredSoqlDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };
	  var unfilteredSoqlDataProvider = new SoqlDataProvider(
	    unfilteredSoqlDataProviderConfig
	  );

	  var filteredSoqlDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };
	  var filteredSoqlDataProvider = new SoqlDataProvider(
	    filteredSoqlDataProviderConfig
	  );

	  vif.configuration.columns = {
	    name: NAME_INDEX,
	    unfilteredValue: UNFILTERED_INDEX,
	    filteredValue: FILTERED_INDEX,
	    selected: SELECTED_INDEX
	  };

	  var visualization = new ColumnChart($element, vif);
	  var visualizationData = [];
	  var rerenderOnResizeTimeout;
	  var _lastRenderedVif;

	  _attachEvents();
	  _updateData(vif);

	  /**
	   * Configuration
	   */

	  function _getRenderOptions(vifToRender) {
	    return {
	      showAllLabels: true,
	      showFiltered: true,
	      vif: vifToRender
	    };
	  }

	  /**
	   * Event handling
	   */

	  function _attachEvents() {

	    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
	    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
	      clearTimeout(rerenderOnResizeTimeout);
	      visualization.destroy();
	      _detachEvents();
	    });

	    $(window).on('resize', _handleWindowResize);

	    $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
	    $element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleSelection);
	    $element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
	    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _detachEvents() {

	    $(window).off('resize', _handleWindowResize);

	    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
	    $element.off('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleSelection);
	    $element.off('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
	    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _handleWindowResize() {

	    clearTimeout(rerenderOnResizeTimeout);

	    rerenderOnResizeTimeout = setTimeout(
	      _render,
	      // Add some jitter in order to make sure multiple visualizations are
	      // unlikely to all attempt to rerender themselves at the exact same
	      // moment.
	      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
	    );
	  }

	  function _render(vifToRender) {
	    if (vifToRender) {
	      _lastRenderedVif = vifToRender;
	    }

	    visualization.render(
	      visualizationData,
	      _getRenderOptions(_lastRenderedVif)
	    );

	    if (vifToRender.configuration.isMobile) {
	      _selectFirst();
	    }
	  }

	  function _handleVisualizationFlyout(event) {

	    var payload = event.originalEvent.detail;
	    var flyoutPayload = null;
	    var flyoutContent = null;
	    var flyoutTable = null;
	    var flyoutElements = null;
	    var flyoutTitle;
	    var flyoutUnfilteredValueLabelCell;
	    var flyoutUnfilteredValueCell;
	    var flyoutUnfilteredValueRow;
	    var filteredRowClass;
	    var flyoutFilteredValueLabelCell;
	    var flyoutFilteredValueCell;
	    var flyoutFilteredValueRow;
	    var flyoutSpacerRow;
	    var flyoutSelectedNoticeLabel;
	    var flyoutSelectedNoticeRow;

	    if (payload !== null) {

	      flyoutContent = $(document.createDocumentFragment());
	      flyoutTable = $('<table>', { 'class': 'socrata-flyout-table' });
	      flyoutElements = [];

	      // 'Datum Title'
	      flyoutTitle = $(
	        '<div>',
	        {
	          'class': 'socrata-flyout-title'
	        }
	      ).text(payload.title);

	      // 'Total: XXX rows'
	      flyoutUnfilteredValueLabelCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredValueLabel);

	      flyoutUnfilteredValueCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredValue);

	      flyoutUnfilteredValueRow = $(
	        '<tr>',
	        {
	          'class': 'socrata-flyout-row'
	        }
	      ).append([
	        flyoutUnfilteredValueLabelCell,
	        flyoutUnfilteredValueCell
	      ]);

	      flyoutElements.push(flyoutUnfilteredValueRow);

	      // If we are showing filtered data, then
	      // show the filtered data on the flyout.
	      if (payload.hasOwnProperty('filteredValue')) {

	        filteredRowClass = (payload.selected) ?
	          'socrata-flyout-cell is-selected' :
	          'socrata-flyout-cell emphasis';

	        // 'Filtered: XXX rows'
	        flyoutFilteredValueLabelCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredValueLabel);

	        flyoutFilteredValueCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredValue);

	        flyoutFilteredValueRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row'
	          }
	        ).append([
	          flyoutFilteredValueLabelCell,
	          flyoutFilteredValueCell
	        ]);

	        flyoutElements.push(flyoutFilteredValueRow);
	      }

	      // If we are hovering over a bar we are
	      // currently filtering by, then display a special
	      // flyout message.
	      if (payload.selected) {

	        // 'This visualization is currently filtered...'
	        flyoutSpacerRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append(
	          $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;')
	        );

	        flyoutSelectedNoticeLabel = $(
	          '<td>',
	          {
	            'class': 'socrata-flyout-cell'
	          }
	        ).text(payload.selectedNotice);

	        flyoutSelectedNoticeRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append([
	          flyoutSelectedNoticeLabel
	        ]);

	        flyoutElements.push(flyoutSpacerRow);
	        flyoutElements.push(flyoutSelectedNoticeRow);
	      }

	      flyoutTable.append(flyoutElements);

	      flyoutContent.append([
	        flyoutTitle,
	        flyoutTable
	      ]);

	      flyoutPayload = {
	        element: payload.element,
	        content: flyoutContent,
	        rightSideHint: false,
	        belowTarget: false
	      };
	    }

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
	        {
	          detail: flyoutPayload,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleSelection(event) {
	    var payload = event.originalEvent.detail;
	    var newVif = _.cloneDeep(_lastRenderedVif);
	    var ownFilterOperands = newVif.
	      filters.
	      filter(function(filter) {
	        return filter.columnName === newVif.columnName;
	      }).map(function(filter) {
	        return filter.arguments.operand;
	      });

	    newVif.filters = newVif.
	      filters.
	      filter(function(filter) {
	        return filter.columnName !== newVif.columnName;
	      });

	    if (ownFilterOperands.indexOf(payload.name) === -1) {

	      newVif.filters.push(
	        {
	          'columnName': newVif.columnName,
	          'function': 'binaryOperator',
	          'arguments': {
	            'operator': '=',
	            'operand': payload.name
	          }
	        }
	      );
	    }

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_VIF_UPDATED',
	        {
	          detail: newVif,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleExpandedToggle() {// event) { ---> Linting sucks

	    // var payload = event.originalEvent.detail;

	    // TODO: Implement.
	  }

	  function _handleRenderVif(event) {
	    var newVif = event.originalEvent.detail;

	    if (newVif.type !== 'columnChart') {
	      throw new Error(
	        'Cannot update VIF; old type: `columnChart`, new type: `{0}`.'.
	          format(
	            newVif.type
	          )
	        );
	    }

	    _updateData(newVif);
	  }

	  /**
	   * Data requests
	   */

	  function _updateData(vifToRender) {

	    var unfilteredQueryString = BASE_QUERY.format(
	      vifToRender.columnName,
	      SOQL_DATA_PROVIDER_NAME_ALIAS,
	      SOQL_DATA_PROVIDER_VALUE_ALIAS,
	      ''
	    );

	    var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
	      query(
	        unfilteredQueryString,
	        SOQL_DATA_PROVIDER_NAME_ALIAS,
	        SOQL_DATA_PROVIDER_VALUE_ALIAS
	      )
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });

	    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender);
	    var filteredQueryString = BASE_QUERY.format(
	      vifToRender.columnName,
	      SOQL_DATA_PROVIDER_NAME_ALIAS,
	      SOQL_DATA_PROVIDER_VALUE_ALIAS,
	      (whereClauseComponents.length > 0) ?
	        'WHERE {0}'.format(whereClauseComponents) :
	        ''
	    );

	    var filteredSoqlQuery = filteredSoqlDataProvider.
	      query(
	        filteredQueryString,
	        SOQL_DATA_PROVIDER_NAME_ALIAS,
	        SOQL_DATA_PROVIDER_VALUE_ALIAS
	      )
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });

	    Promise.
	      all([unfilteredSoqlQuery, filteredSoqlQuery]).
	      then(function(values) {
	        var unfilteredQueryResponse = values[0];
	        var filteredQueryResponse = values[1];

	        visualizationData = _mergeUnfilteredAndFilteredData(
	          vifToRender,
	          unfilteredQueryResponse,
	          filteredQueryResponse
	        );

	        _render(vifToRender);
	      })
	      ['catch'](function(error) {
	        _logError(error);
	        visualization.renderError();
	      });
	  }

	  function _mergeUnfilteredAndFilteredData(renderedVif, unfiltered, filtered) {
	    var unfilteredAsHash;
	    var filteredAsHash;
	    var selectedColumns = renderedVif.
	      filters.
	      filter(function(filter) {
	        return filter.columnName === renderedVif.columnName;
	      }).
	      map(function(filter) {
	        return filter.arguments.operand;
	      });

	    unfilteredAsHash = _.indexBy(
	      unfiltered.rows,
	      unfiltered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
	    );

	    filteredAsHash = _.indexBy(
	      filtered.rows,
	      filtered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
	    );

	    return Object.keys(unfilteredAsHash).map(function(name) {
	      var datumIsSelected = selectedColumns.indexOf(name) > -1;
	      var result = [undefined, undefined, undefined, undefined];

	      result[NAME_INDEX] = (_.isNull(name) || _.isUndefined(name)) ? '' : name;
	      result[UNFILTERED_INDEX] = Number(unfilteredAsHash[name][1]);
	      result[FILTERED_INDEX] = (filteredAsHash.hasOwnProperty(name)) ?
	        Number(filteredAsHash[name][1]) :
	        0;
	      result[SELECTED_INDEX] = datumIsSelected;

	      return result;
	    });
	  }

	  function _logError(error) {
	    if (window.console && window.console.error) {
	      console.error(error);
	    }
	  }

	  function _selectFirst() {
	    var chartWidth = (visualization.element.find('.bar-group').length * 50) + 33;
	    visualization.element.find('.ticks').css('min-width', chartWidth + 'px');
	    visualization.element.find('.column-chart-wrapper').css('min-width', chartWidth + 'px');
	    visualization.element.find('.bar-group').first().click();
	  }

	  return this;
	};

	module.exports = $.fn.socrataColumnChart;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);
	var L = __webpack_require__(19);
	var utils = __webpack_require__(3);
	var FeatureMap = __webpack_require__(18);
	var GeospaceDataProvider = __webpack_require__(23);
	var TileserverDataProvider = __webpack_require__(27);
	var SoqlDataProvider = __webpack_require__(26);
	var SoqlHelpers = __webpack_require__(42);
	var MetadataProvider = __webpack_require__(25);

	var DEFAULT_TILESERVER_HOSTS = [
	  'https://tileserver1.api.us.socrata.com',
	  'https://tileserver2.api.us.socrata.com',
	  'https://tileserver3.api.us.socrata.com',
	  'https://tileserver4.api.us.socrata.com'
	];
	var DEFAULT_FEATURES_PER_TILE = 256 * 256;
	// known in data lens as "simple blue"
	var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
	var DEFAULT_BASE_LAYER_OPACITY = 0.42;
	var WINDOW_RESIZE_RERENDER_DELAY = 200;

	/**
	 * Instantiates a Socrata FeatureMap Visualization from the
	 * `socrata-visualizations` package.
	 *
	 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
	 */
	$.fn.socrataFeatureMap = function(vif) {

	  utils.assertHasProperties(
	    vif,
	    'columnName',
	    'configuration',
	    'datasetUid',
	    'domain',
	    'unit'
	  );

	  utils.assertHasProperties(
	    vif.unit,
	    'one',
	    'other'
	  );

	  utils.assertHasProperties(
	    vif.configuration,
	    'localization'
	  );

	  utils.assertHasProperties(
	    vif.configuration.localization,
	    'FLYOUT_FILTER_NOTICE',
	    'FLYOUT_FILTER_OR_ZOOM_NOTICE',
	    'FLYOUT_DENSE_DATA_NOTICE',
	    'FLYOUT_CLICK_TO_INSPECT_NOTICE',
	    'FLYOUT_CLICK_TO_LOCATE_USER_TITLE',
	    'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE',
	    'FLYOUT_LOCATING_USER_TITLE',
	    'FLYOUT_LOCATE_USER_ERROR_TITLE',
	    'FLYOUT_LOCATE_USER_ERROR_NOTICE',
	    'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE',
	    'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED',
	    'USER_CURRENT_POSITION'
	  );

	  var $element = $(this);
	  var datasetMetadata;

	  // Geospace has knowledge of the extents of a column, which
	  // we use to modify point data queries with a WITHIN_BOX clause.
	  var geospaceDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };
	  var geospaceDataProvider = new GeospaceDataProvider(
	    geospaceDataProviderConfig
	  );

	  // Tileserver serves tile data using the standard {z}/{x}/{y} URL
	  // format. It returns protocol buffers containing point offsets from
	  // the tile origin (top left).
	  var tileserverDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid,
	    columnName: vif.columnName,
	    featuresPerTile: DEFAULT_FEATURES_PER_TILE,
	    tileserverHosts: vif.configuration.tileserverHosts || DEFAULT_TILESERVER_HOSTS
	  };
	  var tileserverDataProvider = new TileserverDataProvider(
	    tileserverDataProviderConfig
	  );

	  // SoQL returns row results for display in the row inspector
	  var soqlDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };
	  var soqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  if (vif.configuration.datasetMetadata) {

	    // If the caller already has datasetMetadata, it can be passed through as
	    // a configuration property.
	    datasetMetadata = vif.configuration.datasetMetadata;

	  } else {

	    // Otherwise, we also need to fetch the dataset metadata for the
	    // specified dataset so that we can use its column definitions when
	    // formatting data for the row inspector.
	    var metadataProviderConfig = {
	      domain: vif.domain,
	      datasetUid: vif.datasetUid
	    };
	    var metadataProvider = new MetadataProvider(
	      metadataProviderConfig
	    );

	    // Make the dataset metadata request before initializing the visualization
	    // in order to ensure that the column metadata is present before any of the
	    // row inspector events (which expect it to be present) can be fired.
	    //
	    // If this request fails, we will fall back to listing columns
	    // alphabetically instead of in the order in which they appear in the
	    // dataset grid view.
	    metadataProvider.
	      getDatasetMetadata().
	      then(
	        handleDatasetMetadataRequestSuccess,
	        handleDatasetMetadataRequestError
	      )['catch'](function(e) {
	        logError(e);
	      });
	  }

	  var visualization = new FeatureMap(
	    $element,
	    vif
	  );
	  // The visualizationRenderOptions may change in response to user actions
	  // and are passed as an argument to every render call.
	  var visualizationRenderOptions = {
	    baseLayer: {
	      url: vif.configuration.baseLayerUrl || DEFAULT_BASE_LAYER_URL,
	      opacity: vif.configuration.baseLayerOpacity || DEFAULT_BASE_LAYER_OPACITY
	    }
	  };
	  var rerenderOnResizeTimeout;

	  /**
	   * Initial data requests to set up visualization state
	   */

	  // We query the extent of the features we are rendering in order to make
	  // individual tile requests more performant (through the use of a
	  // WITHIN_BOX query clause).
	  geospaceDataProvider.
	    getFeatureExtent(vif.columnName).
	    then(
	      handleFeatureExtentQuerySuccess,
	      handleFeatureExtentQueryError
	    )['catch'](function(e) {
	      logError(e);
	    });

	  initializeVisualization();

	  /**
	   * Events
	   */

	  function attachEvents() {

	    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
	    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
	      clearTimeout(rerenderOnResizeTimeout);
	      visualization.destroy();
	      detachEvents();
	    });

	    $element.on('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
	    $element.on('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
	    $element.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
	    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function detachEvents() {

	    $element.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
	    $element.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
	    $element.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
	    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  /**
	   * Event handlers
	   */

	  function _handleRenderVif(event) {
	    var newVif = event.originalEvent.detail;

	    updateRenderOptionsVectorTileGetter(SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif), newVif.configuration.useOriginHost);

	    renderIfReady();
	  }

	  function _handleWindowResize() {

	    clearTimeout(rerenderOnResizeTimeout);

	    rerenderOnResizeTimeout = setTimeout(
	      renderIfReady,
	      // Add some jitter in order to make sure multiple visualizations are
	      // unlikely to all attempt to rerender themselves at the exact same
	      // moment.
	      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
	    );
	  }

	  function handleDatasetMetadataRequestSuccess(data) {

	    datasetMetadata = data;
	  }

	  function handleDatasetMetadataRequestError(error) {

	    // The only consumer of dataset metadata is the row inspector flyout.
	    // If the request fails, we won't show the row inspector on click.
	    console.error('Failed to fetch dataset metadata: {0}'.format(error));
	  }

	  function handleFeatureExtentQuerySuccess(response) {
	    updateRenderOptionsBounds(response);
	    renderIfReady();
	  }

	  function handleFeatureExtentQueryError() {
	    renderError();
	  }

	  function handleVisualizationFlyoutShow(event) {
	    var payload = event.originalEvent.detail;
	    var $flyoutContent = null;
	    var $flyoutTitle;
	    var $flyoutNotice;
	    var flyoutPayload;

	    event.stopPropagation();

	    if (payload !== null) {

	      $flyoutContent = $(document.createDocumentFragment());

	      // 'Datum Title'
	      $flyoutTitle = $(
	        '<div>',
	        {
	          'class': 'socrata-flyout-title'
	        }
	      ).text(payload.title);

	      $flyoutContent.append($flyoutTitle);

	      if (payload.hasOwnProperty('notice') && payload.notice) {

	        $flyoutNotice = $(
	          '<div>',
	          {
	            'class': 'socrata-flyout-notice'
	          }
	        ).text(payload.notice);

	        $flyoutContent.append($flyoutNotice);
	      }

	      if (payload.hasOwnProperty('flyoutOffset') && payload.flyoutOffset) {

	        flyoutPayload = {
	          flyoutOffset: payload.flyoutOffset,
	          content: $flyoutContent,
	          rightSideHint: false,
	          belowTarget: false
	        };

	      } else {

	        flyoutPayload = {
	          element: payload.element,
	          content: $flyoutContent,
	          rightSideHint: false,
	          belowTarget: false
	        };

	      }

	      $element[0].dispatchEvent(
	        new CustomEvent(
	          'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
	          {
	            detail: flyoutPayload,
	            bubbles: true
	          }
	        )
	      );
	    }
	  }

	  function handleVisualizationFlyoutHide() {
	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
	        {
	          detail: null,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function handleRowInspectorQuery(event) {
	    if (!datasetMetadata) {
	      // Dataset metadata request either failed or isn't ready yet.
	      // Pop up an error.
	      handleRowInspectorQueryError();
	      return;
	    }

	    var payload = event.originalEvent.detail;

	    var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif);
	    var query = '$offset=0&$limit={0}&$order=distance_in_meters({1}, "POINT({2} {3})"){4}{5}'.
	      format(
	        payload.rowCount,
	        vif.columnName,
	        payload.latLng.lng,
	        payload.latLng.lat,
	        generateWithinBoxClause(vif.columnName, payload.queryBounds),
	        whereClause ? ' AND ' + whereClause : ''
	      );

	    var displayableColumns = metadataProvider.getDisplayableColumns(datasetMetadata);

	    function generateWithinBoxClause(columnName, bounds) {

	      return '&$where=within_box({0}, {1}, {2})'.format(
	        columnName,
	        '{0}, {1}'.format(bounds.northeast.lat, bounds.northeast.lng),
	        '{0}, {1}'.format(bounds.southwest.lat, bounds.southwest.lng)
	      );
	    }

	    soqlDataProvider.
	      getRows(_.pluck(displayableColumns, 'fieldName'), query).
	      then(
	        handleRowInspectorQuerySuccess,
	        handleRowInspectorQueryError
	      )['catch'](function(e) {
	        logError(e);
	      });

	    event.stopPropagation();
	  }

	  function handleRowInspectorQuerySuccess(data) {

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
	        {
	          detail: {
	            data: formatRowInspectorData(datasetMetadata, data),
	            error: false,
	            message: null
	          },
	          bubbles: true
	        }
	      )
	    );
	  }

	  function handleRowInspectorQueryError() {

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
	        {
	          detail: {
	            data: null,
	            error: true,
	            message: vif.configuration.localization.ROW_INSPECTOR_ROW_DATA_QUERY_FAILED
	          },
	          bubbles: true
	        }
	      )
	    );
	  }

	  /**
	   * Helper functions
	   */

	  function initializeVisualization() {

	    attachEvents();

	    updateRenderOptionsVectorTileGetter(SoqlHelpers.whereClauseNotFilteringOwnColumn(vif), vif.configuration.useOriginHost);

	    renderIfReady();
	  }

	  function updateRenderOptionsBounds(extent) {

	    var southWest = L.latLng(extent.southwest[0], extent.southwest[1]);
	    var northEast = L.latLng(extent.northeast[0], extent.northeast[1]);

	    visualizationRenderOptions.bounds = L.latLngBounds(southWest, northEast);
	  }

	  function updateRenderOptionsVectorTileGetter(whereClause, useOriginHost) {

	    useOriginHost = useOriginHost || false;

	    visualizationRenderOptions.vectorTileGetter = tileserverDataProvider.buildTileGetter(
	      whereClause,
	      useOriginHost
	    );
	  }

	  function renderIfReady() {

	    var hasBounds = visualizationRenderOptions.hasOwnProperty('bounds');
	    var hasTileGetter = visualizationRenderOptions.hasOwnProperty('vectorTileGetter');

	    if (hasBounds && hasTileGetter) {

	      visualization.render(visualizationRenderOptions);
	    }
	  }

	  function renderError() {
	    visualization.renderError();
	  }

	  function formatRowInspectorData(datasetMetadata, data) {

	    // Each of our rows will be mapped to 'formattedRowData', an array of
	    // objects.  Each row corresponds to a single page in the flannel.
	    return data.rows.map(
	      function(row) {
	        return orderRowDataByColumnIndex(
	          datasetMetadata.columns,
	          data.columns,
	          row
	        );
	      }
	    );
	  }

	  function orderRowDataByColumnIndex(datasetMetadataColumns, columnNames, row) {

	    var formattedRowData = [];

	    // This method takes in the column name of the subColumn
	    // (e.g. Crime Location (address)) and the parentColumnName of that
	    // subColumn (e.g. Crime Location) and returns the subColumn string
	    // within the parentheses (address).
	    function extractSubColumnName(existingName, parentColumnName) {

	      var subColumnMatch = existingName.match(/\(([^()]+)\)$/);

	      if (subColumnMatch.length >= 2) {

	        var existingNameSuffix = subColumnMatch[1];

	        if (_.contains(['address', 'city', 'state', 'zip'], existingNameSuffix)) {
	          return existingNameSuffix;
	        }
	      }

	      return existingName.replace('{0} '.format(parentColumnName), '');
	    }

	    columnNames.forEach(
	      function(columnName) {
	        var columnMetadata = _.find(datasetMetadataColumns, {fieldName: columnName});

	        if (_.isPlainObject(columnMetadata)) {

	          var columnValue = row[columnNames.indexOf(columnName)];
	          columnValue = _.isUndefined(columnValue) ? '' : columnValue;

	          // If we're formatting a sub-column, first find the parent
	          // column name and position, and then format accordingly.
	          // Otherwise, just format the normal column.
	          //
	          // NOTE: We can rely upon sub-columns being added after their
	          // corresponding parent columns.
	          if (columnMetadata.isSubcolumn) {

	            // For example, if column name is 'crime_location_address'
	            // or 'crime_location_zip', the parentColumnName would be
	            // 'crime_location'.
	            var parentColumnName = columnName.slice(0, columnName.lastIndexOf('_'));
	            var parentColumnMetadata = _.find(datasetMetadataColumns, {fieldName: parentColumnName});

	            if (_.isPlainObject(parentColumnMetadata)) {

	              var parentPosition = parentColumnMetadata.position;
	              var subColumnName = extractSubColumnName(columnName, parentColumnName);
	              var subColumnDatum = {
	                column: subColumnName,
	                value: _.isObject(columnValue) ? [columnValue] : columnValue,
	                format: columnMetadata.format,
	                physicalDatatype: columnMetadata.physicalDatatype
	              };

	              formattedRowData[parentPosition].value.push(subColumnDatum);
	            }

	          } else {

	            // If the column value is an object (e.g. a coordinate point),
	            // we should format it slightly differently.
	            formattedRowData[columnMetadata.position] = {
	              column: columnName,
	              value: _.isObject(columnValue) ? [columnValue] : columnValue,
	              format: _.isObject(columnValue) ? undefined : columnMetadata.format,
	              physicalDatatype: columnMetadata.physicalDatatype
	            };

	          }
	        }
	      }
	    );

	    // Since we are updating individual indices of formattedRowData
	    // out of order, it is possible that we may not update all of them.
	    // Un-updated indices will default to undefined, and the following
	    // filter will collapse the array down to only defined values.
	    return formattedRowData.
	      filter(
	        function(datum) {
	          return !_.isUndefined(datum);
	        }
	      );
	  }

	  function logError(e) {

	    if (console && console.error) {
	      console.error(e);
	    }
	  }

	  return this;
	};

	module.exports = $.fn.socrataFeatureMap;


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var Table = __webpack_require__(15);
	var Pager = __webpack_require__(13);
	var SoqlHelpers = __webpack_require__(42);
	var SoqlDataProvider = __webpack_require__(26);
	var MetadataProvider = __webpack_require__(25);

	var ROW_HEIGHT_PX = 39;

	$.fn.socrataTable = function(vif) {
	  'use strict';

	  utils.assertHasProperties(
	    vif,
	    'configuration',
	    'datasetUid',
	    'domain',
	    'unit.one',
	    'unit.other',
	    'configuration.order'
	  );

	  utils.assert(
	    Array.isArray(vif.configuration.order),
	    'jQuery.fn.socrataTable: VIF configuration must include an "order" key whose is an Array.'
	  );

	  utils.assertEqual(
	    vif.configuration.order.length,
	    1
	  );

	  utils.assertHasProperties(
	    vif.configuration.order[0],
	    'ascending',
	    'columnName'
	  );

	  var $element = $(this);

	  var soqlDataProvider = new SoqlDataProvider(
	    _.pick(vif, 'datasetUid', 'domain')
	  );

	  var metadataProvider = new MetadataProvider(
	    _.pick(vif, 'datasetUid', 'domain')
	  );

	  // Returns a promise for the dataset metadata.
	  // The response is cached for the duration of this
	  // table component's existence.
	  var _getDatasetMetadata = _.once(function() {
	    return metadataProvider.getDatasetMetadata();
	  });

	  var visualization = new Table($element, vif);
	  var pager = new Pager($element, vif);

	  // Holds all state regarding the table's visual presentation.
	  // Do _NOT_ update this directly, use _setState() or _updateState().
	  // This is to ensure all state changes are reflected in the UI.
	  var _renderState = {
	    // Is the table busy?
	    busy: false,

	    // Holds result of last successful data fetch, plus
	    // the metadata regarding that request (start index,
	    // order, etc).
	    // {
	    //   rows: <data from SoqlDataProvider>,
	    //   columns: <data from SoqlDataProvider>,
	    //   datasetMetadata: <data from SoqlDataProvider>,
	    //   startIndex: index of first row (offset),
	    //   pageSize: number of items in page (not necessarily in rows[]).
	    //   order: {
	    //     [ // only one element supported.
	    //       {
	    //         columnName: <name of column to sort by>,
	    //         ascending: boolean
	    //       }
	    //     ]
	    //   }
	    // }
	    fetchedData: null,

	    datasetRowCount: null
	  };

	  var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vif);

	  _attachEvents();

	  $element.addClass('socrata-paginated-table');

	  soqlDataProvider.getRowCount().then(function(rowCount) {
	    _updateState({ datasetRowCount: rowCount });
	  });

	  _render();

	  _setDataQuery(
	    0, // Offset
	    _computePageSize(),
	    _.get(vif, 'configuration.order'),
	    whereClauseComponents
	  ).then(function() {
	    visualization.freezeColumnWidthsAndRender();
	  });

	  /**
	   * Configuration
	   */

	  function _getRenderOptions() {
	    return _.get(vif, 'configuration.order');
	  }

	  /**
	   * Event Handling
	   */
	  function _attachEvents() {
	    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
	      visualization.destroy();
	      _detachEvents();
	    });

	    $element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', _handleColumnClicked);
	    $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleColumnFlyout);
	    $element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', _handleCellFlyout);
	    $element.on('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', _handlePrevious);
	    $element.on('SOCRATA_VISUALIZATION_PAGINATION_NEXT', _handleNext);
	    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', _handleSizeChange);
	    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _detachEvents() {
	    $element.off('SOCRATA_VISUALIZATION_COLUMN_CLICKED', _handleColumnClicked);
	    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleColumnFlyout);
	    $element.off('SOCRATA_VISUALIZATION_CELL_FLYOUT', _handleCellFlyout);
	    $element.off('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', _handlePrevious);
	    $element.off('SOCRATA_VISUALIZATION_PAGINATION_NEXT', _handleNext);
	    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', _handleSizeChange);
	    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _render() {
	    if (_renderState.fetchedData) {
	      visualization.render(
	        _renderState.fetchedData,
	        _renderState.fetchedData.order
	      );

	      pager.render({
	        unit: vif.unit,
	        startIndex: _renderState.fetchedData.startIndex,
	        endIndex: Math.min(_renderState.fetchedData.startIndex + _renderState.fetchedData.rows.length, _renderState.datasetRowCount),
	        datasetRowCount: _renderState.datasetRowCount,
	        disabled: _renderState.busy || !_.isFinite(_renderState.datasetRowCount)
	      });

	      $element.addClass('loaded');
	    } else {
	      // No fetched data. Render placeholders, so we can determine pager heights.
	      $element.removeClass('loaded');
	      pager.render({
	        unit: vif.unit,
	        startIndex: 0,
	        endIndex: 0,
	        datasetRowCount: 0,
	        disabled: true
	      });

	    }
	  }

	  function _handleColumnClicked(event) {
	    var alreadySorted;
	    var newOrder;
	    var columnName = event.originalEvent.detail;

	    utils.assertIsOneOfTypes(event.originalEvent.detail, 'string');

	    if (_renderState.busy) { return; }

	    utils.assert(
	      _.include(_.pluck(_renderState.fetchedData.columns, 'fieldName'), columnName),
	      'column name not found to sort by: {0}'.format(columnName)
	    );

	    alreadySorted = _renderState.fetchedData.order[0].columnName === columnName;

	    if (alreadySorted) {

	      // Toggle sort direction;
	      newOrder = _.cloneDeep(_renderState.fetchedData.order);
	      newOrder[0].ascending = !newOrder[0].ascending;
	    } else {
	      newOrder = [{
	        columnName: columnName,
	        ascending: true
	      }]
	    }

	    _setDataQuery(
	      0,
	      _renderState.fetchedData.pageSize,
	      newOrder,
	      _renderState.fetchedData.whereClauseComponents
	    );
	  }

	  function _handleColumnFlyout(event) {
	    var payload = event.originalEvent.detail;

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_TABLE_FLYOUT',
	        {
	          detail: payload,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleCellFlyout(event) {
	    var payload = event.originalEvent.detail;

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_TABLE_FLYOUT',
	        {
	          detail: payload,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleNext() {
	    _setDataQuery(
	      _renderState.fetchedData.startIndex + _renderState.fetchedData.pageSize,
	      _renderState.fetchedData.pageSize,
	      _renderState.fetchedData.order,
	      _renderState.fetchedData.whereClauseComponents
	    );
	  }
	  function _handlePrevious() {
	    _setDataQuery(
	      Math.max(0, _renderState.fetchedData.startIndex - _renderState.fetchedData.pageSize),
	      _renderState.fetchedData.pageSize,
	      _renderState.fetchedData.order,
	      _renderState.fetchedData.whereClauseComponents
	    );
	  }

	  function _handleSizeChange() {
	    var pageSize = _computePageSize();
	    var oldPageSize = _.get(_renderState, 'fetchedData.pageSize');
	    // Canceling inflight requests is hard.
	    // If we're currently fetching data, ignore the size change.
	    // The size will be rechecked once the current request
	    // is complete.
	    if (!_renderState.busy && oldPageSize !== pageSize && _renderState.fetchedData) {
	      _setDataQuery(
	        _renderState.fetchedData.startIndex,
	        pageSize,
	        _renderState.fetchedData.order,
	        _renderState.fetchedData.whereClauseComponents
	      );
	    }
	  }

	  function _handleRenderVif(event) {
	    var newVif = event.originalEvent.detail;

	    if (newVif.type !== 'table') {
	      throw new Error(
	        'Cannot update VIF; old type: `table`, new type: `{0}`.'.
	          format(
	            newVif.type
	          )
	      );
	    }

	    _setDataQuery(
	      _renderState.fetchedData.startIndex,
	      _renderState.fetchedData.pageSize,
	      _renderState.fetchedData.order,
	      SoqlHelpers.whereClauseFilteringOwnColumn(newVif)
	    );
	  }

	  function _computePageSize() {
	    var overallHeight = $element.height();
	    var pagerHeight = $element.find('.socrata-pager').outerHeight();
	    var heightRemaining = overallHeight - pagerHeight;
	    return visualization.howManyRowsCanFitInHeight(heightRemaining);
	  }

	  /**
	   * Data Requests
	   */

	  function _setDataQuery(startIndex, pageSize, order, whereClauseComponents) {
	    utils.assert(order.length === 1, 'order parameter must be an array with exactly one element.');

	    if (_renderState.busy) {
	      throw new Error('Called _makeDataRequest while a request already in progress - not allowed.');
	    }

	    _updateState({ busy: true });

	    var displayableColumns = _getDisplayableColumns();
	    var soqlData = displayableColumns.then(function(displayableColumns) {
	      return soqlDataProvider.getTableData(
	        _.pluck(displayableColumns, 'fieldName'),
	        order,
	        startIndex,
	        pageSize,
	        whereClauseComponents
	      );
	    });

	    return Promise.all([
	      _getDatasetMetadata(),
	      displayableColumns,
	      soqlData
	    ]).then(function(resolutions) {
	      var datasetMetadata = resolutions[0];
	      var displayableColumns = resolutions[1];
	      var soqlData = resolutions[2];

	      // Rows can either be undefined OR of the exact length of the
	      // displayableColumns.
	      utils.assert(_.all(soqlData.rows, function(row) {
	        return !row || displayableColumns.length === row.length;
	      }));

	      soqlData.rows.length = pageSize; // Pad/trim row count to fit display.
	      _updateState({
	        fetchedData: {
	          rows: soqlData.rows,
	          columns: displayableColumns,
	          startIndex: startIndex,
	          pageSize: pageSize,
	          order: order,
	          whereClauseComponents: whereClauseComponents
	        },
	        busy: false
	      });

	    }).catch(function(error) {
	      try {
	        console.error('Error while fulfilling table data request: {0}'.format(error));
	        _updateState({ busy: false });
	      } catch (updateStateError) {
	        console.error('Error while processing failed SODA request (reported separately)', updateStateError);
	      }
	      throw error;
	    });
	  }

	  function _getDisplayableColumns() {
	    return _getDatasetMetadata().then(metadataProvider.getDisplayableColumns);
	  }

	  function _getVif() {
	    var newVif = _.cloneDeep(vif);
	    _.set(
	      newVif,
	      'configuration.order',
	      _.cloneDeep(
	        _.get(_renderState, 'fetchedData.order', vif.configuration.order)
	      )
	    );

	    return newVif;
	  }

	  // Updates only specified UI state.
	  function _updateState(newPartialState) {
	    _setState(_.extend(
	      {},
	      _renderState,
	      newPartialState
	    ));
	  }

	  // Replaces entire UI state.
	  function _setState(newState) {
	    var becameIdle;
	    var changedOrder;
	    if (!_.isEqual(_renderState, newState)) {
	      becameIdle = !newState.busy && _renderState.busy;
	      changedOrder = !_.isEqual(
	          _.get(_renderState, 'fetchedData.order'),
	          _.get(newState, 'fetchedData.order')
	        );

	      _renderState = newState;

	      if (becameIdle) {
	        _handleSizeChange();
	      }

	      if (changedOrder) {
	        $element[0].dispatchEvent(
	          new window.CustomEvent(
	            'SOCRATA_VISUALIZATION_VIF_UPDATED',
	            { detail: _getVif(), bubbles: true }
	          )
	        );
	      }

	      _render();
	    }
	  }
	};


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(9);
	var $ = __webpack_require__(8);
	var utils = __webpack_require__(3);
	var moment = __webpack_require__(17);
	var TimelineChart = __webpack_require__(14);
	var SoqlDataProvider = __webpack_require__(26);
	var SoqlHelpers = __webpack_require__(42);

	var MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';
	var DATE_INDEX = 0;
	var UNFILTERED_INDEX = 1;
	var FILTERED_INDEX = 2;
	var SELECTED_INDEX = 3;
	var SOQL_PRECISION_START_ALIAS = '__START__';
	var SOQL_PRECISION_END_ALIAS = '__END__';
	var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
	var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
	var PRECISION_QUERY = "SELECT min({0}) AS {2}, max({0}) AS {3} WHERE {0} < '{1}'";
	var DATA_QUERY_PREFIX = 'SELECT {3}(`{0}`) AS {1}, count(*) AS {2}';
	var DATA_QUERY_SUFFIX = 'GROUP BY {0}';
	var DATA_QUERY_WHERE_CLAUSE_PREFIX = 'WHERE';
	var DATA_QUERY_WHERE_CLAUSE_SUFFIX = "`{0}` IS NOT NULL AND `{0}` < '{1}' AND (1=1)";
	//'SELECT {2}({0}) AS {4}, {3} AS {5} {1} GROUP BY {4}'.  format(fieldName, whereClause, dateTruncFunction, aggregationClause, dateAlias, valueAlias)
	var WINDOW_RESIZE_RERENDER_DELAY = 200;

	/**
	 * Instantiates a Socrata ColumnChart Visualization from the
	 * `socrata-visualizations` package.
	 *
	 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
	 */
	$.fn.socrataTimelineChart = function(vif) {
	  utils.assertHasProperties(
	    vif,
	    'columnName',
	    'configuration.localization',
	    'datasetUid',
	    'domain',
	    'unit.one',
	    'unit.other'
	  );

	  utils.assertHasProperties(
	    vif.configuration.localization,
	    'NO_VALUE',
	    'FLYOUT_UNFILTERED_AMOUNT_LABEL',
	    'FLYOUT_FILTERED_AMOUNT_LABEL',
	    'FLYOUT_SELECTED_NOTICE'
	  );

	  var $element = $(this);

	  var soqlDataProviderConfig = {
	    domain: vif.domain,
	    datasetUid: vif.datasetUid
	  };

	  var precisionSoqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  // SoQL returns row results for display as columns.
	  // We need separate data providers for 'unfiltered'
	  // and 'filtered' requests, which are merged below.
	  var unfilteredSoqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  var filteredSoqlDataProvider = new SoqlDataProvider(
	    soqlDataProviderConfig
	  );

	  vif.configuration.columns = {
	    date: DATE_INDEX,
	    unfilteredValue: UNFILTERED_INDEX,
	    filteredValue: FILTERED_INDEX,
	    selected: SELECTED_INDEX
	  };

	  var visualization = new TimelineChart($element, vif);
	  var visualizationData = transformChartDataForRendering([]);
	  var precision;
	  var rerenderOnResizeTimeout;
	  var _lastRenderedVif;

	  _attachEvents();
	  _updateData(vif);

	  /**
	   * Configuration
	   */

	  function _getRenderOptions(vifToRender) {
	    return {
	      showAllLabels: true,
	      showFiltered: false,
	      precision: precision,
	      vif: vifToRender
	    };
	  }

	  function transformChartDataForRendering(chartData) {
	    var minDate = null;
	    var maxDate = null;
	    var minValue = Number.POSITIVE_INFINITY;
	    var maxValue = Number.NEGATIVE_INFINITY;
	    var meanValue;
	    var allValues = chartData.map(function(datum) {

	      if (minDate === null) {
	        minDate = datum.date;
	      } else if (datum.date < minDate) {
	        minDate = datum.date;
	      }

	      if (maxDate === null) {
	        maxDate = datum.date;
	      } else if (datum.date > maxDate) {
	        maxDate = datum.date;
	      }

	      if (datum.total < minValue) {
	        minValue = datum.total;
	      }

	      if (datum.total > maxValue) {
	        maxValue = datum.total;
	      }

	      return {
	        date: datum.date.toDate(),
	        filtered: datum.filtered,
	        unfiltered: datum.total
	      };
	    });

	    minValue = (minValue > 0) ? 0 : minValue;
	    maxValue = (maxValue < 0) ? 0 : maxValue;
	    meanValue = (maxValue + minValue) / 2;

	    return {
	      minDate: minDate ? minDate.toDate() : null,
	      maxDate: maxDate ? maxDate.toDate() : null,
	      minValue: minValue,
	      meanValue: meanValue,
	      maxValue: maxValue,
	      values: allValues
	    };
	  }

	  /**
	   * Event handling
	   */

	  function _attachEvents() {

	    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
	    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
	      clearTimeout(rerenderOnResizeTimeout);
	      visualization.destroy();
	      _detachEvents();
	    });

	    $(window).on('resize', _handleWindowResize);

	    $element.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', _handleVisualizationFlyout);
	    $element.on('SOCRATA_VISUALIZATION_TIMELINE_FILTER', _handleSelection);
	    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _detachEvents() {

	    $(window).off('resize', _handleWindowResize);

	    $element.off('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', _handleVisualizationFlyout);
	    $element.off('SOCRATA_VISUALIZATION_TIMELINE_FILTER', _handleSelection);
	    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
	    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
	  }

	  function _handleWindowResize() {
	    clearTimeout(rerenderOnResizeTimeout);

	    rerenderOnResizeTimeout = setTimeout(
	      _render,
	      // Add some jitter in order to make sure multiple visualizations are
	      // unlikely to all attempt to rerender themselves at the exact same
	      // moment.
	      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
	    );
	  }

	  function _render(vifToRender) {
	    if (vifToRender) {
	      _lastRenderedVif = vifToRender;
	    }

	    visualization.render(
	      visualizationData,
	      _getRenderOptions(_lastRenderedVif)
	    );
	  }

	  function _handleVisualizationFlyout(event) {

	    var payload = event.originalEvent.detail;
	    var flyoutPayload = null;
	    var flyoutContent = null;
	    var flyoutTable = null;
	    var flyoutElements = null;
	    var flyoutTitle;
	    var flyoutUnfilteredValueLabelCell;
	    var flyoutUnfilteredValueCell;
	    var flyoutUnfilteredValueRow;
	    var filteredRowClass;
	    var flyoutFilteredValueLabelCell;
	    var flyoutFilteredValueCell;
	    var flyoutFilteredValueRow;
	    var flyoutSpacerRow;
	    var flyoutSelectedNoticeLabel;
	    var flyoutSelectedNoticeRow;

	    if (payload !== null) {

	      flyoutContent = $(document.createDocumentFragment());
	      flyoutTable = $('<table>', { 'class': 'socrata-flyout-table' });
	      flyoutElements = [];

	      // 'Datum Title'
	      flyoutTitle = $(
	        '<div>',
	        {
	          'class': 'socrata-flyout-title'
	        }
	      ).text(payload.title);

	      // 'Total: XXX rows'
	      flyoutUnfilteredValueLabelCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredLabel);

	      flyoutUnfilteredValueCell = $(
	        '<td>',
	        {
	          'class': 'socrata-flyout-cell'
	        }
	      ).text(payload.unfilteredValue);

	      flyoutUnfilteredValueRow = $(
	        '<tr>',
	        {
	          'class': 'socrata-flyout-row'
	        }
	      ).append([
	        flyoutUnfilteredValueLabelCell,
	        flyoutUnfilteredValueCell
	      ]);

	      flyoutElements.push(flyoutUnfilteredValueRow);

	      // If we are showing filtered data, then
	      // show the filtered data on the flyout.
	      if (payload.hasOwnProperty('filteredValue')) {

	        filteredRowClass = (payload.filteredBySelection) ?
	          'socrata-flyout-cell is-selected' :
	          'socrata-flyout-cell emphasis';

	        // 'Filtered: XXX rows'
	        flyoutFilteredValueLabelCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredLabel);

	        flyoutFilteredValueCell = $(
	          '<td>',
	          {
	            'class': filteredRowClass
	          }
	        ).text(payload.filteredValue);

	        flyoutFilteredValueRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row'
	          }
	        ).append([
	          flyoutFilteredValueLabelCell,
	          flyoutFilteredValueCell
	        ]);

	        flyoutElements.push(flyoutFilteredValueRow);
	      }

	      // If we are hovering over a bar we are
	      // currently filtering by, then display a special
	      // flyout message.
	      if (payload.selected) {

	        // 'This visualization is currently filtered...'
	        flyoutSpacerRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append(
	          $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;')
	        );

	        flyoutSelectedNoticeLabel = $(
	          '<td>',
	          {
	            'class': 'socrata-flyout-cell'
	          }
	        ).text(payload.selectedNotice);

	        flyoutSelectedNoticeRow = $(
	          '<tr>',
	          {
	            'class': 'socrata-flyout-row',
	            'colspan': '2'
	          }
	        ).append([
	          flyoutSelectedNoticeLabel
	        ]);

	        flyoutElements.push(flyoutSpacerRow);
	        flyoutElements.push(flyoutSelectedNoticeRow);
	      }

	      flyoutTable.append(flyoutElements);

	      flyoutContent.append([
	        flyoutTitle,
	        flyoutTable
	      ]);

	      flyoutPayload = {
	        element: payload.element,
	        content: flyoutContent,
	        rightSideHint: false,
	        belowTarget: false
	      };
	    }

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
	        {
	          detail: flyoutPayload,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleSelection(event) {
	    var payload = event.originalEvent.detail;
	    var newVif = _.cloneDeep(_lastRenderedVif);
	    var ownFilterStartEnd = newVif.
	      filters.
	      filter(function(filter) {
	        return filter.columnName === newVif.columnName && filter.function === 'timeRangeFilter';
	      }).map(function(filter) {
	        return filter.arguments;
	      });

	    newVif.filters = newVif.
	      filters.
	      filter(function(filter) {
	        return filter.columnName !== newVif.columnName;
	      });

	    if (
	      payload !== null &&
	      payload.hasOwnProperty('start') &&
	      payload.hasOwnProperty('end')
	    ) {

	      newVif.filters.push(
	        {
	          'columnName': newVif.columnName,
	          'function': 'timeRange',
	          'arguments': {
	            'start': payload.start.toISOString(),
	            'end': payload.end.toISOString()
	          }
	        }
	      );
	    }

	    $element[0].dispatchEvent(
	      new window.CustomEvent(
	        'SOCRATA_VISUALIZATION_VIF_UPDATED',
	        {
	          detail: newVif,
	          bubbles: true
	        }
	      )
	    );
	  }

	  function _handleRenderVif(event) {
	    var newVif = event.originalEvent.detail;

	    if (newVif.type !== 'timelineChart') {
	      throw new Error(
	        'Cannot update VIF; old type: `timelineChart`, new type: `{0}`.'.
	          format(
	            newVif.type
	          )
	        );
	    }

	    _updateData(newVif);
	  }

	  /**
	   * Data requests
	   */

	  function handleError(error) {
	    _logError(error);
	    visualization.renderError();
	  }

	  function _updateData(vifToRender) {
	    var precisionQueryString = PRECISION_QUERY.format(
	      vifToRender.columnName,
	      MAX_LEGAL_JAVASCRIPT_DATE_STRING,
	      SOQL_PRECISION_START_ALIAS,
	      SOQL_PRECISION_END_ALIAS
	    );

	    var precisionPromise = vifToRender.configuration.precision ?
	      Promise.resolve(vifToRender.configuration.precision) :
	      precisionSoqlDataProvider.
	        getRows(
	          [ SOQL_PRECISION_START_ALIAS, SOQL_PRECISION_END_ALIAS ],
	          '$query=' + precisionQueryString
	        ).
	        then(mapQueryResponseToPrecision);

	    var dataPromise = precisionPromise.
	      then(mapPrecisionToDataQuery).
	      then(mapQueryToPromises);

	    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

	    Promise.all([ dataPromise, precisionPromise ]).
	      then(renderDataFromPromises)
	      ['catch'](handleError);

	    function mapQueryResponseToPrecision(response) {
	      var startIndex = _.indexOf(response.columns, SOQL_PRECISION_START_ALIAS);
	      var endIndex = _.indexOf(response.columns, SOQL_PRECISION_END_ALIAS);
	      var domainStartDate = _.first(response.rows)[startIndex];
	      var domainEndDate = _.first(response.rows)[endIndex];

	      var domain = {
	        start: moment(domainStartDate, moment.ISO_8601),
	        end: moment(domainEndDate, moment.ISO_8601)
	      };

	      if (!domain.start.isValid()) {
	        domain.start = null;
	        console.warn('Invalid start date on {0} ({1})'.format(vifToRender.columnName, domainStartDate));
	      }

	      if (!domain.end.isValid()) {
	        domain.end = null;
	        console.warn('Invalid end date on {0} ({1})'.format(vifToRender.columnName, domainEndDate));
	      }

	      // Return undefined if the domain is undefined, null, or malformed
	      // in some way.  Later on, we will test if datasetPrecision is
	      // undefined and display the proper error message.
	      // By examining the return of getTimelineDomain, these are the
	      // only checks we need.
	      if (_.isUndefined(domain) || _.isNull(domain.start) || _.isNull(domain.end)) {
	        throw 'Timeline Domain is invalid: {0}'.format(domain);
	      }

	      // Otherwise, return the precision as a string.
	      // Moment objects are inherently mutable. Therefore, the .add()
	      // call in the first condition will need to be accounted for in
	      // the second condition. We're doing this instead of just cloning
	      // the objects because moment.clone is surprisingly slow (something
	      // like 40ms).
	      if (domain.start.add('years', 1).isAfter(domain.end)) {
	        precision = 'DAY';
	      // We're actually checking for 20 years but have already added one
	      // to the original domain start date in the if block above.
	      } else if (domain.start.add('years', 19).isAfter(domain.end)) {
	        precision = 'MONTH';
	      } else {
	        precision = 'YEAR';
	      }

	      return precision;
	    }

	    function mapPrecisionToDataQuery(precision) {
	      var date_trunc_function;

	      switch (precision) {
	        case 'YEAR':
	          date_trunc_function = 'date_trunc_y';
	          break;
	        case 'MONTH':
	          date_trunc_function = 'date_trunc_ym';
	          break;
	        case 'DAY':
	          date_trunc_function = 'date_trunc_ymd';
	          break;
	        default:
	          throw 'precision was invalid: {0}'.format(precision);
	      }

	      return (
	        DATA_QUERY_PREFIX.format(
	          vifToRender.columnName,
	          SOQL_DATA_PROVIDER_NAME_ALIAS,
	          SOQL_DATA_PROVIDER_VALUE_ALIAS,
	          date_trunc_function
	        ) +
	        ' {0} ' +
	        DATA_QUERY_SUFFIX.format(SOQL_DATA_PROVIDER_NAME_ALIAS)
	      );
	    }

	    function mapQueryToPromises(dataQueryString) {
	      var unfilteredWhereClause = '{0} {1}'.format(
	        DATA_QUERY_WHERE_CLAUSE_PREFIX,
	        DATA_QUERY_WHERE_CLAUSE_SUFFIX.format(vifToRender.columnName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
	      );
	      var whereClauseFilterComponents = SoqlHelpers.whereClauseNotFilteringOwnColumn(vifToRender);
	      var filteredWhereClause = '{0} {1} {2} {3}'.format(
	        DATA_QUERY_WHERE_CLAUSE_PREFIX,
	        whereClauseFilterComponents,
	        (whereClauseFilterComponents.length > 0) ? 'AND' : '',
	        DATA_QUERY_WHERE_CLAUSE_SUFFIX.format(vifToRender.columnName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
	      );
	      var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
	        query(
	          dataQueryString.format(unfilteredWhereClause),
	          SOQL_DATA_PROVIDER_NAME_ALIAS,
	          SOQL_DATA_PROVIDER_VALUE_ALIAS
	        )['catch'](handleError);
	      var filteredSoqlQuery = filteredSoqlDataProvider.
	        query(
	          dataQueryString.format(filteredWhereClause),
	          SOQL_DATA_PROVIDER_NAME_ALIAS,
	          SOQL_DATA_PROVIDER_VALUE_ALIAS
	        )['catch'](handleError);

	      return Promise.all([unfilteredSoqlQuery, filteredSoqlQuery]);
	    }

	    function renderDataFromPromises(promiseResults) {
	      var values = promiseResults[0];
	      precision = promiseResults[1];
	      var unfilteredQueryResponse = values[0];
	      var filteredQueryResponse = values[1];

	      $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

	      visualizationData = _mergeUnfilteredAndFilteredData(
	        unfilteredQueryResponse,
	        filteredQueryResponse,
	        precision
	      );

	      _render(vifToRender);
	    }
	  }

	  function _mergeUnfilteredAndFilteredData(unfiltered, filtered, precision) {

	    var unfilteredAsHash = _.indexBy(
	      unfiltered.rows,
	      unfiltered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
	    );
	    var filteredAsHash = _.indexBy(
	      filtered.rows,
	      filtered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
	    );
	    var dates = Object.keys(unfilteredAsHash).map(function(date) {
	      return moment((_.isNull(date) || _.isUndefined(date)) ? '' : date);
	    });
	    var timeStart = _.min(dates);
	    var timeEnd = _.max(dates);
	    var timeData = Array(timeEnd.diff(timeStart, precision));
	    _.each(unfiltered.rows, function(item) {
	      var date = item[DATE_INDEX];
	      var dateAsMoment = moment((_.isNull(date) || _.isUndefined(date)) ? '' : date);
	      var timeSlot = dateAsMoment.diff(timeStart, precision);

	      // Default to null in case we don't receive a value associated with
	      // this date. If we do not, the result of Number(item.value) is NaN
	      // and the timeline chart breaks because it tries to use NaN to
	      // calculate the height of the chart.
	      var unfilteredValue = !_.isUndefined(item[UNFILTERED_INDEX]) ?
	        Number(item[UNFILTERED_INDEX]) :
	        null;

	      var filteredValue;
	      // If the filtered value exists, use it.
	      if (filteredAsHash.hasOwnProperty(item[DATE_INDEX])) {
	        filteredValue = Number(filteredAsHash[item[DATE_INDEX]][1])
	      } else {
	        // If the filtered value does not exist but the unfiltered value for
	        // the same date interval exists, then the value has just been filtered
	        // and we should show '0'.
	        if (!_.isUndefined(item[UNFILTERED_INDEX])) {
	          filteredValue = 0;
	        // If the unfiltered value for the same date interval does not exist,
	        // then the value should actually be rendered as being null.
	        } else {
	          filteredValue = null;
	        }
	      }

	      timeData[timeSlot] = {
	        date: dateAsMoment,
	        filtered: filteredValue,
	        total: unfilteredValue
	      };
	    });

	    return transformChartDataForRendering(
	        _.map(timeData, function(item, i) {
	          if (_.isUndefined(item)) {
	            item = {
	              date: moment(timeStart, moment.ISO_8601).add(i, precision),
	              filtered: null,
	              total: null
	            };
	          }
	          return item;
	        })
	      );
	  }

	  function _logError(error) {
	    if (console && _.isFunction(console.error)) {
	      console.error(error);
	    }
	  }

	  return this;
	};

	module.exports = $.fn.socrataTimelineChart;


/***/ }
/******/ ])
});
;
//# sourceMappingURL=socrata-visualizations.js.map