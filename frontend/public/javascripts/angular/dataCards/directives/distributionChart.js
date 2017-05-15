var templateUrl = require('angular_templates/dataCards/distributionChart.html');

module.exports = function distributionChart() {
  return {
    restrict: 'E',
    scope: false,
    controller: 'DistributionChartController',
    templateUrl: templateUrl
  };
};
