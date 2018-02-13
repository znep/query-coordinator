import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import StorySaveStatusStore, {__RewireAPI__ as StorySaveStatusStoreAPI} from 'editor/stores/StorySaveStatusStore';
import StorytellerUtils from 'StorytellerUtils';

describe('StorySaveStatusStore', function() {

  var dispatcher;
  var storySaveStatusStore;
  var serializeStory;
  var storyUid = 'test-test';
  var storyStore;
  var autosaveUrlParam;

  const storytellerUtilsMock = _.extend(
    {},
    StorytellerUtils,
    {
      queryParameterMatches: (paramKey, paramValue) => {
        if (paramKey !== 'autosave') {
          throw new Error(`unexpected param: ${paramKey}`);
        }
        return _.isUndefined(paramValue) || `${autosaveUrlParam}` === `${paramValue}`;
      }
    }
  );

  beforeEach(function() {
    dispatcher =  new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.register(_.noop);
      this.serializeStory = function() {
        return serializeStory;
      };
    };

    storyStore = new StoryStoreMock();
    autosaveUrlParam = true;

    StorySaveStatusStoreAPI.__Rewire__('dispatcher', dispatcher);
    StorySaveStatusStoreAPI.__Rewire__('storyStore', storyStore);
    StorySaveStatusStoreAPI.__Rewire__('StorytellerUtils', storytellerUtilsMock);

    storySaveStatusStore = new StorySaveStatusStore('test-test');

    serializeStory = {hello: 'world'};

    dispatcher.dispatch({
      action: Actions.STORY_CREATE
    });
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    StorySaveStatusStoreAPI.__ResetDependency__('dispatcher');
    StorySaveStatusStoreAPI.__ResetDependency__('storyStore');
    StorySaveStatusStoreAPI.__ResetDependency__('StorytellerUtils');
  });

  describe('when StoryStore is uninitialized', function() {
    beforeEach(function() {
      StorySaveStatusStoreAPI.__Rewire__('storyStore', null);
    });

    it('should throw', function() {
      assert.throws(function() {
        new StorySaveStatusStore('test-test'); //eslint-disable-line no-new
      });
    });
  });

  describe('instance', function() {
    var store;

    beforeEach(function() {
      store = storySaveStatusStore;
    });

    describe('autosaveDisabled', function() {
      it('should be true only if ?autosave=false', function() {
        autosaveUrlParam = true;
        assert.isFalse(store.autosaveDisabled());
        autosaveUrlParam = false;
        assert.isTrue(store.autosaveDisabled());
        autosaveUrlParam = undefined;
        assert.isFalse(store.autosaveDisabled());
      });
    });

    describe('on story loaded', function() {
      // StandardMocks will have loaded a story already.
      it('should indicate the story is fully saved', function() {
        assert.isFalse(store.isStoryDirty());
      });

      it('should indicate no save in progress', function() {
        assert.isFalse(store.isStorySaveInProgress());
      });
    });

    describe('when only metadata has been changed', function() {
      it('should indicate that the story is saved', function() {
        dispatcher.dispatch({
          action: Actions.STORY_SET_TITLE,
          storyUid: storyUid,
          title: 'i am a title'
        });
        dispatcher.dispatch({
          action: Actions.STORY_SET_DESCRIPTION,
          storyUid: storyUid,
          description: 'i am a description'
        });
        assert.isFalse(store.isStoryDirty());
      });
    });

    describe('after a story is modified', function() {
      beforeEach(function() {
        serializeStory = {something: 'new'};
        storyStore._emitChange();
      });

      it('should indicate the story is unsaved', function() {
        assert.isTrue(store.isStoryDirty());
      });

      it('should indicate no save in progress', function() {
        assert.isFalse(store.isStorySaveInProgress());
      });

      describe('after a save starts', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.STORY_SAVE_STARTED,
            storyUid: storyUid
          });
        });

        it('should indicate the story is unsaved', function() {
          assert.isTrue(store.isStoryDirty());
        });

        it('should indicate save is in progress', function() {
          assert.isTrue(store.isStorySaveInProgress());
        });

        describe('and another save starts before the first completes', function() {
          it('should throw', function() {
            assert.throws(function() {
              dispatcher.dispatch({
                action: Actions.STORY_SAVE_STARTED,
                storyUid: storyUid
              });
            });
          });
        });

        describe('that completes', function() {
          beforeEach(function() {
            dispatcher.dispatch({
              action: Actions.STORY_SAVED,
              storyUid: storyUid,
              digest: 'foo'
            });
          });

          it('should indicate the story is saved', function() {
            assert.isFalse(store.isStoryDirty());
          });

          it('should indicate no save in progress', function() {
            assert.isFalse(store.isStorySaveInProgress());
          });
        });

        describe('that errors', function() {
          beforeEach(function() {
            dispatcher.dispatch({
              action: Actions.STORY_SAVE_FAILED,
              storyUid: storyUid,
              message: 'foo'
            });
          });

          it('should indicate the story is unsaved', function() {
            assert.isTrue(store.isStoryDirty());
          });

          it('should indicate no save in progress', function() {
            assert.isFalse(store.isStorySaveInProgress());
          });
        });
      });

      describe('but the edit is undone', function() {
        beforeEach(function() {
          serializeStory = {hello: 'world'};
          storyStore._emitChange();
        });

        it('should indicate the story is fully saved', function() {
          assert.isFalse(store.isStoryDirty());
        });

        it('should indicate no save in progress', function() {
          assert.isFalse(store.isStorySaveInProgress());
        });
      });
    });
  });
});
