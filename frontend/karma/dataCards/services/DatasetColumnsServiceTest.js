import { expect, assert } from 'chai';
const angular = require('angular');

describe('DatasetColumnsService', function() {
  'use strict';

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('test'));

  var $rootScope;
  var Mockumentary;
  var DatasetColumnsService;
  var scope;

  var SORTED_COLUMN_NAMES = ['map_of_the_world', 'awesome_bar_chart', 'map_of_atlantis'];

  var COLUMNS = {
    awesome_bar_chart: {
      name: 'Awesome Bar Chart',
      physicalDatatype: 'number',
      availableCardTypes: ['column', 'search'],
      defaultCardType: 'column',
      isSubcolumn: false,
      position: 5
    },
    map_of_the_world: {
      name: 'Map of the World and the Seven Seas',
      physicalDatatype: 'point',
      availableCardTypes: ['feature'],
      defaultCardType: 'feature',
      isSubcolumn: false,
      position: 1
    },
    map_of_atlantis: {
      name: 'Map of Atlantis',
      physicalDatatype: 'point',
      availableCardTypes: ['feature'],
      defaultCardType: 'feature',
      isSubcolumn: false,
      position: 7
    },
    ':system_column': {
      name: 'System Column to Exclude',
      physicalDatatype: 'number',
      availableCardTypes: ['column', 'histogram'],
      defaultCardType: 'column',
      isSubcolumn: false,
      computationStrategy: {
        parameters: {
          region: 'zip',
          geometryLabel: 'Zip Code',
        }
      },
      position: 3
    },
    ':@computed_column': {
      name: 'Computed Column to Keep',
      physicalDatatype: 'number',
      availableCardTypes: ['column', 'histogram'],
      defaultCardType: 'column',
      isSubcolumn: false,
      computationStrategy: {
        parameters: {
          region: 'zip',
          geometryLabel: 'Zip Code',
        }
      },
      position: 2
    },
    '*': {
      name: 'Data Table',
      physicalDatatype: '*',
      availableCardTypes: [],
      defaultCardType: 'table',
      isSubColumn: false,
      position: 4
    }
  };

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    Mockumentary = $injector.get('Mockumentary');
    DatasetColumnsService = $injector.get('DatasetColumnsService');
  }));

  beforeEach(createScope);

  function createScope() {
    var pageOverrides = {};
    var datasetOverrides = {id: 'rook-king', rowDisplayUnit: 'row', columns: COLUMNS};
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    scope = $rootScope.$new();
    scope.page = pageModel;
  }

  describe('getSortedColumns$', function() {
    var sortedColumns$;
    beforeEach(function() {
      sortedColumns$ = DatasetColumnsService.getSortedColumns$(scope);
    });

    it('should return column data in pairs, with "fieldName" and "columnInfo"', function(done) {
      sortedColumns$.subscribe(function(sortedColumns) {
        var firstColumn = sortedColumns[0];
        expect(sortedColumns[0]).to.include.keys('fieldName', 'columnInfo');
        done();
      });
    });

    it('should remove system columns with field names beginning with ":"', function(done) {
      sortedColumns$.subscribe(function(sortedColumns) {
        var sortedFieldNames = sortedColumns.map(function(column) {
            return column.fieldName;
        });
        expect(sortedFieldNames).to.not.include(':system_column');
        done();
      });
    });

    it('should remove the table column', function(done) {
      sortedColumns$.subscribe(function(sortedColumns) {
        var sortedFieldNames = sortedColumns.map(function(column) {
            return column.fieldName;
        });
        expect(sortedFieldNames).to.not.include('*');
        done();
      });
    });

    it('should remove computed columns', function(done) {
      sortedColumns$.subscribe(function(sortedColumns) {
        var sortedFieldNames = sortedColumns.map(function(column) {
          return column.fieldName;
        });
        expect(sortedFieldNames).to.not.include(':@computed_column');
        done();
      });
    });

    it('should sort columns by position in table', function(done) {
      sortedColumns$.subscribe(function(sortedColumns) {
        expect(sortedColumns).to.have.length(3);
        var sortedFieldNames = sortedColumns.map(function(column) {
          return column.fieldName;
        });
        expect(sortedFieldNames[0]).to.equal(SORTED_COLUMN_NAMES[0]);
        expect(sortedFieldNames[1]).to.equal(SORTED_COLUMN_NAMES[1]);
        expect(sortedFieldNames[2]).to.equal(SORTED_COLUMN_NAMES[2]);
        done();
      });
    });
  });

  describe('getReadableColumnNameFn$', function() {
    it('should return a function that will return a given columns name', function(done) {
      var readableColumnNamesFn$ = DatasetColumnsService.getReadableColumnNameFn$(scope);
      readableColumnNamesFn$.subscribe(function(readableColumnNamesFn) {
        var columnName = readableColumnNamesFn('map_of_the_world');
        expect(columnName).to.equal(COLUMNS['map_of_the_world'].name);
        done();
      });
    });
  });
});
