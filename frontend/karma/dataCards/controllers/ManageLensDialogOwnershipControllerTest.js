import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');
const Rx = require('rx');

describe('ManageLensDialogOwnershipController', function() {
  'use strict';

  var $rootScope;
  var $controller;
  var $httpBackend;
  var Mockumentary;
  var testHelpers;
  var testScheduler;
  var timeoutScheduler;
  var UserSearchService;
  var UserSearchServiceStub;
  var UserSessionService;

  var $dialogScope;
  var $scope;

  var currentUserStub;

  var changeOwnerUrl = /^\/views\/page-page/;

  var USERS = [
    {
      id: 'fake-user',
      displayName: 'Faker McGee',
      email: 'faker@example.com'
    },
    {
      id: 'test-1111',
      displayName: 'Test 1',
      email: 'test1@example.com'
    },
    {
      id: 'test-2222',
      displayName: 'Test 2',
      email: 'test2@example.com'
    }
  ];

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $httpBackend = $injector.get('$httpBackend');
    Mockumentary = $injector.get('Mockumentary');
    testHelpers = $injector.get('testHelpers');
    UserSearchService = $injector.get('UserSearchService');
    UserSessionService = $injector.get('UserSessionService');

    timeoutScheduler = Rx.Scheduler.timeout;
    testScheduler = new Rx.TestScheduler();
    Rx.Scheduler.timeout = testScheduler;
  }));

  afterEach(function() {
    Rx.Scheduler.timeout = timeoutScheduler;
    testHelpers.TestDom.clear();
    currentUserStub.restore();
  });

  beforeEach(function() {
    $httpBackend.when('PUT', changeOwnerUrl).respond({});

    testHelpers.TestDom.append('<input class="ownership-input">');

    currentUserStub = sinon.stub(UserSessionService, 'hasRight$').callsFake(_.constant(
      Rx.Observable.of(true)
    ));

    sinon.stub(UserSearchService, 'results$').withArgs('Te').returns(
      Promise.resolve([ USERS[1], USERS[2] ])
    );

  });

  function createController() {
    var pageOverrides = {
      ownerId: 'fake-user',
      ownerDisplayName: 'Orange Dino'
    };
    $dialogScope = $rootScope.$new();
    $dialogScope.page = Mockumentary.createPage(pageOverrides);
    $dialogScope.dataset = Mockumentary.createDataset();
    $controller('ManageLensDialogController', { $scope: $dialogScope });
    $scope = $dialogScope.$new();
    $controller('ManageLensDialogOwnershipController', { $scope: $scope });
  }

  function setText(value) {
    $scope.$apply(function() {
      $scope.ownerInput = value;
    });
    testScheduler.advanceTo(300);
  }

  it('disables the control if the user lacks the chown_datasets right', function(done) {
    currentUserStub.restore();
    currentUserStub = sinon.stub(UserSessionService, 'hasRight$').callsFake(_.constant(
      Rx.Observable.of(false)
    ));

    createController();
    $scope.$apply();
    _.defer(function() {
      assert.isFalse($scope.hasPermission);
      done();
    })
  });

  it('enables the control and prepopulates the input with the current owner', function(done) {
    createController();
    $scope.$apply();
    _.defer(function() {
      assert.isTrue($scope.hasPermission);
      expect($scope.ownerInput).to.equal('Orange Dino');
      done();
    });
  });

  it('fetches and displays suggestions when the user types', function(done) {
    createController();
    setText('Te');
    $scope.$apply();
    _.defer(function() {
      expect($scope.suggestions).to.have.length(2);
      done();
    });
  });

  // TODO: identify why userMadeSelection$ is generating a new event in the stream
  // but things are falling apart on withLatestFrom(suggestionsRequests$)
  xit('allows an owner to be selected', function(done) {
    createController();
    setText('Te');
    $scope.$apply();

    var listItemText = '{0} ({1})'.format(USERS[2].displayName, USERS[2].email);
    $scope.$emit('intractableList:selectedItem', listItemText, 1);

    _.defer(function() {
      assert.isFalse($scope.showWarning);
      expect($scope.ownerInput).to.equal(USERS[2].displayName);
      assert.isFalse($scope.components.ownership.hasErrors);
      assert.isTrue($scope.components.ownership.hasChanges);
      done();
    });
  });

  xit('shows a warning if an invalid owner is selected', function() {

  });

  xit('sets its dirty state to true if the selected owner is not the current owner', function() {

  });

  xit('sets its error state to true if an invalid owner is selected', function() {

  });

  xit('invokes the plagiarize method on save', function() {

  });

  xit('updates the owner ID on the dataset after saving', function() {

  });
});
