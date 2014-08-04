angular.module('dataCards.services').factory('AngularRxExtensions', function() {
  // Execute the given function immediately if an angular digest-apply is
  // already in progress, otherwise starts a digest-apply cycle then executes
  // the function within that cycle.
  // This is often useful when combining Observables of arbitrary origin to
  // angular-related Observables.
  function safeApply(fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  }

  // Bind an observable sequence to a scope's property.
  // For example, this will cause the 'ticks' property
  // on scope $scope to increment every second:
  // $scope.bindObservable('ticks', Rx.Observable.interval(1000));
  function bindObservable(propName, observable) {
    if (_.isEmpty(propName) || !_.isString(propName)) {
      throw new Error('Expected non-empty string property name');
    }
    if (!(observable instanceof Rx.Observable)) {
      throw new Error('Expected Rx.Observable instance');
    }
    var self = this;
    observable.subscribe(function(newValue) {
      self.safeApply(function() {
        self[propName] = newValue;
      });
    });
  }

  function observe(expression) {
    var evaluatedExpression = this.$eval(expression);
    var observable = new Rx.BehaviorSubject(evaluatedExpression);
    this.$watch(expression, function(value) {
      if (value !== evaluatedExpression) {
        evaluatedExpression = value;
        observable.onNext(value);
      }
    });

    return observable;
  }

  return {
    // Installs the extensions on the given scope.
    // Typical usage is to install on the root scope, so
    // all scopes get the extensions.
    install: function(scope) {
      // Hard error on naming collisions.
      if (!_.isUndefined(scope.bindObservable) && scope.bindObservable !== bindObservable) {
        throw new Error('Naming collision: scope.bindObservable.');
      }
      if (!_.isUndefined(scope.observe) && scope.observe !== observe) {
        throw new Error('Naming collision: scope.observe.');
      }

      scope.bindObservable = bindObservable;
      scope.observe = observe;
      scope.safeApply = safeApply;
    }
  };

});
