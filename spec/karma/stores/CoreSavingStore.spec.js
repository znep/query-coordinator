import I18nMocker from '../I18nMocker';

import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import CoreSavingStore, {__RewireAPI__ as CoreSavingStoreAPI} from '../../../app/assets/javascripts/editor/stores/CoreSavingStore';

describe('CoreSavingStore', function() {

  var server;
  var dispatcher;
  var coreSavingStore;
  var storyTitle;
  var storyUid = 'test-test';
  var storyDescription;

  beforeEach(function() {
    storyTitle = 'title';
    storyDescription = 'description';

    dispatcher = new Dispatcher();
    server = sinon.fakeServer.create();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.getStoryTitle = function() {
        return storyTitle;
      };

      this.getStoryDescription = function() {
        return storyDescription;
      };
    };

    CoreSavingStoreAPI.__Rewire__('dispatcher', dispatcher);
    CoreSavingStoreAPI.__Rewire__('storyStore', new StoryStoreMock());
    CoreSavingStoreAPI.__Rewire__('I18n', I18nMocker);
    CoreSavingStoreAPI.__Rewire__('Environment', {
      CORE_SERVICE_APP_TOKEN: 'storyteller_app_token'
    });

    coreSavingStore = new CoreSavingStore();
  });

  afterEach(function() {
    server.restore();

    StoreAPI.__ResetDependency__('dispatcher');
    CoreSavingStoreAPI.__ResetDependency__('dispatcher');
    CoreSavingStoreAPI.__ResetDependency__('storyStore');
    CoreSavingStoreAPI.__ResetDependency__('Environment');
  });

  function waitFor(condition, done) {
    if (condition()) {
      done();
    } else {
      coreSavingStore.addChangeListener(function() {
        if (condition()) { done(); }
      });
    }
  }

  function expectError(done, optionalStoryUid) {
    optionalStoryUid = optionalStoryUid || storyUid;
    waitFor(function() {
      return coreSavingStore.lastRequestSaveErrorForStory(optionalStoryUid) !== null;
    }, done);
  }
  function expectNoError(done, optionalStoryUid) {
    optionalStoryUid = optionalStoryUid || storyUid;
    waitFor(function() {
      return coreSavingStore.lastRequestSaveErrorForStory(optionalStoryUid) === null;
    }, done);
  }

  function expectSaveInProgress(done) {
    waitFor(function() {
      return coreSavingStore.isSaveInProgress() === true;
    }, done);
  }

  function expectNoSaveInProgress(done) {
    waitFor(function() {
      return coreSavingStore.isSaveInProgress() === false;
    }, done);
  }

  describe('upon initialization', function() {
    it('should indicate no save in progress', expectNoSaveInProgress);
    it('should indicate no error', expectNoError);
  });

  describe('given action STORY_SAVE_METADATA', function() {
    describe('with a title that is too long', function() {
      beforeEach(function() {
        storyTitle = _.range(0, 1000).join();

        dispatcher.dispatch({
          action: Actions.STORY_SAVE_METADATA,
          storyUid: storyUid
        });
      });

      it('should immediately report an error', expectError);
      it('should indicate no save in progress', expectNoSaveInProgress);
    });

    describe('with app token undefined', function() {
      var errorSpy;

      beforeEach(function() {
        CoreSavingStoreAPI.__Rewire__('Environment', {
          CORE_SERVICE_APP_TOKEN: undefined
        });

        coreSavingStore = new CoreSavingStore();
        errorSpy = sinon.spy(console, 'error');
      });

      it('immediately reports an error', function() {
        dispatcher.dispatch({
          action: Actions.STORY_SAVE_METADATA,
          storyUid: storyUid
        });

        assert.isTrue(errorSpy.called);
      });
    });

    describe('with no validation issues', function() {
      var viewUrl;
      var cookie = 'socrata-csrf-token=the_csrf_token%3D;'; // '=' encoded

      beforeEach(function() {
        document.cookie = cookie;

        dispatcher.dispatch({
          action: Actions.STORY_SAVE_METADATA,
          storyUid: storyUid
        });

        viewUrl = StorytellerUtils.format(
          '/api/views/{0}.json',
          storyUid
        );
      });

      afterEach(function() {
        // delete cookie
        document.cookie = cookie + 'expires=Thu, 01 Jan 1970 00:00:01 GMT';
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
        assert.propertyVal(body, 'name', storyTitle);
        assert.propertyVal(body, 'description', storyDescription);
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
