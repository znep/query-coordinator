describe("A Table Card Visualization", function() {
  var testHelpers, rootScope, Model, q;

  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getRowCount: function(id, whereClause) {
          return q.when(_.isUndefined(whereClause) ? 1337 : 42);
        }
      }
      $provide.value('CardDataService', mockCardDataService);
    });
  });
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    q = $injector.get('$q');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var createTable = function(whereClause) {
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

    var pageModel = new Model();
    pageModel.defineObservableProperty('dataset', datasetModel);
    pageModel.defineObservableProperty('baseSoqlFilter', null);
    pageModel.defineObservableProperty('cards', []);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = whereClause;
    outerScope.model = model;

    var html = '<card-visualization-table model="model" where-clause="whereClause"></card-visualization-table>';
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
    return {
      pageModel: pageModel,
      datasetModel: datasetModel,
      model: model,
      element: element,
      outerScope: outerScope,
      scope: element.find('div[table]').scope()
    };
  }

  describe('row counts', function() {
    it('should be correct for filtered and unfiltered tables', function(){
      var table = createTable();
      expect(table.scope.rowCount).to.equal(1337);
      expect(table.scope.filteredRowCount).to.equal(1337);

      table.outerScope.whereClause = "bogus";
      table.outerScope.$digest();
      expect(table.scope.rowCount).to.equal(1337);
      expect(table.scope.filteredRowCount).to.equal(42);
    });
  });
});

