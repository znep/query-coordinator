(function() {

  'use strict';

  function DatasetMetadataController($scope, $log, AngularRxExtensions, dataset) {

    AngularRxExtensions.install($scope);

    /*************************
    * General metadata stuff *
    *************************/

    $scope.dataset = dataset;
    $scope.bindObservable('datasetTitle', dataset.observe('title').map(function(title) {
      return _.isUndefined(title) ? 'Untitled' : title;
    }));
  };

  angular.
    module('dataCards.controllers').
      controller('DatasetMetadataController', DatasetMetadataController);

})();
