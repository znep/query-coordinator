describe('FlyoutRenderer', function() {

  var flyoutRenderer;
  var $targetElement;
  var flyoutContent;
  var flyoutData;
  var flyoutElement;

  beforeEach(function() {

    flyoutRenderer = new window.socrata.visualizations.FlyoutRenderer();

    $targetElement = $('<div>').css({
      position: 'absolute',
      width: 200,
      height: 50,
      textAlign: 'center',
      lineHeight: '50px',
      backgroundColor: 'grey'
    }).text('FLYOUT TARGET');

    $('body').append($targetElement);

    // This is actually constructed by the visualization emitting the render
    // flyout event, and is substituted into the body of the flyout by the
    // flyout renderer.
    flyoutContent = $(
      '<div class="socrata-flyout-title">TITLE</div>' +
      '<table class="socrata-flyout-table">' +
        '<tbody>' +
          '<tr class="socrata-flyout-row">' +
            '<td class="socrata-flyout-cell">Total</td>' +
            '<td class="socrata-flyout-cell">1K rows</td>' +
          '</tr>' +
        '</tbody>' +
      '</table>'
    );

    flyoutData = {
      element: $targetElement[0],
      content: flyoutContent,
      rightSideHint: false,
      belowTarget: false
    };

    flyoutElement = $('#socrata-flyout');
  });

  afterEach(function() {
    flyoutRenderer.clear();
    $targetElement.remove();
  });

  it('renders a flyout with the specified values', function() {

    $targetElement.css({
      left: 0,
      top: 300
    });

    flyoutRenderer.render(flyoutData);

    assert.match(flyoutElement.text(), /TITLE/);
    assert.match(flyoutElement.text(), /Total/);
    assert.match(flyoutElement.text(), /1K rows/);
  });

  describe('when the specified element is not near the right edge of the window', function() {

    it('positions the flyout left-aligned to the center the specified element', function() {

      $targetElement.css({
        left: 0,
        top: 300
      });

      flyoutRenderer.render(flyoutData);

      assert.equal(parseInt(flyoutElement.css('left'), 10), 100);
      assert.isBelow(parseInt(flyoutElement.css('top'), 10), parseInt($targetElement.css('top'), 10));
    });
  });

  describe('when the specified element is not near the right edge of the window', function() {

    it('positions the flyout right-aligned with the right edge of the window minus padding', function() {

      $targetElement.css({
        right: 0,
        top: 300
      });

      var $targetElementBoundingClientRect = $targetElement[0].getBoundingClientRect();
      var $targetElementMidPoint = $targetElementBoundingClientRect.left + ($targetElementBoundingClientRect.width / 2);

      flyoutRenderer.render(flyoutData);

      assert.isBelow(parseInt(flyoutElement.css('left'), 10), $(window).width());
      assert.isBelow(parseInt(flyoutElement.css('left'), 10), $targetElementMidPoint);
      assert.isBelow(parseInt(flyoutElement.css('top'), 10), parseInt($targetElement.css('top'), 10));
    });
  });
});
