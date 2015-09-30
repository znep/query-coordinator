(function(storyteller) {
  'use strict';

  /* Responsible for:
   * Tracking which blocks need a confirmation dialog to remove them. Any block
   * that has been saved or edited needs confirmation. Aka: ask unless it is a
   * newly added block that has not been edited.
   *
   * Registers to:
   * - STORY_CREATE
   * - BLOCK_UPDATE_COMPONENT
   *
   * Provides:
   * - needsConfirmation(blockId)   // used in the remove block listener
   */
  function BlockRemovalConfirmationStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _blockNeedsConfirmation = {};

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {
        case Actions.STORY_CREATE:
          storyteller.dispatcher.waitFor([ storyteller.storyStore.getDispatcherToken() ]);

          _.each(
            storyteller.storyStore.getStoryBlockIds(payload.data.uid),
            function(blockId) {
              _blockNeedsConfirmation[blockId] = true;
            }
          );

          self._emitChange();
          break;

        case Actions.BLOCK_UPDATE_COMPONENT:
          _blockNeedsConfirmation[payload.blockId] = true;
          self._emitChange();
          break;
      }
    });

    /*
     * @param   {num}        blockId
     * @return  {boolean}    true if the block needs a confirmation dialog
     */
    this.needsConfirmation = function(blockId) {
      return (_blockNeedsConfirmation[blockId] === true);
    };

  }

  storyteller.BlockRemovalConfirmationStore = BlockRemovalConfirmationStore;
})(window.socrata.storyteller);
