(function(root) {

  'use strict';

  /**
   * @constructor
   */
  function Dispatcher() {

    var _isDispatching = false;
    var _pendingPayload = null;
    var _callbacks = {};
    var _isPending = {};
    var _isHandled = {};

    /**
     * Public methods
     */

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

      _callbacks[id] = callback;

      return id;
    };

    /**
     * Removes a callback based on its token.
     *
     * @param {string} id
     */
    this.unregister = function(id) {
      delete _callbacks[id];
    };

    /**
     * Dispatches a payload to all registered callbacks.
     *
     * @param {*} payload
     */
    this.dispatch = function(payload) {

      _startDispatching(payload);

      try {

        for (var id in _callbacks) {

          if (_callbacks.hasOwnProperty(id)) {

            if (_isPending[id]) {
              continue;
            }

            _invokeCallback(id);
          }
        }

      } finally {

        _stopDispatching();

      }
    };

    this.waitFor = function(ids) {
      if (!Array.isArray(ids)) {
        throw new Error('waitFor() expects an array of IDs');
      }

      for (var i = 0; i < ids.length; i++) {

        var id = ids[i];

        if (_isPending[id]) {
          continue;
        }

        _invokeCallback(id);
      }
    };

    this.isDispatching = function() {
      return _isDispatching;
    };

    /**
     * Private methods
     */

    function _startDispatching(payload) {

      for (var id in _callbacks) {

        if (_callbacks.hasOwnProperty(id)) {
          _isPending[id] = false;
          _isHandled[id] = false;
        }
      }

      _pendingPayload = payload;
      _isDispatching = true;
    }

    function _invokeCallback(id) {

      _isPending[id] = true;
      _callbacks[id](_pendingPayload);
      _isHandled[id] = true;
    }

    function _stopDispatching() {

      _pendingPayload = null;
      _isDispatching = false;
    }
  }

  root.socrata.storyteller.Dispatcher = Dispatcher;
})(window);
