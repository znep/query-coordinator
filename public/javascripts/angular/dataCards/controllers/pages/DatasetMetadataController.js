(function() {

  'use strict';

  function DatasetMetadataController($scope, $log, AngularRxExtensions, UserSessionService, dataset) {

    AngularRxExtensions.install($scope);

    // Bind the current user to the scope, or null if no user is logged in or there was an error
    // fetching the current user.
    $scope.bindObservable('currentUser', UserSessionService.getCurrentUserObservable());

    /*************************
    * General metadata stuff *
    *************************/

    $scope.dataset = dataset;
    $scope.bindObservable('datasetName', dataset.observe('name').map(function(name) {
      return _.isUndefined(name) ? 'Untitled' : name;
    }));
    $scope.bindObservable('datasetDescription', dataset.observe('description'));
    $scope.bindObservable('datasetPublisherPages', dataset.observe('pages').pluck('publisher'));
    $scope.bindObservable('datasetColumns', dataset.observe('columns').map(function(columnsHash) {
      // Convert the hash (column name -> column details) to an array of column details,
      // and remove system and the hack table column.
      return _.reject(columnsHash, function(column) {
        return column.fakeColumnGeneratedByFrontEnd || column.isSystemColumn;
      });
    }));
  }

  angular.
    module('dataCards.controllers').
      controller('DatasetMetadataController', DatasetMetadataController);

})();
