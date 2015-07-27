;storyteller.Dispatcher = (function(storyteller) {

  'use strict';

  /**
   * @constructor
   */
  function Dispatcher() {
    var _callbacks = [];

    /**
     * Public methods
     */

    /**
     * Dispatches a payload to all registered callbacks.
     *
     * @param {*} payload
     */
    this.dispatch = function(payload) {
      _callbacks.forEach(function(callback) {
        callback.callback(payload);
      });
    };

    /**
     * Registers a callback to be invoked with every dispatched payload. Returns
     * a token that can be used with `.unregister()`.
     *
     * @param {function} callback
     * @return {string}
     */
    this.register = function(callback) {
      var id = _.uniqueId('dispatcher-registration-id::');

      if (!_.isFunction(callback)) {
        throw new Error('`callback` parameter must be a function, was: ' + callback);
      }

      _callbacks.push({
        id: id,
        callback: callback
      });

      return id;
    };

    /**
     * Removes a callback based on its token.
     *
     * @param {string} id
     */
    this.unregister = function(id) {
      _.remove(_callbacks, 'id', id);
    };
  }

  return Dispatcher;
})(window.socrata.storyteller);

