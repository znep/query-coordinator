angular.module('socrataDatasetApp.controllers')
  .controller('CardsViewController',
    function($scope, $location, View, viewId) {
      $scope.view = new View(viewId);
      $scope.view.getFacetsAsync().then(function(facets) {
        $scope.facets = facets;
      });

      //TODO do a real breakdown once UX is finalized.
      $scope.$watchCollection('facets', function(newVals) {
        $scope.primaryFacets = _.at(newVals, _.range(0, 3));
        $scope.secondaryFacets = _.at(newVals, _.range(3, 7));
        $scope.tertiaryFacets = _.rest(newVals, 7);
      });
    });
