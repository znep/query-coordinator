describe('BlockRemovalConfirmationStore', function() {

  'use strict';

  describe('needsConfirmation', function() {

    describe('for a newly loaded story', function() {
      it('needs confirmation to remove any block', function() {
        assert.isTrue(window.socrata.storyteller.blockRemovalConfirmationStore.needsConfirmation(standardMocks.firstBlockId));
      });
    });

    describe('when a new block has been added', function() {
      var blockToCopyId;
      var newlyAddedBlockId;

      beforeEach(function() {
        var validInsertionIndex = 0;
        var blockContent = standardMocks.validBlockData1;

        window.socrata.storyteller.dispatcher.dispatch({
          action: Actions.STORY_INSERT_BLOCK,
          blockContent: blockContent,
          insertAt: validInsertionIndex,
          storyUid: standardMocks.validStoryUid
        });

        // temp id has been generated during the copy, fetch for asking about the block
        newlyAddedBlockId = window.socrata.storyteller.storyStore.getStoryBlockAtIndex(
            standardMocks.validStoryUid,
            validInsertionIndex
          ).id;
      });

      it('should not ask for confirmation to delete', function() {
        assert.isFalse(window.socrata.storyteller.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
      });

      describe('and then it is edited', function() {

        it('should ask for confirmation to delete', function() {
          window.socrata.storyteller.dispatcher.dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: newlyAddedBlockId,
            componentIndex: 0,
            type: '',
            value: ''
          });

          assert.isTrue(window.socrata.storyteller.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
        });
      });

    });
  });
})
