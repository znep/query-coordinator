describe('UserSessionStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;
  var store;

  describe('instance', function() {
    beforeEach(function() {
      store = storyteller.userSessionStore;
    });

    describe('on story loaded', function() {
      it('should indicate the session is valid', function() {
        assert.isTrue(store.hasValidSession());
      });
    });

    describe('after a cookie change', function() {
      var server;
      beforeEach(function() {
        server = sinon.fakeServer.create();
        server.autoRespond = true;
        document.cookie = 'foo=' + Math.random();
      });

      afterEach(function() {
        server.restore();
        document.cookie = '';
      });

      it('if /api/users/current.json responds 404 should indicate the session is invalid', function(done) {
        store.addChangeListener(function() {
          if(!store.hasValidSession()) {
            done();
          }
        });
        server.respondWith(
          '/api/users/current.json',
          [ 404, {}, '{}' ]
        );
      });
    });

    describe('after SESSION_TIMED_OUT', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.SESSION_TIMED_OUT
        });
      });

      it('should indicate the session is invalid', function() {
        assert.isFalse(store.hasValidSession());
      });

      describe('after a cookie change', function() {
        var server;
        beforeEach(function() {
          server = sinon.fakeServer.create();
          server.autoRespond = true;
          document.cookie = 'foo=' + Math.random();
        });

        afterEach(function() {
          server.restore();
          document.cookie = '';
        });

        it('if /api/users/current.json responds 200 should indicate the session is valid', function(done) {
          store.addChangeListener(function() {
            if(store.hasValidSession()) {
              done();
            }
          });
          server.respondWith(
            '/api/users/current.json',
            [ 200, {}, '{}' ]
          );
        });
      });
    });
  });
});
