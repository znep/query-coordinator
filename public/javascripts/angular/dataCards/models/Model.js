angular.module('dataCards.models').factory('Model', function(ModelHelper) {
  // A model with observable properties.
  function Model() {
    this._writes = new Rx.Subject();
    this._propertyTable = {};
  }

  // Define a new observable property. The first argument is the string property name.
  // The second argument is the initial value.
  // Properties also support lazy defaults, evaluated the first time something subscribes.
  // If provided, the third argument is a function returning a promise that yields the default
  // value. While the promise is being evaluated, the value of the property is the default value
  // provided as the second argument.
  Model.prototype.defineObservableProperty = function(propertyName, initialValue, defaultGenerator) {
    if (defaultGenerator && !_.isFunction(defaultGenerator)) {
      throw new Error('Unexpected defaultGenerator value');
    }

    if (this._propertyTable.hasOwnProperty(propertyName)) {
      throw new Error('Object ' + this + ' already has property: ' + propertyName);
    }

    if (_.isFunction(defaultGenerator)) {
      // If initial value specified as function, it's assumed to be a lazy initializer.
      ModelHelper.addPropertyWithLazyDefault(propertyName, this._propertyTable, defaultGenerator, initialValue);
    } else {
      ModelHelper.addProperty(propertyName, this._propertyTable, initialValue);
    }
  };

  Model.prototype._assertProperty = function(propertyName) {
    if (!this._propertyTable.hasOwnProperty(propertyName)) {
      throw new Error("Object " + this + " has no such property: " + propertyName);
    }
  };

  // Observes the given property.
  Model.prototype.observe = function(propertyName) {
    this._assertProperty(propertyName);
    return this._propertyTable[propertyName];
  };

  Model.prototype.set = function(propertyName, value) {
    this._assertProperty(propertyName);
    this._propertyTable[propertyName] = value;
  };

  Model.prototype.getCurrentValue = function(propertyName) {
    this._assertProperty(propertyName);
    return this._propertyTable[propertyName].value;
  };

  // See:
  // http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
  Model.extend = function extend(sub) {
    // Avoid instantiating the base class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite
    // the existing prototype, but still maintain the inheritance chain
    // Thanks to @ccnokes
    var origProto = sub.prototype;
    sub.prototype = Object.create(Model.prototype);
    for (var key in origProto)  {
      sub.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    sub.prototype.constructor = sub;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like this instead
    Object.defineProperty(sub.prototype, 'constructor', {
      enumerable: false,
      value: sub
    });
  };

  return Model;
});
