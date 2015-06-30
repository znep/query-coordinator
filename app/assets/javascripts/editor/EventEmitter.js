;var EventEmitter = (function() {

  'use strict';

  function EventEmitter() {

    var _listeners = [];

    /**
     * Public API
     */

    this.addListener = function(callback) {
      _listeners.push(callback);
    };

    this.removeListener = function(callback) {
      _.pull(_listeners, callback);
    };

    this.emit = function() {

      var listenerCount = _listeners.length;

      for (var i = 0; i < listenerCount; i++) {
        _listeners[i]();
      }
    };
  }

  return EventEmitter;

})();
