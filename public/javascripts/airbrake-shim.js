// Based on version 0.3.9 sourced from https://github.com/airbrake/airbrake-js

// global === window
(function(global) {
// Airbrake shim that stores exceptions until Airbrake notifier is loaded.
  global.Airbrake = [];

// Wraps passed function and returns new function that catches and
// reports unhandled exceptions.
  global.Airbrake.wrap = function(fn) {
    if (fn.__airbrake__) {
      return fn;
    }

    var airbrakeWrapper = function() {
      try {
        return fn.apply(this, arguments);
      } catch (exc) {
        var args;
        args = Array.prototype.slice.call(arguments);
        global.Airbrake.push({error: exc, params: {arguments: args}});
        return null;
      }
    };

    airbrakeWrapper.__airbrake__ = true;
    airbrakeWrapper.__inner__ = fn;

    var prop;
    for (prop in fn) {
      if (fn.hasOwnProperty(prop)) {
        airbrakeWrapper[prop] = fn[prop];
      }
    }

    return airbrakeWrapper;
  };

// Registers console reporter when notifier is ready.
  global.Airbrake.onload = function() {
    Airbrake.addReporter(Airbrake.consoleReporter);
  };

// Reports unhandled exceptions.
  global.onerror = function(message, file, line, column, error) {
    if (message === 'Script error.') {
      // Ignore.
      return;
    }

    if (error) {
      global.Airbrake.push({error: error});
    } else {
      global.Airbrake.push({error: {
        message: message,
        fileName: file,
        lineNumber: line,
        columnNumber: column || 0
      }});
    }
  };

  var loadAirbrakeNotifier = function() {
    var script = document.createElement('script');
    var sibling = document.getElementsByTagName('script')[0];
    script.src = 'https://ssljscdn.airbrake.io/0.3/airbrake.min.js';
    script.async = true;
    sibling.parentNode.insertBefore(script, sibling);
  };

  var setupJQ = function() {
    var jqEventAdd = jQuery.event.add;
    jQuery.event.add = function(elem, types, handler, data, selector) {
      if (handler.handler) {
        if (!handler.handler.guid) {
          handler.handler.guid = jQuery.guid++;
        }
        handler.handler = global.Airbrake.wrap(handler.handler);
      } else {
        if (!handler.guid) {
          handler.guid = jQuery.guid++;
        }
        handler = global.Airbrake.wrap(handler);
      }
      return jqEventAdd(elem, types, handler, data, selector);
    };

    // Reports exceptions thrown in jQuery callbacks.
    var jqCallbacks = jQuery.Callbacks;
    jQuery.Callbacks = function(options) {
      var cb = jqCallbacks(options),
        cbAdd = cb.add;
      cb.add = function() {
        var fns = arguments;
        jQuery.each(fns, function(i, fn) {
          if (jQuery.isFunction(fn)) {
            fns[i] = global.Airbrake.wrap(fn);
          }
        });
        return cbAdd.apply(this, fns);
      };
      return cb;
    };

    // Reports exceptions thrown in jQuery ready callbacks.
    var jqReady = jQuery.fn.ready;
    jQuery.fn.ready = function(fn) {
      return jqReady(global.Airbrake.wrap(fn));
    }
  };

// Asynchronously loads Airbrake notifier.
  if (global.addEventListener) {
    global.addEventListener('load', loadAirbrakeNotifier, false);
  } else if (global.attachEvent) {
    global.attachEvent('onload', loadAirbrakeNotifier);
  }

// Reports exceptions thrown in jQuery event handlers.
  if (global.jQuery) {
    setupJQ();
  } else {
    console.warn('airbrake: jQuery not found; skipping jQuery instrumentation.');
  }

})(this);
