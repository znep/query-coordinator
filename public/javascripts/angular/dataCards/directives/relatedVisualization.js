var templateUrl = require('angular_templates/dataCards/relatedVisualization.html');
const angular = require('angular');
function relatedVisualization() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      $scope.humanReadableColumnList = $scope.visualization.columns.map(
        $scope.columnNameToReadableNameFn
      ).join(', ');
    }
  };
}

angular.
  module('dataCards.directives').
    directive('relatedVisualization', relatedVisualization);
