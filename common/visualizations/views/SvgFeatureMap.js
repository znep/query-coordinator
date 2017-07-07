const utils = require('common/js_utils');
const L = require('leaflet');
const _ = require('lodash');
const $ = require('jquery');
const SvgVisualization = require('./SvgVisualization');
const SoqlHelpers = require('../dataProviders/SoqlHelpers');
const I18n = require('common/i18n').default;

// Side effect: Load VectorTileManager into Leaflet.
require('../dataProviders/VectorTileManager');

const FEATURE_MAP_MIN_HOVER_THRESHOLD = 5;
const FEATURE_MAP_MAX_ZOOM = 18; // same as Leaflet default
const FEATURE_MAP_MAX_TILE_DENSITY = 256 * 256;
const FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD = 6;
const FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL = 200;
const FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL = 250;
const FEATURE_MAP_FLYOUT_Y_OFFSET = 1.25;
const FEATURE_MAP_ROW_INSPECTOR_QUERY_BOX_PADDING = 1;
const FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY = 100;
const FEATURE_MAP_DEFAULT_INTERACTIVE = true;
const FEATURE_MAP_DEFAULT_PAN_AND_ZOOM = true;
const FEATURE_MAP_DEFAULT_LOCATE_USER = false;
const FEATURE_MAP_MIN_POINT_SIZE_MULTIPLIER = 1;
const FEATURE_MAP_MAX_POINT_SIZE_MULTIPLIER = 3.2;

