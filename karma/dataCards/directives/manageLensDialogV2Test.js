describe('manage-lens dialog v2', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var _$provide;
  var Mockumentary;
  var ServerConfig;
  var $timeout;

  beforeEach(module('/angular_templates/common/intractableList.html'));
  beforeEach(module('/angular_templates/dataCards/manageLensDialogV2.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('dataCards/cards.scss'));
  beforeEach(module('dataCards'));

  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $timeout = $injector.get('$timeout');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');

    testHelpers.mockDirective(_$provide, 'socSelect');
    testHelpers.mockDirective(_$provide, 'saveButton');
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
      '<manage-lens-dialog-v2 ng-controller="ManageLensDialogV2Controller" />',
      $scope
    );
  }

  // These tests became invalid after refactoring this dialog to use controllers,
  // so the tests should be transplanted to something like
  // ManageLensDialogV2VisibilityController.
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
    });

    it('should have three options if the page has no moderation status', function() {
      // handle initialization of ownership component
      $httpBackend.expectGET(/\/api\/users\/current\.json/).respond({ id: 'fdsa-asdf', rights: [] });
      $httpBackend.expectGET(/\/api\/search\/users\.json/).respond({});

      var element = createElement({moderationStatus: null});
      expect(element.find('option')).to.have.length(3);

      $httpBackend.flush();
    });

    it('should have two options if the page has a moderation status', function() {
      // handle initialization of ownership component
      $httpBackend.expectGET(/\/api\/users\/current\.json/).respond({ id: 'fdsa-asdf', rights: [] });
      $httpBackend.expectGET(/\/api\/search\/users\.json/).respond({});

      var element = createElement({moderationStatus: false});
      expect(element.find('option')).to.have.length(2);

      element = createElement({moderationStatus: true});
      expect(element.find('option')).to.have.length(2);

      $httpBackend.flush();
    });
  });
});
