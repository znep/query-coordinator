import StorytellerUtils from '../StorytellerUtils';

export default function SimpleEventEmitter() {
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
    StorytellerUtils.assertIsOneOfTypes(callback, 'function');
    _listeners.push(callback);
  };

  /**
   * Remove a listener from the listener array.
   */
  this.removeListener = function(callback) {
    StorytellerUtils.assertIsOneOfTypes(callback, 'function');

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
