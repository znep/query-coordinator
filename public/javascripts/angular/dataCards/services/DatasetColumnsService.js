(function() {
  'use strict';

  function DatasetColumnsService(Dataset) {

    // Returns an observable containing the columns of a page's dataset,
    // sorted in the order they appear in the table.
    // Excludes system columns but retains computed columns.
    function getSortedColumns$(scope) {
      return scope.
        $observe('page').observeOnLatest('dataset.columns').
        map(function(columns) {
          // Filter out system columns.
          return _.pairs(columns).
            map(function(columnPair) {
              return {
                fieldName: columnPair[0],
                columnInfo: columnPair[1]
              };
            }).
            filter(function(columnPair) {

              // We need to ignore 'system' columns, whose fieldNames begin with ':', but
              // retain 'computed' columns, whose fieldNames begin (somewhat inconveniently)
              // with ':@'.
              return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
                columnPair.columnInfo.physicalDatatype !== '*';
            });
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
