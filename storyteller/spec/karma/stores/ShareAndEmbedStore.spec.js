import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import ShareAndEmbedStore, {__RewireAPI__ as ShareAndEmbedStoreAPI} from 'editor/stores/ShareAndEmbedStore';

describe('ShareAndEmbedStore', function() {

  var dispatcher;
  var shareAndEmbedStore;
  var MOCK_STORY_VIEW_URL = 'https://example.com/stories/s/Test-Story/xxxx-xxxx';

  var coreSavingStoreMock;

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var CoreSavingStoreMock = function() {
      _.extend(this, new Store());

      this.register(_.noop);
    };
    coreSavingStoreMock = new CoreSavingStoreMock();

    ShareAndEmbedStoreAPI.__Rewire__('dispatcher', dispatcher);
    ShareAndEmbedStoreAPI.__Rewire__('coreSavingStore', coreSavingStoreMock);
    ShareAndEmbedStoreAPI.__Rewire__('Environment', {
      STORY_VIEW_URL: MOCK_STORY_VIEW_URL
    });

    shareAndEmbedStore = new ShareAndEmbedStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    ShareAndEmbedStoreAPI.__ResetDependency__('dispatcher');
    ShareAndEmbedStoreAPI.__ResetDependency__('coreSavingStore');
    ShareAndEmbedStoreAPI.__ResetDependency__('Environment');
    ShareAndEmbedStoreAPI.__ResetDependency__('httpRequest');
  });

  describe('isOpen', function() {
    it('defaults to false', function() {
      assert.isFalse(shareAndEmbedStore.isOpen());
    });
    describe('after SHARE_AND_EMBED_MODAL_OPEN', function() {
      beforeEach(function() {
        dispatcher.dispatch({action: Actions.SHARE_AND_EMBED_MODAL_OPEN});
      });
      it('becomes true', function() {
        assert.isTrue(shareAndEmbedStore.isOpen());
      });
      describe('after SHARE_AND_EMBED_MODAL_CLOSE', function() {
        beforeEach(function() {
          dispatcher.dispatch({action: Actions.SHARE_AND_EMBED_MODAL_CLOSE});
        });
        it('becomes false', function() {
          assert.isFalse(shareAndEmbedStore.isOpen());
        });
      });
    });
  });

  describe('story URL methods', function() {
    var resolveTilesPromise;

    beforeEach(function() {
      ShareAndEmbedStoreAPI.__Rewire__('httpRequest', function() {
        return new Promise(function(resolve) {
          resolveTilesPromise = resolve;
        });
      });
    });

    describe('on page load', function() {
      it('bases on Environment.STORY_VIEW_URL', function() {
        assert.equal(shareAndEmbedStore.getStoryUrl(), MOCK_STORY_VIEW_URL);
        assert.equal(shareAndEmbedStore.getStoryTileUrl(), MOCK_STORY_VIEW_URL + '/tile');
        assert.equal(shareAndEmbedStore.getStoryTileApiUrl(), MOCK_STORY_VIEW_URL + '/tile.json');
        assert.include(shareAndEmbedStore.getStoryEmbedCode(), MOCK_STORY_VIEW_URL);
      });
    });
    describe('after a CoreSavingStore change', function() {
      beforeEach(function() {
        coreSavingStoreMock.isSaveInProgress = _.constant(false);
        coreSavingStoreMock.lastRequestSaveErrorForStory = _.constant(null);
        coreSavingStoreMock._emitChange();
      });
      describe('hit to tile endpoint succeeds', function() {
        var NEW_STORY_URL = 'https://example.com/stories/s/new-story-title/aaaa-aaaa';
        it('bases on new story url', function(done) {
          shareAndEmbedStore.addChangeListener(function() {
            assert.equal(shareAndEmbedStore.getStoryUrl(), NEW_STORY_URL);
            assert.equal(shareAndEmbedStore.getStoryTileUrl(), NEW_STORY_URL + '/tile');
            assert.equal(shareAndEmbedStore.getStoryTileApiUrl(), NEW_STORY_URL + '/tile.json');
            assert.include(shareAndEmbedStore.getStoryEmbedCode(), NEW_STORY_URL);
            done();
          });
          resolveTilesPromise({
            data: { url: NEW_STORY_URL }
          });
        });
      });
    });
  });
});
