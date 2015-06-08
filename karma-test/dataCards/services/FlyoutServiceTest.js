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

  it('should create a flyout with the given string on hover by the target', function() {
    var testText = 'Let\'s go flaigh a kite...';
    flyoutService.register({
      selector: '.flyout-test',
      render: function() { return testText; },
      destroySignal: testCompletedObservable
    });

    var target = $('<div class="flyout-test" />');
    container.append(target);

    testHelpers.fireMouseEvent(target[0], 'mousemove');

    var flyout = $(FLYOUT_SELECTOR);
    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(testText);

    var flyoutOffset = flyout.offset();
    var targetOffset = target.offset();
    expect(flyoutOffset.top + flyout.height() + Constants.FLYOUT_BOTTOM_PADDING)
      .to.be.closeTo(targetOffset.top, TOLERANCE);
    expect(flyoutOffset.left).to.be.closeTo(targetOffset.left, TOLERANCE);

    // Make sure it disappears when we lose hover focus
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.false;
  });

  it('should position correctly when on the right edge of the screen', function() {
    var longTestText = _.constant(_.map(_.range(20), _.constant('text')).join(' '));
    flyoutService.register({
      selector: '.right-edge',
      // A string of 20 words separated by spaces
      render: longTestText,
      destroySignal: testCompletedObservable
    });

    var target = $('<div class="right-edge" />').css({
      position: 'absolute',
      right: Constants.FLYOUT_WINDOW_PADDING,
      top: 100
    }).appendTo('body');

    try {
      testHelpers.fireMouseEvent(target[0], 'mousemove');

      var hint = $(FLYOUT_SELECTOR).find('.hint');
      var hintOffset = hint.offset();
      var targetOffset = target.offset();

      expect(hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING)
        .to.be.closeTo(targetOffset.top, TOLERANCE);
      expect(hintOffset.left + hint.width()).to.be.closeTo(targetOffset.left, TOLERANCE);

    } finally {
      target.remove();
    }
  });

  it('should update the flyout message when refreshFlyout is called.', function() {
    var someMagicalState = true;

    flyoutService.register({
      selector: '.dynamic-flyout-test',
      render: function() {
        return someMagicalState ? 'initial' : 'final';
      },
      destroySignal: testCompletedObservable
    });

    var target = $('<div class="dynamic-flyout-test" />');
    container.append(target);

    testHelpers.fireMouseEvent(target[0], 'mousemove');

    var flyout = $(FLYOUT_SELECTOR);

    expect(flyout.text()).to.equal('initial');
    someMagicalState = false;
    flyoutService.refreshFlyout();
    expect(flyout.text()).to.equal('final');

    // Make sure it disappears when losing hover focus
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.false;
  });
});
