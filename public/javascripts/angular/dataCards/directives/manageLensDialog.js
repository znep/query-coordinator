(function() {
  'use strict';

  function manageLensDialog(
    http,
    FlyoutService,
    I18n
  ) {
    return {
      restrict: 'E',
      scope: {
        dialogState: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/manageLensDialog.html',
      link: function($scope) {
        var currentVisibility;

        var pageIsPublic$ = $scope.page.observe('permissions').
            filter(_.isObject).
            map(_.property('isPublic'));

        var datasetIsPublic$ = $scope.page.observe('dataset.permissions').
            filter(_.isObject).
            map(_.property('isPublic'));

        $scope.$bindObservable(
          'pageVisibility',
          pageIsPublic$.map(function(isPublic) { return isPublic ? 'public' : 'private'; })
        );

        $scope.$bindObservable(
          'datasetIsPublic',
          datasetIsPublic$
        );

        $scope.$bindObservable('selectDisabled', Rx.Observable.combineLatest(
          pageIsPublic$,
          datasetIsPublic$,
          function(pageIsPublic, datasetIsPublic) {
            return !pageIsPublic && !datasetIsPublic;
          }
        ));

        currentVisibility = $scope.pageVisibility;
        $scope.$observe('pageVisibility').
          subscribe(function(changedVisibility) {
            $scope.dialogHasChanges = (changedVisibility !== currentVisibility);
          }
        );

        FlyoutService.register({
          selector: 'manage-lens-dialog .save-button.disabled',
          render: _.constant('<div class="flyout-title">{0}</div>'.
            format(I18n.saveButton.flyoutNoChanges))
        });

        /**
         * Save the permissions.
         */
        $scope.save = function() {
          var isPublic = $scope.pageVisibility === 'public';
          var url = '/views/{0}.json?method=setPermission&value={1}'.format(
            $scope.page.id,
            isPublic ? 'public.read' : 'private'
          );

          $scope.saveStatus = 'saving';
          $scope.dialogState.disableCloseDialog = true;
          http.put(url).then(function() {
            $scope.saveStatus = 'saved';

            // Update our data model
            var permissions = $scope.page.getCurrentValue('permissions');
            permissions.isPublic = isPublic;
            $scope.page.set('permissions', permissions);

            // Now close the dialog after 1.5 seconds
            setTimeout(function() {
              $scope.$safeApply(function() {
                $scope.dialogState.show = false;
              });
            }, 1500);
          })['catch'](function() {
            $scope.saveStatus = 'failed';
            setTimeout(function() {
              $scope.$safeApply(function() {
                $scope.saveStatus = null;
              });
            }, 8000);
          })['finally'](function() {
            $scope.dialogState.disableCloseDialog = false;
          });
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('manageLensDialog', manageLensDialog);

})();

