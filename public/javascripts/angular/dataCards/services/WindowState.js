(function() {

  'use strict';

  // A service providing some info on the current window state (including mouse position).
  // API:
  // {
  //   mouseClient{X,Y}: Position of mouse.
  //   mousePosition$: RX observable of mouse position.
  //   mouseLeftButtonPressed$: RX observable of mouse left button state.
  //   windowSize$: RX observable of window size.
  //   scrollPosition$: RX observable of Y scroll position.
  // }
  angular.module('dataCards.services').factory('WindowState', function() {
    var jqueryWindow = $(window);
    var body = document.getElementsByTagName('body')[0];

    var WindowState = {};

    // TODO: convert these BehaviorSubjects to use Rx.Observable.fromEvent
    var scrollPosition$ = new Rx.BehaviorSubject(window.pageYOffset);
    window.addEventListener('scroll', function() {
      scrollPosition$.onNext(window.pageYOffset);
    });

    var mousePosition$ = new Rx.BehaviorSubject({ clientX: 0, clientY: 0, target: document.body });
    body.addEventListener('mousemove', function(e) {
      WindowState.mouseClientX = e.clientX;
      WindowState.mouseClientY = e.clientY;
      mousePosition$.onNext({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target
      });
    });

    body.addEventListener('surrogate-mousemove', function(e) {
      WindowState.mouseClientX = e.clientX;
      WindowState.mouseClientY = e.clientY;
      mousePosition$.onNext({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target
      });
    });

    var mouseLeftButtonPressed$ = new Rx.BehaviorSubject(false);
    var mouseLeftButtonClick$ = Rx.Observable.fromEvent(body, 'click').
        filter(function(e) { return e.which === 1; });

    var mouseLeftButtonPressedWithTargetSubject = new Rx.Subject();


    body.addEventListener('mouseup', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressed$.onNext(false);
        mouseLeftButtonPressedWithTargetSubject.onNext({value: false, target: e.target});
      }
    });
    body.addEventListener('mousedown', function(e) {
      if (e.which === 1) {
        mouseLeftButtonPressed$.onNext(true);
        mouseLeftButtonPressedWithTargetSubject.onNext({value: true, target: e.target});
      }
    });

    var windowSize$ = new Rx.BehaviorSubject(jqueryWindow.dimensions());
    window.addEventListener('resize', function() {
      windowSize$.onNext(jqueryWindow.dimensions());
    });

    WindowState.keyDown$ = Rx.Observable.fromEvent($(document), 'keydown');
    WindowState.escapeKey$ = WindowState.keyDown$.filter(function(e) {
      // Escape key
      return e.which === 27;
    });

    WindowState.scrollPosition$ = scrollPosition$;
    WindowState.mousePosition$ = mousePosition$;
    WindowState.mouseLeftButtonPressed$ = mouseLeftButtonPressed$;
    WindowState.mouseLeftButtonClick$ = mouseLeftButtonClick$;
    WindowState.windowSize$ = windowSize$;
    WindowState.closeDialogEvent$ = Rx.Observable.merge(
      WindowState.mouseLeftButtonClick$,
      WindowState.escapeKey$
    );

    return WindowState;

  });
})();
