(function() {
  'use strict';
  var extend = _.extend;
  var forEach = _.forEach;
  var requestIdHeaderName = 'X-Socrata-RequestId';

  function httpProvider($http, $rootScope, moment, RequestId) {
    function http(requestConfig) {
      var eventMetadata = {
        startTime: moment().valueOf()
      };
      var id;

      if (requestConfig.hasOwnProperty('requester') && _.isFunction(requestConfig.requester.requesterLabel)) {
        eventMetadata.requester = requestConfig.requester;
        eventMetadata.requesterLabel = requestConfig.requester.requesterLabel.call(requestConfig.requester);
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
      var httpPromise = $http(requestConfig);

      function emitEventFn(eventLabel) {
        return function() {
          $rootScope.$emit(eventLabel, extend({ stopTime: moment().valueOf() }, eventMetadata));
        };
      }
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
    function createShortMethods(names) {
      forEach(arguments, function(name) {
        http[name] = function(url, config) {
          return http(extend(config || {}, {
            method: name,
            url: url
          }));
        };
      });
    }


    function createShortMethodsWithData(name) {
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
})();
