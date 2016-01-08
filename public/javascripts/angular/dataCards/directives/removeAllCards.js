var templateUrl = require('angular_templates/dataCards/removeAllCards.html');
const angular = require('angular');
function removeAllCards($window, WindowState) {
  return {
    restrict: 'E',
    scope: {
      'enabled': '='
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      var destroy$ = $scope.$destroyAsObservable(element);

      var $removeButton = element.find('.remove-all-cards-button');

      $scope.conditionallyShowPanel = function conditionallyShowPanel() {
        if (!$removeButton.hasClass('disabled')) {
          $scope.panelActive = !$scope.panelActive;
        }
      };

      $scope.removeAll = function() {
        $scope.$emit('delete-all-cards');
        $scope.panelActive = false;
      };

      $scope.cancel = function() {
        $scope.panelActive = false;
      };

      // Hide the flannel when pressing escape or clicking outside the
      // tool-panel-main element. Clicking on the button has its own
      // toggling behavior so it is excluded from this logic.
      WindowState.closeDialogEvent$.
        takeUntil(destroy$).
        filter(function(e) {
          if (!$scope.panelActive) { return false; }

          var $target = $(e.target);
          var targetInsideFlannel = $target.closest('.tool-panel-main').length > 0;
          var targetIsButton = $target.is($(element).find('.tool-panel-toggle-btn'));
          return !targetInsideFlannel && !targetIsButton;
        }).
        subscribe(function() {
          $scope.$safeApply(function() {
            $scope.panelActive = false;
          });
        });
    }
  };
}

angular.
  module('dataCards.directives').
  directive('removeAllCards', removeAllCards);
