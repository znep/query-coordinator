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

  return {
    // Installs the extensions on the given scope.
    // Typical usage is to install on the root scope, so
    // all scopes get the extensions.
    install: function(scope) {
      // Bind an observable sequence to a scope's property.
      // For example, this will cause the 'ticks' property
      // on scope $scope to increment every second:
      // $scope.bindObservable('ticks', Rx.Observable.interval(1000));
      scope.bindObservable = function(propName, observable) {
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
    }
  };
});
