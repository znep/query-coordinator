describe('A Choropleth Card Visualization', function() {
  var provide;
  var testHelpers;
  var serverConfig;
  var rootScope;
  var templateCache;
  var compile;
  var scope;
  var Model;
  var q;
  var timeout;
  var cardVisualizationChoroplethHelpers;
  var fakeClock = null;

  var testWards = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/ward_geojson.json';
  var testAggregates = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/geo_values.json';
  var testAggregatesWhere = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/geo_values_where.json';
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module(testWards));
  beforeEach(module(testAggregates));
  beforeEach(module(testAggregatesWhere));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards.services'));

  beforeEach(function() {
    module(function($provide) {
      provide = $provide;

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
        getChoroplethRegionsUsingSourceColumn: function(datasetId, sourceColumn, shapeFile) {
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
    cardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
    cardDataService = $injector.get('CardDataService');
  }));

  beforeEach(function() {
    fakeClock = sinon.useFakeTimers();
  });

  afterEach(function() {
    testHelpers.cleanUp();
    fakeClock.restore();

    fakeClock = null;
    testHelpers.TestDom.clear();
  });

  function createDatasetModelWithColumns(columns, version) {

    var datasetModel = new Model();

    // We also have to fake the reference each column now
    // has to its parent dataset.
    _.each(columns, function(column) {
      column.dataset = datasetModel;
    });

    datasetModel.id = 'four-four';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'crime');
    datasetModel.defineObservableProperty('columns', columns);
    datasetModel.version = version;

    return datasetModel;

  }

  function createChoropleth(options) {

    var id = options.id || 'choropleth-1';
    var whereClause = options.whereClause || '';
    var testUndefinedColumns = options.testUndefined || false;
    var datasetModel = options.datasetModel || false;
    var version = options.version || '1';


    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('cardSize', 1);
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');

    if (!datasetModel) {

      var columnsData;
      if (!testUndefinedColumns) {
        columnsData = {
          "points": {
            "name": "source column.",
            "description": "required",
            "fred": "location",
            "physicalDatatype": "point"
          },
          "ward": {
            "name": "Ward where crime was committed.",
            "description": "Batman has bigger fish to fry sometimes, you know.",
            "fred": "location",
            "physicalDatatype": "number",
            "computationStrategy": {
              "parameters": {
                "region": "_snuk-a5kv",
                "geometryLabel": "ward"
              },
              "source_columns": ['computed_column_source_column'],
              "strategy_type": "georegion_match_on_point"
            }
          }
        };
      }

      datasetModel = createDatasetModelWithColumns(columnsData, version);

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
      scope: childScope
    };
  }

  describe('when created with instantiated choropleth visualizations', function() {

    it('should provide a flyout on hover with the current value, and row display unit on the first and second choropleth encountered', function(){

      this.timeout(15000);

      var choropleth1 = createChoropleth({ id: 'choropleth-1' });
      var choropleth2 = createChoropleth({ id: 'choropleth-2' });

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

  });

  describe('when created with mock choropleth visualizations', function() {

    // We don't need actual choropleth directives to be instantiated for any of the following tests,
    // so just mock it out.
    beforeEach(function() {
      testHelpers.mockDirective(provide, 'choropleth');
    });

    it('should not let click events leak', function() {

      var choropleth1Fired = false;
      var choropleth2Fired = false;

      var choropleth1 = createChoropleth({ id: 'choropleth-1' });
      var choropleth2 = createChoropleth({ id: 'choropleth-2' });

      choropleth1.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choropleth1Fired = true;
      });

      choropleth2.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choropleth2Fired = true;
      });

      // Simulate the event raised by clicking on a choropleth region
      var fakeFeature = { properties: {} };
      choropleth1.scope.$$childHead.$emit('toggle-dataset-filter:choropleth', fakeFeature);

      timeout.flush();

      expect(choropleth1Fired).to.equal(true);
      expect(choropleth2Fired).to.equal(false);

    });

    it('should should not terminate with a TypeError if columns is undefined', function(){

      var testUndefinedColumns = true;

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefiend: testUndefinedColumns
        })
      }).to.not.throw();

    });

    it("should not fail to extract the shapeFile from the column's 'shapeFile' property if the metadataMigration is in phase 0", function() {

      testHelpers.overrideMetadataMigrationPhase('0');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text",
          // It is important that this gets converted into a shapefileHumanReadablePropertyName in
          // cardVisualizationChoropleth.js which matches the test fixture, so do not change this
          // until we either a) change the test fixture or b) remove the notion of
          // shapefileHumanReadablePropertyName all together.
          "shapefile": "snuk-a5kv"
        }
      };

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '0'),
          version: '0'
        })
      }).to.not.throw();

    });

    it("should fail to extract the shapeFile if the shapeFile property does not exist and the metadataMigration is in phase 0", function() {

      testHelpers.overrideMetadataMigrationPhase('0');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text"
        }
      };

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '0'),
          version: '0'
        })
      }).to.throw(
        'Dataset metadata column for computed georegion does not include shapeFile.'
      );

    });

    it("should not fail to extract the shapeFile from the column's 'computationStrategy' object if the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "region": "_snuk-a5kv",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          }
        }
      };

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '0'),
          version: '1'
        })
      }).to.not.throw();

      testHelpers.overrideMetadataMigrationPhase('2');

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        })
      }).to.not.throw();

    });

    it("should fail to extract the shapeFile if the shapeFile property does not exist in the column's 'computationStrategy' object and the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          }
        }
      };

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '0'),
          version: '1'
        })
      }).to.throw(
        'Dataset metadata column for computed georegion does not include shapeFile.'
      );

      testHelpers.overrideMetadataMigrationPhase('2');

      expect(function() {
        createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        })
      }).to.throw(
        'Dataset metadata column for computed georegion does not include shapeFile.'
      );

    });

    it("should not use the source column to get the choropleth regions if the source_columns property does not exist in the column's 'computationStrategy' object and the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "region": "_snuk-a5kv",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          }
        }
      };

      sinon.spy(cardVisualizationChoroplethHelpers, 'extractSourceColumnFromColumn');
      sinon.spy(cardDataService, 'getChoroplethRegions');
      sinon.spy(cardDataService, 'getChoroplethRegionsUsingSourceColumn');

      createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '0'),
        version: '1'
      });

      testHelpers.overrideMetadataMigrationPhase('2');

      createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '1'),
        version: '1'
      });

      expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn.calledTwice).to.equal(true);
      expect(cardDataService.getChoroplethRegions.calledTwice).to.equal(true);
      expect(cardDataService.getChoroplethRegionsUsingSourceColumn.called).to.equal(false);

      cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn.restore();
      cardDataService.getChoroplethRegions.restore();
      cardDataService.getChoroplethRegionsUsingSourceColumn.restore();

    });

    it("should use the source column to get the choropleth regions if the source_columns property exists in the column's 'computationStrategy' object and the metadataMigration is in phase 1 or 2", function() {

      testHelpers.overrideMetadataMigrationPhase('1');

      var columns = {
        "ward": {
          "name": "Ward where crime was committed.",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "location",
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "region": "_snuk-a5kv",
              "geometryLabel": "geoid10"
            },
            "source_columns": ['computed_column_source_column'],
            "strategy_type": "georegion_match_on_point"
          }
        }
      };

      sinon.spy(cardVisualizationChoroplethHelpers, 'extractSourceColumnFromColumn');
      sinon.spy(cardDataService, 'getChoroplethRegions');
      sinon.spy(cardDataService, 'getChoroplethRegionsUsingSourceColumn');

      createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '0'),
        version: '1'
      });

      testHelpers.overrideMetadataMigrationPhase('2');

      createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '1'),
        version: '1'
      });

      expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn.calledTwice).to.equal(true);
      expect(cardDataService.getChoroplethRegions.called).to.equal(false);
      expect(cardDataService.getChoroplethRegionsUsingSourceColumn.calledTwice).to.equal(true);

      cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn.restore();
      cardDataService.getChoroplethRegions.restore();
      cardDataService.getChoroplethRegionsUsingSourceColumn.restore();

    });

  });

});

