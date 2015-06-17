describe('Flyout service', function() {
  var FlyoutService;
  var Constants;
  var TestHelpers;

  var boxElement;
  var flyout;
  var flyoutSelector;
  var hint;

  // Error tolerance given we test on multiple
  // mediums.
  var TOLERANCE = 10;
  var testCompletedObservable = new Rx.Subject();

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('test'));
  beforeEach(module('dataCards/flyout.sass'));
  beforeEach(module('dataCards/theme/default.sass'));
  beforeEach(inject(function($injector) {
    FlyoutService = $injector.get('FlyoutService');
    Constants = $injector.get('Constants');
    TestHelpers = $injector.get('testHelpers');
  }));
  
  // Before each test, create a generic box to act as a target
  // for the flyout.  We'll move this box around in our tests.
  beforeEach(function() {
    var cssBox = {
      border: '1px solid #000',
      position: 'absolute',
      width: 20,
      height: 20,
      top: 100,
      bottom: 100
    };

    boxElement = $('<div class="target-box" />').appendTo('body').css(cssBox);
    flyoutSelector = '#uber-flyout';
    flyout = $(flyoutSelector);
    hint = flyout.find('.hint');
  });

  afterEach(function() {
    boxElement.remove();
    testCompletedObservable.onNext();
  });

  // Function to test that the flyout hint is positioned correctly
  // on the target element.
  var expectFlyoutHintPosition = function(hint, target, right) {
    var hintOffset = hint.offset();
    var targetOffset = target.offset();
    var hintEdge = hintOffset.left + (right ? hint.width() : 0);

    // Test if vertically and horizontally accurate.
    expect(hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING).
      to.be.closeTo(targetOffset.top, TOLERANCE);
    expect(hintEdge).to.be.closeTo(targetOffset.left + (target.width() / 2), TOLERANCE);
  };

  it('should create a flyout with the given string on hover by the target', function() {
    var flyoutText = Array(20).join('a');

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(flyoutText);
    expectFlyoutHintPosition(hint, boxElement, false);

    TestHelpers.fireMouseEvent($('body')[0], 'mousemove');

    expect(flyout.is(':hidden')).to.be.true;
  });

  it('should position correctly when on the right edge of the screen', function() {
    var flyoutText = Array(20).join('a');

    boxElement.css({
      right: Constants.FLYOUT_WINDOW_PADDING
    });

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(flyoutText);
    expectFlyoutHintPosition(hint, boxElement, true);

    TestHelpers.fireMouseEvent($('body')[0], 'mousemove');

    expect(flyout.is(':hidden')).to.be.true;
  });
  
  it('should create flyouts with a maximum width of 350px', function() {
    var flyoutText = Array(200).join('a');

   FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');
    
    expect(flyout.width()).to.equal(350);
  });

  it('should update the flyout message when refreshFlyout is called', function() {
    var someMagicalState = true;

    FlyoutService.register({
      selector: '.target-box',
      render: function() {
        return someMagicalState ? 'initial' : 'final';
      },
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.text()).to.equal('initial');

    someMagicalState = false;
    FlyoutService.refreshFlyout();

    expect(flyout.text()).to.equal('final');

    TestHelpers.fireMouseEvent($('body')[0], 'mousemove');

    expect(flyout.is(':hidden')).to.be.true;
  });

  it('should only show one flyout at a time', function() {
    var firstFlyoutText = Array(20).join('a');
    var secondFlyoutText = Array(20).join('b');
    var secondBoxElement;
    var cssSecondBox = {
      border: '1px solid #000',
      position: 'absolute',
      width: 20,
      height: 20,
      top: 200,
      left: 200
    };

    secondBoxElement = $('<div class="second-target-box" />').
      appendTo('body').
      css(cssSecondBox);

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(firstFlyoutText),
      destroySignal: testCompletedObservable
    });

    FlyoutService.register({
      selector: '.second-target-box',
      render: _.constant(secondFlyoutText),
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect($('{0}:visible'.format(flyoutSelector)).length).to.equal(1);
    expect(flyout.text()).to.equal(firstFlyoutText);
    expectFlyoutHintPosition(hint, boxElement);

    TestHelpers.fireMouseEvent(secondBoxElement[0], 'mousemove');

    expect($('{0}:visible'.format(flyoutSelector)).length).to.equal(1);
    expect(flyout.text()).to.equal(secondFlyoutText);
    expectFlyoutHintPosition(hint, secondBoxElement);
  });

  it('should hide flyouts on mousedown', function() {
    var flyoutText = Array(20).join('a');

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompletedObservable
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;

    TestHelpers.fireMouseEvent(boxElement[0], 'mousedown');

    expect(flyout.is(':hidden')).to.be.true;
  });
});