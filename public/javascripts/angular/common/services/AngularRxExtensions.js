angular.module('socrataCommon.services').factory('AngularRxExtensions', function() {
  var extensions = {
    // Execute the given function immediately if an angular digest-apply is
    // already in progress, otherwise starts a digest-apply cycle then executes
    // the function within that cycle.
    // This is often useful when combining Observables of arbitrary origin to
    // angular-related Observables.
    safeApply: function safeApply(fn) {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        if (fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    },

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
        self.safeApply(function() {
          self[propName] = newValue;
        });
      };

      function errorHandler(error) {
        set(onError.apply(this, arguments));
      };
      function completedHandler() {
        set(onCompleted.apply(this, arguments));
      };

      observable.
        takeUntil(self.eventToObservable('$destroy')). //TakeUntil to avoid leaks.
        subscribe(
          set,
          onError ? errorHandler : undefined,
          onCompleted ? completedHandler : undefined
        );
    },

    observe: function observe(expression) {
      var evaluatedExpression = this.$eval(expression);
      var observable = new Rx.BehaviorSubject(evaluatedExpression);
      this.$watch(expression, function(value) {
        if (value !== evaluatedExpression) {
          evaluatedExpression = value;
          observable.onNext(value);
        }
      });

      return observable
        .takeUntil(this.eventToObservable('$destroy')); //TakeUntil to avoid leaks.
    },

    eventToObservable: function eventToObservable(eventName) {
      if (_.isEmpty(eventName) || !_.isString(eventName)) {
        throw new Error('eventToObservable not passed a string event name');
      }

      var eventSubject = new Rx.Subject();
      this.$on(eventName, function(event) {
        eventSubject.onNext( { event: event, args: _.rest(arguments) } );
      });
      if (eventName == '$destroy') {
        return eventSubject.take(1);
      } else {
        return eventSubject.takeUntil(this.eventToObservable('$destroy'));
      }
    },

    emitEventsFromObservable: function emitEventsFromObservable(eventName, observable) {
      var self = this;

      if (_.isEmpty(eventName) || !_.isString(eventName)) {
        throw new Error('emitEventsFromObservable not passed a string event name');
      }

      return observable.
        takeUntil(self.eventToObservable('$destroy')). //TakeUntil to avoid leaks.
        subscribe(
          function(value) {
          self.safeApply(function() {
            self.$emit(eventName, value);
          }
        );
      });
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
