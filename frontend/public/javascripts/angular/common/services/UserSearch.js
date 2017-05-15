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
    url.searchParams.set('q', query);

    return $http.get(url.href, config).then(function(searchResponse) {
      // If we got a flawed success response,
      // something in the backend service is likely to have generated an error.
      if (_.isEmpty(searchResponse.data) && !_.isArray(searchResponse.data)) {
        return reject();
      }
      return searchResponse.data || [];
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
};
