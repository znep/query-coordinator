(function() {
  'use strict';
  var extend = _.extend;
  var forEach = _.forEach;

  function httpProvider($http, guid) {
    function http(requestConfig) {
      var requestId = guid;

      if (requestConfig.hasOwnProperty('headers')) {
        var hasHeader = requestConfig.headers.hasOwnProperty('X-Socrata-RequestID');

        if (hasHeader) {
          return $http(requestConfig);
        }

        var hasSimilarHeader = _(requestConfig.headers).chain().keys().find(function(key) {
          return key.toLowerCase() === 'x-socrata-requestid';
        }).value();

        if (hasSimilarHeader) {
          throw new Error('Conflicting Request ID');
        }

        requestConfig.headers['X-Socrata-RequestID'] = requestId;
      } else {
        requestConfig.headers = {
          'X-Socrata-RequestID': requestId
        };
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
