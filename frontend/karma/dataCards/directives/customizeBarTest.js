import { expect, assert } from 'chai';
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
    assert.lengthOf(
      $(createElement().element).find('revert-button'),
      1
    )
  });

  it('should have a save button', function() {
    assert.lengthOf(
      $(createElement().element).find('save-button'),
      1
    );
  });

  it('should have a save-as button', function() {
    assert.lengthOf(
      $(createElement().element).find('save-as'),
      1
    );
  });

  it('should have a remove-all-cards button', function() {
    var customizeBar = createElement().element;
    assert.lengthOf(customizeBar.find('remove-all-cards'), 1);
  });

  it('should show save-as button', function() {
    var customizeBar = createElement().element;
    assert.notInclude(customizeBar.find('save-as').attr('class'), 'ng-hide');
  });

  it('should respond to changes to "hasChanges"', function() {
    var elementAndScope = createElement();
    var customizeBar = elementAndScope.element;
    var scope = elementAndScope.scope;
    const customizeBarClasses = () => 
      customizeBar.find('.customize-bar').attr('class');
    const unsavedWarningClasses = () => 
      customizeBar.find('.unsaved-warning.unsaved-dirty').attr('class');

    assert.notInclude(customizeBarClasses(), 'has-changes');
    assert.include(unsavedWarningClasses(), 'ng-hide');
    scope.hasChanges = true;
    scope.$digest();
    assert.include(customizeBarClasses(), 'has-changes');
    assert.notInclude(unsavedWarningClasses(), 'ng-hide');
  });

  describe('customize button', function() {

    it('should exist', function() {
      var customizeBar = createElement().element;
      assert.lengthOf(customizeBar.find('.customize-button'), 1);
    });

    it('should toggle "editMode" when clicked', function() {
      var elementAndScope = createElement();
      var customizeBar = elementAndScope.element;
      var scope = elementAndScope.scope;
      var customizeButton = customizeBar.find('.customize-button');
      customizeButton.click();
      assert.isTrue(scope.editMode);
      customizeButton.click();
      assert.isFalse(scope.editMode);
    });

    it('should have a flyout', function() {
      var elementAndScope = createElement();
      var customizeBar = elementAndScope.element;
      var scope = elementAndScope.scope;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      assert.lengthOf(flyout, 1);
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
      assert.isTrue(customizeButton.hasClass('disabled'));
      testHelpers.fireMouseEvent(customizeButton[0], 'click');
      expect(elementAndScope.scope.editMode).to.equal(false);
    });

    it('should have the expected text in the flyout when a card is expanded', function() {
      var elementAndScope = createElement({expandedCard: {something: 'here'}});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      assert.lengthOf(flyout, 1);
      expect(flyout.text()).to.match(/.*Collapse the big card.*/);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
    });

    it('should be disabled when in export visualization as PNG mode', function() {
      var elementAndScope = createElement({exportingVisualization: true});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      assert.isTrue(customizeButton.hasClass('disabled'));
      testHelpers.fireMouseEvent(customizeButton[0], 'click');
      expect(elementAndScope.scope.editMode).to.equal(false);
    });

    it('should have the expected text in the flyout when in export visualization as PNG mode', function() {
      var elementAndScope = createElement({exportingVisualization: true});
      var customizeBar = elementAndScope.element;
      var customizeButton = customizeBar.find('.customize-button');
      testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
      var flyout = $('#uber-flyout');
      assert.lengthOf(flyout, 1);
      expect(flyout.text()).to.match(/.*Download Visualization as Image.*/);
      testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
    });
  });

  describe('in ephemeral mode', function() {

    it('should show a save warning even when no changes have been made', function() {
      var elementAndScope = createElement({isEphemeral: true});
      var customizeBar = elementAndScope.element;
      assert.isFalse(customizeBar.find('.unsaved-warning.unsaved-clean').hasClass('ng-hide'));
    });
  });
});
