describe("notifyResize directive", function() {
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

  describe('with an attribute value', function() {
    it('should raise elementResized when the element changes size', function(done) {
      var html = '<div notify-resize="testEventArgs"><span></span></div>';
      var el = create(html);

      var spy = sinon.spy(function() {
        if (spy.calledOnce) {
          el.find('span').html('one line');
        }

        if (spy.calledTwice) {
          el.find('span').html('three<br>lines<br>!');
        }

        if (spy.calledThrice) {
          expect(spy.alwaysCalledWithExactly('testEventArgs')).to.be.true;
          done();
        }
      });

      scope.$on('elementResized', function(e, a) {
        spy(a);
      });

      el.find('span').html('two<br>lines');
    });
  });

  describe('with no attribute value', function() {
    it('should raise elementResized when the element changes size', function(done) {
      var html = '<div notify-resize><span></span></div>';
      var el = create(html);

      scope.$on('elementResized', function(e, a) {
        expect(a).to.be.undefined;
        done();
      });

      el.find('span').html('two<br>lines');
    });
  });
});
