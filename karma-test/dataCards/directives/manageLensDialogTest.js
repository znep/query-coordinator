describe('manage-lens dialog', function() {
  'use strict';
  beforeEach(module('/angular_templates/dataCards/manageLensDialog.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards'));

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var _$provide;
  var Page;
  var DatasetDataService;
  var clock;

  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    Page = $injector.get('Page');

    var $q = $injector.get('$q');
    DatasetDataService = $injector.get('DatasetDataService');
    sinon.stub(DatasetDataService, 'getDatasetMetadata').returns($q.defer().promise);

    testHelpers.mockDirective(_$provide, 'socSelect');
    testHelpers.mockDirective(_$provide, 'saveButton');

    clock = sinon.useFakeTimers();
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.cleanUp();
    DatasetDataService.getDatasetMetadata.restore();
  });

  function createElement() {
    var $scope = $rootScope.$new();
    $scope.page = new Page({
      pageId: 'page-eyed',
      datasetId: 'data-eyed',
      permissions: {
        isPublic: true
      }
    });
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
      $httpBackend.expectPUT('/views/page-eyed.json?method=setPermission&value=public.read').
        respond({});

      var element = createElement();
      var $scope = element.children().scope();

      $scope.pageVisibility = 'public';
      $scope.save();

      expect($scope.saveStatus).to.equal('saving');

      $httpBackend.flush();

      expect($scope.saveStatus).to.equal('saved');
      expect($scope.dialogState.show).to.equal(true);

      clock.tick(1501);
      expect($scope.dialogState.show).to.equal(false);
    });

    it('saves private permissions', function() {
      $httpBackend.expectPUT('/views/page-eyed.json?method=setPermission&value=private').
        respond({});

      var element = createElement();
      var $scope = element.children().scope();

      $scope.pageVisibility = 'private';
      $scope.save();

      expect($scope.saveStatus).to.equal('saving');

      $httpBackend.flush();

      expect($scope.saveStatus).to.equal('saved');
      expect($scope.dialogState.show).to.equal(true);

      clock.tick(1501);
      expect($scope.dialogState.show).to.equal(false);
    });
  });
});

