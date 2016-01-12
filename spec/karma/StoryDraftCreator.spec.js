describe('StoryDraftCreator', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;

  describe('.saveDraft()', function() {
    var server;
    var fakeTokenMeta;

    beforeEach(function() {
      // Since these tests actually expect to use AJAX, we need to disable the
      // mocked XMLHttpRequest (which happens in StandardMocks) before each,
      // and re-enble it after each.
      window.mockedXMLHttpRequest.restore();

      fakeTokenMeta = $('<meta>', { name: 'csrf-token', content: 'faketoken' });

      $('head').append(fakeTokenMeta);

      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      server.restore();
      fakeTokenMeta.remove();

      // See comment above re: temporarily disabling the mocked XMLHttpRequest.
      window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
    });

    it('should throw when passed invalid arguments', function() {
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft(); });
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft({}); });
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft([]); });
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft(5); });
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft(null); });
    });

    it('should throw when given a non-existent story uid', function() {
      assert.throws(function() { storyteller.StoryDraftCreator.saveDraft('notastory'); });
    });

    it('should hit the drafts endpoint with the stories JSON', function(done) {
      server.respondImmediately = true;

      server.respondWith(function(request) {
        assert.propertyVal(request, 'method', 'POST');
        assert.propertyVal(request, 'url', '/stories/api/v1/stories/{0}/drafts'.format(standardMocks.validStoryUid));
        assert.deepPropertyVal(request, 'requestHeaders.X-Socrata-Host', location.host);
        assert.deepPropertyVal(request, 'requestHeaders.X-CSRF-Token', 'faketoken');
        assert.deepPropertyVal(request, 'requestHeaders.If-Match', standardMocks.validStoryDigest);
        assert.deepPropertyVal(request, 'requestHeaders.X-App-Token', storyteller.config.coreServiceAppToken);
        assert.deepEqual(
          JSON.parse(request.requestBody),
          // The stringify-then-parse step is because
          // JSON.stringify omits object values that are undefined.
          // For instance, JSON.stringify({foo: undefined}) returns '{}'.
          // This is significant because sometimes 'themeId' is undefined.
          JSON.parse(JSON.stringify(
            storyteller.storyStore.serializeStory(standardMocks.validStoryUid)
          ))
        );
        // Don't bother responding.
        done();
      });

      storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid);
    });

    describe('on succesful request', function() {
      var newDigest = 'something new';
      beforeEach(function() {
        server.respondImmediately = true;

        server.respondWith(function(request) {
          request.respond(
            200,
            {
              'Content-Type': 'application/json',
              'X-Story-Digest': newDigest
            },
            '{}'
          );
        });
      });

      it('should dispatch STORY_SAVED with the new digest', function(done) {
        storyteller.dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVE_FAILED);
          if (payload.action === Actions.STORY_SAVED) {
            assert.equal(payload.storyUid, standardMocks.validStoryUid);
            assert.equal(payload.digest, newDigest);
            done();
          }
        });

        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid);
      });

      it('should resolve the promise with the new digest', function(done) {
        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid).
        done(function(digest) {
          assert.equal(digest, newDigest);
          done();
        });
      });
    });

    describe('when given a response with no X-Story-Digest', function() {

      beforeEach(function() {
        server.respondImmediately = true;

        server.respondWith(function(request) {
          request.respond(
            200,
            { 'Content-Type': 'application/json' },
            '{}'
          );
        });
      });

      it('should dispatch STORY_SAVE_FAILED', function(done) {
        storyteller.dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, standardMocks.validStoryUid);
            done();
          }
        });

        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid);
      });

      it('reject the returned promise', function(done) {
        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid).fail(function() {
          done();
        });
      });
    });

    describe('when given a non-200 response', function() {

      beforeEach(function() {
        server.respondImmediately = true;

        server.respondWith(function(request) {
          request.respond(
            500,
            { 'Content-Type': 'application/json' },
            '{}'
          );
        });
      });

      it('should dispatch STORY_SAVE_FAILED', function(done) {
        storyteller.dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, standardMocks.validStoryUid);
            done();
          }
        });

        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid);
      });

      it('reject the returned promise', function(done) {
        storyteller.StoryDraftCreator.saveDraft(standardMocks.validStoryUid).fail(function() {
          done();
        });
      });
    });

  });

});
