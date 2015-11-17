describe('Choropleth', function() {
  'use strict';

  var rootScope;
  var scope;
  var testHelpers;
  var timeout;
  var Constants;
  var $controllerProvider;
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#uber-flyout';
  var selectionBoxSelector = '.choropleth-selection-box';
  var testTimeoutScheduler;
  var normalTimeoutScheduler;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards/choropleth.scss'));
  beforeEach(module('/angular_templates/dataCards/choropleth.html'));

  beforeEach(module(function($controllerProvider) {
    $controllerProvider.register('ChoroplethController', _.noop);
  }));

  beforeEach(function() {
    testTimeoutScheduler = new Rx.TestScheduler();
    normalTimeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testTimeoutScheduler;
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    Constants = $injector.get('Constants');
    Constants.DISABLE_LEAFLET_ZOOM_ANIMATION = true;
  }));

  afterEach(function() {
    Rx.Scheduler.timeout = normalTimeoutScheduler;
    testHelpers.TestDom.clear();
  });

  var testData = {
    type: 'FeatureCollection',
    features: [
      {
        type: "Feature",
        properties: {
          __SOCRATA_FILTERED_VALUE__: 2,
          __SOCRATA_HUMAN_READABLE_NAME__: "Some Cool Place",
          __SOCRATA_UNFILTERED_VALUE__: 2,
          __SOCRATA_FEATURE_SELECTED__: false
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [122.3505,23.9772],[122.6005,24.7272],[122.8505,23.9772],
            [122.1005,24.4772],[123.1005,24.5272],[122.3505,23.9772]
          ]]
        }
      }
    ],
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84"
      }
    }
  };

  var selectedTestData = _.cloneDeep(testData);
  selectedTestData.features[0].properties.__SOCRATA_FEATURE_SELECTED__ = true;


  var template = [
    '<div class="card-visualization">',
    '<choropleth base-layer-url="baseLayerUrl" ',
    'geojson-aggregate-data="geojsonAggregateData" ',
    'row-display-unit="rowDisplayUnit" ',
    'style="height: 400px; display: block;">',
    '</choropleth>',
    '</div>'
  ].join('');

  function createChoropleth(scopeData) {
    scopeData = _.merge({
      allowFilterChange: true,
      baseLayerUrl: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      rowDisplayUnit: 'crimes',
      stops: 'continuous'
    }, scopeData);

    var scope = rootScope.$new();
    _.assign(scope, scopeData);

    var el = testHelpers.TestDom.compileAndAppend(template, scope);

    // Advance the Rx scheduler for dimension de-bouncing
    testTimeoutScheduler.advanceTo(500);

    return el;
  }

  describe('flyouts', function() {
    it('should display regular flyout on hover', function() {
      createChoropleth({ geojsonAggregateData: testData });

      var flyout = $('#uber-flyout');
      var feature = $(featureGeometrySelector).get(0);

      expect(flyout).to.not.be.visible;
      testHelpers.fireMouseEvent(feature, 'mousemove');
      expect(flyout).to.be.visible;

      expect(flyout.find('.flyout-row').length).to.equal(1);
    });

    it('should display filtered flyout on hover', function() {
      var scopeData = {
        geojsonAggregateData: testData,
        isFiltered: true
      };
      createChoropleth(scopeData);

      var flyout = $('#uber-flyout');
      var feature = $(featureGeometrySelector).get(0);

      expect(flyout).to.not.be.visible;
      testHelpers.fireMouseEvent(feature, 'mousemove');
      expect(flyout).to.be.visible;

      expect(flyout.find('.flyout-row .emphasis').length).to.equal(2);
    });

    it('should display selected feature flyout on hover', function() {
      createChoropleth({ geojsonAggregateData: selectedTestData });

      var flyout = $('#uber-flyout');
      var feature = $(featureGeometrySelector).get(0);

      expect(flyout).to.not.be.visible;
      testHelpers.fireMouseEvent(feature, 'mousemove');
      expect(flyout).to.be.visible;
      expect(flyout.find('.flyout-row .is-selected').length).to.equal(2);
    });
  });

  describe('allowFilterChange is true', function() {
    describe('selection box', function() {
      it('should not display selection box when no features are selected', function() {
        createChoropleth({ geojsonAggregateData: testData });
        var selectionBox = $(selectionBoxSelector);

        expect(selectionBox).to.not.be.visible;
      });

      it('should display selection box when a feature selected', function() {
        createChoropleth({ geojsonAggregateData: selectedTestData });
        var selectionBox = $(selectionBoxSelector);

        expect(selectionBox).to.be.visible;
      });

      it('should display flyout on hover', function() {
        createChoropleth({ geojsonAggregateData: selectedTestData });
        var selectionBox = $(selectionBoxSelector);
        var flyout = $('#uber-flyout');

        expect(flyout).to.not.be.visible;
        testHelpers.fireMouseEvent(selectionBox[0], 'mousemove');
        expect(flyout).to.be.visible;
      });
    });
  });

  describe('allowFilterChange is false', function() {
    it('should not display selection box when filters present', function() {
      var scopeData = {
        allowFilterChange: false,
        geojsonAggregateData: selectedTestData
      };
      createChoropleth(scopeData);
      var selectionBox = $(selectionBoxSelector);

      expect(selectionBox).to.not.be.visible;
    });
  });
});
