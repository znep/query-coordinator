describe('newShareDialog', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var $httpBackend;
  var _$provide;

  beforeEach(module('/angular_templates/dataCards/new-share-dialog.html'));
  beforeEach(module('dataCards/cards.scss'));
  beforeEach(module('dataCards'));

  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');

    testHelpers.mockDirective(_$provide, 'socSelect');
    testHelpers.mockDirective(_$provide, 'saveButton');
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'manageLensDialog');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.cleanUp();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function createElement(pageMetadata, datasetMetadata) {
    var $scope = $rootScope.$new();
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
});
