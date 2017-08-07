import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('HistogramController', function() {
  'use strict';

  var _$provide;
  var $q;
  var $rootScope;
  var Constants;
  var Model;
  var HistogramService;
  var mockCardDataService;
  var $controller;
  var ServerConfig;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(function($provide) {
    _$provide = $provide;
  }));

  /**
   * @param headers {Object} HTTP headers (e.g. put 'X-SODA2-Rollup': <4x4>)
   * @param dataPromise {Promise} to be returned as the `data` key
   * @return {Promise} with keys data and headers
   */
  function withHeaders(headers, dataPromise) {
    return dataPromise.then(function(dataResult) {
      return {
        data: dataResult,
        headers: headers
      }
    });
  }

  beforeEach(inject(function($injector) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Constants = $injector.get('Constants');
    Model = $injector.get('Model');
    HistogramService = $injector.get('HistogramService');
    $controller = $injector.get('$controller');
    ServerConfig = $injector.get('ServerConfig');

    mockCardDataService = {
      getData: function() {
        var response = _.range(0, Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 5).map(function(x) {
          return { name: x, value: 1 };
        });

        return withHeaders({}, $q.when(response));
      },
      getColumnDomain: function() {
        return $q.when({min: -1, max: 1});
      },
      getMagnitudeData: function() {
        return withHeaders({}, $q.when([
          {magnitude: -1, value: 17},
          {magnitude: 0, value: 0},
          {magnitude: 1, value: 12}
        ]));
      },
      getBucketedData: function() {
        return withHeaders({}, $q.when([
          {magnitude: -1, value: 17},
          {magnitude: 0, value: 0},
          {magnitude: 1, value: 12}
        ]));
      }
    };

    _$provide.value('CardDataService', mockCardDataService);
  }));

  function stubCardModel() {
    var card = new Model();
    var page = new Model();
    var dataset = new Model();

    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    page.defineObservableProperty('dataset', dataset);
    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    page.defineObservableProperty('activeFilters', []);
    page.defineObservableProperty('enableAxisRescaling', false);
    card.page = page;
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('bucketType', undefined);
    card.defineObservableProperty('visualizationType', 'histogram');
    card.defineObservableProperty('aggregation', {});
    card.setOption = _.noop;

    return card;
  }

  function createHistogram() {
    var model = stubCardModel();
    var $scope = $rootScope.$new();
    $scope.model = model;

    $controller('HistogramController', { $scope: $scope });

    return {
      model: model,
      $scope: $scope
    };
  }

  it('should display an error if obtaining the column domain fails', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.reject('hamsters not running fast enough');
    };

    var histogram = createHistogram();
    assert.isString(histogram.$scope.histogramRenderError);
  });

  it('should display an error if obtaining the column domain returns an empty object', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.when({});
    };

    var histogram = createHistogram();
    expect(histogram.$scope.histogramRenderError).to.equal('noData');
  });

  it('should display an error if fetching the data fails', function() {
    mockCardDataService.getMagnitudeData = mockCardDataService.getBucketedData = function() {
      return $q.reject('not hot on high level abstraction');
    };

    var histogram = createHistogram();
    assert.isString(histogram.$scope.histogramRenderError);
  });

  it('should display an error if bucketing the data fails', function() {
    sinon.stub(HistogramService, 'bucketData').throws();

    var histogram = createHistogram();
    assert.isString(histogram.$scope.histogramRenderError);
  });

  it('should display an error if no data is returned', function() {
    mockCardDataService.getBucketedData = function() {
      return $q.when([]);
    };

    var histogram = createHistogram();
    assert.isString(histogram.$scope.histogramRenderError);
  });

  it('should render with an undefined where clause', function() {
    var histogram = createHistogram();

    histogram.$scope.whereClause = undefined;
    histogram.$scope.$digest();

    expect(histogram.$scope.histogramRenderError).to.equal(false);
  });

  it('should render when all the data is zeroes', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: 0, max: 0});
    };

    mockCardDataService.getMagnitudeData = function() {
      throw new Error();
    };

    mockCardDataService.getBucketedData = function() {
      return withHeaders({}, $q.when([{magnitude: 0, value: 193}]));
    };

    var histogram = createHistogram();

    expect(histogram.$scope.histogramRenderError).to.equal(false);
  });

  it('should render if the data contains NaN and Infinity values', function() {
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -100, max: 100});
    };

    mockCardDataService.getMagnitudeData = function() {
      throw new Error();
    };

    mockCardDataService.getBucketedData = function() {
      return withHeaders({}, $q.when([
        {magnitude: -1, value: NaN},
        {magnitude: 0, value: Infinity},
        {magnitude: 1, value: -Infinity}
      ]));
    };

    var histogram = createHistogram();

    expect(histogram.$scope.histogramRenderError).to.equal(false);
  });

  it('should use the linear bucketing method if the absolute value of the min or max is below a threshold', function() {
    var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -threshold + 1, max: threshold - 1});
    };

    var testData = [{magnitude: 1, value: 113}];
    mockCardDataService.getBucketedData = function() {
      return withHeaders({}, $q.when(testData));
    };

    var linearSpy = sinon.spy(mockCardDataService, 'getBucketedData');
    var logarithmicSpy = sinon.spy(mockCardDataService, 'getMagnitudeData');
    var bucketDataSpy = sinon.spy(HistogramService, 'bucketData');

    var histogram = createHistogram();

    expect(histogram.$scope.histogramRenderError).to.equal(false);
    expect(linearSpy.callCount).to.equal(2);
    expect(logarithmicSpy.callCount).to.equal(0);
    expect(bucketDataSpy.calledWithMatch(testData, {bucketType: 'linear'})).to.equal(true);
  });

  it('calls HistogramService.bucketData an appropriate number of times', function() {
    var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -threshold + 1, max: threshold - 1});
    };

    var testData = [{magnitude: 1, value: 113}];
    mockCardDataService.getBucketedData = function() {
      return withHeaders({}, $q.when(testData));
    };

    var bucketDataSpy = sinon.spy(HistogramService, 'bucketData');

    var testValues = createHistogram();

    // Simulate a change in filters that does not impact the filters on the histogram
    testValues.$scope.$apply(function() {
      testValues.model.page.set('activeFilters', [{}]);
    });

    sinon.assert.calledTwice(bucketDataSpy);
  });

  it('should use the logarithmic bucketing method if the absolute value of the min or max is above a threshold', function() {
    var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    mockCardDataService.getColumnDomain = function() {
      return $q.when({min: -threshold, max: 19});
    };

    var testData = [{magnitude: 1, value: 113}];
    mockCardDataService.getMagnitudeData = function() {
      return withHeaders({}, $q.when(testData));
    };

    var linearSpy = sinon.spy(mockCardDataService, 'getBucketedData');
    var logarithmicSpy = sinon.spy(mockCardDataService, 'getMagnitudeData');
    var bucketDataSpy = sinon.spy(HistogramService, 'bucketData');

    var histogram = createHistogram();

    expect(histogram.$scope.histogramRenderError).to.equal(false);
    expect(linearSpy.callCount).to.equal(0);
    expect(logarithmicSpy.callCount).to.equal(2);
    expect(bucketDataSpy.calledWithMatch(testData, {bucketType: 'logarithmic'})).to.equal(true);
  });

  it('sets rescaleAxis to be the value of page.enableAxisRescaling', function() {
    ServerConfig.override('enable_data_lens_axis_rescaling', false);
    var histogram = createHistogram();
    expect(histogram.$scope.rescaleAxis).to.equal(false);
    histogram.$scope.model.page.set('enableAxisRescaling', true);
    expect(histogram.$scope.rescaleAxis).to.equal(true);
  });
});
