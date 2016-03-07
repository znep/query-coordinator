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
  var testJson = 'karma/dataCards/test-data/featureMapTest/featureMapTestData.json';
  var protocolBufferEndpointResponses = 'karma/dataCards/test-data/featureMapTest/protocolBufferEndpointResponses.json';
  var VectorTileDataService;
  var FeatureMapService;
  var testTimeoutScheduler;
  var normalTimeoutScheduler;

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('dataCards/feature-map.scss'));

  beforeEach(function() {
    angular.mock.module(function($provide, $controllerProvider) {

      mockWindowStateService = {};
      mockWindowStateService.scrollPosition$ = new Rx.Subject();
      mockWindowStateService.windowSize$ = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressed$ = new Rx.Subject();
      mockWindowStateService.mousePosition$ = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);

      $controllerProvider.register('FeatureMapController', _.noop);
    });

    testTimeoutScheduler = new Rx.TestScheduler();
    normalTimeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testTimeoutScheduler;
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
    FeatureMapService = $injector.get('FeatureMapService');
  }));

  afterEach(function() {
    removeFeatureMap();
    Rx.Scheduler.timeout = normalTimeoutScheduler;
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
      vectorTileGetter: qVectorTileGetter
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

    var el = testHelpers.TestDom.compileAndAppend(html, scope);

    // Advance the Rx scheduler for dimension de-bouncing
    testTimeoutScheduler.advanceTo(500);

    return el;
  }

  function removeFeatureMap() {
    $('#test-feature-map').remove();
    $('#alternate-test-feature-map').remove();
    $('#uber-flyout').hide();
  }

  describe('visualization rendering', function() {
    it('should not render the map if the bounds are undefined', function() {
      featureExtent = undefined;
      var fm = createFeatureMap();
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);
    });

    it('should not render the map if the height of the element is zero', function() {
      var fm = createFeatureMap({height: 0});
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);
    });

    it('should not render the map if the width of the element is zero', function() {
      var fm = createFeatureMap({width: 0});
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);
    });

    it('should not render when vectorTileGetter is not set', function() {
      var fm = createFeatureMap({ vectorTileGetter: null });
      expect(fm.find('.leaflet-tile-loaded').length).to.equal(0);
    });

    it('renders', function() {
      var fm = createFeatureMap();
      expect(fm.find('.leaflet-tile-loaded')).to.have.length.above(1);
    });

    it('should emit render:start and render:complete events appropriately and in the correct order', function(done) {
      var renderEvents = scope.$eventToObservable('render:start').merge(scope.$eventToObservable('render:complete'));

      renderEvents.take(2).toArray().subscribe(function(events) {
        // Visualization id is a string and is the same across events.
        expect(events[0].additionalArguments[0].source).to.satisfy(_.isString);
        expect(events[1].additionalArguments[0].source).to.equal(events[0].additionalArguments[0].source);

        // Times are ints and are in order.
        expect(events[0].additionalArguments[0].timestamp).to.satisfy(_.isFinite);
        expect(events[1].additionalArguments[0].timestamp).to.satisfy(_.isFinite);

        expect(events[0].additionalArguments[0].timestamp).to.be.below(events[1].additionalArguments[0].timestamp);

        done();
      });

      var fm = createFeatureMap();
      var visualizationElement = fm.find('.feature-map');

      // We are triggering these events directly on the visualization element to
      // verify the directive responds to those events appropriately and to avoid
      // dealing with the inner-workings of the frontend-visualization implementation.
      // TODO: Update this test when we can stub frontend-visualization entirely in tests.
      visualizationElement.trigger('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START');
      visualizationElement.trigger('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE');
    });
  });

  it('emits the appropriate event when extents change', function(done) {
    scope.$on('set-extent', function(event) {
      done();
    });

    var element = createFeatureMap();
    var featureMapContainer = element.find('.feature-map-container')[0];

    testHelpers.fireEvent(
      featureMapContainer,
      'SOCRATA_VISUALIZATION_FEATURE_MAP_EXTENT_CHANGE',
      { detail: 'new extents' }
    );
  });
});
