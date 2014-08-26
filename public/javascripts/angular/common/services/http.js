(function() {
  'use strict';
  var extend = _.extend;
  var forEach = _.forEach;
  var requestIdHeaderName = 'X-Socrata-RequestId';

  function httpProvider($http, RequestId) {
    function http(requestConfig) {
      var id = RequestId.generate();

      if (requestConfig.hasOwnProperty('headers')) {
        var hasHeader = requestConfig.headers.hasOwnProperty(requestIdHeaderName);

        if (hasHeader) {
          return $http(requestConfig);
        }

        var hasSimilarHeader = _(requestConfig.headers).chain().keys().find(function(key) {
          return key.toLowerCase() === requestIdHeaderName.toLowerCase();
        }).value();

        if (hasSimilarHeader) {
          throw new Error('Conflicting Request ID');
        }

        requestConfig.headers[requestIdHeaderName] = id;
      } else {
        requestConfig.headers = {};
        requestConfig.headers[requestIdHeaderName] = id;
      }
      return $http(requestConfig);
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
