describe("A Choropleth Card Visualization", function() {

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

  var createChoropleth = function(id, whereClause) {
    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('shapeFile', 'mash-apes');

    var datasetModel = new Model();
    datasetModel.id = "bana-nas!";
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'crime');
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
    pageModel.defineObservableProperty('baseSoqlFilter', null);
    model.page = pageModel;

    var childScope = scope.$new();
    childScope.whereClause = whereClause;
    childScope.model = model;

    var html = '<card-visualization-choropleth id="{0}" model="model" where-clause="whereClause"></card-visualization-choropleth>'.format(id);
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
    it('should not allow the choropleth legend to update when expanded', function() {

      obj1 = createChoropleth('choropleth-1', '');
      obj1LegendLength = $('#choropleth-1 div.legend.leaflet-control > div.info-label').length;
      obj2 = createChoropleth('choropleth-2', "ward='10'");
      obj2LegendLength = $('#choropleth-2 div.legend.leaflet-control > div.info-label').length;

      expect(obj1LegendLength).to.equal(obj2LegendLength);

    });
  });
});

