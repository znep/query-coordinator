/**
 * TODO:
 * - Pass in either savedExtent or defaultExtent, rather than both
 */

var utils = require('common/js_utils');
var d3 = require('d3');
var ss = require('simple-statistics');
var chroma = require('chroma-js');
var $ = require('jquery');
var _ = require('lodash');
var L = require('leaflet');

var Visualization = require('./Visualization');
var ChoroplethMapUtils = require('./ChoroplethMapUtils');

function ChoroplethMap(element, vif) {

  _.extend(this, new Visualization(element, vif));

  var self = this;
  // Data mapping to geojson
  var LABEL_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.name;
  var UNFILTERED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.unfiltered;
  var FILTERED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.filtered;
  var SELECTED_GEOJSON_PROPERTY_NAME = vif.configuration.shapefile.columns.selected;
  // Map configuration
  var MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS = 200;
  var MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS = 400;
  // Choropleth class derivation
  var MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED = 7;
  // Choropleth region rendering
  var CHOROPLETH_REGION_DEFAULT_STROKE_WIDTH = 1;
  var CHOROPLETH_REGION_HIGHLIGHTED_STROKE_WIDTH = 4;
  // Legend rendering
  var CONTINUOUS_LEGEND_ZERO_COLOR = '#ffffff';
  var CONTINUOUS_LEGEND_POSITIVE_COLOR = '#003747';
  var CONTINUOUS_LEGEND_NEGATIVE_COLOR = '#c6663d';
  var DISCRETE_LEGEND_ZERO_COLOR = '#eeeeee';
  var DISCRETE_LEGEND_POSITIVE_COLOR = '#408499';
  var DISCRETE_LEGEND_NEGATIVE_COLOR = '#c6663d';

  var utilConstants = {
    UNFILTERED_GEOJSON_PROPERTY_NAME: UNFILTERED_GEOJSON_PROPERTY_NAME,
    FILTERED_GEOJSON_PROPERTY_NAME: FILTERED_GEOJSON_PROPERTY_NAME,
    SELECTED_GEOJSON_PROPERTY_NAME: SELECTED_GEOJSON_PROPERTY_NAME,
    MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED: MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED
  };

  var visualizationUtils = new ChoroplethMapUtils(utilConstants);

  var choroplethContainer;
  var choroplethMapContainer;
  var choroplethLegend;
  // These configuration options belong to Leaflet, not the visualization we are
  // building on top of it.
  var mapOptions = _.extend(
    {
      attributionControl: false,
      center: [47.609895, -122.330259], // Center on Seattle by default.
      keyboard: false,
      scrollWheelZoom: false,
      zoom: 1,
      zoomControlPosition: 'topleft',
      minZoom: 1,
      maxZoom: 18,
      zoomAnimation: true
    },
    vif.configuration.mapOptions
  );

  var lastElementWidth;
  var lastElementHeight;

  var map;
  var baseTileLayer;
  var minLng;
  var maxLng;
  var minLat;
  var maxLat;
  var boundsArray;
  var coordinates;

  // Keep track of the geojson layers so that we can remove them cleanly.
  // Every redraw of the map forces us to remove the layer entirely because
  // there is no way to mutate already-rendered geojson objects.
  var geojsonBaseLayer = null;

  // Watch for first render so we know whether or not to update the center/bounds.
  // (We don't update the center or the bounds if the choropleth has already been
  // rendered so that we can retain potential panning and zooming done by the user.
  var firstRender = true;

  var lastRenderOptions = {};
  var lastRenderedVif;

  var interactive = vif.configuration.interactive === true;

  // Keep track of click details so that we can zoom on double-click but
  // still selects on single clicks.
  var lastClick = 0;
  var lastClickTimeout = null;
  var centerAndZoomDefined;

  // Render layout
  renderTemplate(self.element);

  // Hide the map until we are ready to show it (otherwise there's a flash of
  // it zoomed out all the way).
  choroplethMapContainer.css('opacity', 0);

  // Construct leaflet map
  map = L.map(choroplethMapContainer[0], mapOptions);

  // Attach Miscellaneous Events
  attachEvents();

  // Setup legend
  var LegendType = LegendContinuous;

  if (vif.configuration.hasOwnProperty('legend')) {

    if (vif.configuration.legend.hasOwnProperty('negativeColor')) {
      CONTINUOUS_LEGEND_NEGATIVE_COLOR = vif.configuration.legend.negativeColor;
    }

    if (vif.configuration.legend.hasOwnProperty('zeroColor')) {
      CONTINUOUS_LEGEND_ZERO_COLOR = vif.configuration.legend.zeroColor;
    }

    if (vif.configuration.legend.hasOwnProperty('positiveColor')) {
      CONTINUOUS_LEGEND_POSITIVE_COLOR = vif.configuration.legend.positiveColor;
    }

    if (vif.configuration.legend.hasOwnProperty('type') && vif.configuration.legend.type === 'discrete') {
      LegendType = LegendDiscrete;

      if (vif.configuration.legend.hasOwnProperty('negativeColor')) {
        DISCRETE_LEGEND_NEGATIVE_COLOR = vif.configuration.legend.negativeColor;
      }

      if (vif.configuration.legend.hasOwnProperty('zeroColor')) {
        DISCRETE_LEGEND_ZERO_COLOR = vif.configuration.legend.zeroColor;
      }

      if (vif.configuration.legend.hasOwnProperty('positiveColor')) {
        DISCRETE_LEGEND_POSITIVE_COLOR = vif.configuration.legend.positiveColor;
      }
    }
  }

  var legend = new LegendType(self.element.find('.choropleth-legend'), self.element);

  /**
   * Public methods
   */

  this.render = function(data, options) {
    // Stop rendering if element has no width or height
    if (choroplethContainer.width() <= 0 || choroplethContainer.height() <= 0) {
      if (window.console && window.console.warn) {
        console.warn('Aborted rendering choropleth map: map width or height is zero.');
      }
      return;
    }

    // Why are we merging the options here but replacing them in other
    // visualization implementations?
    _.merge(lastRenderOptions, options);
    // Eventually we may only want to pass in the VIF instead of other render
    // options as well as the VIF, but for the time being we will just treat it
    // as another property on `options`.
    lastRenderedVif = options.vif;


    // Calling initializeMap should only occur here if bounds were not specified in the VIF.
    // We call it here because the fallback bounds calculation requires geoJSON.
    if (firstRender) {

      // Initialize map's bounds if provided with that data
      //
      // TODO: Deprecate extentsDefined in favor of centerAndZoomDefined.
      centerAndZoomDefined = (
        _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.center.lat')) &&
        _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.center.lng')) &&
        _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.zoom'))
      );

      // Note that we prefer center and zoom over extents, since we intend to
      // deprecate the latter and the former will be set by the new authoring
      // experience.
      if (centerAndZoomDefined) {
        updateCenterAndZoom(data, vif.configuration.mapCenterAndZoom);
      } else {
        updateBounds(data, vif.configuration.defaultExtent, vif.configuration.savedExtent);
      }

      initializeMap(choroplethContainer, data);
    }

    updateFeatureLayer(data);

    // Set opacity to 1 now that we have updated the map with regions.
    choroplethMapContainer.css('opacity', 1);
    // TODO: React to active filters being cleared.
  };

  this.invalidateSize = function() {
    updateDimensions(choroplethContainer);
  };

  this.updateTileLayer = function(options) {
    _.merge(lastRenderOptions, options);
    updateTileLayer(options.baseLayer.url, options.baseLayer.opacity);
  };

  this.destroy = function() {

    // Remove Miscellaneous Events
    detachEvents();

    if (map) {
      map.remove();
    }

    self.element.empty();
  };


  /**
   * Private methods
   */

  /**
   * Creates HTML for visualization and adds it to the provided element.
   */
  function renderTemplate() {

    // jQuery doesn't support SVG, so we have to create these elements manually :(
    var xmlns = 'http://www.w3.org/2000/svg';

    var ticks = document.createElementNS(xmlns, 'g');
    ticks.setAttribute('class', 'ticks');

    var legendTicks = document.createElementNS(xmlns, 'svg');
    legendTicks.setAttribute('class', 'legend-ticks');
    $(legendTicks).append(ticks);

    var gradient = document.createElementNS(xmlns, 'svg');
    gradient.setAttribute('class', 'gradient');

    choroplethLegend = $(
      '<div>',
      {
        'class': 'choropleth-legend'
      }
    ).append([
      gradient,
      legendTicks
    ]);

    choroplethMapContainer = $(
      '<div>',
      {
        'class': 'choropleth-map-container'
      }
    );

    choroplethContainer = self.
      element.
        find('.choropleth-container');

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

    self.element.append(choroplethContainer);
  }

  function initializeMap(el) {
    // Only update bounds on the first render so we can persist
    // users' panning and zooming.
    //
    // It is critical to invalidate size prior to updating bounds
    // Otherwise, Leaflet will fit the bounds to an incorrectly sized viewport.
    // This manifests itself as the map being zoomed all of the way out.
    map.invalidateSize();

    firstRender = false;

    lastElementWidth = el.width();
    lastElementHeight = el.height();
  }

  /**
   * Attach Miscellanous Events
   */
  function attachEvents() {

    choroplethLegend.on('mousemove', '.choropleth-legend-color', showLegendFlyout);
    choroplethLegend.on('mouseout', '.choropleth-legend-color', hideFlyout);

    map.on('mouseout', hideFlyout);
    map.on('dragend zoomend', emitMapCenterAndZoomChange);
    // TODO: Deprecate the following event handler.
    map.on('dragend zoomend', emitExtentEventsFromMap);
  }

  /**
   * Detach Miscellanous Events
   */
  function detachEvents() {

    choroplethLegend.off('mousemove', '.choropleth-legend-color', showLegendFlyout);
    choroplethLegend.off('mouseout', '.choropleth-legend-color', hideFlyout);

    map.off('mouseout', hideFlyout);
    map.off('dragend zoomend', emitMapCenterAndZoomChange);
    // TODO: Deprecate the following event handler.
    map.off('dragend zoomend', emitExtentEventsFromMap);
  }

  /**
   * Handle mouse over feature.
   */
  function onFeatureMouseOver(event) {
    addHighlight(event);
    showFlyout(event);
  }

  /**
   * Handle mousing out of a feature.
   */
  function onFeatureMouseOut(event) {
    removeHighlight(event);
    hideFlyout();
  }

  /**
   * Handle clicking on a feature.
   */
  function onSelectRegion(event) {
    var now = Date.now();
    var delay = now - lastClick;

    lastClick = now;

    if (interactive) {
      if (delay < MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS) {
        if (!_.isNull(lastClickTimeout)) {

          // If this is actually a double click, cancel the timeout which
          // selects the feature and zoom in instead.
          window.clearTimeout(lastClickTimeout);
          lastClickTimeout = null;
          map.setView(event.latlng, map.getZoom() + 1);
        }
      } else {
        lastClickTimeout = window.setTimeout(
          function() { emitSelectRegionEvent(event); },
          MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS
        );
      }
    }
  }

  function emitSelectRegionEvent(event) {
    utils.assertHasProperties(
      lastRenderedVif,
      'configuration.shapefile.primaryKey'
    );

    var feature = event.target.feature;
    var shapefilePrimaryKey = lastRenderedVif.
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

  function showFlyout(event) {
    var feature = event.target.feature;
    var unfilteredValueUnit;
    var filteredValueUnit;
    var payload = {
      element: event.target,
      clientX: event.originalEvent.clientX,
      clientY: event.originalEvent.clientY,
      title: feature.properties[LABEL_GEOJSON_PROPERTY_NAME],
      unfilteredValueLabel: self.getLocalization('flyout_unfiltered_amount_label'),
      filteredValueLabel: self.getLocalization('flyout_filtered_amount_label'),
      selectedNotice: self.getLocalization('flyout_selected_notice'),
      selected: feature.properties[SELECTED_GEOJSON_PROPERTY_NAME]
    };

    var aggregationField = _.get(lastRenderOptions, 'vifToRender.columnName');
    var aggregationFunction = _.get(lastRenderOptions, 'vifToRender.aggregation.function');
    var unitOne = _.get(vif, 'unit.one');
    var unitOther = _.get(vif, 'unit.other');

    if (aggregationFunction === 'sum') {

      unfilteredValueUnit = utils.pluralize(
        '{0}'.format(aggregationField),
        feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME]
      );

      filteredValueUnit = utils.pluralize(
        '{0}'.format(aggregationField),
        feature.properties[FILTERED_GEOJSON_PROPERTY_NAME]
      );
    } else {

      if (feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME] === 1) {

        unfilteredValueUnit = _.get(lastRenderOptions, 'unit.one', unitOne);

      } else {

        unfilteredValueUnit = _.get(lastRenderOptions, 'unit.other', unitOther);
      }

      if (feature.properties[FILTERED_GEOJSON_PROPERTY_NAME] === 1) {

        filteredValueUnit = _.get(lastRenderOptions, 'unit.one', unitOne);

      } else {

        filteredValueUnit = _.get(lastRenderOptions, 'unit.other', unitOther);
      }
    }

    if (_.isNumber(feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME])) {

      payload.unfilteredValue = '{0} {1}'.format(
        utils.formatNumber(feature.properties[UNFILTERED_GEOJSON_PROPERTY_NAME]),
        unfilteredValueUnit
      );

    } else {

      payload.unfilteredValue = self.getLocalization('no_value');
    }

    if (lastRenderOptions.showFiltered) {

      if (_.isNumber(feature.properties[FILTERED_GEOJSON_PROPERTY_NAME])) {

        payload.filteredValue = '{0} {1}'.format(
          utils.formatNumber(feature.properties[FILTERED_GEOJSON_PROPERTY_NAME]),
          filteredValueUnit
        );

      } else {

        payload.filteredValue = self.getLocalization('no_value');
      }
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT',
      payload
    );
  }

  function showLegendFlyout(event) {

    var el = event.target;

    var payload = {
      title: el.getAttribute('data-flyout-text'),
      element: el
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT',
      null
    );
  }

  function emitMapCenterAndZoomChange() {
    var center = map.getCenter();
    var zoom = map.getZoom();
    var lat = center.lat;
    var lng = center.lng;
    var centerAndZoom;

    utils.assertIsOneOfTypes(
      lat,
      'number'
    );

    utils.assert(
      lat >= -90,
      'Latitude is out of bounds ({0} < -90)'.format(lat)
    );

    utils.assert(
      lat <= 90,
      'Latitude is out of bounds ({0} > 90)'.format(lat)
    );

    utils.assertIsOneOfTypes(
      lng,
      'number'
    );

    utils.assert(
      lng >= -180,
      'Longitude is out of bounds ({0} < -180)'.format(lng)
    );

    utils.assert(
      lng <= 180,
      'Longitude is out of bounds ({0} > 180)'.format(lng)
    );

    utils.assertIsOneOfTypes(
      zoom,
      'number'
    );

    utils.assert(
      zoom > -1,
      'Leaflet zoom is out of bounds ({0} < 0)'.format(zoom)
    );

    utils.assert(
      zoom < 19,
      'Leaflet zoom is out of bounds ({0} > 18)'.format(zoom)
    );

    centerAndZoom = {
      center: {
        lat: lat,
        lng: lng
      },
      zoom: zoom
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_CHOROPLETH_CENTER_AND_ZOOM_CHANGE',
      centerAndZoom
    );
  }

  function emitExtentEventsFromMap() {
    var leafletBounds = map.getBounds();
    var bounds;

    utils.assert(
      leafletBounds.isValid(),
      'Leaflet bounds object is not valid.'
    );

    bounds = {
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
      bounds
    );
  }

  /**
   * Creates a new base tile layer and adds it to the map.
   *
   * @param {String} url - tile server endpoint to use
   * @param {Number} opacity - opacity of the tile layer
   */
  function updateTileLayer(url, opacity) {

    if (baseTileLayer) {
      map.removeLayer(baseTileLayer);
    }

    baseTileLayer = L.tileLayer(
      url,
      {
        attribution: '',
        detectRetina: false,
        opacity: opacity,
        unloadInvisibleTiles: true
      }
    );

    map.addLayer(baseTileLayer);
  }

  /**
   * Creates a new feature layer and adds it to the map.
   *
   * @param {Object} data - geoJson feature collection to be rendered
   */
  function updateFeatureLayer(data) {

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
      width: lastElementWidth,
      height: lastElementHeight
    };

    // Add legend and get color scale
    var coloring = legend.update(data, dimensions);

    var featureOptions = {
      onEachFeature: function(feature, layer) {
        layer.on({
          mouseover: onFeatureMouseOver,
          mouseout: onFeatureMouseOut,
          mousemove: showFlyout,
          click: onSelectRegion
        });
      },
      style: visualizationUtils.getStyleFn(coloring)
    };

    if (!_.isNull(geojsonBaseLayer)) {
      map.removeLayer(geojsonBaseLayer);
    }

    geojsonBaseLayer = L.geoJson(data, featureOptions);
    geojsonBaseLayer.addTo(map);

    // Emit render complete
    self.emitEvent(
      'SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE',
      {
        timestamp: Date.now()
      }
    );
  }

  function updateCenterAndZoom(geojsonData, centerAndZoom) {
    utils.assertHasProperties(centerAndZoom, 'center', 'zoom');
    utils.assertHasProperties(centerAndZoom.center, 'lat', 'lng');
    utils.assertIsOneOfTypes(centerAndZoom.center.lat, 'number');
    utils.assertIsOneOfTypes(centerAndZoom.center.lng, 'number');
    utils.assertIsOneOfTypes(centerAndZoom.zoom, 'number');

    map.setView(centerAndZoom.center, centerAndZoom.zoom, { animate: false });
  }

  /**
   * Update map bounds.
   */

  function updateBounds(geojsonData, defaultExtent, savedExtent) {

    function buildPositionArray(positions) {

      var cleanPositions = positions.filter(function(position) {
        return _.isNumber(position[0]) && _.isNumber(position[1]);
      });

      // IMPORTANT NOTE: in geojson, positions are denoted as [longitude, latitude] pairs
      var lngs = _.map(cleanPositions, function(lngLat) { return lngLat[0]; });
      var lats = _.map(cleanPositions, function(lngLat) { return lngLat[1]; });

      // Clamp values to min and max
      if (_.min(lngs) < minLng) {
        minLng = _.min(lngs);
      }

      if (_.max(lngs) > maxLng) {
        maxLng = _.max(lngs);
      }

      if (_.min(lats) < minLat) {
        minLat = _.min(lats);
      }

      if (_.max(lats) > maxLat) {
        maxLat = _.max(lats);
      }
    }

    function buildBounds(featureExtent) {

      var southWest = L.latLng(featureExtent.southwest[0], featureExtent.southwest[1]);
      var northEast = L.latLng(featureExtent.northeast[0], featureExtent.northeast[1]);
      var bounds = L.latLngBounds(southWest, northEast);

      utils.assert(bounds.isValid(), 'Bounds is not valid.');

      return bounds;
    }

    minLng = 180;
    maxLng = -180;
    minLat = 90;
    maxLat = -90;
    boundsArray = [
      [maxLat, maxLng],
      [minLat, minLng]
    ];

    if (!_.isUndefined(geojsonData)) {

      if (geojsonData.type !== 'FeatureCollection') {
        throw new Error('Cannot calculate geojson bounds: geojsonData is not of type <FeatureCollection>.');
      }

      _.each(geojsonData.features, function(feature) {
        coordinates = feature.geometry.coordinates;

        switch (feature.geometry.type) {

          // Polygon or MultiLineString coordinates
          // = arrays of position arrays
          case 'Polygon':
          case 'MultiLineString':
            _.each(coordinates, function(positionArrays) {
              buildPositionArray(positionArrays);
            });
            break;

          // MultiPolygon coordinates = an array of Polygon coordinate arrays
          case 'MultiPolygon':
            _.each(coordinates, function(polygonCoordinates) {
              _.each(polygonCoordinates, function(positionArrays) {
                buildPositionArray(positionArrays);
              });
            });
            break;

          // LineString coordinates = position array
          case 'LineString':
            buildPositionArray(coordinates);
            break;
        }
      });

      boundsArray = [
        [maxLat, maxLng],
        [minLat, minLng]
      ];
    }

    var computedBounds = L.latLngBounds([
      boundsArray[1][0],
      boundsArray[1][1]
    ], [
      boundsArray[0][0],
      boundsArray[0][1]
    ]);
    var initialBounds = computedBounds;

    if (!_.isEmpty(savedExtent)) {
      initialBounds = buildBounds(savedExtent);
    } else if (!_.isEmpty(defaultExtent)) {
      var defaultBounds = buildBounds(defaultExtent);

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
    map.fitBounds(
      initialBounds,
      {
        animate: false
      }
    );
  }

  function updateDimensions(el) {
    var mapWidth = el.width();
    var mapHeight = el.height();

    // Recenter map if container's dimensions have changed
    if (lastElementWidth !== mapWidth || lastElementHeight !== mapHeight) {
      map.invalidateSize();

      lastElementWidth = mapWidth;
      lastElementHeight = mapHeight;
    }
  }

  /**
   * Add highlighted style to layer.
   */
  function addHighlight(event) {

    var layer = event.target;

    if (!isLayerSelected(layer)) {
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
  function removeHighlight(event) {

    var layer = event.target;

    if (!isLayerSelected(layer)) {
      layer.setStyle({
        weight: CHOROPLETH_REGION_DEFAULT_STROKE_WIDTH
      });
      layer.bringToBack();
    }
  }

  /**
   * Determines whether or not the given layer is selected.
   */
  function isLayerSelected(layer) {

    var selectedPropertyName = 'feature.properties.{0}'.
      format(SELECTED_GEOJSON_PROPERTY_NAME);

    return _.get(layer, selectedPropertyName);
  }

  /**
   * A choropleth legend, with discrete colors for ranges of values.
   */
  function LegendDiscrete(legendElement, container) {
    this.legendElement = legendElement;
    this.container = container;
  }

  $.extend(LegendDiscrete.prototype, {

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

          var negativeColorScale = visualizationUtils.calculateColoringScale(
            [DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
            negatives
          );
          var positiveColorScale = visualizationUtils.calculateColoringScale(
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
          return visualizationUtils.calculateColoringScale(
            [DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
            classBreaks
          );
        }
      } else {
        // Otherwise, it's all positive, so give them the positive color scale.
        return visualizationUtils.calculateColoringScale(
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

      var classBreaks = visualizationUtils.calculateDataClassBreaks(
        data,
        UNFILTERED_GEOJSON_PROPERTY_NAME
      );

      visualizationUtils.addZeroIfNecessary(classBreaks);

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
        yAxis.tickFormat(visualizationUtils.bigNumTickFormatter);

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
      choroplethLegend.css('height', colorBarHeight + BOTTOM_PADDING);
      choroplethLegend.css('width', tickAreaWidth + COLOR_BAR_WIDTH);

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
            attr('data-flyout-text', visualizationUtils.bigNumTickFormatter(value));
        } else {
          rects.
            attr('data-flyout-text', value);
        }
      } else {
        if (isLargeRange) {
          rects.
            attr('data-flyout-text', _.bind(function(color, i) {
              return visualizationUtils.bigNumTickFormatter(classBreaks[i]) + ' – ' +
                visualizationUtils.bigNumTickFormatter(classBreaks[i + 1]);
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
  function LegendContinuous(legendElement, container) {

    this.legendElement = legendElement.addClass('continuous');
    this.container = container;
    this.gradientId = 'gradient-{0}'.format(_.uniqueId());
  }

  $.extend(LegendContinuous.prototype, {
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
      if (scale.base && _.head(stops) === 0) {
        stops[0] = _.head(scale.domain());
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
      if (scale.base && _.head(domain) === 0) {
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
        axis.tickFormat(visualizationUtils.bigNumTickFormatter);
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

      var values = _.map(
        _.map(data.features, 'properties'),
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
      var indexOfZero = visualizationUtils.addZeroIfNecessary(tickStops);

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
