angular.module('test', [])
  .factory('testHelpers', function($compile, $templateCache, $q) {

    // D3 doesn't have a jQuery-like trigger. So if you want to simulate mouse events,
    // we need to use real browser events.
    var fireMouseEvent = function(elem, evtName) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(evtName, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      elem.dispatchEvent(evt);
    };

    // Hack D3 to finish all transitions immediately.
    // From mbostock himself.
    // https://github.com/mbostock/d3/issues/1789
    var flushAllD3Transitions = function() {
      var now = Date.now;
      Date.now = function() { return Infinity; };
      d3.timer.flush();
      Date.now = now;
    }

    var TestDom = {
      compileAndAppend: function(element, scope) {
        var compiledElem = $compile(TestDom.append(element))(scope);
        scope.$digest();

        return compiledElem;
      },

      append: function(element) {
        if ($('#test-root').length === 0) {
          $('body').append("<div id='test-root'></div>");
        }

        return $(element).appendTo($('#test-root'));
      },

      clear: function() {
        return $('#test-root').empty();
      }
    };

    // Pulls a JSON file from the templateCache and parses it.
    var getTestJson = function(url) {
      eval('var a = ' + $templateCache.get(url));
      return a;
    }

    return {
      TestDom: TestDom,
      getTestJson: getTestJson,
      flushAllD3Transitions: flushAllD3Transitions,
      fireMouseEvent: fireMouseEvent
    };
  });
