(function() {
  'use strict';

  function VisualizationAddController($scope, $rootScope, $log, dataset, WindowState, Page) {

    /*************************
    * General metadata stuff *
    *************************/
    var pageBlob = {
      "cards": [],
      "datasetId": dataset.id
    };

    $scope.page = new Page(pageBlob, dataset);
    $scope.dataset = dataset;
    $scope.$bindObservable('windowSize', WindowState.windowSizeSubject);

    /************************
    * Add new card behavior *
    ************************/

    var datasetColumnsObservable = dataset.observe('columns');

    var datasetColumns = Rx.Observable.combineLatest(
      datasetColumnsObservable,
      function(columns) {

      var sortedColumns = _.pairs(columns).
        map(function(columnPair) {
          return {
            fieldName: columnPair[0],
            columnInfo: columnPair[1]
          };
        }).
        filter(function(columnPair) {

          // We need to ignore 'system' fieldNames that begin with ':' but
          // retain computed column fieldNames, which (somewhat inconveniently)
          // begin with ':@'.
          return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
                 columnPair.columnInfo.physicalDatatype !== '*';
        }).
        sort(function(a, b) {
          // TODO: Don't we want to sort by column human name?
          return a.fieldName > b.fieldName;
        });


        var available = false;
        var availableCardCount = sortedColumns.length;
        var availableColumns = [];
        var visualizationUnsupportedColumns = [];

        _.forEach(sortedColumns, function(column) {

          if (column.defaultCardType === 'invalid') {
            visualizationUnsupportedColumns.push(column.fieldName);

          // CORE-4645: Do not allow subColumns to be available as cards to add
          } else if (!column.columnInfo.isSubcolumn) {
            availableColumns.push(column.fieldName);
          }
        });

        return {
          available: availableColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };

      });

      $scope.$bindObservable('datasetColumns', datasetColumns);

  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
