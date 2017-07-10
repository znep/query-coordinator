const templateUrl = require('angular_templates/dataCards/axisRescalingToggle.html');
const _ = require('lodash');

module.exports = function axisRescalingToggle() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {
      var page = $scope.page;
      var mode = page.getCurrentValue('enableAxisRescaling');

      $scope.isHidden = mode === 'hidden';
      $scope.enableAxisRescaling = mode === true;

      if (mode !== 'hidden') {
        $scope.$observe('enableAxisRescaling').
          skip(1).
          subscribe(_.bind(page.set, page, 'enableAxisRescaling'));
      }
    }
  };
};
