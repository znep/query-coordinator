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

        $scope.bindObservable('pagePermissions', $scope.page.observe('permissions'));

        /**
         * Save the model by updating the model passed in, with our cloned copy.
         */
        $scope.save = function() {
          $scope.page.set('permissions', $scope.pagePermissions);

          var url;
          switch ($scope.pagePermissions) {
            case 'public':
              url = '/views/{0}.json?method=setPermission&value=public.read';
              break;
            case 'private':
              url = '/views/{0}.json?method=setPermission&value=private';
              break;
          }

          if (url) {
            $scope.saveStatus = 'saving';
            $http.put(url.format($scope.page.id)).then(function() {
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
          }
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('manageLensDialog', manageLensDialog);

})();

