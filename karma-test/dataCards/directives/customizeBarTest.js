(function() {
  'use strict';

  describe('<customize-bar/>', function() {
    var $provide;
    var $window;
    var testHelpers;
    var $rootScope;

    beforeEach(module('/angular_templates/dataCards/customizeBar.html'));
    beforeEach(module('dataCards'));
    beforeEach(module('socrataCommon.filters'));
    beforeEach(module('socrataCommon.directives'));
    beforeEach(module('socrataCommon.services'));
    beforeEach(module('dataCards.directives'));
    beforeEach(module('dataCards.services'));
    beforeEach(module('test'));
    beforeEach(module(['$provide', function(_$provide) {
      $provide = _$provide;
    }]));
    beforeEach(function() {
      inject(['$window', '$rootScope', 'testHelpers',function(_$window, _$rootScope, _testHelpers) {
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
        testHelpers.mockDirective($provide, 'saveButton');
        testHelpers.mockDirective($provide, 'saveAs');
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    function createElement(scopeOverrides) {
      var scope = $rootScope.$new();
      _.extend(scope, {
          hasChanges: false,
          editMode: false,
          expandedCard: false
        },
        scopeOverrides);
      return {
        scope: scope,
        element: testHelpers.TestDom.compileAndAppend('<customize-bar has-changes="hasChanges" edit-mode="editMode" expanded-card="expandedCard"></customize-bar>', scope)
      };
    }

    it('should have a save button', function() {
      var customizeBar = createElement().element;
      expect(customizeBar.find('save-button')).to.exist;
    });

    it('should have a save-as button', function() {
      var customizeBar = createElement().element;
      expect(customizeBar.find('save-as')).to.exist;
    });

    it('should respond to changes to "hasChanges"', function() {
      var elementAndScope = createElement();
      var customizeBar = elementAndScope.element;
      var scope = elementAndScope.scope;

      expect(customizeBar.find('.customize-bar')).to.not.have.class('has-changes');
      expect(customizeBar.find('.changes-warning')).to.have.class('ng-hide');
      scope.hasChanges = true;
      scope.$digest();
      expect(customizeBar.find('.customize-bar')).to.have.class('has-changes');
      expect(customizeBar.find('.changes-warning')).to.not.have.class('ng-hide');
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
        expect(flyout).to.have.text('Click to customize the layout or display of this view.');
        testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
        scope.editMode = true;
        scope.$digest();
        testHelpers.fireMouseEvent(customizeButton[0], 'mousemove');
        expect(flyout.text()).to.match(/^You are now customizing this view\./);
        testHelpers.fireMouseEvent(customizeButton[0], 'mouseout');
      });

    });

  });

})();
