(function() {
  'use strict';

  function distributionChart() {
    return {
      restrict: 'E',
      scope: false,
      controller: 'DistributionChartController',
      templateUrl: '/angular_templates/dataCards/distributionChart.html'
    };
  }

  angular.
    module('dataCards.directives').
    directive('distributionChart', distributionChart);
})();
