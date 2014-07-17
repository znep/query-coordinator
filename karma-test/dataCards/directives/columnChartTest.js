describe('columnChart', function() {
  var th, compile, httpBackend, rootScope, scope, timeout;

  var minSmallCardBarWidth = 8;
  var maxSmallCardBarWidth = 30;
  var minExpandedCardBarWidth = 15;
  var maxExpandedCardBarWidth = 40;

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
  beforeEach(module('dataCards'));

  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    th = $injector.get('testHelpers');
    compile = $injector.get('$compile');
    httpBackend = $injector.get('$httpBackend');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
  }));

  after(function() {
    removeColumnChart();
  });

  var createNewColumnChart = function(width, expanded, data) {
    removeColumnChart();
    if (!width) width = 640;
    if (!expanded) expanded = false;
    if (!data) data = testData;

    var html =
      '<div class="card-visualization" style="width: ' + width + 'px; height: 480px;">' +
        '<div column-chart class="column-chart"' +
          ' chart-data="testData" show-filtered="showFiltered" expanded="expanded">' +
        '</div>' +
      '</div>';
    var elem = angular.element(html);

    $('body').append('<div id="columnChartTest"></div>');
    $('#columnChartTest').append(elem);

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
  var removeColumnChart = function() {
    $('#columnChartTest').remove();
  };

  var bars = testData.length;
  var labels = testData.length;

  describe('when not expanded at 640px', function() {

    it('should create ' + bars + ' bars and 3 labels', function() {
      createNewColumnChart();
      expect($('.bar-group').length).to.equal(bars);
      expect($('.bar.unfiltered').length).to.equal(bars);
      expect($('.labels div.label').length).to.equal(3);
    });

    it('should create bars with a defined width', function() {
      createNewColumnChart();
      expect(typeof $('.bar.unfiltered').width() == 'number').to.equal(true);
    });

    it('should not show the moar marker', function() {
      createNewColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });

  });

  describe('when not expanded at 100px', function() {
    var width = 100;
    var expanded = false;

    it('should show the moar marker', function() {
      createNewColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('block');
    });
  });

  describe('when expanded at 640px', function() {
    var width = 640;
    var expanded = true;

    it('should create ' + bars + ' bars and ' + labels + ' labels', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar-group').length).to.equal(bars);
      expect($('.bar.unfiltered').length).to.equal(bars);
      expect($('.labels div.label').length).to.equal(testData.length);
    });

    it('should not show the moar marker', function() {
      createNewColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  /*   min and max bar widths spec */

  describe('when not expanded at 50px', function() {
    var width = 50;
    var expanded = false;

    it('should maintain a bar width >= minSmallCardBarWidth (' + minSmallCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width() >= minSmallCardBarWidth).to.equal(true);
    });

    it('should maintain a bar width <= maxSmallCardBarWidth (' + maxSmallCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width() <= maxSmallCardBarWidth).to.equal(true);
    });

    it('should maintain spacing between bars', function() {
      createNewColumnChart(width, expanded);
      var hoverTriggerBar1 = $('.bar.hover-trigger')[0];
      var hoverTriggerBar2 = $('.bar.hover-trigger')[1];
      var hoverTriggerBar1Left = parseInt(hoverTriggerBar1.style.left);
      var hoverTriggerBar2Left = parseInt(hoverTriggerBar2.style.left);
      var barWidth = parseInt(hoverTriggerBar1.style.width);
      expect(hoverTriggerBar2Left - hoverTriggerBar1Left > barWidth).to.equal(true);
    });
  });

  describe('when not expanded at 9000px', function() {
    var width = 9000;
    var expanded = false;

    it('should maintain a bar width >=  minSmallCardBarWidth (' + minSmallCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.least(minSmallCardBarWidth);
    });

    it('should maintain a bar width <= maxSmallCardBarWidth (' + maxSmallCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.most(maxSmallCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createNewColumnChart(width, expanded);
      var hoverTriggerBar1 = $('.bar.hover-trigger')[0];
      var hoverTriggerBar2 = $('.bar.hover-trigger')[1];
      var hoverTriggerBar1Left = parseInt(hoverTriggerBar1.style.left);
      var hoverTriggerBar2Left = parseInt(hoverTriggerBar2.style.left);
      var barWidth = parseInt(hoverTriggerBar1.style.width);
      expect(hoverTriggerBar2Left - hoverTriggerBar1Left).to.be.above(barWidth);
    });

    it('should not show the moar marker', function() {
      createNewColumnChart(width, expanded);
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });

  describe('when expanded at 50px', function() {
    var width = 50;
    var expanded = true;

    it('should maintain a bar width >= minExpandedCardBarWidth (' + minExpandedCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.least(minExpandedCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createNewColumnChart(width, expanded);
      var hoverTriggerBar1 = $('.bar.hover-trigger')[0];
      var hoverTriggerBar2 = $('.bar.hover-trigger')[1];
      var hoverTriggerBar1Left = parseInt(hoverTriggerBar1.style.left);
      var hoverTriggerBar2Left = parseInt(hoverTriggerBar2.style.left);
      var barWidth = parseInt(hoverTriggerBar1.style.width);
      expect(hoverTriggerBar2Left - hoverTriggerBar1Left).to.be.above(barWidth);
    });
  });

  describe('when expanded at 9000px', function() {
    var width = 9000;
    var expanded = true;

    it('should maintain a bar width <= maxExpandedCardBarWidth (' + maxExpandedCardBarWidth + 'px)', function() {
      createNewColumnChart(width, expanded);
      expect($('.bar.unfiltered').width()).to.be.at.most(maxExpandedCardBarWidth);
    });

    it('should maintain spacing between bars', function() {
      createNewColumnChart(width, expanded);
      var hoverTriggerBar1 = $('.bar.hover-trigger')[0];
      var hoverTriggerBar2 = $('.bar.hover-trigger')[1];
      var hoverTriggerBar1Left = parseInt(hoverTriggerBar1.style.left);
      var hoverTriggerBar2Left = parseInt(hoverTriggerBar2.style.left);
      var barWidth = parseInt(hoverTriggerBar1.style.width);
      expect(hoverTriggerBar2Left - hoverTriggerBar1Left).to.be.above(barWidth);
    });

    it('should not show the moar marker', function() {
      createNewColumnChart(width, expanded);
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

      xit('should create ' + bars + ' filtered and unfiltered bars, with the correct heights', function() {
        var chart = createNewColumnChart(640, false, testDataWithFiltered);
        var scope = chart.scope;

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

    });

  });

  describe('when data with the special field set is provided', function() {
    var specialIndex = 6;

    it('should create 1 special bar-group', function() {
      var testDataWithSpecial = testDataWithSpecialAtIndex(specialIndex);
      createNewColumnChart(640, false, testDataWithSpecial);
      expect($('.bar-group.special').length).to.equal(1);
      expect($('.bar-group.special')[0].__data__.name).to.equal(testDataWithSpecial[specialIndex].name);
    });

  });

  describe('when data changes dynamically', function() {

    it('should hide all existing bars when the data is cleared', function() {
      var scope = createNewColumnChart().scope;

      scope.testData = [];
      scope.$digest();
      expect($('.bar-group').length).to.equal(0);
    });

  });

  describe('column labels', function() {
    var chart, scope, element;
    var ensureChart = _.once(function() {
      chart = createNewColumnChart(100, false, testData);
      scope = chart.scope;
      element = chart.element;
    });

    it('should show the top 3 bar labels by default', function() {
      ensureChart();
      var labels = element.find('.labels .label .text');
      expect(labels).to.be.length(3);
      labels.each(function(i, label) {
        var capitalizedName = $.capitalizeWithDefault(testData[i].name);
        expect($(label).text()).to.equal(capitalizedName);
      });
    });

    it('should show the top 3 bar labels plus the special bar', function() {
      var specialIndex = 5;
      ensureChart();
      scope.testData = testDataWithSpecialAtIndex(specialIndex);
      scope.$digest();
      var labels = element.find('.labels .label .text');
      expect(labels).to.be.length(4);

      var expectedLabels = _.pluck(_.first(testData, 3), 'name');
      expectedLabels.push(testData[specialIndex].name);

      labels.each(function(i, label) {
        var capitalizedName = $.capitalizeWithDefault(expectedLabels[i]);
        expect($(label).text()).to.equal(capitalizedName);
      });
    });

    it('should apply a class of orientation-right or orientation-left depending on fit', function() {
      var specialIndex = testData.length - 1;
      ensureChart();
      scope.testData = testDataWithSpecialAtIndex(specialIndex);
      scope.$digest();
      var labels = element.find('.labels .label');
      expect(labels).to.be.length(4);

      var expectedClasses = [
        'orientation-right',
        'orientation-right',
        'orientation-right',
        'orientation-left'
      ];
      labels.each(function(i, label) {
        expect(_.toArray(label.classList)).to.contain(expectedClasses[i]);
      });
    });
  });
  describe('when the truncation marker is clicked', function() {

    it('should emit the column-chart:truncation-marker-clicked event', function() {
      var scope = createNewColumnChart(300, false, testData).scope;
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
    var chart, scope, element;
    var correctEventRaised = new Rx.Subject();
    var ensureChart = _.once(function() {
      chart = createNewColumnChart(300, false, testData);
      scope = chart.scope;
      element = chart.element;

      scope.$on('column-chart:datum-clicked', function(event, args) {
        expect(args).to.equal(testData[indexOfItemToClick]);
        correctEventRaised.onNext();
      });
    });

    it('should be raised when the hover-triggers are clicked', function(done) {
      ensureChart();
      correctEventRaised.subscribe(_.after(2, done));
      element.find('.bar.hover-trigger').eq(indexOfItemToClick).click();
      scope.expanded = true;
      scope.$digest();
      element.find('.bar.hover-trigger').eq(indexOfItemToClick).click();
    });

    it('should be raised when the labels are clicked', function(done) {
      var capitalizedName = $.capitalizeWithDefault(testData[indexOfItemToClick].name);

      ensureChart();
      correctEventRaised.subscribe(_.after(2, done));
      element.find('.label div:contains("' + capitalizedName + '")').click();
      scope.expanded = true;
      scope.$digest();
      element.find('.label div:contains("' + capitalizedName + '")').click();
    });
  });

  describe('when the name of a datum is blank or undefined', function() {

    it('should use the placeholder value', function() {
      createNewColumnChart(640, false, testDataWithBlankAtIndex(0));
      expect(_.first($('.tooltip .datum .name'), function(el) {
        return $(el).innerText === '(Undefined)';
      }));
    });

    it('should style the placeholder by adding a class to the tooltip text', function() {
      createNewColumnChart(640, false, testDataWithBlankAtIndex(0));
      expect(_.first($('.tooltip .datum .name .text'), function(el) {
        return $(el).hasClassName('undefined');
      }));
    });

    it('should style the placeholder by adding a class to the label text', function() {
      createNewColumnChart(640, false, testDataWithBlankAtIndex(0));
      expect(_.first($('.labels .label .text'), function(el) {
        return $(el).hasClass('undefined');
      }));
    });

    it('should not add the class to labels with non-blank text', function() {
      createNewColumnChart(640, false, testDataWithBlankAtIndex(-1));
      expect(_.any($('.tooltip .datum .name .text'), function(el) {
        return $(el).hasClass('undefined');
      })).to.equal(false);
      expect(_.any($('.labels .label .text'), function(el) {
        return $(el).hasClass('undefined');
      })).to.equal(false);
    });

  });

  describe('when displaying labels', function() {
    var chart, scope, element;
    var ensureChart = _.once(function() {
      chart = createNewColumnChart(499, false, testData);
      scope = chart.scope;
      element = chart.element;
    });

    it('should correctly position right-aligned labels for columns near the right ' +
      'edge of the chart when said columns have been selected', function() {

      ensureChart();

      scope.testData = [
        {"name":"STREET","value":"1453143"}
        ,{"name":"RESIDENCE","value":"910452"}
        ,{"name":"SIDEWALK","value":"540147"}
        ,{"name":"APARTMENT","value":"528835"}
        ,{"name":"OTHER","value":"199411"}
        ,{"name":"PARKING LOT/GARAGE(NON.RESID.)","value":"153799"}
        ,{"name":"ALLEY","value":"122895"}
        ,{"name":"SCHOOL, PUBLIC, BUILDING","value":"122024"}
        ,{"name":"RESIDENCE-GARAGE","value":"108148"}
        ,{"name":"RESIDENCE PORCH/HALLWAY","value":"94679"}
        ,{"name":"SMALL RETAIL STORE","value":"88836"}
        ,{"name":"VEHICLE NON-COMMERCIAL","value":"83866"}
        ,{"name":"RESTAURANT","value":"76701"}
        ,{"name":"GROCERY FOOD STORE","value":"70823"}
        ,{"name":"DEPARTMENT STORE","value":"62696"}
        ,{"name":"GAS STATION","value":"55631"}
        ,{"name":"CHA PARKING LOT/GROUNDS","value":"50841"}
        ,{"name":"RESIDENTIAL YARD (FRONT/BACK)","value":"44177"}
        ,{"name":"PARK PROPERTY","value":"41171"}
        ,{"name":"COMMERCIAL / BUSINESS OFFICE","value":"40976"}
        ,{"name":"CTA PLATFORM","value":"31842"}
        ,{"name":"CHA APARTMENT","value":"31632"}
        ,{"name":"BAR OR TAVERN","value":"26812"}
        ,{"name":"DRUG STORE","value":"24975"}
        ,{"name":"SCHOOL, PUBLIC, GROUNDS","value":"23549"}
        ,{"name":"CHA HALLWAY/STAIRWELL/ELEVATOR","value":"23302"}
        ,{"name":"BANK","value":"22132"}
        ,{"name":"HOTEL/MOTEL","value":"21446"}
        ,{"name":"VACANT LOT/LAND","value":"19097"}
        ,{"name":"TAVERN/LIQUOR STORE","value":"18912"}
        ,{"name":"CTA TRAIN","value":"16929"}
        ,{"name":"CTA BUS","value":"16854"}
        ,{"name":"DRIVEWAY - RESIDENTIAL","value":"15788"}
        ,{"name":"AIRPORT/AIRCRAFT","value":"15038"}
        ,{"name":"HOSPITAL BUILDING/GROUNDS","value":"14973"}
        ,{"name":"POLICE FACILITY/VEH PARKING LOT","value":"12880"}
        ,{"name":"CHURCH/SYNAGOGUE/PLACE OF WORSHIP","value":"11966"}
        ,{"name":"GOVERNMENT BUILDING/PROPERTY","value":"11245"}
        ,{"name":"CONSTRUCTION SITE","value":"10916"}
        ,{"name":"SCHOOL, PRIVATE, BUILDING","value":"10561"}
        ,{"name":"NURSING HOME/RETIREMENT HOME","value":"9830"}
        ,{"name":"ABANDONED BUILDING","value":"8957"}
        ,{"name":"CURRENCY EXCHANGE","value":"8601"}
        ,{"name":"CTA GARAGE / OTHER PROPERTY","value":"8578"}
        ,{"name":"CONVENIENCE STORE","value":"8495"}
        ,{"name":"WAREHOUSE","value":"7668"}
        ,{"name":"BARBERSHOP","value":"6439"}
        ,{"name":"FACTORY/MANUFACTURING BUILDING","value":"5940"}
        ,{"name":"MEDICAL/DENTAL OFFICE","value":"5675"}
        ,{"name":"ATHLETIC CLUB","value":"5544"}
      ].map(function(datum) {
        return {
          filtered: 0,
          name: datum['name'],
          special: false,
          total: datum['value']
        };
      });

      scope.testData[42].special = true;

      scope.$digest();

      var labelRightOffset = parseInt($('.label.orientation-left')[0].style.right, 10);

      expect($('.label.orientation-left').length > 0).to.equal(true);
      expect(labelRightOffset).to.equal(50);

    });

  });

});
