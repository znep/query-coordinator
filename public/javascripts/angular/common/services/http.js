const angular = require('angular');
var extend = _.extend;
var forEach = _.forEach;
var requestIdHeaderName = 'X-Socrata-RequestId';

function addCSRF(config) {
  if (!config.xsrfHeaderName) {
    config.xsrfHeaderName = 'X-CSRF-Token';
    config.xsrfCookieName = 'socrata-csrf-token';
  }
}

function httpProvider($http, $rootScope, RequestId, $log) {
  function http(requestConfig) {
    var id;
    var eventMetadata = {
      startTime: Date.now()
    };

    if (_.isObject(requestConfig.requester)) {
      if (_.isFunction(requestConfig.requester.requesterLabel)) {
        eventMetadata.requester = requestConfig.requester;
        eventMetadata.requesterLabel = requestConfig.requester.requesterLabel.call(requestConfig.requester);
      }
    } else {
      $log.debug('HTTP Service Error: requestConfig.requester was undefined for request to: "' + requestConfig.url + '".');
    }

    $rootScope.$emit('http:start', eventMetadata);
    id = RequestId.generate();

    if (requestConfig.hasOwnProperty('headers')) {
      var hasHeader = requestConfig.headers.hasOwnProperty(requestIdHeaderName);

      if (!hasHeader) {
        var hasSimilarHeader = _(requestConfig.headers).chain().keys().find(function(key) {
          return key.toLowerCase() === requestIdHeaderName.toLowerCase();
        }).value();

        if (hasSimilarHeader) {
          throw new Error('Conflicting Request ID');
        }

        requestConfig.headers[requestIdHeaderName] = id;
      }
    } else {
      requestConfig.headers = {};
      requestConfig.headers[requestIdHeaderName] = id;
    }

    // Error if the csrfRequired option is missing or truthy, the CSRF token is missing, and the
    // request is a PUT, POST, PATCH, or DELETE.
    var csrfMethods = [ 'put', 'post', 'patch', 'delete' ];
    var csrfRequired = _.get(requestConfig, 'csrfRequired', true) && _.includes(csrfMethods, requestConfig.method);
    var csrfCookie = socrata.utils.getCookie('socrata-csrf-token');
    if (csrfCookie) {
      requestConfig.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie);
    } else if (csrfRequired) {
      throw new Error(`Missing socrata-csrf-token - Unable to make authenticated "${requestConfig.method}" request to ${requestConfig.url}`);
    }

    addCSRF(requestConfig);

    function emitEventFn(eventLabel) {
      return function() {
        $rootScope.$emit(eventLabel, extend({ stopTime: Date.now() }, eventMetadata));
      };
    }

    var httpPromise = $http(requestConfig);
    httpPromise.then(
      emitEventFn('http:stop'),
      emitEventFn('http:error')
    );

    return httpPromise;
  }

  createShortMethods('delete', 'get', 'head', 'jsonp');
  createShortMethodsWithData('patch', 'post', 'put');

  return http;

  // Borrowed from main AngularJS $http
  function createShortMethods() {
    forEach(arguments, function(name) {
      http[name] = function(url, config) {
        return http(extend(config || {}, {
          method: name,
          url: url
        }));
      };
    });
  }

  function createShortMethodsWithData() {
    forEach(arguments, function(name) {
      http[name] = function(url, data, config) {
        return http(extend(config || {}, {
          method: name,
          url: url,
          data: data
        }));
      };
    });
  }
}

angular.
  module('socrataCommon.services').
  service('http', httpProvider);
