;var EventEmitter = (function() {

  'use strict';

  function EventEmitter() {

    var _listeners = [];

    /**
     * Public API
     */

    /**
     * Adds a listener to the end of the listeners array.
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener
     * being added multiple times.
     */
    this.addListener = function(callback) {
      if (!_.isFunction(callback)) {
        throw new Error('`callback` argument must be a function, was: ' + typeof callback);
      }

      _listeners.push(callback);
    };

    /**
     * Remove a listener from the listener array.
     */
    this.removeListener = function(callback) {
      if (!_.isFunction(callback)) {
        throw new Error('`callback` argument must be a function, was: ' + typeof callback);
      }

      var i = _listeners.indexOf(callback);

      if (i >= 0) {
        _listeners.splice(i, 1);
      }
    };

    /**
     * Execute each of the listeners in order. No arguments are provided.
     */
    this.emit = function() {

      var listenerCount = _listeners.length;

      for (var i = 0; i < listenerCount; i++) {
        _listeners[i]();
      }
    };
  }

  return EventEmitter;

})();
