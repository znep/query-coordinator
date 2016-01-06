describe('Flyout service', function() {
  'use strict';

  var FlyoutService;
  var Constants;
  var TestHelpers;

  var boxElement;
  var flyout;
  var flyoutSelector;
  var hint;

  // Error tolerance given we test on multiple mediums.
  var TOLERANCE = 10;
  var testCompleted$ = new Rx.Subject();

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('dataCards/flyout.scss'));
  beforeEach(angular.mock.module('dataCards/theme/default.scss'));

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
    testCompleted$.onNext();
  });

  // Function to test that the flyout hint is positioned correctly
  // on the target element.
  var expectFlyoutHintPosition = function(hint, target) {
    var hintOffset = hint.offset();
    var targetOffset = target.offset();
    var verticalDelta;
    var horizontalDelta;

    // A north flyout aligns the top edge of the hint to the bottom edge of the target.
    // A south flyout aligns the bottom edge of the hint to the top edge of the target.
    // An east flyout aligns the right edge of hint to the middle of the target.
    // A west flyout aligns the left edge of hint to the middle of the target.
    if (flyout.hasClass('southwest')) {
      verticalDelta = targetOffset.top - (hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING);
      horizontalDelta = (targetOffset.left + target.width() / 2) - hintOffset.left;
    } else if (flyout.hasClass('northwest')) {
      verticalDelta = hintOffset.top - Constants.FLYOUT_TOP_PADDING - (targetOffset.top + target.height());
      horizontalDelta = (targetOffset.left + target.width() / 2) - hintOffset.left;
    } else if (flyout.hasClass('southeast')) {
      verticalDelta = targetOffset.top - (hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING);
      horizontalDelta = (targetOffset.left + target.width() / 2) - (hintOffset.left + hint.width());
    } else if (flyout.hasClass('northeast')) {
      verticalDelta = hintOffset.top - Constants.FLYOUT_TOP_PADDING - (targetOffset.top + target.height());
      horizontalDelta = (targetOffset.left + target.width() / 2) - (hintOffset.left + hint.width());
    } else {
      throw new Error('Flyout should have a class based on cardinal directions');
    }

    expect(verticalDelta).to.be.within(-TOLERANCE, TOLERANCE);
    expect(horizontalDelta).to.be.within(-TOLERANCE, TOLERANCE);
  };

  it('should create a flyout with the given string on hover by the target', function() {
    var flyoutText = Array(20).join('a');

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompleted$
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(flyoutText);
    expectFlyoutHintPosition(hint, boxElement);

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
      destroySignal: testCompleted$
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;
    expect(flyout.text()).to.equal(flyoutText);
    expectFlyoutHintPosition(hint, boxElement);

    TestHelpers.fireMouseEvent($('body')[0], 'mousemove');

    expect(flyout.is(':hidden')).to.be.true;
  });

  it('should create flyouts with a maximum width of 350px', function() {
    var flyoutText = Array(200).join('a');

   FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompleted$
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
      destroySignal: testCompleted$
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
      destroySignal: testCompleted$
    });

    FlyoutService.register({
      selector: '.second-target-box',
      render: _.constant(secondFlyoutText),
      destroySignal: testCompleted$
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

  it('should allow the flyout to appear below the target when requested', function() {
    var flyoutText = Array(200).join('a');

   FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      belowTarget: true,
      destroySignal: testCompleted$
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.attr('class')).to.match(/^north(east|west)$/);
    expectFlyoutHintPosition(hint, boxElement);
  });

  it('should apply custom classes when requested', function() {
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
      destroySignal: testCompleted$,
      classes: 'testing'
    });

    FlyoutService.register({
      selector: '.second-target-box',
      render: _.constant(secondFlyoutText),
      destroySignal: testCompleted$
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');
    expect(flyout).to.have.class('testing');
    TestHelpers.fireMouseEvent(secondBoxElement[0], 'mousemove');
    expect(flyout).to.not.have.class('testing');
    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');
    expect(flyout).to.have.class('testing');
  });

  it('should hide flyouts on mousedown by default', function() {
    var flyoutText = Array(20).join('a');

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompleted$
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;

    TestHelpers.fireMouseEvent(boxElement[0], 'mousedown');

    expect(flyout.is(':hidden')).to.be.true;
  });

  it('should not hide on mousedown if set to persist when registered', function(){
    var flyoutText = Array(20).join('a');

    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(flyoutText),
      destroySignal: testCompleted$,
      persistOnMousedown: true
    });

    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');

    expect(flyout.is(':visible')).to.be.true;

    TestHelpers.fireMouseEvent(boxElement[0], 'mousedown');

    expect(flyout.is(':hidden')).to.be.false;
  });

  it('should update mousedown behavior between multiple registered flyouts', function() {
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

    // Register first flyout to hide on mousedown (default).
    FlyoutService.register({
      selector: '.target-box',
      render: _.constant(firstFlyoutText),
      destroySignal: testCompleted$
    });

    // Register a second flyout to remain visible upon mousedown.
    FlyoutService.register({
      selector: '.second-target-box',
      render: _.constant(secondFlyoutText),
      destroySignal: testCompleted$,
      persistOnMousedown: true
    });

    // Test hiding behavior for first flyout (should hide on mousedown).
    TestHelpers.fireMouseEvent(boxElement[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.true;
    TestHelpers.fireMouseEvent(boxElement[0], 'mousedown');
    expect(flyout.is(':hidden')).to.be.true;

    // Test hiding behavior on second flyout (should remain visible).
    TestHelpers.fireMouseEvent(secondBoxElement[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.true;
    TestHelpers.fireMouseEvent(secondBoxElement[0], 'mousedown');
    expect(flyout.is(':hidden')).to.be.false;
  });
});
