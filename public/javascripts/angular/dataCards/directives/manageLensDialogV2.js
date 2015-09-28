/*
(The v1 only allowed modification of public / private.)
This is the v2 manage lens dialog, which allows users to manage the
- visibility (public vs private)
- owner (TODO)
- shared with users (TODO)

It is only enabled for v2 data lenses.

To add a new set of functionality, please follow the visibility example.
Create an object on components with "init" and "save" functions.
Your save function should return a promise.
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
      scope: {
        dialogState: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/manageLensDialogV2.html',
      link: function($scope) {

        var components = {};

        components.visibility = {};

        components.visibility.init = function() {
          var datasetIsPrivate$ = $scope.page.observe('dataset.permissions').
              filter(_.isObject).
              map(_.negate(_.property('isPublic')));

          var userIsPrivileged$ = Rx.Observable.returnValue(
            typeof currentUser !== 'undefined' &&
              typeof currentUser.rights !== 'undefined' &&
              currentUser.rights.indexOf('approve_nominations') >= 0
          );

          $scope.$bindObservable('datasetIsPrivate', datasetIsPrivate$);
          $scope.$bindObservable('userIsPrivileged', userIsPrivileged$);

          // Disable visibility dropdown if dataset is private or user does not have
          // 'approve_nominations' privileges
          $scope.$bindObservable('visibilityDropdownDisabled',
            Rx.Observable.combineLatest(
              datasetIsPrivate$,
              userIsPrivileged$,
              function(datasetIsPrivate, userIsPrivileged) {
                return datasetIsPrivate || !userIsPrivileged;
              }
            )
          );

          var viewModerationEnabled = ServerConfig.getFeatureSet().view_moderation;
          $scope.usingViewModeration = viewModerationEnabled;

          var moderationStatus$ = $scope.page.observe('moderationStatus');

          var pageVisibility$ = moderationStatus$.map(function(moderationStatus) {
            if ($scope.usingViewModeration && !_.isPresent(moderationStatus)) {
              return 'pending';
            }

            return moderationStatus ? 'approved' : 'rejected';
          });

          var initialPageVisibility$ = pageVisibility$.take(1);

          // Set initial value of visibility dropdown selection
          $scope.$bindObservable('initialPageVisibility', initialPageVisibility$);
          $scope.$bindObservable('visibilityDropdownSelection', initialPageVisibility$);

          var visibilityDropdownSelection$ = $scope.$observe('visibilityDropdownSelection');

          // Observe changes to dropdown and compare with initial value
          Rx.Observable.subscribeLatest(visibilityDropdownSelection$, initialPageVisibility$,
            function(currentVisibility, initialVisibility) {
              $scope.dialogHasChanges = (currentVisibility !== initialVisibility);
            }
          );
        };

        components.visibility.save = function() {
          var visibility = $scope.visibilityDropdownSelection === 'approved' ? 'yes' : 'no';

          var url = '/admin/views/{0}/set/{1}.json'.format(
            $scope.page.id,
            visibility
          );

          return http.post(url).then(function() {
            $scope.page.set('moderationStatus', $scope.visibilityDropdownSelection === 'approved');
          });
        };

        // Initialize the components
        _.invoke(components, 'init');

        /**
         * Calls `save` on all components and waits for all promises to resolve before showing
         * the "saved" success message in the button.
         */
        $scope.save = function() {
          var promises = _.invoke(components, 'save');

          $scope.saveStatus = 'saving';
          $scope.dialogState.disableCloseDialog = true;

          $q.all(promises).then(function() {
            $scope.saveStatus = 'saved';

            // Now close the dialog after 1.5 seconds
            $timeout(function() {
              $scope.dialogState.show = false;
            }, 1500);
          })['catch'](function() {
            $scope.saveStatus = 'failed';
            $timeout(function() {
              $scope.saveStatus = null;
            }, 8000);
          })['finally'](function() {
            $scope.dialogState.disableCloseDialog = false;
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

