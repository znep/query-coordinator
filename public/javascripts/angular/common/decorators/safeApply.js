const angular = require('angular');

angular.module('rx').config(function($provide) {
  $provide.decorator('rx', ['$delegate', function($delegate) {
    var Observable = $delegate.Observable;

    function makeSafeApplyTap(tapType) {
      return function($scope, fn) {
        fn = _.isFunction(fn) ? fn : _.noop;

        return this[tapType](function(data) {
          ($scope.$$phase || $scope.$root.$$phase) ? // eslint-disable-line angular/no-private-call
            fn(data) :
            $scope.$apply(function() { fn(data); });
        });
      };
    }

    Observable.prototype.safeApplyOnError = makeSafeApplyTap('tapOnError');
    Observable.prototype.safeApplyOnCompleted = makeSafeApplyTap('tapOnCompleted');
    Observable.prototype.safeApplyFinally = makeSafeApplyTap('finally');

    Observable.prototype.safeApplySubscribe = function($scope, onNext, onError, onCompleted) {
      onNext = _.isFunction(onNext) ? onNext : _.noop;
      onError = _.isFunction(onError) ? onError : _.noop;
      onCompleted = _.isFunction(onCompleted) ? onCompleted : _.noop;

      return this.
      safeApply($scope, onNext).
      safeApplyOnError($scope, onError).
      safeApplyOnCompleted($scope, onCompleted).
      subscribe();
    };

    return $delegate;

  }]);
});
