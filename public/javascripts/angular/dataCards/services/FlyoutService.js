angular.module('dataCards.services').factory('FlyoutService', function(WindowState) {

  var handlers = {};
  var uberFlyout;
  var hintWidth;
  var hintHeight;


  WindowState.mousePositionSubject.subscribe(function(e) {

    var flyoutWidth;
    var flyoutHeight;
    var jqueryTarget;
    var jqueryTargetOffset;
    var leftOffset;
    var topOffset;
    var rightSideHint;
    var i;
    var className;

    if (!_.isEmpty(uberFlyout)) {

      // This is a double-fisted workaround for IE9:
      //
      // 1. SVG elements apparently do not have classNames
      // 2. IE9 does not support <DOM Element>.classList
      //
      // We used to use a polyfill for classList, but the
      // polyfill itself would have required a polyfill,
      // so we chose to just do this the messy way instead.
      if (e.target !== null && typeof e.target.className === 'string') {

        var classList = (e.target.className === '') ? [] : e.target.className.split(/\s+/);

        classCount = classList.length;

        for (i = 0; i < classCount; i++) {

          className = classList[i];

          if (handlers.hasOwnProperty(className)) {

            flyoutHeight = uberFlyout.outerHeight();

            jqueryTarget = $(e.target);

            jqueryTargetOffset = jqueryTarget.offset();

            // Subtract scroll position to compensate for .offset()
            // reporting values relative to the viewport, not the
            // document.
            leftOffset = (jqueryTargetOffset.left - window.scrollX)
                       + Math.floor(jqueryTarget.outerWidth() / 2);

            topOffset = (jqueryTargetOffset.top - window.scrollY)
                      - (flyoutHeight + Math.floor(hintHeight * 0.5));

            rightSideHint = false;

            uberFlyoutContent.html(handlers[className](e.target));

            flyoutWidth = uberFlyout.outerWidth();

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
    register: function(className, renderCallback) {
      // TODO: Figure out what to do here. Should we be using ids instead of classes?
      // Or just warn that a duplicate selector has been found rather than throwing
      // an exception?
      //if (handlers.hasOwnProperty(className)) {
      //  throw new Error('Duplicate selctor found.');
      //}
      handlers[className] = renderCallback;
    }
  };

});
