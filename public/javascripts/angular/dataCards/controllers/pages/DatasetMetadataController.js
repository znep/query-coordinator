(function() {

  'use strict';

  function DatasetMetadataController($scope, $log, AngularRxExtensions, dataset) {

    AngularRxExtensions.install($scope);

    /*************************
    * General metadata stuff *
    *************************/

    $scope.dataset = dataset;
    $scope.bindObservable('datasetName', dataset.observe('name').map(function(name) {
      return _.isUndefined(name) ? 'Untitled' : name;
    }));
    $scope.bindObservable('datasetDescription', dataset.observe('description'));
    $scope.bindObservable('datasetColumns', dataset.observe('columns').map(function(columnsHash) {
      // Convert the hash (column name -> column details) to an array of column details,
      // and remove system and the hack table column.
      return _.reject(columnsHash, function(column) {
        return column.fakeColumnGeneratedByFrontEnd || column.isSystemColumn;
      });
    }));
  };

  angular.
    module('dataCards.controllers').
      controller('DatasetMetadataController', DatasetMetadataController);

})();
