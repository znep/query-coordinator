describe("notifyResize directive", function() {
  var scope, testHelpers;

  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', 'testHelpers', function(_$rootScope, _testHelpers) {
    testHelpers = _testHelpers;
    scope = _$rootScope.$new();
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('with an attribute value', function(done) {
    it('should broadcast the named event when the element changes size', function(done) {
      var html = '<div notify-resize="testEventName"><span></span></div>';
      var el = testHelpers.TestDom.compileAndAppend(html, scope);

      var spy = sinon.spy(function(event, newSize) {

        expect(newSize).property('width');
        expect(newSize).property('height');

        if (spy.calledOnce) {
          el.find('span').html('one line');
        }

        if (spy.calledTwice) {
          el.find('span').html('three<br>lines<br>!');
        }

        if (spy.calledThrice) {
          done();
        }
      });

      scope.$on('testEventName', spy);

      // This defer is only here because jquery-resize falls
      // back to polling for IE9. In other browsers this isn't
      // needed.
      _.defer(function() {
        el.find('span').html('two<br>lines');
        done();
      });
    });
  });

  describe('with no attribute value', function() {
    it('should raise an error', function() {
      var html = '<div notify-resize><span></span></div>';
      expect(function () {
        testHelpers.TestDom.compileAndAppendTo(html, scope);
      }).to.throw();
    });
  });
});
