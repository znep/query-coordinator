describe("A Table Card Visualization", function() {
  var testHelpers, rootScope, Model, Card, Page, q;

  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));
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
    Card = $injector.get('Card');
    Page = $injector.get('Page');
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

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', []);
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

  describe('default sort', function() {
    it('should be correct', function(){
      var table = createTable();
      function newCard(blob) {
        var baseCard = {
          "cardCustomStyle": {},
          "expandedCustomStyle": {},
          "displayMode": "visualization",
          "expanded": false
        };
        return Card.deserialize(table.pageModel, $.extend({}, baseCard, blob));
      };

      table.pageModel.set('cards', []);
      expect(table.scope.defaultSortColumnName).to.equal(null);

      table.pageModel.set('cards', [
        newCard({
          "fieldName": "field1",
          "cardSize": 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field1');

      table.pageModel.set('cards', [
        newCard({
          "fieldName": "field2",
          "cardSize": 3
        }),
        newCard({
          "fieldName": "field3",
          "cardSize": 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field3');

      table.pageModel.set('cards', [
        newCard({
          "fieldName": "field4",
          "cardSize": 3
        }),
        newCard({
          "fieldName": "field5",
          "cardSize": 2
        }),
        newCard({
          "fieldName": "field6",
          "cardSize": 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field5');

      table.pageModel.set('cards', [
        newCard({
          "fieldName": "field7",
          "cardSize": 2
        }),
        newCard({
          "fieldName": "field8",
          "cardSize": 3
        }),
        newCard({
          "fieldName": "field9",
          "cardSize": 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field7');
    });
  });
});

