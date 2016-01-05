(function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;

  // Options (optional):
  //   - sessionCheckDebounceMilliseconds: Minimum amount of time between user session checks.
  //      Note that user session checks are not on a timer - they are triggered by AJAX failures,
  //      cookie changes, etc. Default: 250.
  //   - cookieCheckIntervalMilliseconds: Polling interval for cookie changes.
  //      NOTE! Core will often set new cookies for /api/users/current.json, causing
  //      an immediate cookie change. Having a large value here prevents rapid-fire
  //      requests, as changing cookies triggers a GET to /api/users/current.json.
  //      Default: 5000
  function UserSessionStore(options) {
    options = _.defaults(options || {}, {
      sessionCheckDebounceMilliseconds: 250,
      cookieCheckIntervalMilliseconds: 5000
    });

    _.extend(this, new storyteller.Store());

    var self = this;
    var _hasValidSession = true;
    var _loginInProgress = false;
    var _cookieCheckInterval = null;

    this.register(function(payload) {
      switch (payload.action) {
        case Actions.LOGIN_BUTTON_CLICK:
          _loginButtonClick();
          break;
      }
    });

    // On all XHR errors, check the status code. If the
    // error code suggests an expired session, recheck
    // the session.
    $(document).ajaxError(_onAjaxError);

    // Release all resources held by this store. Intended for testing.
    this._destroy = function() {
      $(document).off('ajaxError', _onAjaxError);
      clearInterval(_cookieCheckInterval);
    };

    /**
     * Returns true if a valid session is detected. Because session status is owned
     * by an external service (core), the return value of this function is on a best-effort
     * basis and may not immediately reflect reality.
     */
    this.hasValidSession = function() {
      return _hasValidSession;
    };

    /**
     * Returns true if a login is in progress (see LOGIN_BUTTON_CLICK action).
     */
    this.loginInProgress = function() {
      return _loginInProgress;
    };

    function _onAjaxError(event, jqXhr) {
      // See: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error
      // 401: Unauthorized.
      // 403: Forbidden. This _should_ mean that the current user simply does not have
      // the proper permissions (but the session is valid), but unfortunately core will
      // sometimes return 403 for expired sessions instead of the more correct 401.
      if (jqXhr.status === 401 || jqXhr.status === 403) {
        _checkUserSession();
      }
    }

    function _loginButtonClick() {
      if (!_loginInProgress) {
        // Just in case we haven't noticed yet, recheck the session.
        // Ideally we'd only set _loginInProgress to true if the session
        // is confirmed invalid, but due to how LoginWindowRenderer works
        // we _must_ set _loginInProgress synchronously (otherwise the browser
        // thinks the login window is a popup, and prevents it from opening).
        // As things are right now, if the user session magically becomes
        // valid, the login window will open and immediately close. This scenario
        // should be super rare so smoothing this out is not a priority.
        _checkUserSession();

        _loginInProgress = true;
        self._emitChange();
      }
    }

    function _onCookieChange(callback) {
      var lastCookie = document.cookie;
      _cookieCheckInterval = setInterval(function() {
        if (document.cookie !== lastCookie) {
          lastCookie = document.cookie;
          callback();
        }
      }, options.cookieCheckIntervalMilliseconds);
    }

    var _checkUserSession = _.debounce(function() {
      $.get('/api/users/current.json').then(
        function() {
          // success
          if (!_hasValidSession) {
            _hasValidSession = true;
            _loginInProgress = false;
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
    }, options.sessionCheckDebounceMilliseconds);

    _onCookieChange(_checkUserSession);
  }

  storyteller.UserSessionStore = UserSessionStore;
}(window.socrata));
