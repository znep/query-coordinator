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
        },
        getRows: function(datasetId, offset, limit, order, timeout, whereClause) {
          return q.when([{
            'coordinates_8': {'type': 'Point', 'coordinates': [-87.49448, 41.792287]},
            'kilo_monstrosityquotient_2': '96054.26539825846',
            'largechronometerreading_10': '1950-10-12T18:51:43.000',
            'mediumchoronometerreading_11': '1986-12-26T13:25:53.000',
            'mega_monstrosityquotient_1': '7181660.166551098',
            'microchronometerreading_14': '1987-08-14T03:30:23.000',
            'monster_5': 'Amomongo',
            'monsterometerreading_4': '1',
            'monstrosityquotient_3': '36.97360184048597',
            'smallchronometerreading_12': '1987-04-26T11:18:05.000',
            'subjectiveoration_7': 'one hundred and sixty-five',
            'subjectivereading_6': '-7336',
            'tinychronometerreading_13': '1987-07-02T07:53:21.000',
            'ultra_monstrosityquotient_0': '8033004824.908081',
            'witnesstestimony_9': 'My ash sword hangs at my side. Her antiquity in preceding and surviving succeeding tellurian generations: her nocturnal predominance: her satellitic dependence: her luminary reflection: her constancy under all her phases, rising and setting by her appointed times, waxing and waning: the forced invariability of her aspect: her indeterminate response to inaffirmative interrogation: her potency over effluent and refluent waters: her power to enamour, to mortify, to invest with beauty, to render insane, to incite to and aid delinquency: the tranquil inscrutability of her visage: the terribility of her isolated dominant resplendent propinquity: her omens of tempest and of calm: the stimulation of her light, her motion and her presence: the admonition of her craters, her arid seas, her silence: her splendour, when visible: her attraction, when invisible.'}
          ]);
        }
      };
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
    rootScope.$broadcast('$destroy');
    testHelpers.TestDom.clear();
  });

  function newCard(pageModel, blob) {
    var baseCard = {
      'cardCustomStyle': {},
      'expandedCustomStyle': {},
      'displayMode': 'visualization',
      'expanded': false
    };

    return Card.deserialize(pageModel, $.extend({}, baseCard, blob));
  }

  function createTable(expanded, cardBlobs, whereClause, firstColumn) {
    expanded = expanded || false;
    cardBlobs = cardBlobs || [];

    var model = new Model();
    model.fieldName = '*';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', expanded);

    var datasetModel = new Model();
    datasetModel.id = 'test-data';
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');

    datasetModel.defineObservableProperty('columns', {
      'test_column': {
        'name': 'test_column',
        'title': 'test column title',
        'description': 'test column description',
        'cardinality': 10,
        'physicalDatatype': 'number',
        'importance': 2,
        'isSystemColumn': false
      },
      'test_timestamp_column': {
        'name': 'test_timestamp_column',
        'title': 'what time is it',
        'cardinality': 1000,
        'physicalDatatype': 'timestamp',
        'importance': 3,
        'isSystemColumn': false
      },
      'test_floating_timestamp_column': {
        'name': 'test_floating_timestamp_column',
        'title': 'which time is it',
        'cardinality': 1000,
        'physicalDatatype': 'floating_timestamp',
        'importance': 3,
        'isSystemColumn': false
      },
      ':@test_computed_column': {
        'name': ':@test_computed_column',
        'title': 'Community Districts',
        'description': 'Community district reporting 311 request',
        'cardinality': 1000,
        'physicalDatatype': 'text',
        'importance': 1,
        'shapefile': '7a5b-8kcq',
        'computationStrategy': 'georegion_match_on_point',
        'isSystemColumn': true
      },
      ':test_system_column': {
        'name': ':test_system_column',
        'title': ':test_system_column',
        'cardinality': 1000,
        'physicalDatatype': 'row_identifier',
        'importance': 3,
        'isSystemColumn': true
      },
      '*': {
        'name': '*',
        'title': 'Data Table',
        'description': '',
        'cardinality': 1000,
        'physicalDatatype': '*',
        'importance': 1,
        'isSystemColumn': false,
        'fakeColumnGeneratedByFrontEnd': true
      }
    });

    var pageModel = new Page('test-page');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    model.page = pageModel;

    var cardModels = cardBlobs.map(function(cardBlob) { return newCard(pageModel, cardBlob); });
    model.page.set('cards', cardModels);

    var outerScope = rootScope.$new();
    outerScope.whereClause = whereClause;
    outerScope.model = model;
    outerScope.firstColumn = firstColumn;

    var html = '<div style="position: relative"><card-visualization-table model="model" where-clause="whereClause" first-column="firstColumn"></card-visualization-table></div>';
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

    it('should be correct for filtered and unfiltered tables', function() {
      var table = createTable();

      expect(table.scope.rowCount).to.equal(1337);
      expect(table.scope.filteredRowCount).to.equal(1337);

      table.outerScope.whereClause = 'invalid where clause';
      table.outerScope.$digest();
      expect(table.scope.rowCount).to.equal(1337);
      expect(table.scope.filteredRowCount).to.equal(42);
    });

  });

  describe('default sort', function() {

    it('should be correct', function() {
      var table = createTable();

      table.pageModel.set('cards', []);
      expect(table.scope.defaultSortColumnName).to.equal(null);

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'field1',
          'cardSize': 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field1');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'field2',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'field3',
          'cardSize': 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field3');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'field4',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'field5',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'field6',
          'cardSize': 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field5');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'field7',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'field8',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'field9',
          'cardSize': 2
        })
      ]);
      expect(table.scope.defaultSortColumnName).to.equal('field7');

      // The table doesn't actually have a field7 column, so reset it so that async operations that
      // use defaultSortColumnName are happy
      table.scope.defaultSortColumnName = null;
      table.scope.$digest();
    });

  });

  describe('custom sort', function() {

    it('should include computed columns', function() {

      var cards = [{
        'fieldName': ':@test_computed_column',
        'cardSize': 1
      }, {
        'fieldName': 'test_column',
        'cardSize': 2
      }];

      expect(function() {
        createTable(true, cards);
      }).to.not.throw();

    });

  });

  describe('first column', function() {
    it('should be able to be specified', function() {
      var FIRST_COLUMN_OVERRIDE = 'test_timestamp_column';
      var table = createTable(undefined, undefined, undefined, FIRST_COLUMN_OVERRIDE);
      expect(table.element.find('.th:eq(0)').data('columnId')).to.equal(FIRST_COLUMN_OVERRIDE);
    });
  });

});

