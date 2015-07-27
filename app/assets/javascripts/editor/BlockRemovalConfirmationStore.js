;(function(storyteller) {
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

    var self = this;
    var _blockNeedsConfirmation = {};

    _.extend(this, new storyteller.Store());

    storyteller.dispatcher.register(function(payload) {
      var action = payload.action;

      switch (action) {
        case Constants.STORY_CREATE:
          payload.data.blocks.forEach(function(block) {
            _blockNeedsConfirmation[block.id] = true;
          });
          self._emitChange();
          break;

        case Constants.BLOCK_UPDATE_COMPONENT:
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

  };

  storyteller.BlockRemovalConfirmationStore = BlockRemovalConfirmationStore;
})(window.socrata.storyteller);
