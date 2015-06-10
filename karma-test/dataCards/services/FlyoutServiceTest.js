describe('Flyout service', function() {
  var FLYOUT_SELECTOR = '#uber-flyout';
  var flyoutService;
  var testHelpers;
  var container;
  var Constants;

  // Error tolerance given we test on multiple
  // mediums.
  var TOLERANCE = 10;
  var testCompletedObservable = new Rx.Subject();

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('test'));
  beforeEach(module('dataCards/flyout.sass'));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    flyoutService = $injector.get('FlyoutService');
    Constants = $injector.get('Constants');
  }));
  beforeEach(function() {
    container = $('<div />').appendTo('body').css({
      border: '1px solid green',
      position: 'absolute',
      top: 100,
      left: 100,
      width: 10,
      height: 10
    });
  });

  afterEach(function() {
    container.remove();
    testCompletedObservable.onNext();
  });

  // Function to test that the flyout hint is positioned correctly
  // on the target element.
  var expectFlyoutHintPosition = function(hint, target, right) {
    var hintOffset = hint.offset();
    var targetOffset = target.offset();
    var hintEdge = hintOffset.left + (right ? hint.width() : 0);

    // Vertically positioned correctly.
    expect(hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING).
      to.be.closeTo(targetOffset.top, TOLERANCE);

    // Horizontally positioned correctly.
    expect(hintEdge).to.be.closeTo(targetOffset.left + (target.width() / 2), TOLERANCE);
  }

  it('should create a flyout with the given string on hover by the target', function() {
    var testText = 'Let\'s go flaigh a kite...';
    var target = $('<div class="flyout-test" />');

    flyoutService.register({
      selector: '.flyout-test',
      render: function() { return testText; },
      destroySignal: testCompletedObservable
    });

    container.append(target);
    testHelpers.fireMouseEvent(target[0], 'mousemove');

    var flyout = $(FLYOUT_SELECTOR);
    var hint = flyout.find('.hint');

    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(testText);

    expectFlyoutHintPosition(hint, target, false);

    // Make sure it disappears when we lose hover focus
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':hidden')).to.be.true;
  });

  it('should position correctly when on the right edge of the screen', function() {
    var longTestText = _.constant(_.map(_.range(20), _.constant('text')).join(' '));
    var target = $('<div class="right-edge" />').css({
      position: 'absolute',
      right: Constants.FLYOUT_WINDOW_PADDING,
      top: 100
    })

    flyoutService.register({
      selector: '.right-edge',
      // A string of 20 words separated by spaces
      render: longTestText,
      destroySignal: testCompletedObservable
    });

    target.appendTo('body');

    try {
      testHelpers.fireMouseEvent(target[0], 'mousemove');

      var hint = $(FLYOUT_SELECTOR).find('.hint');

      expectFlyoutHintPosition(hint, target, true);

    } finally {
      target.remove();
    }
  });

  it('should update the flyout message when refreshFlyout is called.', function() {
    var someMagicalState = true;
    var target = $('<div class="dynamic-flyout-test" />');

    flyoutService.register({
      selector: '.dynamic-flyout-test',
      render: function() {
        return someMagicalState ? 'initial' : 'final';
      },
      destroySignal: testCompletedObservable
    });

    container.append(target);

    testHelpers.fireMouseEvent(target[0], 'mousemove');

    var flyout = $(FLYOUT_SELECTOR);

    expect(flyout.text()).to.equal('initial');

    someMagicalState = false;
    flyoutService.refreshFlyout();

    expect(flyout.text()).to.equal('final');

    // Make sure it disappears when losing hover focus
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':hidden')).to.be.true;
  });
});
