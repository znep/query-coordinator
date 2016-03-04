import $ from 'jQuery';

import StandardMocks from './StandardMocks';
import EnvironmentMocker from './StorytellerEnvironmentMocker';
import Actions from '../../app/assets/javascripts/editor/Actions';
import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';
import StoryStore from '../../app/assets/javascripts/editor/stores/StoryStore';
import StoryDraftCreator, {__RewireAPI__ as StoryDraftCreatorAPI} from '../../app/assets/javascripts/editor/StoryDraftCreator';

describe('StoryDraftCreator', function() {

  describe('.saveDraft()', function() {
    var dispatcher;
    var server;
    var fakeTokenMeta;
    var storyStoreStub;
    var story = {uid: 'four-four'};

    beforeEach(function() {
      dispatcher = new Dispatcher();

      storyStoreStub = sinon.createStubInstance(StoryStore);
      storyStoreStub.storyExists = _.constant(true);
      storyStoreStub.serializeStory = _.constant(story);
      storyStoreStub.getStoryDigest = _.constant('digest');

      StoryDraftCreatorAPI.__Rewire__('Environment', EnvironmentMocker);
      StoryDraftCreatorAPI.__Rewire__('dispatcher', dispatcher);
      StoryDraftCreatorAPI.__Rewire__('storyStore', storyStoreStub);

      fakeTokenMeta = $('<meta>', { name: 'csrf-token', content: 'faketoken' });

      $('head').append(fakeTokenMeta);

      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      server.restore();
      fakeTokenMeta.remove();

      StoryDraftCreatorAPI.__ResetDependency__('Environment');
      StoryDraftCreatorAPI.__ResetDependency__('dispatcher');
      StoryDraftCreatorAPI.__ResetDependency__('storyStore');
    });

    it('should throw when passed invalid arguments', function() {
      assert.throws(function() { StoryDraftCreator.saveDraft(); });
      assert.throws(function() { StoryDraftCreator.saveDraft({}); });
      assert.throws(function() { StoryDraftCreator.saveDraft([]); });
      assert.throws(function() { StoryDraftCreator.saveDraft(5); });
      assert.throws(function() { StoryDraftCreator.saveDraft(null); });
    });

    it('should throw when given a non-existent story uid', function() {
      storyStoreStub.storyExists = _.constant(false);
      assert.throws(function() { StoryDraftCreator.saveDraft('notastory'); });
    });

    it('should hit the drafts endpoint with the stories JSON', function(done) {
      server.respondImmediately = true;

      server.respondWith(function(request) {
        assert.propertyVal(request, 'method', 'POST');
        assert.propertyVal(request, 'url', StorytellerUtils.format('/stories/api/v1/stories/{0}/drafts', StandardMocks.validStoryUid));
        assert.deepPropertyVal(request, 'requestHeaders.X-Socrata-Host', location.host);
        assert.deepPropertyVal(request, 'requestHeaders.X-CSRF-Token', 'faketoken');
        assert.deepPropertyVal(request, 'requestHeaders.If-Match', StandardMocks.validStoryDigest);
        assert.deepPropertyVal(request, 'requestHeaders.X-App-Token', EnvironmentMocker.CORE_SERVICE_APP_TOKEN);
        assert.deepEqual(
          JSON.parse(request.requestBody),
          story
        );
        // Don't bother responding.
        done();
      });

      StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
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
        dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVE_FAILED);
          if (payload.action === Actions.STORY_SAVED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            assert.equal(payload.digest, newDigest);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('should resolve the promise with the new digest', function(done) {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).
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
        dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('reject the returned promise', function(done) {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).fail(function() {
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
        dispatcher.register(function(payload) {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('reject the returned promise', function(done) {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).fail(function() {
          done();
        });
      });
    });

  });

});
