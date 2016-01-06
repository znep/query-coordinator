describe('BlockRemovalConfirmationStore', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;

  describe('needsConfirmation', function() {

    describe('for a newly loaded story', function() {
      it('needs confirmation to remove any block', function() {
        assert.isTrue(storyteller.blockRemovalConfirmationStore.needsConfirmation(standardMocks.firstBlockId));
      });
    });

    describe('when a new block has been added', function() {
      var newlyAddedBlockId;

      beforeEach(function() {
        var validInsertionIndex = 0;
        var blockContent = standardMocks.validBlockData1;

        storyteller.dispatcher.dispatch({
          action: Actions.STORY_INSERT_BLOCK,
          blockContent: blockContent,
          insertAt: validInsertionIndex,
          storyUid: standardMocks.validStoryUid
        });

        // id has been generated during the copy, fetch it.
        newlyAddedBlockId = storyteller.storyStore.getStoryBlockIds(
          standardMocks.validStoryUid
        )[validInsertionIndex];
      });

      it('should not ask for confirmation to delete', function() {
        assert.isFalse(storyteller.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
      });

      describe('and then it is edited', function() {

        it('should ask for confirmation to delete', function() {
          storyteller.dispatcher.dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: newlyAddedBlockId,
            componentIndex: 0,
            type: '',
            value: ''
          });

          assert.isTrue(storyteller.blockRemovalConfirmationStore.needsConfirmation(newlyAddedBlockId));
        });
      });

    });
  });
});
