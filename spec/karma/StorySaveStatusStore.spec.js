describe('StorySaveStatusStore', function() {
  'use strict';
  var storyteller = window.socrata.storyteller;
  var store;

  it('should throw if StoryStore is not initialized yet', function() {
    standardMocks.remove();
    assert.isUndefined(storyteller.storyStore); // sanity for test
    assert.throws(function() {
      new storyteller.StorySaveStatusStore();
    });
  });

  describe('instance', function() {
    beforeEach(function() {
      store = storyteller.storySaveStatusStore;
    });

    describe('on story loaded', function() {
      // StandardMocks will have loaded a story already.
      it('should indicate the story is fully saved', function() {
        assert.isTrue(store.isStorySaved());
      });

      it('should indicate no save in progress', function() {
        assert.isFalse(store.isStorySaveInProgress());
      });
    });

    describe('after a story is modified', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.STORY_DELETE_BLOCK,
          storyUid: standardMocks.validStoryUid,
          blockId: standardMocks.validBlockId
        });
      });

      it('should indicate the story is unsaved', function() {
        assert.isFalse(store.isStorySaved());
      });

      it('should indicate no save in progress', function() {
        assert.isFalse(store.isStorySaveInProgress());
      });

      describe('after a save starts', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.STORY_SAVE_STARTED,
            storyUid: standardMocks.validStoryUid
          });
        });

        it('should indicate the story is unsaved', function() {
          assert.isFalse(store.isStorySaved());
        });

        it('should indicate save is in progress', function() {
          assert.isTrue(store.isStorySaveInProgress());
        });

        describe('and another save starts before the first completes', function() {
          it('should throw', function() {
            assert.throws(function() {
              storyteller.dispatcher.dispatch({
                action: Actions.STORY_SAVE_STARTED,
                storyUid: standardMocks.validStoryUid
              });
            });
          });
        });

        describe('that completes', function() {
          beforeEach(function() {
            storyteller.dispatcher.dispatch({
              action: Actions.STORY_SAVED,
              storyUid: standardMocks.validStoryUid,
              digest: 'foo'
            });
          });

          it('should indicate the story is saved', function() {
            assert.isTrue(store.isStorySaved());
          });

          it('should indicate no save in progress', function() {
            assert.isFalse(store.isStorySaveInProgress());
          });
        });

        describe('that errors', function() {
          beforeEach(function() {
            storyteller.dispatcher.dispatch({
              action: Actions.STORY_SAVE_FAILED,
              storyUid: standardMocks.validStoryUid,
              message: 'foo'
            });
          });

          it('should indicate the story is unsaved', function() {
            assert.isFalse(store.isStorySaved());
          });

          it('should indicate no save in progress', function() {
            assert.isFalse(store.isStorySaveInProgress());
          });
        });
      });

      describe('but the edit is undone', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.HISTORY_UNDO,
            storyUid: standardMocks.validStoryUid
          });
        });

        it('should indicate the story is fully saved', function() {
          assert.isTrue(store.isStorySaved());
        });

        it('should indicate no save in progress', function() {
          assert.isFalse(store.isStorySaveInProgress());
        });
      });
    });
  });
});
