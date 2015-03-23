describe('featureMap', function() {
  'use strict';

  var mockWindowStateService;
  var testHelpers;
  var rootScope;
  var scope;
  var timeout;
  var testData;
  var AngularRxExtensions;
  var featureExtent;
  var protocolBuffers;
  var testJson = 'karma-test/dataCards/test-data/featureMapTest/featureMapTestData.json';
  var protocolBufferEndpointResponses = 'karma-test/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';
  var defaultFeatureLayerUrl = '/tiles/test-data/test_field/{z}/{x}/{y}.pbf';
  var filteredFeatureLayerUrl = "/tiles/test-data/test_field/{z}/{x}/{y}.pbf?$where=%3A%40coordinates_8_computed%3D'48'";
  var _XMLHttpRequest = window.XMLHttpRequest;
  var fakeXhr;

  beforeEach(module(testJson));
  beforeEach(module(protocolBufferEndpointResponses));

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.directives'));

  beforeEach(module('dataCards/feature-map.sass'));

  beforeEach(module('/angular_templates/dataCards/featureMap.html'));

  beforeEach(function() {
    module(function($provide) {

      mockWindowStateService = {};
      mockWindowStateService.scrollPositionSubject = new Rx.Subject();
      mockWindowStateService.windowSizeSubject = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressedSubject = new Rx.Subject();
      mockWindowStateService.mousePositionSubject = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    featureExtent = testHelpers.getTestJson(testJson);
    protocolBuffers = deserializeBytes(testHelpers.getTestJson(protocolBufferEndpointResponses));

    // Set up the fake XMLHttpRequest interface.
    setUpFakeXHR();
  }));

  afterEach(function() {
    removeFeatureMap();

    // Restore default XMLHttpRequest functionality.
    restoreXHR();
  });

  function deserializeBytes(protocolBuffers) {

    var endpoints = Object.keys(protocolBuffers);
    var deserializedProtocolBuffers = {};
    var i;
    var endpoint;
    var ab;
    var dv;
    var j;

    for (i = 0; i < endpoints.length; i++) {

      endpoint = endpoints[i];

      ab = new ArrayBuffer(protocolBuffers[endpoint].length);
      dv = new DataView(ab);

      for (j = 0; j < protocolBuffers[endpoint].length; j++) {
        dv.setUint8(j, protocolBuffers[endpoint][j]);
      }

      deserializedProtocolBuffers[endpoint] = ab;

    }

    return deserializedProtocolBuffers;
  }

  function setUpFakeXHR() {

    fakeXhr = function() {
      this.method = null;
      this.url = null;
      this.responses = null;
      this.readyState = 0;
      this.status = null;
      this.statusText = '';
    };

    fakeXhr.prototype.open = function(method, url, async) {
      this.method = method;
      this.url = url;
    };

    fakeXhr.prototype.setRequestHeader = function() { };

    fakeXhr.prototype.abort = function() { };

    fakeXhr.prototype.send = function() {
      var self = this;

      this.readyState = 4;
      this.status = '200';

      // These responses need to be async or else the tile loading
      // logic gets messed up. Whether that's a problem with the tests
      // or a problem with the tile loading logic is an exercise left
      // to the reader. :-(
      if (protocolBuffers.hasOwnProperty(this.url)) {
        setTimeout(function() {
          self.response = protocolBuffers[self.url];
          self.onload();
        }, 20);
      } else {
        setTimeout(function() {
          self.response = '';
          self.onload();
        }, 20);
      }
    }

    window.XMLHttpRequest = fakeXhr;
  }

  function restoreXHR() {
    window.XMLHttpRequest = _XMLHttpRequest;
  }

  function createFeatureMap(options) {

    options = _.defaults(options || {}, {
      width: 640,
      featureLayerUrl: defaultFeatureLayerUrl
    });

    var chartId = $('#test-feature-map').length === 0 ? 'test-feature-map' : 'alternate-test-feature-map';
    var html = [
      '<div id="{0}">'.format(chartId),
        '<div class="card-visualization" style="width: {0}px; height: 300px;">'.format(options.width),
          '<feature-map ',
            'class="feature-map" ',
            'base-layer-url="baseLayerUrl" ',
            'feature-extent="featureExtent" ',
            'feature-layer-url="featureLayerUrl" ',
            'row-display-unit="rowDisplayUnit">',
          '</feature-map>',
        '</div>',
      '</div>'
    ].join('');

    scope.baseLayerUrl = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
    scope.featureExtent = featureExtent;
    scope.featureLayerUrl = options.featureLayerUrl;
    scope.rowDisplayUnit = 'rowDisplayUnit';

    return testHelpers.TestDom.compileAndAppend(html, scope);
  }

  function removeFeatureMap() {
    $('#test-feature-map').remove();
    $('#alternate-test-feature-map').remove();
    $('#uber-flyout').hide();
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

    return 'rgba({0},{1},{2},{3})'.format(
      imageData.data[0],
      imageData.data[1],
      imageData.data[2],
      (imageData.data[3] / 255).toFixed(1)
    );
  }

  // This is not currently used but may be useful in the future.
  function getCanvasUniqueColors(canvas) {

    var imageData = canvas.
      getContext('2d').
      getImageData(0, 0, canvas.width, canvas.height);
    var uniqueColors = {};
    var color;

    for (i = 0; i < imageData.data.length; i += 4) {

      color = 'rgba(' +
              imageData.data[i] +
              ',' +
              imageData.data[i + 1] +
              ',' +
              imageData.data[i + 2] +
              ',' +
              (imageData.data[i + 3] / 255).toFixed(1) +
              ')';

      if (!uniqueColors.hasOwnProperty(color)) {
        uniqueColors[color] = true;
      }

    }

    return Object.keys(uniqueColors);
  }

  describe('featureLayerUrl', function() {

    it('when changed from null to a real value should cause the vector tiles to render', function(done) {
      var eventExpected = false;
      scope.$on('render:start', function(event, args) {
        if(args.tag === 'vector_tile_render') {
          expect(eventExpected).to.equal(true);
          done();
        }
      });

      var map = createFeatureMap({
        featureLayerUrl: null
      });

      scope.$digest();

      eventExpected = true;
      scope.featureLayerUrl = defaultFeatureLayerUrl;
      scope.$digest();
    });
  });

  describe('timing events', function() {

    it('should emit render:start and render:complete events appropriately and in the correct order', function(done) {

      AngularRxExtensions.install(scope);

      var renderEvents = scope.eventToObservable('render:start').merge(scope.eventToObservable('render:complete'));

      renderEvents.take(2).toArray().subscribe(
        function(events) {

          // Visualization id is a string and is the same across events.
          expect(events[0].args[0].source).to.satisfy(_.isString);
          expect(events[1].args[0].source).to.equal(events[0].args[0].source);

          // Times are ints and are in order.
          expect(events[0].args[0].timestamp).to.satisfy(_.isFinite);
          expect(events[1].args[0].timestamp).to.satisfy(_.isFinite);

          expect(events[0].args[0].timestamp).to.be.below(events[1].args[0].timestamp);

          done();

        }
      );

      var map = createFeatureMap();
    });
  });

  describe('at the default calculated zoom level', function() {

    it('should render visible points at expected locations', function(done) {

      var canvases;
      var expectedPointColor = 'rgba(48,134,171,1.0)';
      var point1Color;
      var point2Color;
      var point3Color;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function(event, data) {

        var canvases = $('canvas');

        expect(canvases.length).to.be.above(0);

        var canvasWithPointsRendered = canvases[6];

        point1Color = getCanvasColorAt(canvasWithPointsRendered, { x: 47, y: 246 });
        point2Color = getCanvasColorAt(canvasWithPointsRendered, { x: 104, y: 250 });
        point3Color = getCanvasColorAt(canvasWithPointsRendered, { x: 151, y: 235 });

        expect(point1Color).to.equal(expectedPointColor);
        expect(point2Color).to.equal(expectedPointColor);
        expect(point3Color).to.equal(expectedPointColor);

        done();
      });

      var map = createFeatureMap();
    });
  });

  // This test is too brittle... Leaflet handles the creation and removal
  // of canvas tiles, and we can't reliably guess which tiles to check for
  // rendered points. Similarly, we can't iterate over every pixel to check
  // for rendered pionts because that would be far too slow for a test.
  xdescribe('when zoomed in', function() {

    it('should render visible points at expected locations', function(done) {

      var canvases;
      var expectedPointColor = 'rgba(48,134,171,1.0)';
      var point1Color;
      var point2Color;
      var point3Color;
      var hasZoomed = false;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function(event, data) {

        var canvases = $('canvas');

        if (canvases.length > 0) {

          if (!hasZoomed) {

            testHelpers.fireEvent($('.leaflet-control-zoom-in')[0], 'click');
            hasZoomed = true;

          } else {

            var canvases = $('canvas');

            expect(canvases.length).to.be.above(0);

            var canvasWithPointsRendered = canvases[21];

            point1Color = getCanvasColorAt(canvasWithPointsRendered, { x: 128, y: 1 });
            point2Color = getCanvasColorAt(canvasWithPointsRendered, { x: 197, y: 86 });
            point3Color = getCanvasColorAt(canvasWithPointsRendered, { x: 249, y: 91 });

            expect(point1Color).to.equal(expectedPointColor);
            expect(point2Color).to.equal(expectedPointColor);
            expect(point3Color).to.equal(expectedPointColor);

            done();
          }
        }
      });

      var map = createFeatureMap();
    });
  });
});
