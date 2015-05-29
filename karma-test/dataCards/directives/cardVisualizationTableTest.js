describe('A Table Card Visualization', function() {
  'use strict';

  var COLUMNS = {
    'test_column': {
      'name': 'test column title',
      'description': 'test column description',
      'fred': 'amount',
      'physicalDatatype': 'number',
      'defaultCardType': 'column',
      'availableCardTypes': ['column', 'search']
    },
    'test_timestamp_column': {
      'name': 'what time is it',
      'fred': 'time',
      'physicalDatatype': 'timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline']
    },
    'test_floating_timestamp_column': {
      'name': 'which time is it',
      'fred': 'time',
      'physicalDatatype': 'floating_timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline']
    },
    'test_location_column': {
      'name': 'which place i am in',
      'fred': 'point',
      'physicalDatatype': 'point',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature']
    },
    ':@test_computed_column': {
      'name': 'Community Districts',
      'description': 'Community district reporting 311 request',
      'fred': 'location',
      'physicalDatatype': 'number',
      'computationStrategy': {
        'parameters': {
          'region': '_mash-apes'
        },
        'source_columns': ['something_else'],
        'strategy_type': 'georegion_match_on_point'
      },
      'defaultCardType': 'column',
      'availableCardTypes': ['column', 'search']
    },
    ':test_system_column': {
      'name': ':test_system_column',
      'fred': 'text',
      'physicalDatatype': 'row_identifier'
    },
    '*': {
      'name': 'Data Table',
      'description': '',
      'fred': '*',
      'physicalDatatype': '*',
      'defaultCardType': 'table',
      'availableCardTypes': ['table']
    }
  };

  var testHelpers;
  var rootScope;
  var Model;
  var Card;
  var Page;
  var Mockumentary;
  var $q;

  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getRowCount: function(id, whereClause) {
          return $q.when(_.isEmpty(whereClause) ? 1337 : 42);
        },
        getRows: function(/*datasetId, offset, limit, order, timeout, whereClause*/) {
          return $q.when([{
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
    $q = $injector.get('$q');
    Mockumentary = $injector.get('Mockumentary');
  }));

  afterEach(function(){
    rootScope.$broadcast('$destroy');
    testHelpers.TestDom.clear();
  });

  function newCard(pageModel, blob) {
    var baseCard = {
      'expanded': false,
      'cardType': 'table'
    };

    return Card.deserialize(pageModel, $.extend({}, baseCard, blob));
  }

  /**
   * @param {Object} [options]
   * @param {Array} [options.cardBlobs]
   * @param {String} [options.whereClause]
   * @param {String} [options.firstColumn]
   * @param {Object} [options.columns]
   * @returns {{pageModel: Page, datasetModel: Model, model: Model, element: Element, outerScope: Object, scope: Object}}
   */
  function createTable(options) {
    options = _.defaults({}, options, {
      cardBlobs: [],
      whereClause: '',
      firstColumn: undefined,
      columns: COLUMNS,
      primaryAggregation: 'count',
      primaryAmountField: null
    });

    var model = new Model();
    model.fieldName = '*';
    model.defineObservableProperty('activeFilters', []);

    var pageOverrides = {
      id: 'test-page',
      cards: options.cardBlobs,
      primaryAggregation: options.primaryAggregation,
      primaryAmountField: options.primaryAmountField,
      baseSoqlFilter: null
    };
    var datasetOverrides = {
      id: 'test-data',
      columns: options.columns,
      rowDisplayUnit: 'row'
    }
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = options.whereClause;
    outerScope.model = model;
    outerScope.firstColumn = options.firstColumn;

    var html = '<div style="position: relative"><card-visualization-table model="model" where-clause="whereClause" first-column="firstColumn"></card-visualization-table></div>';
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    return {
      pageModel: pageModel,
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

    it('should be correct for count aggregation', function() {
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

    it('should be correct for sum aggregation', function() {
      var table = createTable({ primaryAggregation: 'sum', primaryAmountField: 'test_column' });
      expect(table.scope.defaultSortColumnName).to.equal('test_column');
    })
  });

  describe('custom sort', function() {

    it('should include computed columns', function() {
      var cards = [
        {
          fieldName: ':@test_computed_column',
          cardSize: 1,
          expanded: false
        },
        {
          fieldName: 'test_column',
          cardSize: 2,
          expanded: false
        }
      ];

      expect(function() {
        createTable({ cardBlobs: cards });
      }).to.not.throw();
    });

    it('should not include point columns', function() {
      var cards = [
        {
          fieldName: 'test_location_column',
          cardSize: 1,
          expanded: false
        },
        {
          fieldName: 'test_column',
          cardSize: 2,
          expanded: false
        }
      ];

      // Make sure it doesn't pick the first card to sort by.
      var table = createTable({ cardBlobs: cards });
      expect(table.scope.defaultSortColumnName).to.equal('test_column');
    });
  });

  describe('first column', function() {
    it('should be able to be specified', function() {
      var firstColumnOverride = 'test_timestamp_column';

      var table = createTable({ firstColumn: firstColumnOverride });

      expect(table.element.find('.th:eq(0)').data('columnId')).to.equal(firstColumnOverride);
    });
  });

  describe('column order', function() {
    it('should order columns according to "position" property', function() {
      var columnPosition = {
        'test_column': 2,
        'test_timestamp_column': 1,
        'test_floating_timestamp_column': 3
      };

      var newColumns = _.cloneDeep(COLUMNS);

      _.each(columnPosition, function(value, key) {
        newColumns[key].position = value;
      });

      var table = createTable({ columns: newColumns });
      expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'test_timestamp_column');
      expect(table.element.find('.th:eq(1)')).to.have.data('columnId', 'test_column');
      expect(table.element.find('.th:eq(2)')).to.have.data('columnId', 'test_floating_timestamp_column');
    });

    it('should sort columns without a "position" property to the end', function() {
      var columnPosition = {
        'test_timestamp_column': 2,
        'test_floating_timestamp_column': 1
      };

      var newColumns = _.cloneDeep(COLUMNS);

      _.each(columnPosition, function(value, key) {
        newColumns[key].position = value;
      });

      var table = createTable({ columns: newColumns });

      expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'test_floating_timestamp_column');
      expect(table.element.find('.th:eq(1)')).to.have.data('columnId', 'test_timestamp_column');
      expect(table.element.find('.th:eq(2)')).to.have.data('columnId', 'test_column');
    });
  });

  describe('column visibility', function() {
    it('should hide columns according to "hideInTable" property', function() {
      var newColumns = _.cloneDeep(COLUMNS);

      newColumns['test_column'].hideInTable = true;

      var table = createTable({ columns: newColumns });

      expect(table.element.find('.th')).to.have.length(3);
      expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'test_timestamp_column');
      expect(table.element.find('.th:eq(1)')).to.have.data('columnId', 'test_floating_timestamp_column');
      expect(table.element.find('.th:eq(2)')).to.have.data('columnId', 'test_location_column');
    });
  });

});

