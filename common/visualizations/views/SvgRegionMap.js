const utils = require('common/js_utils');
const d3 = require('d3');
const $ = require('jquery');
const _ = require('lodash');
const L = require('leaflet');
const SvgVisualization = require('./SvgVisualization');
const I18n = require('common/i18n').default;

// Map configuration
const MAP_SINGLE_CLICK_SUPPRESSION_THRESHOLD_MILLISECONDS = 200;
const MAP_DOUBLE_CLICK_THRESHOLD_MILLISECONDS = 400;
// Region rendering
const REGION_DEFAULT_STROKE_WIDTH = 1;
const REGION_SELECTED_STROKE_WIDTH = 4;
// Base layer rendering
const DEFAULT_BASE_LAYER_URL =
  'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
const DEFAULT_BASE_LAYER_OPACITY = 0.8;
// Legend rendering
const LEGEND_DEFAULT_ZERO_COLOR = '#ffffff';
const LEGEND_DEFAULT_POSITIVE_COLOR = '#003747';
const LEGEND_DEFAULT_NEGATIVE_COLOR = '#c6663d';
const LEGEND_DEFAULT_HEIGHT = 250;
const LEGEND_TOP_MARGIN = 50;
const LEGEND_GRADIENT_WIDTH = 15;
const LEGEND_GRADIENT_PADDING = {
  TOP: 10,
  RIGHT: 0,
  BOTTOM: 10,
  LEFT: 0
};
const LEGEND_GRADIENT_TICK_COLOR = '#444';
// Feature rendering
const FEATURE_DEFAULT_NULL_COLOR = '#ddd';
const FEATURE_DEFAULT_STROKE_COLOR = '#fff';
const FEATURE_DEFAULT_SELECTED_COLOR = '#debb1e';

SvgRegionMap.SHAPEFILE_REGION_HUMAN_READABLE_NAME =
  '__SHAPEFILE_REGION_HUMAN_READABLE_NAME__';
SvgRegionMap.SHAPEFILE_REGION_VALUE = '__SHAPEFILE_REGION_VALUE__';
SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED = '__SHAPEFILE_REGION_IS_SELECTED__';