function SvgFeatureMap(element, vif, options) {
  _.extend(this, new SvgVisualization(element, vif, options));

  var self = this;

  var mapContainer;
  var mapElement;
  var mapPanZoomDisabledWarning;
  var mapLocateUserButton;
  // This is the element that will be displayed as a marker.
  var userCurrentPositionIcon;
  // This is the actual marker as it exists on the map. We keep this
  // reference so that we can remove the existing marker if the user
  // clicks the 'locate me' button more than one time.
  var userCurrentPositionMarker;
  var userCurrentPositionBounds;

  var defaultMapOptions = {
    attributionControl: false,
    center: [47.609895, -122.330259], // Center on Seattle by default.
    keyboard: false,
    scrollWheelZoom: false,
    zoom: 1,
    zoomControlPosition: 'topleft',
    maxZoom: FEATURE_MAP_MAX_ZOOM
  };

  var mapOptions;
  var maxTileDensity;
  var maxRowInspectorDensity;
  var debug;
  var interactive;
  var panAndZoom;
  var locateUser;
  var startResizeFn;
  var completeResizeFn;
  var baseTileLayer;
  var map;
  var lastRenderedVif;
  var lastRenderedData;

  // We buffer feature layers so that there isn't a visible flash
  // of emptiness when we transition from one to the next. This is accomplished
  // by only removing the previous layers when the current one completes rendering.

  // We also keep a handle on the current feature layer Url so we know which of
  // the existing layers we can safely remove (i.e. not the current one).
  var featureLayers = {};
  var flyoutData = {};
  var currentLayerId;

  maxTileDensity = vif.configuration.maxTileDensity || FEATURE_MAP_MAX_TILE_DENSITY;
  maxRowInspectorDensity = vif.configuration.maxRowInspectorDensity || FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY;
  debug = vif.configuration.debug;
  interactive = (_.isUndefined(vif.configuration.interactive)) ? FEATURE_MAP_DEFAULT_INTERACTIVE : vif.configuration.interactive;
  panAndZoom = (_.isUndefined(vif.configuration.panAndZoom)) ? FEATURE_MAP_DEFAULT_PAN_AND_ZOOM : vif.configuration.panAndZoom;
  locateUser = !(vif.configuration.locateUser && ('geolocation' in navigator)) ? FEATURE_MAP_DEFAULT_LOCATE_USER : vif.configuration.locateUser;
  mapOptions = _.merge(defaultMapOptions, vif.configuration.mapOptions);

  // Render template here so that we can modify the map container's styles
  // below.
  renderTemplate();

  // CORE-4832: Disable pan and zoom on feature map
  if (!panAndZoom) {
    mapOptions = _.merge(
      mapOptions,
      {
        dragging: false,
        zoomControl: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
      }
    );

    mapContainer.css('cursor', 'default');
    mapPanZoomDisabledWarning.show();
  }

  /**
   * Public methods
   */

  this.render = function(newVif, newData, newColumns) {
    var hasMapDimensions = mapElement.width() > 0 && mapElement.height() > 0;
    var extent = newData.extent;
    var vectorTileGetter = newData.vectorTileGetter;

    if (!hasMapDimensions) {
      return;
    }

    emitRenderStart();
    self.showBusyIndicator();

    if (!map) {

      // Construct leaflet map
      map = L.map(mapElement[0], mapOptions);

      // Attach events on first render only
      attachEvents();

      // updating center and zoom must happen before we render the feature layer, or we will end up
      // requesting (and rendering) the points for the previous zoom level.
      updateCenterAndZoom(newVif);
      updateBaseLayer(newVif);
      updateFeatureLayer(newVif, vectorTileGetter);

      if (extent) {
        fitBounds(buildBoundsFromExtent(extent));
      }
    } else if (newVif && !_.isEqual(newVif, lastRenderedVif)) {
      this.updateVif(newVif);

      // updating center and zoom must happen before we render the feature layer, or we will end up
      // requesting (and rendering) the points for the previous zoom level.
      updateCenterAndZoom(newVif);
      updateBaseLayer(newVif);
      updateFeatureLayer(newVif, vectorTileGetter);
    } else {
      // If nothing to render again call completion asynchronously
      _.defer(handleVectorTileRenderComplete);
    }

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    lastRenderedVif = newVif || lastRenderedVif || vif;
    lastRenderedData = newData;
  };

  this.invalidateSize = function() {
    if (map) {
      map.invalidateSize();
    }
  };

  this.destroy = function() {
    if (map) {
      detachEvents();

      // Remove the map after detaching events since `detachEvents()` expects
      // the `map` instance to exist.
      map.remove();
    }

    // Finally, clear out the container.
    self.$element.empty();
  };

  /**
   * Private methods
   */

  function didBaseLayerChange(newVif) {
    var baseLayerPath = 'configuration.baseLayerUrl';
    var newBaseLayerUri = _.get(newVif, baseLayerPath);
    var lastRenderedBaseLayerUri = _.get(lastRenderedVif, baseLayerPath);

    var baseLayerOpacityPath = 'configuration.baseLayerOpacity';
    var newBaseLayerOpacity = _.get(newVif, baseLayerOpacityPath);
    var lastRenderedBaseLayerOpacity = _.get(lastRenderedVif, baseLayerOpacityPath);

    return newBaseLayerUri !== lastRenderedBaseLayerUri || newBaseLayerOpacity !== lastRenderedBaseLayerOpacity;
  }

  function renderTemplate() {
    var $mapElement = $('<div>', { 'class': 'feature-map' });
    var $mapLegend = $('<div>', { 'class': 'feature-map-legend' });
    var $mapPanZoomDisabledWarningIcon = $('<div>', { 'class': 'icon-warning feature-map-pan-zoom-disabled-warning-icon' });

    var $mapPanZoomDisabledWarning = $('<div>', { 'class': 'feature-map-pan-zoom-disabled-warning' }).
      append($mapPanZoomDisabledWarningIcon);

    var $mapContainer = $('<div>', { 'class': 'feature-map-container' }).
      append([
        $mapElement,
        $mapLegend,
        $mapPanZoomDisabledWarning
      ]);

    if (locateUser) {
      var $mapLocateUserIcon = $(
        '<svg class="feature-map-locate-user-icon" viewBox="-289 381 32 32">' +
        '<polygon class="st0" points="-262.5,386.5 -285.5,398 -274,398 -274,409.5 "/>' +
        '</svg>'
      );

      var $mapLocateUserBusySpinner = $(
        '<div>',
        {
          'class': 'feature-map-locate-user-busy-spinner'
        }
      );

      var $mapLocateUserErrorIcon = $(
        '<svg class="feature-map-locate-user-error-icon" viewBox="0 0 1024 1024">' +
        '<path fill="rgb(68, 68, 68)" d="M978.77 846.495c16.932 33.178 15.816 64.164-3.348 95.176-19.907 31.693-48.312 46.49-85.212 46.49h-756.762c-36.869 0-65.275-14.802-85.181-46.49-18.417-30.264-19.907-61.788-4.434-95.713l378.399-756.495c19.164-36.869 49.055-55.183 89.615-55.183 41.303 0 70.825 18.519 88.561 55.388l378.363 756.828zM455.409 867.517c15.503 15.442 34.324 23.194 56.438 23.194 22.139 0 40.929-7.752 56.438-23.194 15.442-15.503 23.194-34.294 23.194-56.438s-7.752-40.929-23.194-56.438c-15.503-15.503-34.294-23.255-56.438-23.255-22.108 0-40.929 7.752-56.438 23.255-15.473 15.503-23.224 34.294-23.224 56.438s7.752 40.934 23.224 56.438zM450.56 291.84v337.92h122.88v-337.92h-122.88z"/>' +
        '</svg>'
      );

      var $mapLocateUserButton = $('<button>', {
        'class': 'feature-map-locate-user-btn',
        'data-locate-user-status': 'ready'
      }).append([
        $mapLocateUserIcon,
        $mapLocateUserBusySpinner,
        $mapLocateUserErrorIcon
      ]);

      $mapContainer.append($mapLocateUserButton);

      userCurrentPositionIcon = L.divIcon({ className: 'feature-map-user-current-position-icon' });
    }

    // Cache element selections
    mapContainer = $mapContainer;
    mapElement = $mapElement;
    mapPanZoomDisabledWarning = $mapPanZoomDisabledWarning;
    mapLocateUserButton = $mapLocateUserButton;

    self.$element.find('.socrata-visualization-container').append(mapContainer);
  }

  function attachEvents() {
    var $document = $(document);

    // Only attach map events if the map has actually been instantiated.
    if (map) {
      // Map resizes are messy because our map containers are animated. This
      // causes Leaflet to believe that we are resizing the map n times when
      // we are really just doing it once but lerping between the container
      // sizes. To work around this we can debounce the event twice--once on
      // the leading edge and once on the trailing edge--to simulate 'start'
      // and 'stop' events for the resize.
      startResizeFn = _.debounce(
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

      completeResizeFn = _.debounce(
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

      map.on('resize', handleMapResize);
      map.on('dragend zoomend', emitMapCenterAndZoomChange);
      map.on('dragstart zoomstart', handlePanAndZoom);
      map.on('mouseout', hideFlyout);

      // react to the interactions that would close the RowInspector flannel
      if (interactive) {
        $document.on('click', captureLeftClickAndClearHighlight);
        $document.on('keydown', captureEscapeAndClearHighlight);
      }

      mapPanZoomDisabledWarning.on('mousemove', handlePanZoomDisabledWarningMousemove);
      mapPanZoomDisabledWarning.on('mouseout', handlePanZoomDisabledWarningMouseout);

      // While this element does not rely on the map existing, it cannot
      // have any purpose if the map does not exist so we include it in
      // the check for map existence anyway.
      if (locateUser) {
        mapLocateUserButton.on('click', handleLocateUserButtonClick);

        if (!self.isMobile()) {
          mapLocateUserButton.on('mousemove', handleLocateUserButtonMousemove);
          mapLocateUserButton.on('mouseout', hideFlyout);
        }
      }
    }

    $(window).on('resize', hideRowInspector);
  }

  function detachEvents() {
    var $document = $(document);

    // Only detach map events if the map has actually been instantiated.
    if (map) {

      map.off('resize', handleMapResize);
      map.off('dragend zoomend', emitMapCenterAndZoomChange);
      map.off('dragstart zoomstart', handlePanAndZoom);
      map.off('mouseout', hideFlyout);

      if (interactive) {
        $document.on('click', captureLeftClickAndClearHighlight);
        $document.on('keydown', captureEscapeAndClearHighlight);
      }

      mapPanZoomDisabledWarning.off('mousemove', handlePanZoomDisabledWarningMousemove);
      mapPanZoomDisabledWarning.off('mouseout', handlePanZoomDisabledWarningMouseout);

      // While this element does not rely on the map existing, it cannot
      // have any purpose if the map does not exist so we include it in
      // the check for map existence anyway.
      if (locateUser) {
        mapLocateUserButton.off('click', handleLocateUserButtonClick);
        mapLocateUserButton.off('mousemove', handleLocateUserButtonMousemove);
        mapLocateUserButton.off('mouseout', hideFlyout);
      }
    }

    $(window).off('resize', hideRowInspector);
  }

  function emitRenderStart() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START',
      null
    );
  }

  function emitRenderComplete() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE',
      null
    );
  }

  function handleMapResize() {
    // This is debounced and will fire on the leading edge.
    startResizeFn();
    // This is debounced and will fire on the trailing edge.
    // In the best case, this will be called RESIZE_DEBOUNCE_INTERVAL
    // milliseconds after the resize event is captured by this handler.
    completeResizeFn();
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
      'SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE',
      centerAndZoom
    );
  }

  function handlePanAndZoom() {
    hideFlyout();
    hideRowInspector();
  }

  function handlePanZoomDisabledWarningMousemove() {
    showPanZoomDisabledWarningFlyout();
  }

  function handlePanZoomDisabledWarningMouseout() {
    hideFlyout();
  }

  function handleLocateUserButtonClick() {
    updateLocateUserButtonStatus('busy');

    if (!self.isMobile()) {
      showLocateUserButtonFlyout();
    }

    navigator.geolocation.getCurrentPosition(
      handleLocateUserSuccess,
      handleLocateUserError
    );
  }

  function handleLocateUserSuccess(position) {
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
    var featureBounds = buildBoundsFromExtent(lastRenderedData.extent);
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

      userCurrentPositionBounds = featureBounds;

    // Otherwise, figure out which edge to extend and update the bounds.
    } else {

      distanceFromBoundsSouthWest = userLatLng.distanceTo(featureBounds.getSouthWest());
      distanceFromBoundsNorthEast = userLatLng.distanceTo(featureBounds.getNorthEast());

      if (distanceFromBoundsSouthWest <= distanceFromBoundsNorthEast) {

        userCurrentPositionBounds = L.latLngBounds(userLatLng, featureBounds.getNorthEast());

      } else {

        userCurrentPositionBounds = L.latLngBounds(featureBounds.getSouthWest(), userLatLng);

      }
    }

    if (!userCurrentPositionMarker) {

      userCurrentPositionMarker = L.marker(
        userLatLng,
        {
          icon: userCurrentPositionIcon,
          clickable: false,
          title: I18n.t('shared.visualizations.charts.common.map_user_current_position'),
          alt: I18n.t('shared.visualizations.charts.common.map_user_current_position')
        }
      );

      userCurrentPositionMarker.addTo(map);

    } else {

      userCurrentPositionMarker.update(userLatLng);

    }

    map.fitBounds(
      userCurrentPositionBounds,
      {
        animate: true
      }
    );

    updateLocateUserButtonStatus('ready');
  }

  function handleLocateUserError() {
    updateLocateUserButtonStatus('error');

    if (!self.isMobile()) {
      showLocateUserButtonFlyout();
    }
  }

  function updateLocateUserButtonStatus(status) {
    utils.assert(
      status === 'ready' ||
      status === 'busy' ||
      status === 'error',
      'Unrecognized locate user button status: {0}'.format(status)
    );

    switch (status) {

      case 'ready':
        mapLocateUserButton.attr('data-locate-user-status', 'ready');
        break;

      case 'busy':
        mapLocateUserButton.attr('data-locate-user-status', 'busy');
        break;

      case 'error':
        mapLocateUserButton.attr('data-locate-user-status', 'error');
        break;

      default:
        break;
    }
  }

  function handleLocateUserButtonMousemove() {
    showLocateUserButtonFlyout();
  }

  function sumPointsByCount(points) {
    return _.chain(points).
      map('count').
      map(_.toNumber).
      sum().
      value();
  }

  function handleVectorTileMousemove(event) {
    if (event.hasOwnProperty('tile')) {

      // Set flyout data and force a refresh of the flyout
      flyoutData.offset = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
      };
      flyoutData.count = sumPointsByCount(event.points);
      flyoutData.totalPoints = event.tile.totalPoints;

      if (flyoutData.count > 0) {
        event.originalEvent.target.style.cursor = 'pointer';
        showFeatureFlyout(event);
      } else {
        event.originalEvent.target.style.cursor = 'inherit';
        hideFlyout();
      }
    }
  }

  function handleVectorTileClick(event) {
    if (self.isMobile()) {
      flyoutData.offset = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
      };

      flyoutData.count = sumPointsByCount(event.points);
    }

    var inspectorDataQueryConfig;
    var position = { pageX: event.originalEvent.pageX, pageY: event.originalEvent.pageY };

    if (flyoutData.count > 0 &&
      flyoutData.count <= maxRowInspectorDensity) {

      inspectorDataQueryConfig = {
        latLng: event.latlng,
        position: position,
        rowCount: sumPointsByCount(event.points),
        queryBounds: getQueryBounds(event.containerPoint)
      };

      showRowInspector(inspectorDataQueryConfig);
    }
  }

  function handleVectorTileRenderStart() {
    hideFlyout();
    hideRowInspector();
  }

  function handleVectorTileRenderComplete() {
    removeOldFeatureLayers();

    if (interactive && map) {
      map.fire('clearhighlightrequest');
    }

    // Emit render complete event
    emitRenderComplete();
    self.hideBusyIndicator();
  }

  function showFeatureFlyout(event) {
    var payload;
    var manyRows = flyoutData.count > maxRowInspectorDensity;
    var denseData = flyoutData.totalPoints >= maxTileDensity;
    var unitOne = self.getUnitOneBySeriesIndex(0);
    var unitOther = self.getUnitOtherBySeriesIndex(0);
    var rowCountUnit = flyoutData.count === 1 ? unitOne : unitOther;

    payload = {
      title: '{0} {1}'.format(
        flyoutData.count,
        rowCountUnit
      ),
      notice: I18n.t(
        'shared.visualizations.charts.feature_map.flyout_click_to_inspect_notice'
      ),
      flyoutOffset: {
        left: event.originalEvent.clientX,
        top: event.originalEvent.clientY
      }
    };

    if (manyRows || denseData) {

      if (map.getZoom() === FEATURE_MAP_MAX_ZOOM) {
        payload.notice = I18n.t(
          'shared.visualizations.charts.feature_map.flyout_filter_notice'
        );
      } else {
        payload.notice = I18n.t(
          'shared.visualizations.charts.feature_map.flyout_filter_or_zoom_notice'
        );
      }

      // If the tile we are hovering over has more points then the
      // TileServer limit or the selected points contain more than the
      // max number of rows to be displayed on a flannel,
      // prompt the user to filter and/or zoom in for accurate data.
      if (denseData) {
        payload.title = '{0} {1}'.format(
          I18n.t(
            'shared.visualizations.charts.feature_map.flyout_dense_data_notice'
          ),
          unitOther
        );
      }
    }

    if (
      !self.isMobile() ||
      (self.isMobile() && (manyRows || denseData))
    ) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
        payload
      );
    }
  }

  function showPanZoomDisabledWarningFlyout() {
    var payload = {
      element: mapPanZoomDisabledWarning[0],
      title: I18n.t(
        'shared.visualizations.charts.common.map_pan_zoom_disabled_warning_title'
      )
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
      payload
    );
  }

  function showLocateUserButtonFlyout() {
    var locateUserStatus = mapLocateUserButton.attr('data-locate-user-status');
    var payload;

    if (locateUserStatus === 'ready') {

      payload = {
        element: mapLocateUserButton[0],
        title: I18n.t(
          'shared.visualizations.charts.common.map_click_to_locate_user_title'
        ),
        notice: I18n.t(
          'shared.visualizations.charts.common.map_click_to_locate_user_notice'
        )
      };

    } else if (locateUserStatus === 'busy') {

      payload = {
        element: mapLocateUserButton[0],
        title: I18n.t(
          'shared.visualizations.charts.common.map_locating_user_title'
        ),
        notice: null
      };

    } else {

      payload = {
        element: mapLocateUserButton[0],
        title: I18n.t(
          'shared.visualizations.charts.common.map_locate_user_error_title'
        ),
        notice: I18n.t(
          'shared.visualizations.charts.common.map_locate_user_error_notice'
        )
      };

    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
      payload
    );
  }

  function hideFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_FLYOUT_HIDE',
      null
    );
  }

  function showRowInspector(inspectorDataQueryConfig) {
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

  function hideRowInspector() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE'
    );

    map.fire('clearhighlightrequest');
  }

  function captureEscapeAndClearHighlight(event) {
    if (event.which === 27) {
      map.fire('clearhighlightrequest');
    }
  }

  function captureLeftClickAndClearHighlight(event) {
    var $target = $(event.target);
    var isLeftClick = event.which === 1;
    var isOutsideOfCurrentMap = $target.closest('.feature-map-container')[0] !== mapContainer[0];
    var isIconClose = $target.is('.icon-close');
    var isRowInspector = $target.parents('#socrata-row-inspector').length > 0 && !isIconClose;

    if (isLeftClick && (isOutsideOfCurrentMap || isIconClose) && !isRowInspector) {
      map.fire('clearhighlightrequest');
    }
  }

  /**
   * Map behavior
   */

  function buildBoundsFromExtent(extent) {
    var southWest = L.latLng(extent.southwest[0], extent.southwest[1]);
    var northEast = L.latLng(extent.northeast[0], extent.northeast[1]);

    return L.latLngBounds(southWest, northEast);
  }

  function updateBaseLayer(newVif) {

    if (didBaseLayerChange(newVif)) {

      if (baseTileLayer) {
        map.removeLayer(baseTileLayer);
      }

      baseTileLayer = L.tileLayer(
        _.get(newVif, 'configuration.baseLayerUrl'),
        {
          attribution: '',
          detectRetina: false,
          opacity: _.get(newVif, 'configuration.baseLayerOpacity'),
          unloadInvisibleTiles: true,
          zIndex: 0
        }
      );

      map.addLayer(baseTileLayer);
    }
  }

  /**
   * Reads center and zoom overrides from the vif and updates the map to render
   * with those parameters.
   */
  function updateCenterAndZoom(newVif) {
    var newCenter = _.get(newVif, 'configuration.mapCenterAndZoom.center');
    var lastRenderedCenter = _.get(lastRenderedVif, 'configuration.mapCenterAndZoom.center');

    var newZoom = _.get(newVif, 'configuration.mapCenterAndZoom.zoom');
    var lastRenderedZoom = _.get(lastRenderedVif, 'configuration.mapCenterAndZoom.zoom');

    var centerAndZoomDefined = _.chain(newVif).at(
      'configuration.mapCenterAndZoom.center.lat',
      'configuration.mapCenterAndZoom.center.lng',
      'configuration.mapCenterAndZoom.zoom'
    ).every(_.isNumber);

    if (userCurrentPositionBounds) {
      fitBounds(userCurrentPositionBounds);
    } else if (centerAndZoomDefined && !_.isEqual(newCenter, lastRenderedCenter) || newZoom !== lastRenderedZoom) {
      map.setView(newCenter, newZoom, {animate: false});
    }
  }

  /**
   * Derives a bounding box that contains each element in a set of points
   * and then causes the map to fit that bounding box within its viewport.
   *
   * @param bounds - The Leaflet LatLngBounds object that represents the
   *   extents of the column's features.
   */
  function fitBounds(bounds) {

    // It is critical to invalidate size prior to updating bounds.
    // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
    // This manifests itself as the map being zoomed all of the way out.
    map.invalidateSize();

    map.fitBounds(
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
   * We update when:
   * - the dataset uid changed.
   * - a new list of tileserver hosts.
   * - filtering in the VIF has changed.
   *
   * @param {Object} newVif - The most current VIF
   * @param {Function} vectorTileGetter - Function that gets a vector tile
   */
  function updateFeatureLayer(newVif, vectorTileGetter) {
    var datasetUidPath = 'series[0].dataSource.datasetUid';
    var datasetUidChanged = !_.isEqual(
      _.get(newVif, datasetUidPath),
      _.get(lastRenderedVif, datasetUidPath)
    );

    var newWhereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0);
    var lastRenderedWhereClause = (lastRenderedVif) ?
      SoqlHelpers.whereClauseNotFilteringOwnColumn(lastRenderedVif, 0) :
      '';
    var whereClauseChanged = newWhereClause !== lastRenderedWhereClause;

    var pointColorPath = 'series[0].color.primary';
    var pointColorChanged = !_.isEqual(
      _.get(newVif, pointColorPath),
      _.get(lastRenderedVif, pointColorPath)
    );

    var pointOpacityPath = 'configuration.pointOpacity';
    var pointOpacityChanged = !_.isEqual(
      _.get(newVif, pointOpacityPath),
      _.get(lastRenderedVif, pointOpacityPath)
    );

    const pointSizePath = 'configuration.pointSize';
    const pointSizeChanged = !_.isEqual(
      _.get(newVif, pointSizePath),
      _.get(lastRenderedVif, pointSizePath)
    );

    if (datasetUidChanged || whereClauseChanged || pointColorChanged || pointOpacityChanged || pointSizeChanged) {
      var layer;
      var layerId = _.uniqueId();
      var featureLayerOptions = {
        // Data requests
        vectorTileGetter: vectorTileGetter,
        // Behavior
        debug: debug,
        hover: interactive,
        debounceMilliseconds: FEATURE_MAP_ZOOM_DEBOUNCE_INTERVAL,
        rowInspectorMaxRowDensity: maxRowInspectorDensity,
        maxZoom: FEATURE_MAP_MAX_ZOOM,
        maxTileDensity: maxTileDensity,
        tileOverlapZoomThreshold: FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD,
        // Helper functions
        getFeatureId: getFeatureId,
        getFeatureStyle: getFeatureStyle,
        getHoverThreshold: getHoverThreshold,
        // Event handlers
        onRenderStart: handleVectorTileRenderStart,
        onRenderComplete: handleVectorTileRenderComplete,
        onMousemove: handleVectorTileMousemove,
        onClick: handleVectorTileClick,
        onTap: self.isMobile() ? handleVectorTileMousemove : null
      };

      // Don't create duplicate layers.
      if (!featureLayers.hasOwnProperty(layerId)) {
        layer = new L.TileLayer.VectorTileManager(featureLayerOptions);

        map.addLayer(layer);

        featureLayers[layerId] = layer;
        currentLayerId = layerId;
      }
    } else {
      // If nothing to render again call completion asynchronously
      _.defer(handleVectorTileRenderComplete);
    }
  }

  /**
   * Removes existing but out of date feature layers from the map.
   * This is used in conjunction with `_createNewFeatureLayer()`.
   */
  function removeOldFeatureLayers() {
    Object.keys(featureLayers).forEach(function(layerId) {
      if (layerId !== currentLayerId) {
        map.removeLayer(featureLayers[layerId]);
        delete featureLayers[layerId];
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
  function getQueryBounds(leafletContainerPoint) {
    var hoverThreshold = getHoverThreshold(map.getZoom());
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
      northeast: map.containerPointToLatLng(northeastContainerPoint),
      southwest: map.containerPointToLatLng(southwestContainerPoint)
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
  function getFeatureId(feature, index) {
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
  function getHoverThreshold(zoomLevel) {
    return Math.max(
      scalePointFeatureRadiusByZoomLevel(zoomLevel),
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
  function scalePointFeatureRadiusByZoomLevel(zoomLevel) {
    const pointSizeMultiplier = _.get(lastRenderedVif, 'configuration.pointSize', 1);

    if (!_.isFinite(pointSizeMultiplier)) {
      throw new Error('configuration.pointSize is not a number.');
    }

    if (pointSizeMultiplier < 0) {
      throw new Error('configuration.pointSize must be positive.');
    }

    if (
      pointSizeMultiplier < FEATURE_MAP_MIN_POINT_SIZE_MULTIPLIER ||
      pointSizeMultiplier > FEATURE_MAP_MAX_POINT_SIZE_MULTIPLIER
    ) {
      throw new Error(
        'configuration.pointSize must be between' +
        `${FEATURE_MAP_MIN_POINT_SIZE_MULTIPLIER} - ${FEATURE_MAP_MAX_POINT_SIZE_MULTIPLIER}.`
      );
    }

    // This was created somewhat arbitrarily by Chris to
    // result in point features which get slightly larger
    // as the map is zoomed in. It can be replaced with
    // any function which computes a number that makes
    // sense as the radius of a point feature in pixels.
    return (Math.pow(zoomLevel * 0.0695, 5) + 2) * pointSizeMultiplier;
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
  function getPointStyle() {
    return {
      color: calculatePointColor,
      highlightColor: 'rgba(255, 255, 255, .5)',
      radius: scalePointFeatureRadiusByZoomLevel,
      lineWidth: 1,
      strokeStyle: calculateStrokeStyleColor
    };
  }

  /**
   * Determine the point opacity at a given zoom level.
   * When you zoom in the opacity increases.
   */
  function calculatePointOpacity(zoomLevel) {
    return (0.2 * Math.pow(zoomLevel / 18, 5) + 0.6);
  }

  function calculatePointColor(zoomLevel) {
    var rgb = [235, 105, 0];
    var color = _.get(lastRenderedVif, 'series[0].color.primary', '');
    var shorthandHexRegex = /^#([0-9a-zA-Z]{1})([0-9a-zA-Z]{1})([0-9a-zA-Z]{1})$/;
    var hexRegex = /^#([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})$/;

    var toInteger = function(hex) { return parseInt(hex, 16); };
    var expandShorthandHex = function(hex) { return hex.length === 1 ? hex + hex : hex; };
    var matches = color.match(shorthandHexRegex) || color.match(hexRegex);

    var opacity = _.get(lastRenderedVif, 'configuration.pointOpacity', null);

    if (_.isNull(opacity)) {
      opacity = calculatePointOpacity(zoomLevel);
    } else {
      // Clamp to [0, 1].
      opacity = Math.max(0, Math.min(parseFloat(opacity), 1));
    }

    if (matches) {
      rgb = _.chain([matches[1], matches[2], matches[3]]).
        map(expandShorthandHex).
        map(toInteger).
        value();
    }

    return 'rgba({0}, {1}, {2}, {3})'.format(rgb[0], rgb[1], rgb[2], opacity);
  }

  /**
  * Determine stroke style (point outline) at given zoom level.
  * Dims point outline color as map zooms out.
  */
  function calculateStrokeStyleColor(zoomLevel) {
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
  function getLineStringStyle() {
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
  function getPolygonStyle() {
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
  function getFeatureStyle(feature) {
    switch (feature.type) {
      case 1:
        return getPointStyle();
      case 2:
        return getLineStringStyle();
      case 3:
        return getPolygonStyle();
      default:
        throw new Error('Cannot apply style to unknown feature type "' + feature.type + '".');
    }
  }
}

module.exports = SvgFeatureMap;
