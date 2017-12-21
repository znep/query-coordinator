import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('DistributionChartController', function() {
  'use strict';

  var _$provide;
  var $q;
  var $rootScope;
  var Constants;
  var Model;
  var HistogramService;
  var mockCardDataService;
  var $controller;

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

    mockCardDataService = {
      getData: function() {
        var response = _.range(0, Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 5).map(function(x) {
          return { name: x, value: 1 };
        });

        return withHeaders({}, $q.when(response));
      },
      getColumnValues: function() {
        var response = _.range(0, Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 5).map(function(x) {
          return { name: x };
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
    card.fieldName = 'some-card';
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('bucketType', undefined);
    card.defineObservableProperty('visualizationType', 'histogram');
    card.defineObservableProperty('aggregation', {});
    card.setOption = _.noop;

    return card;
  }

  function createDistributionChart() {
    var model = stubCardModel();
    var $scope = $rootScope.$new();
    $scope.model = model;

    $controller('DistributionChartController', { $scope: $scope });

    return {
      model: model,
      $scope: $scope
    };
  }

  it('should render as a column chart if HistogramService tells it to', function() {
    sinon.stub(HistogramService, 'getVisualizationTypeForData').callsFake(function() { return 'column'; });

    var histogram = createDistributionChart();
    expect(histogram.$scope.visualizationType).to.equal('column');

    HistogramService.getVisualizationTypeForData.restore();
  });

  it('should render as a histogram if HistogramService tells it to', function() {
    sinon.stub(HistogramService, 'getVisualizationTypeForData').callsFake(function() { return 'histogram'; });

    var histogram = createDistributionChart();
    expect(histogram.$scope.visualizationType).to.equal('histogram');

    HistogramService.getVisualizationTypeForData.restore();
  });

  it('interprets the data from CardDataService.getData correctly', function() {
    sinon.stub(HistogramService, 'getVisualizationTypeForData').callsFake(function() { return 'column'; });

    var histogram = createDistributionChart();
    expect(histogram.$scope.cardData[0][0]).to.not.eql(NaN);
    HistogramService.getVisualizationTypeForData.restore();
  });

  it('sets rescaleAxis according to page.enableAxisRescaling', function() {
    sinon.stub(HistogramService, 'getVisualizationTypeForData').callsFake(function() { return 'column'; });

    var histogram = createDistributionChart();

    histogram.model.page.set('enableAxisRescaling', true);
    assert.propertyVal(histogram.$scope, 'rescaleAxis', true);

    histogram.model.page.set('enableAxisRescaling', false);
    assert.propertyVal(histogram.$scope, 'rescaleAxis', false);

    HistogramService.getVisualizationTypeForData.restore();
  });
});
