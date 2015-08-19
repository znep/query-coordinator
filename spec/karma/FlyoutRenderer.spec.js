describe('FlyoutRenderer', function() {

  var storyteller = window.socrata.storyteller;
  var flyoutRenderer;
  var targetElement;
  var flyoutContent;
  var flyoutData;
  var flyoutElement;

  beforeEach(function() {

    flyoutRenderer = new storyteller.FlyoutRenderer();

    // Until we manage to integrate styles into `karma-sprockets`,
    // apply styles to #socrata-flyout and its children in order to
    // make it renderable and positionable.
    testDom.append(
      $('<style>').text(
        '#socrata-flyout { position:fixed; max-width: 35rem; word-wrap: break-word; white-space: normal; visibility: hidden; border: 1px solid #ccc; background-color: #f1eeee; }' +
        '#socrata-flyout.visible { visibility: visible; }' +
        '.socrata-flyout-content { padding: 0.5rem 1rem; }' +
        '.socrata-flyout-table { width: 100%; }' +
        '.socrata-flyout-cell:nth-child(2) { padding-left: 1.5rem; text-align: right; white-space: nowrap; }' +
        '.socrata-flyout-hint { position: absolute; height: 10px; width: 10px; border: 0; background-color: #f1eeee; }'
      )
    );

    targetElement = $('<div>').css({
      position: 'absolute',
      width: 200,
      height: 50,
      textAlign: 'center',
      lineHeight: '50px',
      backgroundColor: 'grey'
    }).text('FLYOUT TARGET');

    window.testDom.append(targetElement);

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
      element: targetElement[0],
      content: flyoutContent,
      rightSideHint: false,
      belowTarget: false
    };

    flyoutElement = $('#socrata-flyout');
  });

  it('renders a flyout with the specified values', function() {

    targetElement.css({
      left: 0,
      top: 300
    });

    flyoutRenderer.renderFlyout(flyoutData);

    assert.match(flyoutElement.text(), /TITLE/);
    assert.match(flyoutElement.text(), /Total/);
    assert.match(flyoutElement.text(), /1K rows/);
  });

  describe('when the specified element is not near the right edge of the window', function() {

    it('positions the flyout left-aligned to the center the specified element', function() {

      targetElement.css({
        left: 0,
        top: 300
      });

      flyoutRenderer.renderFlyout(flyoutData);

      assert.equal(parseInt(flyoutElement.css('left'), 10), 100);
      assert.isBelow(parseInt(flyoutElement.css('top'), 10), parseInt(targetElement.css('top'), 10));
    });
  });

  describe('when the specified element is not near the right edge of the window', function() {

    it('positions the flyout right-aligned with the right edge of the window minus padding', function() {

      targetElement.css({
        right: 0,
        top: 300
      });

      var targetElementBoundingClientRect = targetElement[0].getBoundingClientRect();
      var targetElementMidPoint = targetElementBoundingClientRect.left + (targetElementBoundingClientRect.width / 2);

      flyoutRenderer.renderFlyout(flyoutData);

      assert.isBelow(parseInt(flyoutElement.css('left'), 10), $(window).width());
      assert.isBelow(parseInt(flyoutElement.css('left'), 10), targetElementMidPoint);
      assert.isBelow(parseInt(flyoutElement.css('top'), 10), parseInt(targetElement.css('top'), 10));
    });
  });
});
