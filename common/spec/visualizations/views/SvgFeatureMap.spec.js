import _ from 'lodash';
import $ from 'jquery';
import SvgFeatureMap from 'common/visualizations/views/SvgFeatureMap';
import featureTestData from '../featureTestData/featureTestData';
import 'common/visualizations/dataProviders/VectorTileManager';

describe('SvgFeatureMap', function() {
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

  function makeVif(overrides) {

    const base = {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        interactive: true,
        panAndZoom: true,
        locateUser: false,
        baseLayerUrl: VALID_BASE_LAYER,
        baseLayerOpacity: 0.15
      },
      unit: {
        one: 'record',
        other: 'records'
      },
      series: [{
        dataSource: {
          type: 'featureMap',
          domain: '',
          datasetUid: '',
          dimension: { columnName: '' },
          filters: []
        }
      }]
    };

    return Object.assign({}, base, overrides);

  }

  function makeRenderOptions() {
    return {
      extent: VALID_EXTENT,
      vectorTileGetter: mockVectorTileGetter
    };
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
    var featureMapVIF = makeVif();

    if (overrideConfig) {
      _.merge(featureMapVIF, overrideConfig);
    }

    var map = new SvgFeatureMap(element, featureMapVIF);

    // The visualizationRenderOptions may change in response to user actions
    // and are passed as an argument to every render call.
    var renderOptions = makeRenderOptions();

    map.render(featureMapVIF, renderOptions);

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

    describe('rendering behavior when switching VIF dimension column', () => {

      let vif1 = makeVif({
        series: [{
          dataSource: {
            type: 'featureMap',
            domain: '',
            datasetUid: '',
            dimension: { columnName: 'col1' },
            filters: []
          }
        }]
      });

      let vif2 = makeVif({
        series: [{
          dataSource: {
            type: 'featureMap',
            domain: '',
            datasetUid: '',
            dimension: { columnName: 'col2' },
            filters: []
          }
        }]
      });

      let renderOptions = makeRenderOptions();
      let featureMap;

      beforeEach(() => {
        featureMap = createFeatureMap(MAP_WIDTH, MAP_HEIGHT, vif1);
      });

      afterEach(() => {
        removeFeatureMap(featureMap);
      });

      it('should not rerender the map when the column does not change', () => {
        let boundsChangedSpy = sinon.spy(featureMap.map._map, 'fitBounds');
        featureMap.map.render(vif1, renderOptions);
        expect(boundsChangedSpy.callCount).to.equal(0);
        featureMap.map._map.fitBounds.restore();
      });

      it('should rerender the map when the series dimension changes', () => {
        let boundsChangedSpy = sinon.spy(featureMap.map._map, 'fitBounds');
        featureMap.map.render(vif2, makeRenderOptions());
        expect(boundsChangedSpy.callCount).to.equal(1);
        featureMap.map._map.fitBounds.restore();
      });

    });

  });
});
