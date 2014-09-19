describe('timelineChart', function() {
  var th, compile, rootScope, scope, timeout, testData;

  var testJson = 'karma-test/dataCards/test-data/timelineChartTest/chicago-crimes.json';
  beforeEach(module(testJson));

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.directives'));

  beforeEach(module('dataCards/timeline-chart.sass'));

  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));

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

  // NOTE: TEMPORARY TEST DEBUGGING
  // For some reason, flyouts keep appearing in inconsistent numbers.
  // Log out the contents for debugging help.
  function printAllFlyoutContent() {
    $('.flyout').each(function(i, flyout) {
      console.log('Unexpected flyout found, possible test bug:', $(flyout).html());
    });
    $('.flyout').remove();
  }

  after(function() {
    removeTimelineChart();
  });

  var createNewTimelineChart = function(width, expanded, showFiltered) {
    removeTimelineChart();

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
    childScope.testData = testData;
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
  var activeChartScenario = null;
  var activeChart = null;

  var getChartWithScenario = function(type) {
    if (activeChartScenario !== type) {
      switch(type) {
        case '640px unexpanded unfiltered': activeChart = createNewTimelineChart(640, false, false); break;
        case '300px unexpanded unfiltered': activeChart = createNewTimelineChart(300, false, false); break;
        case '640px unexpanded filtered': activeChart = createNewTimelineChart(640, false, true); break;
        default: throw new Error('unsupported chart scenario'); break;
      }
      activeChartScenario = type;
    }
    return activeChart;
  };
  var removeAllScenarioCharts = function() {
    removeTimelineChart();
    activeChart = null;
    activeChartScenario = null;
  };


  describe('when not expanded at 640px', function() {
    it('should create segments and 13 labels', function() {
      var chart = getChartWithScenario('640px unexpanded unfiltered');
      expect($('g.segment').length).to.equal(testData.length);
      expect(chart.element.find('.labels div.label').length).to.equal(13);
    });
    it('should create segments with correct children', function() {
      var chart = getChartWithScenario('640px unexpanded unfiltered');
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
      var chart = getChartWithScenario('640px unexpanded unfiltered');
      expect(chart.element.find('.ticks > div').length).to.equal(3);
    });
    it('should create 13 ticks on the x-axis', function() {
      var chart = getChartWithScenario('640px unexpanded unfiltered');
      expect(chart.element.find('g.xticks > rect.tick').length).to.equal(13);
    });
    it('should create a popup on mouse over with no filter and total of 16.4K', function() {
      printAllFlyoutContent();
      var expectedFlyoutSelector = '.flyout:contains(16.4K)';

      var chart = getChartWithScenario('640px unexpanded unfiltered');
      chart.element.find('g.segment rect.spacer').mouseover();
      expect($(expectedFlyoutSelector).length).to.equal(1);
      var $rows = $(expectedFlyoutSelector + " .flyout-row");
      expect($rows.length).to.equal(1);
      expect($rows.children().last().text()).to.equal('16.4K');
      chart.element.find('g.segment rect.spacer').mouseout();
      expect($(expectedFlyoutSelector).length).to.equal(0);
    });
    describe('if not showFiltered', function() {
      it('should not show the filtered count', function() {
        printAllFlyoutContent();
        var expectedFlyoutSelector = '.flyout:contains(Filtered Amount)';

        var chart = getChartWithScenario('640px unexpanded unfiltered');

        chart.element.find('g.segment').eq(1).mouseover();
        expect($(expectedFlyoutSelector).length).to.equal(0);
        chart.element.find('g.segment').eq(1).mouseout();
        expect($(expectedFlyoutSelector).length).to.equal(0);
      });
    });
    it('should create a popup on mouse over with filter of 8,204', function() {
      printAllFlyoutContent();
      var expectedFlyoutSelector = '.flyout:contains(8,204)';

      var chart = getChartWithScenario('640px unexpanded filtered');
      chart.element.find('g.segment rect.spacer').mouseover();
      expect($(expectedFlyoutSelector).length).to.equal(1);
      var $rows = $(expectedFlyoutSelector + " .flyout-row");
      expect($rows.length).to.equal(2);
      expect($rows.last().children().last().text()).to.equal('8,204');
      chart.element.find('g.segment rect.spacer').mouseout();
      expect($(expectedFlyoutSelector).length).to.equal(0);
    });
    it('should highlight a label when hovering over the chart', function() {
      printAllFlyoutContent();
      var expectedFlyoutSelector = '.flyout:contains(June 2007)';

      var chart = getChartWithScenario('640px unexpanded filtered');
      var segments = chart.element.find('g.segment rect.spacer');
      segments.eq(Math.floor(segments.length/2)).mouseover();
      expect($(expectedFlyoutSelector).length).to.be.above(0);

      var activeLabels = chart.element.find('.labels .label.active');
      expect(activeLabels.length).to.be.above(0); //NOTE for some reason, multiple labels appear but only on BrowserStack.
                                                  //Works fine locally, even when the tests are run continuously for an hour.
      if (activeLabels.length > 1) {
        console.warn('Multiple active labels popped up - ignoring for now.');
        console.warn('Text: ' + activeLabels.text());
      }

      expect(activeLabels).to.be.visible;
      segments.eq(Math.floor(segments.length/2)).mouseout();
      expect($(expectedFlyoutSelector).length).to.equal(0);
    });
    describe('flyout', function() {
      it('should appear when hovering over a label, also highlighting the area', function() {
        printAllFlyoutContent();
        var expectedFlyoutSelector = '.flyout:contains(480K):contains(Total)';

        var chart = getChartWithScenario('640px unexpanded filtered');
        chart.element.find('.labels .label').eq(0).mouseover();
        expect($(expectedFlyoutSelector).length).to.be.above(0);
        expect(chart.element.find('g.segment.hover').length).to.equal(12);

        var activeLabels = chart.element.find('.labels .label.active');
        expect(activeLabels.length).to.be.above(0); //NOTE for some reason, multiple labels appear but only on BrowserStack.
                                                    //Works fine locally, even when the tests are run continuously for an hour.
        if (activeLabels.length > 1) {
          console.warn('Multiple active labels popped up - ignoring for now.');
          console.warn('Text: ' + activeLabels.text());
        }

        expect(activeLabels).to.be.visible;
        chart.element.find('.labels .label').eq(0).mouseout();
        expect($(expectedFlyoutSelector).length).to.equal(0);
      });
      it('should switch orientation when hovering a section near the right edge of the card', function() {
        var $flyout;
        printAllFlyoutContent();
        var chart = getChartWithScenario('640px unexpanded filtered');
        var $segments = chart.element.find('g.segment');
        $segments.filter(':first').mouseover();
        $flyout = $('.flyout');
        expect($flyout.find('.flyout-arrow').hasClass('right')).to.be.false;
        $segments.filter(':last').mouseover();
        $flyout = $('.flyout');
        expect($flyout.find('.flyout-arrow').hasClass('right')).to.be.true;
        $segments.mouseout();
      });
    });
    it('should create labels with different positions', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var positions = _.map(chart.element.find('.labels div.label'), function(label) {
        return $(label).attr('style');
      });
      expect(_.uniq(positions).length).to.equal(positions.length);
    });
    it('should create a range label when a segment is clicked', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segment = chart.element.find('g.segment').eq(1);
      segment.mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('.label.highlighted .text').text()).to.equal('Feb \'01');
      expect(chart.element.find('g.segment.highlighted').length).to.equal(1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should create a range label and handles when a label is clicked', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segment = chart.element.find('.label').eq(1);
      segment.mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('.label.highlighted .text').text()).to.equal('2002');
      expect(chart.element.find('g.segment.highlighted').length).to.equal(12);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should create a range label and handles when a selection is dragged', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;
      segments.eq(start).mousedown();
      segments.eq(end).mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('.label.highlighted .text').text()).to.equal('Jun \'01 - Nov \'01');
      expect(chart.element.find('g.segment.highlighted').length).to.equal(end - start + 1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });

    it('should highlight labels onhover when not actively selecting', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;

      expect(chart.element.find('.label.active').length).to.equal(0);

      // Hover over data for the last label, and make sure it emboldens
      var farRightLabel = chart.element.find('.label:visible:not(.highlighted)').last();
      var farRightDate = d3.select(farRightLabel[0]).datum().date;
      // Now find one of the data points in the graph to hover over
      $(d3.select(chart.element[0]).selectAll('g.segment').filter(function(d) {
        return d.date > farRightDate;
      })[0][0]).mouseover();

      expect(chart.element.find('.label.active').length).not.to.equal(0);

      // clean up
      segments.eq(end).mouseleave().mouseup();
    });
    it('should not highlight labels onhover when actively selecting', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;
      // Creating a new filter
      segments.eq(start).mousedown();
      segments.eq(end).mousemove();

      expect(chart.element.find('.label.active').length).to.equal(0);

      // Hover over data for the last label, and make sure it doesn't embolden
      var farRightLabel = chart.element.find('.label:visible:not(.highlighted)').last();
      var farRightDate = d3.select(farRightLabel[0]).datum().date;
      // Now find one of the data points in the graph to hover over
      $(d3.select(chart.element[0]).selectAll('g.segment').filter(function(d) {
        return d.date > farRightDate;
      })[0][0]).mouseover();

      // Since we're in the middle of a filter selection, it should not become active.
      expect(chart.element.find('.label.active').length).to.equal(0);

      // clean up
      segments.eq(end).mouseleave().mouseup();
    });

    it('should be able to change a selection via dragging a handle', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segments = chart.element.find('g.segment');
      var start = 5;
      var end = 10;
      segments.eq(start).mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
      expect(chart.element.find('g.segment.highlighted').length).to.equal(1);

      chart.element.find('g.draghandle').eq(1).mousedown();
      chart.element.find('g.segment').eq(end).mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('.label.highlighted .text').text()).to.equal('Jun \'01 - Nov \'01');
      expect(chart.element.find('g.segment.highlighted').length).to.equal(end - start + 1);
      expect(chart.element.find('g.draghandle').length).to.equal(2);
    });
    it('should clear a range when drag handle is clicked', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segment = chart.element.find('g.segment').eq(1);
      segment.mousedown().mousemove().mouseup();
      var dragHandles = chart.element.find('g.draghandle');
      expect(dragHandles.length).to.equal(2);
      dragHandles.eq(0).mousedown().mouseup();
      expect(chart.element.find('g.draghandle').length).to.equal(0);
      removeAllScenarioCharts(); // Too annoying to clear state properly.
    });
    it('should fire a filter-changed event when selected and a filter-cleared event when cleared', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
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
      $('.label.highlighted').mousedown().mouseup();
      expect(filterCleared).to.equal(true, 'should have recieved the filter-cleared event.');
    });
    it('should be able to change data', function() {
      this.timeout(4000);
      var chart = getChartWithScenario('640px unexpanded filtered');
      var filteredPaths = _.map($('path.fill.filtered'), function(path) {
        return $(path).attr('d');
      });

      chart.scope.testData = _.map(testData, function(datum) {
        datum.filtered /= 2;
        return datum;
      });

      chart.scope.$digest();

      th.flushAllD3Transitions();

      var newFilteredPaths = _.map(chart.element.find('path.fill.filtered'), function(path) {
        return $(path).attr('d');
      });
      expect(filteredPaths).to.not.be.empty;
      expect(newFilteredPaths).to.not.be.empty;
      _.each(_.zip(filteredPaths, newFilteredPaths), function(a) {
        expect(a[0]).to.not.equal(a[1]);
      });
    });
    it('should be able to select a segment within a larger selection', function() {
      var chart = getChartWithScenario('640px unexpanded filtered');
      var segment = chart.element.find('.label').eq(1);
      segment.mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('g.segment.highlighted').length).to.equal(12);
      chart.element.find('g.segment.highlighted').eq(0).mousedown().mousemove().mouseup();
      expect(chart.element.find('.label.highlighted').length).to.equal(1);
      expect(chart.element.find('g.segment.highlighted').length).to.equal(1);
    });
    describe('if showFiltered', function() {
      it('should show the filtered count in the flyout', function() {
        printAllFlyoutContent();
        var chart = getChartWithScenario('640px unexpanded filtered');

        chart.element.find('g.segment').eq(1).mouseover();
        expect($('.flyout').is(':contains(Filtered Amount)')).to.equal(true);
      });
    });
  });
  describe('when not expanded at 300px', function() {
    it('should hide some labels', function() {
      var chart = getChartWithScenario('300px unexpanded unfiltered');
      expect(chart.element.find('.label').length).to.equal(13);
      expect(chart.element.find('.label').filter(function() { return $(this).css('opacity') > 0; }).length).to.equal(6);
    });
    it('should show hidden labels when the segment is moused over', function() {
      var SECTION_INDEX = 4;
      var SEGMENT_INDEX = SECTION_INDEX * 12;
      var chart = getChartWithScenario('300px unexpanded unfiltered');
      var $segment = chart.element.find('g.segment').eq(SEGMENT_INDEX);
      var $label = chart.element.find('.label').eq(SECTION_INDEX);
      expect(parseFloat($label.css('opacity'))).to.equal(0);
      $segment.mouseover();
      expect(parseFloat($label.css('opacity'))).to.equal(1);
      $segment.mouseout();
    });
    it('should show a hidden label when that label\'s area is moused over', function() {
      var SECTION_INDEX = 2;
      var chart = getChartWithScenario('300px unexpanded unfiltered');
      var $label = chart.element.find('.label').eq(SECTION_INDEX);
      expect(parseFloat($label.css('opacity'))).to.equal(0);
      $label.mouseover();
      expect(parseFloat($label.css('opacity'))).to.equal(1);
      $label.mouseout();
      expect(parseFloat($label.css('opacity'))).to.equal(0);
    });
  });
});
