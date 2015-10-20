describe('manage-lens dialog', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var _$provide;
  var Mockumentary;
  var ServerConfig;
  var clock;

  beforeEach(module('/angular_templates/dataCards/manageLensDialog.html'));
  beforeEach(module('dataCards/cards.scss'));
  beforeEach(module('dataCards'));

  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');

    testHelpers.mockDirective(_$provide, 'socSelect');
    testHelpers.mockDirective(_$provide, 'saveButton');

    clock = sinon.useFakeTimers();
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.cleanUp();
  });

  function createElement() {
    var $scope = $rootScope.$new();

    var pageOverrides = {pageId: 'asdf-fdsa'};
    var datasetOverrides = {};
    $scope.page = Mockumentary.createPage(pageOverrides, datasetOverrides);
    $scope.dialogState = {show: true};
    return testHelpers.TestDom.compileAndAppend(
      '<manage-lens-dialog page="page" dialog-state="dialogState" />',
      $scope
    );
  }

  describe('save', function() {
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('saves public permissions', function() {
      var getCookieStub = sinon.stub();

      getCookieStub.returns('CSRF-TOKEN');
      socrata.utils.getCookie = getCookieStub;

      $httpBackend.expectPUT('/views/asdf-fdsa.json?method=setPermission&value=public.read').
        respond({});

      var element = createElement();
      var $scope = element.children().scope();
      $scope.page.set('permissions', {isPublic: false});

      $scope.pageVisibility = 'public';
      $scope.save();

      expect($scope.saveStatus).to.equal('saving');
      expect($scope.page.getCurrentValue('permissions').isPublic).to.equal(false);

      $httpBackend.flush();

      expect($scope.saveStatus).to.equal('saved');
      expect($scope.page.getCurrentValue('permissions').isPublic).to.equal(true);
      expect($scope.dialogState.show).to.equal(true);

      clock.tick(1501);
      expect($scope.dialogState.show).to.equal(false);
    });

    it('saves private permissions', function() {
      $httpBackend.expectPUT('/views/asdf-fdsa.json?method=setPermission&value=private').
        respond({});

      var element = createElement();
      var $scope = element.children().scope();

      $scope.pageVisibility = 'private';
      $scope.save();

      expect($scope.saveStatus).to.equal('saving');
      expect($scope.page.getCurrentValue('permissions').isPublic).to.equal(true);

      $httpBackend.flush();

      expect($scope.saveStatus).to.equal('saved');
      expect($scope.page.getCurrentValue('permissions').isPublic).to.equal(false);
      expect($scope.dialogState.show).to.equal(true);

      clock.tick(1501);
      expect($scope.dialogState.show).to.equal(false);
    });

    it('should disable the on click handler if no changes are on the manage lens dialog', function() {

      var element = createElement();
      var $scope = element.children().scope();
      testHelpers.fireMouseEvent(element.find('save-button')[0], 'click');

      // '$scope.saveStatus' should not equal to 'saving'
      expect($scope.saveStatus).to.be.undefined;
    });
  });
});

