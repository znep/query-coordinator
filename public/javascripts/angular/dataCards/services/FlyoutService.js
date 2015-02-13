angular.module('dataCards.services').factory('FlyoutService', function(WindowState) {
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

    var className = null;
    var classList;
    var classCount;
    var i;
    var handlerCount;
    var j;
    var flyoutContent;
    var flyoutWidth;
    var flyoutHeight;
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

              flyoutContent = handlers[className][j].render(e.target)

              if (_.isDefined(flyoutContent)) {

                uberFlyoutContent.html(flyoutContent);

                flyoutWidth = uberFlyout.outerWidth();
                flyoutHeight = uberFlyout.outerHeight();

                horizontalHint = handlers[className][j].horizontal;
                rightSideHint = false;

                var css = {right: '', left: ''};


                // Hints can be horizontal or cursor-tracking, but not both.

                if (horizontalHint) {

                  targetBoundingClientRect = e.target.getBoundingClientRect();

                  css.left = (targetBoundingClientRect.left) -
                    (flyoutWidth + Math.floor(hintWidth * 0.5));

                  css.top = (targetBoundingClientRect.top +
                             Math.floor(targetBoundingClientRect.height / 2)) -
                            Math.floor(flyoutHeight / 2);

                  rightSideHint = true;

                } else  {

                  if (handlers[className][j].trackCursor) {

                    // Subtract the flyout's height so that flyout hovers above,
                    // and the hint points to, the cursor.
                    css.left = e.clientX;
                    css.top = e.clientY - (flyoutHeight + Math.floor(hintHeight * 0.75));

                    if (css.left + flyoutWidth > window.innerWidth) {
                      css.left = css.left - flyoutWidth;
                      rightSideHint = true;
                    }
                    if (css.top - flyoutHeight < 0) {
                      css.top = flyoutHeight;
                    }

                  } else {

                    targetBoundingClientRect = e.target.getBoundingClientRect();

                    css.left = (targetBoundingClientRect.left)
                               + Math.floor(targetBoundingClientRect.width / 2);

                    css.top = (targetBoundingClientRect.top)
                              - (flyoutHeight + Math.floor(hintHeight * 0.5));

                    if (css.left + flyoutWidth > window.innerWidth) {
                      css.right = $(window).width() - css.left;
                      css.left = '';
                      rightSideHint = true;
                    }
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
     * @param {string} className: CSS class this flyout is attached to.
     *                            Treated as unique in this context (should it be an id? maybe so!)
     * @param {function} renderCallback: Called to render the flyout. Should return a string that
     *                                    will be interpreted as HTML.
     * @param {Observable} destroySignal: The flyout handler will be destroyed when this sequence
     *                                    first emits.
     *                                    Temporary hack to prevent severe memory leaks, ideally we
     *                                    would not store the handlers in a global object.
     * @param {boolean} trackCursor: Whether or not the flyout should track the mouse.
     *                               Optional, default false.
     * @param {boolean} horizontal: Whether or not the flyout should lay out horizontally.
     *                               Optional, default false (vertical).
     */
    register: function(className, renderCallback, destroySignal, trackCursor, horizontal) {
      if (!_.isFunction(destroySignal.asObservable)) {
        throw new Error('Flyouts must be given a destroySignal Observable.');
      }

      if (trackCursor !== true) {
        trackCursor = false;
      }
      if (horizontal !== true) {
        horizontal = false;
      }

      if (trackCursor === true && horizontal === true) {
        throw new Error('Cannot set both trackCursor and horizontal modes on the same flyout.');
      }

      // TODO: Figure out what to do here. Should we be using ids instead of classes?
      // Or just warn that a duplicate selector has been found rather than throwing
      // an exception?
      if (!handlers.hasOwnProperty(className)) {
        handlers[className] = [];
      }

      var handler = { render: renderCallback, trackCursor: trackCursor, horizontal: horizontal };

      handlers[className].push(handler);

      destroySignal.asObservable().take(1).subscribe(function() {
        _.pull(handlers[className], handler);
      });
    },
    // Flyout handlers are typically rechecked on mouse movement. If you've made changes to the handlers or their
    // source data and want to see the changes immediately, this function will force a refresh.
    refreshFlyout: function() {
      replayedMousePositionSubject.onNext(WindowState.mousePositionSubject.value);
    }
  };

});
