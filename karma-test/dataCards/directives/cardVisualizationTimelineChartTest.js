'use strict';

describe("A Timeline Chart Card Visualization", function() {
  var testHelpers;
  var $q;
  var $rootScope;
  var Model;
  var timelineChartVisualizationHelpers;
  var _$provide;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    timelineChartVisualizationHelpers = $injector.get('TimelineChartVisualizationHelpers');
    var mockCardDataService = {
      getTimelineDomain: function(){ return $q.when([]);},
      getTimelineData: function(){ return $q.when([]);}
    };
    _$provide.value('CardDataService', mockCardDataService);
    testHelpers.mockDirective(_$provide, 'timelineChart');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  describe('transformChartDataForRendering', function() {
    it('should add min/max for dates and values, and mean for value', function() {
      var numValues = 30;
      var datumCount = _.range(numValues);
      var dates = _.map(datumCount, function(i) { return moment(new Date(2014, 0, i + 1)); });
      var unfilteredValues = _.map(datumCount, function(i) { return 100 * i; });
      var filteredValues = _.map(unfilteredValues, function(val) { return val / 2; });

      var transformed = timelineChartVisualizationHelpers.transformChartDataForRendering(
        _.map(datumCount, function(i) {
          return {
            date: dates[i],
            total: unfilteredValues[i],
            filtered: filteredValues[i]
          }
        })
      );

      expect(1 * transformed.minDate).to.equal(1 * new Date(2014, 0, 1));
      expect(1 * transformed.maxDate).to.equal(1 * new Date(2014, 0, 30));
      expect(transformed.minValue).to.equal(0);
      expect(transformed.maxValue).to.equal(100 * (numValues - 1));
      expect(transformed.meanValue).to.equal(100 * (numValues - 1) / 2);
      expect(transformed.values.length).to.equal(numValues);
      for (var i = 0; i < numValues; i++) {
        expect(1 * transformed.values[i].date).to.equal(1 * dates[i]);
        expect(transformed.values[i].filtered).to.equal(filteredValues[i]);
        expect(transformed.values[i].unfiltered).to.equal(unfilteredValues[i]);
      }
    });
  });

  it('should not crash given an undefined dataset binding', function() {
    var outerScope = $rootScope.$new();
    var html = '<div class="card-visualization"><card-visualization-timeline-chart model="model" where-clause="whereClause"></card-visualization-timeline-chart></div>';

    var card = new Model();
    var page = new Model();
    page.defineObservableProperty('dataset', undefined); // The important bit

    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    card.defineObservableProperty('page', page);
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);

    outerScope.model = card;

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Ideally, we'd check that the inner timeline actually renders later on.
  });
});
