import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('ManageLensDialogProvenanceController', function() {
  'use strict';

  var $rootScope;
  var $controller;
  var $httpBackend;
  var Mockumentary;
  var testHelpers;

  var $dialogScope;
  var $scope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

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

  function createController(pageOverrides, datasetOverrides) {
    pageOverrides = pageOverrides || {};
    datasetOverrides = datasetOverrides || {};
    $dialogScope = $rootScope.$new();
    $dialogScope.page = Mockumentary.createPage(pageOverrides, datasetOverrides);
    $dialogScope.dataset = Mockumentary.createDataset(datasetOverrides);
    $controller('ManageLensDialogController', { $scope: $dialogScope });
    $scope = $dialogScope.$new();
    $controller('ManageLensDialogProvenanceController', { $scope: $scope });
  }

  it('is not official by default', function(done) {
    createController();
    $scope.$apply();
    _.defer(function() {
      assert.isFalse($scope.isOfficial);
      done();
    });
  });

  it('should not "hasChanges" when the provenance is not changed', function(done) {
    createController();
    _.defer(function() {
      assert.isFalse($scope.components.provenance.hasChanges);
      done();
    });
  });

  it('triggers hasChanges when the provenance is changed', function(done) {
    createController();
    $scope.isOfficial = true;
    $scope.$apply();
    _.defer(function() {
      assert.isTrue($scope.components.provenance.hasChanges);
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
      assert.isFalse($scope.isOfficial);
      assert.isFalse($scope.components.provenance.hasChanges);
      done();
    });
  });

  it('should not have errors before or after a change', function(done) {
    createController();
    assert.isFalse($scope.components.provenance.hasErrors);
    $scope.isOfficial = true;
    $scope.$apply();
    _.defer(function() {
      assert.isFalse($scope.components.provenance.hasErrors);
      done();
    });
  });

  describe('when saving', function() {
    var metadataUrl = '/api/views/page-page.json';

    beforeEach(function() {
      $httpBackend.when('PUT', metadataUrl).respond({});
      sinon.stub(socrata.utils, 'getCookie').returns('CSRF-TOKEN');
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();

      socrata.utils.getCookie.restore();
    });

    it('sends OFFICIAL to Core when isOfficial = true', function(done) {
      createController({ provenance: null });
      $scope.isOfficial = true;
      $scope.$apply();

      _.defer(function() {
        $httpBackend.expectPUT(metadataUrl, { provenance: 'OFFICIAL' });

        $scope.components.provenance.save();
        $httpBackend.flush();
        done();
      });
    });

    it('sends COMMUNITY to Core when isOfficial = false', function(done) {
      createController({ provenance: 'official' });
      $scope.isOfficial = false;
      $scope.$apply();

      _.defer(function() {
        $httpBackend.expectPUT(metadataUrl, { provenance: 'COMMUNITY' });

        $scope.components.provenance.save();
        $httpBackend.flush();
        done();
      });
    });
  });

});
