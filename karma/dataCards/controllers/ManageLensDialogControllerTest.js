describe('ManageLensDialogController', function() {
  'use strict';

  beforeEach(module('dataCards'));

  var $scope;
  var $controller;
  var $window;

  beforeEach(inject(function(_$controller_, _$window_, $rootScope, ServerConfig, Mockumentary) {
    // TODO: remove override when owner change is fully enabled and flag is removed
    ServerConfig.override('allowDataLensOwnerChange', true);

    $controller = _$controller_;
    $window = _$window_;

    $scope = $rootScope.$new();
    $scope.page = Mockumentary.createPage();
  }));

  function createController() {
    $controller('ManageLensDialogController', {$scope: $scope});
  }

  it('should set shouldShowOwnershipSection to false if the user does not have chown_datasets right', function() {
    $window.currentUser = {};
    createController();

    $scope.$digest();
    expect($scope.shouldShowOwnershipSection).to.equal(false);
  });

  it('should set shouldShowOwnershipSection to true if the user has chown_datasets right', function() {
    $window.currentUser = { rights: ['chown_datasets'] };
    createController();

    $scope.$digest();
    expect($scope.shouldShowOwnershipSection).to.equal(true);
  });

  it('should set shouldShowSharingSection to false if the user does not have grants right', function() {
    createController();

    $scope.page.set('rights', []);
    $scope.$digest();
    expect($scope.shouldShowSharingSection).to.equal(false);
  });

  it('should set shouldShowSharingSection to true if the user has grants right', function() {
    createController();

    $scope.page.set('rights', ['grant']);
    $scope.$digest();
    expect($scope.shouldShowSharingSection).to.equal(true);
  });

  it('should add a components object to the scope', function() {
    createController();

    expect($scope.components).to.be.an.object;
  });

  it('should add various properties related to newShares to the scope', function() {
    createController();

    expect($scope.newSharesState).to.be.an.object;
    expect($scope.newSharesState.show).to.equal(false);
    expect($scope.newShares).to.be.an.object;
    expect($scope.saveNewShares).to.be.a('function');
  });

  it('should update the dialogHasChanges variable if at least one component has changes', function() {
    createController();

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
