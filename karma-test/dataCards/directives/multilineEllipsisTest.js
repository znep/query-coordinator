describe("multilineEllipsis directive", function() {
  var scope, compile;

  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope;
    compile = $compile;
  }));

  var create = function(html) {
    var elem = angular.element(html);
    $('body').append(elem);
    var compiledElem = compile(elem)(scope);
    scope.$digest();

    return compiledElem;
  };

  describe('with an max-lines, tolerance and text', function() {
    it('should broadcast the named event when the element changes size', function(done) {
      var html = '<div ></div>';
      var el = create(html);

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

      el.find('span').html('two<br>lines');
    });
  });

  describe('with no attribute value', function() {
    it('should raise an error', function() {
      var html = '<div notify-resize><span></span></div>';
      expect(function () {
        create(html);
      }).to.throw();
    });
  });
});
