describe('animate-to directive', function() {
  var testHelpers;
  var $rootScope;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');

    testHelpers.overrideTransitions(.05);
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
    testHelpers.overrideTransitions(false);
  });

  it('applies the style on the first load without animating', function() {
    var scope = $rootScope.$new();
    scope.styles = {
      position: 'absolute',
      top: 10,
      left: 20,
      width: 100,
      height: 200
    };
    var el = testHelpers.TestDom.compileAndAppend(
      // Create the markup, and apply the styles
      '<div animate-to="styles"></div>', scope);
    expect(el.width()).to.equal(100);
    expect(el.height()).to.equal(200);
    var position = el.position();
    expect(position.top).to.equal(10);
    expect(position.left).to.equal(20);
  });

  it('applies the style immediately without animating when given an index of -1', function() {
    testHelpers.overrideTransitions(false);
    var scope = $rootScope.$new();
    scope.styles = {
      position: 'absolute',
      top: 10,
      left: 20,
      width: 100,
      height: 200
    };
    var el = testHelpers.TestDom.compileAndAppend(
      // Create the markup, and apply the styles
      '<div animate-to="styles" animate-to-index="{{ -1 }}"></div>', scope);
    expect(el.width()).to.equal(100);
    expect(el.height()).to.equal(200);
    var position = el.position();
    expect(position.top).to.equal(10);
    expect(position.left).to.equal(20);

    scope.styles = {
      position: 'fixed',
      top: 20,
      left: 30,
      width: 200,
      height: 300
    };
    scope.$digest();

    expect(el.width()).to.equal(200);
    expect(el.height()).to.equal(300);
    var position = el.position();
    expect(position.top).to.equal(20);
    expect(position.left).to.equal(30);
  });

  if (Modernizr.csstransitions) {
    describe('animation', function() {
      var el;
      var scope;

      beforeEach(function() {
        scope = $rootScope.$new();
        scope.styles = {
          position: 'absolute',
          top: 10,
          left: 20,
          width: 100,
          height: 200
        };
        el = testHelpers.TestDom.compileAndAppend(
          // Create the markup, and apply the styles
          '<div animate-to="styles"><div style="background:#00f">Child content</div></div>', scope);

      });

      it('transitions from one state to another smoothly', function(done) {
        scope.styles = {
          position: 'absolute',
          top: 20,
          left: 30,
          width: 200,
          height: 300
        };
        scope.$digest();

        // Starts as expected
        expect(el.width()).to.equal(100);
        expect(el.height()).to.equal(200);
        var position = el.position();
        expect(position.top).to.equal(10);
        expect(position.left).to.equal(20);

        testHelpers.waitForSatisfy(function() {
          var position = el.position();
          return el.css('position') === 'absolute' &&
            position.top === 20,
            position.left === 30,
            el.width() === 200,
            el.height() === 300;
        }).then(done);
      });

      it('transitions absolute-position to fixed-position smoothly', function(done) {
        scope.styles = {
          position: 'fixed',
          top: 20,
          left: 30,
          width: 200,
          height: 300
        };
        scope.$digest();

        // Starts as expected
        expect(el.width()).to.equal(100);
        expect(el.height()).to.equal(200);
        expect(el.css('position')).to.equal('absolute');
        var position = el.position();
        expect(position.top).to.equal(10);
        expect(position.left).to.equal(20);

        testHelpers.waitForSatisfy(function() {
          var position = el.position();
          return el.css('position') === 'fixed' &&
            position.top === 20,
            position.left === 30,
            el.width() === 200,
            el.height() === 300;
        }).then(done);
      });

      it('transitions fixed-position to absolute-position smoothly', function(done) {
        scope.styles = {
          position: 'fixed',
          top: 10,
          left: 20,
          width: 100,
          height: 200
        };
        scope.$digest();
        testHelpers.waitForSatisfy(function() {
          var position = el.position();
          return el.css('position') === 'fixed' &&
            position.top === 10 &&
            position.left === 20;
        }).then(function() {
          scope.styles = {
            position: 'absolute',
            top: 20,
            left: 30,
            width: 200,
            height: 300
          };
          scope.$digest();

          // Starts as expected
          expect(el.width()).to.equal(100);
          expect(el.height()).to.equal(200);
          expect(el.css('position')).to.equal('fixed');
          var position = el.position();
          expect(position.top).to.equal(10);
          expect(position.left).to.equal(20);

          testHelpers.waitForSatisfy(function() {
            var position = el.position();
            return el.css('position') === 'absolute' &&
              position.top === 20,
              position.left === 30,
              el.width() === 200,
              el.height() === 300;
          }).then(done);
        });
      });

      it('inherits the child\'s background color (only) during animation', function(done) {
        scope.styles = {
          top: 20,
          left: 30,
          width: 200,
          height: 300
        };
        scope.$digest();

        var blueRegex = /rgba?\( *0, *0, *[^,)]*[1-9]|#00[1-9a-f]|#0000.?[1-9a-f]/i;
        testHelpers.waitForSatisfy(function() {
          return blueRegex.test(el.css('background'));
        }).then(function() {
          testHelpers.waitForSatisfy(function() {
            return !blueRegex.test(el.css('background'));
          }).then(done);
        });
      });

      describe('child element', function() {
        it('gets its dimensions set before the animation, and reverts afterwards', function(done) {
          var child = el.children();
          expect(child[0].style.width).not.to.be.ok;

          scope.styles = {
            top: 20,
            left: 30,
            width: 200,
            height: 300
          };
          scope.$digest();

          expect(parseInt(child[0].style.width, 10)).to.equal(child.width());
          expect(parseInt(child[0].style.height, 10)).to.equal(child.height());

          testHelpers.waitForSatisfy(function() {
            return child[0].style.width === '' &&
              child[0].style.height === '';
          }).then(done);
        });
      });
    });
  } else {
    it('always applies the style immediately without animating', function() {
      var scope = $rootScope.$new();
      scope.styles = {
        position: 'absolute',
        top: 10,
        left: 20,
        width: 100,
        height: 200
      };
      var el = testHelpers.TestDom.compileAndAppend(
        // Create the markup, and apply the styles
        '<div animate-to="styles"></div>', scope);
      expect(el.width()).to.equal(100);
      expect(el.height()).to.equal(200);
      var position = el.position();
      expect(position.top).to.equal(10);
      expect(position.left).to.equal(20);

      scope.styles = {
        position: 'fixed',
        top: 20,
        left: 30,
        width: 200,
        height: 300
      };
      scope.$digest();

      expect(el.width()).to.equal(200);
      expect(el.height()).to.equal(300);
      var position = el.position();
      expect(position.top).to.equal(20);
      expect(position.left).to.equal(30);
    });

  }

});
