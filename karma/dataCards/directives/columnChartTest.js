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

  // columnChart data structure: [name, unfilteredRowCount, filteredRowCount, rowIsSelected]
  var testData = [
    ["THEFT", 21571, 0, false],
    ["BATTERY", 18355, 0, false],
    ["NARCOTICS", 11552, 0, false],
    ["CRIMINAL DAMAGE", 9905, 0, false],
    ["OTHER OFFENSE", 6574, 0, false],
    ["ASSAULT", 6098, 0, false],
    ["BURGLARY", 5166, 0, false],
    ["DECEPTIVE PRACTICE", 5120, 0, false],
    ["MOTOR VEHICLE THEFT", 3828, 0, false],
    ["ROBBERY", 3457, 0, false],
    ["CRIMINAL TRESPASS", 2981, 0, false],
    ["WEAPONS VIOLATION", 1091, 0, false],
    ["PUBLIC PEACE VIOLATION", 1021, 0, false],
    ["OFFENSE INVOLVING CHILDREN", 919, 0, false],
    ["PROSTITUTION", 508, 0, false],
    ["INTERFERENCE WITH PUBLIC OFFICER", 479, 0, false],
    ["CRIM SEXUAL ASSAULT", 412, 0, false],
    ["SEX OFFENSE", 289, 0, false],
    ["LIQUOR LAW VIOLATION", 142, 0, false],
    ["HOMICIDE", 127, 0, false],
    ["ARSON", 126, 0, false],
    ["KIDNAPPING", 89, 0, false],
    ["GAMBLING", 70, 0, false],
    ["INTIMIDATION", 42, 0, false],
    ["STALKING", 41, 0, false],
    ["OBSCENITY", 12, 0, false],
    ["PUBLIC INDECENCY", 6, 0, false],
    ["NON-CRIMINAL", 5, 0, false],
    ["CONCEALED CARRY LICENSE VIOLATION", 5, 0, false],
    ["OTHER NARCOTIC VIOLATION", 5, 0, false],
    ["NON - CRIMINAL", 2, 0, false],
    ["NON-CRIMINAL (SUBJECT SPECIFIED)", 2, 0, false]
  ];

  function testDataWithQuoteAtIndex(index) {
    var modifiedData = _.clone(testData);
    modifiedData[index][0] = 'Name with "quotes"';
    return modifiedData;
  }

  function testDataWithBackslashAtIndex(index) {
    var modifiedData = _.clone(testData);
    modifiedData[index][0] = 'Name with ba\ck\\\\slashes\\';
    return modifiedData;
  }

  function testDataWithNumberAtIndex(index) {
    var modifiedData = _.clone(testData);
    modifiedData[index][0] = 5;
    return modifiedData;
  }

  function testDataWithFiltered() {
    var modifiedData = _.clone(testData);
    _(modifiedData).forEach(function(n) {
      n[2] = n[1] / 2; // set filtered row count to equal half the unfiltered row count
    });
    return modifiedData;
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
        '<column-chart class="column-chart">' +
        '</column-chart>' +
      '</div>';

    var elem = angular.element(html);

    $('body').append('<div class="columnChartTest"></div>');
    $('.columnChartTest').append(elem);

    var compiledElem = compile(elem)(scope);

    scope.expanded = expanded;
    scope.cardData = data;
    scope.showFiltered = false;
    scope.allowFilterChange = true;
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

          expect(events[0].additionalArguments[0].timestamp).to.be.lte(events[1].additionalArguments[0].timestamp);
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
      expect(labelText).to.not.equal('undefined');
      expect(labelText).to.equal(flyoutTitle);
    });

    it('should not fail on numeric titles', function() {
      chart = createColumnChart(640, false, testDataWithNumberAtIndex(0));
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
      expect(labelText).to.not.equal('undefined');
      expect(labelText).to.equal(flyoutTitle);
    });

    it('should escape backslashes in the title', function() {
      chart = createColumnChart(640, false, testDataWithBackslashAtIndex(0));
      var barLabel = $(labelContents).eq(0);
      var labelText = barLabel.find('.text').text();
      var flyoutTitle;
      var flyout = $('#uber-flyout');

      th.fireMouseEvent(barLabel.find(labelSubContents).get(0), 'mousemove');
      flyoutTitle = flyout.find('.flyout-title').text();
      expect(labelText).to.not.equal('undefined');
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
