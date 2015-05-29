angular.module('dataCards.services').factory('FlyoutService', function(WindowState, Assert) {
  'use strict';

  var handlers = {};
  var uberFlyout;
  var uberFlyoutContent;
  var hintWidth;
  var hintHeight;
  var windowPadding = 26; // Keep flyout this many pixels away from edge of window

  // To support refreshFlyout, we have an additional stream of mouse positions
  // that replays events from WindowState.mousePositionSubject when needed.
  var replayedMousePositionSubject = new Rx.Subject();

  Rx.Observable.merge(
    WindowState.mousePositionSubject,
    replayedMousePositionSubject
  ).subscribe(function(e) {

    var className = null;
    var classList;
    var classCount;
    var i;
    var handlerCount;
    var j;
    var handler;
    var flyoutContent;
    var flyoutWidth;
    var flyoutHeight;
    var flyoutElement;
    var horizontalHint;
    var rightSideHint;
    var targetBoundingClientRect;

    if (!_.isEmpty(uberFlyout)) {

      // This is a double-fisted workaround for IE9:
      //
      // 1. SVG elements apparently do not have classNames
      // 2. IE9 does not support <DOM Element>.classList
      //
      // We used to use a polyfill for classList, but the
      // polyfill itself would have required a polyfill,
      // so we chose to just do this the messy way instead.

      if (typeof e.target.className === 'string') {
        className = e.target.className;
      } else {
        className = e.target.className.animVal;
      }

      if (e.target !== null && className !== null) {

        classList = (className === '') ? [] : className.split(/\s+/);
        classCount = classList.length;

        for (i = 0; i < classCount; i++) {

          className = classList[i];

          if (handlers.hasOwnProperty(className)) {

            handlerCount = handlers[className].length;

            for (j = 0; j < handlerCount; j++) {

              handler = handlers[className][j];

              flyoutElement = handler.positionOn(e.target);
              flyoutContent = handler.render(flyoutElement);

              if (_.isDefined(flyoutContent)) {

                uberFlyoutContent.html(flyoutContent);

                flyoutWidth = uberFlyout.outerWidth();
                flyoutHeight = uberFlyout.outerHeight();

                horizontalHint = handler.horizontal;
                rightSideHint = false;

                var css = {right: '', left: ''};

                // Hints can be horizontal or cursor-tracking, but not both.

                if (horizontalHint) {

                  targetBoundingClientRect = flyoutElement.getBoundingClientRect();

                  css.left = (targetBoundingClientRect.left) -
                    (flyoutWidth + Math.floor(hintWidth * 0.5));

                  css.top = (targetBoundingClientRect.top +
                             Math.floor(targetBoundingClientRect.height / 2)) -
                            Math.floor(flyoutHeight / 2);

                  rightSideHint = true;

                } else  {

                  var $flyoutHint = $('#uber-flyout').find('.hint');

                  // If we are near the right edge of the window, fix flyout to the right edge of
                  // the window (+ padding) and adjust the offset of the hint arrow to point at the
                  // proper segment.
                  var clampFlyoutToEdgeOfWindow = function() {
                    var rightEdgeOfFlyout = css.left + flyoutWidth;
                    var windowWidth = $(window).width();
                    if (rightEdgeOfFlyout >= windowWidth - windowPadding) {
                      rightSideHint = true;
                      var offsetForFlyoutHint = rightEdgeOfFlyout - windowWidth + windowPadding
                      offsetForFlyoutHint -= $flyoutHint.width() / 2 + 2;
                      $flyoutHint.css('left', offsetForFlyoutHint);
                      css.right = windowPadding;
                      css.left = '';
                    }
                  }

                  $flyoutHint.css('left', '');
                  $flyoutHint.css('right', '');

                  if (handler.trackCursor) {

                    // Subtract the flyout's height so that flyout hovers above,
                    // and the hint points to, the cursor.
                    css.left = e.clientX;
                    css.top = e.clientY - (flyoutHeight + Math.floor(hintHeight * 0.75));

                    if (css.left + flyoutWidth > window.innerWidth) {
                      css.left = css.left - flyoutWidth;
                      rightSideHint = true;
                      $flyoutHint.css('right', -10);
                    }

                    if (css.top - flyoutHeight < 0) {
                      css.top = flyoutHeight;
                    }

                  } else {

                    targetBoundingClientRect = flyoutElement.getBoundingClientRect();

                    css.left = (targetBoundingClientRect.left)
                               + Math.floor(targetBoundingClientRect.width / 2);

                    clampFlyoutToEdgeOfWindow();

                    css.top = (targetBoundingClientRect.top)
                              - (flyoutHeight + Math.floor(hintHeight * 0.5));

                    if (css.top < 0) {
                      css.top = 0;
                    }
                  }
                }

                uberFlyout.
                  toggleClass('left', !rightSideHint).
                  toggleClass('right', rightSideHint).
                  toggleClass('horizontal', horizontalHint).
                  css(css).
                  show();

                return;

              }
            }
          }
        }
      }

      uberFlyout.hide();

    }
  });

  WindowState.mouseLeftButtonPressedSubject.subscribe(function(e) {
    if (!_.isEmpty(uberFlyout)) {
      uberFlyout.hide();
    }
  });

  // Ensure we only ever have one #uber-flyout
  $('#uber-flyout').remove();
  $('body').append('<div id="uber-flyout"><div class="content"></div><div class="hint"></div></div>');

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
