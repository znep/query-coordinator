// Service to build rich models.
// REVISIT possibly start exposing a Model superclass?
angular.module('dataCards.services').factory('ModelHelper', function() {
  // For a hack - see currentValueOfProperty.
  var currentValuePropertyNamePrefix = '__current_value_';

  // Adds a (RxJS) observable of the given name to the object provided. The default value
  // is specified.
  // Returns a sequence of values set to this property (including the initial value).
  function addProperty(propertyName, model, initialValue) {
    var subject = new Rx.BehaviorSubject(initialValue);
    Object.defineProperty(model, propertyName, {
      get: _.constant(subject),
      set: function(val) {
        subject.onNext(val);
      },
      enumerable: true
    });

    Object.defineProperty(model, currentValuePropertyNamePrefix + propertyName, {
      get: function() {
        return subject.value;
      }
    });
    return subject;
  };

  // Adds an (RxJS) observable of the given name to the object provided. The default value
  // is specified as a function which returns a sequence or promise. If a sequence is used, the first value
  // is used.
  // This allows us to skip requesting the default value until something subscribes to the property.
  // Until the default value is fetched, the property will have a value given by `initialValue`.
  //
  // Returns a sequence of values set to this property (including the initial and lazy values, if used).
  function addPropertyWithLazyDefault(propertyName, model, initialValue, defaultValueGenerator) {
    // These two sequences represent values from the lazy default promise and this property's
    // setter, respectively.
    var fromDefault = new Rx.AsyncSubject();
    var fromSetter = new Rx.Subject();

    // This sequence is the first value from either the lazy default or the setter.
    var firstValue = Rx.Observable.merge(fromDefault, fromSetter).take(1);

    // This is the actual subject exposed to the property consumer.
    // The first value comes from either the lazy default if required, or the property setter.
    // Future values always come from the property setter.
    var outer = new Rx.BehaviorSubject(initialValue);
    Rx.Observable.concat(firstValue, fromSetter).subscribe(outer);

    // Track whether or not we need to fetch the default value.
    var needsDefaultValueHit = true;
    firstValue.any().subscribe(function(any) {
      needsDefaultValueHit = !any;
    });

    var seq = Rx.Observable.create(function(observer) {
      if (needsDefaultValueHit) {
        needsDefaultValueHit = false;
        var defaultValueResult = defaultValueGenerator(model);
        var useAsPromise = _.isFunction(defaultValueResult.then) && !_.isFunction(defaultValueResult.subscribe);
        var defaultValueSeq = useAsPromise ?
          Rx.Observable.fromPromise(defaultValueResult) :
          defaultValueResult.first();

        defaultValueSeq.subscribe(fromDefault);
      }
      outer.subscribe(observer);
    });

    Object.defineProperty(model, propertyName, {
      get: function() {
        return seq;
      },
      set: function(n) {
        fromSetter.onNext(n);
      },
      enumerable: true
    });

    Object.defineProperty(model, currentValuePropertyNamePrefix + propertyName, {
      get: function() {
        return outer.value;
      }
    });

    return outer;
  };

  // Add a read-only property whose value comes from the given sequence.
  // Returns a sequence of values written while observers were listening.
  function addReadOnlyProperty(propertyName, model, valueSequence) {
    var lastSeenValue = new Rx.BehaviorSubject(undefined);
    var sideEffectedSequence = valueSequence.doAction(function(value) {
      lastSeenValue.onNext(value);
    });

    Object.defineProperty(model, propertyName, {
      get: _.constant(sideEffectedSequence),
      enumerable: true
    });

    Object.defineProperty(model, currentValuePropertyNamePrefix + propertyName, {
      get: function() {
        return lastSeenValue.value;
      }
    });

    return lastSeenValue.skip(1); // Skip first, as it's going to be the initial undefined value from the BehaviorSubject.
  };

  // A hack to expose a property's instantaneous value. When ModelHelper is moved back
  // into Model, this should go away (and its spirit moved into Model.getCurrentValue).
  function currentValueOfProperty(model, propertyName) {
    return model[currentValuePropertyNamePrefix + propertyName];
  };

  return {
    addProperty: addProperty,
    addPropertyWithLazyDefault: addPropertyWithLazyDefault,
    addReadOnlyProperty: addReadOnlyProperty,
    currentValueOfProperty: currentValueOfProperty
  };
});
