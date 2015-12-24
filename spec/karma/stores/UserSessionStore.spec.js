describe('UserSessionStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;
  var store;
  var server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(function() {
    server.restore();
  });

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
      beforeEach(function() {
        document.cookie = 'foo=' + Math.random();
      });

      afterEach(function() {
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

    describe('after API_REQUEST_RETURNED_401_UNAUTHORIZED', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.API_REQUEST_RETURNED_401_UNAUTHORIZED
        });
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

      it('if /api/users/current.json responds 200 should indicate the session is still valid', function() {
        server.respondImmediately = true;
        server.respondWith(
          '/api/users/current.json',
          [ 404, {}, '{}' ]
        );

        assert.isTrue(store.hasValidSession());
      });
    });
  });
});
