(function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;

  function UserSessionStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _hasValidSession = true;

    // On all XHR errors, check the status code. If the
    // error code suggests an expired session, recheck
    // the session.
    $(document).ajaxError(function(event, jqXhr) {
      // See: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error
      // 401: Unauthorized.
      // 403: Forbidden. This _should_ mean that the current user simply does not have
      // the proper permissions (but the session is valid), but unfortunately core will
      // sometimes return 403 for expired sessions instead of the more correct 401.
      if (jqXhr.status === 401 || jqXhr.status === 403) {
        _checkUserSession();
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

    var _checkUserSession = _.debounce(function() {
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
    }, 250);

    _onCookieChange(_checkUserSession);
  }

  storyteller.UserSessionStore = UserSessionStore;
}(window.socrata));
