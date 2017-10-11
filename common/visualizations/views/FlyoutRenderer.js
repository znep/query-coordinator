const $ = require('jquery');
const _ = require('lodash');

/**
 * Common flyout renderer.
 * constructorOptions - Options hash, optional.
 *   Keys:
 *     * inheritTextStyle:
 *       If false, applies uniform styling to text. Otherwise, it inherits text styling
 *       from page CSS (usually Styleguide).
 *       Default: true.
 *
 */
function FlyoutRenderer(constructorOptions) {

  var FLYOUT_WINDOW_PADDING = 22;
  var FLYOUT_BOTTOM_PADDING = 1;
  var FLYOUT_TOP_PADDING = 10;

  var _window = $(window);
  var _flyout;
  var _flyoutContent;
  var _flyoutHint;

  constructorOptions = _.merge(
    {
      inheritTextStyle: true
    },
    constructorOptions
  );

  // Defer render until the document is ready.
  $(function() {
    _renderFlyoutTemplate();
    _hideFlyout();
  });

  /**
   * Public methods
   */

  this.render = function(options) {
    _renderFlyoutData(options);
  };

  this.clear = function() {
    _hideFlyout();
  };

  /**
   * Private methods
   */

  function _renderFlyoutTemplate() {
    if ($('#socrata-flyout').length === 0) {
      var flyoutContent = $(
        '<div>',
        {
          'class': 'socrata-flyout-content'
        }
      );

      var flyoutHint = $(
        '<div>',
        {
          'class': 'socrata-flyout-hint'
        }
      );

      var flyout = $(
        '<div>',
        {
          id: 'socrata-flyout',
          'class': constructorOptions.inheritTextStyle ? '' : 'built-in-text-style'
        }
      ).append([
        flyoutContent,
        flyoutHint
      ]);

      _flyout = flyout;
      _flyoutContent = flyoutContent;
      _flyoutHint = flyoutHint;

      // NOTE: Using body creates a situation where it's
      //      not possible to position certain elements above
      //      the flyout, when desired, because the element
      //      lives in a lower z-index context. See .user-story-container
      $('body').append(flyout);
    } else {
      _flyout = $('#socrata-flyout');
      _flyoutContent = _flyout.find('.socrata-flyout-content');
      _flyoutHint = _flyout.find('.socrata-flyout-hint');
    }
  }

  /**
   * This is a jQuery event handler that responds to `.trigger()`, so the
   * second argument is expected and contains the payload of the event.
   */
  function _renderFlyoutData(options) {

    var content = options.content;
    var flyoutOffset = options.flyoutOffset;
    var belowTarget = options.belowTarget;
    var rightSideHint = options.rightSideHint;
    var windowWidth;
    var flyoutWidth;
    var flyoutHeight;
    var flyoutHintHeight;
    var flyoutStyles = {
      left: '',
      top: ''
    };
    var flyoutHintStyles = {
      left: '',
      top: ''
    };
    var flyoutTargetBoundingClientRect;
    var flyoutRightEdge;
    var windowRightEdgeMinusPadding;

    // Reset the left position so that width calculations are not
    // affected by text flow.
    _flyout.css('left', 0);
    _flyoutContent.html(content);

    // Use $(window).width() instead of window.innerWidth because
    // the latter includes scrollbars depending on the browser.
    windowWidth = _window.width();
    flyoutWidth = _flyout.outerWidth(true);
    flyoutHeight = _flyout.outerHeight(true);
    flyoutHintHeight = _flyoutHint.outerHeight(true);

    // Set the left and top of flyout depending on its type
    if (flyoutOffset) {

      // Position the flyout so that the hint points to the current
      // location of the cursor.
      flyoutStyles.left = flyoutOffset.left;
      flyoutStyles.top = flyoutOffset.top -
        flyoutHeight -
        flyoutHintHeight -
        FLYOUT_BOTTOM_PADDING;

    } else {

      flyoutTargetBoundingClientRect = options.element.getBoundingClientRect();

      // Set the left of the flyout to the exact middle of the
      // target element.
      flyoutStyles.left = flyoutTargetBoundingClientRect.left +
        (flyoutTargetBoundingClientRect.width / 2);

      // Set the top of the flyout, depending on whether the flyout
      // should be positioned above or below the target.
      if (belowTarget) {

        flyoutStyles.top = flyoutTargetBoundingClientRect.bottom +
          flyoutHintHeight +
          FLYOUT_TOP_PADDING;

      } else {

        flyoutStyles.top = flyoutTargetBoundingClientRect.top -
          (flyoutHeight + flyoutHintHeight) -
          FLYOUT_BOTTOM_PADDING;
      }
    }

    flyoutRightEdge = flyoutStyles.left + flyoutWidth;
    windowRightEdgeMinusPadding = windowWidth - FLYOUT_WINDOW_PADDING;

    // If the right edge of the flyout will be drawn off the right edge of
    // the screen, move the flyout to the left until its right edge is flush
    // with the right edge of the screen less the FLYOUT_WINDOW_PADDING.
    if (flyoutRightEdge >= windowRightEdgeMinusPadding) {

      // Adjust the position of the hint first so that it remains centered
      // over the element.
      flyoutHintStyles.left = flyoutStyles.left -
        (windowRightEdgeMinusPadding - flyoutWidth);
      // Then move the left edge of the flyout content over until it is
      // correctly positioned.
      flyoutStyles.left -= (flyoutRightEdge - windowRightEdgeMinusPadding);
    }

    // If hint is at least halfway across the flyout, change its orientation.
    if (flyoutHintStyles.left > flyoutWidth / 2) {

      flyoutHintStyles.left = flyoutHintStyles.left - flyoutHintHeight;
      rightSideHint = true;
    }

    // If top of flyout is cut off by window, top-align the flyout.
    if (flyoutStyles.top < 0) {
      flyoutStyles.top = 0;

    }

    // There are certain changes we make for 'dark' flyouts.
    if (options.dark) {

      _flyout.addClass('dark');

      if (!rightSideHint) {
        // Account for the slight offset of the hint.
        flyoutStyles.left = flyoutStyles.left - 5;
      }
    } else {
      _flyout.removeClass('dark');
    }

    // Apply computed styles to the flyout hint.
    _flyoutHint.css(flyoutHintStyles);

    _flyout.
      toggleClass('southwest', !rightSideHint && !belowTarget).
      toggleClass('southeast', rightSideHint && !belowTarget).
      toggleClass('northwest', !rightSideHint && belowTarget).
      toggleClass('northeast', rightSideHint && belowTarget).
      css(flyoutStyles);

    _showFlyout();
  }

  function _showFlyout() {

    if (_flyout) {
      _flyout.addClass('visible');
    }
  }

  function _hideFlyout() {

    if (_flyout) {
      _flyout.removeClass('visible');
    }
  }
}

module.exports = FlyoutRenderer;
