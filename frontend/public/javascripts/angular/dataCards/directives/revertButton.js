var templateUrl = require('angular_templates/dataCards/revertButton.html');

module.exports = function revertButton(FlyoutService, I18n) {
  return {
    restrict: 'E',
    scope: {
      pageHasChanges: '=',
      revertInitiated: '='
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      FlyoutService.register({
        selector: '.customize-bar .revert-btn',
        render: function() {
          var flyoutTitle = $scope.pageHasChanges ?
            I18n.revertButton.flyoutHasChanges :
            I18n.revertButton.flyoutNoChanges;

          return `<div class="flyout-title">${flyoutTitle}</div>`;
        },
        destroySignal: $scope.$destroyAsObservable(element)
      });
    }
  };
};