function SvgRegionMap(element, vif, options) {

  _.extend(this, new SvgVisualization(element, vif, options));

  const self = this;

  let $mapElement;
  let map;
  // Keep track of the base and region layers so that we can remove them
  // cleanly.
  //
  // Every redraw of the map forces us to remove the layer entirely because
  // there is no way to mutate already-rendered geojson objects.
  let baseLayer;
  let lastRenderedBaseLayerUrl;
  let lastRenderedBaseLayerOpacity;
  let isLogScale;
  let colorScale;
  let regionLayer;
  // Watch for first render so we know whether or not to update the
  // center/bounds. (We don't update the center or the bounds if the map has
  // already been rendered so that we can retain potential panning and zooming
  // done by the user.
  let firstRender = true;
  // Keep track of click details so that we can zoom on double-click but
  // still selects on single clicks.
  let lastClick = 0;
  let lastClickTimeout = null;

  renderTemplate();

  /**
   * Public methods
   */

  this.render = function(newVif, newData, newColumns) {
    const $visualizationContainer = self.$element.
      find('.socrata-visualization-container');

    if (
      $visualizationContainer.width() <= 0 ||
      $visualizationContainer.height() <= 0
    ) {
      return;
    }

    self.clearError();

    if (firstRender) {
      initializeMap();
    }

    if (newVif) {
      // First, update our internal VIF reference, since both updateCenterAndZoom and updateBaseLayer
      // depend on this.getVif() returning the updated VIF instead of the previously rendered VIF.
      self.updateVif(newVif);

      // If the VIF has the center and zoom level of the map specified we can
      // just use that. Otherwise we'll need to derive a bounding box from the
      // shapefile and tell Leaflet to attempt to show that bounding box
      // instead.
      let lat = _.get(newVif, 'configuration.mapCenterAndZoom.center.lat');
      let lng = _.get(newVif, 'configuration.mapCenterAndZoom.center.lng');
      let zoom = _.get(newVif, 'configuration.mapCenterAndZoom.zoom');
      let centerAndZoomDefined = _.every([lat, lng, zoom], _.isNumber);

      // Note that we prefer center and zoom over extents, since we intend to
      // deprecate the latter and the former will be set by the new authoring
      // experience.
      if (centerAndZoomDefined) {
        updateCenterAndZoom();
      } else if (newData) {
        updateMapBoundsFromGeoJSONData(newData);
      }

      updateBaseLayer();
    }

    if (newData) {
      updateColorScale(newData);
      updateRegionLayer(newData);
    }

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    renderLegend();
  };

  this.invalidateSize = function() {

    if (map) {
      map.invalidateSize();
    }

    renderLegend();
  };

  this.destroy = function() {

    if (map) {

      detachEvents();
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

    $mapElement.append(
      $(
        '<div>',
        {
          'class': 'region-map-legend'
        }
      )
    );

    self.$element.find('.socrata-visualization-container').
      append($mapElement);
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

    attachEvents();

    firstRender = false;
  }

  function attachEvents() {

    map.on('mouseout', hideFlyout);
    map.on('dragend zoomend', emitMapCenterAndZoomChange);
  }

  function detachEvents() {

    map.off('mouseout', hideFlyout);
    map.off('dragend zoomend', emitMapCenterAndZoomChange);
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
    const feature = event.target.feature;
    const shapefilePrimaryKey = _.get(
      self.getVif(),
      'configuration.shapefile.primaryKey',
      null
    );

    utils.assert(
      shapefilePrimaryKey !== null,
      'Vif does not contain a valid shapefile primary key'
    );

    if (feature.properties.hasOwnProperty(shapefilePrimaryKey)) {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED',
        feature.properties[shapefilePrimaryKey]
      );
    }
  }

  function showFlyout(event) {
    const feature = event.target.feature;
    const payload = {
      element: event.target,
      clientX: event.originalEvent.clientX,
      clientY: event.originalEvent.clientY,
      title: _.get(
        feature,
        `properties.${SvgRegionMap.SHAPEFILE_REGION_HUMAN_READABLE_NAME}`
      ),
      valueLabel: _.get(
        self.getVif(),
        'series[0].label',
        I18n.t('shared.visualizations.charts.common.flyout_value_label')
      ),
      // value will be overridden below if there is one.
      value: I18n.t('shared.visualizations.charts.common.no_value'),
      selectedNotice: I18n.t(
        'shared.visualizations.charts.region_map.flyout_selected_notice'
      ),
      selected: feature.properties[SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED]
    };
    const value = feature.properties[SvgRegionMap.SHAPEFILE_REGION_VALUE];
    const valueUnit = value === 1 ?
      self.getUnitOneBySeriesIndex(0) :
      self.getUnitOtherBySeriesIndex(0);

    if (_.isNumber(value)) {
      payload.value = `${utils.formatNumber(value)} ${valueUnit}`;
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT',
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

    utils.assertIsOneOfTypes(lat, 'number');
    utils.assert(lat >= -90, `Latitude is out of bounds (${lat} < -90)`);
    utils.assert(lat <= 90, `Latitude is out of bounds (${lat} > 90)`);

    utils.assertIsOneOfTypes(lng, 'number');
    utils.assert(lng >= -180, `Longitude is out of bounds (${lng} < -180)`);
    utils.assert(lng <= 180, `Longitude is out of bounds (${lng} > 180)`);

    utils.assertIsOneOfTypes(zoom, 'number');
    utils.assert(zoom >= 0, `Zoom is out of bounds (${zoom} < 0)`);
    utils.assert(zoom < 19, `Zoom is out of bounds (${zoom} > 18)`);

    const centerAndZoom = {
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
    // After we run buildPositionArray the min and max values will cross over
    // since they will be pushed or pulled toward the actual minimum and maximum
    // values in the data by the side-effecty function buildPositionArray.
    let minLng = 180;
    let maxLng = -180;
    let minLat = 90;
    let maxLat = -90;

    function buildPositionArray(positions) {
      const cleanPositions = positions.filter((position) => {
        return _.every(position, _.isNumber);
      });
      // IMPORTANT NOTE: in geojson, positions are denoted as pairs of the
      // following format: [longitude, latitude].
      //
      // The following code will extract all of the 0th index values into the
      // lngs variable, and all of the 1st index values into the lats variable.
      const [lngs, lats] = _.zip.apply(null, cleanPositions);

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
        const coordinates = feature.geometry.coordinates;

        switch (feature.geometry.type) {

          // Polygon or MultiLineString coordinates
          // = arrays of position arrays
          case 'Polygon':
          case 'MultiLineString':
            _.each(coordinates, buildPositionArray);
            break;

          // MultiPolygon coordinates = an array of Polygon coordinate arrays
          case 'MultiPolygon':
            _.each(
              coordinates,
              (polygonCoordinates) => {
                _.each(polygonCoordinates, buildPositionArray);
              }
            );
            break;

          // LineString coordinates = position array
          case 'LineString':
            buildPositionArray(coordinates);
            break;
        }
      });
    }

    const boundsArray = [
      [maxLat, maxLng],
      [minLat, minLng]
    ];

    const computedBounds = L.latLngBounds([
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
    const featureOptions = {
      onEachFeature: (feature, layer) => {

        layer.on({
          mouseover: handleFeatureMouseover,
          mouseout: handleFeatureMouseout,
          mousemove: showFlyout,
          click: handleFeatureSelected
        });
      },
      style: getStyleFn(colorScale)
    };

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

  function getStyleFn(currentColorScale) {

    /* eslint-disable no-unused-vars */
    function getFillColor(feature, selected) {
    /* eslint-enable no-unused-vars */
      const value = _.get(
        feature,
        `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`
      );

      if (_.isFinite(value)) {

        if (currentColorScale) {
          return String(currentColorScale(value));
        } else {
          return 'transparent';
        }
      } else {
        return FEATURE_DEFAULT_NULL_COLOR;
      }
    }

    function getStrokeColor(feature, selected) {
      const value = _.get(
        feature,
        `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`
      );

      if (!_.has(feature, 'geometry.type')) {

        throw new Error(
          'Cannot calculate stroke color for undefined feature geometry type.'
        );
      }

      if (
        !_.includes(['LineString', 'MultiLineString'], feature.geometry.type)
      ) {

        return selected ?
          FEATURE_DEFAULT_SELECTED_COLOR :
          FEATURE_DEFAULT_STROKE_COLOR;
      }

      if (!_.isFinite(value)) {
        return FEATURE_DEFAULT_NULL_COLOR;
      }

      if (selected) {
        return FEATURE_DEFAULT_SELECTED_COLOR;
      } else if (currentColorScale) {
        return getFillColor(feature, false);
      } else {
        return FEATURE_DEFAULT_STROKE_COLOR;
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
      const opacity = currentColorScale ? 0.8 : 1;

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

  function updateColorScale(dataToRender) {
    const negativeColor = _.get(
      self.getVif(),
      'configuration.legend.negativeColor',
      LEGEND_DEFAULT_NEGATIVE_COLOR
    );
    const zeroColor = _.get(
      self.getVif(),
      'configuration.legend.zeroColor',
      LEGEND_DEFAULT_ZERO_COLOR
    );
    const positiveColor = _.get(
      self.getVif(),
      'configuration.legend.positiveColor',
      LEGEND_DEFAULT_POSITIVE_COLOR
    );
    const values = dataToRender.features.map((feature) => {

      return _.get(
        feature,
        `properties.${SvgRegionMap.SHAPEFILE_REGION_VALUE}`
      );
    });
    const minValue = d3.min(values);
    const maxValue = d3.max(values);
    const useLogScale = _.get(
      self.getVif(),
      'configuration.useLogScale',
      false
    );

    // EN-10812 - Do not display legend if region map has no values
    //
    // If either the min or the max value is not finite (e.g. if the data
    // consists of nothing but null values) then we can't derive a scale. Note
    // that we need to set colorScale to null explicitly, in case it was
    // previously possible to render a legend but it no longer is, as
    // colorScale would be a valid color scale, but it would not reflect the
    // data we are currently attempting to render. Also note that the behavior
    // specified in this ticket will be a consequence of colorScale being
    // falsey, as the renderLegend function will clear the previous legend and
    // then return early if this is the case.
    if (!_.isFinite(minValue) || !_.isFinite(maxValue)) {

      colorScale = null;
      return;
    }

    let domain;
    let range;
    let scale = d3.scale.linear();

    isLogScale = false;

    if (minValue >= 0) {
      domain = [0, maxValue];
      range = [zeroColor, positiveColor];
    } else if (maxValue <= 0) {
      domain = [minValue, 0];
      range = [negativeColor, zeroColor];
    } else {
      domain = [minValue, 0, maxValue];
      range = [negativeColor, zeroColor, positiveColor];
    }

    if (useLogScale) {

      if (minValue > 0) {

        isLogScale = true;
        scale = d3.scale.log();
        domain = [minValue, maxValue];
      } else {

        const logScaleNotPossibleError = new Error();
        logScaleNotPossibleError.errorMessages = [
          I18n.t(
            'shared.visualizations.charts.region_map.error_logarithm_unavailable'
          )
        ];

        throw logScaleNotPossibleError;
      }
    }

    colorScale = scale.
      domain(domain).
      range(range);

    // We need to call reverse here since we're expecting higher values to be
    // drawn at the 'beginning' of the scale and lower values at the 'end', and
    // it's less confusing (IMO) to set up an orderly domain (min -> max) and
    // then reverse it than it is to modify the min/max domain logic above to be
    // the reverse of what is traditional.
    colorScale.domain().reverse();
  }

  function renderLegend() {

    // Do this before returning early because there are cases where we want to
    // clear the previous legend and not render a new one (e.g. if the vif
    // changes and the previously-rendered legend is no longer valid but a new
    // legend cannot be drawn because all the new values are null.
    self.$element.find('.region-map-legend').empty();

    // If the color scale hasn't been defined, we cannot render the legend. This
    // can happen when the dimensions of a region map change before the data/
    // shapefile queries return, in which case the visualization has been
    // initialized but we do not yet have the necessary information to calculate
    // the data's domain and range.
    if (!colorScale) {
      return;
    }

    const legendHeight = Math.min(
      self.$element.height() - LEGEND_TOP_MARGIN,
      LEGEND_DEFAULT_HEIGHT
    );
    const legendGradientHeight = legendHeight -
      LEGEND_GRADIENT_PADDING.TOP -
      LEGEND_GRADIENT_PADDING.BOTTOM;
    const colorScaleDomain = colorScale.domain();
    const d3YScale = ((isLogScale) ? d3.scale.log() : d3.scale.linear()).
      domain([_.last(colorScaleDomain), _.first(colorScaleDomain)]).
      range([legendGradientHeight, 0]).
      nice();
    const tickFormatter = (isLogScale) ?
      function(d) {
        const logThreshold = Math.log(d) / Math.log(10) + 1e-6;

        return (Math.abs(logThreshold - Math.floor(logThreshold)) < 0.1) ?
          utils.formatNumber(d) :
          '';
      } :
      function(d) {
        return utils.formatNumber(d);
      };
    const tickStrokeFormatter = (isLogScale) ?
      (d) => {
        const logThreshold = Math.log(d) / Math.log(10) + 1e-6;

        return (Math.abs(logThreshold - Math.floor(logThreshold)) < 0.1) ?
          LEGEND_GRADIENT_TICK_COLOR :
          'none';
      } :
      () => LEGEND_GRADIENT_TICK_COLOR;
    const d3YAxis = d3.svg.axis().
      scale(d3YScale).
      orient('right').
      ticks(5).
      tickFormat(tickFormatter);
    const legendSvg = d3.select(self.$element[0]).select('.region-map-legend').
      append('svg');
    const legendGradientDefs = legendSvg.append('defs');
    const legendGradientId = `region-map-gradient-${_.uniqueId()}`;
    const legendGradient = legendGradientDefs.append('svg:linearGradient').
      attr('id', legendGradientId).
      attr('x1', '100%').
      attr('y1', '0%').
      attr('x2', '100%').
      attr('y2', '100%').
      attr('spreadMethod', 'pad');
    const legendTicks = legendSvg.append('g').
      attr('class', 'region-map-legend-ticks').
      attr('transform', `translate(${LEGEND_GRADIENT_WIDTH},10)`).
      call(d3YAxis);

    legendSvg.attr('height', legendHeight);

    if (colorScaleDomain.length > 1) {

      colorScaleDomain.forEach((stop, i) => {

        legendGradient.append('stop').
          attr('offset', `${100 * (i / (colorScaleDomain.length - 1))}%`).
          attr('stop-color', colorScale(stop)).
          attr('stop-opacity', 1);
      });
    }

    legendSvg.append('rect').
      attr('width', LEGEND_GRADIENT_WIDTH).
      attr('height', legendGradientHeight).
      attr(
        'transform',
        `translate(0,${LEGEND_GRADIENT_PADDING.TOP})`
      ).
      style('fill', `url(#${legendGradientId})`);

    legendTicks.select('.domain').
      attr('stroke', 'none').
      attr('fill', 'none');

    legendTicks.selectAll('line').
      attr('stroke', tickStrokeFormatter).
      attr('stroke-width', 1).
      attr('fill', 'none');

    legendSvg.attr(
      'width',
      LEGEND_GRADIENT_WIDTH + legendTicks.node().getBBox().width
    );

    self.$element.find('.region-map-legend').
      css('visibility', 'visible');
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
}

module.exports = SvgRegionMap;
