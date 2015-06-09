(function() {
  'use strict';

  function customizeBar(FlyoutService, ServerConfig, I18n) {
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
        var expandedCardObservable = $scope.$observe('expandedCard');
        var exportingVisualizationObservable = $scope.$observe('exportingVisualization');
        var editModeObservable = $scope.$observe('editMode');

        function renderCustomizeButtonFlyout() {
          var flyoutContent = '';

          if (Boolean($scope.expandedCard)) {

            flyoutContent = '<div class="flyout-title">{0}</div>'.
              format(I18n.customizeBar.collapseCard);

          } else if ($scope.exportingVisualization) {

            flyoutContent = '<div class="flyout-title">{0}</div>'.
              format(I18n.customizeBar.exitVisualizationExport);

          } else if ($scope.editMode) {

            flyoutContent = [
              '<div class="flyout-title">',
                I18n.customizeBar.customizingFlyout,
              '</div>',
              '<div>',
                I18n.customizeBar.customizingFlyoutInstructions,
              '</div>'
            ].join('');

          } else {

            flyoutContent = [
              '<div class="flyout-title">',
                I18n.customizeBar.customizeFlyout,
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
        $scope.$bindObservable('canCustomize', canCustomizeObservable);

        // Flyout
        editModeObservable.subscribe(function() {
          FlyoutService.refreshFlyout();
        });

        FlyoutService.register({
          selector: '.customize-button',
          render: renderCustomizeButtonFlyout,
          destroySignal: $scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('customizeBar', customizeBar);
})();
