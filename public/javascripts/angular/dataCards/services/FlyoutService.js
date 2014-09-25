angular.module('dataCards.services').factory('FlyoutService', function(WindowState) {

  var handlers = {};
  var uberFlyout;
  var hintWidth;
  var hintHeight;


  WindowState.mousePositionSubject.subscribe(function(e) {

    var flyoutWidth;
    var flyoutHeight;
    var jqueryTarget;
    var jqueryTargetBoundingClientRect;
    var leftOffset;
    var scrollLeft = window.scrollX || window.pageXOffset;
    var scrollTop = window.scrollY || window.pageYOffset;
    var topOffset;
    var rightSideHint;
    var className = null;
    var classList;
    var i;
    var handlerCount;
    var j;

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

                rightSideHint = false;

                if (handlers[className][j].trackCursor) {

                  // Subtract the flyout's height so that flyout hovers above,
                  // and the hint points to, the cursor.
                  leftOffset = e.clientX;
                  topOffset = e.clientY - (flyoutHeight + Math.floor(hintHeight * 0.75));

                } else {

                  targetBoundingClientRect = e.target.getBoundingClientRect();

                  leftOffset = (targetBoundingClientRect.left)
                             + Math.floor(targetBoundingClientRect.width / 2);

                  topOffset = (targetBoundingClientRect.top)
                            - (flyoutHeight + Math.floor(hintHeight * 0.5));

                }

                if (leftOffset + flyoutWidth > window.innerWidth) {
                  leftOffset = leftOffset - flyoutWidth;
                  rightSideHint = true;
                }
                if (topOffset - flyoutHeight < 0) {
                  topOffset = flyoutHeight;
                }

                if (rightSideHint) {
                  uberFlyout.removeClass('left').addClass('right').css({left: leftOffset, top: topOffset}).show();
                } else {
                  uberFlyout.removeClass('right').addClass('left').css({left: leftOffset, top: topOffset}).show();
                }

              }
            }

            return;

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

  $('body').append('<div id="uber-flyout"><div class="content"></div><div class="hint"></div></div>');

  uberFlyout = $('#uber-flyout');
  uberFlyoutContent = uberFlyout.children('.content');
  hintWidth = uberFlyout.children('.hint').width();
  hintHeight = uberFlyout.children('.hint').height();

  return {
    // className is treated as unique in this context (should it be an id? maybe so!)
    // renderCallback should return a string that will be interpreted as HTML.
    register: function(className, renderCallback, trackCursor) {
      // TODO: Figure out what to do here. Should we be using ids instead of classes?
      // Or just warn that a duplicate selector has been found rather than throwing
      // an exception?
      if (trackCursor !== true) {
        trackCursor = false;
      }
      if (!handlers.hasOwnProperty(className)) {
        handlers[className] = [];
      }
      handlers[className].push({ render: renderCallback, trackCursor: trackCursor });
    }
  };

});
