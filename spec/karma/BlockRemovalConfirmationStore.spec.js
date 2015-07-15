describe('BlockRemovalConfirmationStore', function() {
  'use strict';

  describe('needsConfirmation', function() {

    describe('for a newly loaded story', function() {
      it('needs confirmation to remove any block', function() {
        assert.isTrue(window.blockRemovalConfirmationStore.needsConfirmation(standardMocks.firstBlockId));
      });
    });

    describe('when a new block has been added', function() {
      var blockToCopyId;
      var newlyAddedBlockId;

      beforeEach(function() {
        var validInsertionIndex = 0;
        blockToCopyId = standardMocks.firstBlockId;

        window.dispatcher.dispatch({
          action: Constants.BLOCK_COPY_INTO_STORY,
          blockId: blockToCopyId,
          insertAt: validInsertionIndex,
          storyUid: standardMocks.validStoryUid
        });

        // temp id has been generated during the copy, fetch for asking about the block
        newlyAddedBlockId = window.storyStore.getStoryBlockAtIndex(
            standardMocks.validStoryUid,
            validInsertionIndex
          ).id;
      });

      it('should not ask for confirmation to delete', function() {
        assert.isFalse(window.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
      });

      describe('and then it is edited', function() {

        it('should ask for confirmation to delete', function() {
          window.dispatcher.dispatch({
            action: Constants.BLOCK_UPDATE_COMPONENT,
            blockId: newlyAddedBlockId,
            index: 0,
            value: ''
          });

          assert.isTrue(window.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
        });
      });

    });
  });
})
