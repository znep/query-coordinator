describe('timelineChart', function() {

  // NOTE: Selection rendering is slightly wonky in Safari 6.
  // Fixing this is not of high enough priority, so we disable
  // the affected tests in that platform only.
  var isSafari6 = /Mozilla\/5\.0.*AppleWebKit.*Version\/6\.[0-9.]+ Safari/.test(navigator.userAgent);

  var mockWindowStateService;
  var testHelpers;
  var rootScope;
  var scope;
  var timeout;
  var testData;
  var AngularRxExtensions;
  var testJson = 'karma-test/dataCards/test-data/timelineChartTest/timelineChartTestData.json';
  var hiddenLabelTestJson = 'karma-test/dataCards/test-data/timelineChartTest/hiddenLabelTimelineChartTestData.json';
  var negativeTestJson = 'karma-test/dataCards/test-data/timelineChartTest/negativeTestData.json';

  beforeEach(module(testJson));
  beforeEach(module(hiddenLabelTestJson));
  beforeEach(module(negativeTestJson));

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.directives'));

  beforeEach(module('dataCards/timeline-chart.sass'));
  beforeEach(module('dataCards/flyout.sass'));

  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));

  beforeEach(function() {
    module(function($provide) {

      mockWindowStateService = {};
      mockWindowStateService.scrollPositionSubject = new Rx.Subject();
      mockWindowStateService.windowSizeSubject = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressedSubject = new Rx.Subject();
      mockWindowStateService.mousePositionSubject = new Rx.Subject();
      mockWindowStateService.closeDialogEventObservable = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    unfilteredTestData = unpickleTestData(testHelpers.getTestJson(testJson), false);
    filteredTestData = unpickleTestData(testHelpers.getTestJson(testJson), true);
    hiddenLabelTestData = unpickleTestData(testHelpers.getTestJson(hiddenLabelTestJson), false);
    negativeTestData = unpickleTestData(testHelpers.getTestJson(negativeTestJson), false);
  }));

  afterEach(function() {
    removeTimelineChart();
  });

  function unpickleTestData(testData, shouldFilter) {

    testData.minDate = new Date(testData.minDate);
    testData.maxDate = new Date(testData.maxDate);
    testData.breaks = testData.breaks.map(
      function(dateString) {
        return new Date(dateString);
      }
    );
    testData.values = testData.values.map(
      function(value) {
        if (shouldFilter) {
          return {
            date: new Date(value.date),
            unfiltered: value.unfiltered,
            filtered: Math.floor(value.filtered / 2)
          };
        } else {
          return {
            date: new Date(value.date),
            unfiltered: value.unfiltered,
            filtered: value.filtered
          };
        }
      }
    );

    return testData;

  }

  function createTimelineChart(width, expanded, data) {

    var html;
    var childScope;
    var element;
    var compiledElement;

    var chartId = $('#test-timeline-chart').length === 0 ? 'test-timeline-chart' : 'alternate-test-timeline-chart';

    var html = [
      '<div id="{0}">'.format(chartId),
        '<div class="card-visualization" style="width: {0}px; height: 300px;">'.format(width),
          '<div timeline-chart ',
            'class="timeline-chart"',
            'chart-data="chartData" ',
            'expanded="expanded" ',
            'precision="precision" ',
            'row-display-unit="rowDisplayUnit" ',
            'active-filters="activeFilters" ',
            'page-is-filtered="pageIsFiltered">',
          '</div>',
        '</div>',
      '</div>'
    ].join('');

    scope.chartData = data || unfilteredTestData;
    scope.expanded = expanded;
    scope.precision = 'MONTH';
    scope.rowDisplayUnit = 'rowDisplayUnit';
    scope.activeFilters = [];
    scope.pageIsFiltered = false;

    return testHelpers.TestDom.compileAndAppend(html, scope);

  }

  function removeTimelineChart() {
    $('#test-timeline-chart').remove();
    $('#alternate-test-timeline-chart').remove();
    $('#uber-flyout').hide();
  }



  describe('render timing events', function() {

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


  it("should create 1 grey ('.context') and 1 blue ('.shaded') path", function() {

    var chart = createTimelineChart(640, false);

    expect($('path.context').length).to.equal(1);
    expect($('path.shaded').length).to.equal(1);

  });

  describe('axis creation', function() {

    it('should create 3 y-axis ticks and 3 y-axis labels', function() {

      var chart = createTimelineChart(640, false);

      expect($('.y-tick').length).to.equal(3);

    });

    it('should create y-axis ticks with unique positions', function() {

      var chart = createTimelineChart(640, false, negativeTestData);

      var positions = _.map($('.y-tick'), function(tick) {
        return $(tick).attr('style');
      });

      expect(_.uniq(positions).length).to.equal(positions.length);

    });

    it('should create x-axis labels with unique positions', function() {

      var chart = createTimelineChart(640, false);

      var positions = _.map($('.x-tick-label'), function(label) {
        return $(label).attr('style');
      });

      expect(_.uniq(positions).length).to.equal(positions.length);

    });

    describe('label granularity', function() {
      var transformChartData;
      beforeEach(inject(function($injector) {
        transformChartData = $injector.get('timelineChartVisualizationService').
          transformChartDataForRendering;
      }));

      it('should format for decade when the data spans more than 20 years', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000 + i, 0, 1)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b20[0-9]0s\b/);
          }
        });
      });

      it('should format for year when the data spans 2 < x < 20 years', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(19), function(i) {
            return {
              date: moment(new Date(2000 + i, 0, 1)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b20[01][0-9]\b/);
          }
        });
      });

      it('should format for month when the data spans 2 < x < 24 months', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(80), function(i) {
            return {
              date: moment(new Date(2014, 11, i)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’]1[45]\b/);
          }
        });
      });

      it('should not render an extra 1 before abbreviated years in the teens when formatted by month.', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(80), function(i) {
            return {
              date: moment(new Date(2009, 11, i)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’][01][019]\b/);
          }
        });
      });

      it('should format for day when the data spans less than 2 months', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000, 0, 1 + i)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          expect(this.innerHTML).to.match(/\b[1-9]?[0-9] [A-Z][a-z][a-z]\b/);
        });
      });

      // This unit test exposes a bug: https://socrata.atlassian.net/browse/ONCALL-1917
      xit('should format for month when the data has gaps in it', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(0, 30, 3), function(i) {
            return {
              date: moment(new Date(2014, 11, i)),
              total: i,
              filtered: 0
            }
          }),
          {"aggregation":"count","field":null}
        ));

        var labels = chart.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’]1[45]\b/);
        });
      });
    });
  });

  it('should react to filtered values', function() {

    var chart = createTimelineChart(640, false);

    var unfilteredPath = $('.shaded').attr('d');

    scope.chartData = filteredTestData;
    scope.$apply();

    var filteredPath = $('.shaded').attr('d');

    expect(unfilteredPath).to.not.be.empty;
    expect(filteredPath).to.not.be.empty;
    expect(unfilteredPath).to.not.equal(filteredPath);

  });

  it('should highlight the chart when the mouse is moved over the chart display', function() {

    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    mockWindowStateService.scrollPositionSubject.onNext(0);
    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 320,
      clientY: 100,
      target: $('.timeline-chart-highlight-target')[0]
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 1;

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);

  });

  it('should create a selection when the mouse is clicked on the chart display', function() {

    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    mockWindowStateService.scrollPositionSubject.onNext(0);
    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 320,
      clientY: 100,
      target: $('.timeline-chart-highlight-target')[0]
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 1;

    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 320,
      clientY: 100,
      target: $('.timeline-chart-highlight-target')[0]
    });

    var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);
    expect(wasThenSelected).to.equal(true);

  });

  it('should highlight the chart when the mouse is moved over the chart labels', function() {

    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    mockWindowStateService.scrollPositionSubject.onNext(0);
    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 10,
      clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
      target: $('.x-tick-label')[0]
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 1;

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);

  });

  it('should create a selection when the mouse is clicked on a chart label', function() {

    var chart = createTimelineChart(640, false);

    var wasNotSelected = !$('.timeline-chart-wrapper').hasClass('selected');

    mockWindowStateService.scrollPositionSubject.onNext(0);
    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 10,
      clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
      target: $('.x-tick-label')[0]
    });

    mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
    mockWindowStateService.mousePositionSubject.onNext({
      clientX: 10,
      clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
      target: $('.x-tick-label')[0]
    });

    var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

    expect(wasNotSelected).to.equal(true);
    expect(wasThenSelected).to.equal(true);

  });

  describe('when selecting', function() {

    it('should start selecting on mousedown within the chart display and stop selecting on mouse up within the chart display', function() {

      var chart = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);

    });

    it('should start selecting on mousedown within the chart display and stop selecting on mouse up within the chart labels', function() {

      var chart = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
        target: $('.x-tick-label')[0]
      });

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);

    });

    it('should start selecting on mousedown within the chart display and stop selecting on mouse up outside the chart display and labels', function() {

      var chart = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 1000,
        clientY: 1000,
        target: $('body')[0]
      });

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);

    });

    it('should display a selection range label', function() {

      var chart = createTimelineChart(640, false);

      var selectionRangeLabelWasNotVisible = $('.timeline-chart-clear-selection-label').css('display') === 'none';

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelecting).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

    });

  });

  describe('when selected', function() {

    it('should display a selection range label', function() {

      var chart = createTimelineChart(640, false);

      var selectionRangeLabelWasNotVisible = $('.timeline-chart-clear-selection-label').css('display') === 'none';

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

    });

    it('should request a filter dataset operation', function(done) {

      var chart = createTimelineChart(640, false);

      rootScope.$on('filter-timeline-chart', function(event, data) {

        expect(data).to.not.equal(null);
        done();

      });

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

    });

    // NOTE: Disabled for Safari 6.
    // See CORE-3861
    (isSafari6 ? xit : it)('should adjust the selected range when a selection marker is dragged to the left', function() {

      var chart = createTimelineChart(640, false);

      var selectionRangeLabelWasNotVisible = $('.timeline-chart-clear-selection-label').css('display') === 'none';

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');

      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      var selectionRangeOriginalWidth = $('.selection')[0].getBoundingClientRect().width;

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.selection-marker')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 100,
        clientY: 100,
        target: $('.selection-marker')[0]
      });

      var selectionRangeFinalWidth = $('.selection')[0].getBoundingClientRect().width;

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);
      expect(selectionRangeOriginalWidth).to.be.below(selectionRangeFinalWidth);

    });

    // NOTE: Disabled for Safari 6.
    // See CORE-3861
    (isSafari6 ? xit : it)('should adjust the selected range when a selection marker is dragged to the right', function() {

      var chart = createTimelineChart(640, false);

      var selectionRangeLabelWasNotVisible = $('.timeline-chart-clear-selection-label').css('display') === 'none';

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');

      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      var selectionRangeOriginalWidth = $('.selection')[0].getBoundingClientRect().width;

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.selection-marker')[1]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 500,
        clientY: 100,
        target: $('.selection-marker')[1]
      });

      var selectionRangeFinalWidth = $('.selection')[0].getBoundingClientRect().width;

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);
      expect(selectionRangeOriginalWidth).to.be.below(selectionRangeFinalWidth);

    });

    it('should request a clear dataset filter operation when the clear selection button is clicked', function(done) {

      var chart = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

      // Make sure to set the event listener here, after the selection state transition
      // has already emitted the 'filter dataset' event.
      rootScope.$on('filter-timeline-chart', function(event, data) {

        expect(data).to.equal(null);
        done();

      });

      testHelpers.fireEvent($('.timeline-chart-clear-selection-label')[0], 'mousedown');

    });

    it('should clear the selection when the clear selection button is clicked', function() {

      var chart = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('.timeline-chart-highlight-target')[0]
      });

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

      testHelpers.fireEvent($('.timeline-chart-clear-selection-label')[0], 'mousedown');

      var wasThenInTheDefaultState = !$('.timeline-chart-wrapper').hasClass('selecting') &&
                                     !$('.timeline-chart-wrapper').hasClass('selected');

      expect(wasThenInTheDefaultState).to.equal(true);

    });

  });

  describe('when not all labels can be shown', function() {

    it('should display fewer labels than there are data', function() {

      var chart = createTimelineChart(640, false);

      scope.precision = 'DAY';
      scope.chartData = hiddenLabelTestData;
      scope.$apply();

      expect(scope.chartData.values.length).to.be.above($('.x-tick-label').length);

    });

    describe('and the mouse is hovering over a label', function() {

      xit('should emphasize the hovered-over datum', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var datumLabelWasNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 360,
          clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelWasStillNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereStillNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');
        var oneXAxisTickLabelWasEmphasized = $('.x-tick-label.emphasis').length === 1;

        expect(datumLabelWasNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereNotDimmed).to.equal(true);
        expect(datumLabelWasStillNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereStillNotDimmed).to.equal(true);
        expect(oneXAxisTickLabelWasEmphasized).to.equal(true);

      });

    });

    describe('and the mouse is hovering over a labeled datum', function() {

      xit('should emphasize the hovered-over datum', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var datumLabelWasNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 360,
          clientY: 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelWasStillNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereStillNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');
        var oneXAxisTickLabelWasEmphasized = $('.x-tick-label.emphasis').length === 1;

        expect(datumLabelWasNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereNotDimmed).to.equal(true);
        expect(datumLabelWasStillNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereStillNotDimmed).to.equal(true);
        expect(oneXAxisTickLabelWasEmphasized).to.equal(true);

      });

    });

    describe('and the mouse is hovering over the labels in an unlabeld area', function() {

      it('should highlight the chart', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 360,
          clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 1;

        expect(wasUnhighlighted).to.equal(true);
        expect(wasThenHighlighted).to.equal(true);

      });

      it('should render a bolded label for the datum and dim every x-axis tick label', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var datumLabelWasNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 320,
          clientY: $('#test-timeline-chart').offset().top + $('#test-timeline-chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelWasThenVisible = $('.datum-label').css('display') === 'block';
        var xAxisTickLabelsWereThenDimmed = $('.timeline-chart-wrapper').hasClass('dimmed');

        expect(datumLabelWasNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereNotDimmed).to.equal(true);
        expect(datumLabelWasThenVisible).to.equal(true);
        expect(xAxisTickLabelsWereThenDimmed).to.equal(true);

      });

    });

    describe('and the mouse is hovering over the chart in an unlabeled area', function() {

      it('should highlight the chart', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 360,
          clientY: 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 1;

        expect(wasUnhighlighted).to.equal(true);
        expect(wasThenHighlighted).to.equal(true);

      });

      it('should render a bolded label for the datum and dim every x-axis tick label', function() {

        var chart = createTimelineChart(640, false);

        scope.precision = 'DAY';
        scope.chartData = hiddenLabelTestData;
        scope.$apply();

        var datumLabelWasNotVisible = $('.datum-label').css('display') === 'none';
        var xAxisTickLabelsWereNotDimmed = !$('.timeline-chart-wrapper').hasClass('dimmed');

        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 320,
          clientY: 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelWasThenVisible = $('.datum-label').css('display') === 'block';
        var xAxisTickLabelsWereThenDimmed = $('.timeline-chart-wrapper').hasClass('dimmed');

        expect(datumLabelWasNotVisible).to.equal(true);
        expect(xAxisTickLabelsWereNotDimmed).to.equal(true);
        expect(datumLabelWasThenVisible).to.equal(true);
        expect(xAxisTickLabelsWereThenDimmed).to.equal(true);

      });

    });

  });

  describe('when on a page with multiple timeline charts', function() {

    it('should not respond to selection events on other timeline charts', function() {

      var chart1 = createTimelineChart(640, false);
      var chart2 = createTimelineChart(640, false);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 320,
        clientY: 100,
        target: $('#test-timeline-chart .timeline-chart-highlight-target')[0]
      });

      mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
      mockWindowStateService.mousePositionSubject.onNext({
        clientX: 370,
        clientY: 100,
        target: $('#test-timeline-chart .timeline-chart-highlight-target')[0]
      });

      var chart1WasSelected = $('#test-timeline-chart .timeline-chart-wrapper').hasClass('selected');
      var chart2WasNotSelected = !$('#alternate-test-timeline-chart .timeline-chart-wrapper').hasClass('selected');

      expect(chart1WasSelected).to.equal(true);
      expect(chart2WasNotSelected).to.equal(true);

    });

  });

});
