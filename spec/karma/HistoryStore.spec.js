describe('HistoryStore', function() {

  'use strict';

  var validStoryUid = 'undo-redo';
  var storyState1 = generateStoryData({
    uid: validStoryUid,
    blocks: [
      generateBlockData({
        id: 'block1'
      })
    ]
  });
  var storyState2 = generateStoryData({
    uid: validStoryUid,
    blocks: [
      generateBlockData({
        id: 'block1'
      }),
      generateBlockData({
        id: 'block2'
      })
    ]
  });
  var storyState3 = generateStoryData({
    uid: validStoryUid,
    blocks: [
      generateBlockData({
        id: 'block1'
      }),
      generateBlockData({
        id: 'block2'
      }),
      generateBlockData({
        id: 'block3'
      })
    ]
  });

  function dispatch(action) {
    window.dispatcher.dispatch(action);
  }

  beforeEach(standardMocks);
  afterEach(standardMocks.unmock);

  beforeEach(function() {
    window.userStoryUid = validStoryUid;
    dispatch({ action: Constants.STORY_CREATE, data: storyState1 });
  });

  afterEach(function() {
    delete window.userStoryUid;
  });

  describe('history accessors', function() {

    describe('given a newly-created story', function() {

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(window.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(window.historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story and one content change', function() {

      beforeEach(function() {
        dispatch({
          action: Constants.STORY_OVERWRITE_STATE,
          data: storyState2
        });
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(window.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(window.historyStore.canRedo());
        });
      });
    });

    describe('given a newly-created story, two content changes and one undo action', function() {

      beforeEach(function() {
        dispatch({
          action: Constants.STORY_OVERWRITE_STATE,
          data: storyState2
        });
        dispatch({
          action: Constants.STORY_OVERWRITE_STATE,
          data: storyState3
        });
        dispatch({ action: Constants.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(window.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(window.historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story, two content changes and two undo actions', function() {

      beforeEach(function() {
        dispatch({
          action: Constants.STORY_OVERWRITE_STATE,
          data: storyState2
        });
        dispatch({
          action: Constants.STORY_OVERWRITE_STATE,
          data: storyState3
        });
        dispatch({ action: Constants.HISTORY_UNDO });
        dispatch({ action: Constants.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(window.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(window.historyStore.canRedo());
        });
      });
    });
  });

  describe('actions', function() {

    describe('HISTORY_UNDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Constants.HISTORY_UNDO });

          var storyAfterUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch({
            action: Constants.STORY_OVERWRITE_STATE,
            data: storyState2
          });
        });

        it('should cause the story data to revert to the previous version', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Constants.HISTORY_UNDO });

          var storyAfterUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story, one content change, an undo action and a different content change', function() {

        beforeEach(function() {
          dispatch({
            action: Constants.STORY_OVERWRITE_STATE,
            data: storyState2
          });
        });

        it('should cause reflect the latest content change and disable redo', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Constants.HISTORY_UNDO });

          var storyAfterUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          assert.isTrue(window.historyStore.canRedo());

          dispatch({
            action: Constants.STORY_OVERWRITE_STATE,
            data: storyState3
          });

          var storyAfterContentChange = JSON.parse(window.historyStore.getStateAtCursor());
          assert.equal(storyAfterContentChange.blocks.length, storyState3.blocks.length);

          assert.isFalse(window.historyStore.canRedo());
        });
      });

      describe('given 100 content changes', function() {

        beforeEach(function() {
          for (var i = 0; i < 100; i++) {

            var mod = i % 3;

            if (mod === 0) {
              dispatch({
                action: Constants.STORY_OVERWRITE_STATE,
                data: storyState3
              });
            } else if (mod === 1) {
              dispatch({
                action: Constants.STORY_OVERWRITE_STATE,
                data: storyState2
              });
            } else {
              dispatch({
                action: Constants.STORY_OVERWRITE_STATE,
                data: storyState1
              });
            }
          }
        });

        it('should allow 99 redo actions (but a switch case 1)', function() {

          for (var i = 0; i < 98; i++) {
            dispatch({ action: Constants.HISTORY_UNDO });
            assert.isTrue(window.historyStore.canUndo());
          }

          dispatch({ action: Constants.HISTORY_UNDO });
          assert.isFalse(window.historyStore.canUndo());
        });
      });
    });

    describe('HISTORY_REDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Constants.HISTORY_REDO });

          var storyAfterRedo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterRedo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch({
            action: Constants.STORY_OVERWRITE_STATE,
            data: storyState2
          });
        });

        it('should not modify the story', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Constants.HISTORY_REDO });

          var storyAfterRedo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });

      describe('given a newly-created story, one content change and one undo action', function() {

        beforeEach(function() {
          dispatch({
            action: Constants.STORY_OVERWRITE_STATE,
            data: storyState2
          });
        });

        it('should revert the story to the last updated version', function() {

          var storyBeforeUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Constants.HISTORY_UNDO });

          var storyAfterUndo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Constants.HISTORY_REDO });

          var storyAfterRedo = JSON.parse(window.historyStore.getStateAtCursor());

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });
    });
  });
});
