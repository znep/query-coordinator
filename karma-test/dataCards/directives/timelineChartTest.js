describe('timelineChart', function() {
  var th, compile, rootScope, scope, timeout, testData;

  var testJson = 'karma-test/dataCards/test-data/timelineChartTest/chicago-crimes.json';
  beforeEach(module(testJson));

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    th = $injector.get('testHelpers');
    compile = $injector.get('$compile');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    testData = _.map(th.getTestJson(testJson), function(datum) {
      return {
        date: moment(datum.date_trunc),
        total: Number(datum.value),
        filtered: Number(datum.value)/2,
        special: false
      };
    });
  }));

  after(function() {
    removeTimelineChart();
  });

  var createNewTimelineChart = function(width, expanded, showFiltered, data) {
    removeTimelineChart();
    if (!width) width = 640;
    if (!expanded) expanded = false;
    if (!data) data = testData;
    if (!_.isBoolean(showFiltered)) showFiltered = false;

    var html =
      '<div class="card-visualization" style="width: ' + width + 'px; height: 480px;">' +
        '<div timeline-chart class="timeline-chart"' +
          ' chart-data="testData" show-filtered="showFiltered" expanded="expanded" precision="precision">' +
        '</div>' +
      '</div>';
    var elem = angular.element(html);

    $('body').append('<div id="timelineChartTest"></div>');
    $('#timelineChartTest').append(elem);

    var compiledElem = compile(elem)(scope);

    scope.expanded = expanded;
    scope.testData = data;
    scope.showFiltered = showFiltered;
    scope.precision = "MONTH";
    scope.$digest();

    return {
      element: $(compiledElem),
      scope: scope
    };
  };
  var removeTimelineChart = function() {
    $('#timelineChartTest').remove();
  };

  describe('when not expanded at 640px', function() {

    it('should create segments and 13 labels', function() {
      var chart = createNewTimelineChart();
      expect($('g.segment').length).to.equal(testData.length);
      expect(chart.element.find('.labels div.label').length).to.equal(13);
    });
    it('should create segments with correct children', function() {
      var chart = createNewTimelineChart();
      _.each($('g.segment'), function(segment) {
        $seg = $(segment);
        expect($seg.children().length).to.equal(5);
        expect($seg.find('.filtered.line').length).to.equal(1);
        expect($seg.find('.unfiltered.line').length).to.equal(1);
        expect($seg.find('.filtered.fill').length).to.equal(1);
        expect($seg.find('.unfiltered.fill').length).to.equal(1);
        expect($seg.find('rect.spacer').length).to.equal(1);
      });
    });
    it('should create 3 ticks on the y-axis', function() {
      var chart = createNewTimelineChart();
      expect(chart.element.find('.ticks > div').length).to.equal(3);
    });
    it('should create 13 ticks on the x-axis', function() {
      var chart = createNewTimelineChart();
      expect(chart.element.find('g.xticks > rect.tick').length).to.equal(13);
    });
    it('should create a popup on mouse over with no filter and total of 16.4K', function() {
      var chart = createNewTimelineChart();
      chart.element.find('g.segment rect.spacer').mouseover();
      expect($('.flyout').length).to.equal(1);
      var $rows = $(".flyout .flyout-row");
      expect($rows.length).to.equal(1);
      expect($rows.children().last().text()).to.equal('16.4K');
    });
    it('should create a popup on mouse over with filter of 8,204', function() {
      var chart = createNewTimelineChart(640, false, true);
      chart.element.find('g.segment rect.spacer').mouseover();
      expect($('.flyout').length).to.equal(1);
      var $rows = $(".flyout .flyout-row");
      expect($rows.length).to.equal(2);
      expect($rows.last().children().last().text()).to.equal('8,204');
    });
    it('should highlight a label when hovering over the chart', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segments = chart.element.find('g.segment rect.spacer');
      segments.eq(Math.floor(segments.length/2)).mouseover();
      expect($('.flyout').length).to.equal(1);
      expect(chart.element.find('.labels .label.active').length).to.equal(1);
      expect(chart.element.find('.labels .label.active')).to.be.visible;
    });
    it('when hovering over a label it should highlight and create a flyout', function() {
      var chart = createNewTimelineChart(640, false, true);
      chart.element.find('.labels .label .text').mouseover();
      expect($('.flyout').length).to.equal(1);
      expect(chart.element.find('.labels .label.active').length).to.equal(1);
      expect(chart.element.find('.labels .label.active')).to.be.visible;
    });
    it('should create labels with different positions', function() {
      var chart = createNewTimelineChart(640, false, true);
      var positions = _.map(chart.element.find('.labels div.label'), function(label) {
        return $(label).attr('style');
      });
      expect(_.uniq(positions).length).to.equal(positions.length);
    });
    it('should be able to change data', function(done) {
      var chart = createNewTimelineChart(640, false, true);
      var paths = _.map($('path'), function(path) {
        return $(path).attr('d');
      });

      chart.scope.testData = _.map(testData, function(datum) {
        datum.filtered /= 2;
        return datum;
      });

      chart.scope.$digest();
      _.defer(function() {
        var newPaths = _.map($('path.fill'), function(path) {
          return $(path).attr('d');
        });
        _.each(_.zip(paths, newPaths), function(a) {
          expect(a[0]).to.not.equal(a[1]);
        });
        done();
      });

    });
  });
});
