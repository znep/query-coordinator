/*
(The v1 only allowed modification of public / private.)
This is the v2 manage lens dialog, which allows users to manage the
- visibility (public vs private)
- shared with users
- owner (TODO)

It is only enabled for v2 data lenses.
*/

(function() {
  'use strict';

  function manageLensDialogV2(
    http,
    FlyoutService,
    I18n,
    ServerConfig,
    $timeout,
    $q
  ) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/angular_templates/dataCards/manageLensDialogV2.html',
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

          var promises = _.invoke($scope.components, 'save');

          $scope.saveStatus = 'saving';
          $scope.manageLensState.disableCloseDialog = true;

          $q.all(promises).then(function() {
            $scope.saveStatus = 'saved';

            _.invoke($scope.components, 'postSave');

            // Now close the dialog after 1.5 seconds
            $timeout(function() {
              $scope.manageLensState.show = false;
              _.invoke($scope.components, 'postClose');
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
            $scope.manageLensState.disableCloseDialog = false;
          });
        };

        FlyoutService.register({
          selector: 'manage-lens-dialog .save-button.disabled',
          render: _.constant('<div class="flyout-title">{0}</div>'.
            format(I18n.saveButton.flyoutNoChanges))
        });

        FlyoutService.register({
          selector: 'manage-lens-dialog-v2 .ownership .icon-warning',
          render: _.constant(I18n.manageLensDialog.ownership.warning)
        });

        FlyoutService.register({
          selector: 'manage-lens-dialog-v2 .controls save-button .error',
          render: function() {
            return '<p>{0}</p><p>{1}</p>'.format(
              I18n.manageLensDialog.error.preamble,
              $scope.errorType
            );
          }
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('manageLensDialogV2', manageLensDialogV2);

})();
