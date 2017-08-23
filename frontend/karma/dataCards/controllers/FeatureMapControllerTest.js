import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');
const Rx = require('rx');

describe('FeatureMapController', function() {
  'use strict';

  var ZOOMED_OUT_EXTENT = {
    "southwest": [39.9434364619742, -94.10888671875],
    "northeast": [43.75522505306928, -81.14501953125]
  };
  var ZOOMED_IN_EXTENT = {
    "southwest": [41.87537684702812, -87.6587963104248],
    "northeast": [41.89026600256849, -87.5951099395752]
  };
  var MIDDLE_ZOOM_EXTENT = {
    "southwest": [41.681944, -87.827778],
    "northeast": [42.081944, -87.427778]
  };
  var INVALID_EXTENT = {
    "southwest": [441.87537684702812, -887.6587963104248],
    "northeast": [41.89026600256849, -87.5951099395752]
  };
  var COLUMNS = {
    'test_number': {
      'name': 'number title',
      'physicalDatatype': 'number',
      'defaultCardType': 'column',
      'availableCardTypes': ['column', 'search'],
      'position': 1
    },
    'test_timestamp': {
      'name': 'timestamp title',
      'physicalDatatype': 'timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline'],
      'position': 2
    },
    'test_location': {
      'name': 'location title',
      'physicalDatatype': 'point',
      'renderTypeName': 'location',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature'],
      'position': 3
    },
    'test_location_address': {
      'name': 'location title (address)',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'test_location_city': {
      'name': 'location title (city)',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'mail_state': {
      'name': 'mail state',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'position': 4
    },
    'mail_zip': {
      'name': 'mail zip',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'position': 5
    },
    'mailing_address': {
      'name': 'mail address',
      'physicalDatatype': 'point',
      'renderTypeName': 'location',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature'],
      'position': 6
    },
    'mailing_address_address': {
      'name': 'mail address (address)',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'mailing_address_city': {
      'name': 'mail address (city)',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'test_null': {
      'name': 'test null',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['column', 'search'],
      'position': 7
    }
  };
  var CARD_DATA_ROWS = [{
    'test_number': 10,
    'test_timestamp': '1957-06-30T15:16:00.000',
    'test_location': {
      'coordinates': [42, -87],
      'type': 'Point',
    },
    'test_location_address': '9 PALMER ST',
    'test_location_city': 'ASHAWAY',
    'mail_state': 'RI',
    'mail_zip': '19104',
    'mailing_address': {
      'coordinates': [40, -85],
      'type': 'Point'
    },
    'mailing_address_address': '3810 HARRISON',
    'mailing_address_city': 'PHILADELPHIA'
  }];

  var testHelpers;
  var $rootScope;
  var Model;
  var _$provide;
  var VectorTileDataService;
  var CardDataService;
  var ServerConfig;
  var dataset;
  var $q;
  var mockCardDataService;
  var Constants;
  var $controller;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    $q = $injector.get('$q');
    mockCardDataService = {
      getDefaultFeatureExtent: sinon.stub(),
      getFeatureExtent: sinon.stub().returns($q.when(MIDDLE_ZOOM_EXTENT)),
      getRows: sinon.stub().returns($q.when(CARD_DATA_ROWS))
    };
    _$provide.value('CardDataService', mockCardDataService);
    CardDataService = $injector.get('CardDataService');
    testHelpers.mockDirective(_$provide, 'featureMap');
    VectorTileDataService = $injector.get('VectorTileDataService');
    ServerConfig = $injector.get('ServerConfig');
    Constants = $injector.get('Constants');
    $controller = $injector.get('$controller');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    dataset = new Model();
    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    sinon.stub(VectorTileDataService, 'buildTileGetter');
  });

  afterEach(function() {
    VectorTileDataService.buildTileGetter.restore();
  });

  function buildElement(options) {
    options = _.defaults({}, options, {
      dataset: undefined,
      whereClause: ''
    });

    var outerScope = $rootScope.$new();

    var card = new Model();
    var page = new Model();
    page.defineObservableProperty('dataset', options.dataset); // The important bit

    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    page.defineObservableProperty('rowDisplayUnit', 'row');
    page.defineObservableProperty('hasExpandedCard', null);
    card.page = page;
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('baseLayerUrl', '');
    card.defineObservableProperty('cardOptions', {
      mapExtent:options.mapExtent || {},
      mapFlannelTitleColumn: options.mapFlannelTitleColumn || null
    });
    card.setOption = _.noop;
    card.fieldName = 'test_location';

    outerScope.model = card;
    outerScope.whereClause = options.whereClause;

    $controller('FeatureMapController', { $scope: outerScope });

    return {
      pageModel: page,
      cardModel: card,
      scope: outerScope
    }
  }

  describe('getClickedRows', function() {
    var deferred;
    var fakeWithinBoxBounds = {
      northeast: { lat: 0, lng: 0 },
      southwest: { lat: 100, lng: 100 }
    };

    beforeEach(function() {
      dataset.defineObservableProperty('columns', COLUMNS);
      dataset.defineObservableProperty('permissions', '');

      deferred = $q.defer();
      CardDataService.getFeatureExtent.returns(deferred.promise);
    });

    describe('query request parameters', function() {

      // Common getClickedRows parameters
      var fakeRowCount = 3;
      var fakeMousePosition = {
        lat: 45.7,
        lng: -122.3
      };

      // getRows() expected arguments (timeout does not affect query accuracy
      // and therefore is not tested here).
      var expectedID = 'cras-hing';
      var expectedOffset = 0;
      var expectedLimit = 3;
      var expectedOrder = 'distance_in_meters(test_location, \"POINT\(-122\.3 45\.7\)\"\)';
      var expectedWhereClause;

      it('should properly construct row query parameters on an unfiltered dataset', function(done) {

        // where clause should only include query optimization withinBox
        expectedWhereClause = 'within_box(test_location, 0, 0, 100, 100)';

        var elementInfo = buildElement({ 'dataset': dataset });
        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows(
          fakeMousePosition,
          fakeRowCount,
          fakeWithinBoxBounds
        );

        queryResponse$.subscribe(function() {
          sinon.assert.calledWith(
            mockCardDataService.getRows,
            expectedID,
            expectedOffset,
            expectedLimit,
            expectedOrder,
            sinon.match.any,
            expectedWhereClause
          );
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });

      it('should properly construct row query parameters on a filtered dataset', function(done) {
        var filterWhereClause = 'test_number > 10';

        // whereClause should include both query optimization and original filter
        expectedWhereClause = '{0} AND within_box(test_location, 0, 0, 100, 100)'.format(filterWhereClause);

        var elementInfo = buildElement({
          'dataset': dataset,
          'whereClause': filterWhereClause
        });

        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows(
          fakeMousePosition,
          fakeRowCount,
          fakeWithinBoxBounds
        );

        queryResponse$.subscribe(function() {
          sinon.assert.calledWith(
            mockCardDataService.getRows,
            expectedID,
            expectedOffset,
            expectedLimit,
            expectedOrder,
            sinon.match.any,
            expectedWhereClause
          );
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });
    });

    describe('query response formatting', function() {
      it('should correctly format normal columns and sub columns in query response data', function(done) {
        var elementInfo = buildElement({ 'dataset': dataset });
        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows({}, [], fakeWithinBoxBounds);

        queryResponse$.subscribe(function(formattedRows) {
          var firstRow = formattedRows[0][0];
          var secondRow = formattedRows[0][1];
          var thirdRow = formattedRows[0][2];
          var fourthRow = formattedRows[0][3];
          var fifthRow = formattedRows[0][4];
          var sixthRow = formattedRows[0][5];
          var seventhRow = formattedRows[0][6];

          expect(firstRow.columnName).to.equal('number title');
          expect(firstRow.value).to.deep.equal([10]);
          expect(secondRow.columnName).to.equal('timestamp title');
          expect(secondRow.value).to.deep.equal(['1957-06-30T15:16:00.000']);
          expect(thirdRow.columnName).to.equal('location title');
          expect(thirdRow.value).to.deep.equal([
            {
              columnName: 'location title',
              value: {
                coordinates: [42, -87],
                type: 'Point'
              },
              format: undefined,
              physicalDatatype: 'point',
              renderTypeName: 'location'
            },
            {
              columnName: 'address',
              value: '9 PALMER ST',
              format: undefined,
              physicalDatatype: 'text',
              renderTypeName: undefined
            },
            {
              columnName: 'city',
              value: 'ASHAWAY',
              format: undefined,
              physicalDatatype: 'text',
              renderTypeName: undefined
            }
          ]);
          expect(fourthRow.columnName).to.equal('mail state');
          expect(fourthRow.value).to.deep.equal(['RI']);
          expect(fifthRow.columnName).to.equal('mail zip');
          expect(fifthRow.value).to.deep.equal(['19104']);
          expect(sixthRow.columnName).to.equal('mail address');
          expect(sixthRow.value).to.deep.equal([
            {
              columnName: 'mail address',
              value: {
                coordinates: [40, -85],
                type: 'Point'
              },
              format: undefined,
              physicalDatatype: 'point',
              renderTypeName: 'location'
            },
            {
              columnName: 'address',
              value: '3810 HARRISON',
              format: undefined,
              physicalDatatype: 'text',
              renderTypeName: undefined
            },
            {
              columnName: 'city',
              value: 'PHILADELPHIA',
              format: undefined,
              physicalDatatype: 'text',
              renderTypeName: undefined
            }
          ]);
          expect(seventhRow.columnName).to.equal('test null');
          expect(seventhRow.value).to.be.a('null');
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });

      it('should mark cells from the specified map flannel title column when present', function(done) {
        var elementInfo = buildElement({
          'dataset': dataset ,
          'mapFlannelTitleColumn': 'test_number'
        });
        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows({}, [], fakeWithinBoxBounds);

        queryResponse$.subscribe(function(formattedRows) {
          var firstRow = formattedRows[0][0];
          var secondRow = formattedRows[0][1];
          var thirdRow = formattedRows[0][2];
          var fourthRow = formattedRows[0][3];
          var fifthRow = formattedRows[0][4];
          var sixthRow = formattedRows[0][5];
          var seventhRow = formattedRows[0][6];

          assert.isTrue(firstRow.isTitleColumn);
          assert.isFalse(secondRow.isTitleColumn);
          assert.isFalse(thirdRow.isTitleColumn);
          assert.isFalse(fourthRow.isTitleColumn);
          assert.isFalse(fifthRow.isTitleColumn);
          assert.isFalse(sixthRow.isTitleColumn);
          assert.isFalse(seventhRow.isTitleColumn);
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });

      it('should mark cells from the feature map generating location column', function(done) {
        var elementInfo = buildElement({ 'dataset': dataset });
        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows({}, [], fakeWithinBoxBounds);

        queryResponse$.subscribe(function(formattedRows) {
          var firstRow = formattedRows[0][0];
          var secondRow = formattedRows[0][1];
          var thirdRow = formattedRows[0][2];
          var fourthRow = formattedRows[0][3];
          var fifthRow = formattedRows[0][4];
          var sixthRow = formattedRows[0][5];
          var seventhRow = formattedRows[0][6];

          assert.isFalse(firstRow.isFeatureMapColumn);
          assert.isFalse(secondRow.isFeatureMapColumn);
          assert.isTrue(thirdRow.isFeatureMapColumn);
          assert.isFalse(fourthRow.isFeatureMapColumn);
          assert.isFalse(fifthRow.isFeatureMapColumn);
          assert.isFalse(sixthRow.isFeatureMapColumn);
          assert.isFalse(seventhRow.isFeatureMapColumn);
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });

      it('should properly mark isParentColumn as true when corresponding subcolumns are present', function(done) {
        var elementInfo = buildElement({ 'dataset': dataset });
        var $scope = elementInfo.scope;

        // Get reference to getClickedRows function
        var getClickedRows = $scope.getClickedRows;

        var queryResponse$ = getClickedRows({}, [], fakeWithinBoxBounds);

        queryResponse$.subscribe(function(formattedRows) {
          var firstRow = formattedRows[0][0];
          var secondRow = formattedRows[0][1];
          var thirdRow = formattedRows[0][2];
          var fourthRow = formattedRows[0][3];
          var fifthRow = formattedRows[0][4];
          var sixthRow = formattedRows[0][5];
          var seventhRow = formattedRows[0][6];

          assert.isFalse(firstRow.isParentColumn);
          assert.isFalse(secondRow.isParentColumn);
          assert.isTrue(thirdRow.isParentColumn);
          assert.isFalse(fourthRow.isParentColumn);
          assert.isFalse(fifthRow.isParentColumn);
          assert.isTrue(sixthRow.isParentColumn);
          assert.isFalse(seventhRow.isParentColumn);
          done();
        });

        $scope.$safeApply(function() {
          deferred.resolve();
        });
      });
    });
  });

  // Not testing this controller, move into featureMapTest or remove.
  xit('should not crash given an undefined dataset binding', function() {
    var elementInfo = buildElement();

    dataset.defineObservableProperty('permissions', '');

    elementInfo.element.find('feature-map').scope();

    // Use buildTileGetter as a proxy for FeatureMap's happiness.
    sinon.assert.notCalled(VectorTileDataService.buildTileGetter);
    elementInfo.pageModel.set('dataset', dataset);
    sinon.assert.called(VectorTileDataService.buildTileGetter);
  });

  describe('extent', function() {
    beforeEach(function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });
    });

    it('should use the default extent if the server request fails', function() {
      var deferred = $q.defer();
      var defaultExtent = ZOOMED_IN_EXTENT;
      CardDataService.getFeatureExtent.returns(deferred.promise);
      CardDataService.getDefaultFeatureExtent.returns(defaultExtent);
      var elementInfo = buildElement({
        dataset: dataset
      });
      var $scope = elementInfo.scope;
      $scope.$apply(function() {
        deferred.reject();
      });

      expect(elementInfo.scope.featureExtent).to.equal(defaultExtent);
    });

    it('should use the default extent if the server request resolves to undefined', function() {
      var deferred = $q.defer();
      var defaultExtent = ZOOMED_IN_EXTENT;
      CardDataService.getFeatureExtent.returns(deferred.promise);
      CardDataService.getDefaultFeatureExtent.returns(defaultExtent);
      var elementInfo = buildElement({
        dataset: dataset
      });
      var $scope = elementInfo.scope;
      $scope.$apply(function() {
        deferred.resolve(undefined);
      });
      expect(elementInfo.scope.featureExtent).to.equal(defaultExtent);
    });

    it('should use the bounds of the world if both the default and server extent are missing', function() {
      var deferred = $q.defer();
      CardDataService.getFeatureExtent.returns(deferred.promise);
      CardDataService.getDefaultFeatureExtent.returns(undefined);
      var elementInfo = buildElement({
        dataset: dataset
      });
      var $scope = elementInfo.scope;
      $scope.$apply(function() {
        deferred.resolve(undefined);
      });
      expect(elementInfo.scope.featureExtent).to.deep.equal({
        southwest: [ -85, -180 ],
        northeast: [ 85, 180 ]
      });
    });

    it('should use the bounds of the world if the existing default extent is invalid', function() {
      var deferred = $q.defer();
      var defaultExtent = INVALID_EXTENT;
      CardDataService.getFeatureExtent.returns(deferred.promise);
      CardDataService.getDefaultFeatureExtent.returns(defaultExtent);
      var elementInfo = buildElement({
        dataset: dataset
      });
      var $scope = elementInfo.scope;
      $scope.$apply(function() {
        deferred.resolve(undefined);
      });
      expect(elementInfo.scope.featureExtent).to.deep.equal({
        southwest: [ -85, -180 ],
        northeast: [ 85, 180 ]
      });
    });

    it('should use the bounds of the world if the server extent is invalid', function() {
      var deferred = $q.defer();
      var serverExtent = INVALID_EXTENT;
      CardDataService.getFeatureExtent.returns(serverExtent);
      CardDataService.getDefaultFeatureExtent.returns(undefined);
      var elementInfo = buildElement({
        dataset: dataset
      });
      var $scope = elementInfo.scope;
      $scope.$apply(function() {
        deferred.resolve(undefined);
      });
      expect(elementInfo.scope.featureExtent).to.deep.equal({
        southwest: [ -85, -180 ],
        northeast: [ 85, 180 ]
      });
    });
  });

  describe('explicit extent', function() {
    beforeEach(function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });
    });

    it('should use an explicitly specified default extent if one is set and it does not contain the server-provided extent', function() {
      var customExtent = ZOOMED_IN_EXTENT;
      CardDataService.getDefaultFeatureExtent.returns(customExtent);
      var visualization = buildElement({ dataset: dataset });
      expect(visualization.scope.featureExtent).to.eql(customExtent);
    });

    it('should use the server-provided extent if the explicitly set extent contains the server-provided extent', function() {
      CardDataService.getDefaultFeatureExtent.returns(ZOOMED_OUT_EXTENT);
      var visualization = buildElement({ dataset: dataset });
      expect(visualization.scope.featureExtent).to.eql(MIDDLE_ZOOM_EXTENT);
    });

    it('should use the server-provided extent if no explicit extent is set', function() {
      var visualization = buildElement({ dataset: dataset });
      expect(visualization.scope.featureExtent).to.eql(MIDDLE_ZOOM_EXTENT);
    });

    it('uses the saved extent if one is set', function() {
      var customExtent = ZOOMED_IN_EXTENT;
      var visualization = buildElement({ dataset: dataset, mapExtent: customExtent });
      expect(visualization.scope.featureExtent).to.eql(customExtent);
    });
  });

  describe('tileserver sharding', function() {
    it('should parallelize tileserver requests if dataset is public', function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });

      buildElement({ dataset: dataset });
      sinon.assert.called(VectorTileDataService.buildTileGetter);
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      sinon.assert.calledWithMatch(
        lastCall,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.falsy
      );
    });

    it('should not parallelize tileserver requests if dataset is private', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });

      buildElement({ dataset: dataset });
      sinon.assert.called(VectorTileDataService.buildTileGetter);
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      sinon.assert.calledWithMatch(
        lastCall,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver request if dataset privacy is not available', function() {
      dataset.defineObservableProperty('permissions', undefined);

      buildElement({ dataset: dataset });
      sinon.assert.called(VectorTileDataService.buildTileGetter);
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      sinon.assert.calledWithMatch(
        lastCall,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver requests if staging_api_lockdown feature is true', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });
      ServerConfig.override('feature_set', { 'staging_api_lockdown': true });

      buildElement({ dataset: dataset });
      sinon.assert.called(VectorTileDataService.buildTileGetter);
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      sinon.assert.calledWithMatch(
        lastCall,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver requests if staging_lockdown feature is true', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });
      ServerConfig.override('feature_set', { 'staging_lockdown': true });

      buildElement({ dataset: dataset });
      sinon.assert.called(VectorTileDataService.buildTileGetter);
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      sinon.assert.calledWithMatch(
        lastCall,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });
  });

  describe('timeouts', function() {
    var testScheduler;
    var timeoutScheduler;
    var deferred;
    var elementInfo;
    var $scope;

    beforeEach(function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });
      testScheduler = new Rx.TestScheduler();
      timeoutScheduler = Rx.Scheduler.timeout;
      Rx.Scheduler.timeout = testScheduler;
      deferred = $q.defer();
      CardDataService.getFeatureExtent.returns(deferred.promise);
      elementInfo = buildElement({
        dataset: dataset
      });
      $scope = elementInfo.scope;
    });

    afterEach(function() {
      Rx.Scheduler.timeout = timeoutScheduler;
    });

    it('should show the busy indicator while fetching the extent', function() {
      expect($scope.busy).to.equal(true);
      deferred.resolve(MIDDLE_ZOOM_EXTENT);
      // Synthetically signal render complete since we aren't actually rendering
      $scope.$broadcast('render:complete');
      expect($scope.busy).to.equal(false);
    });

    it('should hide the busy indicator after 10 seconds if no extent is fetched', function() {
      assert.isTrue($scope.busy);
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      assert.isFalse($scope.busy);
    });

    it('should display the error message after 10 seconds if no extent fetched', function() {
      assert.isUndefined($scope.displayRenderError);
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      assert.isString($scope.displayRenderError);
    });

    it('should hide the error message if rendering eventually occurs', function() {
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      assert.isString($scope.displayRenderError);
      deferred.resolve(MIDDLE_ZOOM_EXTENT);
      // Synthetically signal render complete since we aren't actually rendering
      elementInfo.scope.$broadcast('render:complete');
      assert.isUndefined($scope.displayRenderError);
    });
  });
});
