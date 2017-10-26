import _ from 'lodash';
import $ from 'jquery';
import FeatureMap from 'common/visualizations/views/FeatureMap';
import 'common/visualizations/dataProviders/VectorTileManager';
import featureTestData from '../featureTestData/featureTestData';

describe('FeatureMap', function() {
  var VALID_BASE_LAYER = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
  var VALID_EXTENT = { 'southwest': [41.681944, -87.827778], 'northeast': [42.081944, -87.427778] };
  // For use with `deserializeBytes()` below
  var VALID_DESERIALIZED_TILESERVER_RESPONSES = deserializeTileserverResponses(featureTestData);
  var MAP_WIDTH = 640;
  var MAP_HEIGHT = 480;
  var USER_LAT = 41.87886;
  var USER_LNG = -87.635837;

  function deserializeTileserverResponses(serializedTileserverResponses) {

    var endpoints = Object.keys(serializedTileserverResponses);
    var deserializedTileserverResponses = {};
    var i;
    var endpoint;
    var ab;
    var dv;
    var j;

    for (i = 0; i < endpoints.length; i++) {

      endpoint = endpoints[i];

      ab = new ArrayBuffer(serializedTileserverResponses[endpoint].length);
      dv = new DataView(ab);

      for (j = 0; j < serializedTileserverResponses[endpoint].length; j++) {
        dv.setUint8(j, serializedTileserverResponses[endpoint][j]);
      }

      deserializedTileserverResponses[endpoint] = ab;
    }

    return deserializedTileserverResponses;
  }

  function mockVectorTileGetter(zoom, x, y) {

    return (
      new Promise(function(resolve, reject) {

        resolve({
          data: new Uint8Array(
            VALID_DESERIALIZED_TILESERVER_RESPONSES[
              '/tiles/test-data/test_field/{0}/{1}/{2}.pbf'.format(zoom, x, y)
            ]
          )
        });
      })
    );
  }

  function getBounds(extent) {

    var southWest = L.latLng(extent.southwest[0], extent.southwest[1]);
    var northEast = L.latLng(extent.northeast[0], extent.northeast[1]);

    return L.latLngBounds(southWest, northEast);
  }

  function createFeatureMap(width, height, overrideConfig) {

    if (!_.isNumber(width)) {
      width = MAP_WIDTH;
    }

    if (!_.isNumber(height)) {
      height = MAP_HEIGHT;
    }

    var element = $(
      '<div>',
      {
        'id': 'map',
        'style': 'width:' + width + 'px;height:' + height + 'px;'
      }
    );

    $('body').append(element);


    // The visualization itself handles rendering and interaction events.
    var featureMapVIF = {
      configuration: {
        localization: {
          'flyout_filter_notice': 'There are too many points at this location',
          'flyout_filter_or_zoom_notice': 'Zoom in to see details',
          'flyout_dense_data_notice': 'Numerous',
          'flyout_click_to_inspect_notice': 'Click to see details',
          'flyout_click_to_locate_user_title': 'Click to show your position on the map',
          'flyout_click_to_locate_user_notice': 'You may have to give your browser permission to share your current location.',
          'flyout_locating_user_title': 'Your position is being determined.',
          'flyout_locate_user_error_title': 'There was an error determining your position.',
          'flyout_locate_user_error_notice': 'You may not have given your browser permission to share your current location, or your browser may be unable to do so.',
          'row_inspector_row_data_query_failed': 'Detailed information about these points cannot be loaded at this time.',
          'user_current_position': 'Your current location (estimated)'
        },
        hover: true,
        panAndZoom: true,
        locateUser: false
      },
      type: 'featureMap',
      unit: {
        one: 'record',
        other: 'records'
      }
    };

    if (overrideConfig) {
      _.merge(featureMapVIF, overrideConfig);
    }

    var map = new FeatureMap(element, featureMapVIF);

    // The visualizationRenderOptions may change in response to user actions
    // and are passed as an argument to every render call.
    var renderOptions = {
      baseLayer: {
        url: VALID_BASE_LAYER,
        opacity: 0.15
      },
      bounds: getBounds(VALID_EXTENT),
      vectorTileGetter: mockVectorTileGetter
    };

    map.render(renderOptions);

    return {
      element: element,
      map: map,
      renderOptions: renderOptions
    };
  }

  function removeFeatureMap(featureMap) {

    if (featureMap && featureMap.map && featureMap.map.hasOwnProperty('destroy')) {
      featureMap.map.destroy();
      assert.lengthOf(featureMap.element.children(), 0);
    }

    $('#map').remove();
  }

  function getCanvasColorAt(canvas, coordinates) {

    var imageData = canvas.
      getContext('2d').
      getImageData(
        coordinates.x, // x
        coordinates.y, // y
        1,             // width
        1              // height
      );

    // An array containing the r, g, b, and a values of the pixel. In PhantomJS
    // (at least), imageData.data is actually an object so we need to map this
    // to an array.
    return [
      imageData.data[0],
      imageData.data[1],
      imageData.data[2],
      imageData.data[3]
    ];
  }

  function pointHasColor(colorValues) {

    var sumOfChannelValues = colorValues.
      reduce(
        function(val, acc) {
          return acc + val;
        },
        0
      );

    return (sumOfChannelValues > 0);
  }

  describe('when instantiated with an element with a width of zero', function() {

    it('should not render the feature map', function() {

      var featureMap = createFeatureMap(0, MAP_HEIGHT);

      assert.equal($('.leaflet-tile-loaded').length, 0);

      removeFeatureMap(featureMap);
    });
  });

  describe('when instantiated with an element with a height of zero', function() {

    it('should not render the feature map', function() {

      var featureMap = createFeatureMap(MAP_WIDTH, 0);

      assert.equal($('.leaflet-tile-loaded').length, 0);

      removeFeatureMap(featureMap);
    });
  });

  describe('`panAndZoom`', function() {

    describe('when disabled', function() {

      var featureMap;

      beforeEach(function() {
        featureMap = createFeatureMap(MAP_WIDTH, MAP_HEIGHT, { configuration: { panAndZoom: false } });
      });

      afterEach(function() {
        removeFeatureMap(featureMap);
      });

      it('should not display the zoom controls', function() {

        assert.equal($('.leaflet-control-zoom').length, 0);
      });
    });

    describe('when enabled', function() {

      var featureMap;

      beforeEach(function() {
        featureMap = createFeatureMap();
      });

      afterEach(function() {
        removeFeatureMap(featureMap);
      });

      it('should display the zoom controls', function() {

        assert.equal($('.leaflet-control-zoom').length, 1);
      });
    });
  });

  describe('`locateUser`', function() {

    var stubGeolocation = false;
    var getCurrentPositionStub;

    beforeEach(function() {

      if (!('geolocation' in navigator)) {
        stubGeolocation = true;
        navigator.geolocation = {
          getCurrentPosition: function() {}
        };
      }
      getCurrentPositionStub = sinon.stub(navigator.geolocation, 'getCurrentPosition');
    });

    afterEach(function() {

      navigator.geolocation.getCurrentPosition.restore();

      if (stubGeolocation) {
        delete navigator.geolocation;
      }
    });

    describe('when disabled', function() {

      var featureMap;

      beforeEach(function() {
        featureMap = createFeatureMap();
      });

      afterEach(function() {
        removeFeatureMap(featureMap);
      });

      it('should not display a "locate me" button', function() {

        assert.equal($('.feature-map-locate-user-btn').length, 0);
      });
    });

    describe('when enabled', function() {

      var featureMap;

      beforeEach(function() {
        featureMap = createFeatureMap(MAP_WIDTH, MAP_HEIGHT, { configuration: { locateUser: true } });
      });

      afterEach(function() {
        removeFeatureMap(featureMap);
      });

      it('should display a "locate me" button', function() {

        assert.equal($('.feature-map-locate-user-btn').length, 1);
      });

      describe('when geolocating', function() {

        it('should show the button in the "busy" state', function() {

          var $locateUserButton = $('.feature-map-locate-user-btn');

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'ready');

          $locateUserButton.click();

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'busy');
        });
      });

      describe('on geolocation error', function() {

        it('should show the button in the "error" state', function() {

          var $locateUserButton = $('.feature-map-locate-user-btn');

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'ready');

          getCurrentPositionStub.onCall(0).callsArg(1);

          $locateUserButton.click();

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'error');
        });
      });

      describe('on geolocation success', function() {

        it('should show the button in the "ready" state', function() {

          var $locateUserButton = $('.feature-map-locate-user-btn');
          var mockUserPosition = {
            coords: {
              latitude: USER_LAT,
              longitude: USER_LNG
            }
          };

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'ready');

          getCurrentPositionStub.onCall(0).callsArgWith(0, mockUserPosition);

          $locateUserButton.click();

          assert.equal($locateUserButton.attr('data-locate-user-status'), 'ready');
        });

        it("should render the user's position", function() {

          var $locateUserButton = $('.feature-map-locate-user-btn');
          var mockUserPosition = {
            coords: {
              latitude: USER_LAT,
              longitude: USER_LNG
            }
          };

          getCurrentPositionStub.onCall(0).callsArgWith(0, mockUserPosition);

          $locateUserButton.click();

          assert.equal($('.feature-map-user-current-position-icon').length, 1);
        });
      });
    });
  });
});
