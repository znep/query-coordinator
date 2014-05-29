angular.module('dataCards.services').factory('AngularRxExtensions', function($rootScope, $log) {
  // Execute the given function immediately if an angular digest-apply is
  // already in progress, otherwise starts a digest-apply cycle then executes
  // the function within that cycle.
  function safeApply(scope, fn) {
    var phase = scope.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      scope.$apply(fn);
    }
  };

  // Bind an observable sequence to a scope's property.
  // For example, this will cause the 'ticks' property
  // on scope $scope to increment every second:
  // $scope.bindObservable('ticks', Rx.Observable.interval(1000));
  function bindObservable(propName, observable) {
    if (_.isEmpty(propName) || !_.isString(propName)) { throw new Error('Expected non-empty string property name'); }
    if (!(observable instanceof Rx.Observable)) { throw new Error('Expected Rx.Observable instance'); }
    var self = this;
    observable.subscribe(function(newValue) {
      safeApply(self, function() {
        $log.info('TRACE: setting ' + propName + ' to', newValue);
        self[propName] = newValue;
      });
    });
  };

  function observe(expression) {
    var observable = new Rx.BehaviorSubject(this.$eval(expression));
    this.$watch(expression, function(value) {
      observable.onNext(value);
    });

    return observable;
  };

  return {
    // Installs the extensions on the given scope.
    // Typical usage is to install on the root scope, so
    // all scopes get the extensions.
    install: function(scope) {
      scope.bindObservable = bindObservable;
      scope.observe = observe;
    }
  };
});
