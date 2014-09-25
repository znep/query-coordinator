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
  };

  angular.
    module('dataCards.controllers').
      controller('DatasetMetadataController', DatasetMetadataController);

})();
