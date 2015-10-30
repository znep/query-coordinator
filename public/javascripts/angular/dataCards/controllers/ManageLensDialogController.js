(function() {
  'use strict';

  function ManageLensDialogController($scope, ServerConfig) {

    // Show sharing section for users who have 'grant' right
    $scope.$bindObservable('shouldShowSharingSection',
      $scope.page.observe('rights').map(function(rights) {
        return _.includes(rights, 'grant');
      })
    );

    // Show ownership section if the feature flag is enabled
    $scope.shouldShowOwnershipSection = ServerConfig.get('allowDataLensOwnerChange');

    // Decorate the $scope of the permissions with a components object. Each
    // component should be placed in this object with a save function that
    // returns a promise and a hasChanges boolean that reflects its dirty state.
    $scope.components = {};

    $scope.newSharesState = {
      show: false
    };

    $scope.newShares = {
      message: '',
      shares: []
    };

    $scope.saveNewShares = function(newShares) {
      $scope.newShares = newShares;
    };

    $scope.$watch(function() {
      return _.some(_.pluck($scope.components, 'hasChanges'));
    }, function(hasChanges) {
      $scope.dialogHasChanges = hasChanges;
    });

    $scope.$watch(function() {
      return _.some(_.pluck($scope.components, 'hasErrors'));
    }, function(hasErrors) {
      $scope.dialogHasErrors = hasErrors;
    });
  }

  angular.
    module('dataCards.controllers').
    controller('ManageLensDialogController', ManageLensDialogController);

})();
