describe('HistoryStore', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;
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
  var storyState4 = generateStoryData({
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
      }),
      generateBlockData({
        id: 'block4'
      })
    ]
  });

  var firstEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState2.blocks[1]
  };

  var secondEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState3.blocks[2]
  };

  var thirdEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState4.blocks[3]
  };

  beforeEach(function() {
    storyteller.historyStore = new storyteller.HistoryStore(validStoryUid);
    dispatch({ action: Actions.STORY_CREATE, data: storyState1 });
  });

  function dispatch(action) {
    storyteller.dispatcher.dispatch(action);
  }

  describe('history accessors', function() {

    describe('given a newly-created story', function() {

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(window.socrata.storyteller.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(window.socrata.storyteller.historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story and one content change', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(window.socrata.storyteller.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(window.socrata.storyteller.historyStore.canRedo());
        });
      });
    });

    describe('given a newly-created story, two content changes and one undo action', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
        dispatch(secondEditAction);
        dispatch({ action: Actions.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(window.socrata.storyteller.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(window.socrata.storyteller.historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story, two content changes and two undo actions', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
        dispatch(secondEditAction);
        dispatch({ action: Actions.HISTORY_UNDO });
        dispatch({ action: Actions.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(window.socrata.storyteller.historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(window.socrata.storyteller.historyStore.canRedo());
        });
      });
    });
  });

  describe('actions', function() {

    describe('HISTORY_UNDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should cause the story data to revert to the previous version', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story, one content change, an undo action and a different content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should reflect the latest content change and disable redo', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          assert.isTrue(window.socrata.storyteller.historyStore.canRedo());

          dispatch(secondEditAction);

          var storyAfterContentChange = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();
          assert.equal(storyAfterContentChange.blocks.length, storyState2.blocks.length);

          assert.isFalse(window.socrata.storyteller.historyStore.canRedo());
        });
      });

      describe('given 100 content changes', function() {

        beforeEach(function() {
          for (var i = 0; i < 100; i++) {

            var mod = i % 3;

            if (mod === 0) {
              dispatch(firstEditAction);
            } else if (mod === 1) {
              dispatch(secondEditAction);
            } else {
              dispatch(thirdEditAction);
            }
          }
        });

        it('should allow 99 redo actions (but a switch case 1)', function() {

          for (var i = 0; i < 98; i++) {
            dispatch({ action: Actions.HISTORY_UNDO });
            assert.isTrue(window.socrata.storyteller.historyStore.canUndo());
          }

          dispatch({ action: Actions.HISTORY_UNDO });
          assert.isFalse(window.socrata.storyteller.historyStore.canUndo());
        });
      });
    });

    describe('HISTORY_REDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should not modify the story', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });

      describe('given a newly-created story, one content change and one undo action', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should revert the story to the last updated version', function() {

          var storyBeforeUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = window.socrata.storyteller.historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });
    });
  });
});
