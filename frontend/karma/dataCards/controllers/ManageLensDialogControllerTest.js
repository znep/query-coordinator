import { expect, assert } from 'chai';
const angular = require('angular');

describe('ManageLensDialogController', function() {
  'use strict';

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  var $scope;
  var $controller;
  var $window;
  var ViewRights;

  beforeEach(inject(function(_$controller_, _$window_, _ViewRights_, $rootScope, ServerConfig, Mockumentary) {
    // TODO: remove override when owner change is fully enabled and flag is removed
    ServerConfig.override('allow_data_lens_owner_change', true);

    $controller = _$controller_;
    $window = _$window_;
    ViewRights = _ViewRights_;

    $scope = $rootScope.$new();
    $scope.page = Mockumentary.createPage();
    $controller('ManageLensDialogController', {$scope: $scope});
  }));

  it('should set shouldShowSharingSection to false if the user does not have grants right', function() {
    $scope.page.set('rights', []);
    $scope.$digest();
    expect($scope.shouldShowSharingSection).to.equal(false);
  });

  it('should set shouldShowSharingSection to true if the user has grants right', function() {
    $scope.page.set('rights', [ViewRights.GRANT]);
    $scope.$digest();
    expect($scope.shouldShowSharingSection).to.equal(true);
  });

  it('should add a components object to the scope', function() {
    assert.isObject($scope.components);
  });

  it('should add various properties related to newShares to the scope', function() {
    assert.isObject($scope.newSharesState);
    expect($scope.newSharesState.show).to.equal(false);
    assert.isObject($scope.newShares);
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
