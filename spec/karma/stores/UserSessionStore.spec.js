describe('UserSessionStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;
  var store;
  var server;
  var ajaxErrorStub;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(function() {
    server.restore();
  });

  describe('instance', function() {
    beforeEach(function() {
      ajaxErrorStub = sinon.stub($.fn, 'ajaxError', _.noop);
      store = new storyteller.UserSessionStore();
    });

    afterEach(function() {
      ajaxErrorStub.restore();
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

    describe('after any $.ajax fails with a 401', function() {
      beforeEach(function() {
        var fakeJqXhr = {
          status: 401
        };
        // Call all handlers on $.ajaxError.
        _.chain(ajaxErrorStub.getCalls()).pluck('args').flatten().invoke(_.call, '', {}, fakeJqXhr).value();
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
