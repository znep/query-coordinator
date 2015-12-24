describe('newShareDialog', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var $provide;
  var $scope;
  var $window;

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('dataCards/cards.scss'));

  beforeEach(angular.mock.module(function(_$provide_) {
    $provide = _$provide_;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $window = $injector.get('$window');

    testHelpers.mockDirective($provide, 'socSelect');
    testHelpers.mockDirective($provide, 'saveButton');
    testHelpers.mockDirective($provide, 'modalDialog');
    testHelpers.mockDirective($provide, 'manageLensDialog');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.cleanUp();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function createElement(pageMetadata, datasetMetadata) {
    $scope = $rootScope.$new();
    $scope.$parent.newShares = [];
    $scope.dialogState = {show: true};
    $scope.saveNewShares = function(newShares) {
      $scope.newShares = newShares;
    };

    var pageOverrides = _.extend({pageId: 'asdf-fdsa'}, pageMetadata);
    var datasetOverrides = _.extend({}, datasetMetadata);

    return testHelpers.TestDom.compileAndAppend(
      '<new-share-dialog dialog-state="dialogState" save-new-shares="saveNewShares" />',
      $scope
    );
  }

  describe('new share fields', function() {
    it('should have all necessary inputs, dropdowns, and buttons', function() {
      var element = createElement();
      expect(element.find('input.email').length).to.equal(1);
      expect(element.find('soc-select option').length).to.equal(3);
      expect(element.find('button.remove-button').length).to.equal(1);
      expect(element.find('button.add-more-button').length).to.equal(1);
      expect(element.find('textarea.optional-message').length).to.equal(1);
      expect(element.find('button.done-button').length).to.equal(1);
    });
  });

  describe('adding and removing shares', function() {
    it('should be able to add more shares', function() {
      var element = createElement();
      expect(element.find('.new-share').length).to.equal(1);
      element.find('button.add-more-button').click();
      expect(element.find('.new-share').length).to.equal(2);
    });

    it('should be able to remove a share', function() {
      var element = createElement();
      var $scope = element.children().scope();
      element.find('button.add-more-button').click();
      expect(element.find('.new-share').length).to.equal(2);
      element.find('button.remove-button').click();
      expect(element.find('.new-share').length).to.equal(1);
    });
  });

  describe('remove button', function() {

    it('cannot have less than one share', function() {
      var element = createElement();
      expect(element.find('.new-share').length).to.equal(1);
      element.find('button.remove-button').click();
      expect(element.find('.new-share').length).to.equal(1);
    });

    it('should have class disabled there is only one share', function() {
      var element = createElement();
      expect(element.find('button.remove-button').hasClass('disabled')).to.be.true;
      element.find('button.add-more-button').click();
      expect(element.find('button.remove-button').hasClass('disabled')).to.be.false;
      element.find('button.remove-button').click();
      expect(element.find('button.remove-button').hasClass('disabled')).to.be.true;
    });
  });

  describe('donions', function() {
    it('filters out share emails that are empty strings', function() {
      var element = createElement();
      var isolateScope = element.isolateScope();
      isolateScope.newShares.shares = [{name: ''}, {name: 'snu@socrata.com'}];
      isolateScope.donions();
      expect($scope.newShares.shares).to.have.length(1);
      expect($scope.newShares.shares[0].name).to.equal('snu@socrata.com');
    });

    it('filters out share emails that are identical to the email of the current user', function() {
      $window.currentUser = { email: 'snu@socrata.com' };
      var element = createElement();
      var isolateScope = element.isolateScope();
      isolateScope.newShares.shares = [{name: ''}, {name: 'snu@socrata.com'}];
      isolateScope.donions();
      expect($scope.newShares.shares).to.have.length(0);
    });
  });
});
