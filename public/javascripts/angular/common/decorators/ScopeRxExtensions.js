(function() {
  'use strict';

  angular.
    module('socrataCommon.decorators').
    config(['$provide', function($provide) {
      $provide.decorator('$rootScope', ['$delegate', 'rx', 'observeOnScope', function($delegate, rx) {
        Object.defineProperties($delegate.constructor.prototype, {
          '$destroyAsObservable': {
            value: function $destroyAsObservable(element) {
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
            value: function $observe(expression) {
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
          },
          '$emitEventsFromObservable': {
            value: function $emitEventsFromObservable(eventName, observable) {
              var scope = this;

              if (_.isEmpty(eventName) || !_.isString(eventName)) {
                throw new Error('$emitEventsFromObservable not passed a string event name');
              }

              return observable.
                takeUntil(scope.$eventToObservable('$destroy')). //TakeUntil to avoid leaks.
                safeApply(scope, function(value) {
                  scope.$emit(eventName, value);
                }).
                subscribe();
            },
            enumerable: false,
            configurable: true,
            writable: true
          },
          '$safeApply': {
            // Execute the given function immediately if an angular digest-apply is
            // already in progress, otherwise starts a digest-apply cycle then executes
            // the function within that cycle.
            // This is often useful when combining Observables of arbitrary origin to
            // angular-related Observables.
            value: function $safeApply(fn) {
              var scope = this;
              var phase = scope.$root.$$phase;
              if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                  fn();
                }
              } else {
                scope.$apply(fn);
              }
            },
            enumerable: false,
            configurable: true,
            writable: true
          },
          '$bindObservable': {
            // Bind an observable sequence to a scope's property.
            // For example, this will cause the 'ticks' property
            // on scope $scope to increment every second:
            // $scope.bindObservable('ticks', Rx.Observable.interval(1000));
            // Separate optional callbacks are provided for error and completed cases.
            // In these, the value returned from the callback is applied to the scope's property.
            value: function $bindObservable(propName, observable, onError, onCompleted) {
              if (_.isEmpty(propName) || !_.isString(propName)) {
                throw new Error('Expected non-empty string property name');
              }
              if (!(observable instanceof Rx.Observable)) {
                throw new Error('Expected Rx.Observable instance');
              }
              if (onError && !_.isFunction(onError)) {
                throw new Error('onError provided, but it is not a function.');
              }
              if (onCompleted && !_.isFunction(onCompleted)) {
                throw new Error('onCompleted provided, but it is not a function.');
              }

              var scope = this;
              function set(newValue) {
                scope.$safeApply(function() {
                  scope[propName] = newValue;
                });
              }

              function errorHandler(error) {
                set(onError.apply(this, arguments));
              }

              function completedHandler() {
                set(onCompleted.apply(this, arguments));
              }

              /**
               * The default error handler for Rx.Observable.fromPromise will throw whatever parameter it's
               * given, if the promise goes to the error state. For $http promises, this is just the response
               * object, so we lose stack information, etc. So - only throw actual Errors.
               *
               * Exceptions are passed through but are augmented with a tag (extra message),
               * causeScope, and causeBoundProperty.
               */
              function defaultErrorHandler(e) {
                var genericErrorMessage = '$bindObservable: Unhandled error in sequence bound to property {0} of scope {1}'.
                  format(propName, scope.$id);
                if (e instanceof Error) {
                  // For debugging, place the message on the Error instance.
                  e.tag = genericErrorMessage;
                  e.causeScope = scope;
                  e.causeBoundProperty = propName;
                  throw e;
                }
                $log.error(genericErrorMessage, e);
              }

              observable.
                takeUntil(scope.$eventToObservable('$destroy')). //TakeUntil to avoid leaks.
                subscribe(
                set,
                onError ? errorHandler : defaultErrorHandler,
                onCompleted ? completedHandler : undefined
              );
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
