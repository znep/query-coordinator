describe('columnChart', function() {
  'use strict';

  var th;
  var compile;
  var httpBackend;
  var rootScope;
  var scope;
  var timeout;
  var Constants;

  var minSmallCardBarWidth = 8;
  var maxSmallCardBarWidth = 30;
  var minExpandedCardBarWidth = 15;
  var maxExpandedCardBarWidth = 40;

  var CHART_HEIGHT = 480;

  var testData = [
    {"name": "THEFT", "total": 21571},
    {"name": "BATTERY", "total": 18355},
    {"name": "NARCOTICS", "total": 11552},
    {"name": "CRIMINAL DAMAGE", "total": 9905},
    {"name": "OTHER OFFENSE", "total": 6574},
    {"name": "ASSAULT", "total": 6098},
    {"name": "BURGLARY", "total": 5166},
    {"name": "DECEPTIVE PRACTICE", "total": 5120},
    {"name": "MOTOR VEHICLE THEFT", "total": 3828},
    {"name": "ROBBERY", "total": 3457},
    {"name": "CRIMINAL TRESPASS", "total": 2981},
    {"name": "WEAPONS VIOLATION", "total": 1091},
    {"name": "PUBLIC PEACE VIOLATION", "total": 1021},
    {"name": "OFFENSE INVOLVING CHILDREN", "total": 919},
    {"name": "PROSTITUTION", "total": 508},
    {"name": "INTERFERENCE WITH PUBLIC OFFICER", "total": 479},
    {"name": "CRIM SEXUAL ASSAULT", "total": 412},
    {"name": "SEX OFFENSE", "total": 289},
    {"name": "LIQUOR LAW VIOLATION", "total": 142},
    {"name": "HOMICIDE", "total": 127},
    {"name": "ARSON", "total": 126},
    {"name": "KIDNAPPING", "total": 89},
    {"name": "GAMBLING", "total": 70},
    {"name": "INTIMIDATION", "total": 42},
    {"name": "STALKING", "total": 41},
    {"name": "OBSCENITY", "total": 12},
    {"name": "PUBLIC INDECENCY", "total": 6},
    {"name": "NON-CRIMINAL", "total": 5},
    {"name": "CONCEALED CARRY LICENSE VIOLATION", "total": 5},
    {"name": "OTHER NARCOTIC VIOLATION", "total": 5},
    {"name": "NON - CRIMINAL", "total": 2},
    {"name": "NON-CRIMINAL (SUBJECT SPECIFIED)", "total": 2}
  ];

  function testDataWithQuoteAtIndex(index) {
    return _.map(testData, function(d, i) {
      return {
        name: i === index ? 'Name with "quotes"' : d.name,
        total: d.total,
        filtered: d.total / 2,
        special: false
      };
    });
  }

  function testDataWithFiltered() {
    return _.map(testData, function(d) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2
      };
    });
  }

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.services'));

  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    th = $injector.get('testHelpers');
    compile = $injector.get('$compile');
    httpBackend = $injector.get('$httpBackend');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    Constants = $injector.get('Constants');
  }));

  afterEach(function() {
    $('.columnChartTest').remove();
  });

  var createColumnChart = function(width, expanded, data) {
    if (!width) width = 640;
    if (!expanded) expanded = false;
    if (!data) data = testData;

    var html =
      '<div class="card-visualization" style="width: ' +
        width + 'px; height: ' + CHART_HEIGHT + 'px;">' +
        '<column-chart class="column-chart"' +
          ' chart-data="testData" show-filtered="showFiltered" expanded="expanded">' +
        '</column-chart>' +
      '</div>';

    var elem = angular.element(html);

    $('body').append('<div class="columnChartTest"></div>');
    $('.columnChartTest').append(elem);

    var compiledElem = compile(elem)(scope);

    scope.expanded = expanded;
    scope.testData = data;
    scope.showFiltered = false;
    scope.$digest();

    return {
      element: compiledElem,
      scope: scope
    };
  };

  describe('render timing events', function() {
    it('should emit render:start and render:complete events on rendering', function(done) {
      var chart;
      var scope;
      var element;

      chart = createColumnChart();
      scope = chart.scope;

      var renderEvents = scope.$eventToObservable('render:start').merge(scope.$eventToObservable('render:complete'));

      renderEvents.take(2).toArray().subscribe(
        function(events) {
          // Vis id is a string and is the same across events.
          expect(events[0].additionalArguments[0].source).to.satisfy(_.isString);
          expect(events[1].additionalArguments[0].source).to.equal(events[0].additionalArguments[0].source);

          // Times are ints and are in order.
          expect(events[0].additionalArguments[0].timestamp).to.satisfy(_.isFinite);
          expect(events[1].additionalArguments[0].timestamp).to.satisfy(_.isFinite);

          expect(events[0].additionalArguments[0].timestamp).to.be.below(events[1].additionalArguments[0].timestamp);
          done();
        }
      );

      // Pretend we got new data.
      scope.testData = testData.concat([]);
      scope.$digest();
      timeout.flush(); // Needed to simulate a frame. Render:complete won't be emitted otherwise.
    });
  });

  describe('flyouts', function() {

    var chart;
    var labelContents = '.labels .label .contents';
    var labelSubContents = 'span:not(.icon-close)';

    beforeEach(function() {
      $('#uber-flyout').hide();
    });

    it('should appear on mouseover of a bar', function() {
      chart = createColumnChart(640, false, testDataWithFiltered());
      var flyout = $('#uber-flyout');
      var barGroup = $('.bar-group').get(0);

      expect(flyout.is(':hidden')).to.equal(true);
      th.fireMouseEvent(barGroup, 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
    });

    it('should appear on mouseover of a bar\'s label', function() {
      chart = createColumnChart(640, false, testDataWithFiltered());
      var flyout = $('#uber-flyout');
      var barLabel = $(labelContents).eq(0);

      expect(flyout.is(':hidden')).to.equal(true);
      th.fireMouseEvent(barLabel.find(labelSubContents).get(0), 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
    });

    it('should have the correct title', function() {
      chart = createColumnChart(640, false, testDataWithFiltered());
      var barLabel = $(labelContents).eq(0);
      var labelText = barLabel.find('.text').text();
      var flyoutTitle;
      var flyout = $('#uber-flyout');

      th.fireMouseEvent(barLabel.find(labelSubContents).get(0), 'mousemove');
      flyoutTitle = flyout.find('.flyout-title').text();
      expect(labelText).to.equal(flyoutTitle);
    });

    it('should escape quotes in the title', function() {
      chart = createColumnChart(640, false, testDataWithQuoteAtIndex(0));
      var barLabel = $(labelContents).eq(0);
      var labelText = barLabel.find('.text').text();
      var flyoutTitle;
      var flyout = $('#uber-flyout');

      th.fireMouseEvent(barLabel.find(labelSubContents).get(0), 'mousemove');
      flyoutTitle = flyout.find('.flyout-title').text();
      expect(labelText).to.equal(flyoutTitle);
    });

    it('should disappear on mouseout of a bar and mouseover the flyout', function() {
      chart = createColumnChart(640, false, testDataWithFiltered());
      var flyout = $('#uber-flyout');
      var barGroup = $('.bar-group').get(0);

      th.fireMouseEvent(barGroup, 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
      th.fireMouseEvent(flyout.get(0), 'mousemove');
      expect(flyout.is(':hidden')).to.equal(true);
    });
  });
});
