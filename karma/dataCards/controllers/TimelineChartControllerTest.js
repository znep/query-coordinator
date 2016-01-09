describe('TimelineChartController', function() {
  'use strict';

  var testHelpers;
  var $q;
  var $rootScope;
  var Model;
  var timelineChartService;
  var _$provide;
  var mockCardDataService;
  var $controller;
  var $scope;

  /**
   * @param {Object} HTTP headers (e.g. put 'X-SODA2-Rollup': <4x4>)
   * @param {Promise} to be returned as the `data` key
   * @return {Promise} with keys data and headers
   */
  function withHeaders(headers, dataPromise) {
    return dataPromise.then(function(dataResult) {
      return {
        data: dataResult,
        headers: function(headerName) {
          return headers[headerName];
        }
      }
    });
  }

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    timelineChartService = $injector.get('TimelineChartService');
    $controller = $injector.get('$controller');

    mockCardDataService = {
      getTimelineDomain: function() {
        return $q.when({
          start: moment().subtract('years', 10),
          end: moment()
        });
      },
      getTimelineData: function() {
        return withHeaders({}, $q.when(
          [
            {
              date: moment().subtract('years', 10)
            },
            {
              date: moment()
            }
          ]
        ));
      }
    };
    _$provide.value('CardDataService', mockCardDataService);
    testHelpers.mockDirective(_$provide, 'timelineChart');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  function stubCardModel() {
    var card = new Model();
    var page = new Model();
    var dataset = new Model();

    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    page.defineObservableProperty('dataset', dataset);
    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    page.defineObservableProperty('defaultDateTruncFunction', 'date_trunc_y');
    card.page = page;
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('aggregation', {});

    return card;
  }

  function makeDirective() {
    $scope = $rootScope.$new();
    $scope.model = stubCardModel();
    $controller('TimelineChartController', { $scope: $scope });
  }

  it('should successfully render when given an undefined dataset binding, and then also successfully render when that dataset is populated', function() {
    var $scope = $rootScope.$new();

    // STUBS
    var card = stubCardModel();
    var originalDataset = card.page.getCurrentValue('dataset');
    card.page.set('dataset', undefined); // The important bit

    $scope.model = card;
    $scope.whereClause = '';
    // END STUBS

    // If it's going to crash, it's here.
    $controller('TimelineChartController', { $scope: $scope });

    card.page.set('dataset', originalDataset);

    // Use chartData as a proxy for TimelineChart's happiness.
    expect($scope.chartData).to.equal(undefined);
    $scope.$apply(); // Resolve some internal promises :(
    expect($scope.chartData).to.not.equal(undefined);
  });

  it('should not crash given an undefined whereClause', function() {
    var $scope = $rootScope.$new();

    $scope.model = stubCardModel();
    $scope.whereClause = undefined; // The important bit.

    $controller('TimelineChartController', { $scope: $scope });
    expect($scope.chartData).to.not.equal(undefined);
  });

  it('should not display an error message all timeline data has the same timestamp', function() {
    var now = moment();
    mockCardDataService.getTimelineData = function() {
      return withHeaders({}, $q.when([
        {
          date: now
        }
      ]));
    };

    makeDirective();
    expect($scope.cannotRenderTimelineChart).to.not.exist;
  });

  it('should display an error message if the timeline data is null', function() {
    mockCardDataService.getTimelineData = function() {
      return withHeaders({}, $q.when(null));
    };

    makeDirective();
    $scope.$apply();
    expect($scope.cannotRenderTimelineChart.reason).to.equal('noData');
  });

  it('should display an error message if the timeline data is undefined', function() {
    mockCardDataService.getTimelineData = function() {
      return withHeaders({}, $q.when(undefined));
    };

    makeDirective();
    $scope.$apply();
    expect($scope.cannotRenderTimelineChart.reason).to.equal('noData');
  });

  it('should display an error message if the timeline data is empty', function() {
    mockCardDataService.getTimelineData = function() {
      return withHeaders({}, $q.when([]));
    };

    makeDirective();
    $scope.$apply();
    expect($scope.cannotRenderTimelineChart.reason).to.equal('noData');
  });

  it('should display an error message if the timeline domain is undefined', function() {
    mockCardDataService.getTimelineDomain = function() {
      return $q.when(undefined);
    };

    makeDirective();
    $scope.$apply();
    expect($scope.cannotRenderTimelineChart.reason).to.equal('badDates');
  });

  it('should display an error message if the timeline domain start and end values are null', function() {
    mockCardDataService.getTimelineDomain = function() {
      return $q.when({
        start: null,
        end: null
      });
    };

    makeDirective();
    $scope.$apply();
    expect($scope.cannotRenderTimelineChart.reason).to.equal('badDates');
  });

});
