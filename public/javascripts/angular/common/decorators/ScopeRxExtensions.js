(function() {
  'use strict';

  angular.
    module('socrataCommon.decorators').
    config(['$provide', function($provide) {
      $provide.decorator('$rootScope', ['$delegate', 'rx', 'observeOnScope', function($delegate, rx) {
        Object.defineProperties($delegate.constructor.prototype, {
          '$destroyAsObservable': {
            value: function(element) {
              var scope = this;
              return rx.Observable.merge(
                  scope.$eventToObservable('$destroy'),
                  element ?
                    rx.Observable.fromEvent(element, '$destroy') :
                    rx.Observable.empty()
                ).
                take(1).
                publish().
                refCount();
            },
            enumerable: false,
            configurable: true,
            writable: true
          },
/* TODO: Use this version, but needs tests to pass for the table directive :(
          '$observe': {
            value: function(watchExpression, objectEquality) {
              var scope = this;
              return scope.$toObservable(watchExpression, objectEquality).
                pluck('newValue').
                takeUntil(scope.$eventToObservable('$destroy')).
                publish().
                refCount();
            },
            enumerable: false,
            configurable: true,
            writable: true
          },
*/
          '$observe': {
            value: function observe(expression) {
              var scope = this;
              var evaluatedExpression = scope.$eval(expression);
              var observable = new Rx.BehaviorSubject(evaluatedExpression);
              scope.$watch(expression, function(value) {
                if (value !== evaluatedExpression) {
                  evaluatedExpression = value;
                  observable.onNext(value);
                }
              });

              return observable
                .takeUntil(scope.$eventToObservable('$destroy')); //TakeUntil to avoid leaks.
            },
            enumerable: false,
            configurable: true,
            writable: true
          }
        });

        return $delegate;
      }]);
    }]);

})();
