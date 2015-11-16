var templateUrl = require('angular_templates/dataCards/distributionChart.html');
const angular = require('angular');
function distributionChart() {
  return {
    restrict: 'E',
    scope: false,
    controller: 'DistributionChartController',
    templateUrl: templateUrl
  };
}

angular.
  module('dataCards.directives').
  directive('distributionChart', distributionChart);
