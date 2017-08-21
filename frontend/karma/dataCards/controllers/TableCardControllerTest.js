import { expect, assert } from 'chai';
const angular = require('angular');

describe('TableCardController', function() {
  'use strict';

  var COLUMNS = {
    'test_column': {
      'name': 'test column title',
      'description': 'test column description',
      'physicalDatatype': 'number',
      'defaultCardType': 'column',
      'availableCardTypes': ['column', 'search']
    },
    'test_timestamp_column': {
      'name': 'what time is it',
      'physicalDatatype': 'timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline']
    },
    'test_floating_timestamp_column': {
      'name': 'which time is it',
      'physicalDatatype': 'floating_timestamp',
      'defaultCardType': 'timeline',
      'availableCardTypes': ['timeline']
    },
    'test_location_column': {
      'name': 'which place i am in',
      'physicalDatatype': 'point',
      'defaultCardType': 'feature',
      'availableCardTypes': ['feature']
    },
    ':@test_computed_column': {
      'name': 'Community Districts',
      'description': 'Community district reporting 311 request',
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
      'physicalDatatype': 'row_identifier'
    },
    '*': {
      'name': 'Data Table',
      'description': '',
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
  var $controller;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      var mockCardDataService = {
        getRowCount: function(id, whereClause) {
          var returnValue = 42;
          if (_.isEmpty(whereClause)) {
            returnValue = 1337;
          }
          if (/empty/.test(whereClause)) {
            returnValue = 0;
          }
          if (/one/.test(whereClause)) {
            returnValue = 1;
          }

          return $q.when(returnValue);
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
    $controller = $injector.get('$controller');
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
      primaryAmountField: null,
      rowDisplayUnit: 'row'
    });

    var model = new Model();
    model.fieldName = '*';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('customTitle', null);
    model.defineObservableProperty('showDescription', true);
    model.defineObservableProperty('aggregation', {
      'function': options.primaryAggregation,
      fieldName: options.primaryAmountField,
      unit: 'row',
      rowDisplayUnit: 'row'
    });

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
      rowDisplayUnit: options.rowDisplayUnit
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    outerScope.whereClause = options.whereClause;
    outerScope.model = model;
    outerScope.firstColumn = options.firstColumn;
    outerScope.isEmbedded = options.isEmbedded;
    $controller('TableCardController', { $scope: outerScope });

    return {
      pageModel: pageModel,
      model: model,
      $scope: outerScope,
    };
  }

  describe('row counts', function() {
    it('should be correct for filtered and unfiltered tables', function() {
      var table = createTable();

      expect(table.$scope.rowCount).to.equal(1337);
      expect(table.$scope.filteredRowCount).to.equal(1337);

      table.$scope.whereClause = 'invalid where clause';
      table.$scope.$digest();
      expect(table.$scope.rowCount).to.equal(1337);
      expect(table.$scope.filteredRowCount).to.equal(42);
    });
  });

  describe('default sort', function() {

    it('should be correct for count aggregation', function() {
      var table = createTable();

      table.pageModel.set('cards', []);
      expect(table.$scope.defaultSortColumnName).to.equal(null);

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'test_column',
          'cardSize': 2
        })
      ]);
      expect(table.$scope.defaultSortColumnName).to.equal('test_column');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'test_column',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_timestamp_column',
          'cardSize': 2
        })
      ]);
      expect(table.$scope.defaultSortColumnName).to.equal('test_timestamp_column');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'test_column',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_timestamp_column',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_floating_timestamp_column',
          'cardSize': 2
        })
      ]);
      expect(table.$scope.defaultSortColumnName).to.equal('test_timestamp_column');

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'test_column',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_timestamp_column',
          'cardSize': 3
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_floating_timestamp_column',
          'cardSize': 2
        })
      ]);
      expect(table.$scope.defaultSortColumnName).to.equal('test_column');

      // Reset the table so that async operations that use defaultSortColumnName
      // still work properly.
      table.$scope.defaultSortColumnName = null;
      table.$scope.$digest();
    });

    it('should not default to a subcolumn or hideInTable column', function() {
      var columns = _.cloneDeep(COLUMNS);
      columns['test_column'].isSubcolumn = true;
      columns['test_timestamp_column'].hideInTable = true;

      var table = createTable({
        columns: columns
      });

      table.pageModel.set('cards', [
        newCard(table.pageModel, {
          'fieldName': 'test_column',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_timestamp_column',
          'cardSize': 2
        }),
        newCard(table.pageModel, {
          'fieldName': 'test_floating_timestamp_column',
          'cardSize': 3
        })
      ]);

      expect(table.$scope.defaultSortColumnName).to.equal('test_floating_timestamp_column');

      // Reset
      table.$scope.defaultSortColumnName = null;
      table.$scope.$digest();
    });

    it('should be correct for sum aggregation', function() {
      var table = createTable({ primaryAggregation: 'sum', primaryAmountField: 'test_column' });
      expect(table.$scope.defaultSortColumnName).to.equal('test_column');
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
      expect(table.$scope.defaultSortColumnName).to.equal('test_column');
    });
  });

  // There is a weird bridge of responsibility here where the data layer created a 'getRows'
  // function and put it on the scope for the visualization directive to use.  How do you test
  // a complicated function involving lots of data fetching and manipulation?  Originally we
  // were doing that in these skipped tests: look at output of DOM elements.  We can't do this
  // anymore now that this is a controller, and the whole structure of the 'getRows' thing is a
  // complete Bad Idea anyway. It would be nice to transplant this into the regular table card
  // directive tests, but it's impossible to stub a 'getRows' function in many different ways.
  // Testing this is difficult due to the way this code is organized, and upon refactoring of the
  // code these tests should be reorganized accordingly (they're good tests to have!).
  xdescribe('untestable code', function() {
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
      it('should hide columns according to "hideInTable" and "isSystemColumn" properties', function() {
        var newColumns = _.cloneDeep(COLUMNS);

        newColumns['test_column'].hideInTable = true;

        var table = createTable({ columns: newColumns });

        expect(table.element.find('.th')).to.have.length(3);
        expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'test_timestamp_column');
        expect(table.element.find('.th:eq(1)')).to.have.data('columnId', 'test_floating_timestamp_column');
        expect(table.element.find('.th:eq(2)')).to.have.data('columnId', 'test_location_column');
      });

      it('should hide columns according to "subcolumn" property', function() {
        var newColumns = _.cloneDeep(COLUMNS);

        newColumns['test_column'].isSubcolumn = true;

        var table = createTable({ columns: newColumns });

        expect(table.element.find('.th')).to.have.length(3);
        expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'test_timestamp_column');
        expect(table.element.find('.th:eq(1)')).to.have.data('columnId', 'test_floating_timestamp_column');
        expect(table.element.find('.th:eq(2)')).to.have.data('columnId', 'test_location_column');
      });

      it('should correctly show columns with the following "edge case" names', function() {
        var edgeCaseColumns = {
          'a': {
            'name': 'a',
            'physicalDatatype': 'timestamp',
            'defaultCardType': 'timeline',
            'availableCardTypes': ['timeline']
          },
          '_': {
            'name': '_',
            'physicalDatatype': 'timestamp',
            'defaultCardType': 'timeline',
            'availableCardTypes': ['timeline']
          },
          ' b': {
            'name': ' b',
            'physicalDatatype': 'timestamp',
            'defaultCardType': 'timeline',
            'availableCardTypes': ['timeline']
          },
          '1:': {
            'name': '1:',
            'physicalDatatype': 'timestamp',
            'defaultCardType': 'timeline',
            'availableCardTypes': ['timeline']
          },
          '*a': {
            'name': '*a',
            'physicalDatatype': 'timestamp',
            'defaultCardType': 'timeline',
            'availableCardTypes': ['timeline']
          }
        };
        var table = createTable({ columns: edgeCaseColumns });

        expect(table.element.find('.th')).to.have.length(5);
        expect(table.element.find('.th:eq(0)')).to.have.data('columnId', 'a');
        expect(table.element.find('.th:eq(1)')).to.have.data('columnId', '_');
        expect(table.element.find('.th:eq(2)')).to.have.data('columnId', ' b');
        expect(table.element.find('.th:eq(3)')).to.have.data('columnId', '1:');
        expect(table.element.find('.th:eq(4)')).to.have.data('columnId', '*a');
      })
    });
  });

  describe('showCount', function() {
    it('should set "showCount" to false if "isEmbedded" is true', function() {
      var table = createTable({
        isEmbedded: true
      });
      expect(table.$scope.showCount).to.equal(false);
    })
  });

  describe('customTitle', function() {
    it('should set it on the card model', function() {
      var table = createTable();
      expect(table.model.getCurrentValue('customTitle')).
        to.equal('Showing 1,337 <span class="subtitle">out of 1,337</span> rows');
      table.$scope.whereClause = 'invalid where clause';
      table.$scope.$digest();
      expect(table.model.getCurrentValue('customTitle')).
        to.equal('Showing 42 <span class="subtitle">out of 1,337</span> rows');
      table.$scope.whereClause = 'empty';
      table.$scope.$digest();
      expect(table.model.getCurrentValue('customTitle')).
        to.equal('Showing 0 <span class="subtitle">out of 1,337</span> rows');
      table.$scope.whereClause = 'one';
      table.$scope.$digest();
      expect(table.model.getCurrentValue('customTitle')).
        to.equal('Showing 1 <span class="subtitle">out of 1,337</span> rows');
    });

    it('should not allow 1337 haxxorz', function() {
      var table = createTable({
        rowDisplayUnit: '<img src="http://placehold.it/100x100" />'
      });
      expect(table.model.getCurrentValue('customTitle')).
        to.equal('Showing 1,337 <span class="subtitle">out of 1,337</span> &lt;img src=&quot;http://placehold.it/100x100&quot; /&gt;s');
    });

    it('should not update card title if "isEmbedded" is true', function() {
      var table = createTable({
        isEmbedded: true
      });
      expect(table.model.getCurrentValue('customTitle')).to.equal(null);
    });
  });

});
