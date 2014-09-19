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

      if (e.target !== null) {

        classCount = e.target.classList.length;

        for (i = 0; i < classCount; i++) {

          className = e.target.classList[i];

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
