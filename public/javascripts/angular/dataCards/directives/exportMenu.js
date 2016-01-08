var templateUrl = require('angular_templates/dataCards/exportMenu.html');
const angular = require('angular');
function ExportMenu(WindowState, ServerConfig, FlyoutService, I18n, $sce) {
  return {
    restrict: 'E',
    templateUrl: templateUrl,
    scope: true,
    link: function($scope, element) {
      var destroy$ = $scope.$destroyAsObservable(element);

      // Only show the Polaroid button if the config setting is enabled.
      $scope.showPolaroidButton = ServerConfig.get('enablePngDownloadUi');

      // TODO: figure out why tests are failing if we don't explicitly trust
      // this snippet instead of using ng-bind-html like we do elsewhere.
      // Is it because of a PhantomJS quirk? Is it because of the <u> tag?
      $scope.downloadExplanation = $sce.trustAsHtml(I18n.t('exportMenu.downloadExplanation'));

      // Hide the flannel when pressing escape or clicking outside the
      // tool-panel-main element. Clicking on the button has its own
      // toggling behavior so it is excluded from this logic.
      WindowState.closeDialogEvent$.
        takeUntil(destroy$).
        filter(function(e) {
          if (!$scope.panelActive) { return false; }
          if (e.type === 'keydown') { return true; }

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

      // Enter card selection mode if possible
      $scope.initiateCardSelectionMode = function(type) {

        // Because polaroid needs to load a clean page to work with,
        // we require the page to be saved before using it.
        if (type === 'polaroid' && $scope.hasChanges) {
          return;
        }

        $scope.panelActive = false;
        $scope.allowChooserModeCancel = true;
        $scope.$emit('enter-export-card-visualization-mode', type);
      };

      // Leave card selection mode on clicking cancel, on init, and on signal
      $scope.quitCardSelectionMode = function() {
        $scope.allowChooserModeCancel = false;
        $scope.$emit('exit-export-card-visualization-mode');
      };
      $scope.$on('exit-chooser-mode', function() {
        $scope.allowChooserModeCancel = false;
      });
      $scope.quitCardSelectionMode();

      // Leave card selection mode on escape key
      WindowState.escapeKey$.filter(function() {
        return $scope.allowChooserModeCancel === true;
      }).
        takeUntil($scope.$destroyAsObservable()).
        subscribe(function() {
          $scope.$safeApply($scope.quitCardSelectionMode);
        });

      // Display explanation if Polaroid cannot be used due to dirty state
      FlyoutService.register({
        selector: '.export-to-polaroid-disabled',
        render: _.constant(
          `<div class="flyout-title">${I18n.metadata.visualizationAsImageDisabledFlyout}</div>`
        ),
        destroySignal: destroy$
      });
    }
  };
}

angular.
  module('dataCards.directives').
  directive('exportMenu', ExportMenu);
