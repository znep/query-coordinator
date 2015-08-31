(function() {
  'use strict';
  var $rootScope;
  var testHelpers;
  var DEFAULT_WIDTH = 300;
  var DEFAULT_HEIGHT = 200;
  var SRC_STRING = 'http://placekitten.com/g/{0}/{1}';

  describe('kitten directive', function() {
    beforeEach(function() {
      module('socrataCommon.directives');
      module('test');

      inject(['$rootScope', 'testHelpers', function(_$rootScope, _testHelpers) {
        $rootScope = _$rootScope;
        testHelpers = _testHelpers;
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });


    it('should show a kitten', function() {
      var outerScope = $rootScope.$new();

      var html = '<soc-kitten></soc-kitten>';
      var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
      expect(element.find('img').attr('src')).to.equal(SRC_STRING.format(DEFAULT_WIDTH, DEFAULT_HEIGHT));
    });

    it('should support custom width and height', function() {
      var outerScope = $rootScope.$new();
      var CUSTOM_WIDTH = 123;
      var CUSTOM_HEIGHT = 456;

      var html = '<soc-kitten w="{0}" h="{1}"></soc-kitten>'.format(CUSTOM_WIDTH, CUSTOM_HEIGHT);
      var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
      expect(element.find('img').attr('src')).to.equal(SRC_STRING.format(CUSTOM_WIDTH, CUSTOM_HEIGHT));

    })
  });

})();
