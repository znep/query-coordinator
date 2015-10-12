(function() {
  'use strict';

  function httpConfig(config) {
    return _.extend({
      requester: this,
      cache: true
    }, config);
  }

  function UserSearchService($http, $q) {
    // Get a promise for user search results.
    // Will be rejected with an appropriate error
    // if nobody is logged in or there's another
    // issue searching for users.
    function find(query, options) {
      query = query || '';
      options = _.defaults(options || {}, {
        limit: 25
      });

      var config = httpConfig.call(this, {
        headers: {'Cache-Control': 'nocache'},
        airbrakeShouldIgnore404Errors: true
      });

      var url = $.baseUrl('/api/search/users.json');
      url.searchParams.set('q', query + '*');
      url.searchParams.set('limit', options.limit);

      return $http.get(url.href, config).then(function(response) {

        // If we got a flawed success response,
        // reject with null.
        if (_.isEmpty(response.data) && !_.isArray(response.data)) {
          return $q.reject(null);
        }

        // Otherwise, just pass the data along.
        return response.data.results || [];

      }, function() {

        // Always reject with null.
        return $q.reject(null);

      });
    }

    function results$(query, options) {
      return Rx.Observable.fromPromise(find(query, options)).
        catchException(Rx.Observable.returnValue(null));
    }

    return {
      find: find,
      results$: results$
    };
  }

  angular.
    module('socrataCommon.services').
      service('UserSearchService', UserSearchService);

})();
