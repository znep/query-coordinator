(function() {

  'use strict';

  // A service providing some info on the current window state (including mouse position).
  // API:
  // {
  //   mouseClient{X,Y}: Position of mouse.
  //   mousePositionSubject: RX observable of mouse position.
  //   mouseLeftButtonPressedSubject: RX observable of mouse left button state.
  //   windowSizeSubject: RX observable of window size.
  //   scrollPositionSubject: RX observable of Y scroll position.
  // }
  angular.module('dataCards.services').factory('WindowState', function() {
    var jqueryWindow = $(window);
    var jqueryDocument = $(document);
    var jqueryBody = $('body');

    var WindowState = {};

    var scrollPositionSubject = new Rx.BehaviorSubject(window.pageYOffset);
    jqueryDocument.on('scroll', function() {
      scrollPositionSubject.onNext(window.pageYOffset);
    });

    var mousePositionSubject = new Rx.BehaviorSubject({clientX: 0, clientY: 0, target: null});
    jqueryBody.on('mousemove', function(e){
      WindowState.mouseClientX = e.originalEvent.clientX;
      WindowState.mouseClientY = e.originalEvent.clientY;
      mousePositionSubject.onNext({
        clientX: e.originalEvent.clientX,
        clientY: e.originalEvent.clientY,
        target: e.target
      });
    });

    var mouseLeftButtonPressedSubject = new Rx.BehaviorSubject(false);
    jqueryBody.on('mouseup', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressedSubject.onNext(false);
      }
    });
    jqueryBody.on('mousedown', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressedSubject.onNext(true);
      }
    });

    var windowSizeSubject = new Rx.BehaviorSubject(jqueryWindow.dimensions());
    jqueryWindow.on('resize', function() {
      windowSizeSubject.onNext(jqueryWindow.dimensions());
    });


    WindowState.scrollPositionSubject = scrollPositionSubject;
    WindowState.mousePositionSubject = mousePositionSubject;
    WindowState.mouseLeftButtonPressedSubject = mouseLeftButtonPressedSubject;
    WindowState.windowSizeSubject = windowSizeSubject;

    return WindowState;

  });
})();
