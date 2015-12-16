(function() {
  'use strict';

  function httpConfig(config) {
    return _.extend({
      requester: this,
      cache: true
    }, config);
  }

  function UserSearchService($http, $q) {

    // Helper for rejection branches.
    function reject() {
      return $q.reject(null);
    }

    // Get a promise for user search results.
    // Will be rejected with an appropriate error
    // if nobody is logged in or there's another
    // issue searching for users.
    function find(query, options) {
      query = query || '';
      options = _.defaults(options || {}, {
        limit: 25
      });

      // To work around deficiencies in the backend service,
      // we can escape characters that can be interpreted specially by Lucene.
      // Some of the characters are correctly escaped already, but not all.
      // The character group below should be adjusted as problem cases arise.
      // (Or, if the backend service improves, we can remove characters!)
      query = query.replace(/([?])/g, '\\$1');

      var config = httpConfig.call(this, {
        headers: {'Cache-Control': 'nocache'},
        airbrakeShouldIgnore404Errors: true
      });

      var url = $.baseUrl('/api/search/users.json');
      url.searchParams.set('q', query + '*');
      url.searchParams.set('limit', options.limit);

      return $http.get(url.href, config).then(function(fuzzySearchResponse) {

        // If we got a flawed success response,
        // something in the backend service is likely to have generated an error.
        if (_.isEmpty(fuzzySearchResponse.data) && !_.isArray(fuzzySearchResponse.data)) {
          return reject();
        }

        // Otherwise, store the fuzzy search results and fire an exact search.
        var fuzzyResults = fuzzySearchResponse.data.results || [];
        url.searchParams.set('q', query);

        return $http.get(url.href, config).then(function(exactSearchResponse) {
          // If we got a flawed success response,
          // something in the backend service is likely to have generated an error.
          if (_.isEmpty(exactSearchResponse.data) && !_.isArray(exactSearchResponse.data)) {
            return reject();
          }

          // Otherwise, combine these results with the fuzzy search results
          // and resolve the promise chain.
          var exactResults = exactSearchResponse.data.results || [];

          return _.uniq([].concat(fuzzyResults, exactResults), 'id');
        }, reject);
      }, reject);
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
