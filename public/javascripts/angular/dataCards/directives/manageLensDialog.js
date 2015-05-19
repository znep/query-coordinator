(function() {
  'use strict';

  function manageLensDialog(http) {
    return {
      restrict: 'E',
      scope: {
        dialogState: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/manageLensDialog.html',
      link: function($scope, element, attrs) {
        var pageIsPublicObservable = $scope.page.observe('permissions').
            filter(_.isObject).
            map(_.property('isPublic'));

        var datasetIsPublicObservable = $scope.page.observe('dataset.permissions').
            filter(_.isObject).
            map(_.property('isPublic'));

        $scope.$bindObservable(
          'pageVisibility',
          pageIsPublicObservable.map(function(isPublic) { return isPublic ? 'public' : 'private'; })
        );

        $scope.$bindObservable(
          'datasetIsPublic',
          datasetIsPublicObservable
        );

        $scope.$bindObservable('selectDisabled', Rx.Observable.combineLatest(
          pageIsPublicObservable,
          datasetIsPublicObservable,
          function(pageIsPublic, datasetIsPublic) {
            return !pageIsPublic && !datasetIsPublic;
          }
        ));

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

