import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import testHelpers from '../testHelpers';
import timelineTestData from '../timelineTestData';
import TimelineChart from 'common/visualizations/views/TimelineChart';

describe('TimelineChart', function() {
  'use strict';

  // Each rendering of the timeline chart potentially
  // leaves behind DOM nodes and associated event handlers.
  // This will cause tests to sporadically fail.
  // Fixing this issue requires a lot of big refactors, and
  // this codebase is no longer actively maintained.
  // Thus, this hack is preferable.
  afterEach((done) => {
    setTimeout(() => {
      $('div').remove();
      done();
    }, 50);
  });

  var CHART_WIDTH = 640;
  var CHART_HEIGHT = 480;

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;

  // NOTE: Selection rendering is slightly wonky in Safari 6.
  // Fixing this is not of high enough priority, so we disable
  // the affected tests in that platform only.
  var isSafari6 = /Mozilla\/5\.0.*AppleWebKit.*Version\/6\.[0-9.]+ Safari/.test(navigator.userAgent);

  var rootScope;
  var scope = {};
  var timeout;
  var Constants;
  var testData;

  var unfilteredTestData;
  var allLabelsTestData;
  var filteredTestData;
  var hiddenLabelTestData;
  var negativeTestData;
  var nonContinuousTestData;
  var noDataData;
  var allDataAtSameTimestampData;

  function transformChartDataForRendering(chartData) {
    var minDate = null;
    var maxDate = null;
    var minValue = Number.POSITIVE_INFINITY;
    var maxValue = Number.NEGATIVE_INFINITY;
    var meanValue;
    var allValues = chartData.map(function(datum) {

      if (minDate === null) {
        minDate = datum.date;
      } else if (datum.date < minDate) {
        minDate = datum.date;
      }

      if (maxDate === null) {
        maxDate = datum.date;
      } else if (datum.date > maxDate) {
        maxDate = datum.date;
      }

      if (datum.total < minValue) {
        minValue = datum.total;
      }

      if (datum.total > maxValue) {
        maxValue = datum.total;
      }

      return {
        date: datum.date.toDate(),
        filtered: datum.filtered,
        unfiltered: datum.total
      };
    });

    minValue = (minValue > 0) ? 0 : minValue;
    maxValue = (maxValue < 0) ? 0 : maxValue;
    meanValue = (maxValue + minValue) / 2;

    return {
      minDate: minDate.toDate(),
      maxDate: maxDate.toDate(),
      minValue: minValue,
      meanValue: meanValue,
      maxValue: maxValue,
      values: allValues
    };
  }

  beforeEach(function() {
    unfilteredTestData = unpickleTestData(timelineTestData.timelineChartTestData, false);
    allLabelsTestData = unpickleTestData(timelineTestData.allLabelsTimelineChartTestData, false);
    filteredTestData = unpickleTestData(timelineTestData.timelineChartTestData, true);
    hiddenLabelTestData = unpickleTestData(timelineTestData.hiddenLabelTimelineChartTestData, false);
    negativeTestData = unpickleTestData(timelineTestData.negativeTestData, false);
    nonContinuousTestData = unpickleTestData(timelineTestData.nonContinuousTestData, false);
    noDataData = unpickleTestData(timelineTestData.noData, false);
    allDataAtSameTimestampData = unpickleTestData(timelineTestData.allDataAtSameTimestamp, false);
  });

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

  function createTimelineChart(width, expanded, data, precision) {
    var overrideVIF = false;
    data = data || unfilteredTestData;
    precision = precision || 'MONTH';

    if (!width) {
      width = CHART_WIDTH;
    }

    var element = $(
      '<div>',
      {
        'id': 'chart',
        'style': 'width:' + width + 'px;height:' + CHART_HEIGHT + 'px;'
      }
    );

    $('body').append(element);

    var timelineChartVIF = {
      aggregation: {
        columnName: null,
        'function': 'count'
      },
      configuration: {
        columns: {
          name: NAME_INDEX,
          unfilteredValue: UNFILTERED_INDEX,
          filteredValue: FILTERED_INDEX
        },
        localization: {
          'no_value': '(No value)',
          'flyout_unfiltered_amount_label': 'UNFILTERED VALUE',
          'flyout_filtered_amount_label': 'FILTERED VALUE',
          'flyout_selected_notice': 'THIS COLUMN IS CURRENTLY SELECTED'
        },
        precision: precision,
        interactive: true
      },
      type: 'timelineChart',
      unit: {
        one: 'case',
        other: 'cases'
      }
    };

    if (overrideVIF) {
      _.merge(timelineChartVIF, overrideVIF);
    }

    var chart = new TimelineChart(element, timelineChartVIF);

    var renderOptions = {
      showAllLabels: false,
      showFiltered: false,
      precision: precision
    };

    chart.render(data, renderOptions);

    return {
      element: element,
      chart: chart,
      renderOptions: renderOptions
    };
  }

  function removeTimelineChart() {
    $('#test-timeline-chart').remove();
    $('#alternate-test-timeline-chart').remove();
    $('#uber-flyout').hide();
  }

  afterEach(function() {
    $('#chart').remove();
  });

  it("should create 1 grey ('.context') and 1 blue ('.shaded') path", function() {

    var chart = createTimelineChart(640, false);

    expect($('path.context').length).to.equal(1);
    expect($('path.shaded').length).to.equal(1);

  });

  describe('axis creation', function() {

    it('correctly updates tick and label count if underlying data is changed', function() {
      var chart = createTimelineChart(640, false, allDataAtSameTimestampData);

      chart.chart.render(unfilteredTestData, chart.renderOptions);

      expect($('.x-tick').length).to.be.above(1);
      expect($('.x-tick-label').length).to.be.above(1);

    });

    it('should draw a single label if all data is at the same timestamp', function() {
      var chart = createTimelineChart(640, false, allDataAtSameTimestampData);

      expect($('.x-tick-label').length).to.equal(1);

    });

    // A valid x-axis scale for this test data will have one more label
    // than there are ticks. Imagine a piece of paper with six vertical
    // lines drawn on it at a constant interval where no line is at the
    // edge of the paper. There will be a gap before every tick and one
    // additional one after the last tick.
    it('should create 6 x-axis ticks and 7 x-axis labels with default test data', function() {

      var chart = createTimelineChart(640, false);

      expect($('.x-tick').length).to.equal(6);
      expect($('.x-tick-label').length).to.equal(7);

    });

    it('should create x-axis labels with unique horizontal positions', function() {
      var chart = createTimelineChart(640, false);

      var positions = _.map($('.x-tick-label'), function(label) {
        return $(label).css('left');
      });

      expect(_.uniq(positions).length).to.equal(positions.length);
    });

    it('should create 3 y-axis ticks and 3 y-axis labels', function() {
      var chart = createTimelineChart(640, false);

      expect($('.y-tick').length).to.equal(3);
    });

    it('should create y-axis ticks with unique vertical positions', function() {
      var chart = createTimelineChart(640, false, negativeTestData, 'DAY');

      var positions = _.map($('.y-tick'), function(tick) {
        return $(tick).css('bottom');
      });

      expect(_.uniq(positions).length).to.equal(positions.length);
    });

    describe('label granularity', function() {
      var transformChartData;

      beforeEach(function() {
        transformChartData = transformChartDataForRendering;
      });

      it('should format for decade when the data spans more than 20 years', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000 + i, 0, 1)),
              total: i,
              filtered: 0
            };
          })
        ), 'YEAR');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          // The last x-axis label may not include text if it does not
          // span the entire range (e.g. if there are fewer than 10 years
          // on the x-axis after the last decade label.
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b20[0-9]0s\b/);
          }
        });
      });

      it('formats for decade, even if the data is not exactly on the year mark', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000 + i, 0, 1)),
              total: i,
              filtered: 0
            };
          })
       ), 'YEAR');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          // The last x-axis label may not include text if it does not
          // span the entire range (e.g. if there are fewer than 10 years
          // on the x-axis after the last decade label.
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b20[0-9]0s\b/);
          }
        });
      });

      it('formats for decade, even if the data is not exactly on the year mark', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000 + i, 2, 3)),
              total: i,
              filtered: 0
            };
          })
        ), 'YEAR');

        var labels = chart.element.find('.x-tick-label');
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
            };
          })
        ));

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          // The last x-axis label may not include text if it does not
          // span the entire range (e.g. if there are fewer than 10 years
          // on the x-axis after the last decade label.
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b20[01][0-9]\b/);
          }
        });
      });

      it('should format for month when the data spans 2 < x < 24 months', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(80), function(i) {
            return {
              date: moment(new Date(2009, 11, i)),
              total: i,
              filtered: 0
            };
          })
        ), 'DAY');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          // The last x-axis label may not include text if it does not
          // span the entire range (e.g. if there are fewer than 10 years
          // on the x-axis after the last decade label.
          if (this.innerHTML !== '') {
            expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’]\d\d\b/);
          }
        });
      });

      // See CORE-4216
      it('should not render an extra 1 before abbreviated years in the teens when formatted by month (CORE-4216).', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(80), function(i) {
            return {
              date: moment(new Date(2009, 11, i)),
              total: i,
              filtered: 0
            };
          })
        ), 'DAY');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          // The last x-axis label may not include text if it does not
          // span the entire range (e.g. if there are fewer than 10 years
          // on the x-axis after the last decade label.
          if (this.innerHTML !== '') {
            // Format should be something like, Nov '09, and Jan '10
            expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’][01][901]\b/);
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
            };
          })
        ), 'DAY');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          expect(this.innerHTML).to.match(/\b[1-9]?[0-9] [A-Z][a-z][a-z]\b/);
        });
      });

      it('should not label the interval between the last tick and the right edge of the chart if that interval is not equal to the label precision', function() {
        var chart = createTimelineChart(640, false, unfilteredTestData);

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        expect(labels.last().text()).to.equal('');
      });

      it('should label the interval between the last tick and the right edge of the chart if that interval is equal to the label precision', function() {
        var chart = createTimelineChart(640, false, allLabelsTestData, 'DAY');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        expect(labels.last().text()).to.not.equal('');
      });

      it('should label the interval between the last tick and the right edge of the chart if that interval is equal to the label precision for decades', function() {
        var chart = createTimelineChart(640, false, transformChartData(
          _.map(_.range(30), function(i) {
            return {
              date: moment(new Date(2000 + i, 0, 1)),
              total: i,
              filtered: 0
            };
          })
       ), 'YEAR');

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        expect(labels.last().text()).to.not.equal('');
      });

      it('should format for month when the data has gaps in it', function() {
        var chart = createTimelineChart(640, false, nonContinuousTestData);

        var labels = chart.element.find('.x-tick-label');
        expect(labels.length).to.be.greaterThan(0);
        labels.each(function() {
          expect(this.innerHTML).to.match(/\b[A-Z][a-z][a-z] ['’]1[45]\b/);
        });
      });
    });
  });

  it('should react to filtered values', function() {
    var chart = createTimelineChart(640, false, filteredTestData);

    var unfilteredPath = $('path.context').attr('d');
    var filteredPath = $('path.shaded').attr('d');

    expect(unfilteredPath).to.not.be.empty;
    expect(filteredPath).to.not.be.empty;
    expect(unfilteredPath).to.not.equal(filteredPath);
  });

  it('should highlight the chart when the mouse is moved over the chart display', function() {
    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
      clientX: 320,
      clientY: chart.element.offset().top + 100,
      target: $('.timeline-chart-highlight-target')[0]
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length !== 0;

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);
  });

  it('should create a selection when the mouse is clicked on the chart display', function() {
    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    testHelpers.fireMouseEvent($('.timeline-chart').get(0), 'mousemove', {
      clientX: 320,
      clientY: 100
    });

    testHelpers.fireMouseEvent($('.timeline-chart').get(0), 'mousedown', {
      clientX: 320,
      clientY: 100
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length !== 0;

    testHelpers.fireMouseEvent($('.timeline-chart').get(0), 'mouseup', {
      clientX: 320,
      clientY: 100
    });

    var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);
    expect(wasThenSelected).to.equal(true);
  });

  it('should highlight the chart when the mouse is moved over the chart labels', function() {
    var chart = createTimelineChart(640, false);

    var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

    testHelpers.fireMouseEvent($('.timeline-chart').get(0), 'mousemove', {
      clientX: 10,
      clientY: chart.element.offset().top + chart.element.height() - 15
    });

    var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length !== 0;

    expect(wasUnhighlighted).to.equal(true);
    expect(wasThenHighlighted).to.equal(true);
  });

  it('should create a selection when the mouse is clicked on a chart label', function() {
    var chart = createTimelineChart(640, false);
    var mouseTarget = document.querySelector('.x-tick-label');
    var mousePosition = {
      clientX: 10,
      clientY: chart.element.offset().top + chart.element.height() - 15
    };

    var wasNotSelected = !$('.timeline-chart-wrapper').hasClass('selected');

    testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
    testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);
    testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

    var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

    expect(wasNotSelected).to.equal(true);
    expect(wasThenSelected).to.equal(true);
  });

  describe('when selecting', function() {

    it('should start selecting on mousedown within the chart display and stop selecting on mouse up within the chart display', function() {
      var chart = createTimelineChart(640, false);
      var mouseTarget = document.querySelector('.timeline-chart-highlight-target');
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      mousePosition.clientX += 50;
      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);
    });

    it('should start selecting on mousedown within the chart display and stop selecting on mouseup within the chart labels', function() {
      var chart = createTimelineChart(640, false);
      var mouseTarget = document.querySelector('.timeline-chart-highlight-target');
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      // Stop selecting over labels.
      mousePosition.clientX += 50;
      mousePosition.clientY = chart.element.offset().top + chart.element.height() - 15;
      mouseTarget = document.querySelector('.x-tick-label');

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);
    });

    xit('should start selecting on mousedown within the chart display and stop selecting on mouse up outside the chart display and labels', function() {
      var chart = createTimelineChart(640, false);
      var mouseTarget = document.querySelector('.timeline-chart-highlight-target');
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      var wasSelecting = $('.timeline-chart-wrapper').hasClass('selecting');

      mousePosition.clientX = 1000;
      mousePosition.clientY = 1000;
      mouseTarget = document.querySelector('body');

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasThenNotSelecting = !$('.timeline-chart-wrapper').hasClass('selecting');
      var wasThenSelected = $('.timeline-chart-wrapper').hasClass('selected');

      expect(wasSelecting).to.equal(true);
      expect(wasThenNotSelecting).to.equal(true);
      expect(wasThenSelected).to.equal(true);
    });

    it('should display a selection range label', function() {
      var chart = createTimelineChart(640, false);
      var mouseTarget = document.querySelector('.timeline-chart-highlight-target');
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      var selectionRangeLabelWasNotVisible = $('.timeline-chart-clear-selection-label').css('display') === 'none';

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

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

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.x += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);
    });

    it('should request a filter dataset operation', function(done) {
      var chart = createTimelineChart(640, false);

      chart.element.on('SOCRATA_VISUALIZATION_TIMELINE_FILTER', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload).to.not.equal(null);
        done();
      });

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

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

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';
      var selectionRangeOriginalWidth = $('.selection')[0].getBoundingClientRect().width;

      mousePosition.clientX = 320;
      mouseTarget = $('.selection-marker').get(0);

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX = 100;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

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

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';
      var selectionRangeOriginalWidth = $('.selection')[0].getBoundingClientRect().width;

      mouseTarget = $('.selection-marker').get(1);

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX = 500;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var selectionRangeFinalWidth = $('.selection')[0].getBoundingClientRect().width;

      expect(selectionRangeLabelWasNotVisible).to.equal(true);
      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);
      expect(selectionRangeOriginalWidth).to.be.below(selectionRangeFinalWidth);
    });

    it('should request a clear dataset filter operation when the clear selection button is clicked', function(done) {
      var chart = createTimelineChart(640, false);

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

      // Make sure to set the event listener here, after the selection state transition
      // has already emitted the 'filter dataset' event.
      chart.element.on('SOCRATA_VISUALIZATION_TIMELINE_FILTER', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload).to.equal(null);
        done();
      });

      testHelpers.fireEvent($('.timeline-chart-clear-selection-label').get(0), 'mousedown');
    });

    it('should clear the selection when the clear selection button is clicked', function() {
      var chart = createTimelineChart(640, false);

      var mouseTarget = $('.timeline-chart-highlight-target').get(0);
      var mousePosition = {
        clientX: 320,
        clientY: 100
      };

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mousedown', mousePosition);

      mousePosition.clientX += 50;

      testHelpers.fireMouseEvent(mouseTarget, 'mousemove', mousePosition);
      testHelpers.fireMouseEvent(mouseTarget, 'mouseup', mousePosition);

      var wasSelected = $('.timeline-chart-wrapper').hasClass('selected');
      var selectionRangeLabelWasThenVisible = $('.timeline-chart-clear-selection-label').css('display') === 'block';

      expect(wasSelected).to.equal(true);
      expect(selectionRangeLabelWasThenVisible).to.equal(true);

      testHelpers.fireEvent($('.timeline-chart-clear-selection-label')[0], 'mousedown');

      var wasThenInTheDefaultState = !$('.timeline-chart-wrapper').is('selecting, selected');

      expect(wasThenInTheDefaultState).to.equal(true);
    });
  });

  describe('when not all labels can be shown', function() {

    it('should display fewer labels than there are data', function() {

      var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

      expect(hiddenLabelTestData.values.length).to.be.above($('.x-tick-label').length);

    });

    describe('and the mouse is hovering over a label', function() {

      it('should emphasize the hovered-over datum', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var datumLabelNotVisible = $('.datum-label').css('display') === 'none';
        expect(datumLabelNotVisible).to.equal(true);

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 360,
          clientY: $('#chart').offset().top + $('#chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelVisible = $('.datum-label').css('display') === 'block';
        expect(datumLabelVisible).to.equal(true);
      });

      it('should position the datum label correctly in the middle of the highlighted region', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');
        var highlightTarget = $('.timeline-chart-highlight-target');
        var datumLabel = $('.datum-label');
        var middleOfHighlightTarget;
        var middleOfDatumLabel;
        var TOLERANCE = 3;

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 360,
          clientY: $('#chart').offset().top + $('#chart').height() - 15,
          target: highlightTarget[0]
        });

        middleOfHighlightTarget = highlightTarget.offset().left + (highlightTarget.width() / 2);
        middleOfDatumLabel = datumLabel.offset().left + (datumLabel.width() / 2);
        expect(middleOfHighlightTarget - middleOfDatumLabel).to.be.within(-TOLERANCE, TOLERANCE);
      });

      it('should correctly position the datum label on the right edge of the chart', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');
        var highlightTarget = $('.timeline-chart-highlight-target');
        var datumLabel = $('.datum-label');
        var datumLabelRightEdge;
        var TOLERANCE = 3;
        var chartOffset = chart.element.offset().left;

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 630,
          clientY: chart.element.offset().top + chart.element.height() - 15,
          target: highlightTarget[0]
        });

        datumLabelRightEdge = datumLabel.offset().left + datumLabel.width();
        expect(datumLabelRightEdge - 640 - chartOffset).to.be.within(-TOLERANCE, TOLERANCE);
      });

      it('should correctly position the datum label on the left edge of the chart', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');
        var highlightTarget = $('.timeline-chart-highlight-target');
        var datumLabel = $('.datum-label');
        var TOLERANCE = 3;
        var chartOffset = chart.element.offset().left;

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 10,
          clientY: $('#chart').offset().top + $('#chart').height() - 15,
          target: highlightTarget[0]
        });

        expect(datumLabel.offset().left - chartOffset).to.be.within(-TOLERANCE, TOLERANCE);
      });

    });

    describe('and the mouse is hovering over a labeled datum', function() {

      it('should emphasize the hovered-over datum', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var datumLabelNotVisible = $('.datum-label').css('display') === 'none';
        expect(datumLabelNotVisible).to.equal(true);

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 360,
          clientY: chart.element.offset().top + 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelVisible = $('.datum-label').css('display') === 'block';
        expect(datumLabelVisible).to.equal(true);

      });

    });

    describe('and the mouse is hovering over the labels in an unlabeled area', function() {

      it('should highlight the chart', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 360,
          clientY: $('#chart').offset().top + $('#chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length !== 0;

        expect(wasUnhighlighted).to.equal(true);
        expect(wasThenHighlighted).to.equal(true);

      });

      it('should render a bolded label for the datum and dim every x-axis tick label', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var datumLabelNotVisible = $('.datum-label').css('display') === 'none';
        expect(datumLabelNotVisible).to.equal(true);

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 320,
          clientY: $('#chart').offset().top + $('#chart').height() - 15,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelVisible = $('.datum-label').css('display') === 'block';
        expect(datumLabelVisible).to.equal(true);

      });

    });

    describe('and the mouse is hovering over the chart in an unlabeled area', function() {

      it('should highlight the chart', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var wasUnhighlighted = $('.timeline-chart-highlight-container').children('g').children().length === 0;

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 360,
          clientY: chart.element.offset().top + 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var wasThenHighlighted = $('.timeline-chart-highlight-container').children('g').children().length !== 0;

        expect(wasUnhighlighted).to.equal(true);
        expect(wasThenHighlighted).to.equal(true);

      });

      it('should render a bolded label for the datum and dim every x-axis tick label', function() {

        var chart = createTimelineChart(640, false, hiddenLabelTestData, 'DAY');

        var datumLabelNotVisible = $('.datum-label').css('display') === 'none';
        expect(datumLabelNotVisible).to.equal(true);

        testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
          clientX: 320,
          clientY: chart.element.offset().top + 100,
          target: $('.timeline-chart-highlight-target')[0]
        });

        var datumLabelVisible = $('.datum-label').css('display') === 'block';
        expect(datumLabelVisible).to.equal(true);

      });

    });

  });

  describe('when on a page with multiple timeline charts', function() {

    // TODO implement the logic in createTimelineChart for handling multiple timeline charts.
    // or write a cheetah test for this.
    xit('should not respond to selection events on other timeline charts', function() {

      var chart1 = createTimelineChart(640, false);
      var chart2 = createTimelineChart(640, false);

      testHelpers.fireMouseEvent(chart1.element.find('.timeline-chart').get(0), 'mousemove', {
        clientX: 320,
        clientY: chart1.element.offset().top + 100,
        target: $('#test-timeline-chart .timeline-chart-highlight-target')[0]
      });

      testHelpers.fireMouseEvent(chart2.element.find('.timeline-chart').get(0), 'mousemove', {
        clientX: 370,
        clientY: chart2.element.offset().top + 100,
        target: $('#test-timeline-chart .timeline-chart-highlight-target')[0]
      });

      var chart1WasSelected = $('#test-timeline-chart .timeline-chart-wrapper').hasClass('selected');
      var chart2WasNotSelected = !$('#alternate-test-timeline-chart .timeline-chart-wrapper').hasClass('selected');

      expect(chart1WasSelected).to.equal(true);
      expect(chart2WasNotSelected).to.equal(true);
    });
  });

  // These should test for the event; the timeline chart view will never create a flyout element.
  describe('flyouts', function() {
    it('should appear on hover over the chart display', function(done) {
      var chart = createTimelineChart(640, false);

      chart.element.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload).to.exist;
        done();
      });

      testHelpers.fireMouseEvent(chart.element.find('.timeline-chart').get(0), 'mousemove', {
        clientX: chart.element.width() / 2,
        clientY: chart.element.height() / 2
      });
    });

    it('should appear on hover over the chart labels', function(done) {
      var chart = createTimelineChart(640, false);

      chart.element.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;
        expect(payload).to.exist;
        done();
      });

      testHelpers.fireMouseEvent(chart.element.find('.x-tick-label').get(0), 'mousemove', {
        clientX: chart.element.width() / 2,
        clientY: chart.element.height() - 5
      });
    });
  });
});
