angular.module('socrataCommon.services').factory('AngularRxExtensions', function(Assert, $log) {
  'use strict';

  var extensions = {
    // Bind an observable sequence to a scope's property.
    // For example, this will cause the 'ticks' property
    // on scope $scope to increment every second:
    // $scope.bindObservable('ticks', Rx.Observable.interval(1000));
    // Separate optional callbacks are provided for error and completed cases.
    // In these, the value returned from the callback is applied to the scope's property.
    bindObservable: function bindObservable(propName, observable, onError, onCompleted) {
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

      var self = this;
      function set(newValue) {
        self.$safeApply(function() {
          self[propName] = newValue;
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
        var genericErrorMessage = 'bindObservable: Unhandled error in sequence bound to property {0} of scope {1}'.
          format(propName, self.$id);
        if (e instanceof Error) {
          // For debugging, place the message on the Error instance.
          e.tag = genericErrorMessage;
          e.causeScope = self;
          e.causeBoundProperty = propName;
          throw e;
        }
        $log.error(genericErrorMessage, e);
      }

      observable.
        takeUntil(self.$destroyAsObservable()). //TakeUntil to avoid leaks.
        subscribe(
          set,
          onError ? errorHandler : defaultErrorHandler,
          onCompleted ? completedHandler : undefined
        );
    }
  };

  return {
    // Installs the extensions on the given scope.
    install: function(scope) {
      // Merge, but hard error on naming collisions.
      _.forOwn(extensions, function(implementation, name) {
        if (!_.isUndefined(scope[name]) && scope[name] !== implementation) {
          throw new Error('Naming collision: scope.bindObservable.');
        } else {
          scope[name] = implementation;
        }
      });
    }
  };

});
