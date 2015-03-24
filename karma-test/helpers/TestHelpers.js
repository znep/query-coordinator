(function() {
  'use strict';
  /**
   * A function that cleans up known memory leaks in sinon.
   */
  var cleanUpSinonTimers = (function() {
    // Monkey patch the invocation of fake timers, so we can get a reference to the fake clock, so
    // we can properly reset it.
    var originalUseFakeTimers = sinon.useFakeTimers;
    var fakeClock;
    sinon.useFakeTimers = function() {
      fakeClock = originalUseFakeTimers.apply(this, arguments);
      return fakeClock;
    };

    return function cleanUpSinonTimers() {
      if (fakeClock) {
        fakeClock.reset();
        fakeClock.restore();
        fakeClock = null;
      }
    };
  })();

  /**
   * If a test does 'this.timeout(15000)', for some reason mocha will keep the entire function
   * closure where it was called in memory, in its mock browser's list of deferred functions. So we
   * have to clear it out.
   */
  var cleanUpTimeouts = inject(function($injector) {
    var $browser = $injector.get('$browser');
    if ($browser.deferredFns.length) {
      $browser.defer.flush();
    }
  });

  /**
   * Cleans up known memory leaks.
   */
  function cleanUp() {
    cleanUpSinonTimers();
    cleanUpTimeouts();
  }


  angular.module('test', []).factory('testHelpers', function($injector, $compile, $templateCache, $q) {
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
    };

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
              try {
                resolve();
              } catch (e) {
                console.log(e, e.stack);
                throw e;
              }
            }
          } catch (e) {
            reject(e);
          }
        }
        check();
      });
      return p;
    }

    var TestDom = {
      compileAndAppend: function(element, scope) {
        var compiledElem = $compile(TestDom.append(element))(scope);
        scope.$digest();

        return compiledElem;
      },

      append: function(element) {
        if ($('#test-root').length === 0) {
          $('body').append('<div id="test-root" style="margin: 0; padding: 0;"></div>');
          $('body').append('<style>body { margin: 0; padding: 0; }</style>');
        }

        return $(element).appendTo($('#test-root'));
      },

      clear: function() {
        var element = $('#test-root');
        // If there are any angular scopes, send them the destroy signal to clean up after
        // themselves.
        element.children().each(function() {
          var scope = $(this).scope();
          if (scope) {
            scope.$destroy();
          }
        });
        return element.empty();
      }
    };

    // Pulls a JSON file from the templateCache and parses it.
    var getTestJson = function(url) {
      var text = $templateCache.get(url);
      if (_.isUndefined(text)) {
        throw new Error("Requested test JSON is not present in the template cache. You will want to add a line like this to your test: beforeEach(module('{0}'))".format(url));
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Unable to parse test JSON. File: {0} Cause: {1} Text: {2}'.format(url, e.message, text));
      }
    };

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

    /**
     * Mocks a directive.
     * This is sort of an ugly hack, from:
     * http://stackoverflow.com/questions/17533052
     *
     * @param {String} directive The directive to mock, as a camelCase string.
     * @param {Function} f The alternate factory function that returns a directive definition.
     */
    function mockDirective($provide, directive, f) {
      $provide.factory(directive + 'Directive', function() {
        var directiveDefinition = f ? f.apply(this, arguments) : {};

        return [
          $.extend({
            template: '',
            compile: function() {
              return directiveDefinition.link;
            },
            restrict: 'EA',
            priority: 0
          }, directiveDefinition)
        ];
      });
    }

    /**
     * Normalize a css color to a canonical format, for easier comparison.
     *
     * Largely from: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
     *
     * @param {String} cssColor a color, formatted as a valid css color (eg #000000, rgb(0,0,0)).
     * @return {Number} a canonical representation of that color, as a number.
     */
    function normalizeColor(cssColor) {
      var r;
      var g;
      var b;
      if (cssColor.charAt(0) === '#') {
        var hex;
        if (cssColor.length === 4) {
          hex = /^#[a-f\d][a-f\d][a-f\d]$/i.exec(cssColor);
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
        } else {
          hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cssColor);
          r = parseInt(hex[1], 16);
          g = parseInt(hex[2], 16);
          b = parseInt(hex[3], 16);
        }
      } else {
        var digits = /^rgb\((\d+), *(\d+), *(\d+)\)$/.exec(cssColor);
        if (!(digits && digits.length === 4)) {
          throw Error('Unsupported css color format: ' + cssColor);
        }
        r = parseInt(digits[1], 10);
        g = parseInt(digits[2], 10);
        b = parseInt(digits[3], 10);
      }

      return (r << 16) + (g << 8) + b;
    }

    function overrideMetadataMigrationPhase(phase) {
      var ServerConfig = $injector.get('ServerConfig');
      ServerConfig.override('metadataTransitionPhase', phase);
    }

    return {
      TestDom: TestDom,
      getTestJson: getTestJson,
      flushAllD3Transitions: flushAllD3Transitions,
      fireEvent: fireEvent,
      fireMouseEvent: fireMouseEvent,
      overrideTransitions: overrideTransitions,
      mockDirective: mockDirective,
      normalizeColor: normalizeColor,
      waitForSatisfy: waitForSatisfy,
      overrideMetadataMigrationPhase: overrideMetadataMigrationPhase,
      cleanUp: cleanUp
    };
  });
})();
