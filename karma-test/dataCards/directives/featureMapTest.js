describe('featureMap', function() {

  var testHelpers;
  var rootScope;
  var scope;
  var timeout;
  var testData;
  var AngularRxExtensions;
  var testJson = 'karma-test/dataCards/test-data/featureMapTest/featureMapTestData.json';
  var protocolBufferEndpointResponses = 'karma-test/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';

  var defaultFeatureLayerUrl = '/tiles/test-data/test_field/{z}/{x}/{y}.pbf';
  var filteredFeatureLayerUrl = "/tiles/test-data/test_field/{z}/{x}/{y}.pbf?$where=%3A%40coordinates_8_computed%3D'48'";

  var _XMLHttpRequest = window.XMLHttpRequest;

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

    fakeXhr.prototype.send = function() {
      this.readyState = 4;
      this.status = '200';
      if (protocolBuffers.hasOwnProperty(this.url)) {
        this.response = protocolBuffers[this.url];
        this.onload();
      } else {
        this.response = '';
        this.onload();
      }
    }

    window.XMLHttpRequest = fakeXhr;

  }

  function restoreXHR() {
    window.XMLHttpRequest = _XMLHttpRequest;
  }

  function createFeatureMap(width, expanded) {

    var chartId = $('#test-feature-map').length === 0 ? 'test-feature-map' : 'alternate-test-feature-map';
    var html = [
      '<div id="{0}">'.format(chartId),
        '<div class="card-visualization" style="width: {0}px; height: 300px;">'.format(width),
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
    scope.featureLayerUrl = defaultFeatureLayerUrl;
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

      return 'rgba(' +
             imageData.data[0] +
             ',' +
             imageData.data[1] +
             ',' +
             imageData.data[2] +
             ',' +
             (imageData.data[3] / 255).toFixed(1) +
             ')';

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

      var map = createFeatureMap(640, false);

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

        if (canvases.length > 0) {        

          expect(canvases.length).to.be.above(0);

          point1Color = getCanvasColorAt(canvases[1], { x: 48, y: 10 });
          point2Color = getCanvasColorAt(canvases[1], { x: 128, y: 142 });
          point3Color = getCanvasColorAt(canvases[1], { x: 168, y: 160 });

          expect(point1Color).to.equal(expectedPointColor);
          expect(point2Color).to.equal(expectedPointColor);
          expect(point3Color).to.equal(expectedPointColor);

          done();

        }

      });

      var map = createFeatureMap(640, false);

    });

  });

  describe('when zoomed in', function() {

    // Something wierd is happening here and it's not actually rendering the zoomed-in
    // tiles even though it successfully downloads them via the fake XHR object.
    xit('should render visible points at expected locations', function(done) {

      var canvases;
      var uniqueColors;
      var hasZoomed = false;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function(event, data) {

        var canvases = $('canvas');

        if (canvases.length > 0) {

          if (!hasZoomed) {

            testHelpers.fireEvent($('.leaflet-control-zoom-in')[0], 'click');
            hasZoomed = true;

          } else {

            var pointColor = 'rgba(48,134,171,1.0)';

            expect(canvases.length).to.be.above(0);

            point1Color = getCanvasColorAt(canvases[1], { x: 48, y: 2 });
            point2Color = getCanvasColorAt(canvases[1], { x: 33, y: 88 });
            point3Color = getCanvasColorAt(canvases[1], { x: 118, y: 156 });

            expect(point1Color).to.equal(pointColor);
            expect(point2Color).to.equal(pointColor);
            expect(point3Color).to.equal(pointColor);

            done();

          }

        }

      });

      var map = createFeatureMap(640, false);

    });

  });

});
