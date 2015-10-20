describe('ManageLensDialogV2ProvenanceController', function() {
  'use strict';

  var $rootScope;
  var $controller;
  var $httpBackend;
  var Mockumentary;
  var testHelpers;

  var $dialogScope;
  var $scope;

  var metadataUrl = /^\/views\/page-page/;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $httpBackend = $injector.get('$httpBackend');
    Mockumentary = $injector.get('Mockumentary');
    testHelpers = $injector.get('testHelpers');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    $httpBackend.when('PUT', metadataUrl).respond({});
  });

  function createController() {
    var datasetOverrides = {};
    $dialogScope = $rootScope.$new();
    $dialogScope.page = Mockumentary.createPage();
    $dialogScope.dataset = Mockumentary.createDataset(datasetOverrides);
    $controller('ManageLensDialogV2Controller', { $scope: $dialogScope });
    $scope = $dialogScope.$new();
    $controller('ManageLensDialogV2ProvenanceController', { $scope: $scope });
  }

  it('is not official by default', function(done) {
    createController();
    $scope.$apply();
    _.defer(function() {
      expect($scope.isOfficial).to.be.false;
      done();
    });
  });

  it('should not "hasChanges" when the provenance is not changed', function(done) {
    createController();
    _.defer(function() {
      expect($scope.components.provenance.hasChanges).to.be.false;
      done();
    });
  });

  it('triggers hasChanges when the provenance is changed', function(done) {
    createController();
    $scope.isOfficial = true;
    $scope.$apply();
    _.defer(function() {
      expect($scope.components.provenance.hasChanges).to.be.true;
      done();
    });
  });

  it('should not have changes if $scope.page.provenance is already set and we return to the initial value', function(done) {
    createController();
    $scope.page.set('provenance', null);
    $scope.isOfficial = true;
    $scope.$apply();
    $scope.isOfficial = false;
    $scope.$apply();
    _.defer(function() {
      expect($scope.isOfficial).to.be.false;
      expect($scope.components.provenance.hasChanges).to.be.false;
      done();
    });
  });

  it('should not have errors before or after a change', function(done) {
    createController();
    expect($scope.components.provenance.hasErrors).to.be.false;
    $scope.isOfficial = true;
    $scope.$apply();
    _.defer(function() {
      expect($scope.components.provenance.hasErrors).to.be.false;
      done();
    });
  });

});
