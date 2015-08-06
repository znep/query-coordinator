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
    var viewUrl;

    beforeEach(function() {
      storyteller.dispatcher.dispatch({
        action: Constants.STORY_SAVE_METADATA,
        storyUid: standardMocks.validStoryUid
      });
      viewUrl = '/views/{0}.json'.format(standardMocks.validStoryUid);
    });

    it('should make one request', function() {
      // ... so far. The PUT will come after the first request completes.
      assert.lengthOf(server.requests, 1);
    });

    it('should GET /views/<4x4>.json', function() {
      var request = server.requests[0];
      assert.equal(request.method, 'GET');
      assert.equal(request.url, viewUrl);
    });

    it('should indicate a save in progress', expectSaveInProgress);
    it('should indicate no error', expectNoError);

    describe('and the request succeeds', function() {
      beforeEach(function() {
        server.respondWith(
          viewUrl,
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ id : standardMocks.validStoryUid, name: 'OLD_NAME' })
          ]
        );
        server.respond();
      });
      it('should indicate a save in progress', expectSaveInProgress);
      it('should indicate no error', expectNoError);

      it('should make one more request', function() {
        assert.lengthOf(server.requests, 2);
      });

      it('should PUT correct json to /views/<4x4>.json', function() {
        var request = server.requests[1];
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, viewUrl);

        var body = JSON.parse(request.requestBody);
        assert.propertyVal(body, 'id', standardMocks.validStoryUid);
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

