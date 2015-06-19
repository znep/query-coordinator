describe('featureMap', function() {
  'use strict';

  var mockWindowStateService;
  var testHelpers;
  var rootScope;
  var $q;
  var scope;
  var timeout;
  var featureExtent;
  var protocolBuffers;
  var testJson = 'karma-test/dataCards/test-data/featureMapTest/featureMapTestData.json';
  var protocolBufferEndpointResponses = 'karma-test/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';
  var VectorTileDataService;

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
    $q = $injector.get('$q');
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    featureExtent = testHelpers.getTestJson(testJson);
    protocolBuffers = deserializeBytes(testHelpers.getTestJson(protocolBufferEndpointResponses));
    VectorTileDataService = $injector.get('VectorTileDataService');
  }));

  afterEach(function() {
    removeFeatureMap();
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

  function qVectorTileGetter(zoom, x, y) {
    var deferred = $q.defer();
    vectorTileGetter(deferred, zoom, x, y);
    return deferred.promise;
  }

  function jqVectorTileGetter(zoom, x, y) {
    var deferred = $.Deferred();
    vectorTileGetter(deferred, zoom, x, y);
    return deferred.promise();
  }

  function vectorTileGetter(deferred, zoom, x, y) {
    var url = '/tiles/test-data/test_field/{0}/{1}/{2}.pbf'.format(zoom, x, y);
    if (protocolBuffers.hasOwnProperty(url)) {
      deferred.resolve({ data: VectorTileDataService.typedArrayFromArrayBufferResponse({ response: protocolBuffers[url] }) });
    } else {
      deferred.resolve({ data: [] })
    }
  }

  function createFeatureMap(options) {

    options = _.defaults(options || {}, {
      width: 640,
      height: 300,
      vectorTileGetter: jqVectorTileGetter
    });

    var chartId = $('#test-feature-map').length === 0 ? 'test-feature-map' : 'alternate-test-feature-map';
    var html = [
      '<div id="{0}">'.format(chartId),
        '<div class="card-visualization" style="width: {0}px; height: {1}px;">'.format(options.width, options.height),
          '<feature-map ',
            'class="feature-map" ',
            'base-layer-url="baseLayerUrl" ',
            'feature-extent="featureExtent" ',
            'vector-tile-getter="vectorTileGetter" ',
            'row-display-unit="rowDisplayUnit" ',
            'disable-pan-and-zoom="disablePanAndZoom">',
          '</feature-map>',
        '</div>',
      '</div>'
    ].join('');

    scope.baseLayerUrl = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
    scope.featureExtent = featureExtent;
    scope.vectorTileGetter = options.vectorTileGetter;
    scope.zoomDebounceMilliseconds = 0;
    scope.rowDisplayUnit = 'row';

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

  describe('vectorTileGetter', function() {
    it('should render when set', function(done) {
      var eventExpected = false;
      scope.$on('render:start', function(event, args) {
        if(args.tag === 'vector_tile_render') {
          expect(eventExpected).to.equal(true);
          done();
        }
      });
      createFeatureMap({ vectorTileGetter: null });
      scope.$digest();
      eventExpected = true;
      scope.$apply(function() {
        scope.vectorTileGetter = _.constant($q.when([]));
      });
    });
  });

  describe('timing events', function() {

    it('should emit render:start and render:complete events appropriately and in the correct order', function(done) {

      var renderEvents = scope.$eventToObservable('render:start').merge(scope.$eventToObservable('render:complete'));

      renderEvents.take(2).toArray().subscribe(
        function(events) {

          // Visualization id is a string and is the same across events.
          expect(events[0].additionalArguments[0].source).to.satisfy(_.isString);
          expect(events[1].additionalArguments[0].source).to.equal(events[0].additionalArguments[0].source);

          // Times are ints and are in order.
          expect(events[0].additionalArguments[0].timestamp).to.satisfy(_.isFinite);
          expect(events[1].additionalArguments[0].timestamp).to.satisfy(_.isFinite);

          expect(events[0].additionalArguments[0].timestamp).to.be.below(events[1].additionalArguments[0].timestamp);

          done();

        }
      );

      createFeatureMap();
    });

    it('should not render the map if the height of the element is zero', function() {

      var fm = createFeatureMap({height: 0});
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);

    });

    it('should not render the map if the width of the element is zero', function() {

      var fm = createFeatureMap({width: 0});
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);

    });
  });

  describe('at the default calculated zoom level', function() {

    it('should render visible points at expected locations', function(done) {

      var expectedPointColor = 'rgba(48,134,171,1.0)';
      var point1Color;
      var point2Color;
      var point3Color;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function() {

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

      // We use a $q-promise-based tile getter here instead of a jQuery one because
      // the side-effect of $q being tied to the digest cycle makes this test pass
      // TODO: figure out what timing issue is causing this behavior
      createFeatureMap({
        vectorTileGetter: qVectorTileGetter
      });
    });
  });

  describe('when zoomed in', function() {
    it('should fire a second "render:complete" event.', function(done) {
      var completeEvents = 0;
      var hasZoomed = false;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function() {
        completeEvents++;

        if (!hasZoomed) {
          testHelpers.fireEvent($('.leaflet-control-zoom-in')[0], 'click');
          hasZoomed = true;
        } else {
          expect(completeEvents).to.equal(2);
          done();
        }
      });

      createFeatureMap();
    });

    // This test is too brittle... Leaflet handles the creation and removal
    // of canvas tiles, and we can't reliably guess which tiles to check for
    // rendered points. Similarly, we can't iterate over every pixel to check
    // for rendered pionts because that would be far too slow for a test.
    xit('should render visible points at expected locations', function(done) {

      var expectedPointColor = 'rgba(48,134,171,1.0)';
      var point1Color;
      var point2Color;
      var point3Color;
      var hasZoomed = false;

      // Wait for rendering to complete before checking the content of the canvas tiles.
      scope.$on('render:complete', function() {

        var canvases = $('canvas');

        if (canvases.length > 0) {

          if (!hasZoomed) {

            testHelpers.fireEvent($('.leaflet-control-zoom-in')[0], 'click');
            hasZoomed = true;

          } else {

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

      createFeatureMap();
    });
  });

  // describe('flyouts', function() {
  //   var map;
  //   var flyout;
  //   var hint;
  //   var ghost;

  //   beforeEach(function() {
  //     map = createFeatureMap();
  //     flyout = $('#uber-flyout');
  //     hint = flyout.find('.hint');
  //   });

  //   function simulateMouseover(x, y, target) {
  //   testHelpers.fireMouseEvent(target, 'mouseover');
  //   testHelpers.fireMouseEvent(target, 'mousemove', {
  //     clientX: x,
  //     clientY: y,
  //     relatedTarget: target
  //   });
  //   // ghost red px to help with debugging
  //   ghost = $("<div style='background-color:red; width:2px; height: 2px; position: absolute; top: " + y + "px; left: " + x + "px'></div>");
  //   $(map).append(ghost);

  //   }

  //   it('should render a flyout when hovering on a point', function() {
  //     // var highlightTarget = map.find('.feature-map-container')[0];
  //     var highlightTarget = map.find('canvas')[0];
  //     var mapWidth = $('.feature-map-container').width();
  //     var mapHeight = $('.feature-map-container').height();

  //     if (highlightTarget) {
  //       simulateMouseover(mapWidth / 2, mapHeight / 2, highlightTarget);
  //     }
  //     expect(flyout.is(':visible')).to.be.true;
  //     console.log(flyout.text())
  //     expect(flyout.text()).to.match(/\d+ rows/);
  //     expect(flyout.text()).to.match(/Click to see details/);
  //   });
  // });

  describe('disable pan and zoom feature flag', function() {
    beforeEach(function() {
      scope.disablePanAndZoom = true;
    });

    it('should not render zoomControl if feature_map_disable_pan_zoom is true', function(done) {
      scope.$on('render:complete', function() {
        expect($('.leaflet-control-zoom').length).to.equal(0);
        done();
      });

      createFeatureMap();
    });
  });
});
