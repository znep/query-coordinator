describe('Flyout service', function() {
  var FLYOUT_SELECTOR = '#uber-flyout';
  var flyoutService;
  var testHelpers;
  var container;

  var testCompletedObservable = new Rx.Subject();

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('test'));
  beforeEach(module('dataCards/flyout.sass'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    flyoutService = $injector.get('FlyoutService');
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
    var text = 'Let\'s go flaigh a kite...';
    flyoutService.register({
      className: 'flyout-test',
      render: function() { return text; },
      destroySignal: testCompletedObservable
    });

    var target = $('<div class="flyout-test" />');
    container.append(target);

    testHelpers.fireMouseEvent(target[0], 'mousemove');

    var flyout = $(FLYOUT_SELECTOR);
    expect(flyout.is(':visible')).to.be.true;

    expect(flyout.text()).to.equal(text);

    var flyoutOffset = flyout.offset();
    var targetOffset = target.offset();
    expect(flyoutOffset.top + flyout.outerHeight()).to.be.closeTo(targetOffset.top, 11);
    expect(flyoutOffset.left).to.be.closeTo(targetOffset.left, 10);

    // Make sure it disappears too
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.false;
  });

  it('should position correctly when on the right edge of the screen', function() {
    flyoutService.register({
      className: 'right-edge',
      // A string of 20 words separated by spaces
      render: _.constant(_.map(_.range(20), _.constant('text')).join(' ')),
      destroySignal: testCompletedObservable
    });

    var target = $('<div class="right-edge" />').css({
      position: 'absolute',
      right: 5,
      top: 100
    }).appendTo('body');

    try {
      testHelpers.fireMouseEvent(target[0], 'mousemove');

      var hint = $(FLYOUT_SELECTOR).find('.hint');

      var hintOffset = hint.offset();
      var targetOffset = target.offset();

      expect(hintOffset.top + hint.outerHeight()).to.be.closeTo(targetOffset.top, 11);
      expect(hintOffset.left).to.be.closeTo(targetOffset.left, 10);
    } finally {
      // be a good citizen and clean up after ourselves
      target.remove();
    }
  });

  it('should update the flyout message when refreshFlyout is called.', function() {
    var someMagicalState = true;

    flyoutService.register({
      className: 'dynamic-flyout-test',
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


    // Make sure it disappears too
    testHelpers.fireMouseEvent($('body')[0], 'mousemove');
    expect(flyout.is(':visible')).to.be.false;
  });
});
