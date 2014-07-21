describe("A Choropleth Card Visualization", function() {

  var testWards = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/ward_geojson.json';
  var testAggregates = 'karma-test/dataCards/test-data/cardVisualizationChoroplethTest/geo_values.json';
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module(testWards));
  beforeEach(module(testAggregates));

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
        getChoroplethAggregates: function(fieldName, datasetId, whereClause) {
          var deferred = q.defer();
          deferred.resolve(testHelpers.getTestJson(testAggregates));
          return deferred.promise;
        }
      }
      $provide.value('CardDataService', mockCardDataService);
    });
  });
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    templateCache = $injector.get('$templateCache');
    compile = $injector.get('$compile');
    scope = rootScope.$new();
    Model = $injector.get('Model');
    q = $injector.get('$q');
    timeout = $injector.get('$timeout');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var createChoropleth = function(id) {
    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('shapeFile', 'mash-apes');

    var datasetModel = new Model();
    datasetModel.id = "bana-nas!";
    datasetModel.defineObservableProperty('columns',
    [{
      "name": "ward",
      "title": "Ward where crime was committed.",
      "description": "Batman has bigger fish to fry sometimes, you know.",
      "logicalDatatype": "location",
      "physicalDatatype": "text",
      "importance": 2,
      "shapefileColumn": "ward"
    }]);

    var pageModel = new Model();
    pageModel.defineObservableProperty('dataset', datasetModel);
    model.page = pageModel;

    var childScope = scope.$new();
    childScope.whereClause = '';
    childScope.model = model;

    var html = '<card-visualization-choropleth id="'+id+'" model="model" where-clause="whereClause"></card-visualization-choropleth>';
    return {
      element: testHelpers.TestDom.compileAndAppend(html, childScope),
      scope: childScope,
      eventFired: false
    };
  }
  describe('when created', function() {
    it('should not let click events leak', function() {
      obj1 = createChoropleth("choro1");
      obj2 = createChoropleth("choro2");

      obj1.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        obj1.eventFired = true;
      });
      obj2.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        obj2.eventFired = true;
      });

      var el = obj1.element;

      testHelpers.fireMouseEvent($('#choro1 path')[0], 'click');
      timeout.flush();

      expect(obj1.eventFired).to.equal(true);
      expect(obj2.eventFired).to.equal(false);
    });
  });
});

