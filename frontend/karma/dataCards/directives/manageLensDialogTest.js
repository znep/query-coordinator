import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('manageLensDialog', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var _$provide;
  var Mockumentary;
  var ServerConfig;
  var $timeout;
  var $q;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/cards.scss');

  beforeEach(angular.mock.module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(function() {
    window.currentUser = {};
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');

    testHelpers.mockDirective(_$provide, 'socSelect');
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'newShareDialog');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.cleanUp();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function createElement(pageMetadata, datasetMetadata) {
    var $scope = $rootScope.$new();

    var pageOverrides = _.extend({pageId: 'asdf-fdsa'}, pageMetadata);
    var datasetOverrides = _.extend({}, datasetMetadata);
    $scope.page = Mockumentary.createPage(pageOverrides, datasetOverrides);
    $scope.dataset = Mockumentary.createDataset(datasetOverrides);
    $scope.manageLensState = {show: true};

    return testHelpers.TestDom.compileAndAppend(
      '<manage-lens-dialog ng-controller="ManageLensDialogController" />',
      $scope
    );
  }

  // These tests became invalid after refactoring this dialog to use controllers,
  // so the tests should be transplanted to something like
  // ManageLensDialogVisibilityController.
  xdescribe('visibility', function() {
    it('should have a disabled dropdown if the dataset is private', function() {
      window.currentUser = {
        rights: [
          'approve_nominations'
        ]
      };

      var element = createElement();
      var $scope = element.children().scope();

      $scope.page.set('dataset', { permissions: { isPublic: false }});
      expect($scope.visibilityDropdownDisabled).to.equal(true);
    });

    it('should have an enabled dropdown if the dataset is public', function() {
      window.currentUser = {
        rights: [
          'approve_nominations'
        ]
      };

      var element = createElement();
      var $scope = element.children().scope();

      $scope.page.set('dataset', { permissions: { isPublic: true }});
      expect($scope.visibilityDropdownDisabled).to.equal(false);
    });

    it('should have a disabled dropdown if the user is unprivileged', function() {
      window.currentUser = {
        rights: []
      };

      var element = createElement();
      var $scope = element.children().scope();

      expect($scope.visibilityDropdownDisabled).to.equal(true);
    });

    it('should have an enabled dropdown if the user is privileged', function() {
      window.currentUser = {
        rights: [
          'approve_nominations'
        ]
      };

      var element = createElement();
      var $scope = element.children().scope();

      expect($scope.visibilityDropdownDisabled).to.equal(false);
    });

    it('does not save moderation status if you click cancel', function() {
      window.currentUser = {
        rights: [
          'approve_nominations'
        ]
      };

      var element = createElement();
      var $scope = element.children().scope();

      var saveSpy = sinon.spy($scope, 'save');

      var cancelButton = element.find('.manage-lens-dialog-cancel');
      cancelButton.click();

      expect(saveSpy.called).to.equal(false);
    });

    it('successfully saves the selected moderation status', function() {
      window.currentUser = {
        rights: [
          'approve_nominations'
        ]
      };

      var element = createElement();
      var $scope = element.children().scope();

      $scope.visibilityDropdownSelection = 'approved';
      $httpBackend.expectPOST('/admin/views/asdf-fdsa/set/yes.json').respond({});
      $scope.save();

      expect($scope.saveStatus).to.equal('saving');

      $httpBackend.flush();

      expect($scope.saveStatus).to.equal('saved');
      expect($scope.dialogState.show).to.equal(true);

      $timeout.flush();

      expect($scope.dialogState.show).to.equal(false);
    });
  });

  describe('when view moderation is enabled', function() {
    beforeEach(function() {
      ServerConfig.override('featureSet', {view_moderation: true});
      ServerConfig.override('allow_data_lens_owner_change', false);
    });

    it('should have three options if the page has no moderation status', function() {
      // handle initialization of ownership component
      // (uncomment these lines if the feature flag for the ownership component is removed)
      // $httpBackend.expectGET(/\/api\/users\/current\.json/).respond({ id: 'fdsa-asdf', rights: [] });
      // $httpBackend.expectGET(/\/api\/search\/users\.json/).respond({});

      var element = createElement({moderationStatus: null});
      expect(element.find('option')).to.have.length(3);

      // $httpBackend.flush();
    });

    it('should have two options if the page has a moderation status', function() {
      // handle initialization of ownership component
      // (uncomment these lines if the feature flag for the ownership component is removed)
      // $httpBackend.expectGET(/\/api\/users\/current\.json/).respond({ id: 'fdsa-asdf', rights: [] });
      // $httpBackend.expectGET(/\/api\/search\/users\.json/).respond({});

      var element = createElement({moderationStatus: false});
      expect(element.find('option')).to.have.length(2);

      element = createElement({moderationStatus: true});
      expect(element.find('option')).to.have.length(2);

      // $httpBackend.flush();
    });
  });

  describe('save error types', function() {
    var element;
    var $scope;

    beforeEach(function() {
      element = createElement();
      $scope = element.scope();
    });

    it('should give a default error', function() {
      var failureResponse = {
        'config': {
          'url': '/random/page'
        }
      };

      var errorMock = function () {
        var deferred = $q.defer();
        deferred.reject(failureResponse);
        return deferred.promise;
      };

      $scope.$apply($scope.components = {
        'provenance': {
          'hasChanges': true,
          'hasErrors': false,
          'save': errorMock
        }
      });

      $scope.save();
      $scope.$digest();

      assert.isTrue($scope.saveStatus === 'failed');
      expect($scope.errorType).to.match(/An unknown error occurred. Please contact Socrata support./);
    });

    it('should give a visibility error', function() {
      var failureResponse = {
        'config': {
          'url': '/admin/views'
        }
      };

      var errorMock = function () {
        var deferred = $q.defer();
        deferred.reject(failureResponse);
        return deferred.promise;
      };

      $scope.$apply($scope.components = {
        'provenance': {
          'hasChanges': true,
          'hasErrors': false,
          'save': errorMock
        }
      });

      $scope.save();
      $scope.$digest();

      assert.isTrue($scope.saveStatus === 'failed');
      expect($scope.errorType).to.match(/Visibility could not be updated./);
    });

    it('should give a sharing error', function() {
      var failureResponse = {
        'config': {
          'url': '/api/views'
        }
      };

      var errorMock = function () {
        var deferred = $q.defer();
        deferred.reject(failureResponse);
        return deferred.promise;
      };

      $scope.$apply($scope.components = {
        'provenance': {
          'hasChanges': true,
          'hasErrors': false,
          'save': errorMock
        }
      });

      $scope.save();
      $scope.$digest();

      assert.isTrue($scope.saveStatus === 'failed');
      expect($scope.errorType).to.match(/Role and sharing settings could not be updated./);
    });

    it('should give an ownership error', function() {
      var failureResponse = {
        'config': {
          'url': '/views'
        }
      };

      var errorMock = function () {
        var deferred = $q.defer();
        deferred.reject(failureResponse);
        return deferred.promise;
      };

      $scope.$apply($scope.components = {
        'provenance': {
          'hasChanges': true,
          'hasErrors': false,
          'save': errorMock
        }
      });

      $scope.save();
      $scope.$digest();

      assert.isTrue($scope.saveStatus === 'failed');
      expect($scope.errorType).to.match(/The owner could not be changed./);
    });
  });

  describe('add and remove button interactions', function() {
    var buttonSelectors;

    beforeEach(function() {
      buttonSelectors = [
        '.controls button.manage-lens-dialog-cancel',
        '.manage-lens-dialog-add-shares',
        '.share-remove-button'
      ];
    });

    it('is enabled when not saving', function() {
      var element = createElement();
      var $scope = element.children().scope();

      $scope.manageLensState.saveInProgress = false;
      $scope.shouldShowSharingSection = true;
      $scope.newShares = {shares: [{}]};

      $scope.$digest();

      buttonSelectors.forEach(function(selector) {
        var button = element.find(selector);
        assert.isFalse(button.prop('disabled'));
      });

      var saveButton = element.find('.controls button.manage-lens-dialog-save');
      assert.isFalse($(saveButton).hasClass('disabled'));
    });

    it('is disabled when saving', function() {
      var element = createElement();
      var $scope = element.children().scope();

      $scope.manageLensState.saveInProgress = true;
      $scope.shouldShowSharingSection = true;
      $scope.newShares = {shares: [{}]};

      $scope.$digest();

      buttonSelectors.forEach(function(selector) {
        var button = element.find(selector);
        assert.isTrue(button.prop('disabled'));
      });

      var saveButton = element.find('.controls button.manage-lens-dialog-save');
      assert.isTrue($(saveButton).hasClass('disabled'));
    });
  });
});
