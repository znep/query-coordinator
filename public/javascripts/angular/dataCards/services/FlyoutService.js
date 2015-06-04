angular.module('dataCards.services').factory('FlyoutService', function(Constants, WindowState, Assert) {
  'use strict';

  var handlers = {};
  var uberFlyout;
  var uberFlyoutContent;
  var hintWidth;
  var hintHeight;

  // To support refreshFlyout, we have an additional stream of mouse positions
  // that replays events from WindowState.mousePositionSubject when needed.
  var replayedMousePositionSubject = new Rx.Subject();

  Rx.Observable.merge(
    WindowState.mousePositionSubject,
    replayedMousePositionSubject
  ).subscribe(function(e) {

    var target = e.target;
    var className = null;
    var classList;
    var flyoutContent;
    var flyoutWidth;
    var flyoutHeight;
    var flyoutElement;
    var horizontalHint;
    var rightSideHint;
    var targetBoundingClientRect;
    var cssFlyout;

    if (!_.isEmpty(uberFlyout)) {

      // First hide any existing flyout
      uberFlyout.hide();

      // This is a double-fisted workaround for IE9:
      //
      // 1. SVG elements apparently do not have classNames
      // 2. IE9 does not support <DOM Element>.classList
      //
      // We used to use a polyfill for classList, but the
      // polyfill itself would have required a polyfill,
      // so we chose to just do this the messy way instead.

      if (typeof target.className === 'string') {
        className = target.className;
      } else {
        className = target.className.animVal;
      }

      if (!_.isNull(target) && !_.isEmpty(className)) {
        classList = className.split(/\s+/);

        // For each handler on each class in classList
        _.each(classList, function(classProp) {
          if (handlers.hasOwnProperty(classProp)) {
            _.each(handlers[classProp], function(handler) {

              // Save the flyout element and content
              flyoutElement = handler.positionOn(target);
              flyoutContent = handler.render(flyoutElement);

              // Check that the content is defined
              if (_.isDefined(flyoutContent)) {

                uberFlyoutContent.html(flyoutContent);
                flyoutWidth = uberFlyout.outerWidth();
                flyoutHeight = uberFlyout.outerHeight();

                horizontalHint = handler.horizontal;
                rightSideHint = false;

                cssFlyout = {
                  right: '',
                  left: ''
                };

                // Hints can be horizontal or cursor-tracking, but not both
                if (horizontalHint) {

                  targetBoundingClientRect = flyoutElement.getBoundingClientRect();

                  cssFlyout.left = targetBoundingClientRect.left -
                    flyoutWidth + Math.floor(hintWidth / 2);

                  cssFlyout.top = targetBoundingClientRect.top +
                    Math.floor(targetBoundingClientRect.height / 2) -
                    Math.floor(flyoutHeight / 2);

                  rightSideHint = true;

                // If hint is not horizontal
                } else {

                  // Use $(window).width() instead of window.innerWidth because
                  // the latter includes scrollbars depending on the browser.
                  var windowWidth = $(window).width();
                  var $flyoutHint = $('#uber-flyout').find('.hint');
                  var cssHint = {
                    left: '',
                    right: ''
                  };

                  // Check if cursor tracking
                  if (handler.trackCursor) {

                    // Position the flyout perfectly so that the hint points
                    // to the cursor pointer.
                    cssFlyout.left = e.clientX;
                    cssFlyout.top = e.clientY - flyoutHeight - hintHeight -
                      Constants.FLYOUT_BOTTOM_PADDING;

                    // If the right side of the flyout will be cut off
                    // by the window, right-align the flyout.
                    if (cssFlyout.left + flyoutWidth > windowWidth) {
                      cssFlyout.left -= flyoutWidth;
                      cssHint.right = 0;
                      rightSideHint = true;
                    }

                    // If the top of the flyout will be cut off
                    // by the window, top-align the flyout.
                    if (cssFlyout.top - flyoutHeight < 0) {
                      cssFlyout.top = flyoutHeight;
                    }

                  } else {
                    targetBoundingClientRect = flyoutElement.getBoundingClientRect();

                    // Set the left of the flyout to the exact middle of the
                    // target element.
                    cssFlyout.left = targetBoundingClientRect.left
                      + Math.floor(targetBoundingClientRect.width / 2);

                    var hintOffsest = Math.round(cssFlyout.left +
                      flyoutWidth + Constants.FLYOUT_WINDOW_PADDING - windowWidth);

                    // If the right side of the flyout is past our
                    // predefined WINDOW_PADDING, right-align the flyout.
                    if (hintOffsest >= 0) {
                      cssFlyout.right = Constants.FLYOUT_WINDOW_PADDING;
                      cssFlyout.left = '';
                      cssHint.left = hintOffsest;
                    }

                    // If hint is at least halfway across the flyout,
                    // change its orientation.
                    if (hintOffsest > Math.floor(flyoutWidth / 2)) {
                      cssHint.left = hintOffsest - hintWidth;
                      rightSideHint = true;
                    }

                    // If hint is past the flyoutWidth, stick it to
                    // the right of the flyout.
                    if (flyoutWidth - hintOffsest <=
                      Constants.FLYOUT_ERROR_THRESHOLD) {
                      cssHint.left = '';
                      cssHint.right = 0;
                    }

                    // Set the top of the flyout.
                    cssFlyout.top = targetBoundingClientRect.top -
                      (flyoutHeight + Math.floor(hintHeight / 2)) -
                      Constants.FLYOUT_BOTTOM_PADDING;

                    // If top of flyout is cut off by window,
                    // top-align the flyout.
                    if (cssFlyout.top < 0) {
                      cssFlyout.top = 0;
                    }
                  }

                  // Apply css to flyout hint.
                  $flyoutHint.css(cssHint);
                }

                // Show the uber flyout.
                uberFlyout.
                  toggleClass('left', !rightSideHint).
                  toggleClass('right', rightSideHint).
                  toggleClass('horizontal', horizontalHint).
                  css(cssFlyout).
                  show();

                return;
              }
            });
          }
        });
      }
    }
  });

  WindowState.mouseLeftButtonPressedSubject.subscribe(function(e) {
    if (!_.isEmpty(uberFlyout)) {
      uberFlyout.hide();
    }
  });

  // Ensure we only ever have one #uber-flyout
  $('#uber-flyout').remove();
  $('body').append('<div id="uber-flyout">' +
    '<div class="content"></div><div class="hint"></div>' +
    '</div>');

  uberFlyout = $('#uber-flyout');
  uberFlyoutContent = uberFlyout.children('.content');
  hintWidth = uberFlyout.children('.hint').width();
  hintHeight = uberFlyout.children('.hint').height();

  return {
    /**
     * Register a flyout under a CSS class.
     * @param {Object} options - A hash of options to control how the flyout
     * @param {string} options.className - CSS class this flyout is attached to.
     *   Treated as unique in this context (should it be an id? maybe so!).
     *   Required.
     * @param {function} options.render - Called to render the flyout. Should
     *   return a string that will be interpreted as HTML. Required.
     * @param {Observable} options.destroySignal - The flyout handler will be
     *   destroyed when this sequence first emits. Temporary hack to prevent
     *   severe memory leaks, ideally we would not store the handlers globally.
     *   Optional, default null.
     * @param {Function} options.positionOn - A function that returns an HTML
     *   element to position the flyout over. This can be used to trigger a
     *   flyout on a certain element but render it over a different one.
     *   Optional, default _.identity.
     * @param {boolean} [options.trackCursor=false] - Whether or not the flyout
     *   should track the mouse. Optional, default false.
     * @param {boolean} [options.horizontal=false] - Whether or not the flyout
     *   should lay out horizontally. Optional, default false (vertical).
     */
    register: function(options) {

      options = _.defaults(options || {}, {
        className: null,
        render: null,
        destroySignal: null,
        positionOn: _.identity,
        trackCursor: false,
        horizontal: false
      });

      Assert(_.isPresent(options.className), 'className must be present.');
      Assert(_.isPresent(options.render), 'render function must be present.');
      Assert(!_.isPresent(options.destroySignal) ||
        _.isFunction(options.destroySignal.asObservable), 'destroySignal must be an observable.');
      Assert(options.trackCursor !== true || options.horizontal !== true,
        'Cannot set both trackCursor and horizontal modes on the same flyout.');

      // TODO: Figure out what to do here. Should we be using ids instead of classes?
      // Or just warn that a duplicate selector has been found rather than throwing
      // an exception?
      if (!handlers.hasOwnProperty(options.className)) {
        handlers[options.className] = [];
      }

      var handler = _.clone(options);

      handlers[options.className].push(handler);

      if (_.isPresent(options.destroySignal)) {
        options.destroySignal.asObservable().take(1).subscribe(function() {
          _.pull(handlers[options.className], handler);
        });
      }
    },
    deregister: function(className, renderCallback) {
      if (handlers.hasOwnProperty(className)) {
        handlers[className] = handlers[className].filter(function(handler) {
          return handler.render !== renderCallback;
        });
      }
    },
    // Flyout handlers are typically rechecked on mouse movement. If you've made changes to the handlers or their
    // source data and want to see the changes immediately, this function will force a refresh.
    refreshFlyout: function() {
      replayedMousePositionSubject.onNext(WindowState.mousePositionSubject.value);
    }
  };
});
