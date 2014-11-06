angular.module('test', [])
  .factory('testHelpers', function($compile, $templateCache, $q) {

    var fireEvent = function(target, name, opts) {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent(name, true, true);
      evt.clientX = 0;
      evt.clientY = 0;
      if (opts) {
        $.extend(evt, opts);
      }
      target.dispatchEvent(evt);
    };

    // D3 doesn't have a jQuery-like trigger. So if you want to simulate mouse events,
    // we need to use real browser events.
    var fireMouseEvent = function(elem, evtName, eventProps) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(evtName, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      if (eventProps) {
        $.extend(evt, eventProps);
      }
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

    // Returns a promise that will be resolved when the given
    // test function returns a truthy value.
    // NOTE: This is expected to be used with Mocha's auto
    // test timeout, so there's no built-in timeout functionality.
    function waitForSatisfy(test) {
      var p = new Promise(function(resolve, reject) {
        function check() {
          try {
            if (!test()) {
              _.delay(check, 25);
            } else {
              resolve();
            }
          } catch (e) {
            reject(e);
          }
        };
        check();
      });
      return p;
    };

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

    // IE9 starts ignoring styles if we create too many <style> tags, I think. So don't
    // create it here (since in tests, factories are recreated for every module) - create
    // it only on demand, and remove it when toggled off.
    var transitionOverride;
    /**
     * Toggle whether jquery and css animations should happen.
     *
     * @param {String|boolean} value If falsy, lets transitions through. If true, disables
     * transitions. If truey but not true, sets the transition duration to that value.
     */
    function overrideTransitions(value) {
      if (value) {
        var prefices = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
        var styles;
        if (true === value) {
          styles = ['transition: none !important;\n'];
        } else {
          styles = [
            'transition-duration: ' + (_.isNumber(value) ? value + 's' : value) + ' !important;\n',
            // PhantomJS defaults transition-property to all, which means if we add a duration,
            // everything is transitioned. So - default it to none.
            'transition-property: none;\n'
          ];
        }
        transitionOverride = transitionOverride || $('<style />').appendTo('body');
        transitionOverride.html('* { ' + _.map(styles, function(style) {
          return prefices.join(style) + style;
        }).join('\n') + ' }');

        jQuery.fx.off = true;
      } else {
        if (transitionOverride) {
          transitionOverride.remove();
          transitionOverride = false;
        }
        jQuery.fx.off = false;
      }
    }

    return {
      TestDom: TestDom,
      getTestJson: getTestJson,
      flushAllD3Transitions: flushAllD3Transitions,
      fireEvent: fireEvent,
      fireMouseEvent: fireMouseEvent,
      overrideTransitions: overrideTransitions,
      waitForSatisfy: waitForSatisfy
    };
  });
