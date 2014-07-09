angular.module('dataCards.models').factory('Model', function(ModelHelper) {
  // A model with observable properties.
  function Model() {
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
    this._propertyTable = this._propertyTable || {};

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


  return Model;
});
