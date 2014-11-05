(function() {
  'use strict';

  // Errors that can happen within this service.
  var Errors = {
    NotLoggedIn: function(){},
    UnknownError: function(code, message) { this.code = code; this.message = message; }
  };

  function httpConfig(config) {
    return _.extend({
      requester: this,
      cache: true
    }, config);
  }

  function UserSessionService($http, $q) {
    function User(id) {
      this.id = id;
      if (!id) {
        throw new Error('User class must be given an ID');
      }
    };

    // Get a promise for the current user.
    // Will be rejected with an appropriate error
    // if nobody is logged in or there's another
    // issue getting the current user from the backend.
    function getCurrentUser() {
      // NOTE: If nobody is logged in, then this returns a 404.

      var config = httpConfig.call(this, { headers: {'Cache-Control': 'nocache'}, 'airbrakeShouldIgnore404Errors': true });

      return $http.get('/api/users/current.json', config).then(function(response) {
        // 200s
        if (_.isEmpty(response.data)) {
          return $q.reject(new Errors.UnknownError(null, 'Empty reply from users service API call.'));
        }
        if (response.data.error) {
          return $q.reject(new Errors.UnknownError(response.data.code, response.data.message));
        }
        if (!response.data.id) {
          return $q.reject(new Errors.UnknownError(null, 'Missing ID from user service API response'));
        }

        //TODO when needed, do a real User.deserialize. The response
        //contains many fields of interest.
        return new User(response.data.id);
      }, function(response) {
        // 400s, 500s
        if (response.status === 404) {
          // Note that not_found is considered an error by the API.
          return $q.reject(new Errors.NotLoggedIn());
        }
        if (_.isEmpty(response.data)) {
          return $q.reject(new Errors.UnknownError(null, 'Empty reply from users service API call.'));
        }
        if (response.data.error) {
          return $q.reject(new Errors.UnknownError(response.data.code, response.data.message));
        }
        // If error isn't true, let the issue fall through the default error handlers.
      });
    };

    return {
      getCurrentUser: getCurrentUser,
      Errors: Errors
    }
  }

  angular.
    module('dataCards.services').
      factory('UserSession', UserSessionService);

})();
