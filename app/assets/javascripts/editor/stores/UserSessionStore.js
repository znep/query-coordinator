(function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function UserSessionStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _hasValidSession = true;

    this.register(function(payload) {

      switch (payload.action) {
        case Actions.API_REQUEST_RETURNED_401_UNAUTHORIZED:
          // A 401 from an API request is a good (but not sufficient) indication that
          // the user's session has timed out. So, after a 401, check the user session
          // explicitly.
          _checkUserSession();
          break;
      }
    });

    this.hasValidSession = function() {
      return _hasValidSession;
    };

    function _onCookieChange(callback) {
      var lastCookie = document.cookie;
      setInterval(function() {
        if (document.cookie !== lastCookie) {
          lastCookie = document.cookie;
          callback();
        }
      });
    }

    function _checkUserSession() {
      $.get('/api/users/current.json').then(
        function() {
          // success
          if (!_hasValidSession) {
            _hasValidSession = true;
            self._emitChange();
          }
        },
        function() {
          // error
          if (_hasValidSession) {
            _hasValidSession = false;
            self._emitChange();
          }
        }
      );
    }

    _onCookieChange(_.debounce(_checkUserSession, 250));
  }

  storyteller.UserSessionStore = UserSessionStore;
}(window.socrata));
