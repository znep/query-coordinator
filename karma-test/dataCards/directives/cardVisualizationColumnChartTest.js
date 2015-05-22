describe('A Column Chart Card Visualization', function() {
  'use strict';

  var testHelpers;
  var rootScope;
  var Model;
  var Mockumentary;
  var q;
  var Filter;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  function createChart(whereClause) {
    var pageOverrides = {
      pageId: 'asdf-fdsa'
    };
    var datasetOverrides = {
      id: 'bana-nas!',
      rowDisplayUnit: 'row',
      columns: {
        'test_column': {
          name: 'test column name',
          description: 'test column description',
          fred: 'amount',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column']
        }
      }
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', false);
    model.defineObservableProperty('page', pageModel);

    var outerScope = rootScope.$new();
    outerScope.whereClause = whereClause;
    outerScope.model = model;

    var html = '<div class="card-visualization"><card-visualization-column-chart model="model" where-clause="whereClause"></card-visualization-column-chart></div>';
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    return {
      model: model,
      element: element,
      outerScope: outerScope,
      scope: element.find('div[column-chart]').scope()
    };
  }

  function createMockDataService(fakeData) {
    beforeEach(function() {
      module(function($provide) {
        var mockCardDataService = {
          getData: function(){ return q.when(fakeData);}
        };
        $provide.value('CardDataService', mockCardDataService);
      });
    });
  }

  function initInjector() {
    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      Model = $injector.get('Model');
      Mockumentary = $injector.get('Mockumentary');
      q = $injector.get('$q');
      Filter = $injector.get('Filter');
    }));
  }

  describe('preparing column chart data', function() {

    createMockDataService([{
      name: undefined,
      total: 100,
      filtered: 100,
      special: false
    }]);
    initInjector();

    it('should use empty strings for bars with undefined names', function() {

      var chart = createChart();

      expect(/No value/.test(chart.element[0].innerText));
    });
  });

  describe('filtering via column-chart:datum-clicked event', function() {

    createMockDataService([]);
    initInjector();

    it('should toggle a BinaryOperatorFilter for a non-null value', function() {
      var chart = createChart();

      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
      chart.scope.$emit('column-chart:datum-clicked', {
        name: 'testname'
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);
      chart.scope.$emit('column-chart:datum-clicked', {
        name: 'testname'
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
    });

    it('should toggle a BinaryOperatorFilter for a boolean value', function() {
      var chart = createChart();

      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
      chart.scope.$emit('column-chart:datum-clicked', {
        name: false
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);
      chart.scope.$emit('column-chart:datum-clicked', {
        name: false
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
    });

    it('should toggle a IsNullFilter for a null value', function() {
      var chart = createChart();

      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
      chart.scope.$emit('column-chart:datum-clicked', {
        name: null
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);
      chart.scope.$emit('column-chart:datum-clicked', {
        name: null
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
    });

    it('should replace a IsNullFilter with BinaryOperatorFilter and vice versa for appropriate value', function() {
      var chart = createChart();

      expect(chart.model.getCurrentValue('activeFilters')).to.be.empty;
      chart.scope.$emit('column-chart:datum-clicked', {
        name: null
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);
      chart.scope.$emit('column-chart:datum-clicked', {
        name: 'testname'
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);
      chart.scope.$emit('column-chart:datum-clicked', {
        name: null
      });
      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);
    });
  });
});
