describe("A Column Chart Card Visualization", function() {
  var testHelpers, rootScope, Model, Page, q, Filter;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getData: function(){ return q.when([]);}
      };
      $provide.value('CardDataService', mockCardDataService);
    });
  });
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Page = $injector.get('Page');
    q = $injector.get('$q');
    Filter = $injector.get('Filter');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var createChart = function(whereClause) {
    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', false);

    var datasetModel = new Model();
    datasetModel.id = "bana-nas!";
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', {
      'test_column': {
        "name": "test_column",
        "title": "test column title",
        "description": "test column description",
        "logicalDatatype": "amount",
        "physicalDatatype": "number",
        "importance": 2
      }
    });

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('primaryAmountField', null);
    pageModel.set('primaryAggregation', null);
    pageModel.set('cards', []);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = whereClause;
    outerScope.model = model;

    var html = '<div class="card-visualization"><card-visualization-column-chart model="model" where-clause="whereClause"></card-visualization-column-chart></div>';
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
    return {
      pageModel: pageModel,
      datasetModel: datasetModel,
      model: model,
      element: element,
      outerScope: outerScope,
      scope: element.find('div[column-chart]').scope()
    };
  }
  describe('filtering via column-chart:datum-clicked event', function() {
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

