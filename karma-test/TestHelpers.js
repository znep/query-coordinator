angular.module('test', [])
  .factory('testHelpers', function() {

    // D3 doesn't have a jQuery-like trigger. So if you want to simulate mouse events,
    // we need to use real browser events.
    function fireEvent(elem, evtName) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(evtName, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      elem.dispatchEvent(evt);
    };

    // Returns a promise which resolves after all currently-executing
    // d3 transitions complete.
    // See: https://groups.google.com/forum/#!topic/d3-js/WC_7Xi6VV50
    var waitForD3Transitions = function() {
      var d = Q.defer();
      d3.select('body').transition().call(function(tr, callback) {
        var n = 0;
        tr
          .each(function() { ++n; })
          .each("end", function() { if (!--n) callback.apply(this, arguments); });
      }, function() {
        d.resolve();
      });

      // TODO revisit this. It's here so you can still see the assertion error if you
      // forget to do a .catch(done) from your test (which you should do).
      d.promise.catch(function(e) {
        console.err(e);
      });

      return d.promise;
    };

    return {
      waitForD3Transitions: waitForD3Transitions,
      fireEvent: fireEvent
    };
  });

