angular.module('exceptionNotifier', []).
  factory('$exceptionHandler', function ($log) {
    return function(exception, cause) {
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

      Airbrake.push(exceptionInformation);
      $log.error(exception);
    };
  }).
  factory('httpErrorInterceptor', function ($q) {
    return {
      responseError: function responseError(rejection) {
        Airbrake.push({
          error: new Error('HTTP response error'),
          context: {
            config: rejection.config,
            status: rejection.status
          }
        });
        return $q.reject(rejection);
      }
    }
  }).
  config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('httpErrorInterceptor');
  }]);
