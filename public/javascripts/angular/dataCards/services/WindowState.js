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
  var scrollPositionSubject = new Rx.BehaviorSubject(window.scrollY);
  document.addEventListener('scroll', function() {
    scrollPositionSubject.onNext(window.scrollY);
  }, false);

  var mousePositionSubject = new Rx.BehaviorSubject({clientX: 0, clientY: 0});
  $('body').on('mousemove', function(e){
    svc.mouseClientY = e.originalEvent.clientY;
    svc.mouseClientX = e.originalEvent.clientX;
    mousePositionSubject.onNext({
      clientX: e.originalEvent.clientX,
      clientY: e.originalEvent.clientY,
      target: e.target
    });
  });

  var mouseLeftButtonPressedSubject = new Rx.BehaviorSubject(false);
  $('body').on('mouseup', function(e) {
    if (e.originalEvent.which === 1) {
      mouseLeftButtonPressedSubject.onNext(false);
    }
  });
  $('body').on('mousedown', function(e) {
    if (e.originalEvent.which === 1) {
      mouseLeftButtonPressedSubject.onNext(true);
    }
  });

  var jqueryWindow = $(window);
  var windowSizeSubject = new Rx.BehaviorSubject({
    width: jqueryWindow.width(),
    height: jqueryWindow.height()
  });
  window.addEventListener('resize', function(event) {
    windowSizeSubject.onNext({
      width: jqueryWindow.width(),
      height: jqueryWindow.height()
    } );
  }, false);


  var svc = {
    scrollPositionSubject: scrollPositionSubject,
    mousePositionSubject: mousePositionSubject,
    mouseLeftButtonPressedSubject: mouseLeftButtonPressedSubject,
    windowSizeSubject: windowSizeSubject
  };

  return svc;

});
