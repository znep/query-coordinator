(function() {
  'use strict';

  function customizeBar(FlyoutService, ServerConfig, I18n) {
    return {
      scope: {
        'cardCount': '=',
        'showProvenanceSection': '=',
        'editMode': '=',
        'hasChanges': '=',
        'isEphemeral': '=',
        'expandedCard': '=',
        'exportingVisualization': '=',
        'revertPage': '=',
        'revertInitiated': '=',
        'savePage': '=',
        'saveStatus': '=',
        'savePageAs': '=',
        'page': '=',
        'discoLens': '='
      },
      restrict: 'E',
      templateUrl: '/angular_templates/dataCards/customizeBar.html',
      link: function($scope, element) {
        var expandedCard$ = $scope.$observe('expandedCard');
        var exportingVisualization$ = $scope.$observe('exportingVisualization');
        var editMode$ = $scope.$observe('editMode');

        if ($scope.isEphemeral) {
          $scope.editMode = true;
        }

        var hasCardsObservable = $scope.$observe('cardCount').map(function(count) {
          return count > 0;
        });
        $scope.$bindObservable('hasCards', hasCardsObservable);

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

        $scope.showSaveAsButton = ServerConfig.get('enableDataLensOtherViews');

        var canCustomize$ = Rx.Observable.combineLatest(
          expandedCard$,
          exportingVisualization$,
          function(expandedCard, exportingVisualization) {
            return !expandedCard && !exportingVisualization;
          }
        );
        $scope.$bindObservable('canCustomize', canCustomize$);

        // Flyout
        editMode$.subscribe(function() {
          FlyoutService.refreshFlyout();
        });

        FlyoutService.register({
          selector: '.customize-button',
          render: renderCustomizeButtonFlyout,
          destroySignal: $scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.is-customizing .remove-all-cards-button',
          render: function() {
            var flyoutTitle = $scope.hasCards ?
              I18n.removeAllCards.flyout :
              I18n.removeAllCards.flyoutNoCards;
            return '<div class="flyout-title">{0}</div>'.format(flyoutTitle);
          },
          destroySignal: $scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('customizeBar', customizeBar);
})();
