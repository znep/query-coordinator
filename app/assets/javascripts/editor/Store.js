;(function(storyteller) {
  'use strict';

  // Store base class. Example of usage:
  //
  // function SpecificStore() {
  //   _.extend(this, new storyteller.Store());
  //
  //   this.getSpecificValue = function() { ... };
  // }
  function Store() {
    var _emitter = new storyteller.SimpleEventEmitter();

    this.addChangeListener = function(callback) {
      _emitter.addListener(callback);
    };

    this.removeChangeListener = function(callback) {
      _emitter.removeListener(callback);
    };

    this._emitChange = _emitter.emit;
  }


  storyteller.Store = Store;
})(window.socrata.storyteller);
