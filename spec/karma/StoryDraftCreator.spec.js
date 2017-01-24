import $ from 'jquery';
import _ from 'lodash';

import StandardMocks from './StandardMocks';
import EnvironmentMocker from './StorytellerEnvironmentMocker';
import Actions from '../../app/assets/javascripts/editor/Actions';
import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';
import StoryStore from '../../app/assets/javascripts/editor/stores/StoryStore';
import StoryDraftCreator, {__RewireAPI__ as StoryDraftCreatorAPI} from '../../app/assets/javascripts/editor/StoryDraftCreator';

describe('StoryDraftCreator', () => {

  describe('.saveDraft()', () => {
    let dispatcher;
    let server;
    let fakeTokenMeta;
    let storyStoreStub;
    const story = {uid: 'four-four'};

    beforeEach(() => {
      dispatcher = new Dispatcher();

      storyStoreStub = sinon.createStubInstance(StoryStore);
      storyStoreStub.doesStoryExist = _.constant(true);
      storyStoreStub.serializeStory = _.constant(story);
      storyStoreStub.getStoryDigest = _.constant('digest');

      StoryDraftCreatorAPI.__Rewire__('Environment', _.merge(EnvironmentMocker, {IS_GOAL: false}));
      StoryDraftCreatorAPI.__Rewire__('dispatcher', dispatcher);
      StoryDraftCreatorAPI.__Rewire__('storyStore', storyStoreStub);

      fakeTokenMeta = $('<meta>', { name: 'csrf-token', content: 'faketoken' });

      $('head').append(fakeTokenMeta);

      server = sinon.fakeServer.create();
    });

    afterEach(() => {
      server.restore();
      fakeTokenMeta.remove();

      StoryDraftCreatorAPI.__ResetDependency__('Environment');
      StoryDraftCreatorAPI.__ResetDependency__('dispatcher');
      StoryDraftCreatorAPI.__ResetDependency__('storyStore');
    });

    it('should throw when passed invalid arguments', () => {
      assert.throws(() => { StoryDraftCreator.saveDraft(); });
      assert.throws(() => { StoryDraftCreator.saveDraft({}); });
      assert.throws(() => { StoryDraftCreator.saveDraft([]); });
      assert.throws(() => { StoryDraftCreator.saveDraft(5); });
      assert.throws(() => { StoryDraftCreator.saveDraft(null); });
    });

    it('should throw when given a non-existent story uid', () => {
      storyStoreStub.doesStoryExist = _.constant(false);
      assert.throws(() => { StoryDraftCreator.saveDraft('notastory'); });
    });

    it('should hit the drafts endpoint with the stories JSON', (done) => {
      server.respondImmediately = true;

      server.respondWith((request) => {
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

    describe('on succesful request', () => {
      const newDigest = 'something new';
      beforeEach(() => {
        server.respondImmediately = true;

        server.respondWith((request) => {
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

      it('should dispatch STORY_SAVED with the new digest', (done) => {
        dispatcher.register((payload) => {
          assert.notEqual(payload.action, Actions.STORY_SAVE_FAILED);
          if (payload.action === Actions.STORY_SAVED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            assert.equal(payload.digest, newDigest);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('should resolve the promise with the new digest', (done) => {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).
        done((digest) => {
          assert.equal(digest, newDigest);
          done();
        });
      });
    });

    describe('when given a response with no X-Story-Digest', () => {

      beforeEach(() => {
        server.respondImmediately = true;

        server.respondWith((request) => {
          request.respond(
            200,
            { 'Content-Type': 'application/json' },
            '{}'
          );
        });
      });

      it('should dispatch STORY_SAVE_FAILED', (done) => {
        dispatcher.register((payload) => {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('reject the returned promise', (done) => {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).fail(() => done());
      });
    });

    describe('when given a non-200 response', () => {

      beforeEach(() => {
        server.respondImmediately = true;

        server.respondWith((request) => {
          request.respond(
            500,
            { 'Content-Type': 'application/json' },
            '{}'
          );
        });
      });

      it('should dispatch STORY_SAVE_FAILED', (done) => {
        dispatcher.register((payload) => {
          assert.notEqual(payload.action, Actions.STORY_SAVED);
          if (payload.action === Actions.STORY_SAVE_FAILED) {
            assert.equal(payload.storyUid, StandardMocks.validStoryUid);
            done();
          }
        });

        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid);
      });

      it('reject the returned promise', (done) => {
        StoryDraftCreator.saveDraft(StandardMocks.validStoryUid).fail(() => done());
      });
    });

  });

});
