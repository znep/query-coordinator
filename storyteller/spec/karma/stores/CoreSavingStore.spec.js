import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import I18nMocker from '../I18nMocker';

import StorytellerUtils from 'StorytellerUtils';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import {__RewireAPI__ as httpRequestAPI} from 'services/httpRequest';
import CoreSavingStore, {__RewireAPI__ as CoreSavingStoreAPI} from 'editor/stores/CoreSavingStore';

describe('CoreSavingStore', function() {

  var server;
  var errorSpy;
  var dispatcher;
  var coreSavingStore;
  var storyTitle;
  var storyDescription;
  var storyTileTitle;
  var storyTileDescription;
  var storyUid = 'test-test';

  beforeEach(function() {
    storyTitle = 'title';
    storyDescription = 'description';
    storyTileTitle = 'override title';
    storyTileDescription = 'override description';

    dispatcher = new Dispatcher();
    server = sinon.fakeServer.create();
    errorSpy = sinon.spy(console, 'error');

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.getStoryTitle = function() {
        return storyTitle;
      };

      this.getStoryDescription = function() {
        return storyDescription;
      };

      this.getStoryTileTitle = function() {
        return storyTileTitle;
      };

      this.getStoryTileDescription = function() {
        return storyTileDescription;
      };
    };

    CoreSavingStoreAPI.__Rewire__('dispatcher', dispatcher);
    CoreSavingStoreAPI.__Rewire__('storyStore', new StoryStoreMock());
    CoreSavingStoreAPI.__Rewire__('I18n', I18nMocker);

    httpRequestAPI.__Rewire__('Environment', {
      CORE_SERVICE_APP_TOKEN: 'storyteller_app_token'
    });

    coreSavingStore = new CoreSavingStore();
  });

  afterEach(function() {
    server.restore();
    errorSpy.restore();

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

    describe('with no validation issues', function() {
      var viewUrl = StorytellerUtils.format('/api/views/{0}.json', storyUid);
      var cookie = 'socrata-csrf-token=the_csrf_token%3D;'; // '=' encoded

      beforeEach(function(done) {
        document.cookie = cookie;

        dispatcher.dispatch({
          action: Actions.STORY_SAVE_METADATA,
          storyUid: storyUid
        });

        server.respondWith(
          viewUrl,
          [
            200,
            { 'Content-Type': 'application/json' },
            '{"name":"old title","description":"old description","metadata":{"foo":"bar"}}'
          ]
        );
        server.respond();
        setTimeout(function() { done(); }, 0);
      });

      afterEach(function() {
        // delete cookie
        document.cookie = cookie + 'expires=Thu, 01 Jan 1970 00:00:01 GMT';
      });

      it('should indicate a save in progress', expectSaveInProgress);

      it('should indicate no error', expectNoError);

      it('should make two requests', function() {
        assert.lengthOf(server.requests, 2);
      });

      it('should PUT correct json to /api/views/<4x4>.json', function() {
        var request = server.requests[1];
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, viewUrl);
        assert.equal(request.requestHeaders['X-App-Token'], 'storyteller_app_token');
        assert.equal(request.requestHeaders['X-CSRF-Token'], 'the_csrf_token=');

        var body = JSON.parse(request.requestBody);
        assert.propertyVal(body, 'name', storyTitle);
        assert.propertyVal(body, 'description', storyDescription);
        assert.nestedPropertyVal(body, 'metadata.tileConfig.title', storyTileTitle);
        assert.nestedPropertyVal(body, 'metadata.tileConfig.description', storyTileDescription);
        assert.nestedPropertyVal(body, 'metadata.foo', 'bar'); // doesn't obliterate other metadata
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
