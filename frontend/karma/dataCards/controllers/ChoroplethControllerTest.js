import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');
const Rx = require('rx');

describe('ChoroplethController', function() {
  'use strict';

  var provide;
  var testHelpers;
  var rootScope;
  var templateCache;
  var compile;
  var scope;
  var Model;
  var Constants;
  var ViewRights;
  var I18n;
  var q;
  var timeout;
  var CardVisualizationChoroplethHelpers;
  var CardDataService;
  var testTimeoutScheduler;
  var normalTimeoutScheduler;
  var mockCardDataService;
  var $controller;
  var SpatialLensService;
  var $window;

  var testWards = require('../test-data/cardVisualizationChoroplethTest/ward_geojson.json');
  var testAggregates = require('../test-data/cardVisualizationChoroplethTest/geo_values.json');
  var testAggregatesWhere = require('../test-data/cardVisualizationChoroplethTest/geo_values_where.json');

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      provide = $provide;

      setMockCardDataServiceToDefault();
      $provide.value('CardDataService', mockCardDataService);
      $provide.value('$element', $('<div>'));
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
    CardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
    CardDataService = $injector.get('CardDataService');
    Constants = $injector.get('Constants');
    ViewRights = $injector.get('ViewRights');
    I18n = $injector.get('I18n');
    $controller = $injector.get('$controller');
    SpatialLensService = $injector.get('SpatialLensService');
    $window = $injector.get('$window');
    Constants.DISABLE_LEAFLET_ZOOM_ANIMATION = true;
    testTimeoutScheduler = new Rx.TestScheduler();
    normalTimeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testTimeoutScheduler;
    testHelpers.mockDirective(provide, 'choropleth');

    sinon.stub(SpatialLensService, 'getCuratedRegions').callsFake(_.constant(Promise.resolve([])));
  }));

  afterEach(function() {
    Rx.Scheduler.timeout = normalTimeoutScheduler;
    testHelpers.cleanUp();
    testHelpers.TestDom.clear();

    SpatialLensService.getCuratedRegions.restore();
  });

  function setMockCardDataServiceToDefault() {
    mockCardDataService = {
      getDefaultFeatureExtent: sinon.stub(),
      getChoroplethRegions: function() {
        var deferred = q.defer();
        var json = JSON.parse(JSON.stringify(testWards));
        json.features = _.map(json.features, function(feature) {
          feature.properties._feature_id = feature.properties[':feature_id'].split(' ')[1];
          return feature;
        });

        deferred.resolve(json);
        return deferred.promise;
      },
      getChoroplethRegionsUsingSourceColumn: function() {
        var deferred = q.defer();
        var json = JSON.parse(JSON.stringify(testWards));
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
          deferred.resolve(_.clone(testAggregatesWhere));
        } else {
          deferred.resolve(_.clone(testAggregates));
        }
        return deferred.promise;
      }
    };
  }

  function createDatasetModelWithColumns(columns, version, rights) {

    var datasetModel = new Model();

    // We also have to fake the reference each column now
    // has to its parent dataset.
    _.each(columns, function(column) {
      column.dataset = datasetModel;
    });

    datasetModel.id = 'four-four';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'crime');
    datasetModel.defineObservableProperty('permissions', {isPublic: true, rights: rights || [ViewRights.WRITE]});
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

    var mapExtent = new Model();
    mapExtent.defineObservableProperty('mapExtent', options.mapExtent);

    model.fieldName = 'points';
    model.defineObservableProperty('cardOptions', mapExtent);
    model.defineObservableProperty('cardSize', 1);
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('baseLayerUrl', 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png');
    model.defineObservableProperty('computedColumn', options.computedColumn || 'ward');
    model.defineObservableProperty('cardType', 'choropleth');
    model.defineObservableProperty('customTitle', 'Cool Title');
    model.defineObservableProperty('aggregation', {
      'function': 'count',
      'column': 'ward',
      'unit': 'aWardDisplayUnit'
    });
    model.setOption = _.noop;

    if (!datasetModel) {
      var columnsData = {
        points: {
          name: 'source column.',
          description: 'required',
          physicalDatatype: 'point'
        },
        ward: {
          name: 'Ward where crime was committed.',
          description: 'Batman has bigger fish to fry sometimes, you know.',
          physicalDatatype: 'number',
          computationStrategy: {
            parameters: {
              region: '_snuk-a5kv',
              geometryLabel: 'ward'
            },
            source_columns: ['computed_column_source_column'],
            strategy_type: 'georegion_match_on_point'
          }
        }
      };

      datasetModel = createDatasetModelWithColumns(columnsData, version);
    }

    var pageModel = new Model();
    pageModel.defineObservableProperty('dataset', datasetModel);
    pageModel.defineObservableProperty('baseSoqlFilter', null);
    pageModel.defineEphemeralObservableProperty('hasExpandedCard', null);
    model.page = pageModel;

    var childScope = scope.$new();
    childScope.whereClause = whereClause;
    childScope.model = model;
    childScope.allowFilterChange = true;

    $('body').remove('.cards-content');
    $('body').append('<div class="cards-content"></div>');
    $('.cards-content').append('<div id="choropleth"></div>');
    var $element = $('#choropleth');

    $controller('ChoroplethController', { $scope: childScope, $element: $element });

    return {
      $scope: childScope
    };
  }

  describe('when the computed column is missing', function() {
    var newColumns = { fakeColumn: {} };

    beforeEach(function() {
      sinon.stub(SpatialLensService, 'getRegionCodingStatus');
      sinon.stub(SpatialLensService, 'pollRegionCodingStatus');
    });

    afterEach(function() {
      SpatialLensService.getRegionCodingStatus.restore();
      SpatialLensService.pollRegionCodingStatus.restore();
    });

    function verifyNewColumnsWereAdded(dataset) {
      var columns = dataset.getCurrentValue('columns');
      expect(Object.keys(columns)).to.deep.equal(['fakeColumn']);
    }

    describe('when an existing region coding job has already completed', function() {
      it('sets the new column metadata with the region coding job response and does not attempt any region coding or polling', function() {
        SpatialLensService.getRegionCodingStatus.returns(Rx.Observable.just({
          data: {
            success: true,
            status: 'completed',
            datasetMetadata: { columns: newColumns }
          }
        }));

        var choropleth = createChoropleth({ computedColumn: 'fakeColumn' });

        expect(SpatialLensService.getRegionCodingStatus.callCount).to.equal(1);
        expect(SpatialLensService.pollRegionCodingStatus.callCount).to.equal(0);

        verifyNewColumnsWereAdded(choropleth.$scope.model.page.getCurrentValue('dataset'));
      });
    });

    describe('when an existing region coding job has failed', function() {
      it('shows an error', function() {
        SpatialLensService.getRegionCodingStatus.returns(Rx.Observable.just({
          data: {
            success: false,
            status: 'failed',
          }
        }));
        expect(_.partial(createChoropleth, { computedColumn: 'theLimitDoesNotExist' })).to.throw();
        delete $window.currentUser;
      });
    });

    describe('when an existing region coding job is in progress', function() {
      it('polls the status of that job', function() {
        SpatialLensService.getRegionCodingStatus.returns(Rx.Observable.just({
          data: {
            success: true,
            status: 'processing'
          }
        }));

        SpatialLensService.pollRegionCodingStatus.returns(Rx.Observable.just({
          data: {
            success: true,
            status: 'completed',
            datasetMetadata: { columns: newColumns }
          }
        }));

        var choropleth = createChoropleth({ computedColumn: 'fakeColumn' });

        expect(SpatialLensService.getRegionCodingStatus.callCount).to.equal(1);
        expect(SpatialLensService.pollRegionCodingStatus.callCount).to.equal(1);

        verifyNewColumnsWereAdded(choropleth.$scope.model.page.getCurrentValue('dataset'));
      });
    });
  });

  // TODO migrate these to cheetah
  xdescribe('when created with instantiated choropleth visualizations', function() {

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
      assert.isTrue(flyout.is(':visible'));

      testHelpers.fireEvent(feature, 'mouseout');

      // Second, test a feature on the second choropleth.
      feature = $('#choropleth-2 .choropleth-container path')[1];

      assert.ok(feature, 'Could not find second choropleth in DOM');
      testHelpers.fireEvent(feature, 'mousemove');

      flyout = $('#uber-flyout');
      flyoutTitle = flyout.find('.flyout-title').text();
      flyout.find('.content').text();

      expect(flyoutTitle).to.equal('');
      assert.isTrue(flyout.is(':visible'));

      testHelpers.fireEvent(feature, 'mouseout');
    });
  });

  describe('when created with mock choropleth visualizations', function() {
    it('should not let click events leak', function() {

      var choropleth1Fired = false;
      var choropleth2Fired = false;

      var choropleth1 = createChoropleth({ id: 'choropleth-1' });
      var choropleth2 = createChoropleth({ id: 'choropleth-2' });

      choropleth1.$scope.$on('toggle-dataset-filter:choropleth', function() {
        choropleth1Fired = true;
      });

      choropleth2.$scope.$on('toggle-dataset-filter:choropleth', function() {
        choropleth2Fired = true;
      });

      // Simulate the event raised by clicking on a choropleth region
      var fakeFeature = { properties: {} };
      choropleth1.$scope.$emit('toggle-dataset-filter:choropleth', fakeFeature);

      timeout.flush();

      expect(choropleth1Fired).to.equal(true);
      expect(choropleth2Fired).to.equal(false);

    });

    it('should not fail to extract the shapefile from the column\'s "computationStrategy" object', function() {
      var columns = {
        points: {
          name: 'source column.',
          description: 'required',
          physicalDatatype: 'point',
        },
        ward: {
          name: 'Ward where crime was committed.',
          description: 'Batman has bigger fish to fry sometimes, you know.',
          physicalDatatype: 'text',
          computationStrategy: {
            parameter: {
              region: '_snuk-a5kv',
              geometryLabel: 'geoid10'
            },
            strategy_type: 'georegion_match_on_point'
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

    it('should fail to extract the shapefile if the shapefile property does not exist in the column\'s "computationStrategy" object', function() {
      var columns = {
        points: {
          name: 'source column.',
          description: 'required',
          physicalDatatype: 'point'
        },
        ward: {
          name: 'Ward where crime was committed.',
          description: 'Batman has bigger fish to fry sometimes, you know.',
          physicalDatatype: 'text',
          computationStrategy: {
            parameters: {
              geometryLabel: 'geoid10'
            },
            strategy_type: 'georegion_match_on_point'
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

      expect(testSubject.$scope.choroplethRenderError).to.equal(true);
    });

    describe('if there are no available boundaries', function() {
      afterEach(function() {
        SpatialLensService.getAvailableGeoregions$.restore();
      });

      it('should display an error message when no boundaries are enabled', function() {
        sinon.stub(SpatialLensService, 'getAvailableGeoregions$').callsFake(function() {
          return Rx.Observable.of([]);
        });

        var columns = {
          points: {
            name: 'source column.',
            description: 'required',
            physicalDatatype: 'point'
          },
          ward: {
            name: 'Ward where crime was committed.',
            description: 'Batman has bigger fish to fry sometimes, you know.',
            physicalDatatype: 'text'
          }
        };
        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        });

        expect(testSubject.$scope.choroplethRenderError).to.equal(true);
      });

      // in this scenario, an enabled boundary is not accessible due to a lack of write permissions,
      // meaning that the user cannot perform async region coding.
      it('should display an error message when boundaries are not accessible due to insufficient permissions', function() {
        sinon.stub(SpatialLensService, 'getAvailableGeoregions$').callsFake(function() {
          var region = {
            enabledFlag: true,
            id: 1,
            uid: 'geor-ejun',
            name: 'My Boundary',
            view: { id: 'geor-ejun' }
          };
          return Rx.Observable.of([region]);
        });

        var columns = {
          points: {
            name: 'source column.',
            description: 'required',
            physicalDatatype: 'point'
          },
          ward: {
            name: 'Ward where crime was committed.',
            description: 'Batman has bigger fish to fry sometimes, you know.',
            physicalDatatype: 'text'
          }
        };
        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1', []),
          version: '1'
        });

        expect(testSubject.$scope.choroplethRenderError).to.equal(true);
      });
    });

    describe('if the extent query used to get the choropleth regions fails', function() {
      var columns;

      beforeEach(function() {
        columns = {
          'points': {
            'name': 'source column.',
            'description': 'required',
            'physicalDatatype': 'point'
          },
          'ward': {
            'name': 'Ward where crime was committed.',
            'description': 'Batman has bigger fish to fry sometimes, you know.',
            'physicalDatatype': 'text',
            'computationStrategy': {
              'parameters': {
                'region': '_snuk-a5kv',
                'geometryLabel': 'geoid10'
              },
              'source_columns': ['computed_column_source_column'],
              'strategy_type': 'georegion_match_on_point'
            }
          }
        };

      });

      afterEach(function() {
        setMockCardDataServiceToDefault();
      });

      it('should display a cardinality error message when cardinality error detected', function() {
        mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
          var deferred = q.defer();
          deferred.reject({ message: 'Invalid extent response.', type: 'cardinalityError' });
          return deferred.promise;
        };

        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        });

        expect(testSubject.$scope.hasCardinalityError).to.equal(true);
      });

      it('should display a generic error message when non-cardinality error detected', function() {
        mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
          var deferred = q.defer();
          deferred.reject({ message: 'Invalid extent response.', type: 'extentError' });
          return deferred.promise;
        };

        var testSubject = createChoropleth({
          id: 'choropleth-1',
          whereClause: '',
          testUndefined: false,
          datasetModel: createDatasetModelWithColumns(columns, '1'),
          version: '1'
        });

        expect(testSubject.$scope.choroplethRenderError).to.equal(true);
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
          points: {
            name: 'source column.',
            description: 'required',
            physicalDatatype: 'point'
          },
          ward: {
            name: 'Ward where crime was committed.',
            description: 'Batman has bigger fish to fry sometimes, you know.',
            physicalDatatype: 'text',
            computationStrategy: {
              parameters: {
                region: '_snuk-a5kv',
                geometryLabel: 'geoid10'
              },
              source_columns: ['computed_column_source_column'],
              strategy_type: 'georegion_match_on_point'
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

        expect(testSubject.$scope.choroplethRenderError).to.equal(true);
      });

    });

    it('should not use the source column to get the choropleth regions if the computation strategy is "georegion_match_on_string"', function() {

      var columns = {
        points: {
          name: 'source column.',
          description: 'required',
          physicalDatatype: 'point'
        },
        ward: {
          name: 'Some area where the crime was committed that can be described by a string',
          description: 'Batman has bigger fish to fry sometimes, you know.',
          physicalDatatype: 'number',
          computationStrategy: {
            parameters: {
              region: '_snuk-a5kv',
              geometryLabel: 'geoid10',
              column: 'someTextColumn'
            },
            source_columns: ['computed_column_source_column'],
            strategy_type: 'georegion_match_on_string'
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
      expect(choropleth.$scope.choroplethRenderError).to.equal(false);

      CardDataService.getChoroplethRegions.restore();
      CardDataService.getChoroplethRegionsUsingSourceColumn.restore();

    });

    it('uses the source column if the computation strategy type is georegion_match_on_point and strategy_type is undefined', function() {

      var columns = {
        points: {
          name: 'source column.',
          description: 'required',
          physicalDatatype: 'point'
        },
        ward: {
          name: 'Some area where the crime was committed that can be described by a string',
          description: 'Batman has bigger fish to fry sometimes, you know.',
          physicalDatatype: 'number',
          computationStrategy: {
            parameters: {
              region: '_snuk-a5kv',
              geometryLabel: 'geoid10',
              column: 'someTextColumn'
            },
            source_columns: ['computed_column_source_column'],
            type: 'georegion_match_on_point'
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

      expect(CardDataService.getChoroplethRegions.called).to.equal(false);
      expect(CardDataService.getChoroplethRegionsUsingSourceColumn.called).to.equal(true);
      expect(choropleth.$scope.choroplethRenderError).to.equal(false);

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
      assert.isUndefined(choropleth.$scope.defaultExtent);
      expect(choropleth.$scope.savedExtent).to.eql(testExtent);
    });

    it('uses the default extent if it has been set and there is no saved mapExtent', function() {
      CardDataService.getDefaultFeatureExtent.returns(testExtent);
      var choropleth = createChoropleth({});
      expect(choropleth.$scope.defaultExtent).to.eql(testExtent);
      assert.isUndefined(choropleth.$scope.savedExtent);
    });

    it('defers to the choropleth visualization for extent if there is neither a saved nor default extent', function() {
      var choropleth = createChoropleth({});
      assert.isUndefined(choropleth.$scope.defaultExtent);
      assert.isUndefined(choropleth.$scope.savedExtent);
    });
  });

  describe('hasNoPolygons', function() {
    it('is true if there are no polygons', function() {
      mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
        return q.when({ features: [] });
      };

      mockCardDataService.getData = function() {
        return q.when({ data: [{ name: 'some', value: 'data' }] });
      };

      var choropleth = createChoropleth({});
      expect(choropleth.$scope.hasNoPolygons).to.equal(true);
    });

    it('is true if there is no unfiltered data', function() {
      mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
        return q.when({ features: [ 'i am a feature' ] });
      };

      mockCardDataService.getData = function() {
        return q.when({ data: [{ name: undefined, value: 'data' }] });
      };

      var choropleth = createChoropleth({});
      expect(choropleth.$scope.hasNoPolygons).to.equal(true);
    });

    it('is false if there are polygons and unfiltered data', function() {
      mockCardDataService.getChoroplethRegionsUsingSourceColumn = function() {
        return q.when({ features: [ 'hi i am a feature' ] });
      };

      mockCardDataService.getData = function() {
        return q.when({ data: [{ name: 'some', value: 'data' }] });
      };

      var choropleth = createChoropleth({});
      expect(choropleth.$scope.hasNoPolygons).to.equal(false);
    });
  });
});
