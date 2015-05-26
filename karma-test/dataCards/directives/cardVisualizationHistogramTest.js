describe('Histogram Visualization', function() {
  'use strict';

  var testHelpers;
  var _$provide;
  var $q;
  var $rootScope;
  var Constants;
  var Model;
  var HistogramService;
  var mockCardDataService;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationHistogram.html'));
  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards.services'));
  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Constants = $injector.get('Constants');
    Model = $injector.get('Model');
    HistogramService = $injector.get('HistogramService');

    mockCardDataService = {
      getColumnDomain: function() {
        return $q.when({min: -1, max: 1});
      },
      getMagnitudeData: function() {
        return $q.when([{magnitude: -1, value: 17}, {magnitude: 0, value: 0}, {magnitude: 1, value: 12}]);
      },
      getBucketedData: function() {
        return $q.when([{magnitude: -1, value: 17}, {magnitude: 0, value: 0}, {magnitude: 1, value: 12}]);
      }
    };

    _$provide.value('CardDataService', mockCardDataService);

    testHelpers.mockDirective(_$provide, 'histogram');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var directiveTemplate = '<div class="card-visualization"><card-visualization-histogram model="model" where-clause="whereClause"></card-visualization-histogram></div>';

  function stubCardModel() {
    var card = new Model();
    var page = new Model();
    var dataset = new Model();

    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    page.defineObservableProperty('dataset', dataset);
    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    card.page = page;
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);

    return card;
  }

  function createHistogram() {
    var model = stubCardModel();
    var rootScope = $rootScope.$new();
    rootScope.model = model;

    var element = testHelpers.TestDom.compileAndAppend(directiveTemplate, rootScope);
    var scope = element.find('histogram').scope();

    return {
      model: model,
      element: element,
      rootScope: rootScope,
      scope: scope
    };
  }

  it('should display an error if obtaining the column domain fails', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.reject('hamsters not running fast enough');
    };

    var histogram = createHistogram();
    expect(histogram.scope.histogramRenderError).to.exist;
  });

  it('should display an error if fetching the data fails', function() {
    mockCardDataService.getMagnitudeData = mockCardDataService.getBucketedData = function() {
      return $q.reject('not hot on high level abstraction');
    };

    var histogram = createHistogram();
    expect(histogram.scope.histogramRenderError).to.exist;
  });

  it('should display an error if bucketing the data fails', function() {
    var stub = sinon.stub(HistogramService, 'bucketData').throws();

    var histogram = createHistogram();
    expect(histogram.scope.histogramRenderError).to.exist;
  });

  it('should display an error if no data is returned', function() {
    mockCardDataService.getBucketedData = function() {
      return $q.when([]);
    };

    var histogram = createHistogram();
    expect(histogram.scope.histogramRenderError).to.exist;
  });

  it('should render with an undefined where clause', function() {
    var histogram = createHistogram();

    histogram.rootScope.whereClause = undefined;
    histogram.rootScope.$digest();

    expect(histogram.scope.histogramRenderError).to.equal(false);
  });

  it('should render when all the data is zeroes', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: 0, max: 0});
    };

    mockCardDataService.getMagnitudeData = function() {
      throw new Error();
    };

    mockCardDataService.getBucketedData = function() {
      return $q.when([{magnitude: 0, value: 193}]);
    };

    var histogram = createHistogram();

    expect(histogram.scope.histogramRenderError).to.equal(false);
  });

  it('should render if the data contains NaN and Infinity values', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -100, max: 100});
    };

    mockCardDataService.getMagnitudeData = function() {
      throw new Error();
    };

    mockCardDataService.getBucketedData = function() {
      return $q.when([{magnitude: -1, value: NaN}, {magnitude: 0, value: Infinity}, {magnitude: 1, value: -Infinity}]);
    };

    var histogram = createHistogram();

    expect(histogram.scope.histogramRenderError).to.equal(false);
  });

  it('should use the linear bucketing method if the absolute value of the min or max is below a threshold', function() {
    var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -threshold + 1, max: threshold - 1});
    };

    var testData = [{magnitude: 1, value: 113}];
    mockCardDataService.getBucketedData = function() {
      return $q.when(testData);
    };

    var linearSpy = sinon.spy(mockCardDataService, 'getBucketedData');
    var logarithmicSpy = sinon.spy(mockCardDataService, 'getMagnitudeData');
    var bucketDataSpy = sinon.spy(HistogramService, 'bucketData');

    var histogram = createHistogram();

    expect(histogram.scope.histogramRenderError).to.equal(false);
    expect(linearSpy.callCount).to.equal(2);
    expect(logarithmicSpy.callCount).to.equal(0);
    expect(bucketDataSpy.calledWithMatch(testData, {bucketType: 'linear'})).to.equal(true);
  });

  it('should use the logarithmic bucketing method if the absolute value of the min or max is above a threshold', function() {
    var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -threshold, max: 19});
    };

    var testData = [{magnitude: 1, value: 113}];
    mockCardDataService.getMagnitudeData = function() {
      return $q.when(testData);
    };

    var linearSpy = sinon.spy(mockCardDataService, 'getBucketedData');
    var logarithmicSpy = sinon.spy(mockCardDataService, 'getMagnitudeData');
    var bucketDataSpy = sinon.spy(HistogramService, 'bucketData');

    var histogram = createHistogram();

    expect(histogram.scope.histogramRenderError).to.equal(false);
    expect(linearSpy.callCount).to.equal(0);
    expect(logarithmicSpy.callCount).to.equal(2);
    expect(bucketDataSpy.calledWithMatch(testData, {bucketType: 'logarithmic'})).to.equal(true);
  });
});
