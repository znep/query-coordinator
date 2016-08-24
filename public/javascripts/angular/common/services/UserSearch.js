function httpConfig(config) {
  return _.extend({
    requester: this,
    cache: true
  }, config);
}

module.exports = function UserSearchService($http, $q, rx) {
  const Rx = rx;

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

    var config = httpConfig.call(this, {
      headers: {'Cache-Control': 'nocache'},
      airbrakeShouldIgnore404Errors: true
    });

    var url = $.baseUrl('/cetera/users');
    url.searchParams.set('limit', options.limit);
    url.searchParams.set('q', query + '*');

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

        var combinedResults = _.uniqBy([].concat(fuzzyResults, exactResults), 'id');
        return combinedResults.map(injectDisplayName);
      }, reject);
    }, reject);
  }

  // Note that this is mimicking the displayName that would have been returned by Cly.
  // Cetera currently returns screen_name rather than displayName from its users endpoint.
  function injectDisplayName(result) {
    var screenName = _.get(result, 'screen_name', null);

    return _.merge(result, {
      displayName: _.isEmpty(screenName) ? '-' : screenName
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
};
