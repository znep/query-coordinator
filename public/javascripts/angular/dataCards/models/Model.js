angular.module('dataCards.models').factory('Model', function(ModelHelper) {
  // A model with observable properties.
  function Model() {
    var self = this;
    this._writes = new Rx.Subject();
    this._sets = new Rx.Subject();
    this._recursiveSets = new Rx.Subject();
    this._propertyTable = {};

    //All children (= models set as values).
    //TODO maybe invert this to avoid having to track this separately.
    this._children = {};

    //TODO only start caring if someone calls observeSetsRecursive.
    this.observeWrites().subscribe(function(write) {
      var oldValue = self._children[write.property];
      if (oldValue instanceof Model) {
        delete self._children[write.property];
        oldValue.setParent(null);
      }

      if (write.newValue instanceof Model) {
        var child = write.newValue;
        self._children[write.property] = child;
        child.setParent(self);
      }
    });
  }

  Model.prototype.setParent = function(parent) {
    if (this._observeSetsSubscriptionForParent) {
      this._observeSetsSubscriptionForParent.dispose();
      delete this._observeSetsSubscriptionForParent;
    }

    if (parent) {
      this._observeSetsSubscriptionForParent = this.observeSetsRecursive().subscribe(function(set) {
        parent._recursiveSets.onNext(set);
      });
    }
  };

  // Define a new observable property. The first argument is the string property name.
  // The second argument is the initial value.
  // Properties also support lazy defaults, evaluated the first time something subscribes.
  // If provided, the third argument is a function returning a promise that yields the default
  // value. While the promise is being evaluated, the value of the property is the default value
  // provided as the second argument.
  Model.prototype.defineObservableProperty = function(propertyName, initialValue, defaultGenerator) {
    var self = this;

    if (defaultGenerator && !_.isFunction(defaultGenerator)) {
      throw new Error('Unexpected defaultGenerator value');
    }

    if (this._propertyTable.hasOwnProperty(propertyName)) {
      throw new Error('Object ' + this + ' already has property: ' + propertyName);
    }

    var inner;
    if (_.isFunction(defaultGenerator)) {
      // If initial value specified as function, it's assumed to be a lazy initializer.
      inner = ModelHelper.addPropertyWithLazyDefault(propertyName, this._propertyTable, defaultGenerator, initialValue);
    } else {
      inner = ModelHelper.addProperty(propertyName, this._propertyTable, initialValue);
    }

    inner.subscribe(function(valueFromDefault) {
        self._writes.onNext({
          model: self,
          property: propertyName,
          newValue: valueFromDefault
        });
      })
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
    this._sets.onNext({
      model: this,
      property: propertyName,
      newValue: value
    });
  };

  Model.prototype.getCurrentValue = function(propertyName) {
    this._assertProperty(propertyName);
    return this._propertyTable[propertyName].value;
  };

  Model.prototype.observeWrites = function() {
    return this._writes;
  };

  Model.prototype.observeSets = function() {
    return this._sets;
  };

  Model.prototype.observeSetsRecursive = function() {
    return Rx.Observable.merge(this._recursiveSets, this._sets);
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
