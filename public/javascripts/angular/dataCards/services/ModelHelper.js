// Service to build rich models.
// REVISIT possibly start exposing a Model superclass?
angular.module('dataCards.services').factory('ModelHelper', function() {
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
    return subject;
  };

  // Adds an (RxJS) observable of the given name to the object provided. The default value
  // is specified as a function which returns a promise. This allows us to skip requesting
  // the default value unless someone causes a read on the property.
  // Until the default value is fetched, the property will have a value given by `initialValue`.
  //
  // Returns a sequence of values set to this property (including the initial and lazy values, if used).
  function addPropertyWithLazyDefault(propertyName, model, initialValue, defaultValuePromiseGenerator) {
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

    Object.defineProperty(model, propertyName, {
      get: function() {
        if (needsDefaultValueHit) {
          needsDefaultValueHit = false;
          var promise = defaultValuePromiseGenerator(model); //TODO save this promise to implement revertToDefault.
          Rx.Observable.fromPromise(promise).subscribe(fromDefault);
        };
        return outer;
      },
      set: function(n) {
        fromSetter.onNext(n);
      },
      enumerable: true
    });

    return outer;
  };

  return {
    addProperty: addProperty,
    addPropertyWithLazyDefault: addPropertyWithLazyDefault
  };
});
