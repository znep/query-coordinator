describe('ManageLensDialogV2Controller', function() {
  'use strict';

  beforeEach(module('dataCards.controllers'));

  var $rootScope;
  var $scope;

  beforeEach(inject(function($rootScope, $controller) {
    $scope = $rootScope.$new();
    $controller('ManageLensDialogV2Controller', {$scope: $scope});
  }));

  it('should add a components object to the scope', function() {
    expect($scope.components).to.be.an.object;
  });

  it('should add various properties related to newShares to the scope', function() {
    expect($scope.newSharesState).to.be.an.object;
    expect($scope.newSharesState.show).to.equal(false);
    expect($scope.newShares).to.be.an.object;
    expect($scope.saveNewShares).to.be.a('function');
  });

  it('should update the dialogHasChanges variable if at least one component has changes', function() {
    $scope.components = {
      one: { hasChanges: false },
      two: { hasChanges: false }
    };

    $scope.$apply();
    expect($scope.dialogHasChanges).to.equal(false);

    $scope.components.two.hasChanges = true;
    $scope.$apply();
    expect($scope.dialogHasChanges).to.equal(true);
  });
});
