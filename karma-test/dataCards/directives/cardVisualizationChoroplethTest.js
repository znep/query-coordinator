describe('A Choropleth Card Visualization', function() {
  var testHelpers, serverConfig, rootScope, templateCache, compile, scope, Model, q, timeout;
  var fakeClock = null;
  var enableBoundingBoxes = true;

  var testWards = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/ward_geojson.json';
  var testAggregates = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/geo_values.json';
  var testAggregatesWhere = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/geo_values_where.json';
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module(testWards));
  beforeEach(module(testAggregates));
  beforeEach(module(testAggregatesWhere));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getChoroplethRegions: function(shapeFile) {
          var deferred = q.defer();
          var json = testHelpers.getTestJson(testWards);
          json.features = _.map(json.features, function(feature) {
            feature.properties._feature_id = feature.properties[':feature_id'].split(" ")[1]
            return feature;
          });

          deferred.resolve(json);
          return deferred.promise;
        },
        getData: function(fieldName, datasetId, whereClause) {
          var deferred = q.defer();
          if (whereClause) {
            deferred.resolve(testHelpers.getTestJson(testAggregatesWhere));
          } else {
            deferred.resolve(testHelpers.getTestJson(testAggregates));
          }
          return deferred.promise;
        }
      };
      $provide.value('CardDataService', mockCardDataService);
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    serverConfig = $injector.get('ServerConfig');
    rootScope = $injector.get('$rootScope');
    templateCache = $injector.get('$templateCache');
    compile = $injector.get('$compile');
    scope = rootScope.$new();
    Model = $injector.get('Model');
    q = $injector.get('$q');
    timeout = $injector.get('$timeout');
  }));

  after(function(){
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    fakeClock = sinon.useFakeTimers();
  });

  afterEach(function() {
    fakeClock.restore();
    fakeClock = null;
  });

  function createDatasetModelWithColumns(columns) {

    var datasetModel = new Model();

    datasetModel.id = 'four-four';
    datasetModel.defineObservableProperty('rowDisplayUnit', rowDisplayUnit);
    datasetModel.defineObservableProperty('columns', columns);

    return datasetModel;

  }

  function createChoropleth(id, whereClause, testUndefinedColumns, datasetModel) {

    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');

    if (!datasetModel) {

      var columnsData;
      // Note that although dataset columns come back from Phidippides as an array,
      // there is some internal mechanism in the Model that translates it into a
      // dictionary of the form "fieldName" : { ... }. This test data needs to
      // fake the second form since it (somehow?) seems to sidestep that transformation.
      if (!testUndefinedColumns) {
        columnsData = {
          "points": {
            "name": "points",
            "title": "source column.",
            "description": "required",
            "logicalDatatype": "location",
            "physicalDatatype": "point",
            "importance": 2
          },
          "ward": {
            "name": "ward",
            "title": "Ward where crime was committed.",
            "description": "Batman has bigger fish to fry sometimes, you know.",
            "logicalDatatype": "location",
            "physicalDatatype": "text",
            "importance": 2,
            // It is important that this gets converted into a shapefileHumanReadablePropertyName in
            // cardVisualizationChoropleth.js which matches the test fixture, so do not change this
            // until we either a) change the test fixture or b) remove the notion of
            // shapefileHumanReadablePropertyName all together.
            "shapefile": "snuk-a5kv"
          }
        };
      }

      datasetModel = createDatasetModelWithColumns(columnsData);

    }

    var pageModel = new Model();
    pageModel.defineObservableProperty('dataset', datasetModel);
    pageModel.defineObservableProperty('baseSoqlFilter', null);
    pageModel.defineObservableProperty('aggregation', {
      'function': 'count',
      'column': 'ward',
      'unit': 'aWardDisplayUnit'
    });
    model.page = pageModel;

    var childScope = scope.$new();
    childScope.whereClause = whereClause;
    childScope.model = model;

    var html = '<card-visualization-choropleth id="{0}" model="model" where-clause="whereClause"></card-visualization-choropleth>'.format(id);
    var el = testHelpers.TestDom.compileAndAppend(html, childScope);

    // The choropleth throttles its renderer.
    // Lie to it that enough time has passed, so it renders now.
    fakeClock.tick(500);

    return {
      element: el,
      scope: childScope,
      eventFired: false
    };
  }

  var choropleth1 = null;
  var choropleth2 = null;
  var rowDisplayUnit = 'crime';

  describe('when created', function() {

    it('should not let click events leak', function() {

      this.timeout(15000);

      var choropleth1Fired = false;
      var choropleth2Fired = false;

      $('#choropleth-1').remove();
      $('#choropleth-2').remove();

      choropleth1 = createChoropleth('choropleth-1');
      choropleth2 = createChoropleth('choropleth-2');

      choropleth1.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choropleth1Fired = true;
      });

      choropleth2.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choropleth2Fired = true;
      });

      var feature = $('#choropleth-1 .choropleth-container path')[0];

      testHelpers.fireEvent(feature, 'click');

      timeout.flush();

      expect(choropleth1Fired).to.equal(true);
      expect(choropleth2Fired).to.equal(false);

    });

    it('should provide a flyout on hover with the current value, and row display unit on the first and second choropleth encountered', function(){

      this.timeout(15000);

      $('#choropleth-1').remove();
      $('#choropleth-2').remove();

      choropleth1 = createChoropleth('choropleth-1');
      choropleth2 = createChoropleth('choropleth-2');

      scope.$apply();

      var feature;
      var flyout;
      var flyoutTitle;
      var flyoutText;

      // First, test a feature on the first choropleth.
      feature = $('#choropleth-1 .choropleth-container path')[0];

      testHelpers.fireEvent(feature, 'mousemove');

      flyout = $('#uber-flyout');
      flyoutTitle = flyout.find('.flyout-title').text();
      flyoutText = flyout.find('.content').text();

      expect(flyoutTitle).to.equal('4');
      expect(flyout.is(':visible')).to.be.true;

      testHelpers.fireEvent(feature, 'mouseout');

      // Second, test a feature on the second choropleth.
      feature = $('#choropleth-2 .choropleth-container path')[1];

      testHelpers.fireEvent(feature, 'mousemove');

      flyout = $('#uber-flyout');
      flyoutTitle = flyout.find('.flyout-title').text();
      flyoutText = flyout.find('.content').text();

      expect(flyoutTitle).to.equal('33');
      expect(flyout.is(':visible')).to.be.true;

      testHelpers.fireEvent(feature, 'mouseout');

    });

    it('should should not terminate with a TypeError if enableBoundingBoxes is true and columns is undefined', function(){

      serverConfig.override('enableBoundingBoxes', true);

      $('#choropleth-1').remove();
      $('#choropleth-2').remove();

      var testUndefinedColumns = true;

      expect(function() { createChoropleth('choropleth-1', '', testUndefinedColumns) }).to.not.throw();

    });

    it('should should not terminate with a TypeError if enableBoundingBoxes is false and columns is undefined', function(){

      serverConfig.override('enableBoundingBoxes', false);

      $('#choropleth-1').remove();
      $('#choropleth-2').remove();

      var testUndefinedColumns = true;

      expect(function() { createChoropleth('choropleth-1', '', testUndefinedColumns) }).to.not.throw();

    });

    it("should not fail to extract the shapeFile from the column's 'shapeFile' property if the metadataMigration is in phase 0", function() {

      testHelpers.overrideMetadataMigrationPhase('0');

      $('#choropleth-1').remove();

      var columns = {
        "ward": {
          "name": "ward",
          "title": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "logicalDatatype": "location",
          "physicalDatatype": "text",
          "importance": 2,
          // It is important that this gets converted into a shapefileHumanReadablePropertyName in
          // cardVisualizationChoropleth.js which matches the test fixture, so do not change this
          // until we either a) change the test fixture or b) remove the notion of
          // shapefileHumanReadablePropertyName all together.
          "shapefile": "snuk-a5kv"
        }
      };

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.not.throw();

    });

    it("should fail to extract the shapeFile if the shapeFile property does not exist and the metadataMigration is in phase 0", function() {

      testHelpers.overrideMetadataMigrationPhase('0');

      $('#choropleth-1').remove();

      var columns = {
        "ward": {
          "name": "ward",
          "title": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "logicalDatatype": "location",
          "physicalDatatype": "text",
          "importance": 2
        }
      };

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.throw();

    });

    it("should not fail to extract the shapeFile from the column's 'computationStrategy' object if the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      $('#choropleth-1').remove();

      var columns = {
        "ward": {
          "name": "ward",
          "title": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "logicalDatatype": "location",
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "region": "_snuk-a5kv",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          },
          // It is important that this gets converted into a shapefileHumanReadablePropertyName in
          // cardVisualizationChoropleth.js which matches the test fixture, so do not change this
          // until we either a) change the test fixture or b) remove the notion of
          // shapefileHumanReadablePropertyName all together.
          "shapefile": "snuk-a5kv"
        }
      };

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.not.throw();

      testHelpers.overrideMetadataMigrationPhase('2');

      $('#choropleth-1').remove();

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.not.throw();

    });

    it("should fail to extract the shapeFile if the shapeFile property does not exist in the column's 'computationStrategy' object and the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      $('#choropleth-1').remove();

      var columns = {
        "ward": {
          "name": "ward",
          "title": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "logicalDatatype": "location",
          "physicalDatatype": "text",
          // It is important that this gets converted into a shapefileHumanReadablePropertyName in
          // cardVisualizationChoropleth.js which matches the test fixture, so do not change this
          // until we either a) change the test fixture or b) remove the notion of
          // shapefileHumanReadablePropertyName all together.
          "shapefile": "snuk-a5kv"
        }
      };

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.throw();

      testHelpers.overrideMetadataMigrationPhase('2');

      $('#choropleth-1').remove();

      expect(function() { createChoropleth('choropleth-1', '', false, createDatasetModelWithColumns(columns)) }).to.throw();

    });

  });

});

