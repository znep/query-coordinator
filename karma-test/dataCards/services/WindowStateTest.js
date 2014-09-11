describe('WindowState service', function() {
  beforeEach(module('dataCards.services'));

  var WindowState;
  beforeEach(function() {
    inject(function($injector) {
      WindowState = $injector.get('WindowState');
    });
  });

  describe('mouseLeftButtonPressedSubject', function() {

    function generateFakeMouseDown(button) {
      return jQuery.Event( "mousedown", {
        which: button,
             pageX: 1337,
             pageY: 666
      });
    };

    function generateFakeMouseUp(button) {
      return jQuery.Event( "mouseup", {
        which: button,
             pageX: 1337,
             pageY: 666
      });
    };

    it('should react to left mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      $('body').trigger(generateFakeMouseDown(1));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.true;
    });

    it('should not react to right mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      $('body').trigger(generateFakeMouseDown(3));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;
    });

    it('should react to left mouseup after left mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      $('body').trigger(generateFakeMouseDown(1));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.true;
      $('body').trigger(generateFakeMouseUp(1));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;
    });

  });

  describe('mousePositionSubject', function() {

    function generateFakeMouseMove(clientX, clientY, target) {
      return jQuery.Event( "mousemove", {
        originalEvent: {
          clientX: clientX,
          clientY: clientY
        },
        target: target
      });
    };

    it('should report the correct mouse position on mousemove', function() {
      var target = $('body');

      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 0,
        clientY: 0,
        target: null
      });

      $('body').trigger(generateFakeMouseMove(10, 20, target));
      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 10,
        clientY: 20,
        target: target
      });
      expect(WindowState.mouseClientX).to.equal(10);
      expect(WindowState.mouseClientY).to.equal(20);

      $('body').trigger(generateFakeMouseMove(100, 200, target));
      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 100,
        clientY: 200,
        target: target
      });
      expect(WindowState.mouseClientX).to.equal(100);
      expect(WindowState.mouseClientY).to.equal(200);
    });
  });

  describe('windowSizeSubject', function() {

    it('should react to resize events on window', function() {
      var handler = sinon.spy();
      WindowState.windowSizeSubject.subscribe(handler);
      expect(handler.calledOnce).to.be.true;

      $(window).trigger(jQuery.Event('resize', {}));

      expect(handler.calledTwice).to.be.true;

      var currentWindowDimensions = $(window).dimensions();
      expect(handler.alwaysCalledWithExactly(currentWindowDimensions)).to.be.true;
    });

  });

  describe('scrollPositionSubject', function() {
    var fakeContentYPosition = 100000;
    var testContent = $('body').append('<div style="position: absolute; height: ' + fakeContentYPosition + 'px">LOL JQUERY</div>');

    // NOTE: PhantomJS accomodates its window size to the content (with no upper bound).
    // So this test is not going to work in PhantomJS. Detect that here.
    var skipTest = $(window).height() >= fakeContentYPosition;

    // Conditionally skip the test if the browser does not have a height that would allow scrolling.
    // (i.e. if the test is being run by Phantom).
    (skipTest ? it.skip : it)('should report the correct scrollY position on page scroll event', function(done) {
      $(window).scrollTop(0);
      expect(WindowState.scrollPositionSubject.value).to.equal(0);

      var handler = sinon.spy(function(scrollTop) {
        if (handler.calledOnce) {
          expect(scrollTop).to.equal(0);
        } else if (handler.calledTwice) {
          expect(scrollTop).to.equal(1337);
          done();
        }
      });
      WindowState.scrollPositionSubject.subscribe(handler);
      $(window).scrollTop(1337);
    });
  });
});
