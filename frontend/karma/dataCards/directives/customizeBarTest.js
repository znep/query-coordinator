const angular = require('angular');

describe('customizeBar', function() {
  'use strict';

  var $provide;
  var $window;
  var testHelpers;
  var $rootScope;
  var ServerConfig;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(['$provide', function(_$provide) {
    $provide = _$provide;
  }]));

  beforeEach(function() {
    inject([
      '$window',
      '$rootScope',
      'testHelpers',
      'ServerConfig',
      function(_$window, _$rootScope, _testHelpers, _ServerConfig) {
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
        ServerConfig = _ServerConfig;
        testHelpers.mockDirective($provide, 'revertButton');
        testHelpers.mockDirective($provide, 'saveButton');
        testHelpers.mockDirective($provide, 'saveAs');
    }]);
  });

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createElement(scopeOverrides) {
    var scope = $rootScope.$new();

    _.extend(
      scope,
      {
        isEphemeral: false,
        hasChanges: false,
        editMode: false,
        expandedCard: false,
        exportingVisualization: false
      },
      scopeOverrides
    );

    var html = [
      '<customize-bar is-ephemeral="isEphemeral" has-changes="hasChanges" edit-mode="editMode"',
      'expanded-card="expandedCard" exporting-visualization="exportingVisualization"></customize-bar>'
    ].join('');

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    scope.$digest();

    return {
      scope: scope,
      element: element
    };
  }

  it('should have a revert button', function() {
    var customizeBar = createElement().element;
    expect(customizeBar.find('revert-button')).to.exist;
  });

  it('should have a save button', function() {
    var customizeBar = createElement().element;
    expect(customizeBar.find('save-button')).to.exist;
  });

  it('should have a save-as button', function() {
    var customizeBar = createElement().element;
    expect(customizeBar.find('save-as')).to.exist;
  });

  it('should have a remove-all-cards button', function() {
    var customizeBar = createElement().element;
    expect(customizeBar.find('remove-all-cards')).to.exist;
  });

  it('should show save-as button', function(){
    var customizeBar = createElement().element;
    expect(customizeBar.find('save-as')).to.not.have.class('ng-hide');
  });

  it('should respond to changes to "hasChanges"', function() {
    var elementAndScope = createElement();
    var customizeBar = elementAndScope.element;
    var scope = elementAndScope.scope;

    expect(customizeBar.find('.customize-bar')).to.not.have.class('has-changes');
    expect(customizeBar.find('.unsaved-warning.unsaved-dirty')).to.have.class('ng-hide');
    scope.hasChanges = true;
    scope.$digest();
    expect(customizeBar.find('.customize-bar')).to.have.class('has-changes');
    expect(customizeBar.find('.unsaved-warning.unsaved-dirty')).to.not.have.class('ng-hide');
  });

  describe('customize button', function() {

    it('should exist', function() {
      var customizeBar = createElement().element;
      expect(customizeBar.find('.customize-button')).to.exist;
    });

    it('should toggle "editMode" when clicked', function() {
      var elementAndScope = createElement();
      var customizeBar = elementAndScope.element;
      var scope = elementAndScope.scope;
      var customizeButton = customizeBar.find('.customize-button');
      customizeButton.click();
      expect(scope.editMode).to.be.true;
      customizeButton.click();
      expect(scope.editMode).to.be.false;
    });

    it('should have a flyout', function() {
      var elementAndScope = createElement();
      var customizeBar = elementAndScope.element;
      var scope = elementAndScope.scope;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      expect(flyout).to.exist;
      expect(flyout.text()).to.match(/click to customize the layout/i);
      expect(flyout.text()).to.match(/\spage/i);
      expect(flyout.text()).to.not.match(/\sview/i);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
      scope.editMode = true;
      scope.$digest();
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      expect(flyout.text()).to.match(/you are now customizing/i);
      expect(flyout.text()).to.match(/\spage/i);
      expect(flyout.text()).to.not.match(/\sview/i);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
    });

    it('should be disabled when a card is expanded', function() {
      var elementAndScope = createElement({expandedCard: {something: 'here'}});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      expect(customizeButton).to.have.class('disabled');
      testHelpers.fireMouseEvent(customizeButton[0], 'click');
      expect(elementAndScope.scope.editMode).to.equal(false);
    });

    it('should have the expected text in the flyout when a card is expanded', function() {
      var elementAndScope = createElement({expandedCard: {something: 'here'}});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      expect(flyout).to.exist;
      expect(flyout.text()).to.match(/.*Collapse the big card.*/);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
    });

    it('should be disabled when in export visualization as PNG mode', function() {
      var elementAndScope = createElement({exportingVisualization: true});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      expect(customizeButton).to.have.class('disabled');
      testHelpers.fireMouseEvent(customizeButton[0], 'click');
      expect(elementAndScope.scope.editMode).to.equal(false);
    });

    it('should have the expected text in the flyout when in export visualization as PNG mode', function() {
      var elementAndScope = createElement({exportingVisualization: true});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      expect(flyout).to.exist;
      expect(flyout.text()).to.match(/.*Download Visualization as Image.*/);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
    });
  });

  describe('in ephemeral mode', function() {

    it('should show a save warning even when no changes have been made', function() {
      var elementAndScope = createElement({isEphemeral: true});
      var customizeBar = elementAndScope.element;
      expect(customizeBar.find('.unsaved-warning.unsaved-clean')).to.not.have.class('ng-hide');
    });
  });
});