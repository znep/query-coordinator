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

  var testDataWithLongLabels = [
    {"name": "STREET","value": "1453143"},
    {"name": "RESIDENCE","value": "910452"},
    {"name": "SIDEWALK","value": "540147"},
    {"name": "APARTMENT","value": "528835"},
    {"name": "OTHER","value": "199411"},
    {"name": "PARKING LOT/GARAGE(NON.RESID.)","value": "153799"},
    {"name": "ALLEY","value": "122895"},
    {"name": "SCHOOL, PUBLIC, BUILDING","value": "122024"},
    {"name": "RESIDENCE-GARAGE","value": "108148"},
    {"name": "RESIDENCE PORCH/HALLWAY","value": "94679"},
    {"name": "SMALL RETAIL STORE","value": "88836"},
    {"name": "VEHICLE NON-COMMERCIAL","value": "83866"},
    {"name": "RESTAURANT","value": "76701"},
    {"name": "GROCERY FOOD STORE","value": "70823"},
    {"name": "DEPARTMENT STORE","value": "62696"},
    {"name": "GAS STATION","value": "55631"},
    {"name": "CHA PARKING LOT/GROUNDS","value": "50841"},
    {"name": "RESIDENTIAL YARD (FRONT/BACK)","value": "44177"},
    {"name": "PARK PROPERTY","value": "41171"},
    {"name": "COMMERCIAL / BUSINESS OFFICE","value": "40976"},
    {"name": "CTA PLATFORM","value": "31842"},
    {"name": "CHA APARTMENT","value": "31632"},
    {"name": "BAR OR TAVERN","value": "26812"},
    {"name": "DRUG STORE","value": "24975"},
    {"name": "SCHOOL, PUBLIC, GROUNDS","value": "23549"},
    {"name": "CHA HALLWAY/STAIRWELL/ELEVATOR","value": "23302"},
    {"name": "BANK","value": "22132"},
    {"name": "HOTEL/MOTEL","value": "21446"},
    {"name": "VACANT LOT/LAND","value": "19097"},
    {"name": "TAVERN/LIQUOR STORE","value": "18912"},
    {"name": "CTA TRAIN","value": "16929"},
    {"name": "CTA BUS","value": "16854"},
    {"name": "DRIVEWAY - RESIDENTIAL","value": "15788"},
    {"name": "AIRPORT/AIRCRAFT","value": "15038"},
    {"name": "HOSPITAL BUILDING/GROUNDS","value": "14973"},
    {"name": "POLICE FACILITY/VEH PARKING LOT","value": "12880"},
    {"name": "CHURCH/SYNAGOGUE/PLACE OF WORSHIP","value": "11966"},
    {"name": "GOVERNMENT BUILDING/PROPERTY","value": "11245"},
    {"name": "CONSTRUCTION SITE","value": "10916"},
    {"name": "SCHOOL, PRIVATE, BUILDING","value": "10561"},
    {"name": "NURSING HOME/RETIREMENT HOME","value": "9830"},
    {"name": "ABANDONED BUILDING","value": "8957"},
    {"name": "CURRENCY EXCHANGE","value": "8601"},
    {"name": "CTA GARAGE / OTHER PROPERTY","value": "8578"},
    {"name": "CONVENIENCE STORE","value": "8495"},
    {"name": "WAREHOUSE","value": "7668"},
    {"name": "BARBERSHOP","value": "6439"},
    {"name": "FACTORY/MANUFACTURING BUILDING","value": "5940"},
    {"name": "MEDICAL/DENTAL OFFICE","value": "5675"},
    {"name": "ATHLETIC CLUB","value": "5544"}
  ];

  function testDataWithSpecialAtIndex(specialIndex) {
    return _.map(testData, function(d, i) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2,
        special: i == specialIndex
      };
    });
  }

  function testDataWithBlankAtIndex(index) {
    return _.map(testData, function(d, i) {
      return {
        name: i === index ? '' : d.name,
        total: d.total,
        filtered: d.total / 2,
        special: false
      };
    });
  }

  function testDataWithNaNAndSpecialAtIndex(index) {
    return _.map(testData, function(d, i) {
      return {
        name: i === index ? NaN : d.name,
        total: d.total,
        filtered: d.total / 2,
        special: i === index ? true : false
      };
    });
  }

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

  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.services'));

  beforeEach(module('dataCards.directives'));

  beforeEach(module('dataCards/column-chart.sass'));

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
    removeColumnCharts();
  });

  var createColumnChart = function(width, expanded, data) {
    if (!width) width = 640;
    if (!expanded) expanded = false;
    if (!data) data = testData;

    var html =
      '<div class="card-visualization" style="width: ' +
        width + 'px; height: ' + CHART_HEIGHT + 'px;">' +
        '<div column-chart class="column-chart"' +
          ' chart-data="testData" show-filtered="showFiltered" expanded="expanded">' +
        '</div>' +
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

  var removeColumnCharts = function() {
    $('.columnChartTest').remove();
  };

  var bars = testData.length;
  var labels = testData.length;

  describe('when not expanded at 640px', function() {

    it('should create ' + bars + ' bars and 3 labels', function() {
      createColumnChart();
      expect($('.bar-group').length).to.equal(bars);
      expect($('.bar.unfiltered').length).to.equal(bars);
      expect($('.labels div.label').length).to.equal(3);
    });

    it('should create bars with a defined width', function() {
      createColumnChart();
      expect(typeof $('.bar.unfiltered').width() == 'number').to.equal(true);
    });

    it('should not show the moar marker', function() {
      createColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });

    it('should place the bars above the axis', function() {
      var chart = createColumnChart();
      // Find the x-axis. It's the bottommost one of the ticks
      var xAxis = $(_.reduce(chart.element.find('.ticks').children(), function(accum, element) {
        if ($(accum).position().top < $(element).position().top) {
          return element;
        } else {
          return accum;
        }
      }));
      var xAxisPosition = Math.round(xAxis.offset().top + xAxis.outerHeight());

      var bars = chart.element.find('.bar');
      expect(bars).to.have.length.greaterThan(1);
      bars.each(function() {
        // Made this fuzzy because it would generate different results if I was at home or at the office (wat!?)
        expect(Math.round(this.getBoundingClientRect().bottom)).to.be.within(xAxisPosition - 1, xAxisPosition + 1);
      });
    });

    it('should show a minimum of 1 pixel if there is a non-zero value', function() {
      // Craft the data such that the scale will result in a <.5px value
      var testData = [
        {"name": "THEFT", "total": 10}
      ];
      var chart = createColumnChart(null, null, testData);
      var bars = chart.element.find('.bar.unfiltered');
      // the column chart adds padding and stuff. Get the ACTUAL height we want to be.
      var maxHeight = bars.eq(0).height();

      chart.scope.testData = [
        {"name": "THEFT", "total": maxHeight},
        {"name": "FOULLANGUAGE", "total": 50},
        {"name": "JAYWALKING", "total": 1},
        {"name": "PICKINGNOSE", "total": .4},
        {"name": "BEINGAWESOME", "total": 0}
      ];
      chart.scope.$digest();

      // Make sure it laid out the way we expected
      bars = chart.element.find('.bar.unfiltered');
      expect(bars.eq(0).height()).to.equal(maxHeight);
      expect(bars.eq(1).height()).to.equal(50);
      expect(bars.eq(2).height()).to.equal(1);
      // Now make sure the sub-pixel one rounded up
      expect(bars.eq(3).height()).to.equal(1);
      // But the zero-pixel one isn't.
      expect(bars.eq(4).height()).to.equal(0);
    });

    it('should place the smaller bar in front', function() {
      var testData = [
        {"name": "BOTH_POSITIVE_TOTAL_BIGGER", "total": 10, "filtered": 5},
        {"name": "BOTH_POSITIVE_FILTERED_BIGGER", "total": 10, "filtered": 15},

        {"name": "BOTH_NEGATIVE_TOTAL_BIGGER", "total": -10, "filtered": -5},
        {"name": "BOTH_NEGATIVE_FILTERED_BIGGER", "total": -10, "filtered": -15},

        {"name": "TOTAL_POSITIVE_FILTERED_NEGATIVE", "total": 10, "filtered": -10},
        {"name": "TOTAL_NEGATIVE_FILTERED_POSITIVE", "total": -10, "filtered": 10}
      ];
      var chart = createColumnChart(null, null, testData);
      var bars = chart.element.find('.bar.unfiltered');

      function findName(name) {
        var barGroup = chart.element.find('[data-bar-name="{0}"]'.format(name));
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

      // At this point, the chart is rendering in unfiltered mode.
      // This means total should never be on top.
      checkTotalOnTop(_.pluck(testData, 'name'), false);

      // Now, turn on filtered mode. This should change the order
      // of the bars appropriately.
      chart.scope.showFiltered = true;
      chart.scope.$digest();

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
          _.pluck(testData, 'name'),
          _.union(expectFilteredOnTop, expectTotalOnTop)
        )
      ).to.be.empty;

      checkTotalOnTop(expectFilteredOnTop, false);
      checkTotalOnTop(expectTotalOnTop, true);
    });
  });

  describe('y scale', function() {
    var smallDataPoint = { 'name': 'small', 'total': 1, 'filtered': 1 };
    var hugeDataPoint = { 'name': 'small', 'total': 10000000, 'filtered': 10000000 };

    var testDataOnlySmall = _.map(_.range(100), _.constant(smallDataPoint));
    var testDataWithOneBigAtEnd = testDataOnlySmall.concat([hugeDataPoint]);

    describe('when expanded', function() {
      it('should base the y scale on all data', function() {
        // Make a prototypal chart with only small values.
        // Then grab the height of the columns.
        // 50px wide is too small to show all the bars.
        var chartWithOnlySmall = createColumnChart(50, true, testDataOnlySmall);
        var heightOfSmallColumns = chartWithOnlySmall.element.find('.bar').height();
        expect(heightOfSmallColumns).to.be.above(0);
        removeColumnCharts();

        // Now, make almost the same chart, but tack on one huge value at the end.
        // It should not affect the scale.
        var chartWithBigToo = createColumnChart(50, true, testDataWithOneBigAtEnd);
        var heightOfColumnsWithBigToo = chartWithBigToo.element.find('.bar').height();

        expect(heightOfColumnsWithBigToo).to.be.below(heightOfSmallColumns); // Big data means small bars.

      });

    });

    describe('when not expanded', function() {
      it('should only base the y scale on the visible bars', function() {
        // Make a prototypal chart with only small values.
        // Then grab the height of the columns.
        var chartWithOnlySmall = createColumnChart(50, false, testDataOnlySmall); // 50px wide is too small to show all the bars.
        var heightOfSmallColumns = chartWithOnlySmall.element.find('.bar').height();
        expect(heightOfSmallColumns).to.be.above(0);
        removeColumnCharts();

        // Now, make almost the same chart, but tack on one huge value at the end.
        // It should not affect the scale.
        var chartWithBigToo = createColumnChart(50, false, testDataWithOneBigAtEnd);
        var heightOfColumnsWithBigToo = chartWithBigToo.element.find('.bar').height();

        expect(heightOfColumnsWithBigToo).to.equal(heightOfSmallColumns);
      });

    });

  });

  describe('when not expanded at 100px', function() {
    var width = 100;
    var expanded = false;

    it('should show the moar marker', function() {
      createColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('block');
    });
  });

  describe('when expanded at 640px', function() {
    var width = 640;
    var expanded = true;

    it('should create ' + bars + ' bars and ' + labels + ' labels', function() {
      createColumnChart(width, expanded);
      expect($('.bar-group').length).to.equal(bars);
      expect($('.bar.unfiltered').length).to.equal(bars);
      expect($('.labels div.label').length).to.equal(testData.length);
    });

    it('should not show the moar marker', function() {
      createColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('none');
    });

    it('should not hide any bars', function() {
      expect($('.bar-group:not(.active)').length).to.equal(0);
    });
  });

  /*   min and max bar widths spec */

  describe('when not expanded at 50px', function() {
    var width = 50;
    var expanded = false;

    it('should maintain a bar width >= minSmallCardBarWidth (' + minSmallCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width() >= minSmallCardBarWidth).to.equal(true);
    });

    it('should maintain a bar width <= maxSmallCardBarWidth (' + maxSmallCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width() <= maxSmallCardBarWidth).to.equal(true);
    });

    it('should maintain spacing between bars', function() {
      createColumnChart(width, expanded);
      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);
      expect(barGroup2Left - barGroup1Left > barWidth).to.equal(true);
    });
    it('should hide some bars', function() {
      createColumnChart(width, expanded);
      expect($('.bar-group:not(.active)').length).to.not.equal(0);
    });
  });

  describe('when not expanded at 9000px', function() {
    var width = 9000;
    var expanded = false;

    it('should maintain a bar width >=  minSmallCardBarWidth (' + minSmallCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.least(minSmallCardBarWidth);
    });

    it('should maintain a bar width <= maxSmallCardBarWidth (' + maxSmallCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.most(maxSmallCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createColumnChart(width, expanded);
      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);
      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });

    it('should not show the more marker', function() {
      createColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  describe('when expanded at 50px', function() {
    var width = 50;
    var expanded = true;

    it('should maintain a bar width >= minExpandedCardBarWidth (' + minExpandedCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.least(minExpandedCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createColumnChart(width, expanded);
      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);
      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });
  });

  describe('when expanded at 9000px', function() {
    var width = 9000;
    var expanded = true;

    it('should maintain a bar width <= maxExpandedCardBarWidth (' + maxExpandedCardBarWidth + 'px)', function() {
      createColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.most(maxExpandedCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createColumnChart(width, expanded);
      var barGroup1 = $('.bar-group')[0];
      var barGroup2 = $('.bar-group')[1];
      var barGroup1Left = parseInt(barGroup1.style.left);
      var barGroup2Left = parseInt(barGroup2.style.left);
      var barWidth = parseInt(barGroup1.style.width);
      expect(barGroup2Left - barGroup1Left).to.be.above(barWidth);
    });

    it('should not show the moar marker', function() {
      createColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  /*  filtered data spec  */

  describe('when filtered data is provided', function() {
    var testDataWithFiltered = _.map(testData, function(d) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2
      };
    });

    describe('with showFiltered on', function() {

      var chart;
      var scope;

      beforeEach(function() {
        chart = createColumnChart(640, false, testDataWithFiltered);
        scope = chart.scope;
        $('#uber-flyout').hide();
      });

      it('should create ' + bars + ' filtered and unfiltered bars, with the correct heights', function() {
        scope.showFiltered = true;
        scope.$digest();
        expect($('.bar.filtered').length).to.equal(bars);
        expect(_.any($('.bar.filtered'), function(bar) {
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

      it('should add class hover to bar on flyout event, and remove class on exit', function() {
        var barGroup = chart.element.find('.bar-group').get(0);
        scope.showFiltered = true;
        scope.$digest();

        th.fireMouseEvent(barGroup, 'mousemove');
        expect(chart.element.find('.bar-group').hasClass('hover')).to.equal(true);
        th.fireMouseEvent(barGroup, 'mouseout');
        expect(chart.element.find('.bar-group').hasClass('hover')).to.equal(false);
      });

      it('should show the filtered count in the flyout', function() {
        var barGroup = chart.element.find('.bar-group').get(0);
        var flyout = $('#uber-flyout');

        scope.showFiltered = true;
        scope.$digest();

        th.fireMouseEvent(barGroup, 'mousemove');
        expect(flyout.find('.flyout-cell:contains(Filtered amount)').length).to.equal(1);
      });

    });

    describe('with showFiltered off', function() {

      var chart;

      beforeEach(function() {
        chart = createColumnChart(640, false, testDataWithFiltered);
        $('#uber-flyout').hide();
      });

      it('should not show the filtered count in the flyout', function() {
        var barGroup = chart.element.find('.bar-group').get(0);
        var flyout = $('#uber-flyout');

        th.fireMouseEvent(barGroup, 'mousemove');
        expect(flyout.find('.flyout-cell:contains(Filtered amount)').length).to.equal(0);
      });
    });

  });

  describe('when data with the special field set is provided', function() {
    var specialIndex = 6;

    it('should create 1 special bar-group', function() {
      var testDataWithSpecial = testDataWithSpecialAtIndex(specialIndex);
      createColumnChart(640, false, testDataWithSpecial);
      expect($('.bar-group.special').length).to.equal(1);
      expect($('.bar-group.special')[0].__data__.name).to.equal(testDataWithSpecial[specialIndex].name);
    });

  });

  describe('when data changes dynamically', function() {

    it('should hide all existing bars when the data is cleared', function() {
      var scope = createColumnChart().scope;

      scope.testData = [];
      scope.$digest();
      expect($('.bar-group').length).to.equal(0);
    });

  });

  describe('when there are a small number of columns', function() {
    var chart;
    var scope;
    var element;
    var ensureChart = _.once(function() {
      var testDataSubset = _.select(testData, function(object, index) {
        return index < 4;
      });
      expect(testDataSubset.length).to.equal(4);
      chart = createColumnChart(1000, false, testDataSubset);
      scope = chart.scope;
      element = chart.element;
    });

    it('should display the columns at their maximum width when not expanded', function() {
      ensureChart();
      expect(element.find('.bar-group .bar').first().width()).to.equal(30);
    });

    it('should display the columns at their maximum width when they are expanded', function(){
      ensureChart();
      scope.expanded = true;
      scope.$digest();
      expect(element.find('.bar-group .bar').first().width()).to.equal(40);
    });

  });

  describe('column labels', function() {
    var chart;
    var scope;
    var element;
    var ensureChart = _.once(function() {
      chart = createColumnChart(100, false, testData);
      scope = chart.scope;
      element = chart.element;
    });

    it('should show the top 3 bar labels by default', function() {
      ensureChart();
      var labels = element.find('.labels .label .text');
      expect(labels).to.be.length(3);
      labels.each(function(i, label) {
        expect($(label).text()).to.equal(testData[i].name);
      });
    });

    it('should show the top 3 bar labels plus the special bar', function() {
      var specialIndex = 5;
      ensureChart();
      scope.testData = testDataWithSpecialAtIndex(specialIndex);
      scope.$digest();
      var labels = element.find('.labels .label .text');
      expect(labels).to.be.length(4);

      var expectedLabels = _(testData).take(3).pluck('name').value();
      expectedLabels.push(testData[specialIndex].name);

      labels.each(function(i, label) {
        expect($(label).text()).to.equal(expectedLabels[i]);
      });
    });

    it('should apply a class of orientation-right or orientation-left depending on fit', function() {
      var specialIndex = testData.length - 1;
      ensureChart();
      scope.testData = testDataWithSpecialAtIndex(specialIndex);
      scope.$digest();
      var labels = element.find('.labels .label');
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

    it('should emit the column-chart:truncation-marker-clicked event', function() {
      var scope = createColumnChart(300, false, testData).scope;
      var moarMarker = $('.truncation-marker');
      var receivedEvent = false;

      expect(moarMarker.css('display')).to.equal('block', 'truncation marker should be visible');
      expect(scope.expanded).to.equal(false, 'expanded should be false prior to click');
      scope.$on('column-chart:truncation-marker-clicked', function() {
        receivedEvent = true;
      });
      moarMarker.click();
      expect(receivedEvent).to.equal(true, 'should have received truncation-marker-clicked event');
    });

  });

  describe('column-chart:datum-clicked event', function() {
    var indexOfItemToClick = 2;
    var chart;
    var scope;
    var element;
    var correctEventRaised = new Rx.Subject();
    var ensureChart = function() {
      chart = createColumnChart(300, false, testData);
      scope = chart.scope;
      element = chart.element;

      scope.$on('column-chart:datum-clicked', function(event, args) {
        expect(args).to.equal(testData[indexOfItemToClick]);
        correctEventRaised.onNext();
      });
    };

    it('should be raised when the bar-groups are clicked', function(done) {
      ensureChart();
      correctEventRaised.subscribe(_.after(2, done));
      element.find('.bar-group').eq(indexOfItemToClick).click();
      scope.expanded = true;
      scope.$digest();
      element.find('.bar-group').eq(indexOfItemToClick).click();
    });

    it('should be raised when the labels are clicked', function() {
      ensureChart();
      var subscription = correctEventRaised.subscribe(function() {
        throw new Error('Clicking on the label wrappers should not raise the event.');
      });
      element.find('.label div:contains("{0}")'.format(testData[indexOfItemToClick].name)).click();
      scope.expanded = true;
      scope.$digest();
      element.find('.label div:contains("{0}")'.format(testData[indexOfItemToClick].name)).click();
      subscription.dispose();
    });

    it('should be raised when the label text is clicked', function(done) {
      ensureChart();
      var subscription = correctEventRaised.subscribe(_.after(2, done));
      element.find('.label span:contains("{0}")'.format(testData[indexOfItemToClick].name)).click();
      scope.expanded = true;
      scope.$digest();
      element.find('.label span:contains("{0}")'.format(testData[indexOfItemToClick].name)).click();
      subscription.dispose();
    });
  });

  describe('when the name of a datum is blank', function() {

    it('should use the placeholder value', function() {
      createColumnChart(640, false, testDataWithBlankAtIndex(0));
      expect($('.labels .label').first().find('.contents .text').text()).to.equal('(No value)');
    });

    it('should style the placeholder by adding a class to the label text', function() {
      createColumnChart(640, false, testDataWithBlankAtIndex(0));
      expect($('.labels .label').first().find('.contents').hasClass('undefined')).to.equal(true);
    });

    it('should not add the class to labels with non-blank text', function() {
      createColumnChart(640, false, testDataWithBlankAtIndex(-1));
      expect(_.any($('.labels .label .contents .text'), function(el) {
        return $(el).hasClass('undefined');
      })).to.equal(false);
    });

  });

  // cardVisualizationColumnChart will pass NaN as the name property if there is
  // no name property on the original datum.
  describe('when the name of a datum is NaN', function() {

    it('should use the placeholder value', function() {
      createColumnChart(640, false, testDataWithNaNAndSpecialAtIndex(0));
      expect($('.labels .label').first().find('.contents .text').text()).to.equal('(No value)');
    });

    it('should style the label by adding classes', function() {
      createColumnChart(640, false, testDataWithNaNAndSpecialAtIndex(0));
      expect($('.labels .label').first().find('.contents').hasClass('undefined')).to.equal(true);
      expect($('.labels .label').first().hasClass('special')).to.equal(true);
    });

    it('should style the bar-group by adding a class', function() {
      createColumnChart(640, false, testDataWithNaNAndSpecialAtIndex(0));
      expect($('.bar-group').first().hasClass('special')).to.equal(true);
    });
  });


  describe('when displaying labels', function() {
    var chart;
    var scope;
    var element;
    var ensureChart = _.once(function() {
      chart = createColumnChart(499, false, testData);
      scope = chart.scope;
      element = chart.element;
    });

    it('should correctly position right-aligned labels for columns near the right ' +
      'edge of the chart when said columns have been selected', function() {

      ensureChart();

      scope.testData = testDataWithLongLabels.map(function(datum) {
        return {
          filtered: 0,
          name: datum['name'],
          special: false,
          total: datum['value']
        };
      });

      scope.testData[42].special = true;
      scope.$digest();

      var $label = $('.label.orientation-left');
      var labelRightOffset = parseInt($label[0].style.right, 10);

      expect($label.length > 0).to.equal(true);
      expect(labelRightOffset).to.equal(76);// TODO this magic number seems a bit brittle

    });

  });

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

    var testDataWithFiltered = _.map(testData, function(d) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2
      };
    });

    beforeEach(function() {
      $('#uber-flyout').hide();
    });

    it('should appear on mouseover of a bar', function() {
      chart = createColumnChart(640, false, testDataWithFiltered);
      var flyout = $('#uber-flyout');
      var barGroup = chart.element.find('.bar-group').get(0);

      expect(flyout.is(':hidden')).to.equal(true);
      th.fireMouseEvent(barGroup, 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
    });

    it('should appear on mouseover of a bar\'s label', function() {
      chart = createColumnChart(640, false, testDataWithFiltered);
      var flyout = $('#uber-flyout');
      var barLabel = $(labelContents).eq(0);

      expect(flyout.is(':hidden')).to.equal(true);
      th.fireMouseEvent(barLabel.find(labelSubContents).get(0), 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
    });

    it('should have the correct title', function() {
      chart = createColumnChart(640, false, testDataWithFiltered);
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
      chart = createColumnChart(640, false, testDataWithFiltered);
      var flyout = $('#uber-flyout');
      var barGroup = chart.element.find('.bar-group').get(0);

      th.fireMouseEvent(barGroup, 'mousemove');
      expect(flyout.is(':visible')).to.equal(true);
      th.fireMouseEvent(flyout.get(0), 'mousemove');
      expect(flyout.is(':hidden')).to.equal(true);
    });

  });

  describe('column bars', function() {

    var testDataWithFiltered = _.map(testData, function(d) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2
      };
    });

    it('multiple bars should not highlight on hover ' +
      'if they have the same data-bar-name property', function () {

      var chart = createColumnChart(640, false, testDataWithFiltered);
      var anotherChart = createColumnChart(640, false, testDataWithFiltered);
      var barGroup = chart.element.find('.bar-group').get(0);

      th.fireMouseEvent(barGroup, 'mousemove');

      expect($('.bar-group.hover').length).to.equal(1);
    })
  });

});
