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
    var childScope = scope.$new();
    var elem = angular.element(html);

    $('body').append('<div id="timelineChartTest"></div>');
    $('#timelineChartTest').append(elem);

    var compiledElem = compile(elem)(childScope);

    childScope.expanded = expanded;
    childScope.testData = data;
    childScope.showFiltered = showFiltered;
    childScope.precision = "MONTH";
    childScope.$digest();

    return {
      element: $(compiledElem),
      scope: childScope
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
      chart.element.find('.labels .label').eq(0).mouseover();
      expect($('.flyout').length).to.equal(1);
      expect(chart.element.find('g.segment.hover').length).to.equal(12);
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
    it('should create a range label when a segment is clicked', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segment = chart.element.find('g.segment').eq(1);
      segment.mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.special').length).to.equal(1);
      expect(chart.element.find('.label.special .text').text()).to.equal('Feb \'01');
      expect(chart.element.find('g.segment.special').length).to.equal(1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should create a range label and handles when a label is clicked', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segment = chart.element.find('.label').eq(1);
      segment.mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.special').length).to.equal(1);
      expect(chart.element.find('.label.special .text').text()).to.equal('2002');
      expect(chart.element.find('g.segment.special').length).to.equal(12);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should create a range label and handles when a selection is dragged', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;
      segments.eq(start).mousedown();
      segments.eq(end).mousemove().mouseup();
      expect(chart.element.find('.label.special').length).to.equal(1);
      expect(chart.element.find('.label.special .text').text()).to.equal('Jun \'01 - Nov \'01');
      expect(chart.element.find('g.segment.special').length).to.equal(end - start + 1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should be able to change a selection via dragging a handle', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;
      segments.eq(start).mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.special').length).to.equal(1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
      expect(chart.element.find('g.segment.special').length).to.equal(1);

      chart.element.find('g.draghandle').eq(1).mousedown();
      chart.element.find('g.segment').eq(end).mousemove().mouseup();
      expect(chart.element.find('.label.special').length).to.equal(1);
      expect(chart.element.find('.label.special .text').text()).to.equal('Jun \'01 - Nov \'01');
      expect(chart.element.find('g.segment.special').length).to.equal(end - start + 1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should clear a range when drag handle is clicked', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segment = chart.element.find('g.segment').eq(1);
      segment.mousedown().mousemove().mouseup();
      var dragHandles = chart.element.find('g.draghandle');
      expect(dragHandles.length).to.equal(2);
      dragHandles.eq(0).mousedown().mouseup();
      expect(chart.element.find('g.draghandle').length).to.equal(0);
    });
    it('should fire a filter-changed event when selected and a filter-cleared event when cleared', function() {
      var chart = createNewTimelineChart(640, false, true);
      var segments = $('g.segment');
      var filterChanged = false;
      scope.$on('timeline-chart:filter-changed', function(filter) {
        filterChanged = true;
      });
      segments.eq(5).mousedown().mousemove().mouseup();
      expect(filterChanged).to.equal(true, 'should have recieved the filter-changed event.');

      var filterCleared = false;
      scope.$on('timeline-chart:filter-cleared', function(filter) {
        filterCleared = true;
      });
      $('.label.special').mousedown().mouseup();
      expect(filterCleared).to.equal(true, 'should have recieved the filter-cleared event.');
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
    describe('if showFiltered', function() {
      it('should show the filtered count in the flyout', function() {
        var chart = createNewTimelineChart(640, false, true);

        chart.element.find('g.segment').eq(1).mouseover();
        expect($('.flyout').is(':contains(Filtered Amount)')).to.equal(true);
      });
    });
    describe('if not showFiltered', function() {
      it('should not show the filtered count', function() {
        var chart = createNewTimelineChart(640, false, false);

        chart.element.find('g.segment').eq(1).mouseover();
        expect($('.flyout').is(':contains(Filtered Amount)')).to.equal(false);
      });
    });
  });
  describe('when not expanded at 300px', function() {
    it('should hide some labels', function() {
      var chart = createNewTimelineChart();
      expect(chart.element.find('.label:visible').length).to.equal(3);
      expect(chart.element.find('.label').length).to.equal(13);
    });
  });
});
