import _ from 'lodash';
import $ from 'jquery';
import testHelpers from '../testHelpers';
import ColumnChart from 'common/visualizations/views/ColumnChart';

describe('ColumnChart', function() {

  var CHART_WIDTH = 640;
  var CHART_HEIGHT = 480;
  var ROW_DISPLAY_UNIT = 'rows';
  var MIN_SMALL_CARD_BAR_WIDTH = 8;
  var MAX_SMALL_CARD_BAR_WIDTH = 30;
  var MIN_EXPANDED_CARD_BAR_WIDTH = 15;
  var MAX_EXPANDED_CARD_BAR_WIDTH = 40;

  var TOP_AXIS_LABEL = 'TOP AXIS LABEL';
  var RIGHT_AXIS_LABEL = 'RIGHT AXIS LABEL';
  var BOTTOM_AXIS_LABEL = 'BOTTOM AXIS LABEL';
  var LEFT_AXIS_LABEL = 'LEFT AXIS LABEL';

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;

  var NON_DEFAULT_NAME_INDEX = 2;
  var NON_DEFAULT_UNFILTERED_INDEX = 3;
  var NON_DEFAULT_FILTERED_INDEX = 0;
  var NON_DEFAULT_SELECTED_INDEX = 1;

  var testData = [
    ['THEFT', 21571, 21571, false],
    ['BATTERY', 18355, 18355, false],
    ['NARCOTICS', 11552, 11552, false],
    ['CRIMINAL DAMAGE', 9905, 9905, false],
    ['OTHER OFFENSE', 6574, 6574, false],
    ['ASSAULT', 6098, 6098, false],
    ['BURGLARY', 5166, 5166, false],
    ['DECEPTIVE PRACTICE', 5120, 5120, false],
    ['MOTOR VEHICLE THEFT', 3828, 3828, false],
    ['ROBBERY', 3457, 3457, false],
    ['CRIMINAL TRESPASS', 2981, 2981, false],
    ['WEAPONS VIOLATION', 1091, 1091, false],
    ['PUBLIC PEACE VIOLATION', 1021, 1021, false],
    ['OFFENSE INVOLVING CHILDREN', 919, 919, false],
    ['PROSTITUTION', 508, 508, false],
    ['INTERFERENCE WITH PUBLIC OFFICER', 479, 479, false],
    ['CRIM SEXUAL ASSAULT', 412, 412, false],
    ['SEX OFFENSE', 289, 289, false],
    ['LIQUOR LAW VIOLATION', 142, 142, false],
    ['HOMICIDE', 142, 142, false],
    ['ARSON', 126, 126, false],
    ['KIDNAPPING', 89, 89, false],
    ['GAMBLING', 70, 70, false],
    ['INTIMIDATION', 42, 42, false],
    ['STALKING', 41, 41, false],
    ['OBSCENITY', 12, 12, false],
    ['PUBLIC INDECENCY', 6, 6, false],
    ['NON-CRIMINAL', 5, 5, false],
    ['CONCEALED CARRY LICENSE VIOLATION', 5, 5, false],
    ['OTHER NARCOTIC VIOLATION', 5, 5, false],
    ['NON - CRIMINAL', 2, 2, false],
    ['NON-CRIMINAL (SUBJECT SPECIFIED)', 2, 2, false]
  ];

  var testDataWithLongLabels = [
    ['STREET', '1453143', '1453143', false],
    ['RESIDENCE', '910452', '910452', false],
    ['SIDEWALK', '540147', '540147', false],
    ['APARTMENT', '528835', '528835', false],
    ['OTHER', '199411', '199411', false],
    ['PARKING LOT/GARAGE(NON.RESID.)', '153799', '153799', false],
    ['ALLEY', '122895', '122895', false],
    ['SCHOOL, PUBLIC, BUILDING', '122024', '122024', false],
    ['RESIDENCE-GARAGE', '108148', '108148', false],
    ['RESIDENCE PORCH/HALLWAY', '94679', '94679', false],
    ['SMALL RETAIL STORE', '88836', '88836', false],
    ['VEHICLE NON-COMMERCIAL', '83866', '83866', false],
    ['RESTAURANT', '76701', '76701', false],
    ['GROCERY FOOD STORE', '70823', '70823', false],
    ['DEPARTMENT STORE', '62696', '62696', false],
    ['GAS STATION', '55631', '55631', false],
    ['CHA PARKING LOT/GROUNDS', '50841', '50841', false],
    ['RESIDENTIAL YARD (FRONT/BACK)', '44177', '44177', false],
    ['PARK PROPERTY', '41171', '41171', false],
    ['COMMERCIAL / BUSINESS OFFICE', '40976', '40976', false],
    ['CTA PLATFORM', '31842', '31842', false],
    ['CHA APARTMENT', '31632', '31632', false],
    ['BAR OR TAVERN', '26812', '26812', false],
    ['DRUG STORE', '24975', '24975', false],
    ['SCHOOL, PUBLIC, GROUNDS', '23549', '23549', false],
    ['CHA HALLWAY/STAIRWELL/ELEVATOR', '23302', '23302', false],
    ['BANK', '22132', '22132', false],
    ['HOTEL/MOTEL', '21446', '21446', false],
    ['VACANT LOT/LAND', '19097', '19097', false],
    ['TAVERN/LIQUOR STORE', '18912', '18912', false],
    ['CTA TRAIN', '16929', '16929', false],
    ['CTA BUS', '16854', '16854', false],
    ['DRIVEWAY - RESIDENTIAL', '15788', '15788', false],
    ['AIRPORT/AIRCRAFT', '15038', '15038', false],
    ['HOSPITAL BUILDING/GROUNDS', '14973', '14973', false],
    ['POLICE FACILITY/VEH PARKING LOT', '12880', '12880', false],
    ['CHURCH/SYNAGOGUE/PLACE OF WORSHIP', '11966', '11966', false],
    ['GOVERNMENT BUILDING/PROPERTY', '11245', '11245', false],
    ['CONSTRUCTION SITE', '10916', '10916', false],
    ['SCHOOL, PRIVATE, BUILDING', '10561', '10561', false],
    ['NURSING HOME/RETIREMENT HOME', '9830', '9830', false],
    ['ABANDONED BUILDING', '8957', '8957', false],
    ['CURRENCY EXCHANGE', '8601', '8601', false],
    ['CTA GARAGE / OTHER PROPERTY', '8578', '8578', false],
    ['CONVENIENCE STORE', '8495', '8495', false],
    ['WAREHOUSE', '7668', '7668', false],
    ['BARBERSHOP', '6439', '6439', false],
    ['FACTORY/MANUFACTURING BUILDING', '5940', '5940', false],
    ['MEDICAL/DENTAL OFFICE', '5675', '5675', false],
    ['ATHLETIC CLUB', '5544', '5544', false]
  ];

  function testDataWithSelectedAtIndex(selectedIndex) {
    return _.map(testData, function(d, i) {
      return [
        d[NAME_INDEX],
        d[UNFILTERED_INDEX],
        d[UNFILTERED_INDEX] / 2,
        i === selectedIndex
      ];
    });
  }

  function testDataWithBlankAtIndex(index) {
    return _.map(testData, function(d, i) {
      return [
        i === index ? '' : d[NAME_INDEX],
        d[UNFILTERED_INDEX],
        d[UNFILTERED_INDEX] / 2,
        false
      ];
    });
  }

  function testDataWithNaNAndSelectedAtIndex(index) {
    return _.map(testData, function(d, i) {
      return [
        i === index ? NaN : d[NAME_INDEX],
        d[UNFILTERED_INDEX],
        d[UNFILTERED_INDEX] / 2,
        i === index ? true : false
      ];
    });
  }

  function createColumnChart(width, overrideVIF) {

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

    var columnChartVIF = {
      aggregation: {
        columnName: null,
        'function': 'count'
      },
      configuration: {
        columns: {
          name: NAME_INDEX,
          unfilteredValue: UNFILTERED_INDEX,
          filteredValue: FILTERED_INDEX,
          selected: SELECTED_INDEX
        },
        localization: {
          'no_value': '(No value)',
          'flyout_unfiltered_amount_label': 'UNFILTERED VALUE',
          'flyout_filtered_amount_label': 'FILTERED VALUE',
          'flyout_selected_notice': 'THIS COLUMN IS CURRENTLY SELECTED'
        },
        interactive: true
      },
      type: 'columnChart',
      unit: {
        one: 'case',
        other: 'cases'
      }
    };

    if (overrideVIF) {
      _.merge(columnChartVIF, overrideVIF);
    }

    var chart = new ColumnChart(element, columnChartVIF);

    var renderOptions = {
      showAllLabels: false,
      showFiltered: false,
      rescaleAxis: false
    };

    return {
      element: element,
      chart: chart,
      renderOptions: renderOptions
    };
  }

  function removeColumnChart(columnChart) {

    if (columnChart && columnChart.chart && columnChart.chart.hasOwnProperty('destroy')) {
      columnChart.chart.destroy();
      assert.lengthOf(columnChart.element.children(), 0);
    }

    $('#chart').remove();
  }

  String.prototype.visualSize = function(fontSize) {
    var $ruler = $('#ruler');
    var dimensions;

    if ($ruler.length < 1) {
      $('body').append('<span class="ruler" id="ruler"></span>');
      $ruler = $('#ruler');
    }
    if (!fontSize) {
      fontSize = '';
    }
    $ruler.css('font-size', fontSize);
    $ruler.text(this + '');
    dimensions = { width: $ruler.width(), height: $ruler.height() };
    $ruler.remove();

    return dimensions;
  };

  String.prototype.visualHeight = function(fontSize) {
    return this.visualSize(fontSize).height;
  };

  String.prototype.visualLength = function(fontSize) {
    return this.visualSize(fontSize).width;
  };

  /**
   * Tests begin here
   */

  var columnChart;

  afterEach(function() {
    if ($('#chart').length) {
      throw new Error('A test in this spec file did not clean up its column chart. This may cause downstream test failures.');
    }
  });

  describe('axis labels', function() {

    describe('with a top label', function() {

      beforeEach(function() {

        var overrideVIF = {
          configuration: {
            axisLabels: {
              top: TOP_AXIS_LABEL
            }
          }
        };
        columnChart = createColumnChart(640, overrideVIF);
      });

      afterEach(function() {
        removeColumnChart(columnChart);
      });

      it('renders the top axis label', function() {

        expect($('.column-chart-container .top-axis-label').css('visibility')).to.equal('visible');
        expect($('.column-chart-container .right-axis-label').length).to.equal(0);
        expect($('.column-chart-container .bottom-axis-label').length).to.equal(0);
        expect($('.column-chart-container .left-axis-label').length).to.equal(0);

        expect($('.column-chart-container .top-axis-label').text()).to.equal(TOP_AXIS_LABEL);
      });

      it('renders the chart at a reduced height to accommodate the top axis label', function() {

        expect($('.column-chart').height()).to.be.lt(480);
      });
    });

    describe('with a right label', function() {

      beforeEach(function() {

        var overrideVIF = {
          configuration: {
            axisLabels: {
              right: RIGHT_AXIS_LABEL
            }
          }
        };
        columnChart = createColumnChart(640, overrideVIF);
      });

      afterEach(function() {
        removeColumnChart(columnChart);
      });

      it('renders the right axis label', function() {

        expect($('.column-chart-container .top-axis-label').length).to.equal(0);
        expect($('.column-chart-container .right-axis-label').css('visibility')).to.equal('visible');
        expect($('.column-chart-container .bottom-axis-label').length).to.equal(0);
        expect($('.column-chart-container .left-axis-label').length).to.equal(0);

        expect($('.column-chart-container .right-axis-label').text()).to.equal(RIGHT_AXIS_LABEL);
      });

      it('renders the chart at a reduced width to accommodate the right axis label', function() {

        expect($('.column-chart').width()).to.be.lt(640);
      });
    });

    describe('with a bottom label', function() {

      beforeEach(function() {

        var overrideVIF = {
          configuration: {
            axisLabels: {
              bottom: BOTTOM_AXIS_LABEL
            }
          }
        };
        columnChart = createColumnChart(640, overrideVIF);
      });

      afterEach(function() {
        removeColumnChart(columnChart);
      });

      it('renders the bottom axis label', function() {

        expect($('.column-chart-container .top-axis-label').length).to.equal(0);
        expect($('.column-chart-container .right-axis-label').length).to.equal(0);
        expect($('.column-chart-container .bottom-axis-label').css('visibility')).to.equal('visible');
        expect($('.column-chart-container .left-axis-label').length).to.equal(0);

        expect($('.column-chart-container .bottom-axis-label').text()).to.equal(BOTTOM_AXIS_LABEL);
      });

      it('renders the chart at a reduced height to accommodate the bottom axis label', function() {

        expect($('.column-chart').height()).to.be.lt(480);
      });
    });

    describe('with a left label', function() {

      beforeEach(function() {

        var overrideVIF = {
          configuration: {
            axisLabels: {
              left: LEFT_AXIS_LABEL
            }
          }
        };
        columnChart = createColumnChart(640, overrideVIF);
      });

      afterEach(function() {
        removeColumnChart(columnChart);
      });

      it('renders the left axis label', function() {

        expect($('.column-chart-container .top-axis-label').length).to.equal(0);
        expect($('.column-chart-container .right-axis-label').length).to.equal(0);
        expect($('.column-chart-container .bottom-axis-label').length).to.equal(0);
        expect($('.column-chart-container .left-axis-label').css('visibility')).to.equal('visible');

        expect($('.column-chart-container .left-axis-label').text()).to.equal(LEFT_AXIS_LABEL);
      });

      it('renders the chart at a reduced width to accommodate the left axis label', function() {
        expect($('.column-chart').width()).to.be.lt(640);
      });
    });
  });

  describe('when not showing all labels at 640px', function() {

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should create ' + testData.length + ' bars and a maximum of 3 labels', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar-group').length).to.equal(testData.length);
      expect($('.bar.unfiltered').length).to.equal(testData.length);
      expect($('.labels div.label').length).to.be.lte(3);
    });

    it('should create bars with a defined width', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect(typeof $('.bar.unfiltered').width() == 'number').to.equal(true);
    });

    it('should not show the moar marker', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('none');
    });

    it('should place the bars above the axis', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      // Find the x-axis. It's the bottommost one of the ticks
      var xAxis = $(_.reduce(columnChart.element.find('.ticks').children(), function(accum, element) {
        if ($(accum).position().top < $(element).position().top) {
          return element;
        } else {
          return accum;
        }
      }));
      var xAxisPosition = Math.round(xAxis.offset().top + xAxis.outerHeight());
      var bars = columnChart.element.find('.bar');

      expect(bars).to.have.length.greaterThan(1);
      bars.each(function() {
        // Made this fuzzy because it would generate different results if I was at home or at the office (wat!?)
        expect(Math.round(this.getBoundingClientRect().bottom)).to.be.within(xAxisPosition - 1, xAxisPosition + 1);
      });
    });

    it('should show a minimum of 1 pixel if there is a non-zero value', function() {

      // Craft the data such that the scale will result in a <.5px value
      var testData = [
        ['THEFT', 10, 0, false]
      ];

      columnChart.chart.render(testData, columnChart.renderOptions);

      var bars = columnChart.element.find('.bar.unfiltered');
      // the column chart adds padding and stuff. Get the ACTUAL height we want to be.
      var maxHeight = bars.eq(0).height();

      testData = [
        ['THEFT', maxHeight, 0, false],
        ['FOULLANGUAGE', 50, 0, false],
        ['JAYWALKING', 1, 0, false],
        ['PICKINGNOSE', 0.4, 0, false],
        ['BEINGAWESOME', 0, 0, false]
      ];

      columnChart.chart.render(testData, columnChart.renderOptions);

      // Make sure it laid out the way we expected
      bars = columnChart.element.find('.bar.unfiltered');

      expect(bars.eq(0).height()).to.equal(maxHeight);
      expect(bars.eq(1).height()).to.equal(50);
      expect(bars.eq(2).height()).to.equal(1);
      // Now make sure the sub-pixel one rounded up
      expect(bars.eq(3).height()).to.equal(1);
      // But the zero-pixel one isn't.
      expect(bars.eq(4).height()).to.equal(0);
    });

    it('should place the smaller bar in front', function() {

      function findName(name) {
        var barGroup = columnChart.element.find('[data-bar-name="{0}"]'.format(name));
        expect(barGroup.length).to.be.above(0);
        return barGroup;
      }

      function checkTotalOnTop(barGroupNames, totalShouldBeOnTop) {

        expect(barGroupNames).to.not.be.empty;

        _.each(barGroupNames, function(name) {

          var barGroup = findName(name);
          var isTotalOnTopAccordingToDom = barGroup.children().eq(1).hasClass('unfiltered');
          var isTotalOnTopAccordingToBarGroupClass = barGroup.hasClass('unfiltered-on-top');

          if (isTotalOnTopAccordingToDom !== totalShouldBeOnTop) {
            throw new Error('The filtered bar should have come {0} the unfiltered bar in the DOM'.format(
              totalShouldBeOnTop ? 'after' : 'before'
            ));
          }
          if (isTotalOnTopAccordingToBarGroupClass !== totalShouldBeOnTop) {
            throw new Error('Bar group {0} had the unfiltered-on-top class'.format(
              totalShouldBeOnTop ? 'should have' : 'should not have'
            ));
          }
        });
      }

      var testData = [
        ['BOTH_POSITIVE_TOTAL_BIGGER', 10, 5, false],
        ['BOTH_POSITIVE_FILTERED_BIGGER', 10, 15, false],

        ['BOTH_NEGATIVE_TOTAL_BIGGER', -10, -5, false],
        ['BOTH_NEGATIVE_FILTERED_BIGGER', -10, -15, false],

        ['TOTAL_POSITIVE_FILTERED_NEGATIVE', 10, -10, false],
        ['TOTAL_NEGATIVE_FILTERED_POSITIVE', -10, 10, false]
      ];

      columnChart.chart.render(testData, columnChart.renderOptions);

      var bars = columnChart.element.find('.bar.unfiltered');

      // At this point, the chart is rendering in unfiltered mode.
      // This means total should never be on top.
      checkTotalOnTop(testData.map(function(datum) { return datum[NAME_INDEX]; }), false);

      // Now, turn on filtered mode. This should change the order
      // of the bars appropriately.
      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showFiltered = true;

      columnChart.chart.render(testData, renderOptions);

      // Expect total bar is on top, as it's physically smaller than the
      // filtered bar.
      var expectTotalOnTop = [
        'BOTH_POSITIVE_FILTERED_BIGGER',
        'BOTH_NEGATIVE_FILTERED_BIGGER'
      ];

      // Expect filtered bar is on top, as it's physically smaller than the
      // total bar.
      var expectFilteredOnTop = [
        'BOTH_POSITIVE_TOTAL_BIGGER',
        'BOTH_NEGATIVE_TOTAL_BIGGER',
        'TOTAL_POSITIVE_FILTERED_NEGATIVE',
        'TOTAL_NEGATIVE_FILTERED_POSITIVE'
      ];

      // Test sanity check, make sure all columns accounted for.
      expect(
        _.difference(
          testData.map(function(datum) { return datum[NAME_INDEX]; }),
          _.union(expectFilteredOnTop, expectTotalOnTop)
        )
      ).to.be.empty;

      checkTotalOnTop(expectFilteredOnTop, false);
      checkTotalOnTop(expectTotalOnTop, true);
    });
  });

  describe('when not showing all labels at 640px with non-default column indices', function() {

    var testDataWithNonDefaultColumnIndices;

    beforeEach(function() {

      var overrideVIF = {
        configuration: {
          columns: {
            name: 2,
            selected: 1,
            unfilteredValue: 3,
            filteredValue: 0
          }
        }
      };
      columnChart = createColumnChart(640, overrideVIF);

      testDataWithNonDefaultColumnIndices = testData.map(function(datum) {

        var newDatum = [null, null, null, null];
        newDatum[NON_DEFAULT_NAME_INDEX] = datum[NAME_INDEX];
        newDatum[NON_DEFAULT_UNFILTERED_INDEX] = datum[UNFILTERED_INDEX];
        newDatum[NON_DEFAULT_FILTERED_INDEX] = datum[FILTERED_INDEX];
        newDatum[NON_DEFAULT_SELECTED_INDEX] = datum[SELECTED_INDEX];

        return newDatum;
      });
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should create ' + testData.length + ' bars and a maximum of 3 labels', function() {

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      expect($('.bar-group').length).to.equal(testDataWithNonDefaultColumnIndices.length);
      expect($('.bar.unfiltered').length).to.equal(testDataWithNonDefaultColumnIndices.length);
      expect($('.labels div.label').length).to.be.lte(3);
    });

    it('should create bars with a defined width', function() {

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      expect((typeof $('.bar.unfiltered').width()) === 'number').to.equal(true);
    });

    it('should not show the moar marker', function() {

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('none');
    });

    it('should place the bars above the axis', function() {

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      // Find the x-axis. It's the bottommost one of the ticks
      var xAxis = $(_.reduce(columnChart.element.find('.ticks').children(), function(accum, element) {
        if ($(accum).position().top < $(element).position().top) {
          return element;
        } else {
          return accum;
        }
      }));
      var xAxisPosition = Math.round(xAxis.offset().top + xAxis.outerHeight());
      var bars = columnChart.element.find('.bar');

      expect(bars).to.have.length.greaterThan(1);
      bars.each(function() {
        // Made this fuzzy because it would generate different results if I was at home or at the office (wat!?)
        expect(Math.round(this.getBoundingClientRect().bottom)).to.be.within(xAxisPosition - 1, xAxisPosition + 1);
      });
    });

    it('should show a minimum of 1 pixel if there is a non-zero value', function() {

      // Craft the data such that the scale will result in a <.5px value
      var testDataWithNonDefaultColumnIndices = [
        [0, false, 'THEFT', 10]
      ];

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      var bars = columnChart.element.find('.bar.unfiltered');
      // the column chart adds padding and stuff. Get the ACTUAL height we want to be.
      var maxHeight = bars.eq(0).height();

      testDataWithNonDefaultColumnIndices = [
        [0, false, 'THEFT', maxHeight],
        [0, false, 'FOULLANGUAGE', 50],
        [0, false, 'JAYWALKING', 1],
        [0, false, 'PICKINGNOSE', 0.4],
        [0, false, 'BEINGAWESOME', 0]
      ];

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      // Make sure it laid out the way we expected
      bars = columnChart.element.find('.bar.unfiltered');

      expect(bars.eq(0).height()).to.equal(maxHeight);
      expect(bars.eq(1).height()).to.equal(50);
      expect(bars.eq(2).height()).to.equal(1);
      // Now make sure the sub-pixel one rounded up
      expect(bars.eq(3).height()).to.equal(1);
      // But the zero-pixel one isn't.
      expect(bars.eq(4).height()).to.equal(0);
    });

    it('should place the smaller bar in front', function() {

      function findName(name) {
        var barGroup = columnChart.element.find('[data-bar-name="{0}"]'.format(name));
        expect(barGroup.length).to.be.above(0);
        return barGroup;
      }

      function checkTotalOnTop(barGroupNames, totalShouldBeOnTop) {

        expect(barGroupNames).to.not.be.empty;

        _.each(barGroupNames, function(name) {

          var barGroup = findName(name);
          var isTotalOnTopAccordingToDom = barGroup.children().eq(1).hasClass('unfiltered');
          var isTotalOnTopAccordingToBarGroupClass = barGroup.hasClass('unfiltered-on-top');

          if (isTotalOnTopAccordingToDom !== totalShouldBeOnTop) {
            throw new Error('The filtered bar should have come {0} the unfiltered bar in the DOM'.format(
              totalShouldBeOnTop ? 'after' : 'before'
            ));
          }
          if (isTotalOnTopAccordingToBarGroupClass !== totalShouldBeOnTop) {
            throw new Error('Bar group {0} had the unfiltered-on-top class'.format(
              totalShouldBeOnTop ? 'should have' : 'should not have'
            ));
          }
        });
      }

      var testDataWithNonDefaultColumnIndices = [
        [5, false, 'BOTH_POSITIVE_TOTAL_BIGGER', 10],
        [15, false, 'BOTH_POSITIVE_FILTERED_BIGGER', 10],

        [-5, false, 'BOTH_NEGATIVE_TOTAL_BIGGER', -10],
        [-15, false, 'BOTH_NEGATIVE_FILTERED_BIGGER', -10],

        [-10, false, 'TOTAL_POSITIVE_FILTERED_NEGATIVE', 10],
        [10, false, 'TOTAL_NEGATIVE_FILTERED_POSITIVE', -10]
      ];

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, columnChart.renderOptions);

      var bars = columnChart.element.find('.bar.unfiltered');

      // At this point, the chart is rendering in unfiltered mode.
      // This means total should never be on top.

      checkTotalOnTop(testDataWithNonDefaultColumnIndices.map(function(datum) { return datum[NON_DEFAULT_NAME_INDEX]; }), false);

      // Now, turn on filtered mode. This should change the order
      // of the bars appropriately.
      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showFiltered = true;

      columnChart.chart.render(testDataWithNonDefaultColumnIndices, renderOptions);

      // Expect total bar is on top, as it's physically smaller than the
      // filtered bar.
      var expectTotalOnTop = [
        'BOTH_POSITIVE_FILTERED_BIGGER',
        'BOTH_NEGATIVE_FILTERED_BIGGER'
      ];

      // Expect filtered bar is on top, as it's physically smaller than the
      // total bar.
      var expectFilteredOnTop = [
        'BOTH_POSITIVE_TOTAL_BIGGER',
        'BOTH_NEGATIVE_TOTAL_BIGGER',
        'TOTAL_POSITIVE_FILTERED_NEGATIVE',
        'TOTAL_NEGATIVE_FILTERED_POSITIVE'
      ];

      // Test sanity check, make sure all columns accounted for.
      expect(
        _.difference(
          testDataWithNonDefaultColumnIndices.map(function(datum) { return datum[NON_DEFAULT_NAME_INDEX]; }),
          _.union(expectFilteredOnTop, expectTotalOnTop)
        )
      ).to.be.empty;

      checkTotalOnTop(expectFilteredOnTop, false);
      checkTotalOnTop(expectTotalOnTop, true);
    });
  });

  describe('y scale', function() {

    var smallDataPoint = ['small', 1, 1, false];
    var hugeDataPoint = ['small', 10000000, 10000000, false];
    var testDataOnlySmall = _.map(_.range(100), _.constant(smallDataPoint));
    var testDataWithOneBigAtEnd = testDataOnlySmall.concat([hugeDataPoint]);

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    describe('when not showing all labels', function() {

      it('should only base the y scale on the visible bars', function() {

        var heightOfSmallColumns;
        var heightOfColumnsWithBigToo;

        // Make a prototypal chart with only small values.
        // Then grab the height of the columns.
        columnChart = createColumnChart(50); // 50px wide is too small to show all the bars.
        columnChart.chart.render(testDataOnlySmall, columnChart.renderOptions);

        heightOfSmallColumns = columnChart.element.find('.bar').height();
        expect(heightOfSmallColumns).to.be.above(0);

        removeColumnChart(columnChart);

        // Now, make almost the same chart, but tack on one huge value at the end.
        // It should not affect the scale.
        columnChart = createColumnChart(50);
        columnChart.chart.render(testDataWithOneBigAtEnd, columnChart.renderOptions);

        heightOfColumnsWithBigToo = columnChart.element.find('.bar').height();

        expect(heightOfColumnsWithBigToo).to.equal(heightOfSmallColumns);

        // Don't forget to remove the chart after this test!
        removeColumnChart(columnChart);
      });
    });

    describe('when showing all labels', function() {

      it('should base the y scale on all data', function() {

        var width = 50;
        var heightOfSmallColumns;
        var heightOfColumnsWithBigToo;

        // Make a prototypal chart with only small values.
        // Then grab the height of the columns.
        // 50px wide is too small to show all the bars.
        columnChart = createColumnChart(width);

        columnChart.chart.render(testDataOnlySmall, columnChart.renderOptions);

        heightOfSmallColumns = columnChart.element.find('.bar').height();
        expect(heightOfSmallColumns).to.be.above(0);

        removeColumnChart(columnChart);

        columnChart = createColumnChart(width);

        // Now, make almost the same chart, but tack on one huge value at the end.
        // It should not affect the scale.
        var renderOptions = _.clone(columnChart.renderOptions);
        renderOptions.showAllLabels = true;

        columnChart.chart.render(testDataWithOneBigAtEnd, renderOptions);

        heightOfColumnsWithBigToo = columnChart.element.find('.bar').height();

        expect(heightOfColumnsWithBigToo).to.be.below(heightOfSmallColumns); // Big data means small bars.

        // Don't forget to remove the chart after this test!
        removeColumnChart(columnChart);
      });
    });

    it('should rescale the axis to only include filtered data when rescaleAxis is true', function() {
      columnChart = createColumnChart();

      function getMaxFilteredBarHeight(el) {
        return _.chain(el[0].querySelectorAll('.bar.filtered')).
          toArray().
          map('offsetHeight').
          max().
          value();
      }

      var filteredTestData = _.map(testData, function(datum) {
        return [
          datum[0], // label
          datum[1], // unfiltered
          datum[2] / 2, // filtered
          datum[3] // isSpecial
        ];
      });

      // Render without scaled axis
      columnChart.renderOptions.rescaleAxis = false;
      columnChart.renderOptions.showFiltered = true;
      columnChart.chart.render(filteredTestData, columnChart.renderOptions);
      var initialBarHeight = getMaxFilteredBarHeight(columnChart.element);

      // Render with scaled axis
      columnChart.renderOptions.rescaleAxis = true;
      columnChart.renderOptions.showFiltered = true;
      columnChart.chart.render(filteredTestData, columnChart.renderOptions);
      var finalBarHeight = getMaxFilteredBarHeight(columnChart.element);

      expect(finalBarHeight).to.be.above(initialBarHeight);
    });
  });

  describe('when not showing all labels at 100px', function() {

    var width = 100;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show the moar marker', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('block');
    });
  });

  describe('when showing all labels at 640px', function() {

    var width = 640;
    var bars = testData.length;
    var labels = testData.length;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should create ' + bars + ' bars and ' + labels + ' labels', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.bar-group').length).to.equal(bars);
      expect($('.bar.unfiltered').length).to.equal(bars);
      expect($('.labels div.label').length).to.equal(testData.length);
    });

    it('should not show the moar marker', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('none');
    });

    it('should not hide any bars', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.bar-group:not(.active)').length).to.equal(0);
    });
  });

  /*   min and max bar widths spec */

  describe('when not showing all labels at 50px', function() {

    var width = 50;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should maintain a bar width >= MIN_SMALL_CARD_BAR_WIDTH (' + MIN_SMALL_CARD_BAR_WIDTH + 'px)', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar.unfiltered').width() >= MIN_SMALL_CARD_BAR_WIDTH).to.equal(true);
    });

    it('should maintain a bar width <= MAX_SMALL_CARD_BAR_WIDTH (' + MAX_SMALL_CARD_BAR_WIDTH + 'px)', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar.unfiltered').width() <= MAX_SMALL_CARD_BAR_WIDTH).to.equal(true);
    });

    it('should maintain spacing between bars', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);

      expect(barGroup2Left - barGroup1Left > barWidth).to.equal(true);
    });

    it('should hide some bars', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar-group:not(.active)').length).to.not.equal(0);
    });
  });

  describe('when not showing all labels at 9001px', function() {

    var width = 9001;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should maintain a bar width >=  MIN_SMALL_CARD_BAR_WIDTH (' + MIN_SMALL_CARD_BAR_WIDTH + 'px)', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar.unfiltered').width()).to.be.at.least(MIN_SMALL_CARD_BAR_WIDTH);
    });

    it('should maintain a bar width <= MAX_SMALL_CARD_BAR_WIDTH (' + MAX_SMALL_CARD_BAR_WIDTH + 'px)', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.bar.unfiltered').width()).to.be.at.most(MAX_SMALL_CARD_BAR_WIDTH);
    });

    it('should maintain spacing between bars', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);

      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });

    it('should not show the more marker', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  describe('when showing all labels at 50px', function() {

    var width = 50;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should maintain a bar width >= MIN_EXPANDED_CARD_BAR_WIDTH (' + MIN_EXPANDED_CARD_BAR_WIDTH + 'px)', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.bar.unfiltered').width()).to.be.at.least(MIN_EXPANDED_CARD_BAR_WIDTH);
    });

    it('should maintain spacing between bars', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);

      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });
  });

  describe('when showing all labels at 9001px', function() {

    var width = 9001;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should maintain a bar width <= MAX_EXPANDED_CARD_BAR_WIDTH (' + MAX_EXPANDED_CARD_BAR_WIDTH + 'px)', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.bar.unfiltered').width()).to.be.at.most(MAX_EXPANDED_CARD_BAR_WIDTH);
    });

    it('should maintain spacing between bars', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);

      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });

    it('should not show the moar marker', function() {

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testData, renderOptions);

      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  /*  filtered data spec  */

  describe('when filtered data is provided', function() {

    var width = 640;
    var testDataWithFiltered = _.map(testData, function(d) {
      return [
        d[NAME_INDEX],
        d[UNFILTERED_INDEX],
        d[UNFILTERED_INDEX] / 2,
        false
      ];
    });
    var bars = testDataWithFiltered.length;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    describe('with showFiltered on', function() {

      it('should create ' + bars + ' filtered and unfiltered bars, with the correct heights', function() {

        var renderOptions = _.clone(columnChart.renderOptions);
        renderOptions.showFiltered = true;

        columnChart.chart.render(testDataWithFiltered, renderOptions);

        expect($('.bar.filtered').length).to.equal(bars);
        expect(_.some($('.bar.filtered'), function(bar) {
          return $(bar).height() > 0;
        }));

        $('.bar-group').each(function() {
          var unfilteredHeight = $(this).find('.unfiltered').height();
          var filteredHeight = $(this).find('.filtered').height();
          // The test data is computed to have filtered = ufiltered/2.
          // jQuery then rounds down to integer pixels, so we have to take the floor.
          expect(Math.abs(unfilteredHeight / 2 - filteredHeight) <= 0.5).to.equal(true);
        });
      });

      it('should emit a `SOCRATA_VISUALIZATION_COLUMN_FLYOUT` event with `filteredValueLabel` and `filteredValue` properties', function(done) {

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(_.has(payload, 'filteredValueLabel')).to.equal(true);
          expect(_.has(payload, 'filteredValue')).to.equal(true);
          done();
        });

        var renderOptions = _.clone(columnChart.renderOptions);
        renderOptions.showFiltered = true;

        columnChart.chart.render(testDataWithFiltered, renderOptions);

        var barGroup = columnChart.element.find('.bar-group').get(0);
        testHelpers.fireMouseEvent(barGroup, 'mousemove');
      });
    });

    describe('with showFiltered off', function() {

      beforeEach(function() {
        columnChart = createColumnChart();
      });

      afterEach(function() {
        removeColumnChart(columnChart);
      });

      it('should not show the filtered count in the flyout', function(done) {

        columnChart.chart.render(testDataWithFiltered, columnChart.renderOptions);

        var barGroup = columnChart.element.find('.bar-group').get(0);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(_.has(payload, 'filteredValueLabel')).to.equal(false);
          expect(_.has(payload, 'filteredValue')).to.equal(false);
          done();
        });

        testHelpers.fireMouseEvent(barGroup, 'mousemove');
      });
    });
  });

  describe('when a datum is selected', function() {

    var selectedIndex = 6;

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should create 1 selected bar-group', function() {

      var testDataWithSelected = testDataWithSelectedAtIndex(selectedIndex);

      columnChart.chart.render(testDataWithSelected, columnChart.renderOptions);

      expect($('.bar-group.selected').length).to.equal(1);
      expect($('.bar-group.selected')[0].__data__[NAME_INDEX]).to.equal(testDataWithSelected[selectedIndex][NAME_INDEX]);
    });
  });

  describe('when called with no data', function() {

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should hide all existing bars when the data is cleared', function() {

      columnChart.chart.render([], columnChart.renderOptions);

      expect($('.bar-group').length).to.equal(0);
    });
  });

  describe('when there are a small number of columns', function() {

    var width = 1000;
    var testDataSubset = _.filter(testData, function(object, index) {
      return index < 4;
    });

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should display the columns at their maximum width when not showing all labels', function() {

      expect(testDataSubset.length).to.equal(4);

      columnChart.chart.render(testDataSubset, columnChart.renderOptions);

      expect(columnChart.element.find('.bar-group .bar').first().width()).to.equal(30);
    });

    it('should display the columns at their maximum width when show all labels is set to true', function() {

      expect(testDataSubset.length).to.equal(4);

      var renderOptions = _.clone(columnChart.renderOptions);
      renderOptions.showAllLabels = true;

      columnChart.chart.render(testDataSubset, renderOptions);

      expect(columnChart.element.find('.bar-group .bar').first().width()).to.equal(40);
    });
  });

  describe('column labels', function() {

    var width = 100;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should show the top 3 bar labels by default', function() {

      columnChart.chart.render(testData, columnChart.renderOptions);

      var labels = columnChart.element.find('.labels .label .text');

      expect(labels).to.be.length(3);

      labels.each(function(i, label) {
        expect($(label).text()).to.equal(testData[i][NAME_INDEX]);
      });
    });

    it('should show the top 3 bar labels plus the selected bar', function() {

      var selectedIndex = 5;
      var testDataWithSelected = testDataWithSelectedAtIndex(selectedIndex);

      columnChart.chart.render(testDataWithSelected, columnChart.renderOptions);

      var labels = columnChart.element.find('.labels .label .text');
      var expectedLabels = _(testData).take(3).map(function(datum) { return datum[NAME_INDEX]; }).value();
      expectedLabels.push(testData[selectedIndex][NAME_INDEX]);

      expect(labels).to.be.length(4);

      labels.each(function(i, label) {
        expect($(label).text()).to.equal(expectedLabels[i]);
      });
    });

    it('should apply a class of orientation-right or orientation-left depending on fit', function() {

      var specialIndex = testData.length - 1;
      var testDataWithSpecial = testDataWithSelectedAtIndex(specialIndex);

      columnChart.chart.render(testDataWithSpecial, columnChart.renderOptions);

      var labels = columnChart.element.find('.labels .label');

      expect(labels).to.have.length(4);

      var expectedClasses = [
        'orientation-right',
        'orientation-right',
        'orientation-right',
        'orientation-left'
      ];
      labels.each(function(i, label) {
        expect($(label).hasClass(expectedClasses[i])).to.be.true;
      });
    });
  });

  describe('when the truncation marker is clicked', function() {

    var width = 300;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should emit the "SOCRATA_VISUALIZATION_COLUMN_EXPANSION" event', function(done) {

      var moarMarker = $('.truncation-marker');
      var receivedEvent = false;

      expect(moarMarker.css('display')).to.equal('block', 'truncation marker should be visible');

      columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_EXPANSION', function(event) {

        var payload = event.originalEvent.detail;

        expect(payload.expanded).to.equal(true, 'should have received truncation-marker-clicked event');
        done();
      });

      moarMarker.click();
    });
  });

  describe('when columns or labels are clicked', function() {

    var indexOfItemToClick = 2;

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    describe('when not showing all labels', function() {

      it('should emit a "SOCRATA_VISUALIZATION_COLUMN_SELECTION" event appropriate to the clicked element', function(done) {

        columnChart.chart.render(testData, columnChart.renderOptions);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', function(event) {

          var payload = event.originalEvent.detail;
          var expectedName = testData[indexOfItemToClick][NAME_INDEX];

          expect(payload.name).to.equal(expectedName);

          done();
        });

        columnChart.element.find('.bar-group').eq(indexOfItemToClick).click();
      });

      it('should emit a "SOCRATA_VISUALIZATION_COLUMN_SELECTION" event appropriate to the clicked element', function(done) {

        columnChart.chart.render(testData, columnChart.renderOptions);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', function(event) {

          var payload = event.originalEvent.detail;
          var expectedName = testData[indexOfItemToClick][NAME_INDEX];

          expect(payload.name).to.equal(expectedName);

          done();
        });

        columnChart.element.find('.label div:contains("{0}") span'.format(testData[indexOfItemToClick][NAME_INDEX])).click();
      });
    });

    describe('when showing all labels', function() {

      it('should emit a "SOCRATA_VISUALIZATION_COLUMN_SELECTION" event appropriate to the clicked element', function(done) {

        var renderOptions = _.clone(columnChart.renderOptions);
        renderOptions.showAllLabels = true;

        columnChart.chart.render(testData, renderOptions);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', function(event) {

          var payload = event.originalEvent.detail;
          var expectedName = testData[indexOfItemToClick][NAME_INDEX];

          expect(payload.name).to.equal(expectedName);

          done();
        });

        columnChart.element.find('.bar-group').eq(indexOfItemToClick).click();
      });

      it('should emit a "SOCRATA_VISUALIZATION_COLUMN_SELECTION" event appropriate to the clicked element', function(done) {

        var renderOptions = _.clone(columnChart.renderOptions);
        renderOptions.showAllLabels = true;

        columnChart.chart.render(testData, renderOptions);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', function(event) {

          var payload = event.originalEvent.detail;
          var expectedName = testData[indexOfItemToClick][NAME_INDEX];

          expect(payload.name).to.equal(expectedName);

          done();
        });

        columnChart.element.find('.label div:contains("{0}") span'.format(testData[indexOfItemToClick][NAME_INDEX])).click();
      });
    });
  });

  describe('when the name of a datum is blank', function() {

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should use the placeholder value', function() {

      columnChart.chart.render(testDataWithBlankAtIndex(0), columnChart.renderOptions);

      expect($('.labels .label').first().find('.contents .text').text()).to.equal('(No value)');
    });

    it('should style the placeholder by adding a class to the label text', function() {

      columnChart.chart.render(testDataWithBlankAtIndex(0), columnChart.renderOptions);

      expect($('.labels .label').first().find('.contents').hasClass('undefined')).to.equal(true);
    });

    it('should not add the class to labels with non-blank text', function() {

      columnChart.chart.render(testDataWithBlankAtIndex(-1), columnChart.renderOptions);

      expect(_.some($('.labels .label .contents .text'), function(el) {
        return $(el).hasClass('undefined');
      })).to.equal(false);
    });
  });

  // cardVisualizationColumnChart will pass NaN as the name property if there is
  // no name property on the original datum.
  describe('when the name of a datum is NaN', function() {

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should use the placeholder value', function() {

      columnChart.chart.render(testDataWithNaNAndSelectedAtIndex(0), columnChart.renderOptions);

      expect($('.labels .label').first().find('.contents .text').text()).to.equal('(No value)');
    });

    it('should style the label by adding classes', function() {

      columnChart.chart.render(testDataWithNaNAndSelectedAtIndex(0), columnChart.renderOptions);

      expect($('.labels .label').first().find('.contents').hasClass('undefined')).to.equal(true);
      expect($('.labels .label').first().hasClass('selected')).to.equal(true);
    });

    it('should style the bar-group by adding a class', function() {

      columnChart.chart.render(testDataWithNaNAndSelectedAtIndex(0), columnChart.renderOptions);

      expect($('.bar-group').first().hasClass('selected')).to.equal(true);
    });
  });

  describe('when displaying labels', function() {

    var width = 499;

    beforeEach(function() {
      columnChart = createColumnChart(width);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should correctly position right-aligned labels for columns near the right ' +
      'edge of the chart when said columns have been selected', function() {

      var testDataWithLabels = _.clone(testDataWithLongLabels);

      testDataWithLabels[42][SELECTED_INDEX] = true;

      columnChart.chart.render(testDataWithLabels, columnChart.renderOptions);

      var $label = $('.label.orientation-left');
      var labelRightOffset = parseInt($label[0].style.right, 10);

      expect($label.length > 0).to.equal(true);
      expect(labelRightOffset).to.equal(76);// TODO this magic number seems a bit brittle
    });

    describe('when the labels should have ellipses', function() {

      var testDataWithLabels;

      beforeEach(function() {
        testDataWithLabels = testDataWithLongLabels.map(function(datum, i) {
          return [
            Array(100).join(i),
            datum[UNFILTERED_INDEX],
            0,
            false
          ];
        });
      });

      it('should not overflow labels past the chart width', function() {

        columnChart.chart.render(testDataWithLabels, columnChart.renderOptions);

        var $labelText = $('.label .text');

        expect($labelText.width()).to.be.below(width);
      });

      it('should not overflow selected, right-oriented long labels past the chart width', function() {

        testDataWithLabels[0][SELECTED_INDEX] = true;

        columnChart.chart.render(testDataWithLabels, columnChart.renderOptions);

        var $labelText = $('.orientation-right.selected .text');

        expect($labelText.width()).to.be.below(width);
      });

      it('should not overflow selected, left-oriented long labels past the chart width', function() {

        testDataWithLabels[42][SELECTED_INDEX] = true;

        columnChart.chart.render(testDataWithLabels, columnChart.renderOptions);

        var $labelText = $('.orientation-left.selected .text');

        expect($labelText.width()).to.be.below(width);
      });
    });
  });

  describe('when highlighting bars', function() {

    var $hoverTarget;
    var dataBarName;

    beforeEach(function() {
      columnChart = createColumnChart();
      columnChart.chart.render(testData, columnChart.renderOptions);
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    describe('when hovering over callouts', function() {
      beforeEach(function() {
        $hoverTarget = $('.labels .label .callout').eq(0);
        dataBarName = $hoverTarget.closest('.label').attr('data-bar-name');

        $hoverTarget.trigger('mouseenter');
      });

      it('should highlight the corresponding bar on mouseenter of a label', function() {
        var $highlightedBarGroup = $('.bar-group.highlight');

        expect($highlightedBarGroup).to.have.length(1);
        expect($highlightedBarGroup.attr('data-bar-name')).to.equal(dataBarName);
      });

      it('should un-highlight the corresponding bar on mouseleave of a label', function() {
        $hoverTarget.trigger('mouseleave');

        expect($('.bar-group.highlight')).to.have.length(0);
      });

      it('should un-highlight the corresponding bar on mouseleave of the chart element', function() {
        var $chartElement = $('.column-chart');

        $chartElement.trigger('mouseleave');

        expect($('.bar-group.highlight')).to.have.length(0);
      });
    });

    describe('when hovering over label text', function() {
      beforeEach(function() {
        $hoverTarget = $('.labels .label .contents span.text').eq(0);
        dataBarName = $hoverTarget.closest('.label').attr('data-bar-name');

        $hoverTarget.trigger('mouseenter');
      });

      it('should highlight the corresponding bar on mouseenter of a label', function() {
        var $highlightedBarGroup = $('.bar-group.highlight');

        expect($highlightedBarGroup).to.have.length(1);
        expect($highlightedBarGroup.attr('data-bar-name')).to.equal(dataBarName);
      });

      it('should un-highlight the corresponding bar on mouseleave of a label', function() {
        $hoverTarget.trigger('mouseleave');

        expect($('.bar-group.highlight')).to.have.length(0);
      });

      it('should un-highlight the corresponding bar on mouseleave of the chart element', function() {
        var $chartElement = $('.column-chart');

        $chartElement.trigger('mouseleave');

        expect($('.bar-group.highlight')).to.have.length(0);
      });
    });
  });

  describe('on mousemove events', function() {

    var columnChart;

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    describe('on a column `barGroup`', function() {

      it('should emit an event in which the `element` property is the `.unfiltered` child bar of the `barGroup`', function(done) {

        columnChart.chart.render(testData, columnChart.renderOptions);

        var barGroup = columnChart.element.find('.bar-group').get(0);
        var unfilteredBarGroupBar = $(barGroup).find('.unfiltered').get(0);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(unfilteredBarGroupBar);
          done();
        });

        testHelpers.fireMouseEvent(barGroup, 'mousemove');
      });
    });

    describe('on a label', function() {

      it('should emit an event in which the `element` property is a matching `barGroup` element', function(done) {

        columnChart.chart.render(testData, columnChart.renderOptions);

        var barGroup = columnChart.element.find('.bar-group').get(0);
        var unfilteredBarGroupBar = $(barGroup).find('.unfiltered').get(0);
        var label = columnChart.element.find(
          '.label[data-bar-name="{0}"] .contents span'.format(
            barGroup.getAttribute('data-bar-name')
          )
        ).get(0);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(unfilteredBarGroupBar);
          done();
        });

        testHelpers.fireMouseEvent(label, 'mousemove');
      });
    });

    describe('on a bar whose name is not a string', function() {

      it('should emit an event in which the `element` property is the `.unfiltered` child bar of the `barGroup`', function(done) {

        var testData = [
          [42, 21571, 21571, false]
        ];

        columnChart.chart.render(testData, columnChart.renderOptions);

        var barGroup = columnChart.element.find('.bar-group').get(0);
        var unfilteredBarGroupBar = $(barGroup).find('.unfiltered').get(0);

        columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', function(event) {

          var payload = event.originalEvent.detail;

          expect(payload.element).to.equal(unfilteredBarGroupBar);
          done();
        });

        testHelpers.fireMouseEvent(barGroup, 'mousemove');
      });
    });
  });

  describe('when destroyed', function() {

    var columnChart;

    beforeEach(function() {
      columnChart = createColumnChart();
    });

    afterEach(function() {
      removeColumnChart(columnChart);
    });

    it('should no longer respond to events for which the visualization registered handlers', function(done) {

      var eventHandlerHasBeenFired = false;

      columnChart.chart.render(testData, columnChart.renderOptions);

      columnChart.element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', function(event) {

        eventHandlerHasBeenFired = true;
      });

      columnChart.chart.destroy();

      $('.bar-group').eq(0).trigger('click');

      _.defer(
        function() {

          assert.isFalse(eventHandlerHasBeenFired);
          done();
        }
      );
    });
  });
});
