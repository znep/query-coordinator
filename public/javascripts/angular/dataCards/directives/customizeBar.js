(function() {
  'use strict';

  /**
   * <customize-bar> directive
   */
  function customizeBar(AngularRxExtensions, FlyoutService) {
    return {
      scope: {
        'editMode': '=',
        'hasChanges': '=',
        'expandedCard': '=',
        'revertPage': '=',
        'revertInitiated': '=',
        'savePage': '=',
        'saveStatus': '=',
        'savePageAs': '='
      },
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/customizeBar.html',
      link: function($scope, element) {
        AngularRxExtensions.install($scope);

        $scope.toggleCustomizeMode = function() {
          $scope.safeApply(function() {
            $scope.editMode = !$scope.expandedCard && !$scope.editMode;
          });
        };

        // Flyout
        $scope.observe('editMode').subscribe(function() {
          FlyoutService.refreshFlyout();
        });

        FlyoutService.register('customize-button', function() {
          if ($scope.editMode) {
            return [
              '<div class="flyout-title">You are now customizing this view.</div>',
              '<div>You can click this button at any time to preview your changes, and save them at any time.</div>'
            ].join('');
          }
          else {
            return '<div class="flyout-title">Click to customize the layout or display of this view.</div>';
          }
        }, $scope.observeDestroy(element));

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('customizeBar', customizeBar);

})();
