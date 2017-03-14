const templateUrl = require('angular_templates/dataCards/axisRescalingToggle.html');
const _ = require('lodash');

module.exports = function axisRescalingToggle() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      var page = $scope.page;

      $scope.enableAxisRescaling = page.getCurrentValue('enableAxisRescaling');
      $scope.isHidden = !_.isBoolean($scope.enableAxisRescaling); // ng-hide is too simple for this
      $scope.$observe('enableAxisRescaling').
        skip(1).
        subscribe(_.bind(page.set, page, 'enableAxisRescaling'));
    }
  };
};
