describe('A FeatureMap Card Visualization', function() {
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
  var COLUMNS = {
    'test_number': {
      'name': 'number title',
      'fred': 'amount',
      'physicalDatatype': 'number',
      'defaultCardType': 'column',
      'availableCardTypes': ['column', 'search'],
      'position': 1
    },
    'test_timestamp': {
      'name': 'timestamp title',
      'fred': 'time',
      'physicalDatatype': 'timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline'],
      'position': 2
    },
    'test_location': {
      'name': 'location title',
      'fred': 'point',
      'physicalDatatype': 'point',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature'],
      'position': 3
    },
    'test_location_address': {
      'name': 'location title (address)',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'test_location_city': {
      'name': 'location title (city)',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'mail_state': {
      'name': 'mail state',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'position': 4
    },
    'mail_zip': {
      'name': 'mail zip',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'position': 5
    },
    'mailing_address': {
      'name': 'mail address',
      'fred': 'point',
      'physicalDatatype': 'point',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature'],
      'position': 6
    },
    'mailing_address_address': {
      'name': 'mail address (address)',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
    },
    'mailing_address_city': {
      'name': 'mail address (city)',
      'fred': 'text',
      'physicalDatatype': 'text',
      'defaultCardType': 'search',
      'availableCardTypes': ['search'],
      'isSubcolumn': true
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

  beforeEach(module('/angular_templates/dataCards/cardVisualizationFeatureMap.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module(function($provide) {
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
    var html = [
      '<div class="card-visualization">',
      '<card-visualization-feature-map model="model" where-clause="whereClause">',
      '</card-visualization-feature-map>',
      '</div>'
    ].join('');

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
      mapExtent:options.mapExtent || {}
    });
    card.setOption = _.noop;
    card.fieldName = 'foo';

    outerScope.model = card;
    outerScope.whereClause = options.whereClause;

    return {
      pageModel: page,
      cardModel: card,
      scope: outerScope,
      element: testHelpers.TestDom.compileAndAppend(html, outerScope)
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
      var fakePointsClicked = [{ count: 1 }, { count: 2 }];
      var fakeMousePosition = {
        lat: 45.7,
        lng: -122.3
      };

      // getRows() expected arguments (timeout does not affect query accuracy
      // and therefore is not tested here).
      var expectedID = 'cras-hing';
      var expectedOffset = 0;
      var expectedLimit = 3;
      var expectedOrder = 'distance_in_meters(foo, \"POINT\(-122\.3 45\.7\)\"\)';
      var expectedWhereClause;

      it('should properly construct row query parameters on an unfiltered dataset', function(done) {

        // where clause should only include query optimization withinBox
        expectedWhereClause = 'within_box(foo, 0, 0, 100, 100)';

        var elementInfo = buildElement({ 'dataset': dataset });
        var elementScope = elementInfo.scope;
        var element = elementInfo.element;

        // Get reference to getClickedRows function
        var getClickedRows = $(element).find('card-visualization-feature-map').
          isolateScope().getClickedRows;

        var queryResponse$ = getClickedRows(
          fakeMousePosition,
          fakePointsClicked,
          fakeWithinBoxBounds
        );

        queryResponse$.subscribe(function() {
          expect(mockCardDataService.getRows).to.have.been.calledWith(
            expectedID,
            expectedOffset,
            expectedLimit,
            expectedOrder,
            sinon.match.any,
            expectedWhereClause
          );
          done();
        });

        elementScope.$safeApply(function() {
          deferred.resolve();
        });
      });

      it('should properly construct row query parameters on a filtered dataset', function(done) {
        var filterWhereClause = 'test_number > 10';

        // whereClause should include both query optimization and original filter
        expectedWhereClause = '{0} AND within_box(foo, 0, 0, 100, 100)'.format(filterWhereClause);

        var elementInfo = buildElement({
          'dataset': dataset,
          'whereClause': filterWhereClause
        });
        var elementScope = elementInfo.scope;
        var element = elementInfo.element;

        // Get reference to getClickedRows function
        var getClickedRows = $(element).find('card-visualization-feature-map').
          isolateScope().getClickedRows;

        var queryResponse$ = getClickedRows(
          fakeMousePosition,
          fakePointsClicked,
          fakeWithinBoxBounds
        );

        queryResponse$.subscribe(function() {
          expect(mockCardDataService.getRows).to.have.been.calledWith(
            expectedID,
            expectedOffset,
            expectedLimit,
            expectedOrder,
            sinon.match.any,
            expectedWhereClause
          );
          done();
        });

        elementScope.$safeApply(function() {
          deferred.resolve();
        });
      });
    });

    it('should correctly format normal columns and sub columns in query response data', function(done) {
      var elementInfo = buildElement({ 'dataset': dataset });
      var elementScope = elementInfo.scope;
      var element = elementInfo.element;

      // Get reference to getClickedRows function
      var getClickedRows = $(element).find('card-visualization-feature-map').
        isolateScope().getClickedRows;

      var queryResponse$ = getClickedRows({}, [], fakeWithinBoxBounds);

      queryResponse$.subscribe(function(formattedRows) {
        var firstRow = formattedRows[0][0];
        var secondRow = formattedRows[0][1];
        var thirdRow = formattedRows[0][2];
        var fourthRow = formattedRows[0][3];
        var fifthRow = formattedRows[0][4];
        var sixthRow = formattedRows[0][5];

        expect(firstRow.columnName).to.equal('number title');
        expect(firstRow.value).to.equal(10);
        expect(secondRow.columnName).to.equal('timestamp title');
        expect(secondRow.value).to.equal('1957-06-30T15:16:00.000');
        expect(thirdRow.columnName).to.equal('location title');
        expect(thirdRow.value).to.deep.equal([
          {
            coordinates: [42, -87],
            type: 'Point'
          },
          {
            columnName: 'address',
            format: undefined,
            physicalDatatype: 'text',
            value: '9 PALMER ST'
          },
          {
            columnName: 'city',
            format: undefined,
            physicalDatatype: 'text',
            value: 'ASHAWAY'
          }
        ]);
        expect(fourthRow.columnName).to.equal('mail state');
        expect(fourthRow.value).to.equal('RI');
        expect(fifthRow.columnName).to.equal('mail zip');
        expect(fifthRow.value).to.equal('19104');
        expect(sixthRow.columnName).to.equal('mail address');
        expect(sixthRow.value).to.deep.equal([
          {
            coordinates: [40, -85],
            type: 'Point'
          },
          {
            columnName: 'address',
            format: undefined,
            physicalDatatype: 'text',
            value: '3810 HARRISON'
          },
          {
            columnName: 'city',
            format: undefined,
            physicalDatatype: 'text',
            value: 'PHILADELPHIA'
          }
        ]);
        done();
      });

      elementScope.$safeApply(function() {
        deferred.resolve();
      });
    });
  });

  it('should not crash given an undefined dataset binding', function() {
    var elementInfo = buildElement();

    dataset.defineObservableProperty('permissions', '');

    elementInfo.element.find('feature-map').scope();

    // Use buildTileGetter as a proxy for FeatureMap's happiness.
    expect(VectorTileDataService.buildTileGetter).to.have.not.been.called;
    elementInfo.pageModel.set('dataset', dataset);
    expect(VectorTileDataService.buildTileGetter).to.have.been.called;
  });

  describe('extent', function() {
    beforeEach(function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });
    });

    it('should not cause an issue if the server request fails', function() {
      var deferred = $q.defer();
      CardDataService.getFeatureExtent.returns(deferred.promise);
      var elementInfo = buildElement({
        dataset: dataset
      });
      elementInfo.scope.$apply(function() {
        deferred.reject();
      });
      expect(elementInfo.element.find('.spinner')).to.have.class('busy');
    });

  });

  describe('explicit extent', function() {
    beforeEach(function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });
    });

    it('should use an explicitly specified default extent if one is set and it does not contain the server-provided extent', function() {
      var customExtent = ZOOMED_IN_EXTENT;
      CardDataService.getDefaultFeatureExtent.returns(customExtent);
      var visualization = buildElement({
        dataset: dataset
      });
      expect(visualization.element.find('feature-map').scope().featureExtent).to.eql(customExtent);
    });

    it('should use the server-provided extent if the explicitly set extent contains the server-provided extent', function() {
      CardDataService.getDefaultFeatureExtent.returns(ZOOMED_OUT_EXTENT);
      var visualization = buildElement({
        dataset: dataset
      });
      expect(visualization.element.find('feature-map').scope().featureExtent).to.eql(MIDDLE_ZOOM_EXTENT);
    });

    it('should use the server-provided extent if no explicit extent is set', function() {
      var visualization = buildElement({
        dataset: dataset
      });
      expect(visualization.element.find('feature-map').scope().featureExtent).to.eql(MIDDLE_ZOOM_EXTENT);
    });

    it('uses the saved extent if one is set', function() {
      var customExtent = ZOOMED_IN_EXTENT;
      var visualization = buildElement({
        mapExtent: customExtent
      });

      expect(visualization.element.find('feature-map').scope().featureExtent).to.eql(customExtent);
    });
  });

  describe('tileserver sharding', function() {
    it('should parallelize tileserver requests if dataset is public', function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.falsy
      );
    });

    it('should not parallelize tileserver requests if dataset is private', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver request if dataset privacy is not available', function() {
      dataset.defineObservableProperty('permissions', undefined);

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver requests if staging_api_lockdown feature is true', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });
      ServerConfig.override('feature_set', { 'staging_api_lockdown': true });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver requests if staging_lockdown feature is true', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });
      ServerConfig.override('feature_set', { 'staging_lockdown': true });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
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
    });

    afterEach(function() {
      Rx.Scheduler.timeout = timeoutScheduler;
    });

    it('should show the busy indicator while fetching the extent', function() {
      expect(elementInfo.element.find('.spinner')).to.have.class('busy');
      deferred.resolve(MIDDLE_ZOOM_EXTENT);
      // Synthetically signal render complete since we aren't actually rendering
      elementInfo.scope.$broadcast('render:complete');
      expect(elementInfo.element.find('.spinner')).to.not.have.class('busy');
    });

    it('should hide the busy indicator after 10 seconds if no extent is fetched', function() {
      expect(elementInfo.element.find('.spinner')).to.have.class('busy');
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      expect(elementInfo.element.find('.spinner')).to.not.have.class('busy');
    });

    it('should display the error message after 10 seconds if no extent fetched', function() {
      expect(elementInfo.element.find('.visualization-render-error')).to.have.class('ng-hide');
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      expect(elementInfo.element.find('.visualization-render-error')).to.not.have.class('ng-hide');
    });

    it('should hide the error message if rendering eventually occurs', function() {
      testScheduler.advanceTo(Constants.FEATURE_MAP_RENDER_TIMEOUT);
      expect(elementInfo.element.find('.visualization-render-error')).to.not.have.class('ng-hide');
      deferred.resolve(MIDDLE_ZOOM_EXTENT);
      // Synthetically signal render complete since we aren't actually rendering
      elementInfo.scope.$broadcast('render:complete');
      expect(elementInfo.element.find('.visualization-render-error')).to.have.class('ng-hide');
    });
  });


});
