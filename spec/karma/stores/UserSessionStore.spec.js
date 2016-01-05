describe('UserSessionStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;
  var store;
  var server;
  var ajaxErrorStub;

  function callAjaxErrorWith401() {
    var fakeJqXhr = {
      status: 401
    };
    // Call all handlers on $.ajaxError.
    _.chain(ajaxErrorStub.getCalls()).pluck('args').flatten().invoke(_.call, '', {}, fakeJqXhr).value();
  }

  function respondToCurrentUserCallWith404() {
    server.respondWith(
      '/api/users/current.json',
      [ 404, {}, '{}' ]
    );
  }
  function respondToCurrentUserCallWith200() {
    server.respondWith(
      '/api/users/current.json',
      [ 200, {}, '{}' ]
    );
  }


  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondImmediately = true;
  });

  afterEach(function() {
    server.restore();
  });

  describe('instance', function() {
    beforeEach(function() {
      ajaxErrorStub = sinon.stub($.fn, 'ajaxError', _.noop);
      store = new storyteller.UserSessionStore({
        sessionCheckDebounceMilliseconds: 1,
        cookieCheckIntervalMilliseconds: 1
      });
    });

    afterEach(function() {
      ajaxErrorStub.restore();
      store._destroy();
    });

    describe('on story loaded', function() {
      it('should indicate the session is valid', function() {
        assert.isTrue(store.hasValidSession());
      });

      it('should indicate no login is in progress', function() {
        assert.isFalse(store.loginInProgress());
      });
    });

    describe('after a cookie change', function() {
      beforeEach(function() {
        document.cookie = 'foo=' + Math.random();
      });

      afterEach(function(done) {
        document.cookie = '';
        _.delay(function() {
          done();
        }, 10);
      });

      it('if /api/users/current.json responds 404 should indicate the session is invalid', function(done) {
        store.addChangeListener(function() {
          if(!store.hasValidSession()) {
            done();
          }
        });
        respondToCurrentUserCallWith404();
      });
    });

    describe('for no valid session after LOGIN_BUTTON_CLICK action', function() {
      beforeEach(function(done) {
        store.addChangeListener(function() {
          // Wait for invalid session.
          if (!store.hasValidSession()) {
            _.defer(function() {
              // Must defer, we're simulating user interactions here.
              // Otherwise " Cannot dispatch in the middle of a dispatch." error.
              storyteller.dispatcher.dispatch({ action: 'LOGIN_BUTTON_CLICK' });
              done();
            });
          }
        });

        respondToCurrentUserCallWith404(); // Make sure the session looks invalid.
        callAjaxErrorWith401(); // Trigger a session revalidation.
      });

      it('should return true for loginInProgress()', function() {
        assert.isTrue(store.loginInProgress());
      });

      describe('after the session is established', function() {
        beforeEach(function() {
          respondToCurrentUserCallWith200();
          callAjaxErrorWith401(); // Trigger a session revalidation.
        });

        it('should return false for loginInProgress', function(done) {
          store.addChangeListener(function() {
            if(!store.loginInProgress()) {
              done();
            }
          });
        });
      });
    });

    describe('after any $.ajax fails with a 401', function() {
      beforeEach(callAjaxErrorWith401);

      it('if /api/users/current.json responds 404 should indicate the session is invalid', function(done) {
        store.addChangeListener(function() {
          if(!store.hasValidSession()) {
            done();
          }
        });
        respondToCurrentUserCallWith404();
      });

      it('if /api/users/current.json responds 200 should indicate the session is still valid', function() {
        respondToCurrentUserCallWith404();

        assert.isTrue(store.hasValidSession());
      });
    });
  });
});
