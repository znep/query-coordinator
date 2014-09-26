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
      // Both convert the hash (column name -> column details) to an array of column details,
      // and remove the hack table column.
      return _.reject(columnsHash, _.property('fakeColumnGeneratedByFrontEnd'));
    }));
  };

  angular.
    module('dataCards.controllers').
      controller('DatasetMetadataController', DatasetMetadataController);

})();
