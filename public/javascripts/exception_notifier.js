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

        // Check to make sure that we are actually passing an error
        // to Airbrake, which expects an error and barfs out '[object Object]'
        // when it stupidly stringifies its arguments. This is the case right
        // now when a promise without an error handler is rejected; We should
        // probably take some time in the future to look at why promises in
        // our codebase do not handle error conditions robustly.
        if (!(exception instanceof Error)) {

          // This catches the special case of HTTP errors coming
          // back from rejected promises being objects but not
          // objects instantiating the 'Error' class. In this case
          // we try to recover some useful text rather than just
          // stringifying the entire object with gleeful abandon.
          if (exception.hasOwnProperty('data') &&
              exception.data.hasOwnProperty('error') &&
              typeof exception.data.error === 'string') {
            exception = new Error(String(exception.data.error));

          } else {
            exception = new Error(JSON.stringify(exception));
          }

        }

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
              nonExceptionArgs.map(JSON.stringify).join(', ')
            );
          }
        };

        return airbrakeLogger;
      });

      $httpProvider.interceptors.push('httpErrorInterceptor');
    });
})();
