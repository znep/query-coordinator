(function() {
  'use strict';

  function customizeBar(AngularRxExtensions, FlyoutService, ServerConfig) {
    return {
      scope: {
        'editMode': '=',
        'hasChanges': '=',
        'expandedCard': '=',
        'exportingVisualization': '=',
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
        var expandedCardObservable = $scope.$observe('expandedCard');
        var exportingVisualizationObservable = $scope.$observe('exportingVisualization');
        var editModeObservable = $scope.$observe('editMode');

        function renderCustomizeButtonFlyout() {
          var flyoutContent = '';

          if (Boolean($scope.expandedCard)) {

            flyoutContent = [
              '<div class="flyout-title">',
                'To enter customization mode: Collapse the big card using ',
                'the arrows in its top right corner',
              '</div>'
            ].join('');

          } else if ($scope.exportingVisualization) {

            flyoutContent = [
              '<div class="flyout-title">',
                'To enter customization mode: Exit "Download Visualization ',
                'as Image" mode by clicking the cancel button in the Info ',
                'Pane',
              '</div>'
            ].join('');

          } else if ($scope.editMode) {

            flyoutContent = [
              '<div class="flyout-title">',
                'You are now customizing this page',
              '</div>',
              '<div>',
                'You can click this button at any time to preview your ',
                'changes, and save them at any time',
              '</div>'
            ].join('');

          } else {

            flyoutContent = [
              '<div class="flyout-title">',
                'Click to customize the layout or display of this page',
              '</div>'
            ].join('');

          }

          return flyoutContent;
        }

        $scope.toggleCustomizeMode = function() {
          if ($scope.canCustomize) {
            $scope.$safeApply(function() {
              $scope.editMode = !$scope.expandedCard && !$scope.editMode;
            });
          }
        };

        $scope.showSaveAsButton = ServerConfig.get('enableDataLensSaveAsButton');

        var canCustomizeObservable = Rx.Observable.combineLatest(
          expandedCardObservable,
          exportingVisualizationObservable,
          function(expandedCard, exportingVisualization) {
            return !expandedCard && !exportingVisualization;
          }
        );
        $scope.bindObservable('canCustomize', canCustomizeObservable);

        // Flyout
        editModeObservable.subscribe(function() {
          FlyoutService.refreshFlyout();
        });

        FlyoutService.register('customize-button', renderCustomizeButtonFlyout, $scope.$destroyAsObservable(element));

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('customizeBar', customizeBar);
})();
