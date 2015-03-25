(function() {
  'use strict';

  function manageLensDialog(AngularRxExtensions, $http) {
    return {
      restrict: 'E',
      scope: {
        dialogState: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/manageLensDialog.html',
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);

        $scope.bindObservable(
          'pageVisibility',
          $scope.page.observe('permissions').map(function(permissions) {
            return permissions.isPublic ? 'public' : 'private';
          })
        );

        $scope.bindObservable(
          'datasetIsPublic',
          $scope.page.observe('dataset.permissions').map(_.property('isPublic'))
        );

        $scope.bindObservable('selectDisabled', Rx.Observable.combineLatest(
          $scope.page.observe('permissions').map(_.property('isPublic')),
          $scope.page.observe('dataset.permissions').map(_.property('isPublic')),
          function(pageIsPublic, datasetIsPublic) {
            return !pageIsPublic && !datasetIsPublic;
          }
        ));

        /**
         * Save the permissions.
         */
        $scope.save = function() {
          var permissions = $scope.page.getCurrentValue('permissions');
          permissions.isPublic = $scope.pageVisibility === 'public';
          $scope.page.set('permissions', permissions);

          var url = '/views/{0}.json?method=setPermission&value={1}'.format(
            $scope.page.id,
            permissions.isPublic ? 'public.read' : 'private'
          );

          $scope.saveStatus = 'saving';
          $http.put(url).then(function() {
            $scope.saveStatus = 'saved';
            // Now close the dialog after 1.5 seconds
            setTimeout(function() {
              $scope.safeApply(function() {
                $scope.dialogState.show = false;
              });
            }, 1500);
          })['catch'](function() {
            $scope.saveStatus = 'failed';
            setTimeout(function() {
              $scope.safeApply(function() {
                $scope.saveStatus = null;
              });
            }, 8000);
          });
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('manageLensDialog', manageLensDialog);

})();

