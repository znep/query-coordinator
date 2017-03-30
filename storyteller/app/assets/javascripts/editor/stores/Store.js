import SimpleEventEmitter from '../SimpleEventEmitter';
import { dispatcher } from '../Dispatcher';

/*
 * Store base class. Example of usage:
 *
 * function SpecificStore() {
 *   _.extend(this, new storyteller.Store());
 *
 *   this.getSpecificValue = function() { ... };
 * }
 */
export default function Store() {
  var _dispatcherToken;
  var _emitter = new SimpleEventEmitter();

  this.register = function(callback) {
    _dispatcherToken = dispatcher.register(callback);
  };

  this.getDispatcherToken = function() {
    return _dispatcherToken;
  };

  this.addChangeListener = function(callback) {
    _emitter.addListener(callback);
  };

  this.removeChangeListener = function(callback) {
    _emitter.removeListener(callback);
  };

  this._emitChange = _emitter.emit;
}
