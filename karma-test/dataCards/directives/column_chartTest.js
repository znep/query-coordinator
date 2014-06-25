describe('column_chart', function() {

  var testData = [{"name":"THEFT","value":21571},{"name":"BATTERY","value":18355},{"name":"NARCOTICS","value":11552},{"name":"CRIMINAL DAMAGE","value":9905},{"name":"OTHER OFFENSE","value":6574},{"name":"ASSAULT","value":6098},{"name":"BURGLARY","value":5166},{"name":"DECEPTIVE PRACTICE","value":5120},{"name":"MOTOR VEHICLE THEFT","value":3828},{"name":"ROBBERY","value":3457},{"name":"CRIMINAL TRESPASS","value":2981},{"name":"WEAPONS VIOLATION","value":1091},{"name":"PUBLIC PEACE VIOLATION","value":1021},{"name":"OFFENSE INVOLVING CHILDREN","value":919},{"name":"PROSTITUTION","value":508},{"name":"INTERFERENCE WITH PUBLIC OFFICER","value":479},{"name":"CRIM SEXUAL ASSAULT","value":412},{"name":"SEX OFFENSE","value":289},{"name":"LIQUOR LAW VIOLATION","value":142},{"name":"HOMICIDE","value":127},{"name":"ARSON","value":126},{"name":"KIDNAPPING","value":89},{"name":"GAMBLING","value":70},{"name":"INTIMIDATION","value":42},{"name":"STALKING","value":41},{"name":"OBSCENITY","value":12},{"name":"PUBLIC INDECENCY","value":6},{"name":"NON-CRIMINAL","value":5},{"name":"CONCEALED CARRY LICENSE VIOLATION","value":5},{"name":"OTHER NARCOTIC VIOLATION","value":5},{"name":"NON - CRIMINAL","value":2},{"name":"NON-CRIMINAL (SUBJECT SPECIFIED)","value":2}];

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
  afterEach(function(){
    $('#columnChartTest').remove();
  });
  var createColumnChart = function(width, expanded){
    if (!width) width = 640;
    if (!expanded) expanded = false;
    var html =
      '<div class="card" style="width: '+width+'px; height: 480px;">' +
        '<div column-chart class="column-chart" un-filtered-data="unFilteredData"' +
          ' filtered-data="filteredData" field-name="fieldName" expanded="expanded">' +
        '</div>' +
      '</div>';
    var elem = angular.element(html);
    $('body').append('<div id="columnChartTest"></div>');
    $('#columnChartTest').append(elem);
    var compiledElem = compile(elem)(scope);
    scope.expanded = expanded;
    scope.unFilteredData = testData;
    scope.filteredData = testData;
    scope.$digest();
    return compiledElem;
  }
  var bars = testData.length * 2;
  var labels = testData.length;
  describe('when not expanded at 640px', function() {
    it('should create ' + bars + ' bars and 3 labels', function() {
      var el = createColumnChart();
      expect($('.bar').length).to.equal(bars);
      expect($('.labels div').length).to.equal(3);
    });
    it('should not show the moar marker', function() {
      var el = createColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });
  describe('when not expanded at 100px', function() {
    var width = 100;
    it('should show the moar marker', function() {
      var el = createColumnChart(width);
      expect($('.truncation-marker').css('display')).to.equal('block');
    });
  });
  describe('when expanded at 640px', function() {
    var width = 640;
    var expanded = true;
    it('should create ' + bars + ' bars and ' + labels + ' labels', function() {
      var el = createColumnChart(width, expanded);
      expect($('.bar').length).to.equal(bars);
      expect($('.labels div').length).to.equal(testData.length);
    });
    it('should not show the moar marker', function() {
      var el = createColumnChart();
      expect($('.truncation-marker').css('display')).to.equal('none');
    });
  });
});
