(function() {
  'use strict';

  describe('<selection-label/>', function() {
    var $window;
    var testHelpers;
    var $rootScope;

    beforeEach(function() {
      module('/angular_templates/dataCards/selectionLabel.html');
      module('socrataCommon.services');
      module('dataCards.directives');
      module('dataCards.services');
      module('test');
      inject(['$rootScope', '$window', 'testHelpers', function(_$rootScope, _$window, _testHelpers) {
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    })

    it('should accept a content attribute', function() {
      var TEST_CONTENT = 'this is my test content';
      var scope = $rootScope.$new();
      scope.myTestContent = TEST_CONTENT;
      var element = testHelpers.TestDom.compileAndAppend('<selection-label content="myTestContent"></selection-label>', scope);
      expect(element.is(':contains({0})'.format(TEST_CONTENT))).to.be.true;
      expect(element.isolateScope().content).to.equal(TEST_CONTENT);
    });

    it('should update its content when the scope changes', function() {
      var TEST_CONTENT_1 = 'test content one';
      var TEST_CONTENT_2 = 'my new test content';
      var scope = $rootScope.$new();
      scope.content = TEST_CONTENT_1;
      var element = testHelpers.TestDom.compileAndAppend('<selection-label content="content"></selection-label>', scope);
      expect(element.find('.selection-label-inner').text()).to.equal(TEST_CONTENT_1);
      scope.content = TEST_CONTENT_2;
      scope.$digest();
      expect(element.find('.selection-label-inner').text()).to.equal(TEST_CONTENT_2);
    });

    describe('auto-select', function() {
      var TEST_CONTENT = 'test content';
      var scope;
      var element;
      var $content;
      beforeEach(function() {
        scope = $rootScope.$new();
        scope.content = TEST_CONTENT;
        element = testHelpers.TestDom.compileAndAppend('<selection-label content="content"></selection-label>', scope);
        $content = element.find('.selection-label-inner');
      });

      it('should select the text on mousedown/mouseup without drag', function() {
        $content.trigger('mousedown');
        $content.trigger('mouseup');
        var selection = $window.getSelection();
        expect(selection.toString()).to.equal(TEST_CONTENT);
      });

      it('should not auto-select the test on mousedown/mousedrag/mouseup', function() {
        $content.
          trigger('mousedown').
          trigger('mousemove').
          trigger('mouseup');
        var selection = $window.getSelection();
        expect(selection.toString()).to.equal('');
      });

    });

  });

})();
