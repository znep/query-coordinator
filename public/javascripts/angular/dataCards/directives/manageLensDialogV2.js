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
         * Calls `save` on all components and waits for all promises to resolve before showing
         * the "saved" success message in the button.
         */
        $scope.save = function() {
          var promises = _.invoke($scope.components, 'save');

          $scope.saveStatus = 'saving';
          $scope.manageLensState.disableCloseDialog = true;

          $q.all(promises).then(function() {
            $scope.saveStatus = 'saved';

            _.invoke($scope.components, 'postSave');

            // Now close the dialog after 1.5 seconds
            $timeout(function() {
              $scope.manageLensState.show = false;
            }, 1500);
          })['catch'](function() {
            $scope.saveStatus = 'failed';
            $timeout(function() {
              $scope.saveStatus = null;
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
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('manageLensDialogV2', manageLensDialogV2);

})();
