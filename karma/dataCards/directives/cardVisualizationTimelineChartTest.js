describe('A Timeline Chart Card Visualization', function() {
  'use strict';

  var testHelpers;
  var $q;
  var $rootScope;
  var Model;
  var timelineChartVisualizationHelpers;
  var _$provide;
  var mockCardDataService;
  var html = [
    '<div class="card-visualization">',
      '<card-visualization-timeline-chart model="model" where-clause="whereClause">',
      '</card-visualization-timeline-chart>',
    '</div>'
  ].join('');

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

    mockCardDataService = {
      getTimelineDomain: function() {
        return $q.when({
          start: moment().subtract('years', 10),
          end: moment()
        });
      },
      getTimelineData: function() {
        return $q.when([
          {
            date: moment().subtract('years', 10)
          },
          {
            date: moment()
          }
        ]);
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

    return card;
  }

  function makeDirective() {
    var outerScope = $rootScope.$new();

    outerScope.model = stubCardModel();

    return testHelpers.TestDom.compileAndAppend(html, outerScope);
  }


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

  it('should successfully render when given an undefined dataset binding, and then also successfully render when that dataset is populated', function() {
    var outerScope = $rootScope.$new();

    // STUBS
    var card = stubCardModel();
    var originalDataset = card.page.getCurrentValue('dataset');
    card.page.set('dataset', undefined); // The important bit

    outerScope.model = card;
    outerScope.whereClause = '';
    // END STUBS

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    card.page.set('dataset', originalDataset);

    var timelineChartScope = element.find('.timeline-chart').scope();

    // Use chartData as a proxy for TimelineChart's happiness.
    expect(timelineChartScope.chartData).to.equal(undefined);
    outerScope.$apply(); // Resolve some internal promises :(
    expect(timelineChartScope.chartData).to.not.equal(undefined);
  });

  it('should not crash given an undefined whereClause', function() {
    var outerScope = $rootScope.$new();

    outerScope.model = stubCardModel();

    outerScope.whereClause = undefined; // The important bit.

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Use chartData as a proxy for TimelineChart's happiness.
    var timelineChartScope = element.find('.timeline-chart').scope();
    expect(timelineChartScope.chartData).to.not.equal(undefined);
  });

  it('should not display an error message all timeline data has the same timestamp', function() {
    var now = moment();
    mockCardDataService.getTimelineData = function() {
      return $q.when([
        {
          date: now
        }
      ]);
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.length).to.equal(0);
  });

  it('should display an error message if the timeline data is null', function() {
    mockCardDataService.getTimelineData = function() {
      return $q.when(null);
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.text().trim()).to.equal('Chart cannot be rendered with no values.');
  });

  it('should display an error message if the timeline data is undefined', function() {
    mockCardDataService.getTimelineData = function() {
      return $q.when(undefined);
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.text().trim()).to.equal('Chart cannot be rendered with no values.');
  });

  it('should display an error message if the timeline data is empty', function() {
    mockCardDataService.getTimelineData = function() {
      return $q.when([]);
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.text().trim()).to.equal('Chart cannot be rendered with no values.');
  });

  it('should display an error message if the timeline domain is undefined', function() {
    mockCardDataService.getTimelineDomain = function() {
      return $q.when(undefined);
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.text().trim()).to.equal('Chart cannot be rendered due to invalid date values.');
  });

  it('should display an error message if the timeline domain start and end values are null', function() {
    mockCardDataService.getTimelineDomain = function() {
      return $q.when({
        start: null,
        end: null
      });
    };

    var element = makeDirective();
    var errorMessage = element.find('.chart-render-error');
    expect(errorMessage.text().trim()).to.equal('Chart cannot be rendered due to invalid date values.');
  });

  it('should have unfilteredSoqlRollupTablesUsed on scope', function() {
    var outerScope = $rootScope.$new();

    // To future self: in this function invocation, we only care about this last value
    // becuase this is the one we're using to communication state back out.
    mockCardDataService.getTimelineData = function(a, b, c, d, e, soqlMetadata) {
      soqlMetadata.dateTruncFunctionUsed = 'date_trunc_y';
      return $q.when([
        {
          date: moment()
        }
      ]);
    };
    outerScope.model = stubCardModel();

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Use chartData as a proxy for TimelineChart's happiness.
    var timelineChartScope = element.find('.timeline-chart').scope();
    expect(timelineChartScope.unfilteredSoqlRollupTablesUsed).to.be.true;
  });

  it('should have unfilteredSoqlRollupTablesUsed on scope with false', function() {
    var outerScope = $rootScope.$new();

    // To future self: in this function invocation, we only care about this last value
    // becuase this is the one we're using to communication state back out.
    mockCardDataService.getTimelineData = function(a, b, c, d, e, soqlMetadata) {
      soqlMetadata.dateTruncFunctionUsed = 'date_trunc_ym';
      return $q.when([
        {
          date: moment()
        }
      ]);
    };
    outerScope.model = stubCardModel();

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Use chartData as a proxy for TimelineChart's happiness.
    var timelineChartScope = element.find('.timeline-chart').scope();
    expect(timelineChartScope.unfilteredSoqlRollupTablesUsed).to.be.false;
  });

  it('should have filteredSoqlRollupTablesUsed on scope', function() {
    var outerScope = $rootScope.$new();

    // To future self: in this function invocation, we only care about this last value
    // becuase this is the one we're using to communication state back out.
    mockCardDataService.getTimelineData = function(a, b, c, d, e, soqlMetadata) {
      soqlMetadata.dateTruncFunctionUsed = 'date_trunc_y';
      return $q.when([
        {
          date: moment()
        }
      ]);
    };
    outerScope.model = stubCardModel();

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Use chartData as a proxy for TimelineChart's happiness.
    var timelineChartScope = element.find('.timeline-chart').scope();
    expect(timelineChartScope.filteredSoqlRollupTablesUsed).to.be.true;
  });

  it('should have filteredSoqlRollupTablesUsed on scope with false', function() {
    var outerScope = $rootScope.$new();

    // To future self: in this function invocation, we only care about this last value
    // becuase this is the one we're using to communication state back out.
    mockCardDataService.getTimelineData = function(a, b, c, d, e, soqlMetadata)
    {
      soqlMetadata.dateTruncFunctionUsed = 'date_trunc_ym';
      return $q.when([
        {
          date: moment()
        }
      ]);
    };
    outerScope.model = stubCardModel();

    // If it's going to crash, it's here.
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Use chartData as a proxy for TimelineChart's happiness.
    var timelineChartScope = element.find('.timeline-chart').scope();
    expect(timelineChartScope.filteredSoqlRollupTablesUsed).to.be.false;
  });

});
