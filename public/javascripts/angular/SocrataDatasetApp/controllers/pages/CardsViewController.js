angular.module('socrataDatasetApp.controllers')
  .controller('CardsViewController',
    function($scope, $location, view) {
      $scope.view = view;
      $scope.view.getFacetsAsync().then(function(facets) {
        $scope.facets = facets;
      });

      //TODO do a real breakdown once UX is finalized.
      $scope.$watchCollection('facets', function(newVals) {
        $scope.primaryFacets = _.compact(_.at(newVals, _.range(0, 3)));
        $scope.secondaryFacets = _.compact(_.at(newVals, _.range(3, 7)));
        $scope.tertiaryFacets = _.rest(newVals, 7);
      });
    });
