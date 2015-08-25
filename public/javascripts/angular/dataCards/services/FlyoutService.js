angular.module('dataCards.services').factory('FlyoutService', function(Constants, WindowState) {
  'use strict';

  var handlers = {};
  var uberFlyout;
  var uberFlyoutContent;
  var hintWidth;
  var hintHeight;
  var target;
  var mouseX;
  var mouseY;
  var persistOnMousedown;

  // To support refreshFlyout, we have an additional stream of mouse positions
  // that replays events from WindowState.mousePositionSubject when needed.
  var replayedMousePositionSubject = new Rx.Subject();

  // Only update the saved target and mouse position on
  // these observables.
  Rx.Observable.merge(
    WindowState.mousePositionSubject,
    replayedMousePositionSubject
  ).doAction(function(e) {
    target = e.target;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }).merge(
    WindowState.scrollPositionSubject
  ).subscribe(function() {

    var flyoutContent;
    var flyoutWidth;
    var flyoutHeight;
    var flyoutTarget;
    var flyoutOffset;
    var horizontalHint;
    var rightSideHint;
    var targetBoundingClientRect;
    var cssFlyout;

    if (!_.isEmpty(uberFlyout) && target) {

      // Work-around for browsers with no pointer-event support.
      target = targetUnder();

      // Find a selector that matches our target, if it exists.
      var selectorHandler = _.find(handlers, function(selectorHandlers, selector) {
        return $(target).is($(selector));
      });

      // If this selector exists, execute its handlers.
      if (selectorHandler) {
        _.each(selectorHandler, function(handler) {

          // Correctly position and render the flyout target
          flyoutTarget = handler.positionOn(target);
          flyoutContent = handler.render(target, flyoutTarget);
          flyoutOffset = handler.getOffset(target);

          // Correctly update behavior on mousedown based on current flyout options.
          persistOnMousedown = handler.persistOnMousedown;

          // Check that the content is defined
          if (_.isDefined(flyoutContent) && (_.isDefined(flyoutTarget) || _.isDefined(flyoutOffset))) {

            uberFlyoutContent.html(flyoutContent);

            // Calculating the width and height of the flyout may depend on
            // custom classes that the consumer wants to apply, so reset those.
            uberFlyout.removeClass().addClass(handler.classes);
            flyoutWidth = uberFlyout.outerWidth();
            flyoutHeight = uberFlyout.outerHeight();

            horizontalHint = handler.horizontal;
            rightSideHint = false;

            cssFlyout = {
              right: '',
              left: ''
            };

            // Hints can be horizontal or cursor-tracking, but not both
            if (horizontalHint && flyoutTarget) {
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

              // Set the left and top of flyout depending on its type
              if (handler.trackCursor || _.isDefined(flyoutOffset)) {

                var left = _.get(flyoutOffset, 'x', mouseX);
                var top = _.get(flyoutOffset, 'y', mouseY);

                // Position the flyout perfectly so that the hint points
                // to the cursor pointer.
                cssFlyout.left = left;
                cssFlyout.top = top - flyoutHeight - hintHeight -
                  Constants.FLYOUT_BOTTOM_PADDING;
              } else {
                targetBoundingClientRect = flyoutTarget.getBoundingClientRect();

                // Set the left of the flyout to the exact middle of the
                // target element.
                cssFlyout.left = targetBoundingClientRect.left +
                  (targetBoundingClientRect.width / 2);

                // Set the top of the flyout, depending on whether the flyout
                // should be positioned above or below the target.
                if (handler.belowTarget) {
                  cssFlyout.top = targetBoundingClientRect.bottom +
                    hintHeight +
                    Constants.FLYOUT_TOP_PADDING;
                } else {
                  cssFlyout.top = targetBoundingClientRect.top -
                    (flyoutHeight + hintHeight) -
                    Constants.FLYOUT_BOTTOM_PADDING;
                }
              }

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

              // If top of flyout is cut off by window,
              // top-align the flyout.
              if (cssFlyout.top < 0) {
                cssFlyout.top = 0;
              }

              // Apply css to flyout hint.
              $flyoutHint.css(cssHint);
            }

            // Show the uber flyout.
            uberFlyout.
              toggleClass('southwest', !rightSideHint && !handler.belowTarget).
              toggleClass('southeast', rightSideHint && !handler.belowTarget).
              toggleClass('northwest', !rightSideHint && handler.belowTarget).
              toggleClass('northeast', rightSideHint && handler.belowTarget).
              toggleClass('horizontal', horizontalHint).
              css(cssFlyout).
              show();

            return;
          }
        });
      } else {
        hide();
      }
    }
  });

  // Hide upon click if flyout is set to do so
  WindowState.mouseLeftButtonPressedSubject.subscribe(function() {
    if (!_.isEmpty(uberFlyout) && !persistOnMousedown) {
      hide();
    }
  });

  // Ensure we only ever have one #uber-flyout
  $('#uber-flyout').remove();
  $('body').append('<div id="uber-flyout">' +
    '<div class="content"></div><div class="hint"></div>' +
    '</div>');

  uberFlyout = $('#uber-flyout');
  hide();
  uberFlyoutContent = uberFlyout.children('.content');
  hintWidth = uberFlyout.children('.hint').outerWidth();
  hintHeight = uberFlyout.children('.hint').outerHeight();

  // If pointer-events are not supported and we are hovering over the
  // flyout, this hack will get the target element underneath it.
  function targetUnder() {
    var mouseoverFlyout = uberFlyout.has($(target)).length > 0;

    if (!Modernizr.pointerEvents && mouseoverFlyout) {
      hide();
      target = document.elementFromPoint(mouseX, mouseY);
      uberFlyout.show();
    }
    return target;
  }

  // Hides the flyout
  function hide() {
    uberFlyout.hide();
  }

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
     * @param {Function} options.getOffset - A function that returns an object
     *   containing x and y keys (in screen coordinates). The flyout will be
     *   positioned at these coordinates.
     * @param {boolean} [options.trackCursor=false] - Whether or not the flyout
     *   should track the mouse. Optional, default false.
     * @param {boolean} [options.horizontal=false] - Whether or not the flyout
     *   should lay out horizontally. Optional, default false (vertical).
     * @param {boolean} [options.belowTarget=false] - Whether or not the flyout
     *   should position below its target. Optional, default false (above).
     * @param {string} options.classes — Custom classes, space-separated, to be
     *   applied to the flyout, in order to enable style overrides.
     * @param {string} options.persistOnMousedown — Whether or not the flyout
     *   should be hidden upon mousedown. Set to true if default to hide
     *   should be overridden and flyout should persist through mousedown.
     */
    register: function(options) {

      options = _.defaults(options || {}, {
        selector: null,
        render: null,
        destroySignal: null,
        positionOn: _.identity,
        getOffset: _.noop,
        trackCursor: false,
        horizontal: false,
        belowTarget: false,
        classes: null,
        persistOnMousedown: false
      });

      window.socrata.utils.assert(_.isPresent(options.selector),
        'selector must be present.');
      window.socrata.utils.assert(_.isPresent(options.render),
        'render function must be present.');
      window.socrata.utils.assert(!_.isPresent(options.destroySignal) ||
        _.isFunction(options.destroySignal.asObservable),
        'destroySignal must be an observable.');
      window.socrata.utils.assert(options.trackCursor !== true ||
        options.horizontal !== true,
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
    /**
     * Deregister an existing, previously registered flyout.
     */
    deregister: function(selector, renderCallback) {
      if (handlers.hasOwnProperty(selector)) {
        handlers[selector] = handlers[selector].filter(function(handler) {
          return handler.render !== renderCallback;
        });
      }
    },
    // Flyout handlers are typically rechecked on mouse movement.
    // If you've made changes to the handlers or their source data
    // and want to see the changes immediately, this function
    // will force a refresh.
    refreshFlyout: function(value) {
      value = value || WindowState.mousePositionSubject.value;
      replayedMousePositionSubject.onNext(value);
    },
    targetUnder: targetUnder,
    hide: hide
  };
});
