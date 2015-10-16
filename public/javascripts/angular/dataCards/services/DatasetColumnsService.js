(function() {
  'use strict';

  function DatasetColumnsService(Dataset) {

    // Create helper functions that identify columns that should be hidden from the dropdown.
    var isTableColumn = _.flow(_.property('physicalDatatype'), _.partial(_.isEqual, '*'));
    var isSystemColumn = _.property('isSystemColumn');
    var isComputedColumn = _.flow(_.property('computationStrategy'), _.isDefined);
    var isSubColumn = _.property('isSubcolumn');

    // Returns an observable containing the columns of a page's dataset,
    // sorted in the order they appear in the table.
    // Excludes system columns but retains computed columns.
    function getSortedColumns$(scope) {
      return scope.
        $observe('page').observeOnLatest('dataset.columns').
        map(function(columns) {

          // Combine them into a function that returns true if a column should be hidden from the dropdown.
          function shouldHideColumnFromDropdown(column) {
            return isTableColumn(column) || isSystemColumn(column) || isComputedColumn(column) || isSubColumn(column);
          }

          // Given an array of ['fieldName', {columnInfo}] pairs, turn it into an array of
          // {fieldName: 'fieldName', columnInfo: {columnInfo}} objects.
          var assignKeysToColumnPairs = _.partial(_.zipObject, ['fieldName', 'columnInfo']);

          // Filter out unwanted columns, then transform them into an array of objects, each with a
          // fieldName key and a columnInfo key.
          return _.chain(columns).
            omit(shouldHideColumnFromDropdown).
            pairs().
            map(assignKeysToColumnPairs).
            value();
        }).
        map(function(columns) {
          return _.sortBy(columns, 'columnInfo.position');
        });
    }

    function getReadableColumnNameFn$(scope) {
      return scope.$observe('page').observeOnLatest('dataset.columns').map(
        function(datasetColumns) {
          return function(fieldName) {
            var column = datasetColumns[fieldName];
            return Dataset.extractHumanReadableColumnName(column);
          };
        });
    }

    return {
      getSortedColumns$: getSortedColumns$,
      getReadableColumnNameFn$: getReadableColumnNameFn$
    };
  }

  angular.
    module('dataCards.services').
      factory('DatasetColumnsService', DatasetColumnsService);
})();
