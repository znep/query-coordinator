angular.module('socrataDatasetApp.controllers')
  .controller('CardViewController',
    function($scope, $location, Dataset, viewId) {
      $scope.sampleData = [1,2,3];
      $scope.dataset = new Dataset(viewId);
    });
