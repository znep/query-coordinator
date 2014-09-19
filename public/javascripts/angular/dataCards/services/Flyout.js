angular.module('dataCards.services').factory('Flyout', function(WindowState) {

  var handlers = {};
  var uberFlyout;
  var hintWidth;
  var hintHeight;


  WindowState.mousePositionSubject.subscribe(function(e) {
    var flyoutWidth;
    var flyoutHeight;
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

            flyoutWidth = uberFlyout.outerWidth();
            flyoutHeight = uberFlyout.outerHeight();
            // Minus one for the border.
            leftOffset = e.clientX - 1;
            topOffset = Math.floor(e.clientY - flyoutHeight - (hintHeight * 0.75));
            rightSideHint = false;

            uberFlyoutContent.html(handlers[className](e.target));

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
      if (handlers.hasOwnProperty(className)) {
        throw new Error('Duplicate selctor found.');
      }
      handlers[className] = renderCallback;
    }
  };

});
