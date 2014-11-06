(function() {
  function pushExceptionToAirbrake(exception, cause) {
    var stackTrace;
    var exceptionInformation;

    try {
      stackTrace = new StackTrace().fromError(exception).join("\n");
    } catch(stackTraceError) { }

    exceptionInformation = { error: exception, context: {} };

    if (cause) {
      exceptionInformation.context.cause = cause;
    }

    if (!stackTrace && exception.stack) {
      stackTrace = exception.stack;
    }

    if (stackTrace) {
      exceptionInformation.context.stackTrace = stackTrace;
    }

    try {
      Airbrake.push(exceptionInformation);
    } catch (airbrakeError) {
      if (console && console.error) {
        console.error("Exception encountered when reporting an error to Airbrake: ", airbrakeError);
      }
    }
  }

  angular.module('exceptionNotifier', []).
    factory('$exceptionHandler', function ($log) {
      return function(exception, cause) {
        pushExceptionToAirbrake(exception, cause);
        $log.error(exception);
      };
    }).
    factory('httpErrorInterceptor', function ($q) {
      return {
        responseError: function responseError(rejection) {
          if (!rejection.config.hasOwnProperty('airbrakeShouldIgnore404Errors') &&
              !rejection.config.airbrakeShouldIgnore404Errors) {
            try {
              Airbrake.push({
                error: new Error('HTTP response error'),
                context: {
                  config: rejection.config,
                  status: rejection.status
                }
              });
            } catch(airbrakeError) {
              $log.error("Exception encountered when reporting an HTTP error to Airbrake: ", airbrakeError);
            }
          }
          return $q.reject(rejection);
        }
      }
    }).
    config(function($httpProvider, $provide) {
      // Decorate the logger to log errors to Airbrake.
      $provide.decorator('$log', function($delegate) {
        var airbrakeLogger = Object.create($delegate);
        airbrakeLogger.error = function logErrorToAirbrake() {
          $delegate.error.apply($delegate, arguments);

          // Use the logged exception if possible.
          var loggedException = _.find(arguments, function(arg) {
            return arg instanceof Error;
          });

          var nonExceptionArgs = _.filter(arguments, function(arg) {
            return !(arg instanceof Error);
          });

          if (loggedException) {
            pushExceptionToAirbrake(
              loggedException,
              nonExceptionArgs.join(', ')
            );
          } else {
            pushExceptionToAirbrake(
              new Error(nonExceptionArgs.join(', '))
            );
          }
        };

        return airbrakeLogger;
      });

      $httpProvider.interceptors.push('httpErrorInterceptor');
    });
})();
