(function() {
  'use strict';

  function ManageLensDialogV2Controller($scope) {

    // Decorate the $scope of the permissions with a components object. Each
    // component should be placed in this object with a save function that
    // returns a promise and a hasChanges$ observable that fires whenever it
    // changes its dirty state.
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
  }

  angular.
    module('dataCards.controllers').
    controller('ManageLensDialogV2Controller', ManageLensDialogV2Controller);

})();
