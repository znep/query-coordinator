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

  function createChoropleth(id, whereClause) {

    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');

    var datasetModel = new Model();
    datasetModel.id = 'four-four';
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', rowDisplayUnit);
    // Note that although dataset columns come back from Phidippides as an array,
    // there is some internal mechanism in the Model that translates it into a
    // dictionary of the form "fieldName" : { ... }. This test data needs to
    // fake the second form since it (somehow?) seems to sidestep that transformation.
    datasetModel.defineObservableProperty('columns',
    {
      "ward": {
        "name": "ward",
        "title": "Ward where crime was committed.",
        "description": "Batman has bigger fish to fry sometimes, you know.",
        "logicalDatatype": "location",
        "physicalDatatype": "text",
        "importance": 2,
        "shapefile": "mash-apes"
      }
    });

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

  var choropleth1 = null;
  var choropleth2 = null;
  var rowDisplayUnit = 'crime';

  describe('when created', function() {

    it('should not let click events leak', function(done) {

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

      testHelpers.waitForSatisfy(function() {
        try {
          return $('#choropleth-1 .choropleth-container path').length > 0;
        } catch (e) {
          console.log(e);
        }
      }).then(function() {
        try {

        var feature = $('#choropleth-1 .choropleth-container path')[0];

        testHelpers.fireEvent(feature, 'click');

        timeout.flush();

        expect(choropleth1Fired).to.equal(true);
        expect(choropleth2Fired).to.equal(false);
        done();

        } catch (e) {
          console.log(e);
        }
      });

    });

    it('should provide a flyout on hover with the current value, and row display unit on the first and second choropleth encountered', function(done){

      this.timeout(15000);

      $('#choropleth-1').remove();
      $('#choropleth-2').remove();

      choropleth1 = createChoropleth('choropleth-1');
      choropleth2 = createChoropleth('choropleth-2');

      scope.$apply();

      testHelpers.waitForSatisfy(function() {
        try {
          return $('#choropleth-1 .choropleth-container path').length > 0 &&
                 $('#choropleth-2 .choropleth-container path').length > 0;
        } catch (e) {
          console.log(e);
        }
      }).then(function() {
        try {

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

          done();

        } catch (e) {
          console.log(e);
        }
      });

    });

  });


});

