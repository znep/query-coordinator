describe('A Choropleth Card Visualization', function() {
  'use strict';

  var provide;
  var testHelpers;
  var serverConfig;
  var rootScope;
  var templateCache;
  var compile;
  var scope;
  var Model;
  var Constants;
  var I18n;
  var q;
  var timeout;
  var CardVisualizationChoroplethHelpers;
  var CardDataService;
  var testTimeoutScheduler;
  var normalTimeoutScheduler;
  var mockCardDataService;

  var testWards = 'karma/dataCards/test-data/cardVisualizationChoroplethTest/ward_geojson.json';
  var testAggregates = 'karma/dataCards/test-data/cardVisualizationChoroplethTest/geo_values.json';
  var testAggregatesWhere = 'karma/dataCards/test-data/cardVisualizationChoroplethTest/geo_values_where.json';
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

      setMockCardDataServiceToDefault();
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
    CardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
    CardDataService = $injector.get('CardDataService');
    Constants = $injector.get('Constants');
    I18n = $injector.get('I18n');
    Constants.DISABLE_LEAFLET_ZOOM_ANIMATION = true;
    testTimeoutScheduler = new Rx.TestScheduler();
    normalTimeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testTimeoutScheduler;
  }));

  afterEach(function() {
    Rx.Scheduler.timeout = normalTimeoutScheduler;
    testHelpers.cleanUp();
    testHelpers.TestDom.clear();
  });

  function setMockCardDataServiceToDefault() {
    mockCardDataService = {
      getDefaultFeatureExtent: sinon.stub(),
      getChoroplethRegions: function() {
        var deferred = q.defer();
        var json = testHelpers.getTestJson(testWards);
        json.features = _.map(json.features, function(feature) {
          feature.properties._feature_id = feature.properties[':feature_id'].split(' ')[1];
          return feature;
        });

        deferred.resolve(json);
        return deferred.promise;
      },
      getChoroplethRegionsUsingSourceColumn: function() {
        var deferred = q.defer();
        var json = testHelpers.getTestJson(testWards);
        json.features = _.map(json.features, function(feature) {
          feature.properties._feature_id = feature.properties[':feature_id'].split(' ')[1];
          return feature;
        });

        deferred.resolve(json);
        return deferred.promise;
      },
      getChoroplethRegionMetadata: function() {
        var deferred = q.defer();
        deferred.resolve({
          geometryLabel: 'geometryLabel',
          featurePk: Constants.INTERNAL_DATASET_FEATURE_ID
        });
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
  }

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
    var datasetModel = options.datasetModel || false;
    var version = options.version || '1';
    var model = new Model();

    model.fieldName = 'points';
    model.defineObservableProperty('cardOptions', {mapExtent: options.mapExtent || {}});
    model.defineObservableProperty('cardSize', 1);
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');
    model.defineObservableProperty('computedColumn', 'ward');
    model.defineObservableProperty('cardType', 'choropleth');
    model.defineObservableProperty('customTitle', 'Cool Title');
    model.setOption = _.noop;

    if (!datasetModel) {
      var columnsData = {
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
    pageModel.defineEphemeralObservableProperty('hasExpandedCard', null);
    model.page = pageModel;

    var childScope = scope.$new();
    childScope.whereClause = whereClause;
    childScope.model = model;
    childScope.allowFilterChange = true;

    var html = '<card-visualization-choropleth id="{0}" model="model" allow-filter-change="allowFilterChange" where-clause="whereClause"></card-visualization-choropleth>'.format(id);
    var el = testHelpers.TestDom.compileAndAppend(html, childScope);

    // The choropleth throttles its renderer via Rx.throttle
    // Advance the scheduler to get it to render
    // Using advanceBy instead of advanceTo, since we test rendering multiple churros
    testTimeoutScheduler.advanceBy(500);

    return {
      element: el,
      scope: childScope
    };
  }

  describe('clear selection box', function() {

    var choropleth;
    var choroplethContainer;
    var feature;
    var selectionBox;
    var selectionBoxClearButton;
    var flyout;

    beforeEach(function() {
      choropleth = createChoropleth({}).element;
      choroplethContainer = choropleth.find('.choropleth-container');
      selectionBox = choropleth.find('.choropleth-selection-box');
      selectionBoxClearButton = selectionBox.find('.icon-close');
      feature = choropleth.find('.choropleth-container path')[0];
      flyout = $('#uber-flyout').hide();

      // Trigger a 'mouseenter' event on the choroplethContainer in order to
      // register all of our flyouts.
      choroplethContainer.trigger('mouseenter');
    });

    it('should be displayed if a region is filtered, and hidden if not', function() {

      // Selection box should be hidden on first render, for no filter has been applied
      expect(selectionBox.is(':hidden')).to.be.true;

      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      // Selection box should be visible because feature is filtered upon
      expect(selectionBox.is(':visible')).to.be.true;
    });

    it('should be hidden if a selected feature is clicked', function() {
      testHelpers.fireEvent(feature, 'click');
      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      expect(selectionBox.is(':hidden')).to.be.true;
    });

    it('should display a flyout on mouseover', function() {
      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      expect(flyout.is(':hidden')).to.be.true;

      testHelpers.fireEvent(selectionBox[0], 'mousemove');

      expect(flyout.is(':visible')).to.be.true;
    });

    it('should display a clear filter range flyout on mouseover of the "icon-close"', function() {
      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      expect(flyout.is(':hidden')).to.be.true;

      testHelpers.fireEvent(selectionBoxClearButton[0], 'mousemove');

      expect(flyout.is(':visible')).to.be.true;
      expect(flyout.find('.flyout-title').text()).to.equal(I18n.flyout.clearFilter);
    });

    it('should hide on click of the clear button', function() {
      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      expect(selectionBox.is(':visible')).to.be.true;

      testHelpers.fireEvent(selectionBoxClearButton[0], 'click');

      expect(selectionBox.is(':hidden')).to.be.true;
    });

    it('should hide on click of the box itself', function() {
      testHelpers.fireEvent(feature, 'click');
      timeout.flush();

      expect(selectionBox.is(':visible')).to.be.true;

      testHelpers.fireEvent(selectionBox[0], 'click');

      expect(selectionBox.is(':hidden')).to.be.true;
    });
  });

  describe('when created with instantiated choropleth visualizations', function() {

    it('should provide a flyout on hover with the current value, and row display unit on the first and second choropleth encountered', function() {

      this.timeout(15000);

      var firstChoropleth = createChoropleth({ id: 'choropleth-1' }).element;
      var secondChoropleth = createChoropleth({ id: 'choropleth-2' }).element;
      var firstChoroplethContainer = firstChoropleth.find('.choropleth-container');
      var secondChoroplethContainer = secondChoropleth.find('.choropleth-container');

      // Trigger a 'mouseenter' event on the choropleth containers in order to
      // register all of our flyouts.
      firstChoroplethContainer.trigger('mouseenter');
      secondChoroplethContainer.trigger('mouseenter');

      scope.$apply();

      var feature;
      var flyout;
      var flyoutTitle;

      // First, test a feature on the first choropleth.
      feature = $('#choropleth-1 .choropleth-container path')[0];

      testHelpers.fireEvent(feature, 'mousemove');

      flyout = $('#uber-flyout');
      flyoutTitle = flyout.find('.flyout-title').text();
      flyout.find('.content').text();

      expect(flyoutTitle).to.equal('');
      expect(flyout.is(':visible')).to.be.true;

      testHelpers.fireEvent(feature, 'mouseout');

      // Second, test a feature on the second choropleth.
      feature = $('#choropleth-2 .choropleth-container path')[1];

      expect(feature, 'Could not find second choropleth in DOM').to.be.ok;
      testHelpers.fireEvent(feature, 'mousemove');

      flyout = $('#uber-flyout');
      flyoutTitle = flyout.find('.flyout-title').text();
      flyout.find('.content').text();

      expect(flyoutTitle).to.equal('');
      expect(flyout.is(':visible')).to.be.true;

      testHelpers.fireEvent(feature, 'mouseout');
    });
  });

  describe('when created with mock choropleth visualizations', function() {

    // We don't need actual choropleth directives to be instantiated for any of
    // the following tests, so just mock it out.
    beforeEach(function() {
      testHelpers.mockDirective(provide, 'choropleth');
    });

    it('should not let click events leak', function() {

      var choropleth1Fired = false;
      var choropleth2Fired = false;

      var choropleth1 = createChoropleth({ id: 'choropleth-1' });
      var choropleth2 = createChoropleth({ id: 'choropleth-2' });

      choropleth1.scope.$on('toggle-dataset-filter:choropleth', function() {
        choropleth1Fired = true;
      });

      choropleth2.scope.$on('toggle-dataset-filter:choropleth', function() {
        choropleth2Fired = true;
      });

      // Simulate the event raised by clicking on a choropleth region
      var fakeFeature = { properties: {} };
      choropleth1.scope.$$childHead.$emit('toggle-dataset-filter:choropleth', fakeFeature);

      timeout.flush();

      expect(choropleth1Fired).to.equal(true);
      expect(choropleth2Fired).to.equal(false);

    });

    it("should not fail to extract the shapefile from the column's 'computationStrategy' object", function() {
      var columns = {
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
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        })
      }).to.not.throw();

    });

    it("should fail to extract the shapefile if the shapefile property does not exist in the column's 'computationStrategy' object", function() {
      var columns = {
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
          "physicalDatatype": "text",
          "computationStrategy": {
            "parameters": {
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          }
        }
      };

      var testSubject = createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '1'),
        version: '1'
      });

      expect(testSubject.scope.$$childHead.choroplethRenderError).to.equal(true);
    });

    describe('if the extent query used to get the choropleth regions fails', function() {

      beforeEach(function() {
        mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
          var deferred = q.defer();
          deferred.reject('Invalid extent response.');
          return deferred.promise;
        };
      });

      afterEach(function() {
        setMockCardDataServiceToDefault();
      });

      it("should display an error message", function() {
        var columns = {
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
        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        });

        expect(testSubject.scope.$$childHead.choroplethRenderError).to.equal(true);
      });
    });

    describe('if the dataset query used to get the shapefile labels fails', function() {

      beforeEach(function() {
        mockCardDataService.getChoroplethRegionMetadata = function() {
          var deferred = q.defer();
          deferred.reject('Shapefile does not exist.');
          return deferred.promise;
        }
      });

      afterEach(function() {
        setMockCardDataServiceToDefault();
      });

      it('should display an error message', function() {
        var columns = {
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
        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        });

        expect(testSubject.scope.$$childHead.choroplethRenderError).to.equal(true);
      });

    });

    it("should not use the source column to get the choropleth regions if the computation strategy is 'georegion_match_on_string'", function() {

      var columns = {
        "points": {
          "name": "source column.",
          "description": "required",
          "fred": "location",
          "physicalDatatype": "point"
        },
        "ward": {
          "name": "Some area where the crime was committed that can be described by a string",
          "description": "Batman has bigger fish to fry sometimes, you know.",
          "fred": "number",
          "physicalDatatype": "number",
          "computationStrategy": {
            "parameters": {
              "region": "_snuk-a5kv",
              "geometryLabel": "geoid10",
              "column": "someTextColumn"
            },
            "source_columns": ['computed_column_source_column'],
            "strategy_type": "georegion_match_on_string"
          }
        }
      };

      sinon.spy(CardDataService, 'getChoroplethRegions');
      sinon.spy(CardDataService, 'getChoroplethRegionsUsingSourceColumn');

      var choropleth = createChoropleth({
        id: 'choropleth-1',
        whereClause: '',
        testUndefined: false,
        datasetModel: createDatasetModelWithColumns(columns, '0'),
        version: '1'
      });

      expect(CardDataService.getChoroplethRegions.called).to.equal(true);
      expect(CardDataService.getChoroplethRegionsUsingSourceColumn.called).to.equal(false);
      expect(choropleth.scope.$$childHead.choroplethRenderError).to.equal(false);

      CardDataService.getChoroplethRegions.restore();
      CardDataService.getChoroplethRegionsUsingSourceColumn.restore();

    });

  });

  describe('extents', function() {
    var testExtent = {
      'southwest': [41.79998325207397, -87.85079956054688],
      'northeast': [41.95540515378059, -86.95953369140625]
    };

    it('uses the cardOptions.mapExtent if it has been saved', function() {
      var choropleth = createChoropleth({ mapExtent: testExtent });
      expect(choropleth.element.isolateScope().defaultExtent).to.be.undefined;
      expect(choropleth.element.isolateScope().savedExtent).to.eql(testExtent);
    });

    it('uses the default extent if it has been set and there is no saved mapExtent', function() {
      CardDataService.getDefaultFeatureExtent.returns(testExtent);
      var choropleth = createChoropleth({});
      expect(choropleth.element.isolateScope().defaultExtent).to.eql(testExtent);
      expect(choropleth.element.isolateScope().savedExtent).to.be.undefined;
    });

    it('defers to the choropleth visualization for extent if there is neither a saved nor default extent', function() {
      var choropleth = createChoropleth({});
      expect(choropleth.element.isolateScope().defaultExtent).to.be.undefined;
      expect(choropleth.element.isolateScope().savedExtent).to.be.undefined;
    });

  });

});
