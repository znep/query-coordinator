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
    var body = document.getElementsByTagName('body')[0];

    var WindowState = {};

    var scrollPositionSubject = new Rx.BehaviorSubject(window.pageYOffset);
    window.addEventListener('scroll', function() {
      scrollPositionSubject.onNext(window.pageYOffset);
    });

    var mousePositionSubject = new Rx.BehaviorSubject({clientX: 0, clientY: 0, target: document.body });
    body.addEventListener('mousemove', function(e){
      WindowState.mouseClientX = e.clientX;
      WindowState.mouseClientY = e.clientY;
      mousePositionSubject.onNext({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target
      });
    });

    body.addEventListener('surrogate-mousemove', function(e) {
      WindowState.mouseClientX = e.clientX;
      WindowState.mouseClientY = e.clientY;
      mousePositionSubject.onNext({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target
      });
    });

    var mouseLeftButtonPressedSubject = new Rx.BehaviorSubject(false);
    var mouseLeftButtonClickSubject = new Rx.Subject();

    var mouseLeftButtonPressedWithTargetSubject = new Rx.Subject();


    body.addEventListener('mouseup', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressedSubject.onNext(false);
        mouseLeftButtonClickSubject.onNext(e);
        mouseLeftButtonPressedWithTargetSubject.onNext({value: false, target: e.target});
      }
    });
    body.addEventListener('mousedown', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressedSubject.onNext(true);
        mouseLeftButtonPressedWithTargetSubject.onNext({value: true, target: e.target});
      }
    });

    var windowSizeSubject = new Rx.BehaviorSubject(jqueryWindow.dimensions());
    window.addEventListener('resize', function() {
      windowSizeSubject.onNext(jqueryWindow.dimensions());
    });


    WindowState.scrollPositionSubject = scrollPositionSubject;
    WindowState.mousePositionSubject = mousePositionSubject;
    WindowState.mouseLeftButtonPressedSubject = mouseLeftButtonPressedSubject;
    WindowState.mouseLeftButtonClickSubject = mouseLeftButtonClickSubject;
    WindowState.windowSizeSubject = windowSizeSubject;

    return WindowState;

  });
})();
