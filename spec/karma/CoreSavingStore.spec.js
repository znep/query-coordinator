describe('CoreSavingStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;

  var server;
  beforeEach(function() {
    server = sinon.fakeServer.create();
  });
  afterEach(function() {
    server.restore();
  });

  function waitFor(condition, done) {
    if (condition()) {
      done();
    } else {
      storyteller.coreSavingStore.addChangeListener(function() {
        if (condition()) { done(); }
      });
    }
  }

  function expectError(done, optionalStoryUid) {
    optionalStoryUid = optionalStoryUid || standardMocks.validStoryUid;
    waitFor(function() {
      return storyteller.coreSavingStore.lastRequestSaveErrorForStory(optionalStoryUid) !== null;
    }, done);
  }
  function expectNoError(done, optionalStoryUid) {
    optionalStoryUid = optionalStoryUid || standardMocks.validStoryUid;
    waitFor(function() {
      return storyteller.coreSavingStore.lastRequestSaveErrorForStory(optionalStoryUid) === null;
    }, done);
  }

  function expectSaveInProgress(done) {
    waitFor(function() {
      return storyteller.coreSavingStore.isSaveInProgress() === true;
    }, done);
  };

  function expectNoSaveInProgress(done) {
    waitFor(function() {
      return storyteller.coreSavingStore.isSaveInProgress() === false;
    }, done);
  };

  describe('upon initialization', function() {
    it('should indicate no save in progress', expectNoSaveInProgress);
    it('should indicate no error', expectNoError);
  });

  describe('given action STORY_SAVE_METADATA', function() {

    describe('with a title that is too long', function() {

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: standardMocks.validStoryUid,
          title: _.range(0,1000).join()
        });

        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SAVE_METADATA,
          storyUid: standardMocks.validStoryUid
        });

      });

      it('should immediately report an error', expectError);
      it('should indicate no save in progress', expectNoSaveInProgress);

    });

    describe('with app token undefined', function() {

      beforeEach(function() {
        storyteller.config.coreServiceAppToken = undefined;
      });

      it('immediately reports an error', function() {
        assert.throw(function() {
          storyteller.dispatcher.dispatch({
            action: Constants.STORY_SAVE_METADATA,
            storyUid: standardMocks.validStoryUid
          });
        });
      });

    });

    describe('with no validation issues', function() {
      var viewUrl;
      var cookie = 'socrata-csrf-token=the_csrf_token%3D;'; // '=' encoded

      beforeEach(function() {
        document.cookie = cookie;

        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SAVE_METADATA,
          storyUid: standardMocks.validStoryUid
        });
        viewUrl = '/api/views/{0}.json'.format(standardMocks.validStoryUid);
      });

      afterEach(function() {
        // delete cookie
        document.cookie = cookie + 'expires=Thu, 01 Jan 1970 00:00:01 GMT'
      });


      it('should indicate a save in progress', expectSaveInProgress);

      it('should indicate no error', expectNoError);

      it('should make one request', function() {
        assert.lengthOf(server.requests, 1);
      });

      it('should PUT correct json to /api/views/<4x4>.json', function() {
        var request = server.requests[0];
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, viewUrl);
        assert.equal(request.requestHeaders['X-App-Token'], 'storyteller_app_token');
        assert.equal(request.requestHeaders['X-CSRF-Token'], 'the_csrf_token=');

        var body = JSON.parse(request.requestBody);
        assert.propertyVal(body, 'name', standardMocks.validStoryTitle);
        assert.propertyVal(body, 'description', standardMocks.validStoryDescription);
      });

      describe('and the PUT succeeds', function() {

        beforeEach(function() {
          server.respondWith(
            viewUrl,
            [
              200,
              { 'Content-Type': 'application/json' },
              '{}'
            ]
          );
          server.respond();
        });

        it('should indicate no save in progress', expectNoSaveInProgress);

        it('should indicate no error', expectNoError);
      });

      describe('and the PUT fails', function() {

        beforeEach(function() {
          server.respondWith(
            viewUrl,
            [500, {}, 'Failure']
          );
          server.respond();
        });

        it('should indicate no save in progress', expectNoSaveInProgress);

        it('should indicate an error', expectError);

        it('should indicate no error for other stories', function(done) {
          expectNoError(done, 'some-othr');
        });
      });

      describe('and the request fails', function() {
        beforeEach(function() {
          server.respondWith(
            viewUrl,
            [500, {}, 'Failure']
          );
          server.respond();
        });

        it('should indicate no save in progress', expectNoSaveInProgress);

        it('should indicate an error', expectError);

        it('should indicate no error for other stories', function(done) {
          expectNoError(done, 'some-othr');
        });
      });
    });
  });
});
