// Service to build rich models.
// REVISIT possibly start exposing a Model superclass?
angular.module('dataCards.services').factory('ModelHelper', function() {
  // Adds an (RxJS) observable of the given name to the object provided. The default value
  // is specified as a function which returns a promise. This allows us to skip requesting
  // the default value unless necessary.
  //
  // The default lazy value promise is generated if the property getter is called before
  // the setter.
  function addPropertyWithLazyDefault(propertyName, model, defaultValuePromiseGenerator) {
    // These two sequences represent values from the lazy default promise and this property's
    // setter, respectively.
    var fromDefault = new Rx.AsyncSubject();
    var fromSet = new Rx.Subject();

    // This sequence is the first value from either the lazy default or the setter.
    var firstValue = Rx.Observable.merge(fromDefault, fromSet).take(1);

    // This is the actual subject exposed to the property consumer.
    // The first value comes from either the lazy default if required, or the property setter.
    // Future values always come from the property setter.
    var outer = new Rx.BehaviorSubject();
    Rx.Observable.concat(firstValue, fromSet).subscribe(outer);

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
        fromSet.onNext(n);
      }
    });
  };

  return {
    addPropertyWithLazyDefault: addPropertyWithLazyDefault
  };
});
