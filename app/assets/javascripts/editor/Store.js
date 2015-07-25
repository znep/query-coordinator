;(function(namespace) {
  'use strict';

  // Store base class. Example of usage:
  //
  // function SpecificStore() {
  //   _.extend(this, new namespace.Store());
  //
  //   this.getSpecificValue = function() { ... };
  // }
  function Store() {
    var _emitter = new namespace.SimpleEventEmitter();

    this.addChangeListener = function(callback) {
      _emitter.addListener(callback);
    };

    this.removeChangeListener = function(callback) {
      _emitter.removeListener(callback);
    };

    this._emitChange = _emitter.emit;
  }


  namespace.Store = Store;
})(window.socrata.storyteller);
