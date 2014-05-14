angular.module('socrataDatasetApp.controllers')
  .controller('CardsViewController',
    function($scope, $location, View, viewId) {
      $scope.sampleData = [1,2,3];
      $scope.view = new View(viewId);
    });
