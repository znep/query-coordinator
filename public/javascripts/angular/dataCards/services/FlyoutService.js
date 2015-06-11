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
    var flyoutContent;
    var flyoutWidth;
    var flyoutHeight;
    var flyoutTarget;
    var horizontalHint;
    var rightSideHint;
    var targetBoundingClientRect;
    var cssFlyout;

    if (!_.isEmpty(uberFlyout) && target) {

      // Find a selector that matches our target, if it exists.
      var selectorHandler = _.find(handlers, function(selectorHandlers, selector) {
        return $(target).is($(selector));
      });

      // If this selector exists, execute its handlers.
      if (selectorHandler) {
        _.each(selectorHandler, function(handler) {

          // Correctly position and render the flyout element
          flyoutTarget = handler.positionOn(target);
          flyoutContent = handler.render(flyoutTarget);

          // Check that the content is defined
          if (_.isDefined(flyoutContent) && _.isDefined(flyoutTarget)) {

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
              targetBoundingClientRect = flyoutTarget.getBoundingClientRect();

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
                targetBoundingClientRect = flyoutTarget.getBoundingClientRect();

                // Set the left of the flyout to the exact middle of the
                // target element.
                cssFlyout.left = targetBoundingClientRect.left +
                  (targetBoundingClientRect.width / 2);

                // If the right side of the flyout is past our
                // predefined WINDOW_PADDING, right-align the flyout.
                if (cssFlyout.left + flyoutWidth >= windowWidth - Constants.FLYOUT_WINDOW_PADDING) {
                  cssHint.left = cssFlyout.left -
                    (windowWidth - Constants.FLYOUT_WINDOW_PADDING - flyoutWidth);
                  cssFlyout.right = Constants.FLYOUT_WINDOW_PADDING;
                  cssFlyout.left = '';
                }

                // If hint is at least halfway across the flyout,
                // change its orientation.
                if (cssHint.left > flyoutWidth / 2) {
                  cssHint.left = cssHint.left - hintWidth;
                  rightSideHint = true;
                }

                // Set the top of the flyout.
                cssFlyout.top = targetBoundingClientRect.top -
                  (flyoutHeight + hintHeight) -
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
      } else {
        uberFlyout.hide();
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
  hintWidth = uberFlyout.children('.hint').outerWidth();
  hintHeight = uberFlyout.children('.hint').outerHeight();

  return {
    /**
     * Register a flyout under a CSS class.
     * @param {Object} options - A hash of options to control how the flyout
     * @param {string} options.selector - JQuery selector this flyout is attached to.
     *   Treated as unique in this context.
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
        selector: null,
        render: null,
        destroySignal: null,
        positionOn: _.identity,
        trackCursor: false,
        horizontal: false
      });

      Assert(_.isPresent(options.selector),
        'selector must be present.');
      Assert(_.isPresent(options.render),
        'render function must be present.');
      Assert(!_.isPresent(options.destroySignal) ||
        _.isFunction(options.destroySignal.asObservable),
        'destroySignal must be an observable.');
      Assert(options.trackCursor !== true || options.horizontal !== true,
        'cannot set both trackCursor and horizontal modes on the same flyout.');

      // TODO: Figure out what to do here. Should we be using ids instead of classes?
      // Or just warn that a duplicate selector has been found rather than throwing
      // an exception?
      if (!handlers.hasOwnProperty(options.selector)) {
        handlers[options.selector] = [];
      }

      var handler = _.clone(options);

      handlers[options.selector].push(handler);

      if (_.isPresent(options.destroySignal)) {
        options.destroySignal.asObservable().take(1).subscribe(function() {
          _.pull(handlers[options.selector], handler);
        });
      }
    },
    deregister: function(selector, renderCallback) {
      if (handlers.hasOwnProperty(selector)) {
        handlers[selector] = handlers[selector].filter(function(handler) {
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
