angular.module('dataCards.models').factory('Model', function(Class, ModelHelper) {
  var Model = Class.extend({
    init:function Model() {
      var self = this;
      this._writes = new Rx.Subject();
      this._sets = new Rx.Subject();
      this._recursiveSets = new Rx.Subject();
      this._propertyTable = {};
      this._propertyHasBeenWritten = {};

      //Keeps track of children we've told that this instance is their parent.
      //Maps property names to arrays of children (because a property can be set
      //to an array containing children).
      this._children = {};

      //TODO Possible perf optimization: only start caring if someone calls observePropertyChangesRecursively.
      //Right now this isn't needed, as our models right now are one giant tree, and we
      //call observePropertyChangesRecursively on the root.
      this.observePropertyWrites().subscribe(function(changeNotification) {
        var oldChildrenUnderThisProperty = self._children[changeNotification.property];
        _.invoke(oldChildrenUnderThisProperty, '_setParentModel', null);
        delete self._children[changeNotification.property];

        var candidateModels = _.isArray(changeNotification.newValue) ? changeNotification.newValue : [changeNotification.newValue];

        var actualModels = [];
        _.each(candidateModels, function(maybeModel) {
          if (_.isObject(maybeModel) && _.isFunction(maybeModel._setParentModel)) {
            maybeModel._setParentModel(self);
            actualModels.push(maybeModel);
          }
        });
        self._children[changeNotification.property] = actualModels;
      });

      // Track which properties have ever had writes, via defaults or regular
      // set().
      this.observePropertyWrites().subscribe(function(changeNotification) {
        self._propertyHasBeenWritten[changeNotification.property] = true;
      });
    },

    _setParentModel: function(parentModel) {
      // Stop telling our old parent about our property changes.
      if (this._observePropertyChangesSubscriptionForParent) {
        this._observePropertyChangesSubscriptionForParent.dispose();
        delete this._observePropertyChangesSubscriptionForParent;
      }

      if (parentModel) {
        // Start telling our new parent about our property changes.
        // Store the subscription so we can detach it later.
        this._observePropertyChangesSubscriptionForParent = this.observePropertyChangesRecursively().subscribe(function(changeNotification) {
          parentModel._recursiveSets.onNext(changeNotification);
        });
      }
    },

    // Define a new observable property. The first argument is the string property name.
    // The second argument is the initial value.
    // Properties also support lazy defaults, evaluated the first time something subscribes.
    // If provided, the third argument is a function returning a promise that yields the default
    // value. While the promise is being evaluated, the value of the property is the default value
    // provided as the second argument.
    // BEWARE: if initialValue is undefined (or not passed), the property will not be considered
    // set (see isSet) until set() is called on this property, or the defaultGenerator (if provided)
    // resolves.
    defineObservableProperty: function(propertyName, initialValue, defaultGenerator) {
      var self = this;

      if (defaultGenerator && !_.isFunction(defaultGenerator)) {
        throw new Error('Unexpected defaultGenerator value');
      }

      if (this._propertyTable.hasOwnProperty(propertyName)) {
        throw new Error('Object ' + this + ' already has property: ' + propertyName);
      }

      var writesSequence;
      if (_.isFunction(defaultGenerator)) {
        writesSequence = ModelHelper.addPropertyWithLazyDefault(propertyName, this._propertyTable, initialValue, defaultGenerator);
      } else {
        writesSequence = ModelHelper.addProperty(propertyName, this._propertyTable, initialValue);
      }

      // Push write notifications for this property to the writes sequence.
      // This includes the initial value and the lazy default.
      // There's a special case if the initial value is not defined - ModelHelper
      // will still emit a write event in this case (for "undefined"), which we don't
      // want to consider as a write.
      //TODO right now we don't distinguish between passing null and not passing initialValue
      //at all.
      (_.isDefined(initialValue) ? writesSequence : writesSequence.skip(1)).
        subscribe(function(value) {
          self._writes.onNext({
            model: self,
            property: propertyName,
            newValue: value
          });
        });
    },

    // Define a new observable property whose value is sourced by the given sequence.
    // Setting values on this property via setValue is not supported, and will result
    // in an error being thrown.
    defineReadOnlyObservableProperty: function(propertyName, valueSequence) {
      var self = this;

      if (valueSequence && !_.isFunction(valueSequence.asObservable)) {
        throw new Error('Expected valueSequence to be an observable');
      }

      if (this._propertyTable.hasOwnProperty(propertyName)) {
        throw new Error('Object ' + this + ' already has property: ' + propertyName);
      }

      ModelHelper.addReadOnlyProperty(propertyName, this._propertyTable, valueSequence.asObservable()).
        subscribe(function(value) {
          self._writes.onNext({
            model: self,
            property: propertyName,
            newValue: value
          });
        });

    },

    _assertProperty: function(propertyName) {
      if (!this._propertyTable.hasOwnProperty(propertyName)) {
        throw new Error("Object " + this + " has no such property: " + propertyName);
      }
    },

    // Observes the given property.
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    observe: function(propertyName) {
      this._assertProperty(propertyName);
      return this._propertyTable[propertyName];
    },

    // Sets the named property on this model to the given
    // value.
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    set: function(propertyName, value) {
      this._assertProperty(propertyName);
      this._propertyTable[propertyName] = value;
      this._sets.onNext({
        model: this,
        property: propertyName,
        newValue: value
      });
    },

    // Unsets the named property, and forget it has ever been set.
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    unset: function(propertyName) {
      this._assertProperty(propertyName);
      this._propertyTable[propertyName] = undefined;
      this._propertyHasBeenWritten[propertyName] = false;
      this._sets.onNext({
        model: this,
        property: propertyName,
        newValue: undefined
      });
    },

    // Returns true if any of these hold:
    //   * The property has been written by a call to set(), or
    //   * The property has been initialized to a non-undefined value via defineObservableProperty
    //     (either due to an initial value being provided or due to a lazy default resolving).
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    isSet: function(propertyName) {
      return this._propertyHasBeenWritten[propertyName] === true;
    },

    // Gets the current value of the named property on this model.
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    //
    // NOTE: It is inadvisable to use this function other than
    // in a few specific cases, such as reacting to a discrete
    // user input event with a well-defined timing relationship
    // to this Model. Strongly consider using observe() instead.
    getCurrentValue: function(propertyName) {
      this._assertProperty(propertyName);
      return ModelHelper.currentValueOfProperty(this._propertyTable, propertyName);
    },

    // Get a snapshot of this model. Child models are descended
    // into. Properties that have never been set (see isSet) will
    // not be represented (if you want them to be, set those
    // properties manually to undefined).
    //
    // Children of a Model M are defined as all Models which
    // are directly assigned to one of M's properties, or are
    // in an array assigned to one of M's properties.
    serialize: function() {
      var self = this;
      var artifact = {};

      // Serialize an arbitrary value.
      // TODO Currently passes through
      // objects without recursing on
      // properties. This is fine for now.
      function serializeArbitrary(val) {
        if (_.isObject(val) && _.isFunction(val.serialize)) {
          return val.serialize();
        } else if (_.isArray(val)) {
          // Arrays are special - they contain models which we care about.
          return _.map(val, serializeArbitrary);
        } else if (_.isFunction(val)) {
          throw new Error('Tried to serialize a model having a function as a property value');
        } else {
          return val;
        }
      };

      _.forOwn(self._propertyTable, function(seq, propertyName) {
        var currentValue = self.getCurrentValue(propertyName);
        if (self.isSet(propertyName)) {
          artifact[propertyName] = serializeArbitrary(currentValue);
        }
      });

      return artifact;
    },

    // A sequence of all writes on this Model. This includes
    // values written by defaults, lazy or otherwise.
    // Writes are represented by objects of this form:
    // {
    //   model: <this model>,
    //   property: <string name of changed property>,
    //   newValue: <new value of the property>
    // }
    observePropertyWrites: function() {
      return this._writes;
    },

    // A sequence of all sets on this Model. Does NOT
    // include any form of defaults, lazy or otherwise.
    // In other words, only those sets coming from Model.set().
    //
    // Sets are represented by objects of this form:
    // {
    //   model: <this model>,
    //   property: <string name of changed property>,
    //   newValue: <new value of the property>
    // }
    observePropertyChanges: function() {
      return this._sets;
    },

    // A sequence of all sets on this Model and its children.
    // Children of a Model M are defined as all Models which
    // are directly assigned to one of M's properties, or are
    // in an array assigned to one of M's properties.
    //
    // In other words, this returns a merged sequence of all
    // child models' observePropertyChanges().
    //
    // Sets are represented in the same way as in observePropertyChanges.
    //
    // Note that this does not include values from defaults,
    // lazy or otherwise, just like observePropertyChanges.
    observePropertyChangesRecursively: function() {
      return Rx.Observable.merge(this._recursiveSets, this._sets);
    }

  });

  return Model;
});
