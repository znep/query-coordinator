angular.module('dataCards.controllers')
  .controller('FacetsViewController',
    function($scope, $location, view, focusedFacet) {
      $scope.view = view;
      $scope.focusedFacet = focusedFacet;
      $scope.view.getFacetsAsync().then(function(facets) {
        $scope.facets = facets;
      });
    });
