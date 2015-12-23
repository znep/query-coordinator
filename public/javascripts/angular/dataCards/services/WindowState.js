const angular = require('angular');
// A service providing some info on the current window state (including mouse position).
// API:
// {
//   mouseClient{X,Y}: Position of mouse.
//   mousePosition$: RX observable of mouse position.
//   mouseLeftButtonPressed$: RX observable of mouse left button state.
//   windowSize$: RX observable of window size.
//   scrollPosition$: RX observable of Y scroll position.
// }
angular.module('dataCards.services').factory('WindowState', function($document, $window, rx) {
  const Rx = rx;
  var jqueryWindow = $($window);
  var root = $window.document.documentElement;

  var WindowState = {};

  // TODO: convert these BehaviorSubjects to use Rx.Observable.fromEvent
  var scrollPosition$ = new Rx.BehaviorSubject($window.pageYOffset);
  $window.addEventListener('scroll', function() {
    scrollPosition$.onNext($window.pageYOffset);
  });

  var mousePosition$ = new Rx.BehaviorSubject({
    clientX: 0,
    clientY: 0,
    target: $window.document.body
  });
  root.addEventListener('mousemove', function(e) {
    WindowState.mouseClientX = e.clientX;
    WindowState.mouseClientY = e.clientY;
    mousePosition$.onNext({
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target
    });
  });

  root.addEventListener('surrogate-mousemove', function(e) {
    WindowState.mouseClientX = e.clientX;
    WindowState.mouseClientY = e.clientY;
    mousePosition$.onNext({
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target
    });
  });

  var mouseLeftButtonPressed$ = new Rx.BehaviorSubject(false);
  var mouseLeftButtonClick$ = Rx.Observable.fromEvent(root, 'click').
      filter(function(e) { return e.which === 1; });

  var mouseLeftButtonPressedWithTarget$ = new Rx.Subject();


  root.addEventListener('mouseup', function(e) {
    if (e.which === 1) {
      mouseLeftButtonPressed$.onNext(false);
      mouseLeftButtonPressedWithTarget$.onNext({value: false, target: e.target});
    }
  });
  root.addEventListener('mousedown', function(e) {
    if (e.which === 1) {
      mouseLeftButtonPressed$.onNext(true);
      mouseLeftButtonPressedWithTarget$.onNext({value: true, target: e.target});
    }
  });

  var windowSize$ = new Rx.BehaviorSubject(jqueryWindow.dimensions());
  $window.addEventListener('resize', function() {
    windowSize$.onNext(jqueryWindow.dimensions());
  });

  WindowState.keyDown$ = Rx.Observable.fromEvent($document, 'keydown');
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
