var templateUrl = require('angular_templates/dataCards/manageLensDialog.html');

module.exports = function manageLensDialog(http, FlyoutService, I18n, ServerConfig, $timeout, $q) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope) {

      /**
       * Checks which request failed in order to yield the correct error message.
       */
      function determineErrorType(failureResponse) {
        var path = failureResponse.config.url;
        if (path.pathname) {
          path = path.pathname; // url may be string or object
        }

        var errorType = 'unknown';
        if (/^\/admin\/views/.test(path)) {
          errorType = 'visibility';
        } else if (/^\/api\/views/.test(path)) {
          errorType = 'sharing';
        } else if (/^\/views/.test(path)) {
          errorType = 'ownership';
        }

        return I18n.manageLensDialog.error[errorType];
      }

      /**
       * Calls `save` on all components and waits for all promises to resolve before showing
       * the "saved" success message in the button.
       */
      $scope.save = function() {
        if (!$scope.dialogHasChanges || $scope.dialogHasErrors) {
          return;
        }
        if ($scope.saveStatus === 'saving') {
          return;
        }

        var promises = _.invokeMap($scope.components, 'save');

        $scope.saveStatus = 'saving';
        $scope.manageLensState.saveInProgress = true;

        $q.all(promises).then(function() {
          $scope.saveStatus = 'saved';

          _.invokeMap($scope.components, 'postSave');

          // Now close the dialog after 1.5 seconds
          $timeout(function() {
            $scope.manageLensState.show = false;
            _.invokeMap($scope.components, 'postClose');
          }, 1500);
        })['catch'](function(failureResponse) {
          $scope.saveStatus = 'failed';
          $scope.errorType = determineErrorType(failureResponse);
          _.defer(FlyoutService.refreshFlyout);

          $timeout(function() {
            $scope.saveStatus = null;
            _.defer(FlyoutService.refreshFlyout);
          }, 8000);
        })['finally'](function() {
          $scope.manageLensState.saveInProgress = false;
        });
      };

      FlyoutService.register({
        selector: 'manage-lens-dialog .ownership .icon-warning',
        render: _.constant(I18n.manageLensDialog.ownership.warning)
      });

      FlyoutService.register({
        selector: 'manage-lens-dialog .controls save-button .error',
        render: function() {
          return `<p>${I18n.manageLensDialog.error.preamble}</p><p>${$scope.errorType}</p>`;
        }
      });
    }
  };
};
