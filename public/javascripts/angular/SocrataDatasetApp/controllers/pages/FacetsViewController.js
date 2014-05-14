angular.module('socrataDatasetApp.controllers')
  .controller('FacetsViewController',
    function($scope, $location, View, viewId, focusedFacet) {
      $scope.view = new View(viewId);
      $scope.focusedFacet = focusedFacet;
    });
