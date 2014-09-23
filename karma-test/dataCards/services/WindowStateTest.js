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
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mousedown', true, true);
      ev.which = button;
      ev.pageX = 1337;
      ev.pageY = 666;
      return ev;
    };

    function generateFakeMouseUp(button) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mouseup', true, true);
      ev.which = button;
      ev.pageX = 1337;
      ev.pageY = 666;
      return ev;
    };

    it('should react to left mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(1));

      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.true;
    });

    it('should not react to right mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(3));

      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;
    });

    it('should react to left mouseup after left mousedown', function() {
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(1));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.true;

      body.dispatchEvent(generateFakeMouseUp(1));
      expect(WindowState.mouseLeftButtonPressedSubject.value).to.be.false;
    });

  });

  describe('mousePositionSubject', function() {

    function generateFakeMouseMove(clientX, clientY, target) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mousemove', true, true);
      ev.clientX = clientX,
      ev.clientY = clientY,
      ev.target = target
      return ev;
    };

    it('should report the correct mouse position on mousemove', function() {
      var body = document.getElementsByTagName('body')[0];

      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 0,
        clientY: 0,
        target: null
      });

      body.dispatchEvent(generateFakeMouseMove(10, 20, body));

      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 10,
        clientY: 20,
        target: body
      });
      expect(WindowState.mouseClientX).to.equal(10);
      expect(WindowState.mouseClientY).to.equal(20);

      body.dispatchEvent(generateFakeMouseMove(100, 200, body));

      expect(WindowState.mousePositionSubject.value).to.deep.equal({
        clientX: 100,
        clientY: 200,
        target: body
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

      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('resize', true, true);
      window.dispatchEvent(ev);

      expect(handler.calledTwice).to.be.true;

      var currentWindowDimensions = $(window).dimensions();
      expect(handler.alwaysCalledWithExactly(currentWindowDimensions)).to.be.true;
    });

  });

  describe('scrollPositionSubject', function() {
    var fakeContentYPosition = 100000;
    $('body').append('<div id="scrollPositionSubjectFakeContent" style="position: absolute; height: ' + fakeContentYPosition + 'px">LOL JQUERY</div>');

    after(function() {
      $('#scrollPositionSubjectFakeContent').remove();
    });
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
