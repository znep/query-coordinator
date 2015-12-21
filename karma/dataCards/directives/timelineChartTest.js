describe('timelineChart', function() {
  'use strict';

  var testHelpers;
  var rootScope;
  var scope;
  var timeout;
  var TimelineChartService;

  var testJson = 'karma/dataCards/test-data/timelineChartTest/timelineChartTestData.json';

  var unfilteredTestData;
  var filteredTestData;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide, $controllerProvider) {
      $controllerProvider.register('TimelineChartController', _.noop);
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    TimelineChartService = $injector.get('TimelineChartService');
    unfilteredTestData = unpickleTestData(testHelpers.getTestJson(testJson), false);
    filteredTestData = unpickleTestData(testHelpers.getTestJson(testJson), true);
  }));

  afterEach(function() {
    removeTimelineChart();
  });

  function unpickleTestData(testData, shouldFilter) {
    var incorrectDate;
    var datumDate;

    // We need to make sure that JavaScript won't try to apply
    // the system's timezone settings to dates. For example, a datum
    // recorded at midnight UTC will be considered to be at 4pm the
    // previous day if the system clock is in PST. This is wrong.
    // We can get JS to do the correct thing by passing it only
    // UTC years, months and dates instead of an ISO8601 string.
    incorrectDate = new Date(testData.minDate);
    testData.minDate = new Date(incorrectDate.getUTCFullYear(), incorrectDate.getUTCMonth(), incorrectDate.getUTCDate());

    incorrectDate = new Date(testData.maxDate);
    testData.maxDate = new Date(incorrectDate.getUTCFullYear(), incorrectDate.getUTCMonth(), incorrectDate.getUTCDate());


    testData.values = testData.values.map(
      function(value) {

        incorrectDate = new Date(value.date);
        datumDate = new Date(incorrectDate.getUTCFullYear(), incorrectDate.getUTCMonth(), incorrectDate.getUTCDate());

        if (shouldFilter) {
          return {
            date: datumDate,
            unfiltered: value.unfiltered,
            filtered: Math.floor(value.filtered / 2)
          };
        } else {
          return {
            date: datumDate,
            unfiltered: value.unfiltered,
            filtered: value.filtered
          };
        }
      }
    );

    return testData;
  }

  function createTimelineChart(width, expanded, data, precision, allowFilterChange) {
    var html;
    var childScope;

    var html = [
      '<div id="test-timeline-chart">',
        '<div class="card-visualization" style="width: {1}px; height: 300px;">',
          '<timeline-chart style="display: block; width: {1}px; height: 300px;">',
          '</timeline-chart>',
        '</div>',
      '</div>'
    ].join('').format(width);

    scope.chartData = data || unfilteredTestData;
    scope.expanded = expanded;
    scope.precision = precision || 'MONTH';
    scope.rowDisplayUnit = 'rowDisplayUnit';
    scope.activeFilters = [];

    if (typeof allowFilterChange === 'boolean') {
      scope.allowFilterChange = allowFilterChange;
    } else {
      scope.allowFilterChange = true;
    }

    return testHelpers.TestDom.compileAndAppend(html, scope);
  }

  function removeTimelineChart() {
    $('#test-timeline-chart').remove();
    $('#uber-flyout').hide();
  }

  describe('flyouts', function() {
    it('calls the function to render a flyout when an event is emitted on the chart', function() {
      var element = createTimelineChart(640);
      var spy = sinon.spy(TimelineChartService, 'renderFlyout');

      var event = new window.CustomEvent('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', {
        detail: {
          title: '',
          element: element.find('.timeline-chart')[0]
        },
        bubbles: true
      });

      expect(spy.called).to.equal(false);
      element.find('.timeline-chart-wrapper')[0].dispatchEvent(event);
      expect(spy.called).to.equal(true);

      TimelineChartService.renderFlyout.restore();
    });
  });

  describe('rendering', function() {
    it('should emit render:start and render:complete events on rendering', function(done) {
      var renderStarted = false;
      var chart;

      scope.$on('render:start', function(data) {
        renderStarted = true;
      });

      scope.$on('render:complete', function(data) {
        expect(renderStarted).to.equal(true);
        done();
      });

      chart = createTimelineChart(640, false);

      // If we do not flush the timeout, the 'render:complete'
      // event will not be emitted.
      timeout.flush();
    });
  });
});
