// A collection of evil input hacks.
(function() {

  'use strict';

  angular.module('dataCards.services').factory('InputHacks', function(WindowState, Assert) {
    var InputHacks = {};

    var jqueryWindow = $(window);

    if ($('#input-hacks').length === 0) {
      $(document.body).append('<div id="input-hacks" />');
    }
    var inputHacksDiv = $('#input-hacks');

    // Returns a sequence of all mouse events that occur outside
    // the bounds of the given element. Mouse events inside the
    // bounds of the element pass through with no modification,
    // all others are intercepted.
    //
    // Mouse events are augmented with an externalCorner property
    // to indicate which side of the element the event came from.
    // Values are one of [ top, bottom, right, left ].
    //
    // NOTE: The lifetime of the intercept is the lifetime of the
    // subscription. Remember to dispose your subscription when
    // you're done.
    InputHacks.captureAllMouseEventsOutsideOf = function(element) {
      Assert(element, 'Must give an element');
      Assert(_.isFunction(element.offset), 'Expected element.offset to be a function');
      Assert(_.isFunction(element.width), 'Expected element.width to be a function');
      Assert(_.isFunction(element.height), 'Expected element.height to be a function');
      // Manual transparent color is for IE9 - we've encountered issues
      // with input catching with transparent backgrounds.
      function makeInputCatcherDiv(tag, top, left, width, height) {
        var div = $('<div style="z-index: 10010; position: fixed; top: {0}px; left: {1}px; width: {2}px; height: {3}px; background-color: rgba(0,0,0,0)"></div>'.format(
            top,
            left,
            width,
            height
            )
          );
        div.data('tag', tag);
        return div;
      }

      // Build an event source that upon subscription sets up some
      // transparent divs on top of everything EXCEPT the element,
      // and forwards all mouse events on those divs to the observer.
      var source = Rx.Observable.create(function(observer) {
        var elementPosition = element.offset();

        // Account for the scroll position (the input catcher divs are
        // position: fixed).
        elementPosition.top -= window.pageYOffset;
        elementPosition.left -= window.pageXOffset;

        var divs = [];

        // Arrange four divs 
        divs.push(makeInputCatcherDiv(
          'top',
          0,
          elementPosition.left,
          element.outerWidth(),
          elementPosition.top));

        divs.push(makeInputCatcherDiv(
          'bottom',
          elementPosition.top + element.outerHeight(),
          elementPosition.left,
          element.outerWidth(),
          jqueryWindow.height() - (elementPosition.top + element.outerHeight())));

        divs.push(makeInputCatcherDiv(
          'left',
          0,
          0,
          elementPosition.left,
          jqueryWindow.height()));

        divs.push(makeInputCatcherDiv(
          'right',
          0,
          elementPosition.left + element.outerWidth(),
          jqueryWindow.width() - elementPosition.left - element.outerWidth(),
          jqueryWindow.height()));

        _.each(divs, function(div) { inputHacksDiv.append(div); });
        var allDivsEvents = _.map(divs, function(div) {
          // Augment the events with an externalCorner property.
          // We use doAction instead of map because we're not
          // creating new state, we're modifying some shared
          // state.
          return Rx.Observable.fromAllMouseEvents(div).doAction(
            function(event) {
              event.externalCorner = div.data('tag');
            }
          );
        });

        // This check should ideally use a browser event like DOMNodeRemoved,
        // but this is really tricky to get right cross-platform. So we check
        // on each mouse event. This should be enough for defensive purposes.
        function elementInDom() {
          return $.contains(document.documentElement, element[0]);
        }

        var subscription = Rx.Observable.merge.apply(Rx.Observable, allDivsEvents).takeWhile(elementInDom).subscribe(observer);

        // Release our resources on dispose.
        return Rx.Disposable.create(function() {
          // Detach from the mouse events, so the handlers are removed.
          // Technically optional, as these handlers will go away when
          // the div is removed.
          subscription.dispose();

          // Remove the input catcher divs.
          _.each(divs, function(div) { div.remove(); });
        });
      });

      // Now that we have the event source,
      // ensure we'll only have one set of
      // input catchers per stream (otherwise,
      // multiple subscribers will duplicate
      // the divs).
      return source.publish().refCount();
    };

    return InputHacks;

  });
})();
