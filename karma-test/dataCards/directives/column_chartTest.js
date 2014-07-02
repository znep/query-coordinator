describe('column_chart', function() {
  var th, compile, httpBackend, rootScope, scope, timeout;

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
    removeColumnChart()
  });

  var createNewColumnChart = function(width, expanded, data) {
    removeColumnChart();
    if (!width) width = 640;
    if (!expanded) expanded = false;
    if (!data) data = testData;

    var html =
      '<div class="card" style="width: ' + width + 'px; height: 480px;">' +
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

    it('should not show the moar marker', function() {
      createNewColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });

  });

  describe('when not expanded at 100px', function() {
    var width = 100;

    it('should show the moar marker', function() {
      createNewColumnChart(width);
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
      createNewColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });

  });

  describe('when filtered data is provided', function() {
    var testDataWithFiltered = _.map(testData, function(d) {
      return {
        name: d.name,
        total: d.total,
        filtered: d.total / 2
      };
    });

    describe('with showFiltered on', function() {

      it('should create ' + bars + ' filtered and unfiltered bars, with the correct heights', function() {
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
    var testDataWithBlank = _.map(testData, function(d, i) {
      return {
        total: d.total,
        filtered: d.total
      }
    });

    it('should use the placeholder value', function() {
      createNewColumnChart(640, false, testDataWithBlank);
      expect(_.all($('.tooltip .datum .name'), function(el) {
        return $(el).innerText === '(Undefined)';
      }));
    });
  });

});
