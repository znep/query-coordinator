// The Model class provides an implementation of an object having a well-defined set of observable fields,
// primarily exposed as an RX Sequence of values. This allows our reactive UI to be fully decoupled from
// the sources of new property values.
//
// Model provides:
// * An API for observing properties via RX's Observable API.
// * An API for defining observable properties:
//   - Backed by a simple read-write value store
//   - Backed by an RX Sequence
// * Facilities to define lazy (JIT) defaults for properties.
// * Automatic serialization, with consideration of ephemeral (non-serialized) properties.
// * Recursive dirty checking/change tracking.
angular.module('dataCards.models').factory('Model', function(Class, ModelHelper) {
  var Model = Class.extend({
    init:function Model() {
      var self = this;
      this._writes = new Rx.Subject();
      this._sets = new Rx.Subject();
      this._recursiveSets = new Rx.Subject();
      this._propertyObservables = {};
      this._propertyHasBeenWritten = {};
      this._ephemeralProperties = {};

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

    ///////////////////////////////////////////////////////////////////////////
    ///////////////// Public API
    ///////////////////////////////////////////////////////////////////////////


    // Define a new observable property. The first argument is the string property name.
    // The second argument is the initial value.
    // Properties also support lazy defaults, evaluated the first time something subscribes.
    // If provided, the third argument is a function returning a promise or sequence(1) that yields the
    // default value. While the default is being evaluated, the value of the property is the default value
    // provided as the second argument.
    // BEWARE: if initialValue is undefined (or not passed), the property will not be considered
    // set (see isSet) until set() is called on this property, or the defaultGenerator (if provided)
    // resolves.
    // (1) If a sequence is returned, the first value emitted is used.
    defineObservableProperty: function(propertyName, initialValue, defaultGenerator) {
      var self = this;

      if (defaultGenerator && !_.isFunction(defaultGenerator)) {
        throw new Error('Unexpected defaultGenerator value');
      }

      if (this._propertyObservables.hasOwnProperty(propertyName)) {
        throw new Error('Object ' + this + ' already has property: ' + propertyName);
      }

      var writesSequence;
      if (_.isFunction(defaultGenerator)) {
        writesSequence = ModelHelper.addPropertyWithLazyDefault(propertyName, this._propertyObservables, initialValue, defaultGenerator);
      } else {
        writesSequence = ModelHelper.addProperty(propertyName, this._propertyObservables, initialValue);
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

    // Define a new ephemeral observable property. The arguments and behavior are the same as
    // defineObservableProperty, except that this property will not be serialized.
    defineEphemeralObservableProperty: function(propertyName, initialValue, defaultGenerator) {
      this.defineObservableProperty.apply(this, arguments);
      this._setObservablePropertyIsEphemeral(propertyName, true);
    },

    // Define a new observable property whose value is sourced by the given sequence.
    // Setting values on this property via setValue is not supported, and will result
    // in an error being thrown.
    // This property, being ephemeral, will not be serialized.
    defineEphemeralObservablePropertyFromSequence: function(propertyName, valueSequence) {
      var self = this;

      if (valueSequence && !_.isFunction(valueSequence.asObservable)) {
        throw new Error('Expected valueSequence to be an observable');
      }

      if (this._propertyObservables.hasOwnProperty(propertyName)) {
        throw new Error('Object ' + this + ' already has property: ' + propertyName);
      }

      ModelHelper.addReadOnlyProperty(propertyName, this._propertyObservables, valueSequence.asObservable()).
        subscribe(function(value) {
          self._writes.onNext({
            model: self,
            property: propertyName,
            newValue: value
          });
        });

      self._setObservablePropertyIsEphemeral(propertyName, true);

    },

    // Observes the given property. You can use dot notation to traverse deeply.
    // For example, a.observe('b.c.d'). Traversal will cross Models and plain objects.
    // Arrays are not traversed.
    // While traversing, if a null or undefined value is encountered (but is not the leaf),
    // will wait for that value to be defined/non-null before emitting any values.
    // When traversing Models, will throw an exception if an undefined property is encountered.
    // When traversing plain objects, will wait for that property to exist before emitting any values.
    // If propertyName is a (plain-old, regular) JS property on this
    // object, this function will still work, but changes will not be reported.
    observe: function(propertyName) {
      function deepGet(node, props) {
        if (props.length === 0) { return node; }

        // Slice off the first property.
        var firstProp = props[0];

        // The value of the first property on this object (as an observable).
        var thisLevelObs;
        if (_.has(node, firstProp)) {
          // A normal JS property.
          thisLevelObs = Rx.Observable.returnValue(node[firstProp]);
        } else if (_.isFunction(node.observe)) {
          // A Model property.
          node._assertProperty(firstProp);
          thisLevelObs = node._propertyObservables[firstProp];
        } else {
          // Interrupt the recursion.
          // Designed behavior is to wait for this property to show up.
          return Rx.Observable.never();
        }

        if (props.length === 1) {
          // This is the only property we're getting (no deep traversal).
          return thisLevelObs;
        } else {
          // Keep traversing, but wait for undefined/non-nulls to become
          // something.
          function isTraversible(thing) {
            return (typeof(thing) !== 'undefined') && (thing !== null);
          }
          return thisLevelObs.filter(isTraversible).map(function(value) {
            return deepGet(value, _.rest(props));
          }).switchLatest();
        }

      };

      return deepGet(this, propertyName.split('.'));
    },

    /**
     * Sets the named property on this model to the given value. Will throw an exception if that
     * property hasn't been defined on this Model.
     */
    set: function(propertyName, value) {
      this._assertProperty(propertyName);
      var oldValue = this.getCurrentValue(propertyName);
      this._writes.take(1).map(function(change) {
        return _.defaults({oldValue: oldValue}, change);
      }).subscribe(_.bind(this._sets.onNext, this._sets));
      this._propertyObservables[propertyName] = value;
    },

    // Unsets the named property, and forget it has ever been set.
    // Will throw an exception if that property
    // hasn't been defined on this Model.
    unset: function(propertyName) {
      this.set(propertyName, undefined);
      this._propertyHasBeenWritten[propertyName] = false;
    },

    // Returns true if any of these hold:
    //   * The property has been written by a call to set(), or
    //   * The property has been initialized to a non-undefined value via defineObservableProperty
    //     (either due to an initial value being provided or due to a lazy default resolving).
    isSet: function(propertyName) {
      return this._propertyHasBeenWritten[propertyName] === true;
    },

    /**
     * Sets the properties of this model to the values of the given model.
     *
     * @param {Model} otherModel The Model to get the new values from. The argument Model must be
     * the same type as (or a subclass of) this Model.
     */
    setFrom: function(otherModel) {
      angular.forEach(this._propertyObservables, function(subject, propertyName) {
        var newValue = otherModel.getCurrentValue(propertyName);
        if (newValue !== subject.value) {
          if (otherModel.isSet(propertyName)) {
            this.set(propertyName, newValue);
          } else {
            this.unset(propertyName);
          }
        }
      }, this);
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
      return ModelHelper.currentValueOfProperty(this._propertyObservables, propertyName);
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
      }

      _.forOwn(self._propertyObservables, function(seq, propertyName) {
        if (self._ephemeralProperties[propertyName]) {
          // Ephemeral properties are not serialized.
          return;
        }
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
    //   oldValue: <the previous value of the property>,
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
    },

    /**
     * Returns an observable that emits true when the model next gets dirtied, and false when it
     * next becomes clean.
     *
     * Specifically, when the model or any of its sub-models have any of their properties .set() to
     * a different value (ie the old value is not _.isEqual to the new value), emit true. If they
     * are .set() back to their original value (ie the new value is _.isEqual to the original
     * value), emit false.
     *
     * Note that this observable will only emit values for events that happen after you subscribe to
     * it. It will not emit its current state.
     *
     * @return {Rx.Observable} that emits true if the model becomes dirty, and false if it becomes
     *   clean again.
     */
    observeDirtied: function() {
      if (!this._dirtyObservable) {
        // A hook into the .scan so we can reset the changes hash to clean
        this._dirtyResetObservable = new Rx.Subject();
        this._dirtyObservable = Rx.Observable.merge(
          // Whenever page.set is called (or any of its children are .set), track those changes.
          this.observePropertyChangesRecursively().filter(function(change) {
            // Ignore changes that don't actually change the value
            return !_.isEqual(change.newValue, change.oldValue);
          }),
          this._dirtyResetObservable
        ).scan({}, function(changes, change) {
          if (change === null) {
            // A signal from _dirtyResetObservable. Clean the state.
            return {};
          } else {
            // If this change (to the given model and property) is a revert to its original value,
            // remove it from our changes hash. Otherwise, if we haven't recorded it yet, so record
            // its original value (so we can tell if it's reverted later).
            var modelChanges = changes[change.model.uniqueId];
            if (modelChanges) {
              // There are existing changes to this model. Check if it's to this property
              if (modelChanges.hasOwnProperty(change.property)) {
                if (_.isEqual(change.newValue, modelChanges[change.property])) {
                  // The change is to change it back to its original value. Remove it from our
                  // hash of properties-that-have-changed.
                  delete modelChanges[change.property];
                  if (_.isEmpty(modelChanges)) {
                    delete changes[change.model.uniqueId];
                  }
                }
              }
            } else {
              // No existing changes for this model. Create a hash to record the changes to this
              // model, and record the original value for the property that changed.
              modelChanges = {};
              modelChanges[change.property] = change.oldValue;
              changes[change.model.uniqueId] = modelChanges;
            }
            return changes;
          }
        }).map(_.isPresent).share();
      }
      return this._dirtyObservable;
    },

    /**
     * Resets the observable returned by {@link Model#observeDirtied}, to an undirtied state.
     */
    resetDirtied: function() {
      if (this._dirtyResetObservable) {
        this._dirtyResetObservable.onNext(null);
      }
    },


    ///////////////////////////////////////////////////////////////////////////
    ///////////////// Private implementation
    ///////////////////////////////////////////////////////////////////////////

    // Controls whether or not the named property is ephemeral.
    // Ephemeral properties are not serialized.
    // By default, properties are not ephemeral.
    // They are set to be ephemeral by the various public
    // APIs that define properties.
    _setObservablePropertyIsEphemeral: function(propertyName, isEphemeral) {
      this._assertProperty(propertyName);
      this._ephemeralProperties[propertyName] = isEphemeral;
    },


    // Throws if the given property is not defined on this Model.
    _assertProperty: function(propertyName) {
      if (!this._propertyObservables.hasOwnProperty(propertyName)) {
        throw new Error('Object {0} has no such property: {1}'.format(this.serialize(), propertyName));
      }
    },

    // Register the given model as our parent (as in, we're the value of
    // one of the parent's properties).
    // This is used to implement observePropertyChangesRecursively and
    // recursive dirty checking.
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
    }


  });

  return Model;
});
