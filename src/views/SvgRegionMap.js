const utils = require('socrata-utils');
const d3 = require('d3');
const ss = require('simple-statistics');
const chroma = require('chroma-js');
const $ = require('jquery');
const _ = require('lodash');
const L = require('leaflet');
const SvgVisualization = require('./SvgVisualization');
const I18n = require('../I18n');

// These constants live here and not in the instance with the other constants
// because we need to add them to the function that gets exported. This is
// necessary because the code that merges the query results with the shapefile
// in the jQuery plugin needs to communicate these values with the below
// implementation in a way that is not specific to any individual instance
// thereof.
SvgRegionMap.SHAPEFILE_REGION_HUMAN_READABLE_NAME =
  '__SHAPEFILE_REGION_HUMAN_READABLE_NAME__';
SvgRegionMap.SHAPEFILE_REGION_VALUE = '__SHAPEFILE_REGION_VALUE__';
SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED = '__SHAPEFILE_REGION_IS_SELECTED__';

function SvgRegionMap(element, vif) {

  _.extend(this, new SvgVisualization(element, vif));

  var self = this;

  // Map configuration
  const MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS = 200;
  const MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS = 400;
  // Region coloring class derivation (only for discrete legends)
  const MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED = 7;
  // Region rendering
  const REGION_DEFAULT_STROKE_WIDTH = 1;
  const REGION_SELECTED_STROKE_WIDTH = 4;
  // Base layer rendering
  const DEFAULT_BASE_LAYER_URL =
    'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
  const DEFAULT_BASE_LAYER_OPACITY = 0.8;
  // Legend rendering
  const DEFAULT_LEGEND_CONTINUOUS_ZERO_COLOR = '#ffffff';
  const DEFAULT_LEGEND_CONTINUOUS_POSITIVE_COLOR = '#003747';
  const DEFAULT_LEGEND_CONTINUOUS_NEGATIVE_COLOR = '#c6663d';
  const DEFAULT_LEGEND_DISCRETE_ZERO_COLOR = '#eeeeee';
  const DEFAULT_LEGEND_DISCRETE_POSITIVE_COLOR = '#408499';
  const DEFAULT_LEGEND_DISCRETE_NEGATIVE_COLOR = '#c6663d';

  const DEFAULT_FEATURE_NULL_COLOR = '#ddd';
  const DEFAULT_FEATURE_STROKE_COLOR = '#fff';
  const DEFAULT_FEATURE_SELECTED_COLOR = '#debb1e';

  var $mapElement;
  var $legend;
  var map;
  // Keep track of the base and region layers so that we can remove them
  // cleanly.
  //
  // Every redraw of the map forces us to remove the layer entirely because
  // there is no way to mutate already-rendered geojson objects.
  var baseLayer;
  var lastRenderedBaseLayerUrl;
  var lastRenderedBaseLayerOpacity;
  var regionLayer;
  // Watch for first render so we know whether or not to update the
  // center/bounds. (We don't update the center or the bounds if the map has
  // already been rendered so that we can retain potential panning and zooming
  // done by the user.
  var firstRender = true;
  // Keep track of click details so that we can zoom on double-click but
  // still selects on single clicks.
  var lastClick = 0;
  var lastClickTimeout = null;
  var legend;

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData) {
    var $visualizationContainer = self.$element.find('.socrata-visualization-container');

    if (
      $visualizationContainer.width() <= 0 ||
      $visualizationContainer.height() <= 0
    ) {
      return;
    }

    self.clearError();

    if (firstRender) {
      // If the VIF has the center and zoom level of the map specified we can
      // just use that. Otherwise we'll need to derive a bounding box from the
      // shapefile and tell Leaflet to attempt to show that bounding box
      // instead.
      let lat = _.get(newVif, 'configuration.mapCenterAndZoom.center.lat');
      let lng = _.get(newVif, 'configuration.mapCenterAndZoom.center.lng');
      let zoom = _.get(newVif, 'configuration.mapCenterAndZoom.zoom');
      let centerAndZoomDefined = _.every([lat, lng, zoom], _.isNumber);

      initializeMap();

      // Note that we prefer center and zoom over extents, since we intend to
      // deprecate the latter and the former will be set by the new authoring
      // experience.
      if (centerAndZoomDefined) {
        updateCenterAndZoom();
      } else if (newData) {
        updateMapBoundsFromGeoJSONData(newData);
      }
    }

    if (newVif) {

      self.updateVif(newVif);
      renderLegend();
      updateBaseLayer();
    }

    if (newData) {
      updateRegionLayer(newData);
    }
  };

  this.invalidateSize = function() {

    if (map) {
      map.invalidateSize();
    }
  };

  this.destroy = function() {

    if (map) {

      detachMapEvents();
      detachLegendEvents();

      map.remove();
    }

    self.$element.empty();
  };


  /**
   * Private methods
   */

  function renderTemplate() {

    $mapElement = $(
      '<div>',
      {
        'class': 'region-map'
      }
    );

    self.
      $element.
        find('.socrata-visualization-container').
          append([
            $mapElement,
            $legend
          ]);
  }

  function renderLegend() {
    const colors = {
      continuous: {
        negative: _.get(
          self.getVif(),
          'configuration.legend.negativeColor',
          DEFAULT_LEGEND_CONTINUOUS_NEGATIVE_COLOR
        ),
        zero: _.get(
          self.getVif(),
          'configuration.legend.zeroColor',
          DEFAULT_LEGEND_CONTINUOUS_ZERO_COLOR
        ),
        positive: _.get(
          self.getVif(),
          'configuration.legend.positiveColor',
          DEFAULT_LEGEND_CONTINUOUS_POSITIVE_COLOR
        )
      },
      discrete: {
        negative: _.get(
          self.getVif(),
          'configuration.legend.negativeColor',
          DEFAULT_LEGEND_DISCRETE_NEGATIVE_COLOR
        ),
        zero: _.get(
          self.getVif(),
          'configuration.legend.zeroColor',
          DEFAULT_LEGEND_DISCRETE_ZERO_COLOR
        ),
        positive: _.get(
          self.getVif(),
          'configuration.legend.positiveColor',
          DEFAULT_LEGEND_DISCRETE_POSITIVE_COLOR
        )
      }
    };
    // jQuery doesn't support SVG, so we have to create these elements manually
    const xmlns = 'http://www.w3.org/2000/svg';

    var ticks = document.createElementNS(xmlns, 'g');
    var legendTicks = document.createElementNS(xmlns, 'svg');
    var gradient = document.createElementNS(xmlns, 'svg');
    // Default to continuous legends (this will be overridden if specified).
    var LegendType = LegendContinuous;

    if (_.get(self.getVif(), 'configuration.legend.type') === 'discrete') {
      LegendType = LegendDiscrete;
    }

    // Set up the legend svg elements.
    ticks.setAttribute('class', 'ticks');
    legendTicks.setAttribute('class', 'legend-ticks');
    $(legendTicks).append(ticks);
    gradient.setAttribute('class', 'gradient');

    $legend = self.
      $element.
      find('.region-map-legend');

    if ($legend.length > 0) {

      detachLegendEvents();
      $legend.remove();
    }

    $legend = $(
      '<div>',
      {
        'class': 'region-map-legend'
      }
    ).append([
      gradient,
      legendTicks
    ]);

    self.
      $element.
      find('.socrata-visualization-container').
      append($legend);

    attachLegendEvents();

    legend = new LegendType(
      self.$element.find('.region-map-legend'),
      self.$element.find('.socrata-visualization-container'),
      colors
    );
  }

  function initializeMap() {
    const mapOptions = {
      attributionControl: false,
      center: [47.609895, -122.330259], // Center on Seattle by default.
      keyboard: false,
      scrollWheelZoom: false,
      zoom: 1,
      zoomControlPosition: 'topleft',
      minZoom: 1,
      maxZoom: 18,
      zoomAnimation: true
    };

    map = L.map($mapElement[0], mapOptions);
    // Only update bounds on the first render so we can persist
    // users' panning and zooming.
    //
    // It is critical to invalidate size prior to updating bounds
    // Otherwise, Leaflet will fit the bounds to an incorrectly sized viewport.
    // This manifests itself as the map being zoomed all of the way out.
    map.invalidateSize();

    attachMapEvents();

    firstRender = false;
  }

  function attachMapEvents() {

    map.on('mouseout', hideFlyout);
    map.on('dragend zoomend', emitMapCenterAndZoomChange);
  }

  function attachLegendEvents() {

    $legend.on('mousemove', '.region-map-legend-color', showLegendFlyout);
    $legend.on('mouseout', '.region-map-legend-color', hideFlyout);
  }

  function detachMapEvents() {

    map.off('mouseout', hideFlyout);
    map.off('dragend zoomend', emitMapCenterAndZoomChange);
  }

  function detachLegendEvents() {

    $legend.off('mousemove', '.region-map-legend-color', showLegendFlyout);
    $legend.off('mouseout', '.region-map-legend-color', hideFlyout);
  }

  function handleFeatureMouseover(event) {

    addHighlight(event);
    showFlyout(event);
  }

  function handleFeatureMouseout(event) {

    removeHighlight(event);
    hideFlyout();
  }

  function handleFeatureSelected(event) {
    const now = Date.now();
    const delay = now - lastClick;

    lastClick = now;

    if (_.get(self.getVif(), 'configuration.interactive')) {
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
          function() {
            emitSelectRegionEvent(event);
          },
          MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS
        );
      }
    }
  }

  function emitSelectRegionEvent(event) {
    var feature = event.target.feature;
    var shapefilePrimaryKey = _.get(
      self.getVif(),
      'configuration.shapefile.primaryKey',
      null
    );

    utils.assert(
      shapefilePrimaryKey !== null,
      'VIF does not contain a valid shapefile primary key'
    );

    if (feature.properties.hasOwnProperty(shapefilePrimaryKey)) {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED',
        feature.properties[shapefilePrimaryKey]
      );
    }
  }

  function showFlyout(event) {
    var feature = event.target.feature;
    var payload = {
      element: event.target,
      clientX: event.originalEvent.clientX,
      clientY: event.originalEvent.clientY,
      title: feature.properties[SvgRegionMap.SHAPEFILE_REGION_HUMAN_READABLE_NAME],
      valueLabel: _.get(
        self.getVif(),
        'series[0].label',
        I18n.translate('visualizations.common.flyout_value_label')
      ),
      // value will be overridden below if there is one.
      value: I18n.translate('visualizations.common.no_value'),
      selectedNotice: I18n.translate(
        'visualizations.region_map.flyout_selected_notice'
      ),
      selected: feature.properties[SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED]
    };
    var value = feature.properties[SvgRegionMap.SHAPEFILE_REGION_VALUE];
    var valueUnit;
    var aggregationField = _.get(
      self.getVif(),
      'series[0].dataSource.measure.columnName'
    );
    var aggregationFunction = _.get(
      self.getVif(),
      'series[0].dataSource.measure.aggregationFunction'
    );

    if (aggregationFunction === 'sum') {

      valueUnit = utils.pluralize(
        aggregationField,
        value
      );
    } else {

      if (value === 1) {
        valueUnit = self.getUnitOneBySeriesIndex(0);
      } else {
        valueUnit = self.getUnitOtherBySeriesIndex(0);
      }
    }

    if (_.isNumber(value)) {
      payload.value = `${utils.formatNumber(value)} ${valueUnit}`;
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT',
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
      'SOCRATA_VISUALIZATION_REGION_MAP_LEGEND_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT',
      null
    );
  }

  function emitMapCenterAndZoomChange() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const lat = center.lat;
    const lng = center.lng;

    var centerAndZoom;

    utils.assertIsOneOfTypes(lat, 'number');
    utils.assert(lat >= -90, `Latitude is out of bounds (${lat} < -90)`);
    utils.assert(lat <= 90, `Latitude is out of bounds (${lat} > 90)`);

    utils.assertIsOneOfTypes(lng, 'number');
    utils.assert(lng >= -180, `Longitude is out of bounds (${lng} < -180)`);
    utils.assert(lng <= 180, `Longitude is out of bounds (${lng} > 180)`);

    utils.assertIsOneOfTypes(zoom, 'number');
    utils.assert(zoom >= 0, `Zoom is out of bounds (${zoom} < 0)`);
    utils.assert(zoom < 19, `Zoom is out of bounds (${zoom} > 18)`);

    centerAndZoom = {
      center: {
        lat: lat,
        lng: lng
      },
      zoom: zoom
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_CENTER_AND_ZOOM_CHANGED',
      centerAndZoom
    );
  }

  function updateCenterAndZoom() {
    const center = _.get(
      self.getVif(),
      'configuration.mapCenterAndZoom.center'
    );
    const zoom = _.get(
      self.getVif(),
      'configuration.mapCenterAndZoom.zoom'
    );

    if (center && zoom) {
      utils.assertHasProperties(center, 'lat', 'lng');
      utils.assertIsOneOfTypes(center.lat, 'number');
      utils.assertIsOneOfTypes(center.lng, 'number');
      utils.assertIsOneOfTypes(zoom, 'number');

      map.setView(center, zoom, {animate: false});
    }
  }

  function updateMapBoundsFromGeoJSONData(geojsonData) {
    var minLng = 180;
    var maxLng = -180;
    var minLat = 90;
    var maxLat = -90;
    var boundsArray = [
      [maxLat, maxLng],
      [minLat, minLng]
    ];
    var computedBounds;

    function buildPositionArray(positions) {
      var cleanPositions = positions.filter(function(position) {
        return _.isNumber(position[0]) && _.isNumber(position[1]);
      });
      // IMPORTANT NOTE: in geojson, positions are denoted as pairs of the
      // following format: [longitude, latitude].
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

    if (!_.isUndefined(geojsonData)) {

      if (geojsonData.type !== 'FeatureCollection') {

        throw new Error(
          'Cannot calculate geojson bounds: geojsonData is not of type ' +
          '<FeatureCollection>.'
        );
      }

      _.each(geojsonData.features, function(feature) {
        var coordinates = feature.geometry.coordinates;

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

    computedBounds = L.latLngBounds([
      boundsArray[1][0],
      boundsArray[1][1]
    ], [
      boundsArray[0][0],
      boundsArray[0][1]
    ]);

    // We need to explicitly pass an options object with animate set to false
    // because (in some cases) Leaflet will default to an empty object if none
    // is explicitly provided and then check the value of a non-existent
    // animate property, causing a TypeError and halting execution.
    map.fitBounds(
      computedBounds,
      {
        animate: false
      }
    );
  }

  function updateBaseLayer() {
    const baseLayerUrl = _.get(
      self.getVif(),
      'configuration.baseLayerUrl',
      DEFAULT_BASE_LAYER_URL
    );
    const baseLayerOpacity = _.get(
      self.getVif(),
      'configuration.baseLayerOpacity',
      DEFAULT_BASE_LAYER_OPACITY
    );

    if (
      (baseLayerUrl !== lastRenderedBaseLayerUrl) ||
      (baseLayerOpacity !== lastRenderedBaseLayerOpacity)
    ) {

      lastRenderedBaseLayerUrl = baseLayerUrl;
      lastRenderedBaseLayerOpacity = baseLayerOpacity;

      if (baseLayer) {
        map.removeLayer(baseLayer);
      }

      baseLayer = L.tileLayer(
        baseLayerUrl,
        {
          attribution: '',
          detectRetina: false,
          opacity: baseLayerOpacity,
          unloadInvisibleTiles: true
        }
      );

      map.addLayer(baseLayer);
    }
  }

  function updateRegionLayer(dataToRender) {
    const dimensions = {
      width: self.$element.find('.socrata-visualization-container').width(),
      height: self.$element.find('.socrata-visualization-container').width()
    };
    // Add legend and get color scale
    var coloring;
    var featureOptions;

    // Validate data is geoJson
    utils.assertHasProperties(
      dataToRender,
      'features',
      'type'
    );

    // Emit render started
    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_RENDER_START',
      {
        timestamp: Date.now()
      }
    );

    coloring = legend.update(dataToRender, dimensions);

    featureOptions = {
      onEachFeature: function(feature, layer) {
        layer.on({
          mouseover: handleFeatureMouseover,
          mouseout: handleFeatureMouseout,
          mousemove: showFlyout,
          click: handleFeatureSelected
        });
      },
      style: getStyleFn(coloring)
    };

    if (map) {

      if (regionLayer) {
        map.removeLayer(regionLayer);
      }

      regionLayer = L.geoJson(dataToRender, featureOptions);
      regionLayer.addTo(map);
    }

    // Emit render complete
    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_RENDER_COMPLETE',
      {
        timestamp: Date.now()
      }
    );
  }

  function getStyleFn(colorScale) {

    /* eslint-disable no-unused-vars */
    function getFillColor(feature, selected) {
    /* eslint-enable no-unused-vars */
      var value = _.get(feature, `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`);

      if (_.isFinite(value)) {
        if (colorScale) {
          return String(colorScale(value));
        } else {
          return 'transparent';
        }
      } else {
        return DEFAULT_FEATURE_NULL_COLOR;
      }
    }

    function getStrokeColor(feature, selected) {
      var value = _.get(feature, `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`);

      if (!_.has(feature, 'geometry.type')) {

        throw new Error(
          'Cannot calculate stroke color for undefined feature geometry type.'
        );
      }

      if (
        !_.includes(['LineString', 'MultiLineString'], feature.geometry.type)
      ) {

        return selected ?
          DEFAULT_FEATURE_SELECTED_COLOR :
          DEFAULT_FEATURE_STROKE_COLOR;
      }

      if (!_.isFinite(value)) {
        return DEFAULT_FEATURE_NULL_COLOR;
      }

      if (selected) {
        return DEFAULT_FEATURE_SELECTED_COLOR;
      } else if (colorScale) {
        return getFillColor(feature, false);
      } else {
        return DEFAULT_FEATURE_STROKE_COLOR;
      }
    }

    function getStrokeWidth(feature, selected) {

      if (!_.has(feature, 'geometry.type')) {

        throw new Error(
          'Cannot calculate stroke width for undefined feature geometry type.'
        );
      }

      switch (feature.geometry.type) {
        case 'LineString':
        case 'MultiLineString':
          return 3;
        default:
          return (selected) ? 3 : 1;
      }
    }

    return function(feature) {
      const selected = _.get(
        feature,
        `properties.${SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED}`,
        false
      );
      const opacity = colorScale ? 0.8 : 1;

      return {
        fillColor: getFillColor(feature, selected),
        color: getStrokeColor(feature, selected),
        weight: getStrokeWidth(feature, selected),
        opacity: opacity,
        dashArray: 0,
        fillOpacity: opacity
      };
    };
  }

  function addHighlight(event) {
    const layer = event.target;

    if (!layerIsSelected(layer)) {

      layer.setStyle({
        weight: REGION_SELECTED_STROKE_WIDTH
      });

      // IE HACK (CORE-3566): IE exhibits (not fully-characterized) pointer
      // madness if you bring a layer containing a MultiPolygon which actually
      // contains more than one polygon to the front in a featureMouseOver.
      //
      // The rough cause is that the paths corresponding to this layer get
      // removed and re-added elsewhere in the dom while the mouseover is
      // getting handled.
      //
      // The symptoms of this are IE spewing mouseout events all over the place
      // on each mousemove.
      if (!L.Browser.ie) {
        layer.bringToFront();
      }
    }
  }

  function removeHighlight(event) {
    const layer = event.target;

    if (!layerIsSelected(layer)) {

      layer.setStyle({
        weight: REGION_DEFAULT_STROKE_WIDTH
      });
      layer.bringToBack();
    }
  }

  function layerIsSelected(layer) {

    return _.get(
      layer,
      `feature.properties.${SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED}`
    );
  }

  /**
   * Legends
   */

  /* eslint-disable no-unused-vars */
  function Legend(legendElement, container, colors) {
  /* eslint-enable no-unused-vars */

    this.legendElement = legendElement;
    this.container = container;

    this.bigNumTickFormatter = function(val) {

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
    };

    /**
     * If the values straddle 0, we want to add a break at 0
     *
     * @return {Number} the index at which we added 0, or -1 if we didn't.
     * @protected
     */
    this.addClassBreakAtZeroIfMissing = function(classBreaks) {

      var indexOfZero = _.sortedIndex(classBreaks, 0);

      // Do not need to add break if it already exists.
      if (_.inRange(indexOfZero, 1, classBreaks.length) &&
        (classBreaks[indexOfZero] !== 0) &&
        (classBreaks[indexOfZero - 1] !== 0)) {
        classBreaks.splice(indexOfZero, 0, 0);
        return indexOfZero;
      }

      return -1;
    };
  }

  /**
   * Extends the base Legend class for a discrete scale.
   */
  function LegendDiscrete(legendElement, container, colors) {

    _.extend(this, new Legend(legendElement, container, colors));

    /* eslint-disable no-shadow */
    let self = this;
    /* eslint-enable no-shadow */

    this.colors = colors.discrete;

    /**
     * Generates a color scale for the given classBreaks.
     * @param {Number[]} classBreaks The values that define the boundaries of
     *   the different discrete groups of values.
     * @return {Object} an object with 'colors' and 'scale' functions, that
     *   mirror a chroma scale.
     */
    this.colorScaleFor = function(classBreaks) {
      // Sample color classes
      //
      /* eslint-disable no-unused-vars */
      var negativeColorRange = ['#c6663d', '#e4eef0'];
      var positiveColorRange = ['#e4eef0', '#408499'];
      var divergingColors = ['brown', 'lightyellow', 'teal'];
      var qualitativeColors = [
        '#8dd3c7',
        '#ffffb3',
        '#bebada',
        '#fb8072',
        '#80b1d3',
        '#fdb462',
        '#b3de69',
        '#fccde5',
        '#d9d9d9',
        '#bc80bd',
        '#ccebc5',
        '#ffed6f'
      ];
      /* eslint-enable no-unused-vars */

      var marginallyNegative = chroma.interpolate(
        this.colors.zero,
        this.colors.negative,
        0.1
      );
      var marginallyPositive = chroma.interpolate(
        this.colors.zero,
        this.colors.positive,
        0.1
      );

      /**
       * @param {String[]|String} colorRange A string, or an array of color
       *   strings defining the range
       * of colors the scale should span. There are several predefined values
       *   you can use:
       *
       *   divergingColors, qualitativeColors, positiveColorRange.
       */
      function calculateColoringScale(colorRange, scaleClassBreaks) {

        if (!_.isArray(scaleClassBreaks)) {

          throw new Error(
            'Cannot calculate coloring parameters with invalid class breaks.'
          );
        }

        if (qualitativeColors === colorRange) {

          if (scaleClassBreaks.length > colorRange.length) {
            throw new Error(
              'Cannot calculate qualitative coloring parameters for more ' +
              `than ${qualitativeColors.length} class breaks.`
            );
          }

          colorRange = qualitativeColors.slice(0, scaleClassBreaks.length);
        }

        if (colorRange.length === 2) {
          colorRange = chroma.interpolate.bezier(colorRange);
        }

        return chroma.
          scale(colorRange).
          domain(scaleClassBreaks).

          // For linear color ranges, make sure the lightness varies linearly
          correctLightness(colorRange.length === 2).

          // use LAB color space to approximate perceptual brightness
          // See more:
          // https://vis4.net/blog/posts/mastering-multi-hued-color-scales/
          mode('lab');
      }

      if (classBreaks.length === 1) {

        // There's only one value. So give it only one color.
        var color;
        if (classBreaks[0] < 0) {
          color = this.colors.negative;
        } else if (classBreaks[0] > 0) {
          color = this.colors.positive;
        } else {
          color = this.colors.zero;
        }

        var singleColorScale = _.constant([color]);
        singleColorScale.colors = _.constant([color]);

        return singleColorScale;
      }

      if (classBreaks[0] < 0) {

        // If we have values that straddle zero, add the zero point as one of
        // our breaks
        if (_.last(classBreaks) > 0) {
          var indexOfZero = classBreaks.indexOf(0);
          if (indexOfZero < 0) {
            throw new Error(
              'Expecting classBreaks to contain a break at 0, if the values ' +
              'straddle 0'
            );
          }

          var negatives = classBreaks.slice(0, indexOfZero + 1);
          var positives = classBreaks.slice(indexOfZero);

          // When the values straddle 0 unevenly, we want the brightness of the
          // colors to be proportional to how far from 0 it is. In particular,
          // we want eg 5 and -5 to have about the same amount of luminosity.
          // So - have the colors scale to the same absolute distance from zero.
          var negativeHeavy = -classBreaks[0] > _.last(classBreaks);
          if (negativeHeavy) {

            // The last value of classBreaks is interpreted as the highest value
            // that's in the last class. Since we're adding another value to the
            // end, it's meaning changes - now it is the lowest value
            // (inclusive) of the last break. Since we actually want that value
            // to be included in the last class, we have to increment it.
            positives[positives.length - 1] += (
              (-classBreaks[0] - _.last(positives)) / 100
            );
            positives.push(-classBreaks[0]);
          } else {
            negatives.unshift(-_.last(classBreaks));
          }

          var negativeColorScale = calculateColoringScale(
            [this.colors.negative, marginallyNegative],
            negatives
          );
          var positiveColorScale = calculateColoringScale(
            [marginallyPositive, this.colors.positive],
            positives
          );

          // Create a faux colorScale that implements the interface, but
          // delegates to the positive or negative actual-scale depending on
          // what you're trying to scale.
          var fauxColorScale = _.bind(
            function(value) {

              if (value === 0) {
                return chroma(this.colors.zero);
              } else {

                return (value < 0) ?
                  negativeColorScale(value) :
                  positiveColorScale(value);
              }
            },
            this
          );

          /**
           * Our faux .colors method basically just retrieves the positive and
           * negative arrays and combines them.
           */
          fauxColorScale.colors = function() {

            var negColors = negativeColorScale.colors();
            var posColors = positiveColorScale.colors();

            // We added a break to catch the most-luminescent color, on the
            // scale that didn't have values as high as the other one. So -
            // drop that color.
            if (negativeHeavy) {
              posColors.pop();
            } else {
              negColors.shift();
            }

            // chroma gives us 2 colors if we give it a domain of only 2 values.
            // This messes things up later on when we assume that
            // classBreaks.length == colors.length + 1, so shave off some colors
            // if we have to.
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
          return calculateColoringScale(
            [this.colors.negative, marginallyNegative],
            classBreaks
          );
        }
      } else {
        // Otherwise, it's all positive, so give them the positive color scale.
        return calculateColoringScale(
          [marginallyPositive, this.colors.positive],
          classBreaks
        );
      }
    };

    this.calculateClassBreaks = function(dataToRender) {
      var values = _.reduce(
        dataToRender.features,
        function(data, feature) {
          var value = _.get(
            feature,
            `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`
          );

          if (!_.isUndefined(value)) {
            data.push(value);
          }

          return data;
        },
        []
      );
      var uniqueValues = _.uniq(values);
      var numberOfPossibleBreaks = uniqueValues.length - 1;
      var classBreaksArgs = {};

      function getNumberOfClasses(valuesForClasses) {
        // Handles numberOfClasses in Jenks
        // (implemented for _.uniq(values).length > 6)
        var possibleBreaks = _.uniq(valuesForClasses).length;
        var evenPossibleBreaks = possibleBreaks - (possibleBreaks % 2);
        var maxNumClasses = evenPossibleBreaks / 2;

        function getNearestOddNumber(num) {
          if (num % 2 === 0) {
            return num - 1;
          } else {
            return num;
          }
        }

        return _.min([getNearestOddNumber(maxNumClasses), 7]);
      }

      function createClassBreaks(options) {
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

              classBreaks = scale.
                nice().
                ticks(_.min([options.numberOfClasses, 4]));

              // Make sure min and max are in the classBreak ticks that d3 gives
              // us.
              if (classBreaks[0] > minVal) {
                classBreaks.unshift(minVal);
              }

              if (_.last(classBreaks) < maxVal) {
                classBreaks.push(maxVal);
              }
            }
            break;
          default:
            throw new Error(
              `Invalid/non-supported class breaks method ${options.method}`
            );
        }
        return _.uniq(classBreaks);
      }

      // For very small values, 'jenks' does not make sense (produces
      // duplicate values).  Thus, use 'equalInterval' in this cases.
      if (numberOfPossibleBreaks <= MAXIMUM_NUMBER_OF_CLASS_BREAKS_ALLOWED) {
        classBreaksArgs.method = 'equalInterval';
        classBreaksArgs.numberOfClasses = uniqueValues.length;
      } else {
        classBreaksArgs.method = 'jenks';
        classBreaksArgs.numberOfClasses = getNumberOfClasses(values);
      }

      return createClassBreaks({
        method: classBreaksArgs.method,
        data: values,
        numberOfClasses: classBreaksArgs.numberOfClasses
      });
    };

    /**
     * Updates the legend.
     *
     * @param {Number[]} data The data being plotted on the map.
     *
     * @return {chroma.scale} A chroma color scale that maps a datum value to a
     *   color.
     */
    this.update = function(dataToRender) {
      var classBreaks = self.calculateClassBreaks(dataToRender);

      self.addClassBreakAtZeroIfMissing(classBreaks);

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

            // If the only value is 0 then we can just return a fake range.
            classBreaks.push(1);
          } else if (classBreaks[0] < 0) {
            classBreaks.push(0);
          } else {
            classBreaks.unshift(0);
          }
          break;

        case 2:

          // If there are two values, duplicate the max value, to allow there to
          // be a color stop
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
      var colorBarHeight = Math.floor(
        Math.min(this.container.height() - 60, 250)
      );

      // Reserve some padding space for the bottom-most tick label text.
      var BOTTOM_PADDING = 15;

      var legendColors = colorScale.colors();

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

      var yTickScaleDomain = yTickScale.domain([minBreak, maxBreak]);
      var yLabelScaleDomain = yLabelScale.domain([minBreak, maxBreak]);

      var isLargeRange = ss.standard_deviation(classBreaks) > 10;

      if (isLargeRange) {

        // d3 quirk: using a #tickFormat formatter that just returns the value
        // gives unexpected results due to floating point math.
        // We want to just return the value for "small-ranged" data.
        // --> do not call a tickFormatter on yAxis if range is small.
        yAxis.tickFormat(self.bigNumTickFormatter);

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
      var tickAreaWidth = (
        maxLabelWidth +
        yAxis.tickSize() +
        yAxis.tickPadding()
      );

      // The d3 axis places all elements LEFT of the origin (negative X coords).
      // Translate everything to within the bounds of the SVG.
      labels.
        attr('transform', `translate(${tickAreaWidth})`);

      // Size the SVG appropriately.
      svg.attr('width', tickAreaWidth + COLOR_BAR_WIDTH);

      // Size the container appropriately
      $legend.css('height', colorBarHeight + BOTTOM_PADDING);
      $legend.css('width', tickAreaWidth + COLOR_BAR_WIDTH);

      // draw legend colors
      var rects = svg.
        selectAll('.region-map-legend-color').
        data(legendColors);

      rects.enter().
        append('rect');

      rects.
        attr('class', 'region-map-legend-color').
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
            attr('data-flyout-text', self.bigNumTickFormatter(value));
        } else {

          rects.
            attr('data-flyout-text', value);
        }
      } else {

        if (isLargeRange) {

          rects.
            attr('data-flyout-text', _.bind(function(color, i) {
              return self.bigNumTickFormatter(classBreaks[i]) + ' – ' +
                self.bigNumTickFormatter(classBreaks[i + 1]);
            }, this));
        } else {

          rects.
            attr('data-flyout-text', function(color, i) {
              return `${classBreaks[i]} – ${classBreaks[i + 1]}`;
            });
        }
      }

      rects.exit().
        remove();

      return colorScale;
    };
  }

  /**
   * Extends the base Legend class for a continuous scale.
   */
  function LegendContinuous(legendElement, container, colors) {

    _.extend(this, new Legend(legendElement, container, colors));

    /* eslint-disable no-shadow */
    let self = this;
    /* eslint-enable no-shadow */

    this.gradientId = `gradient-${_.uniqueId()}`;
    this.colors = colors.continuous;
    this.NUM_TICKS = 5;

    this.legendElement.addClass('continuous');

    /**
     * Finds an array of values, including the min, max, and numStops - 2 more
     * values, evenly-spaced between the min and max.
     *
     * @param {d3.scale} scale a d3 scale whose domain is the value domain.
     * @param {Number} numStops the number of values to find.
     *
     * @return {Number[]} a sorted array of numbers, of length numStops. The
     *   first element is the smallest value in the features, the last element
     *   is the largest, and the other values are evenly spaced between them
     *   (and may not actually appear in the dataset).
     * @private
     */
    this.findTickStops = function(scale, numStops) {

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
    };

    /**
     * Draw an SVG rectangle with the appropriate gradient.
     *
     * @param {jQuery selection} gradientSvg The node to render into.
     * @param {Number[]} tickStops the values at which ticks will be drawn. The
     *   first value should be the minimum value, and the last value should be
     *   the maximum.
     * @param {d3.scale} colorScale a scale from a value, to a color.
     *
     * @private
     */
    this.drawGradient = function(gradientSvg, tickStops, colorScale) {

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

      // Due to a webkit bug (https://bugs.webkit.org/show_bug.cgi?id=83438),
      // we can't select a camelCase element. So select it by id
      var gradient = gradientSvgSelection.selectAll(`#${this.gradientId}`);

      // Create a scale for positioning values by percentage
      var positionScale = colorScale.copy().range([0, 100]);
      var domain = positionScale.domain();
      if (domain.length > 2) {
        positionScale.domain([domain[0], _.last(domain)]);
      }

      // We'll make a stop in the gradient for each tick stop, to ensure the
      // gradients grade similarly.
      var gradientStops = gradient.selectAll('stop').data(tickStops);
      gradientStops.enter().append('stop');
      gradientStops.attr({
        'offset': function(value) {
          return `${positionScale(value)}%`;
        },
        'stop-color': colorScale
      });
      gradientStops.exit().remove();

      // Draw the rectangles in pieces, so as to store the data, so the ticks
      // can access them.
      var rectangles = gradientSvgSelection.
        selectAll('rect').
        data(tickStops);

      rectangles.enter().
        append('rect');

      rectangles.attr({
        x: 0,
        y: function(value) {

          // Since y is actually 'top', and we want the lowest value at the
          // bottom, subtract from 100
          return `${100 - positionScale(value)}%`;
        },
        width: '100%',
        height: function(value, i) {

          if (i === 0) {
            return 0;
          }

          var heightValue = Math.abs(
            positionScale(value) - positionScale(tickStops[i - 1])
          );

          return `${heightValue}%`;
        },
        fill: `url(#${this.gradientId})`
      });

      rectangles.exit().remove();
    };

    /**
     * Creates the d3 scale used to map from a value to a color.
     *
     * @param {Number[]} tickStops an array of values, the first of which should
     *   be the minimum value of the data, the last of which should be the
     *   maximum value of the data.
     * @param {d3.scale} scale a d3 scale whose domain is the value domain.
     *
     * @return {d3.scale} a scale mapping from a value within features, to a
     *   color.
     * @private
     */
    this.createColorScale = function(tickStops, scale) {

      var domain;
      var range = [
        this.colors.negative,
        this.colors.zero,
        this.colors.positive
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

      // For log scales, if the domain includes zero, set it to the minimum
      // value instead.
      if (scale.base && _.head(domain) === 0) {
        domain[0] = min;
      }

      return scale.copy().
        domain(domain).
        range(range);
    };

    /**
     * Draw the ticks and labels for the legend.
     *
     * @param {jQuery selection} ticksSvg The node to render into.
     * @param {jQuery selection} gradientSvg The associated gradient node to
     *   consult for layout.
     * @param {Number[]} tickStops the values at which ticks will be drawn. The
     *   first value should be the minimum value, and the last value should be
     *   the maximum.
     * @param {d3.scale} colorScale a scale from a value, to a color.
     * @param {Number} indexOfZero The index of the origin in ticks.
     *
     * @private
     */
    this.drawAxis = function(
      ticksSvg,
      gradientSvg,
      tickStops,
      scale,
      indexOfZero
    ) {

      var ticksGroup = ticksSvg.find('g.ticks');
      var positionScale = scale.copy().range([this.legendElement.height(), 0]);
      var axis = d3.svg.axis().
        scale(positionScale).
        tickValues(tickStops).
        orient('left');

      if (_.last(tickStops) - tickStops[0] > 10) {
        axis.tickFormat(self.bigNumTickFormatter);
      }

      axis(ticksGroup);

      // We want to size the ticks differently than d3's default. Do that
      // manually.
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

      // D3's axis draws ticks left-of-origin, which causes issues with browsers
      // that won't render SVG elements outside of the parent SVG node's bounds
      // (PhantomJS).
      //
      // So shift the ticks right into positive X coordinates, and then move the
      // entire SVG left to compensate.
      //
      // Similarly, D3's tick text extends above and below the SVG bounds.
      // Compensate much the same way.
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
      var tickTopOffset = (
        parseInt(gradientSvg.css('top'), 10) -
        (tickMaxHeight / 2)
      );

      // Allow for 1/2 tick height above and below by bumping up height.
      ticksSvg.height(gradientSvg.height() + tickMaxHeight);
      ticksSvg.width(gradientSvg.width() + tickMaxWidth);

      // Shift the entire SVG appropriately.
      ticksSvg.css('left', `${-tickMaxWidth}px`);
      ticksSvg.css('top', `${tickTopOffset}px`);

      // Now listen to me very carefully. Compensate for shift in SVG by putting
      // the ticks back.
      ticksGroup.attr(
        'transform',
        `translate(${tickMaxWidth},${tickMaxHeight / 2})`
      );
    };

    /**
     * Determines the type of d3 scale to create for the given values, and
     * creates it.
     *
     * @param {Number[]} values the data values we're visualizing.
     * @param {Number=} min the minimum value within values. Saves us the
     *   trouble of finding it, if you already have it.
     * @param {Number=} max the maximum value within values. Saves us the
     *   trouble of finding it, if you already have it.
     *
     * @return {d3.scale} a d3 scale of the determined type, with the domain
     *   set.
     */
    this.scaleForValues = function(values, min, max) {
      var scale = d3.scale.linear();

      min = min || _.min(values);
      max = max || _.max(values);

      if (min > 0 || max < 0) {

        // Eligible for logarithmic scale, if all-positive or all-negative
        // values
        var deltaMagnitude = Math.log(max - min) / Math.LN10;

        if (deltaMagnitude >= 3) {

          // Only logarithmic if we've got a large change in magnitude
          scale = d3.scale.log();
        }
      }

      return scale.domain([min, max]).nice();
    };

    /**
     * Redraw the legend.
     *
     * @return {d3.scale} a scale mapping from value to color.
     */
    this.update = function(dataToRender, dimensions) {

      if (!(dataToRender.features && dataToRender.features.length)) {
        return undefined;
      }

      var values = _.map(
        _.map(dataToRender.features, 'properties'),
        SvgRegionMap.SHAPEFILE_REGION_VALUE
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
      var tickStops = this.findTickStops(
        scale,
        Math.min(values.length, this.NUM_TICKS)
      );
      var indexOfZero = self.addClassBreakAtZeroIfMissing(tickStops);

      var colorScale = this.createColorScale(tickStops, scale);
      var gradientSvg = this.legendElement.find('svg.gradient');
      var ticksSvg = this.legendElement.find('svg.legend-ticks');

      // Grab the top and bottom padding from the css.
      var legendPaddingTop = parseInt(
        this.legendElement.css('padding-top'),
        10
      );
      var legendPaddingBottom = parseInt(
        this.legendElement.css('padding-bottom'),
        10
      );
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
    };
  }
}

module.exports = SvgRegionMap;
