describe("A Choropleth Card Visualization", function() {
  var testHelpers, rootScope, templateCache, compile, scope, Model, q, timeout;

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

  after(function(){
    testHelpers.TestDom.clear();
  });

  var rowDisplayUnit = 'crime';

  var createChoropleth = function(id, whereClause) {
    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('shapeFile', 'mash-apes');
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');

    var datasetModel = new Model();
    datasetModel.id = "bana-nas!";
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', rowDisplayUnit);
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
    var choro1 = null;
    var choro2 = null;
    var ensureChoroplethsCreated = _.once(function() {
      if (choro1 && choro2) {
        return;
      }
      choro1 = createChoropleth('choropleth-1');
      choro2 = createChoropleth('choropleth-2');
    });

    it('should not let click events leak', function() {

      var choro1Fired = false;
      var choro2Fired = false;

      ensureChoroplethsCreated();

      choro1.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choro1Fired = true;
      });
      choro2.scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
        choro2Fired = true;
      });

      testHelpers.waitForSatisfy(function() {
        return $('#choropleth-1 .choropleth-container path').length > 0;
      }).then(function() {
        testHelpers.fireMouseEvent($('#choropleth-1 .choropleth-container path')[0], 'click');
        expect(choro1Fired).to.equal(true);
        expect(choro2Fired).to.equal(false);
      });

    });

    it('should provide a flyout on hover with the current value, and row display unit', function(done){
      ensureChoroplethsCreated();

      testHelpers.waitForSatisfy(function() {
        return $('#choropleth-1 .choropleth-container path').length > 0;
      }).then(function() {
        var feature = $('#choropleth-1 .choropleth-container path')[0];
        testHelpers.fireMouseEvent(feature, 'mouseover');
        testHelpers.fireMouseEvent(feature, 'mousemove');

        var $flyout = $('#choropleth-flyout');

        var flyoutText = $flyout.text();
        expect($flyout.is(':visible')).to.equal(true);
        expect(( new RegExp(rowDisplayUnit.pluralize()) ).test(flyoutText)).to.equal(true);
        done();

      });

    });
  });
});

