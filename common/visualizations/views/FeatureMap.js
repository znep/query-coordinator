var utils = require('common/js_utils');
var Visualization = require('./Visualization');
var L = require('leaflet');
var _ = require('lodash');
var $ = require('jquery');

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
  var _maxTileDensity;
  var _maxRowInspectorDensity;
  var _debug;
  var _hover;
  var _panAndZoom;
  var _locateUser;
  var _startResizeFn;
  var _completeResizeFn;
  var _baseTileLayer;
  var _map;
  var _lastRenderOptions;
  var centerAndZoomDefined;

  // We buffer feature layers so that there isn't a visible flash
  // of emptiness when we transition from one to the next. This is accomplished
  // by only removing the previous layers when the current one completes rendering.

  // We also keep a handle on the current feature layer Url so we know which of
  // the existing layers we can safely remove (i.e. not the current one).
  var _featureLayers = {};
  var _flyoutData = {};
  var _currentLayerId;

  _maxTileDensity = vif.configuration.maxTileDensity || FEATURE_MAP_MAX_TILE_DENSITY;
  _maxRowInspectorDensity = vif.configuration.maxRowInspectorDensity || FEATURE_MAP_ROW_INSPECTOR_MAX_ROW_DENSITY;
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
      var boundsChanged = renderOptions.bounds !== _.get(_lastRenderOptions, 'bounds');
      var baseLayerChanged = renderOptions.baseLayer !== _.get(_lastRenderOptions, 'baseLayer');
      var vectorTileGetterChanged = renderOptions.vectorTileGetter !== _.get(_lastRenderOptions, 'vectorTileGetter');

      // Emit render start event
      _emitRenderStart();

      if (!_map) {

        // Construct leaflet map
        _map = L.map(_mapElement[0], _mapOptions);

        // Attach events on first render only
        _attachEvents(this.element);

        centerAndZoomDefined = (
          _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.center.lat')) &&
          _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.center.lng')) &&
          _.isNumber(_.get(vif, 'configuration.mapCenterAndZoom.zoom'))
        );

        _lastRenderOptions = _.cloneDeep(renderOptions);
        _lastRenderOptions.bounds = new L.LatLngBounds(
          renderOptions.bounds.getSouthWest(),
          renderOptions.bounds.getNorthEast()
        );

        if (_userCurrentPositionBounds) {
          _fitBounds(_userCurrentPositionBounds);
        // Note that we prefer mapCenterAndZoom over defaultExtent or savedExtent
        // properties in the VIF.
        } else if (centerAndZoomDefined) {
          updateCenterAndZoom(_.get(vif, 'configuration.mapCenterAndZoom'));
        // If centerAndZoom is not set we then check for the bounds that have
        // been saved in the VIF.
        //
        // TODO: Deprecate this.
        } else if (boundsChanged) {
          _fitBounds(renderOptions.bounds);
        }
      }

      if (baseLayerChanged) {
        _updateBaseLayer(renderOptions.baseLayer.url, renderOptions.baseLayer.opacity);
      }

      if (vectorTileGetterChanged) {
        _createNewFeatureLayer(renderOptions.vectorTileGetter);
      }
    }
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

  function _renderTemplate(targetElement) {
    let mapLocateUserButton;

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

      mapLocateUserButton = $(
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

    // Cache element selections
    _mapContainer = mapContainer;
    _mapElement = mapElement;
    _mapPanZoomDisabledWarning = mapPanZoomDisabledWarning;
    _mapLocateUserButton = mapLocateUserButton;

    targetElement.append(mapContainer);
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
      _map.on('dragend zoomend', emitMapCenterAndZoomChange);
      // TODO: Deprecate _handleExtentChange in favor of emitMapCenterAndZoomChange
      _map.on('resize dragend zoomend', _handleExtentChange);
      _map.on('dragstart zoomstart', _handlePanAndZoom);
      _map.on('mouseout', _hideFlyout);

      // react to the interactions that would close the RowInspector flannel
      if (_hover) {
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

        if (!_.get(vif, 'configuration.isMobile')) {
          _mapLocateUserButton.on('mousemove', _handleLocateUserButtonMousemove);
        }

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
      _map.off('dragend zoomend', emitMapCenterAndZoomChange);
      // TODO: Deprecate _handleExtentChange in favor of emitMapCenterAndZoomChange
      _map.off('resize dragend zoomend', _handleExtentChange);
      _map.off('dragstart zoomstart', _handlePanAndZoom);
      _map.off('mouseout', _hideFlyout);

      if (_hover) {
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

  function emitMapCenterAndZoomChange() {
    var center = _map.getCenter();
    var zoom = _map.getZoom();
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

  function _handlePanZoomDisabledWarningMousemove() {
    _showPanZoomDisabledWarningFlyout();
  }

  function _handlePanZoomDisabledWarningMouseout() {
    _hideFlyout();
  }

  function _handleLocateUserButtonClick() {

    _updateLocateUserButtonStatus('busy');

    if (!_.get(vif, 'configuration.isMobile')) {
      _showLocateUserButtonFlyout();
    }

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
          title: self.getLocalization('user_current_position'),
          alt: self.getLocalization('user_current_position')
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

    if (!_.get(vif, 'configuration.isMobile')) {
      _showLocateUserButtonFlyout();
    }
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

  function _sumPointsByCount(points) {
    return _.chain(points).
      map('count').
      map(_.toNumber).
      sum().
      value();
  }

  function _handleVectorTileMousemove(event) {
    if (event.hasOwnProperty('tile')) {

      // Set flyout data and force a refresh of the flyout
      _flyoutData.offset = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
      };
      _flyoutData.count = _sumPointsByCount(event.points);
      _flyoutData.totalPoints = event.tile.totalPoints;

      if (_flyoutData.count > 0) {
        event.originalEvent.target.style.cursor = 'pointer';
        _showFeatureFlyout(event);
      } else {
        event.originalEvent.target.style.cursor = 'inherit';
        _hideFlyout();
      }
    }
  }

  function _handleVectorTileClick(event) {

    if (vif.configuration.isMobile) {
      _flyoutData.offset = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY + FEATURE_MAP_FLYOUT_Y_OFFSET
      };

      _flyoutData.count = _sumPointsByCount(event.points);
    }

    var inspectorDataQueryConfig;
    var position = vif.configuration.isMobile ?
      { pageX: 0, pageY: (_mapContainer.height() + _mapContainer.offset().top) } :
      { pageX: event.originalEvent.pageX, pageY: event.originalEvent.pageY };

    if (_flyoutData.count > 0 &&
      _flyoutData.count <= _maxRowInspectorDensity) {

      inspectorDataQueryConfig = {
        latLng: event.latlng,
        position: position,
        rowCount: _sumPointsByCount(event.points),
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
    var manyRows = _flyoutData.count > _maxRowInspectorDensity;
    var denseData = _flyoutData.totalPoints >= _maxTileDensity;

    if (_flyoutData.count === 1) {
      rowCountUnit = (_.has(_lastRenderOptions, 'unit.one')) ? _lastRenderOptions.unit.one : _.get(vif, 'unit.one');
    } else {
      rowCountUnit = (_.has(_lastRenderOptions, 'unit.other')) ? _lastRenderOptions.unit.other : _.get(vif, 'unit.other');
    }

    payload = {
      title: '{0} {1}'.format(
        _flyoutData.count,
        rowCountUnit
      ),
      notice: self.getLocalization('flyout_click_to_inspect_notice'),
      flyoutOffset: {
        left: event.originalEvent.clientX,
        top: event.originalEvent.clientY
      }
    };

    if (manyRows || denseData) {

      if (_map.getZoom() === FEATURE_MAP_MAX_ZOOM) {
        payload.notice = self.getLocalization('flyout_filter_notice');
      } else {
        payload.notice = self.getLocalization('flyout_filter_or_zoom_notice');
      }

      // If the tile we are hovering over has more points then the
      // TileServer limit or the selected points contain more than the
      // max number of rows to be displayed on a flannel,
      // prompt the user to filter and/or zoom in for accurate data.
      if (denseData) {
        payload.title = '{0} {1}'.format(
          self.getLocalization('flyout_dense_data_notice'),
          (_.has(_lastRenderOptions, 'unit.other')) ? _lastRenderOptions.unit.other : _.get(vif, 'unit.other')
        );
      }
    }

    if (!_.get(vif, 'configuration.isMobile') || _.get(vif, 'configuration.isMobile') && (manyRows || denseData)) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_FLYOUT_SHOW',
        payload
      );
    }
  }

  function _showPanZoomDisabledWarningFlyout() {

    var payload = {
      element: _mapPanZoomDisabledWarning[0],
      title: self.getLocalization('flyout_pan_zoom_disabled_warning_title')
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
        title: self.getLocalization('flyout_click_to_locate_user_title'),
        notice: self.getLocalization('flyout_click_to_locate_user_notice')
      };

    } else if (locateUserStatus === 'busy') {

      payload = {
        element: _mapLocateUserButton[0],
        title: self.getLocalization('flyout_locating_user_title'),
        notice: null
      };

    } else {

      payload = {
        element: _mapLocateUserButton[0],
        title: self.getLocalization('flyout_locate_user_error_title'),
        notice: self.getLocalization('flyout_locate_user_error_notice')
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
    var isRowInspector = $target.parents('#socrata-row-inspector').length > 0 && !isIconClose;

    if (isLeftClick && (isOutsideOfCurrentMap || isIconClose) && !isRowInspector) {
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
   * Reads center and zoom overrides from the vif and updates the map to render
   * with those parameters.
   *
   * @param centerAndZoom - The centerAndZoom subtree from the vif.
   */
  function updateCenterAndZoom(centerAndZoom) {
    utils.assertHasProperties(centerAndZoom, 'center', 'zoom');
    utils.assertHasProperties(centerAndZoom.center, 'lat', 'lng');
    utils.assertIsOneOfTypes(centerAndZoom.zoom, 'number');

    _map.setView(centerAndZoom.center, centerAndZoom.zoom, { animate: false });
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
      rowInspectorMaxRowDensity: _maxRowInspectorDensity,
      maxZoom: FEATURE_MAP_MAX_ZOOM,
      maxTileDensity: _maxTileDensity,
      tileOverlapZoomThreshold: FEATURE_MAP_TILE_OVERLAP_ZOOM_THRESHOLD,
      // Helper functions
      getFeatureId: _getFeatureId,
      getFeatureStyle: _getFeatureStyle,
      getHoverThreshold: _getHoverThreshold,
      // Event handlers
      onRenderStart: _handleVectorTileRenderStart,
      onRenderComplete: _handleVectorTileRenderComplete,
      onMousemove: _handleVectorTileMousemove,
      onClick: _handleVectorTileClick,
      onTap: _.get(vif, 'configuration.isMobile') ? _handleVectorTileMousemove : null
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
   * Determine the point opacity at a given zoom level.
   * When you zoom in the opacity increases.
   */
  function _calculatePointOpacity(zoomLevel) {
    return (0.2 * Math.pow(zoomLevel / 18, 5) + 0.6);
  }

  function _calculatePointColor(zoomLevel) {
    var rgb = [235, 105, 0];
    var color = _.get(vif, 'configuration.pointColor', '');
    var shorthandHexRegex = /^#([0-9a-zA-Z]{1})([0-9a-zA-Z]{1})([0-9a-zA-Z]{1})$/;
    var hexRegex = /^#([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})$/;

    var toInteger = function(hex) { return parseInt(hex, 16); };
    var expandShorthandHex = function(hex) { return hex.length === 1 ? hex + hex : hex; };
    var matches = color.match(shorthandHexRegex) || color.match(hexRegex);

    var opacity = _.get(vif, 'configuration.pointOpacity', null);

    if (_.isNull(opacity)) {
      opacity = _calculatePointOpacity(zoomLevel);
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
